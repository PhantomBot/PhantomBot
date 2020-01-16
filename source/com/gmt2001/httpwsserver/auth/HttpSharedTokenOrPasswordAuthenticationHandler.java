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
import io.netty.handler.codec.http.QueryStringDecoder;
import io.netty.util.CharsetUtil;
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
     */
    public HttpSharedTokenOrPasswordAuthenticationHandler(String token, String password) {
        this.token = token;
        this.password = password;
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
        QueryStringDecoder qsd = new QueryStringDecoder(req.uri());

        String auth1 = headers.get("password");
        String auth2 = headers.get("webauth");
        String auth3 = qsd.parameters().getOrDefault("webauth", NOARG).get(0);

        if ((auth1 != null && (auth1.equals(password) || auth1.equals("oauth:" + password))) || (auth2 != null && auth2.equals(token)) || (auth3 != null && auth3.equals(token))) {
            return true;
        }

        DefaultFullHttpResponse res = new DefaultFullHttpResponse(HTTP_1_1, HttpResponseStatus.UNAUTHORIZED, Unpooled.buffer());
        ByteBuf buf = Unpooled.copiedBuffer(res.status().toString(), CharsetUtil.UTF_8);
        res.content().writeBytes(buf);
        buf.release();
        HttpUtil.setContentLength(res, res.content().readableBytes());

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
