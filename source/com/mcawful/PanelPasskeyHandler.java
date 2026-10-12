/*
 * Copyright (C) 2016-2026 phantombot.github.io/PhantomBot
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */
package com.mcawful;

import java.math.BigInteger;
import java.nio.charset.StandardCharsets;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;
import org.json.JSONStringer;

import com.gmt2001.datastore2.Datastore2;
import com.gmt2001.httpwsserver.HttpServerPageHandler;
import com.gmt2001.httpwsserver.auth.WsSharedRWTokenAuthenticationHandler;
import com.gmt2001.security.Digest;
import com.mcawful.PanelPasskeyTable.PasskeyRecord;

import io.netty.channel.ChannelHandlerContext;
import io.netty.handler.codec.http.FullHttpRequest;
import io.netty.handler.codec.http.FullHttpResponse;
import io.netty.handler.codec.http.HttpHeaderNames;
import io.netty.handler.codec.http.HttpMethod;
import io.netty.handler.codec.http.HttpResponseStatus;
import io.netty.handler.codec.http.QueryStringDecoder;
import io.netty.util.AttributeKey;
import tv.phantombot.CaselessProperties;
import tv.phantombot.panel.PanelUser.PanelUser;
import tv.phantombot.panel.PanelUser.PanelUserHandler;

/**
 * Passkey registration, management and sign-in for {@link PanelUser panel users}.
 *
 * <p>Registration and management run over the authenticated panel websocket, so a user can
 * only ever touch their own passkeys. Sign-in runs over HTTP so the bot can set the session
 * cookie of {@link PanelSessionManager}.</p>
 *
 * @author mcawful
 */
public final class PanelPasskeyHandler {

    /**
     * The most passkeys a single panel user can register
     */
    private static final int MAX_PASSKEYS = 20;
    /**
     * The longest name a passkey can be given
     */
    private static final int MAX_NAME_LENGTH = 64;
    /**
     * The path the sign-in requests are served from
     */
    private static final String HTTP_PATH = "/panel/login/passkey/";
    /**
     * How long a session lasts when the user does not ask to be remembered, in milliseconds
     */
    private static final long SESSION_LIFETIME_MILLIS = 86400000L;
    /**
     * How long a session lasts at most, in milliseconds
     */
    private static final long SESSION_LIFETIME_FOREVER_MILLIS = 30L * 86400000L;
    /**
     * The challenge of the registration that is in progress on a websocket
     */
    private static final AttributeKey<String> ATTR_CHALLENGE = AttributeKey.valueOf("passkeyChallenge");

    /**
     * Utility class (not instantiable).
     */
    private PanelPasskeyHandler() {
    }

    /**
     * Handles a {@code passkey} query on the panel websocket
     *
     * @param ctx the {@link ChannelHandlerContext} of the websocket
     * @param user the authenticated {@link PanelUser}
     * @param request the {@code passkey} object of the query, which must have an {@code action}
     * @param response the {@link JSONStringer} to write the single result value to
     */
    public static void handleWs(ChannelHandlerContext ctx, PanelUser user, JSONObject request, JSONStringer response) {
        JSONObject result = new JSONObject();
        String action = request.optString("action");

        try {
            if (!canUsePasskeys(user)) {
                throw new IllegalArgumentException("Passkeys are not available for this login");
            }

            if (action.equals("options")) {
                result = createRegistrationOptions(ctx, user);
            } else if (action.equals("register")) {
                register(ctx, user, request);
                result.put("success", "Passkey added");
            } else if (action.equals("list")) {
                result.put("passkeys", listPasskeys(user));
            } else if (action.equals("delete")) {
                deletePasskey(user, request.optString("id"));
                result.put("success", "Passkey removed");
            } else {
                result.put("error", "Unknown passkey action");
            }
        } catch (IllegalArgumentException ex) {
            result = new JSONObject().put("error", ex.getMessage());
        }

        response.value(result);
    }

