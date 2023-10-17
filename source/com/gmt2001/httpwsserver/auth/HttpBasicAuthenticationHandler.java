/*
 * Copyright (C) 2016-2023 phantombot.github.io/PhantomBot
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
package com.gmt2001.httpwsserver.auth;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.Map;

import com.gmt2001.httpwsserver.HttpServerPageHandler;
import com.gmt2001.security.Digest;

import io.netty.channel.ChannelHandlerContext;
import io.netty.handler.codec.http.FullHttpRequest;
import io.netty.handler.codec.http.FullHttpResponse;
import io.netty.handler.codec.http.HttpHeaderNames;
import io.netty.handler.codec.http.HttpHeaders;
import io.netty.handler.codec.http.HttpResponseStatus;
import io.netty.handler.codec.http.QueryStringDecoder;
import tv.phantombot.panel.PanelUser.PanelUser;
import tv.phantombot.panel.PanelUser.PanelUserHandler;

/**
 * Provides a {@link HttpAuthenticationHandler} that implements HTTP Basic
 * authentication, as well as allowing the same format to be provided in a
 * cookie
 *
 * @author gmt2001
 */
public final class HttpBasicAuthenticationHandler implements HttpAuthenticationHandler, PanelUserAuthenticationHandler {

    /**
     * The realm to present to the user
     */
    private final String realm;
    /**
     * The username required for valid authentication
     */
    private final String user;
    /**
     * The password required for valid authentication
     */
    private final String pass;
    /**
     * Whether this instance is allow to authenticate headers against
     * {@link PanelUser}
     */
    private final boolean allowPaneluser;
    /**
     * If set, failed authentication redirects to this URI with 303 See Other
     * instead of outputting 401 Unauthorized
     */
    private final String loginUri;

    /**
     * Constructor
     *
     * @param realm    The realm to present to the user
     * @param user     The username required for valid authentication
     * @param pass     The password required for valid authentication
     * @param loginUri The login page URI
     * @throws IllegalArgumentException If {@code realm} contains any double quotes
     *                                  or {@code user} contains any colons
     */
    public HttpBasicAuthenticationHandler(String realm, String user, String pass, String loginUri) {
        this(realm, user, pass, loginUri, false);
    }

    /**
     * Constructor
     *
     * @param realm          The realm to present to the user
     * @param user           The username required for valid authentication
     * @param pass           The password required for valid authentication
     * @param loginUri       The login page URI
     * @param allowPanelUser Whether this instance is allow to authenticate headers
     *                       against {@link PanelUser}
     * @throws IllegalArgumentException If {@code realm} contains any double quotes
     *                                  or {@code user} contains any colons
     */
    public HttpBasicAuthenticationHandler(String realm, String user, String pass, String loginUri,
            boolean allowPaneluser) {
        if (realm.contains("\"") || (user != null && user.contains(":"))) {
            throw new IllegalArgumentException(
                    "Illegal realm or username. Realm must not contain double quotes, user must not contain colon");
        }

        this.realm = realm;
        this.user = user;
        this.pass = pass == null ? null : Digest.sha256(pass);
        this.loginUri = loginUri;
        this.allowPaneluser = allowPaneluser;
    }

    /**
     * Checks if the given {@link FullHttpRequest} has the correct header with valid
     * credentials
     *
     * @param ctx The {@link ChannelHandlerContext} of the session
     * @param req The {@link FullHttpRequest} to check
     *            @return, this method will also reply with {@code 401 Unauthorized}
     *            and then close the channel
     */
    @Override
    public boolean checkAuthorization(ChannelHandlerContext ctx, FullHttpRequest req) {
        ctx.channel().attr(PanelUserAuthenticationHandler.ATTR_AUTH_USER).setIfAbsent(null);
        HttpHeaders headers = req.headers();

        QueryStringDecoder qsd = new QueryStringDecoder(req.uri());

        if (this.isAuthorized(ctx, req)) {
            return true;
        }

        String auth = getAuthorizationString(req.headers());

        if (this.loginUri == null || this.loginUri.isBlank()) {
            FullHttpResponse res = HttpServerPageHandler.prepareHttpResponse(HttpResponseStatus.UNAUTHORIZED);
            if (auth == null) {
                com.gmt2001.Console.debug.println("WWW-Authenticate");
                res.headers().set("WWW-Authenticate", "Basic realm=\"" + this.realm + "\", charset=\"UTF-8\"");
            }

            com.gmt2001.Console.debug.println("401 " + req.method().asciiName() + ": " + qsd.path());
            if (this.user != null && this.pass != null) {
                com.gmt2001.Console.debug.println("Expected: >" + this.user + ":" + this.pass + "<");
            }
            if (auth != null) {
                com.gmt2001.Console.debug.println("Got: >" + new String(Base64.getDecoder().decode(auth)) + "<");
            }

            HttpServerPageHandler.sendHttpResponse(ctx, req, res);
        } else {
            FullHttpResponse res = HttpServerPageHandler.prepareHttpResponse(HttpResponseStatus.SEE_OTHER);

            res.headers().set(HttpHeaderNames.LOCATION, this.loginUri + (this.loginUri.contains("?") ? "&" : "?")
                    + "kickback=" + URLEncoder.encode(req.uri(), StandardCharsets.UTF_8));

            com.gmt2001.Console.debug.println("303 " + req.method().asciiName() + ": " + qsd.path());
            if (this.user != null && this.pass != null) {
                com.gmt2001.Console.debug.println("Expected: >" + this.user + ":" + this.pass + "<");
            }
            if (auth != null) {
                com.gmt2001.Console.debug.println("Got: >" + new String(Base64.getDecoder().decode(auth)) + "<");
            }

            HttpServerPageHandler.sendHttpResponse(ctx, req, res);
        }

        return false;
    }

