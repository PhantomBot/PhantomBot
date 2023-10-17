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

import io.netty.channel.ChannelHandlerContext;
import tv.phantombot.panel.PanelUser.PanelUser;

/**
 * A client of a {@link WsWithLongPollFallbackhandler}
 */
public final class Client {
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
     * @param user The authenticated user
     */
    public Client(PanelUser user) {
        this.user = user;
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
     * @param ctx The context
     * @param isWs {@code true} if the context is a WS socket
     * @return {@code this}
     */
    public Client channelHandlerContext(ChannelHandlerContext ctx, boolean isWs) {
        this.ctx = ctx;
        this.isWs = isWs;
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
     * A separate or chained call to {@link #process()} is required to actually attempt to send the message
     *
     * @param message The message to enqueue
     * @param strongTimeout The duration after which the strong reference to the message will be dropped
     * @param softTimeout The duration after which the soft reference, and the entire message, will be dropped
     * @return {@code this}
     */
    public Client enqueue(String message, Duration strongTimeout, Duration softTimeout) {
        Message m = new Message(message, Instant.now().plus(strongTimeout), Instant.now().plus(softTimeout));
        this.strongQueue.add(m);
        this.softQueue.add(new SoftReference<>(m));
        return this;
    }

    /**
     * Attempts to send the currently enqueued messages
     */
    public void process() {

    }
}
