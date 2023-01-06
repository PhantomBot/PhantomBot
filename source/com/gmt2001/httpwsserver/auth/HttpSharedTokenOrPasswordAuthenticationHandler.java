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

import com.gmt2001.httpwsserver.HttpServerPageHandler;
import io.netty.channel.ChannelHandlerContext;
import io.netty.handler.codec.http.FullHttpRequest;
import io.netty.handler.codec.http.FullHttpResponse;
import io.netty.handler.codec.http.HttpHeaders;
import io.netty.handler.codec.http.HttpResponseStatus;
import io.netty.handler.codec.http.QueryStringDecoder;
import java.util.List;

/**
 * Provides a {@link HttpAuthenticationHandler} that implements password and token-based authentication
 *
 * The token must be in one of the following locations to succeed: - The header {@code webauth} - The query parameter {@code webauth}
 *
 * The password must be in the header {@code password} to succeed
 *
 * @author gmt2001
 */
public class HttpSharedTokenOrPasswordAuthenticationHandler implements HttpAuthenticationHandler {

    /**
     * The authorization token that grants access
     */
    private final String token;
    /**
     * The password that grants access
     */
    private final String password;

    /**
     * NoArg default for webauth query param
     */
    private static final List<String> NOARG = List.of("");

    /**
     * Constructor
     *
     * @param token The authorization token that grants access
     * @param password The password that also grants access
     */
    public HttpSharedTokenOrPasswordAuthenticationHandler(String token, String password) {
        this.token = token;
        this.password = password;
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
        QueryStringDecoder qsd = new QueryStringDecoder(req.uri());

        String auth1 = headers.get("password");
        String auth2 = headers.get("webauth");
        String auth3 = qsd.parameters().getOrDefault("webauth", NOARG).get(0);
        String astr = auth1 != null ? auth1 : (auth2 != null ? auth2 : (auth3 != null ? auth3 : ""));

        if (this.isAuthorized(ctx, req)) {
            return true;
        }

        FullHttpResponse res = HttpServerPageHandler.prepareHttpResponse(HttpResponseStatus.UNAUTHORIZED);

        com.gmt2001.Console.debug.println("401");
        com.gmt2001.Console.debug.println("Expected (p): >oauth:" + password + "<");
        com.gmt2001.Console.debug.println("Expected (t): >" + token + "<");
        com.gmt2001.Console.debug.println("Got: >" + astr + "<");

        HttpServerPageHandler.sendHttpResponse(ctx, req, res);

        return false;
    }

    @Override
    public void invalidateAuthorization(ChannelHandlerContext ctx, FullHttpRequest req) {
        throw new UnsupportedOperationException("Not supported by this authentication handler.");
    }

    @Override
    public boolean isAuthorized(ChannelHandlerContext ctx, FullHttpRequest req) {
        HttpHeaders headers = req.headers();
        QueryStringDecoder qsd = new QueryStringDecoder(req.uri());

        String auth1 = headers.get("password");
        String auth2 = headers.get("webauth");
        String auth3 = qsd.parameters().getOrDefault("webauth", NOARG).get(0);

        return (auth1 != null && (auth1.equals(password) || auth1.equals("oauth:" + password))) || (auth2 != null && auth2.equals(token)) || (auth3 != null && auth3.equals(token));
    }

    @Override
    public boolean isAuthorized(String user, String pass) {
        return pass.equals(password) || pass.equals("oauth:" + password) || pass.equals(token);
    }
}