    /**
     * Handles a request to {@code /panel/login/passkey/}, which the login page uses to sign in
     * with a passkey. These requests are not authenticated
     *
     * @param ctx the {@link ChannelHandlerContext} of the request
     * @param req the {@link FullHttpRequest}
     */
    public static void handleHttp(ChannelHandlerContext ctx, FullHttpRequest req) {
        String path = new QueryStringDecoder(req.uri()).path();
        FullHttpResponse res;

        if (path.equals(HTTP_PATH + "session") && req.method().equals(HttpMethod.GET)) {
            PanelSessionManager.Session session = PanelSessionManager.getSession(req.headers());
            PanelUser user = session == null ? null : session.getUser();
            JSONObject result = new JSONObject().put("authenticated", user != null);

            if (user != null) {
                result.put("username", user.getUsername());
            }

            res = HttpServerPageHandler.prepareHttpResponse(HttpResponseStatus.OK, result.toString(), "json");
        } else if (!req.method().equals(HttpMethod.POST)) {
            res = HttpServerPageHandler.prepareHttpResponse(HttpResponseStatus.METHOD_NOT_ALLOWED);
        } else if (path.equals(HTTP_PATH + "options")) {
            res = HttpServerPageHandler.prepareHttpResponse(HttpResponseStatus.OK, new JSONObject()
                    .put("challenge", PasskeyVerifier.createChallenge())
                    .put("timeout", PasskeyVerifier.CHALLENGE_TTL_MILLIS)
                    .put("userVerification", "required").toString(), "json");
        } else if (path.equals(HTTP_PATH + "verify")) {
            res = login(req);
        } else if (path.equals(HTTP_PATH + "logout")) {
            res = HttpServerPageHandler.prepareHttpResponse(HttpResponseStatus.NO_CONTENT);

            if (PanelSessionManager.revokeSession(req.headers())) {
                res.headers().add(HttpHeaderNames.SET_COOKIE, PanelSessionManager.COOKIE + "=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0");
            }
        } else {
            res = HttpServerPageHandler.prepareHttpResponse(HttpResponseStatus.NOT_FOUND);
        }

        com.gmt2001.Console.debug.println(res.status().code() + " " + req.method().asciiName() + ": " + path);
        HttpServerPageHandler.sendHttpResponse(ctx, req, res);
    }

    /**
     * Removes all passkeys of a panel user and ends their sessions. Must be called when the
     * user is deleted, so a later user with the same name does not inherit them, and when
     * their password is reset, so nobody who had access keeps it
     *
     * @param username the user's name
     */
    public static void deletePasskeys(String username) {
        Datastore2.instance().dslContext().deleteFrom(PanelPasskeyTable.instance())
                .where(PanelPasskeyTable.instance().USERNAME.equalIgnoreCase(username)).execute();
        PanelSessionManager.revokeUser(username);
    }

    /**
     * Moves all passkeys of a panel user to a new username and ends their sessions. Must be
     * called when the user is renamed
     *
     * @param username the user's current name
     * @param newUsername the user's new name
     */
    public static void renamePasskeys(String username, String newUsername) {
        Datastore2.instance().dslContext().update(PanelPasskeyTable.instance())
                .set(PanelPasskeyTable.instance().USERNAME, newUsername)
                .where(PanelPasskeyTable.instance().USERNAME.equalIgnoreCase(username)).execute();
        PanelSessionManager.revokeUser(username);
    }

