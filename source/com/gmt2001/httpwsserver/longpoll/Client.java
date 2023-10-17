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
package com.gmt2001.httpwsserver.longpoll;

import java.lang.ref.SoftReference;
import java.time.Duration;
import java.time.Instant;
import java.util.concurrent.ConcurrentLinkedQueue;
import java.util.concurrent.Semaphore;
import java.util.concurrent.TimeUnit;

import org.json.JSONStringer;

import com.gmt2001.httpwsserver.HttpServerPageHandler;
import com.gmt2001.httpwsserver.WebSocketFrameHandler;

import io.netty.buffer.Unpooled;
import io.netty.channel.ChannelHandlerContext;
import io.netty.handler.codec.http.HttpResponseStatus;
import io.netty.handler.codec.http.websocketx.PingWebSocketFrame;
import tv.phantombot.panel.PanelUser.PanelUser;

/**
 * A client of a {@link JSONWsWithLongPollFallbackHandler}
 */
public final class Client {
    /**
     * Empty response for a timed-out long poll
     */
    private static final String EMPTY_LONG_POLL_RESPONSE = new JSONStringer().array().endArray().toString();
    /**
     * Content-Type for long poll
     */
    private static final String LONG_POLL_CONTENT_TYPE = "json";
    /**
     * Write lock for accessing the context
     */
    private final Semaphore lock = new Semaphore(1);
    /**
     * The timeout when waiting for write access to the context fails
     */
    private final Duration lockTimeout;
    /**
     * The authenticated user
     */
    private final PanelUser user;
    /**
     * The strong outbound message queue
     */
    private final ConcurrentLinkedQueue<Message> strongQueue = new ConcurrentLinkedQueue<>();
    /**
     * The soft outbound message queue
     */
    private final ConcurrentLinkedQueue<SoftReference<Message>> softQueue = new ConcurrentLinkedQueue<>();
    /**
     * The currently active {@link ChannelHandlerContext}
     */
    private ChannelHandlerContext ctx = null;
    /**
     * The next timeout
     */
    private Instant nextTimeout = Instant.now();
    /**
     * {@code true} if {@link #ctx} is a WS socket
     */
    private boolean isWs = false;

    /**
     * Constructor
     *
     * @param user        The authenticated user
     * @param lockTimeout The timeout when waiting for write access to the context
     *                    fails
     */
    public Client(PanelUser user, Duration lockTimeout) {
        this.user = user;
        this.lockTimeout = lockTimeout;
    }

    /**
     * The authenticated user
     *
     * @return The authenticated user
     */
    public PanelUser user() {
        return this.user;
    }

    /**
     * Updates the currently active {@link ChannelHandlerContext}
     *
     * @param ctx  The context
     * @param isWs {@code true} if the context is a WS socket
     * @return {@code this}
     */
    public Client channelHandlerContext(ChannelHandlerContext ctx, boolean isWs) {
        try {
            if (this.lock.tryAcquire(this.lockTimeout.toMillis(), TimeUnit.MILLISECONDS)) {
                try {
                    this.ctx = ctx;
                    this.isWs = isWs;
                } finally {
                    this.lock.release();
                }
            }
        } catch (InterruptedException ex) {
            com.gmt2001.Console.err.printStackTrace(ex);
        }
        return this;
    }

    /**
     * Indicates if the current context is a WS socket
     *
     * @return {@code true} if the context is a WS socket
     */
    public boolean isWs() {
        return this.isWs;
    }

    /**
     * Updates the next timeout of the context
     *
     * @param timeout The duration after which the timeout will elapse
     * @return {@code this}
     */
    public Client timeout(Duration timeout) {
        this.nextTimeout = Instant.now().plus(timeout);
        return this;
    }

    /**
     * The timestamp of the next timeout of the context
     *
     * @return The timestamp
     */
    public Instant timeout() {
        return this.nextTimeout;
    }

