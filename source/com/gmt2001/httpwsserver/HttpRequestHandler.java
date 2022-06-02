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

import com.gmt2001.httpwsserver.auth.HttpAuthenticationHandler;
import io.netty.channel.ChannelHandlerContext;
import io.netty.handler.codec.http.FullHttpRequest;

/**
 * Represents a handler for HTTP requests
 *
 * @author gmt2001
 */
public interface HttpRequestHandler {

    /**
     * Registers this {@link HttpRequestHandler} with the {@link HttpServerPageHandler}
     *
     * @return
     */
    HttpRequestHandler register();

    /**
     * Gets the {@link HttpAuthenticationHandler} assigned to this endpoint
     *
     * @return An {@link HttpAuthenticationHandler}
     */
    HttpAuthenticationHandler getAuthHandler();

    /**
     * Handles the HTTP request and sends a response back to the client
     *
     * Only gets called if the {@link HttpAuthenticationHandler} returned {@code true}
     *
     * @param ctx The {@link ChannelHandlerContext} of the session
     * @param req The {@link FullHttpRequest} containing the request
     */
    void handleRequest(ChannelHandlerContext ctx, FullHttpRequest req);
}
