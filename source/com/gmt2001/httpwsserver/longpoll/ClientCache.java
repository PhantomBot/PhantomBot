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

import java.time.Duration;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.concurrent.Semaphore;
import java.util.concurrent.TimeUnit;
import java.util.function.Supplier;

import org.json.JSONObject;
import org.json.JSONStringer;

import com.gmt2001.httpwsserver.auth.PanelUserAuthenticationHandler;
import com.gmt2001.util.concurrent.ExecutorService;

import io.netty.channel.Channel;
import io.netty.channel.ChannelHandlerContext;
import tv.phantombot.panel.PanelUser.PanelUser;

/**
 * Manages a list of authenticated {@link Client} which are associated with a
 * {@link WsWithLongPollHandler}
 *
 * @author gmt2001
 */
public final class ClientCache {
    /**
     * Write lock for accessing {@link #lastSentTimestamp} and
     * {@link #lastSentSequence}
     */
    private final Semaphore sendSequenceLock = new Semaphore(1);
    /**
     * The timeout until a WS client is sent a PING frame or an HTTP client is sent
     * an empty response
     */
    private final Duration ctxTimeout;
    /**
     * The duration after which the strong reference to an outbound message will be
     * dropped
     */
    private final Duration strongTimeout;
    /**
     * The duration after which the soft reference to an outbound message, and the
     * entire message, will be dropped
     */
    private final Duration softTimeout;
    /**
     * The clients
     */
    private final CopyOnWriteArrayList<Client> clients = new CopyOnWriteArrayList<>();
    /**
     * Last send timestamp attached to an enqueued message
     */
    private Instant lastSentTimestamp = Instant.MIN;
    /**
     * Last send sequence number attached to an enqueued message
     */
    private long lastSentSequence = 0L;

    /**
     * Constructor
     *
     * @param ctxTimeout    The timeout until a WS client is sent a PING frame or an
     *                      HTTP client is sent an empty response
     * @param strongTimeout The duration after which the strong reference to an
     *                      outbound message will be dropped
     * @param softTimeout   The duration after which the soft reference to an
     *                      outbound message, and the entire message, will be
     *                      dropped
     */
    public ClientCache(Duration ctxTimeout, Duration strongTimeout, Duration softTimeout) {
        if (softTimeout.compareTo(strongTimeout) < 0) {
            softTimeout = softTimeout.plus(strongTimeout);
        }

        this.ctxTimeout = ctxTimeout;
        this.strongTimeout = strongTimeout;
        this.softTimeout = softTimeout;

        ExecutorService.scheduleAtFixedRate(() -> this.cleanup(), ctxTimeout.toMillis(),
                ctxTimeout.toMillis(), TimeUnit.MILLISECONDS);
    }

    /**
     * Processes timeouts and removes old clients
     */
    private void cleanup() {
        this.clients.forEach(c -> {
            c.processTimeout();
        });
    }

    /**
     * Removes a client
     *
     * @param client The client to remove
     */
    void remove(Client client) {
        this.clients.remove(client);
    }

    /**
     * Returns an unmodifiable list of current clients
     *
     * @return A list of {@link Client}
     */
    public List<Client> clients() {
        return Collections.unmodifiableList(this.clients);
    }