    /**
     * Enqueues a message
     * <p>
     * A separate or chained call to {@link #process()} is required to actually
     * attempt to send the message
     *
     * @param message       The message to enqueue
     * @param strongTimeout The duration after which the strong reference to the
     *                      message will be dropped
     * @param softTimeout   The duration after which the soft reference, and the
     *                      entire message, will be dropped
     * @return {@code this}
     */
    public Client enqueue(String message, Duration strongTimeout, Duration softTimeout) {
        Message m = new Message(message, Instant.now().plus(strongTimeout), Instant.now().plus(softTimeout));
        this.strongQueue.add(m);
        this.softQueue.add(new SoftReference<>(m));
        return this;
    }

    /**
     * Processes timeouts
     */
    public void processTimeout() {
        Instant now = Instant.now();
        this.strongQueue.removeIf(m -> m.strongTimeout().isBefore(now));
        this.softQueue.removeIf(m -> m.get() == null || m.get().softTimeout().isBefore(now));

        try {
            if (this.ctx != null && this.lock.tryAcquire(this.lockTimeout.toMillis(), TimeUnit.MILLISECONDS)) {
                try {
                    if (this.nextTimeout.isBefore(now)) {
                        if (this.ctx != null && this.ctx.channel().isActive()) {
                            if (this.isWs) {
                                WebSocketFrameHandler.sendWsFrame(ctx, null, new PingWebSocketFrame(
                                        Unpooled.copiedBuffer(Long.toString(now.toEpochMilli()).getBytes())));
                            } else {
                                HttpServerPageHandler.sendHttpResponse(this.ctx, null, HttpServerPageHandler
                                        .prepareHttpResponse(HttpResponseStatus.OK, EMPTY_LONG_POLL_RESPONSE,
                                                LONG_POLL_CONTENT_TYPE));
                                this.ctx = null;
                            }
                        }
                    }
                } finally {
                    this.lock.release();
                }
            }
        } catch (InterruptedException ex) {
            com.gmt2001.Console.err.printStackTrace(ex);
        }
    }

    /**
     * Processes timeouts, then attempts to send the currently enqueued messages
     */
    public void process() {
        this.processTimeout();

        try {
            if (this.ctx != null && this.lock.tryAcquire(this.lockTimeout.toMillis(), TimeUnit.MILLISECONDS)) {
                try {
                    if (this.ctx != null && this.ctx.channel().isActive()) {
                        if (this.isWs) {
                            Message m = this.strongQueue.poll();
                            while (m != null) {
                                WebSocketFrameHandler.sendWsFrame(ctx, null,
                                        WebSocketFrameHandler.prepareTextWebSocketResponse(m.message()));
                                m = this.strongQueue.poll();
                            }

                            SoftReference<Message> s = this.softQueue.poll();
                            while (s != null) {
                                if (s.get() != null) {
                                    WebSocketFrameHandler.sendWsFrame(this.ctx, null,
                                            WebSocketFrameHandler.prepareTextWebSocketResponse(s.get().message()));
                                }
                                s = this.softQueue.poll();
                            }
                        } else {
                            JSONStringer jso = new JSONStringer();
                            jso.array();
                            Message m = this.strongQueue.poll();
                            while (m != null) {
                                jso.value(m.message());
                                m = this.strongQueue.poll();
                            }

                            SoftReference<Message> s = this.softQueue.poll();
                            while (s != null) {
                                if (s.get() != null) {
                                    jso.value(s.get().message());
                                }
                                s = this.softQueue.poll();
                            }
                            jso.endArray();
                            HttpServerPageHandler.sendHttpResponse(this.ctx, null, HttpServerPageHandler
                                    .prepareHttpResponse(HttpResponseStatus.OK, jso.toString(),
                                            LONG_POLL_CONTENT_TYPE));
                            this.ctx = null;
                        }
                    }
                } finally {
                    this.lock.release();
                }
            }
        } catch (InterruptedException ex) {
            com.gmt2001.Console.err.printStackTrace(ex);
        }
    }
}
