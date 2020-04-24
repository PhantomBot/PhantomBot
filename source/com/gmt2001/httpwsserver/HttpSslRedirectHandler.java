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
package com.gmt2001.httpwsserver;

import io.netty.channel.ChannelHandlerContext;
import io.netty.channel.SimpleChannelInboundHandler;
import io.netty.handler.codec.http.FullHttpRequest;
import io.netty.handler.codec.http.FullHttpResponse;
import io.netty.handler.codec.http.HttpHeaderNames;
import io.netty.handler.codec.http.HttpResponseStatus;
import org.sqlite.SQLiteConfig;

/**
 * Redirects HTTP requests to HTTPS, when SSL is enabled
 *
 * @author gmt2001
 */
public class HttpSslRedirectHandler extends SimpleChannelInboundHandler<FullHttpRequest> {

    /**
     * Default Constructor
     */
    HttpSslRedirectHandler() {
        super();
    }

    /**
     * Redirects non-SSL requests to SSL
     *
     * @param ctx The {@link ChannelHandlerContext} of the session
     * @param req The {@link FullHttpRequest} containing the request
     * @throws Exception Passes any thrown exceptions up the stack
     */
    @Override
    protected void channelRead0(ChannelHandlerContext ctx, FullHttpRequest req) throws Exception {
        if (!req.decoderResult().isSuccess()) {
            HttpServerPageHandler.sendHttpResponse(ctx, req, HttpServerPageHandler.prepareHttpResponse(HttpResponseStatus.BAD_REQUEST, null, null));
            return;
        }
        
        String host = req.headers().get(HttpHeaderNames.HOST);
        
        if (host != null && !host.isBlank()) {
            String uri = "https://" + host + req.uri();
        
            com.gmt2001.Console.debug.println("301: " + uri);

            FullHttpResponse res = HttpServerPageHandler.prepareHttpResponse(HttpResponseStatus.MOVED_PERMANENTLY, null, null);
        
            res.headers().set(HttpHeaderNames.LOCATION, uri);
        
            HttpServerPageHandler.sendHttpResponse(ctx, req, res);
        } else {
            HttpServerPageHandler.sendHttpResponse(ctx, req, HttpServerPageHandler.prepareHttpResponse(HttpResponseStatus.FORBIDDEN, "HTTPS Required".getBytes(), null));
        }
    }

    /**
     * Handles exceptions that are thrown up the stack
     *
     * @param ctx The {@link ChannelHandlerContext} of the session
     * @param cause The exception
     */
    @Override
    public void exceptionCaught(ChannelHandlerContext ctx, Throwable cause) {
        com.gmt2001.Console.debug.printOrLogStackTrace(cause);
        ctx.close();
    }
}