    /**
     * Verifies the response to {@code navigator.credentials.get()} and starts a session
     *
     * @param req the {@link FullHttpRequest}, with a JSON body of {@code id}, {@code clientDataJSON},
     *            {@code authenticatorData}, {@code signature} (all base64url encoded) and {@code remember}
     * @return the response; every failure gets the same {@code 401} so nothing is revealed about why
     */
    private static FullHttpResponse login(FullHttpRequest req) {
        try {
            String contentType = req.headers().get(HttpHeaderNames.CONTENT_TYPE);

            // Browsers can not send JSON across sites without the bot's permission
            if (contentType == null || !contentType.startsWith("application/json")) {
                throw new IllegalArgumentException("Wrong content type");
            }

            JSONObject request = new JSONObject(req.content().toString(StandardCharsets.UTF_8));
            byte[] credentialId = PasskeyVerifier.decode(request.optString("id"), PasskeyVerifier.MAX_CREDENTIAL_ID);
            PasskeyRecord passkey = Datastore2.instance().dslContext().fetchOne(PanelPasskeyTable.instance(),
                    PanelPasskeyTable.instance().IDHASH.eq(hashCredentialId(credentialId)));

            if (passkey == null || !passkey.credentialId().equals(PasskeyVerifier.encode(credentialId))) {
                throw new IllegalArgumentException("Unknown passkey");
            }

            PanelUser user = PanelUser.LookupByUsername(passkey.username());

            if (user == null || !user.isEnabled() || !canUsePasskeys(user)) {
                throw new IllegalArgumentException("User does not exist, is disabled, or can not use passkeys");
            }

            if (!passkey.origin().equals(req.headers().get(HttpHeaderNames.ORIGIN))) {
                throw new IllegalArgumentException("Request did not come from the origin of the passkey");
            }

            long signCount = PasskeyVerifier.verifyAssertion(
                    PasskeyVerifier.decode(request.optString("clientDataJSON"), PasskeyVerifier.MAX_CLIENT_DATA),
                    PasskeyVerifier.decode(request.optString("authenticatorData"), PasskeyVerifier.MAX_AUTH_DATA),
                    PasskeyVerifier.decode(request.optString("signature"), PasskeyVerifier.MAX_KEY),
                    PasskeyVerifier.decode(passkey.publicKey(), PasskeyVerifier.MAX_KEY), passkey.origin(), passkey.signCount());

            if (signCount != passkey.signCount()) {
                passkey.value6(signCount);
                passkey.update();
            }

            PanelUserHandler.recordLogin(user);

            String remember = request.optString("remember");
            long lifetime = SESSION_LIFETIME_MILLIS;
            String cookie = PanelSessionManager.COOKIE + "=";

            if (remember.equals("forever")) {
                lifetime = SESSION_LIFETIME_FOREVER_MILLIS;
            } else if (remember.matches("[0-9]{1,3}")) {
                lifetime = Math.min(Integer.parseInt(remember) * 3600000L, SESSION_LIFETIME_FOREVER_MILLIS);
            }

            cookie += PanelSessionManager.createSession(user.getUsername(), passkey.origin(), passkey.idHash(), lifetime)
                    + "; Path=/; HttpOnly; SameSite=Lax";

            if (passkey.origin().startsWith("https:")) {
                cookie += "; Secure";
            }

            // "Until I close the tab/browser" becomes a cookie that the browser drops by itself
            if (!remember.equals("tab") && !remember.equals("session")) {
                cookie += "; Max-Age=" + (lifetime / 1000L);
            }

            FullHttpResponse res = HttpServerPageHandler.prepareHttpResponse(HttpResponseStatus.OK,
                    new JSONObject().put("username", user.getUsername()).toString(), "json");
            res.headers().add(HttpHeaderNames.SET_COOKIE, cookie);
            return res;
        } catch (IllegalArgumentException | JSONException ex) {
            com.gmt2001.Console.debug.println("Passkey sign-in failed: " + ex.getMessage());
            return HttpServerPageHandler.prepareHttpResponse(HttpResponseStatus.UNAUTHORIZED,
                    new JSONObject().put("error", "Passkey sign-in failed").toString(), "json");
        }
    }

    /**
     * Starts a registration and builds the options for {@code navigator.credentials.create()}
     *
     * @param ctx the {@link ChannelHandlerContext} of the websocket
     * @param user the authenticated {@link PanelUser}
     * @return the options; binary values are base64url encoded
     */
    private static JSONObject createRegistrationOptions(ChannelHandlerContext ctx, PanelUser user) {
        String challenge = PasskeyVerifier.createChallenge();
        // The origin is part of the user handle, because a device keeps one passkey per host and user handle and
        // would otherwise replace the passkey of another bot on the same host which has a user with the same name
        String userHandle = ctx.channel().attr(WsSharedRWTokenAuthenticationHandler.ATTR_ORIGIN).get() + "/" + user.getUsername().toLowerCase();
        JSONArray excludeCredentials = new JSONArray();

        for (PasskeyRecord passkey : Datastore2.instance().dslContext().fetch(PanelPasskeyTable.instance(),
                PanelPasskeyTable.instance().USERNAME.equalIgnoreCase(user.getUsername()))) {
            excludeCredentials.put(new JSONObject().put("type", "public-key").put("id", passkey.credentialId()));
        }

        ctx.channel().attr(ATTR_CHALLENGE).set(challenge);

        return new JSONObject()
                .put("challenge", challenge)
                .put("rp", new JSONObject().put("name", "PhantomBot"))
                .put("user", new JSONObject()
                        .put("id", PasskeyVerifier.encode(Digest.sha256(userHandle.getBytes(StandardCharsets.UTF_8))))
                        .put("name", user.getUsername())
                        .put("displayName", user.getUsername()))
                .put("pubKeyCredParams", new JSONArray()
                        .put(new JSONObject().put("type", "public-key").put("alg", -7))
                        .put(new JSONObject().put("type", "public-key").put("alg", -257)))
                .put("excludeCredentials", excludeCredentials)
                .put("authenticatorSelection", new JSONObject().put("residentKey", "required").put("userVerification", "required"))
                .put("attestation", "none")
                .put("timeout", PasskeyVerifier.CHALLENGE_TTL_MILLIS);
    }

