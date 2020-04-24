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
import io.netty.handler.codec.http.websocketx.TextWebSocketFrame;
import io.netty.handler.codec.http.websocketx.WebSocketFrame;
import io.netty.handler.codec.http.websocketx.WebSocketServerProtocolHandler.HandshakeComplete;
import org.json.JSONStringer;

/**
 * Processes WebSocket frames and passes successful ones to the appropriate registered final handler
 *
 * @author gmt2001
 */
public class WsSslErrorHandler extends SimpleChannelInboundHandler<WebSocketFrame> {

    WsSslErrorHandler() {
        super();
    }

    /**
     * Handles incoming WebSocket frames and passes them to the appropriate {@link WsFrameHandler}
     *
     * @param ctx The {@link ChannelHandlerContext} of the session
     * @param req The {@link WebSocketFrame} containing the request frame
     * @throws Exception Passes any thrown exceptions up the stack
     */
    @Override
    protected void channelRead0(ChannelHandlerContext ctx, WebSocketFrame frame) throws Exception {

    }

    /**
     * Captures {@link HandshakeComplete} events and saves the {@link WsFrameHandler} URI to the session
     *
     * If a handler is not available for the requested path, then {@code 404 NOT FOUND} is sent back to the client using JSON:API format
     *
     * @param ctx The {@link ChannelHandlerContext} of the session
     * @param evt The event object
     * @throws Exception Passes any thrown exceptions up the stack
     */
    @Override
    public void userEventTriggered(ChannelHandlerContext ctx, Object evt) throws Exception {
        if (evt instanceof HandshakeComplete) {
            JSONStringer jsonObject = new JSONStringer();
            jsonObject.object().key("errors").array().object()
                    .key("status").value("403")
                    .key("title").value("Forbidden")
                    .key("detail").value("WSS Required")
                    .endObject().endArray().endObject();

            ctx.channel().writeAndFlush(new TextWebSocketFrame(jsonObject.toString()));
            ctx.close();
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
