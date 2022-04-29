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
package com.gmt2001.wsclient;

import io.netty.channel.ChannelInitializer;
import io.netty.channel.ChannelPipeline;
import io.netty.channel.socket.SocketChannel;
import io.netty.handler.codec.http.DefaultHttpHeaders;
import io.netty.handler.codec.http.HttpClientCodec;
import io.netty.handler.codec.http.HttpObjectAggregator;
import io.netty.handler.codec.http.websocketx.WebSocketClientHandshakerFactory;
import io.netty.handler.codec.http.websocketx.WebSocketClientProtocolHandler;
import io.netty.handler.codec.http.websocketx.WebSocketFrameAggregator;
import io.netty.handler.codec.http.websocketx.WebSocketVersion;
import io.netty.handler.codec.http.websocketx.extensions.compression.WebSocketClientCompressionHandler;

/**
 * Initializes {@link SocketChannel} objects for a {@link WSClient}
 *
 * @author gmt2001
 */
class WSClientInitializer extends ChannelInitializer<SocketChannel> {

    /**
     * Reference to the attached {@link WSClient}
     */
    private final WSClient client;

    /**
     * Constructor
     *
     * @param client The attached {@link WSClient} representing the session
     */
    WSClientInitializer(WSClient client) {
        super();
        this.client = client;
    }

    /**
     * Initializes the {@link SocketChannel}
     *
     * @param ch The {@link SocketChannel} to initialize
     * @throws Exception Passes any thrown exceptions up the stack
     */
    @Override
    protected void initChannel(SocketChannel ch) throws Exception {
        this.client.frameHandler = new WebSocketFrameHandler(this.client);
        ChannelPipeline pipeline = ch.pipeline();

        if (this.client.sslCtx != null) {
            pipeline.addLast("sslhandler", this.client.sslCtx.newHandler(ch.alloc(), this.client.host, this.client.port));
        }

        pipeline.addLast(new HttpClientCodec());
        pipeline.addLast(new HttpObjectAggregator(65536));
        pipeline.addLast(WebSocketClientCompressionHandler.INSTANCE);
        pipeline.addLast(new WebSocketClientProtocolHandler(WebSocketClientHandshakerFactory.newHandshaker(this.client.uri, WebSocketVersion.V13, null, false, new DefaultHttpHeaders())));
        pipeline.addLast(new WebSocketFrameAggregator(65536));
        pipeline.addLast("wshandler", this.client.frameHandler);
    }
}
