/*
 * Copyright (C) 2016-2022 phantombot.github.io/PhantomBot
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

import io.netty.channel.ChannelHandler;
import io.netty.channel.ChannelHandlerContext;
import io.netty.handler.ssl.OptionalSslHandler;
import io.netty.handler.ssl.SslContext;

/**
 * Detects Non-SSL HTTP connections and activates the SSL Redirect handler, when SSL is enabled
 *
 * @author gmt2001
 */
public class HttpOptionalSslHandler extends OptionalSslHandler {

    /**
     * Default Constructor
     */
    HttpOptionalSslHandler(SslContext sslContext) {
        super(sslContext);
    }

    @Override
    protected ChannelHandler newNonSslHandler(ChannelHandlerContext context) {
        context.pipeline().addBefore("pagehandler", "httpsslredirect", new HttpSslRedirectHandler());
        context.pipeline().addBefore("wshandler", "wssslerror", new WsSslErrorHandler());
        return null;
    }

    /**
     * Handles exceptions that are thrown up the stack
     *
     * @param ctx The {@link ChannelHandlerContext} of the session
     * @param cause The exception
     */
    @Override
    public void exceptionCaught(ChannelHandlerContext ctx, Throwable cause) {
        if (cause.getMessage().contains("no cipher suites in common")) {
            HTTPWSServer.instance().generateAutoSsl(true);
        }
    }
}
