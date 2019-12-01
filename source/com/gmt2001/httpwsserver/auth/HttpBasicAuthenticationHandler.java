/*
 * Copyright (C) 2016-2019 phantombot.tv
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

import io.netty.buffer.ByteBuf;
import io.netty.buffer.Unpooled;
import io.netty.channel.ChannelFutureListener;
import io.netty.channel.ChannelHandlerContext;
import io.netty.handler.codec.http.DefaultFullHttpResponse;
import io.netty.handler.codec.http.FullHttpRequest;
import static io.netty.handler.codec.http.HttpHeaderNames.CONNECTION;
import static io.netty.handler.codec.http.HttpHeaderValues.CLOSE;
import io.netty.handler.codec.http.HttpHeaders;
import io.netty.handler.codec.http.HttpResponseStatus;
import io.netty.handler.codec.http.HttpUtil;
import static io.netty.handler.codec.http.HttpVersion.HTTP_1_1;
import io.netty.util.CharsetUtil;
import java.util.Base64;

/**
 * Provides a {@link HttpAuthenticationHandler} that implements HTTP Basic authentication
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
     * Constructor
     *
     * @param realm The realm to present to the user
     * @param user The username required for valid authentication
     * @param pass The password required for valid authentication
     * @throws IllegalArgumentException If {@code realm} contains any double quotes or {@code user} contains any colons
     */
    public HttpBasicAuthenticationHandler(String realm, String user, String pass) {
        if (realm.contains("\"") || user.contains(":")) {
            throw new IllegalArgumentException("Illegal realm or username. Realm must not contain double quotes, user must not contain colon");
        }

        this.realm = realm;
        this.user = user;
        this.pass = pass;
    }

    /**
     * Checks if the given {@link FullHttpRequest} has the correct header with valid credentials
     *
     * @param ctx The {@link ChannelHandlerContext} of the session
     * @param frame The {@link FullHttpRequest} to check
     * @return {@code true} if authenticated, {@code false} otherwise. When returning {@code false}, this method will also reply with
     * {@code 401 Unauthorized} and then close the channel
     */
    @Override
    public boolean checkAuthorization(ChannelHandlerContext ctx, FullHttpRequest req) {
        HttpHeaders headers = req.headers();

        String auth = headers.get("Authorization");

        if (auth != null && auth.startsWith("Basic ")) {
            String userpass = new String(Base64.getDecoder().decode(auth.substring(6)));
            int colon = userpass.indexOf(':');

            if (userpass.substring(0, colon).equals(user) && userpass.substring(colon + 1).equals(pass)) {
                return true;
            }
        }

        DefaultFullHttpResponse res = new DefaultFullHttpResponse(HTTP_1_1, HttpResponseStatus.UNAUTHORIZED, Unpooled.buffer());
        ByteBuf buf = Unpooled.copiedBuffer(res.status().toString(), CharsetUtil.UTF_8);
        res.content().writeBytes(buf);
        buf.release();
        HttpUtil.setContentLength(res, res.content().readableBytes());

        if (auth == null) {
            com.gmt2001.Console.debug.println("WWW-Authenticate");
            res.headers().set("WWW-Authenticate", "Basic realm=\"" + realm + "\", charset=\"UTF-8\"");
        }

        com.gmt2001.Console.debug.println("403");

        res.headers().set(CONNECTION, CLOSE);
        ctx.writeAndFlush(res).addListener(ChannelFutureListener.CLOSE);

        return false;
    }

    @Override
    public void invalidateAuthorization(ChannelHandlerContext ctx, FullHttpRequest req) {
        throw new UnsupportedOperationException("Not supported by this authentication handler.");
    }
}