    /**
     * Adds a {@link Client}, or updates an existing one, with the provided context
     * and sequence, then replays any missed soft messages and sends any pending
     * strong messages
     *
     * @param ctx                         The context
     * @param isWs                        {@code true} if the context is a WS socket
     * @param lastClientReceivedTimestamp The timestamp to start at
     * @param lastClientReceivedSequence  The sequence to start at, exclusive
     * @param sessionIdSupplier           A supplier of unique session IDs
     * @return An optional that contains the client; empty optional if the
     *         {@link PanelUser} is {@code null}
     */
    public Optional<Client> addOrUpdateClient(ChannelHandlerContext ctx, boolean isWs,
            Instant lastClientReceivedTimestamp, long lastClientReceivedSequence, Supplier<String> sessionIdSupplier) {
        PanelUser user = ctx.channel().attr(PanelUserAuthenticationHandler.ATTR_AUTH_USER).get();
        String sessionId = ctx.channel().attr(WsWithLongPollAuthenticationHandler.ATTR_SESSIONID).get();

        if (user != null) {
            if (sessionId != null) {
                Optional<Client> client = this.client(user, sessionId);

                if (client.isPresent()) {
                    return Optional.of(client.get()
                            .setContextAndReplay(ctx, isWs, lastClientReceivedTimestamp, lastClientReceivedSequence)
                            .process());
                }
            }

            Client c = new Client(sessionIdSupplier.get(), user, this.ctxTimeout);
            this.clients.add(c);
            return Optional
                    .of(c.setContextAndReplay(ctx, isWs, lastClientReceivedTimestamp, lastClientReceivedSequence)
                            .process());
        }

        return Optional.empty();
    }

    /**
     * Indicates if the provided session ID is already in use
     *
     * @param sessionId The session ID
     * @return {@code true} if any existing client is using the provided session ID
     */
    boolean sessionIdExists(String sessionId) {
        return this.clients.stream().anyMatch(c -> c.sessionId().equals(sessionId));
    }

    /**
     * Gets the {@link Client} associated with the context
     *
     * @param ctx The context
     * @return An optional that contains the client; empty optional if the client
     *         was not found, or the {@link PanelUser} or Session ID is
     *         {@code null}
     */
    public Optional<Client> client(ChannelHandlerContext ctx) {
        return this.client(ctx.channel());
    }

    /**
     * Gets the {@link Client} associated with the channel
     *
     * @param channel The channel
     * @return An optional that contains the client; empty optional if the client
     *         was not found, or the {@link PanelUser} or Session ID is
     *         {@code null}
     */
    public Optional<Client> client(Channel channel) {
        PanelUser user = channel.attr(PanelUserAuthenticationHandler.ATTR_AUTH_USER).get();
        String sessionId = channel.attr(WsWithLongPollAuthenticationHandler.ATTR_SESSIONID).get();

        return this.client(user, sessionId);
    }

    /**
     * Gets the {@link Client} associated with the {@link PanelUser} and Session ID
     *
     * @param user      The panel user
     * @param sessionId The session ID
     * @return An optional that contains the client; empty optional if the client
     *         was not found, or the {@link PanelUser} or Session ID is
     *         {@code null}
     */
    public Optional<Client> client(PanelUser user, String sessionId) {
        if (user != null && sessionId != null) {
            return this.clients.stream().filter(c -> c.sessionId().equals(sessionId) && c.user().equals(user))
                    .findFirst();
        }

        return Optional.empty();
    }

    /**
     * Gets a list of all {@link Client} associated with the provided username
     *
     * @param username The username
     * @return A list of clients
     */
    public List<Client> clients(String username) {
        return this.clients.stream().filter(c -> c.user().getUsername().equalsIgnoreCase(username)).toList();
    }

    /**
     * Gets a list of all {@link Client} associated with the provided
     * {@link PanelUser}
     *
     * @param user The panel user
     * @return A list of clients
     */
    public List<Client> clients(PanelUser user) {
        return this.clients.stream().filter(c -> c.user().equals(user)).toList();
    }

    /**
     * Sets the last received sequence for the given {@link Client}
     *
     * @param client    The client
     * @param timestamp The message timestamp
     * @param sequence  The message sequence
     */
    public void lastReceived(Client client, Instant timestamp, long sequence) {
        client.lastReceived(timestamp, sequence);
    }

    /**
     * Enqueues a message
     * <p>
     * A separate or chained call to {@link #process()} is required to actually
     * attempt to send the message
     *
     * @param clients The clients to enqueue the message with
     * @param jso     The message to enqueue
     * @return {@code this}
     */
    public ClientCache enqueue(Iterable<Client> clients, JSONStringer jso) {
        return this.enqueue(clients, new JSONObject(jso.toString()));
    }

