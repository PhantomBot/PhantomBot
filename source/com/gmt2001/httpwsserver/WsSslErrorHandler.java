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

import static com.gmt2001.httpwsserver.WebSocketFrameHandler.ATTR_URI;
import io.netty.channel.ChannelHandlerContext;
import io.netty.channel.SimpleChannelInboundHandler;
import io.netty.handler.codec.http.QueryStringDecoder;
import io.netty.handler.codec.http.websocketx.WebSocketCloseStatus;
import io.netty.handler.codec.http.websocketx.WebSocketFrame;
import io.netty.handler.codec.http.websocketx.WebSocketServerProtocolHandler.HandshakeComplete;
import io.netty.util.ReferenceCountUtil;
import java.util.List;
import org.json.JSONStringer;

/**
 * Processes WebSocket frames and passes successful ones to the appropriate registered final handler
 *
 * @author gmt2001
 */
public class WsSslErrorHandler extends SimpleChannelInboundHandler<WebSocketFrame> {

    private static final List<String> ALLOWNONSSLPATHS = List.of("/ws/alertspolls");

    WsSslErrorHandler() {
        super();
    }

    /**
     * Handles incoming WebSocket frames and passes them to the appropriate {@link WsFrameHandler}
     *
     * @param ctx The {@link ChannelHandlerContext} of the session
     * @param frame The {@link WebSocketFrame} containing the request frame
     * @throws Exception Passes any thrown exceptions up the stack
     */
    @Override
    protected void channelRead0(ChannelHandlerContext ctx, WebSocketFrame frame) throws Exception {
        QueryStringDecoder qsd = new QueryStringDecoder(ctx.channel().attr(ATTR_URI).get());
        for (String u : ALLOWNONSSLPATHS) {
            if (qsd.path().startsWith(u)) {
                ReferenceCountUtil.retain(frame);
                ctx.fireChannelRead(frame);
                return;
            }
        }
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
            HandshakeComplete hc = (HandshakeComplete) evt;
            QueryStringDecoder qsd = new QueryStringDecoder(hc.requestUri());
            for (String u : ALLOWNONSSLPATHS) {
                if (qsd.path().startsWith(u)) {
                    ctx.fireUserEventTriggered(evt);
                    return;
                }
            }
            JSONStringer jsonObject = new JSONStringer();
            jsonObject.object().key("errors").array().object()
                    .key("status").value("426")
                    .key("title").value("Upgrade Required")
                    .key("detail").value("WSS Required")
                    .endObject().endArray().endObject();

            WebSocketFrameHandler.sendWsFrame(ctx, null, WebSocketFrameHandler.prepareTextWebSocketResponse(jsonObject.toString()));
            WebSocketFrameHandler.sendWsFrame(ctx, null, WebSocketFrameHandler.prepareCloseWebSocketFrame(WebSocketCloseStatus.POLICY_VIOLATION));
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
        WebSocketFrameHandler.sendWsFrame(ctx, null, WebSocketFrameHandler.prepareCloseWebSocketFrame(WebSocketCloseStatus.INTERNAL_SERVER_ERROR));
        ctx.close();
    }
}
