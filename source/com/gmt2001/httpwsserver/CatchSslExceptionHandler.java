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
package com.gmt2001.httpwsserver;

import io.netty.channel.ChannelHandlerContext;
import io.netty.channel.ChannelInboundHandlerAdapter;

/**
 *
 * @author gmt2001
 */
public class CatchSslExceptionHandler extends ChannelInboundHandlerAdapter {

    /**
     * Handles exceptions that are thrown up the stack
     *
     * @param ctx The {@link ChannelHandlerContext} of the session
     * @param cause The exception
     */
    @Override
    public void exceptionCaught(ChannelHandlerContext ctx, Throwable cause) {
        if (cause.getClass().equals(java.security.cert.CertificateExpiredException.class)
                || cause.getClass().equals(java.security.cert.CertPathValidatorException.class)
                || cause.getMessage().contains("no cipher suites in common")
                || cause.getMessage().contains("unable to find valid certification path")) {
            HTTPWSServer.instance().generateAutoSsl(true);
        }
        ctx.fireExceptionCaught(cause);
    }
}