    /**
     * Enqueues a message
     * <p>
     * A separate or chained call to {@link #process()} is required to actually
     * attempt to send the message
     *
     * @param clients The clients to enqueue the message with
     * @param data    The message to enqueue
     * @return {@code this}
     */
    public ClientCache enqueue(Iterable<Client> clients, Object data) {
        try {
            if (this.sendSequenceLock.tryAcquire(this.ctxTimeout.toMillis(), TimeUnit.MILLISECONDS)) {
                try {
                    Instant now = Instant.now().truncatedTo(ChronoUnit.MILLIS);
                    long sequence = 0L;

                    if (!now.equals(this.lastSentTimestamp)) {
                        this.lastSentSequence = 0L;
                    } else {
                        sequence = ++this.lastSentSequence;
                    }

                    JSONObject message = new JSONObject();
                    JSONObject metadata = new JSONObject();
                    metadata.put("timestamp", now.toEpochMilli());
                    metadata.put("sequence", sequence);
                    message.put("metadata", metadata);
                    message.put("data", data);
                    Message m = new Message(message, now, sequence, now.plus(this.strongTimeout),
                            now.plus(this.softTimeout));
                    clients.forEach(c -> c.enqueue(m));
                } finally {
                    this.sendSequenceLock.release();
                }
            }
        } catch (InterruptedException ex) {
            com.gmt2001.Console.err.printStackTrace(ex);
        }
        return this;
    }

    /**
     * Broadcasts a message to all connected clients
     *
     * @param jso A {@link JSONStringer} containing the message to send
     */
    public void broadcast(JSONStringer jso) {
        this.enqueue(this.clients, jso);
    }

    /**
     * Broadcasts a message to all connected clients
     *
     * @param message The message to send
     */
    public void broadcast(Object message) {
        this.enqueue(this.clients, message);
    }

    /**
     * Sends a message to all clients which match a given username
     *
     * @param username The username
     * @param jso      A {@link JSONStringer} containing the message to send
     */
    public void send(String username, JSONStringer jso) {
        this.enqueue(this.clients(username), jso);
    }

    /**
     * Sends a message to all clients which match a given username
     *
     * @param username The username
     * @param message  The message to send
     */
    public void send(String username, Object message) {
        this.enqueue(this.clients, message);
    }

    /**
     * Sends a message to all clients which match a given {@link PanelUser}
     *
     * @param user The user
     * @param jso  A {@link JSONStringer} containing the message to send
     */
    public void send(PanelUser user, JSONStringer jso) {
        this.enqueue(this.clients(user), jso);
    }

    /**
     * Sends a message to all clients which match a given {@link PanelUser}
     *
     * @param user    The user
     * @param message The message to send
     */
    public void send(PanelUser user, Object message) {
        this.enqueue(this.clients(user), message);
    }

    /**
     * Sends a message to the {@link Client} associated with the specified
     * {@link ChannelHandlerContext}
     *
     * @param ctx The context
     * @param jso A {@link JSONStringer} containing the message to send
     */
    public void send(ChannelHandlerContext ctx, JSONStringer jso) {
        this.client(ctx).ifPresent(c -> this.send(c, jso));
    }

    /**
     * Sends a message to the {@link Client} associated with the specified
     * {@link ChannelHandlerContext}
     *
     * @param ctx     The context
     * @param message The message to send
     */
    public void send(ChannelHandlerContext ctx, Object message) {
        this.client(ctx).ifPresent(c -> this.send(c, message));
    }

    /**
     * Sends a message to the specified {@link Client}
     *
     * @param client The client
     * @param jso    A {@link JSONStringer} containing the message to send
     */
    public void send(Client client, JSONStringer jso) {
        this.enqueue(List.of(client), jso);
    }

    /**
     * Sends a message to the specified {@link Client}
     *
     * @param client  The client
     * @param message The message to send
     */
    public void send(Client client, Object message) {
        this.enqueue(List.of(client), message);
    }
}
