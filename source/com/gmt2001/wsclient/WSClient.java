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

import io.netty.bootstrap.Bootstrap;
import io.netty.channel.Channel;
import io.netty.channel.EventLoopGroup;
import io.netty.channel.nio.NioEventLoopGroup;
import io.netty.channel.socket.nio.NioSocketChannel;
import io.netty.handler.codec.http.websocketx.WebSocketCloseStatus;
import io.netty.handler.codec.http.websocketx.WebSocketFrame;
import io.netty.handler.ssl.SslContext;
import io.netty.handler.ssl.SslContextBuilder;
import io.netty.handler.ssl.util.InsecureTrustManagerFactory;
import java.net.URI;
import java.util.concurrent.TimeUnit;
import javax.net.ssl.SSLException;
import org.json.JSONObject;

/**
 * Provides a WebSocket client
 *
 * @author gmt2001
 */
public class WSClient {

    /**
     * The URI to connect to
     */
    final URI uri;
    /**
     * The hostname extracted from the URI
     */
    final String host;
    /**
     * The port extracted from the URI
     */
    final int port;
    /**
     * The {@link SslContext}, if this is a wss connection
     */
    final SslContext sslCtx;
    /**
     * The {@link WsClientFrameHandler} that will receive frames
     */
    final WsClientFrameHandler handler;
    /**
     * The {@link WebSocketFrameHandler} that will process frames to the handler and provide the communication {@link Channel}
     */
    WebSocketFrameHandler frameHandler = null;
    /**
     * The {@link Channel} for the session
     */
    private Channel channel = null;
    /**
     * The client's {@link EventLoopGroup}
     */
    private final EventLoopGroup group = new NioEventLoopGroup();

    /**
     * Constructor
     *
     * @param uri The URI to connect to
     * @param handler An object implementing {@link WsClientFrameHandler} which will receive frames
     * @throws SSLException Failed to create the {@link SslContext}
     * @throws IllegalArgumentException URI scheme is not ws or wss
     */
    public WSClient(URI uri, WsClientFrameHandler handler) throws SSLException, IllegalArgumentException {
        try {
            this.uri = uri;

            String scheme = uri.getScheme() == null ? "ws" : uri.getScheme();

            if (!"ws".equalsIgnoreCase(scheme) && !"wss".equalsIgnoreCase(scheme)) {
                throw new IllegalArgumentException("URI Scheme must be ws or wss");
            }

            this.host = uri.getHost() == null ? "127.0.0.1" : uri.getHost();

            if (uri.getPort() == -1) {
                if ("ws".equalsIgnoreCase(scheme)) {
                    this.port = 80;
                } else if ("wss".equalsIgnoreCase(scheme)) {
                    this.port = 443;
                } else {
                    this.port = -1;
                }
            } else {
                this.port = uri.getPort();
            }

            this.handler = handler;
            if ("wss".equalsIgnoreCase(scheme)) {
                this.sslCtx = SslContextBuilder.forClient().trustManager(InsecureTrustManagerFactory.INSTANCE).build();
            } else {
                this.sslCtx = null;
            }
        } catch (IllegalArgumentException | SSLException ex) {
            group.shutdownGracefully();
            throw ex;
        }
    }

    /**
     * Connects to the server
     *
     * @return true if the socket has connected and is starting the handshake; false otherwise
     * @throws InterruptedException The connection process was interrupted
     * @throws IllegalStateException Attempting to use a closed client
     */
    public boolean connect() throws InterruptedException, IllegalStateException {
        try {
            if (this.channel != null) {
                throw new IllegalStateException("Reusing a closed client");
            }

            Bootstrap b = new Bootstrap();
            b.group(this.group)
                    .channel(NioSocketChannel.class)
                    .handler(new WSClientInitializer(this));

            this.channel = b.connect(this.host, this.port).sync().channel();
        } catch (InterruptedException | IllegalStateException ex) {
            group.shutdownGracefully();
            throw ex;
        }

        return this.channel != null;
    }

    /**
     * Indicates if the socket is connected
     *
     * NOTE: Only indicates that the socket is ready to send/receive frames. Does not indicate authentication status or anything else
     *
     * @return true if the socket is connected and ready to send/receive frames; false otherwise
     */
    public boolean connected() {
        return this.frameHandler.connected;
    }

    /**
     * Retrieves the socket channel
     *
     * @return The socket channel if connected; null otherwise
     */
    public Channel channel() {
        return this.channel;
    }

    /**
     * Sends a WebSocket frame
     *
     * @param frame The frame to send
     */
    public void send(WebSocketFrame frame) {
        WebSocketFrameHandler.sendWsFrame(this.channel(), null, frame);
    }

    /**
     * Sends a WebSocket frame of type Text
     *
     * @param text The body content of the frame
     */
    public void send(String text) {
        WebSocketFrameHandler.sendWsFrame(this.channel(), null, WebSocketFrameHandler.prepareTextWebSocketResponse(text));
    }

    /**
     * Stringifys a {@link JSONObject}, then sends it as a WebSocket frame of type Text
     *
     * @param jso The {@link JSONObject} to send
     */
    public void send(JSONObject jso) {
        WebSocketFrameHandler.sendWsFrame(this.channel(), null, WebSocketFrameHandler.prepareTextWebSocketResponse(jso));
    }

    /**
     * Sends a WebSocket frame of type Binary
     *
     * @param binarydata The binary bytes to send
     */
    public void send(byte[] binarydata) {
        WebSocketFrameHandler.sendWsFrame(this.channel(), null, WebSocketFrameHandler.prepareBinaryWebSocketResponse(binarydata));
    }

    /**
     * Sends a WebSocket frame of type Close with a status code of NORMAL_CLOSURE, then closes the socket, with a grace period for ongoing requests to
     * finish
     */
    public void close() {
        this.close(WebSocketCloseStatus.NORMAL_CLOSURE);
    }

    /**
     * Sends a WebSocket frame of type Close, then closes the socket, with a grace period for ongoing requests to finish
     *
     * @param status The close status code to send
     */
    public void close(WebSocketCloseStatus status) {
        this.close(WebSocketFrameHandler.prepareCloseWebSocketFrame(status));
    }

    /**
     * Sends a WebSocket frame of type Close, then closes the socket, with a grace period for ongoing requests to finish
     *
     * @param status The close status code to send
     * @param reason The reason string to send
     */
    public void close(WebSocketCloseStatus status, String reason) {
        this.close(status.code(), reason);
    }

    /**
     * Sends a WebSocket frame of type Close, then closes the socket, with a grace period for ongoing requests to finish
     *
     * @param status The close status code to send
     * @param reason The reason string to send
     */
    public void close(int status, String reason) {
        this.close(WebSocketFrameHandler.prepareCloseWebSocketFrame(status, reason));
    }

    /**
     * Sends a WebSocket frame of type Close, then closes the socket, with a grace period for ongoing requests to finish
     *
     * @param closeFrame The close frame to send
     */
    public void close(WebSocketFrame closeFrame) {
        WebSocketFrameHandler.close(this.channel(), closeFrame).awaitUninterruptibly(5, TimeUnit.SECONDS);

        group.shutdownGracefully(3, 5, TimeUnit.SECONDS);
    }
}