    /**
     * Verifies the response to {@code navigator.credentials.create()} and stores the passkey
     *
     * @param ctx the {@link ChannelHandlerContext} of the websocket
     * @param user the authenticated {@link PanelUser}
     * @param request the query, with {@code id}, {@code clientDataJSON}, {@code authenticatorData},
     *                {@code publicKey} (all base64url encoded) and an optional {@code name}
     * @throws IllegalArgumentException if the registration is not valid
     */
    private static void register(ChannelHandlerContext ctx, PanelUser user, JSONObject request) {
        String challenge = ctx.channel().attr(ATTR_CHALLENGE).getAndSet(null);

        if (challenge == null) {
            throw new IllegalArgumentException("No passkey registration is in progress");
        }

        // The passkey is tied to the origin of the page that owns this websocket
        String origin = ctx.channel().attr(WsSharedRWTokenAuthenticationHandler.ATTR_ORIGIN).get();
        byte[] credentialId = PasskeyVerifier.decode(request.optString("id"), PasskeyVerifier.MAX_CREDENTIAL_ID);
        byte[] publicKey = PasskeyVerifier.decode(request.optString("publicKey"), PasskeyVerifier.MAX_KEY);
        long signCount = PasskeyVerifier.verifyRegistration(
                PasskeyVerifier.decode(request.optString("clientDataJSON"), PasskeyVerifier.MAX_CLIENT_DATA),
                PasskeyVerifier.decode(request.optString("authenticatorData"), PasskeyVerifier.MAX_AUTH_DATA),
                publicKey, credentialId, challenge, origin);
        String idHash = hashCredentialId(credentialId);
        String name = request.optString("name").trim();

        if (Datastore2.instance().dslContext().fetchExists(PanelPasskeyTable.instance(), PanelPasskeyTable.instance().IDHASH.eq(idHash))) {
            throw new IllegalArgumentException("This passkey is already registered");
        }

        if (Datastore2.instance().dslContext().fetchCount(PanelPasskeyTable.instance(),
                PanelPasskeyTable.instance().USERNAME.equalIgnoreCase(user.getUsername())) >= MAX_PASSKEYS) {
            throw new IllegalArgumentException("You can not register more than " + MAX_PASSKEYS + " passkeys");
        }

        if (name.isEmpty()) {
            name = "Passkey";
        } else if (name.length() > MAX_NAME_LENGTH) {
            name = name.substring(0, MAX_NAME_LENGTH);
        }

        PasskeyRecord passkey = new PasskeyRecord();
        passkey.values(idHash, PasskeyVerifier.encode(credentialId), user.getUsername(), PasskeyVerifier.encode(publicKey), origin, signCount,
                name, System.currentTimeMillis());
        passkey.insert();
    }

    /**
     * Lists the passkeys of a panel user
     *
     * @param user the authenticated {@link PanelUser}
     * @return an array of objects with {@code id}, {@code name}, {@code origin} and {@code creationDate}
     */
    private static JSONArray listPasskeys(PanelUser user) {
        JSONArray passkeys = new JSONArray();

        for (PasskeyRecord passkey : Datastore2.instance().dslContext().fetch(PanelPasskeyTable.instance(),
                PanelPasskeyTable.instance().USERNAME.equalIgnoreCase(user.getUsername()))) {
            passkeys.put(new JSONObject().put("id", passkey.idHash()).put("name", passkey.name()).put("origin", passkey.origin())
                    .put("creationDate", passkey.creationDate()));
        }

        return passkeys;
    }

    /**
     * Removes one passkey of a panel user
     *
     * @param user the authenticated {@link PanelUser}
     * @param idHash the {@code id} of the passkey, as returned by the {@code list} action
     * @throws IllegalArgumentException if the user has no such passkey
     */
    private static void deletePasskey(PanelUser user, String idHash) {
        if (Datastore2.instance().dslContext().deleteFrom(PanelPasskeyTable.instance())
                .where(PanelPasskeyTable.instance().IDHASH.eq(idHash))
                .and(PanelPasskeyTable.instance().USERNAME.equalIgnoreCase(user.getUsername())).execute() == 0) {
            throw new IllegalArgumentException("Passkey not found");
        }

        PanelSessionManager.revokePasskey(idHash);
    }

    /**
     * Checks if a panel user can use passkeys. Of the logins from botlogin.txt only the main one can, because the
     * websocket tokens of the others are handed out without a password and would let anyone register a passkey
     *
     * @param user the {@link PanelUser}
     * @return {@code true} if the user can register passkeys and sign in with them
     */
    private static boolean canUsePasskeys(PanelUser user) {
        return !user.isConfigUser() || user.getUsername().equalsIgnoreCase(CaselessProperties.instance().getProperty("paneluser", "panel"));
    }

    /**
     * Calculates the primary key of a passkey
     *
     * @param credentialId the credential ID
     * @return SHA-256 of the credential ID as a hex-encoded string
     */
    private static String hashCredentialId(byte[] credentialId) {
        return String.format("%064x", new BigInteger(1, Digest.sha256(credentialId)));
    }
}
