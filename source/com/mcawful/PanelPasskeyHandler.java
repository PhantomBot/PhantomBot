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
import com.mcawful.PanelPasskeySetupTable.SetupLinkRecord;
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
import tv.phantombot.panel.PanelUser.PanelUserHandler.PanelMessage;
import tv.phantombot.panel.PanelUser.PanelUserTable;

/**
 * Passkey registration, management and sign-in for {@link PanelUser panel users}.
 *
 * <p>Registration and management run over the authenticated panel websocket, so a user can
 * only ever touch their own passkeys. The exception is a setup link, made by someone who can
 * manage panel users or in the console, which adds a passkey over HTTP. Sign-in runs over HTTP
 * so the bot can set the session cookie of {@link PanelSessionManager}.</p>
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
     * The longest origin that fits the column it is stored in
     */
    private static final int MAX_ORIGIN_LENGTH = 255;
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
     * How long a setup link works, in milliseconds
     */
    private static final long SETUP_LINK_LIFETIME_MILLIS = 86400000L;
    /**
     * Makes each change to passkeys and setup links one step, so a link adds only one passkey, a user who signs in
     * with passkeys only keeps their last one, and a reset, delete or rename leaves no passkey of a link behind
     */
    private static final Object PASSKEY_LOCK = new Object();

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
            PanelUser current = PanelUser.LookupByUsername(user.getUsername());

            // A connection stays open, with the user it loaded when it was opened, after that user is disabled or
            // their password is reset. Whoever holds it could otherwise register a passkey and keep their access,
            // so a token alone is not enough, and neither is a login that is no longer the stored one
            if (!canUsePasskeys(user) || !Boolean.TRUE.equals(ctx.channel().attr(WsSharedRWTokenAuthenticationHandler.ATTR_HANDSHAKE_AUTH).get())
                    || current == null || !current.isEnabled() || !current.getPassword().equals(user.getPassword())) {
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
            } else if (action.equals("passwordOff")) {
                // A passkey session shows the user can sign in with a passkey on this address, so nobody locks
                // themselves out, and a connection opened with the password can not do this
                PanelSessionManager.Session session = ctx.channel().attr(WsSharedRWTokenAuthenticationHandler.ATTR_SESSION).get();

                synchronized (PASSKEY_LOCK) {
                    if (session == null || !session.isValid()) {
                        throw new IllegalArgumentException("Sign in with a passkey before you turn off your password");
                    }

                    result = toResult(PanelUserHandler.removePassword(current));
                }
            } else if (action.equals("setPassword")) {
                result = toResult(PanelUserHandler.setPassword(current, request.optString("password")));
            } else if (action.equals("setupLink")) {
                PanelUser target = PanelUser.LookupByUsername(request.optString("username"));

                if (!user.canManageUsers()) {
                    throw new IllegalArgumentException(PanelMessage.CanNotManageError.getMessage());
                }

                // The main login from botlogin.txt adds its passkeys itself, or gets a link from the console
                if (target == null || !target.canBeEdited()) {
                    throw new IllegalArgumentException(PanelMessage.UserNotFound.getMessage());
                }

                result.put("token", createSetupLink(target.getUsername()));
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
     * with a passkey or add one with a setup link. These requests are not authenticated
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
        } else if (path.equals(HTTP_PATH + "setup/options")) {
            res = setupOptions(req);
        } else if (path.equals(HTTP_PATH + "setup/verify")) {
            res = setup(req);
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
     * Removes all passkeys and setup links of a panel user and ends their sessions. Must be
     * called when the user is deleted, so a later user with the same name does not inherit
     * them, and when their password is reset, so nobody who had access keeps it
     *
     * @param username the user's name
     */
    public static void deletePasskeys(String username) {
        synchronized (PASSKEY_LOCK) {
            Datastore2.instance().dslContext().deleteFrom(PanelPasskeyTable.instance())
                    .where(PanelPasskeyTable.instance().USERNAME.equalIgnoreCase(username)).execute();
            deleteSetupLinks(username);
            PanelSessionManager.revokeUser(username);
        }
    }

    /**
     * Moves all passkeys of a panel user to a new username and ends their sessions. Must be
     * called when the user is renamed. Passkeys and setup links that were left under the new
     * name are removed first, so the user does not inherit them, and the user's setup links
     * stop working
     *
     * @param username the user's current name
     * @param newUsername the user's new name
     */
    public static void renamePasskeys(String username, String newUsername) {
        synchronized (PASSKEY_LOCK) {
            deletePasskeys(newUsername);
            Datastore2.instance().dslContext().update(PanelPasskeyTable.instance())
                    .set(PanelPasskeyTable.instance().USERNAME, newUsername)
                    .where(PanelPasskeyTable.instance().USERNAME.equalIgnoreCase(username)).execute();
            deleteSetupLinks(username);
            PanelSessionManager.revokeUser(username);
        }
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
            JSONObject request = readJson(req);
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
            return startSession(user, passkey.origin(), passkey.idHash(), request.optString("remember"));
        } catch (IllegalArgumentException | JSONException ex) {
            com.gmt2001.Console.debug.println("Passkey sign-in failed: " + ex.getMessage());
            return HttpServerPageHandler.prepareHttpResponse(HttpResponseStatus.UNAUTHORIZED,
                    new JSONObject().put("error", "Passkey sign-in failed").toString(), "json");
        }
    }

    /**
     * Reads the JSON body of a request from the login page
     *
     * @param req the {@link FullHttpRequest}
     * @return the body
     * @throws IllegalArgumentException if the request is not JSON
     */
    private static JSONObject readJson(FullHttpRequest req) {
        String contentType = req.headers().get(HttpHeaderNames.CONTENT_TYPE);

        // Browsers can not send JSON across sites without the bot's permission
        if (contentType == null || !contentType.startsWith("application/json")) {
            throw new IllegalArgumentException("Wrong content type");
        }

        return new JSONObject(req.content().toString(StandardCharsets.UTF_8));
    }

    /**
     * Starts a session after a passkey has proven who the user is
     *
     * @param user the {@link PanelUser}
     * @param origin the origin of the passkey
     * @param idHash the {@code id} of the passkey
     * @param remember how long the user asked to stay signed in, as chosen on the login page
     * @return the response, which sets the session cookie
     */
    private static FullHttpResponse startSession(PanelUser user, String origin, String idHash, String remember) {
        long lifetime = SESSION_LIFETIME_MILLIS;
        String cookie = PanelSessionManager.COOKIE + "=";

        if (remember.equals("forever")) {
            lifetime = SESSION_LIFETIME_FOREVER_MILLIS;
        } else if (remember.matches("[0-9]{1,3}")) {
            lifetime = Math.min(Integer.parseInt(remember) * 3600000L, SESSION_LIFETIME_FOREVER_MILLIS);
        }

        cookie += PanelSessionManager.createSession(user.getUsername(), origin, idHash, lifetime)
                + "; Path=/; HttpOnly; SameSite=Lax";

        if (origin.startsWith("https:")) {
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
        JSONObject options = getRegistrationOptions(ctx.channel().attr(WsSharedRWTokenAuthenticationHandler.ATTR_ORIGIN).get(), user, challenge);

        ctx.channel().attr(ATTR_CHALLENGE).set(challenge);
        return options;
    }

    /**
     * Builds the options for {@code navigator.credentials.create()}
     *
     * @param origin the origin of the page that registers the passkey
     * @param user the {@link PanelUser} who gets the passkey
     * @param challenge the challenge, as returned by {@link PasskeyVerifier#createChallenge()}
     * @return the options; binary values are base64url encoded
     */
    private static JSONObject getRegistrationOptions(String origin, PanelUser user, String challenge) {
        // Refused here, before the device creates a passkey that could not be stored
        if (origin != null && origin.length() > MAX_ORIGIN_LENGTH) {
            throw new IllegalArgumentException("The address of this panel is too long to be used with passkeys");
        }

        // The origin is part of the user handle, because a device keeps one passkey per host and user handle and
        // would otherwise replace the passkey of another bot on the same host which has a user with the same name
        String userHandle = origin + "/" + user.getUsername().toLowerCase();
        JSONArray excludeCredentials = new JSONArray();

        for (PasskeyRecord passkey : Datastore2.instance().dslContext().fetch(PanelPasskeyTable.instance(),
                PanelPasskeyTable.instance().USERNAME.equalIgnoreCase(user.getUsername()))) {
            excludeCredentials.put(new JSONObject().put("type", "public-key").put("id", passkey.credentialId()));
        }

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
        storePasskey(user, request, challenge, ctx.channel().attr(WsSharedRWTokenAuthenticationHandler.ATTR_ORIGIN).get());
    }

    /**
     * Verifies the response to {@code navigator.credentials.create()} and stores the passkey
     *
     * @param user the {@link PanelUser} who gets the passkey
     * @param request the response, with {@code id}, {@code clientDataJSON}, {@code authenticatorData},
     *                {@code publicKey} (all base64url encoded) and an optional {@code name}
     * @param challenge the challenge that was issued for this registration
     * @param origin the origin of the page that registered the passkey
     * @return the {@code id} of the new passkey
     * @throws IllegalArgumentException if the registration is not valid
     */
    private static String storePasskey(PanelUser user, JSONObject request, String challenge, String origin) {
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
        return idHash;
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
        synchronized (PASSKEY_LOCK) {
            if (user.isPasswordless() && Datastore2.instance().dslContext().fetchCount(PanelPasskeyTable.instance(),
                    PanelPasskeyTable.instance().USERNAME.equalIgnoreCase(user.getUsername())) <= 1) {
                throw new IllegalArgumentException("You sign in with passkeys only. Set a password before you remove your last passkey");
            }

            if (Datastore2.instance().dslContext().deleteFrom(PanelPasskeyTable.instance())
                    .where(PanelPasskeyTable.instance().IDHASH.eq(idHash))
                    .and(PanelPasskeyTable.instance().USERNAME.equalIgnoreCase(user.getUsername())).execute() == 0) {
                throw new IllegalArgumentException("Passkey not found");
            }

            PanelSessionManager.revokePasskey(idHash);
        }
    }

    /**
     * Turns a {@link PanelMessage} into the result of a {@code passkey} query
     *
     * @param message the message
     * @return an object with {@code success} or {@code error}
     */
    private static JSONObject toResult(PanelMessage message) {
        return new JSONObject().put(message.getJSONkey(), message.getMessage());
    }

    /**
     * Creates a one-time link that lets a panel user add a passkey without signing in, replacing
     * any earlier link of the user. The link works for {@link #SETUP_LINK_LIFETIME_MILLIS}
     *
     * @param username the user's name
     * @return the token of the link, which goes after {@code /panel/login/#setup=}
     * @throws IllegalArgumentException if the user does not exist or can not use passkeys
     */
    public static String createSetupLink(String username) {
        PanelUser user = PanelUser.LookupByUsername(username);

        if (user == null) {
            throw new IllegalArgumentException(PanelMessage.UserNotFound.getMessage());
        }

        if (!canUsePasskeys(user)) {
            throw new IllegalArgumentException("Passkeys are not available for this login");
        }

        String token = PasskeyVerifier.encode(PasskeyVerifier.randomBytes(30));
        long expires = System.currentTimeMillis() + SETUP_LINK_LIFETIME_MILLIS;
        SetupLinkRecord link = new SetupLinkRecord();

        synchronized (PASSKEY_LOCK) {
            deleteSetupLinks(user.getUsername());
            link.values(Digest.sha256(token), user.getUsername(), expires);
            link.insert();
        }

        return token;
    }

    /**
     * Prints a setup link in the console. The console does not know the address the panel is
     * opened on, so the link uses localhost and the bot's port
     *
     * @param token the token of the link
     */
    public static void printSetupLink(String token) {
        String address = (CaselessProperties.instance().getPropertyAsBoolean("usehttps", true) ? "https" : "http") + "://localhost:"
                + CaselessProperties.instance().getPropertyAsInt("baseport", 25000);

        com.gmt2001.Console.out.println(address + "/panel/login/#setup=" + token);
        com.gmt2001.Console.out.println("If the panel is opened on another address, put that address in place of " + address);
    }

    /**
     * Removes the setup links of a panel user, along with every link that has expired
     *
     * @param username the user's name
     */
    private static void deleteSetupLinks(String username) {
        Datastore2.instance().dslContext().deleteFrom(PanelPasskeySetupTable.instance())
                .where(PanelPasskeySetupTable.instance().USERNAME.equalIgnoreCase(username))
                .or(PanelPasskeySetupTable.instance().EXPIRES.lt(System.currentTimeMillis())).execute();
    }

    /**
     * Finds the panel user a setup link was made for
     *
     * @param token the token of the link
     * @param origin the {@code Origin} of the request, which the passkey is tied to
     * @return the {@link PanelUser}
     * @throws IllegalArgumentException if the link does not work, or the request has no {@code Origin}
     */
    private static PanelUser getSetupLinkUser(String token, String origin) {
        if (origin == null) {
            throw new IllegalArgumentException("Missing Origin");
        }

        SetupLinkRecord link = Datastore2.instance().dslContext().fetchOne(PanelPasskeySetupTable.instance(),
                PanelPasskeySetupTable.instance().TOKENHASH.eq(Digest.sha256(token)));
        PanelUser user = link == null ? null : PanelUser.LookupByUsername(link.username());

        if (link == null || link.expires() < System.currentTimeMillis() || user == null || !canUsePasskeys(user)) {
            throw new IllegalArgumentException("This setup link has expired or was already used. Ask for a new one");
        }

        if (!user.isEnabled()) {
            throw new IllegalArgumentException("This panel user is disabled. Ask an admin to enable it, then open the link again");
        }

        return user;
    }

    /**
     * Answers a setup link request that failed
     *
     * @param ex the reason
     * @return {@code 400} with an {@code error}
     */
    private static FullHttpResponse setupError(Exception ex) {
        com.gmt2001.Console.debug.println("Passkey setup failed: " + ex.getMessage());
        return HttpServerPageHandler.prepareHttpResponse(HttpResponseStatus.BAD_REQUEST,
                new JSONObject().put("error", ex instanceof JSONException ? "Bad request" : ex.getMessage()).toString(), "json");
    }

    /**
     * Starts adding a passkey from a setup link
     *
     * @param req the {@link FullHttpRequest}, with a JSON body of {@code token}
     * @return the options for {@code navigator.credentials.create()}, or {@code 400} with an {@code error}
     */
    private static FullHttpResponse setupOptions(FullHttpRequest req) {
        try {
            String origin = req.headers().get(HttpHeaderNames.ORIGIN);
            PanelUser user = getSetupLinkUser(readJson(req).optString("token"), origin);

            return HttpServerPageHandler.prepareHttpResponse(HttpResponseStatus.OK,
                    getRegistrationOptions(origin, user, PasskeyVerifier.createChallenge()).toString(), "json");
        } catch (IllegalArgumentException | JSONException ex) {
            return setupError(ex);
        }
    }

    /**
     * Adds the passkey of a setup link, uses up the link and starts a session. A user who never
     * replaced their temporary password loses it, since they were given the link instead
     *
     * @param req the {@link FullHttpRequest}, with a JSON body of {@code token}, the response to
     *            {@code navigator.credentials.create()}, an optional {@code name} and {@code remember}
     * @return the response, which sets the session cookie, or {@code 400} with an {@code error}
     */
    private static FullHttpResponse setup(FullHttpRequest req) {
        try {
            JSONObject request = readJson(req);
            String origin = req.headers().get(HttpHeaderNames.ORIGIN);
            String idHash;
            PanelUser user;

            synchronized (PASSKEY_LOCK) {
                user = getSetupLinkUser(request.optString("token"), origin);
                // Any challenge the bot handed out recently will do, because the link works only once
                String challenge = new JSONObject(new String(PasskeyVerifier.decode(request.optString("clientDataJSON"), PasskeyVerifier.MAX_CLIENT_DATA),
                        StandardCharsets.UTF_8)).optString("challenge");
                idHash = storePasskey(user, request, challenge, origin);
                // A user has one link at a time, so this uses it up
                deleteSetupLinks(user.getUsername());
            }

            if (!user.hasSetPassword()) {
                PanelUserHandler.removePassword(user);
            }

            PanelUserHandler.recordLogin(user);
            return startSession(user, origin, idHash, request.optString("remember"));
        } catch (IllegalArgumentException | JSONException ex) {
            return setupError(ex);
        }
    }

    /**
     * Checks if a panel user can use passkeys. Of the logins from botlogin.txt only the main one can, because the
     * websocket tokens of the others are handed out without a password and would let anyone register a passkey.
     * The main one can not either while a database user has the same name, because passkeys are stored by
     * username and a passkey of that user would otherwise sign in as the main login
     *
     * @param user the {@link PanelUser}
     * @return {@code true} if the user can register passkeys and sign in with them
     */
    private static boolean canUsePasskeys(PanelUser user) {
        if (!user.isConfigUser()) {
            return true;
        }

        return user.getUsername().equalsIgnoreCase(CaselessProperties.instance().getProperty("paneluser", "panel"))
                && !Datastore2.instance().dslContext().fetchExists(PanelUserTable.instance(),
                        PanelUserTable.instance().USERNAME.equalIgnoreCase(user.getUsername()));
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
