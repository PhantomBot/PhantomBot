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

import com.gmt2001.httpwsserver.auth.WsAuthenticationHandler;
import io.netty.channel.ChannelHandlerContext;
import io.netty.handler.codec.http.websocketx.WebSocketFrame;

/**
 * Represents a handler for WebSocket frames
 *
 * @author gmt2001
 */
public interface WsFrameHandler {

    /**
     * Registers this {@link WsFrameHandler} with the {@link WebSocketFrameHandler}
     *
     * @return
     */
    WsFrameHandler register();

    /**
     * Gets the {@link WsAuthenticationHandler} assigned to this endpoint
     *
     * @return An {@link WsAuthenticationHandler}
     */
    WsAuthenticationHandler getAuthHandler();

    /**
     * Handles the WebSocket frame and sends a response back to the client, if necessary
     *
     * Only gets called if the {@link WsAuthenticationHandler} returned {@code true}
     *
     * @param ctx The {@link ChannelHandlerContext} of the session
     * @param frame The {@link WebSocketFrame} to process
     */
    void handleFrame(ChannelHandlerContext ctx, WebSocketFrame frame);
}
