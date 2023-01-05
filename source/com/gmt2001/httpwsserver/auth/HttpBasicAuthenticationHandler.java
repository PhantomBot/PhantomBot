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

import com.gmt2001.httpwsserver.HTTPWSServer;
import com.gmt2001.httpwsserver.HttpServerPageHandler;
import io.netty.channel.ChannelHandlerContext;
import io.netty.handler.codec.http.FullHttpRequest;
import io.netty.handler.codec.http.FullHttpResponse;
import io.netty.handler.codec.http.HttpHeaderNames;
import io.netty.handler.codec.http.HttpHeaders;
import io.netty.handler.codec.http.HttpResponseStatus;
import java.util.Base64;
import java.util.Map;

/**
 * Provides a {@link HttpAuthenticationHandler} that implements HTTP Basic authentication, as well as allowing the same format to be provided in a
 * cookie
 *
 * @author gmt2001
 */
public class HttpBasicAuthenticationHandler implements HttpAuthenticationHandler {

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
     * If set, failed authentication redirects to this URI with 303 See Other instead of outputting 401 Unauthorized
     */
    private final String loginUri;

    /**
     * Constructor
     *
     * @param realm The realm to present to the user
     * @param user The username required for valid authentication
     * @param pass The password required for valid authentication
     * @param loginUri The login page URI
     * @throws IllegalArgumentException If {@code realm} contains any double quotes or {@code user} contains any colons
     */
    public HttpBasicAuthenticationHandler(String realm, String user, String pass, String loginUri) {
        if (realm.contains("\"") || user.contains(":")) {
            throw new IllegalArgumentException("Illegal realm or username. Realm must not contain double quotes, user must not contain colon");
        }

        this.realm = realm;
        this.user = user;
        this.pass = pass;
        this.loginUri = loginUri;
    }

    /**
     * Checks if the given {@link FullHttpRequest} has the correct header with valid credentials
     *
     * @param ctx The {@link ChannelHandlerContext} of the session
     * @param req The {@link FullHttpRequest} to check
     * @return, this method will also reply with {@code 401 Unauthorized} and then close the channel
     */
    @Override
    public boolean checkAuthorization(ChannelHandlerContext ctx, FullHttpRequest req) {
        HttpHeaders headers = req.headers();

        String auth = headers.get("Authorization");

        if (this.isAuthorized(ctx, req)) {
            return true;
        }

        if (this.loginUri == null || this.loginUri.isBlank()) {
            FullHttpResponse res = HttpServerPageHandler.prepareHttpResponse(HttpResponseStatus.UNAUTHORIZED);
            if (auth == null) {
                com.gmt2001.Console.debug.println("WWW-Authenticate");
                res.headers().set("WWW-Authenticate", "Basic realm=\"" + realm + "\", charset=\"UTF-8\"");
            }

            com.gmt2001.Console.debug.println("401");
            com.gmt2001.Console.debug.println("Expected: >" + user + ":" + pass + "<");
            if (auth != null) {
                com.gmt2001.Console.debug.println("Got: >" + new String(Base64.getDecoder().decode(auth)) + "<");
            }

            HttpServerPageHandler.sendHttpResponse(ctx, req, res);
        } else {
            FullHttpResponse res = HttpServerPageHandler.prepareHttpResponse(HttpResponseStatus.SEE_OTHER);

            String host = req.headers().get(HttpHeaderNames.HOST);

            if (host == null) {
                host = "";
            } else if (HTTPWSServer.instance().isSsl()) {
                host = "https://" + host;
            } else {
                host = "http://" + host;
            }

            res.headers().set(HttpHeaderNames.LOCATION, host + this.loginUri + (this.loginUri.contains("?") ? "&" : "?") + "kickback=" + req.uri());

            com.gmt2001.Console.debug.println("303");
            com.gmt2001.Console.debug.println("Expected: >" + user + ":" + pass + "<");
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
        HttpHeaders headers = req.headers();

        String auth = headers.get("Authorization");

        if (auth != null && auth.startsWith("Basic ")) {
            auth = auth.substring(6);
            String userpass = new String(Base64.getDecoder().decode(auth));
            int colon = userpass.indexOf(':');

            if (userpass.substring(0, colon).equalsIgnoreCase(user) && userpass.substring(colon + 1).equals(pass)) {
                return true;
            }
        } else {
            Map<String, String> cookies = HttpServerPageHandler.parseCookies(headers);
            auth = cookies.getOrDefault("panellogin", null);

            if (auth != null) {
                String userpass = new String(Base64.getDecoder().decode(auth));
                int colon = userpass.indexOf(':');

                if (userpass.substring(0, colon).equalsIgnoreCase(user) && userpass.substring(colon + 1).equals(pass)) {
                    return true;
                }
            }
        }

        return false;
    }

    @Override
    public boolean isAuthorized(String user, String pass) {
        return user.equalsIgnoreCase(this.user) && pass.equals(this.pass);
    }
}