    @Override
    public void invalidateAuthorization(ChannelHandlerContext ctx, FullHttpRequest req) {
        throw new UnsupportedOperationException("Not supported by this authentication handler.");
    }

    @Override
    public boolean isAuthorized(ChannelHandlerContext ctx, FullHttpRequest req) {
        return this.isAuthorized(ctx, req.headers(), req.uri());
    }

    @Override
    public boolean isAuthorized(String user, String pass) {
        return this.isAuthorizedPanelUserPass(user, pass) || this.isAuthorizedUserPass(user, pass);
    }

    @Override
    public boolean isAuthorized(ChannelHandlerContext ctx, HttpHeaders headers) {
        return this.isAuthorized(ctx, headers, null);
    }

    /**
     * Checks the given {@link HttpHeaders} for either an
     * {@code Authorization Basic}, or a cookie named {@code panellogin}
     *
     * @param headers The {@link HttpHeaders} to check
     * @return The authorization string, still encoded with Base64, giving
     *         preference to {@code Authorization Basic}; {@code null} if neither is
     *         found
     */
    public static String getAuthorizationString(HttpHeaders headers) {
        String auth = headers.get("Authorization");
        String outAuth = null;

        if (auth != null && auth.startsWith("Basic ")) {
            outAuth = auth.substring(6);
        } else {
            Map<String, String> cookies = HttpServerPageHandler.parseCookies(headers);
            outAuth = cookies.getOrDefault("panellogin", null);
        }

        return outAuth;
    }

    @Override
    public PanelUser getUser(ChannelHandlerContext ctx) {
        return ctx.channel().attr(PanelUserAuthenticationHandler.ATTR_AUTH_USER).get();
    }

    /**
     * Checks if the user is authorized and returns the {@link PanelUser} using the
     * Base64-encoded login and request URI
     *
     * @param auth       The Base64-encoded login
     * @param requestUri The request URI
     * @return {@code null} if panel login is not allowed by this handler or the
     *         login fails
     */
    private PanelUser getAuthorizedPanelB64(String auth, String requestUri) {
        return this.allowPaneluser ? PanelUserHandler.checkLoginAndGetUserB64(auth, requestUri) : null;
    }

    /**
     * Checks if the user is authorized, using {@link PanelUser} with the
     * Base64-encoded login and request URI
     *
     * @param ctx        The context
     * @param auth       The Base64-encoded login
     * @param requestUri The request URI
     * @return {@code false} if panel login is not allowed by this handler or the
     *         login fails
     */
    private boolean isAuthorizedPanelB64(ChannelHandlerContext ctx, String auth, String requestUri) {
        PanelUser user = this.getAuthorizedPanelB64(auth, requestUri);
        ctx.channel().attr(PanelUserAuthenticationHandler.ATTR_AUTH_USER).set(user);
        return user != null;
    }

    /**
     * Checks if the user is authorized, using {@link PanelUser} with a plaintext
     * user and password
     *
     * @param user The username
     * @param pass The password
     * @return {@code false} if panel login is not allowed by this handler or the
     *         login fails
     */
    private boolean isAuthorizedPanelUserPass(String user, String pass) {
        return this.allowPaneluser && PanelUserHandler.checkLogin(user, pass);
    }

    /**
     * Checks if the user is authorized, using the username and password passed to
     * the constructor
     *
     * @param user The username
     * @param pass The password
     * @return {@code false} if the username passed to the constructor was
     *         {@code null} or the login fails
     */
    private boolean isAuthorizedUserPass(String user, String pass) {
        return this.user != null && this.pass != null && user.equalsIgnoreCase(this.user) && pass.equals(this.pass);
    }

    /**
     * Decodes the authorization string and then checks if the user is authorized
     *
     * @param ctx        The context
     * @param headers    The HTTP headers of the request
     * @param requestUri The request URI
     * @return {@code true} if authorized
     */
    private boolean isAuthorized(ChannelHandlerContext ctx, HttpHeaders headers, String requestUri) {
        String auth = getAuthorizationString(headers);

        if (auth != null) {
            String userpass = new String(Base64.getDecoder().decode(auth));
            if (!userpass.isBlank()) {
                int colon = userpass.indexOf(':');
                return this.isAuthorizedPanelB64(ctx, auth, requestUri)
                        || this.isAuthorizedUserPass(userpass.substring(0, colon), userpass.substring(colon + 1));
            }
        }

        return false;
    }
}
