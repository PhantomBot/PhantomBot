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
import java.util.Optional;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.concurrent.TimeUnit;

import org.json.JSONStringer;

import com.gmt2001.httpwsserver.auth.PanelUserAuthenticationHandler;
import com.gmt2001.util.concurrent.ExecutorService;

import io.netty.channel.ChannelHandlerContext;
import tv.phantombot.panel.PanelUser.PanelUser;

/**
 * Manages a list of authenticated {@link Client} which are associated with a
 * {@link JSONWsWithLongPollHandler}
 */
public final class ClientCache {
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
        Instant clientTimeout = Instant.now().plus(this.ctxTimeout.multipliedBy(3));
        this.clients.forEach(c -> {
            c.processTimeout();
            if (c.timeout().isBefore(clientTimeout)) {
                this.clients.remove(c);
            }
        });
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
     */
    public void addOrUpdateClient(ChannelHandlerContext ctx, boolean isWs, Instant lastClientReceivedTimestamp,
            long lastClientReceivedSequence) {
        PanelUser user = ctx.channel().attr(PanelUserAuthenticationHandler.ATTR_AUTH_USER).get();
        String guid = ctx.channel().attr(WsWithLongPollAuthenticationHandler.ATTR_GUID).get();

        if (user != null && guid != null) {
            Optional<Client> client = this.clients.stream().filter(c -> c.guid().equals(guid) && c.user().equals(user))
                    .findFirst();

            if (client.isPresent()) {
                client.get().setContextAndReplay(ctx, isWs, lastClientReceivedTimestamp, lastClientReceivedSequence)
                        .process();
            } else {
                Client c = new Client(guid, user, this.ctxTimeout);
                this.clients.add(c);
                c.setContextAndReplay(ctx, isWs, lastClientReceivedTimestamp, lastClientReceivedSequence).process();
            }
        }
    }

    /**
     * Registers that a client has responded to a PING
     *
     * @param ctx The context
     */
    public void pong(ChannelHandlerContext ctx) {
        Optional<Client> client = this.client(ctx);

        if (client.isPresent()) {
            client.get().timeout(this.ctxTimeout);
        }
    }

    /**
     * Gets the {@link Client} associated with the context
     *
     * @param ctx The context
     * @return An optional that contains the client, if found
     */
    public Optional<Client> client(ChannelHandlerContext ctx) {
        PanelUser user = ctx.channel().attr(PanelUserAuthenticationHandler.ATTR_AUTH_USER).get();
        String guid = ctx.channel().attr(WsWithLongPollAuthenticationHandler.ATTR_GUID).get();

        if (user != null && guid != null) {
            return this.clients.stream().filter(c -> c.guid().equals(guid) && c.user().equals(user)).findFirst();
        }

        return Optional.empty();
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
     * Broadcasts a message to all connected clients
     *
     * @param jso A {@link JSONStringer} containing the message to send
     */
    public void broadcast(JSONStringer jso) {
        this.clients.forEach(c -> c.enqueue(jso, this.strongTimeout, this.softTimeout));
    }

    /**
     * Broadcasts a message to all connected clients
     *
     * @param message The message to send
     */
    public void broadcast(Object message) {
        this.clients.forEach(c -> c.enqueue(message, this.strongTimeout, this.softTimeout));
    }

    /**
     * Sends a message to all clients which match a given username
     *
     * @param user The username
     * @param jso  A {@link JSONStringer} containing the message to send
     */
    public void send(String user, JSONStringer jso) {
        this.clients.stream().filter(c -> c.user().getUsername().equalsIgnoreCase(user))
                .forEach(c -> c.enqueue(jso, this.strongTimeout, this.softTimeout));
    }

    /**
     * Sends a message to all clients which match a given username
     *
     * @param user    The username
     * @param message The message to send
     */
    public void send(String user, Object message) {
        this.clients.stream().filter(c -> c.user().getUsername().equalsIgnoreCase(user))
                .forEach(c -> c.enqueue(message, this.strongTimeout, this.softTimeout));
    }

    /**
     * Sends a message to all clients which match a given {@link PanelUser}
     *
     * @param user The user
     * @param jso  A {@link JSONStringer} containing the message to send
     */
    public void send(PanelUser user, JSONStringer jso) {
        this.clients.stream().filter(c -> c.user().equals(user))
                .forEach(c -> c.enqueue(jso, this.strongTimeout, this.softTimeout));
    }

    /**
     * Sends a message to all clients which match a given {@link PanelUser}
     *
     * @param user    The user
     * @param message The message to send
     */
    public void send(PanelUser user, Object message) {
        this.clients.stream().filter(c -> c.user().equals(user))
                .forEach(c -> c.enqueue(message, this.strongTimeout, this.softTimeout));
    }

    /**
     * Sends a message to the specified {@link Client}
     *
     * @param client The client
     * @param jso    A {@link JSONStringer} containing the message to send
     */
    public void send(Client client, JSONStringer jso) {
        client.enqueue(jso, this.strongTimeout, this.softTimeout);
    }

    /**
     * Sends a message to the specified {@link Client}
     *
     * @param client  The client
     * @param message The message to send
     */
    public void send(Client client, Object message) {
        client.enqueue(message, this.strongTimeout, this.softTimeout);
    }
}
