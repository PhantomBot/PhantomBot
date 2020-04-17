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

import io.netty.channel.ChannelHandlerContext;
import io.netty.handler.codec.http.FullHttpRequest;

/**
 * Provides a {@link HttpAuthenticationHandler} that allows all requests
 *
 * @author gmt2001
 */
public class HttpNoAuthenticationHandler implements HttpAuthenticationHandler {

    /**
     * An instance of {@link HttpNoAuthenticationHandler}
     */
    private static HttpNoAuthenticationHandler INSTANCE;

    /**
     * Gets a handler instance
     *
     * @return An instance of {@link HttpNoAuthenticationHandler}
     */
    public static synchronized HttpNoAuthenticationHandler instance() {
        if (INSTANCE == null) {
            INSTANCE = new HttpNoAuthenticationHandler();
        }

        return INSTANCE;
    }

    /**
     * Always returns {@code true}, since this handler is for No Authentication
     *
     * @param ctx The {@link ChannelHandlerContext} of the session
     * @param req The {@link FullHttpRequest} of the request
     * @return {@code true}
     */
    @Override
    public boolean checkAuthorization(ChannelHandlerContext ctx, FullHttpRequest req) {
        return true;
    }

    @Override
    public void invalidateAuthorization(ChannelHandlerContext ctx, FullHttpRequest req) {
        throw new UnsupportedOperationException("Not supported by this authentication handler.");
    }
}
