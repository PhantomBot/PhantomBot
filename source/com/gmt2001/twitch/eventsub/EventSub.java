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
package com.gmt2001.twitch.eventsub;

import java.io.IOException;
import java.lang.reflect.InvocationTargetException;
import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.Base64;
import java.util.Collections;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;
import java.util.concurrent.ScheduledFuture;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.locks.ReentrantReadWriteLock;

import javax.net.ssl.SSLException;

import org.json.JSONException;
import org.json.JSONObject;
import org.json.JSONStringer;

import com.gmt2001.ExecutorService;
import com.gmt2001.Reflect;
import com.gmt2001.httpclient.URIUtil;
import com.gmt2001.wsclient.WSClient;
import com.gmt2001.wsclient.WsClientFrameHandler;

import io.netty.channel.ChannelHandlerContext;
import io.netty.handler.codec.http.websocketx.CloseWebSocketFrame;
import io.netty.handler.codec.http.websocketx.PingWebSocketFrame;
import io.netty.handler.codec.http.websocketx.PongWebSocketFrame;
import io.netty.handler.codec.http.websocketx.TextWebSocketFrame;
import io.netty.handler.codec.http.websocketx.WebSocketCloseStatus;
import io.netty.handler.codec.http.websocketx.WebSocketFrame;
import net.engio.mbassy.listener.Handler;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Schedulers;
import tv.phantombot.CaselessProperties;
import tv.phantombot.CaselessProperties.Transaction;
import tv.phantombot.event.EventBus;
import tv.phantombot.event.Listener;
import tv.phantombot.event.eventsub.EventSubWelcomeEvent;
import tv.phantombot.event.twitch.TwitchOAuthReauthorizedEvent;
import tv.phantombot.twitch.api.Helix;

/**
 * Manages EventSub subscriptions
 *
 * @author gmt2001
 */
public final class EventSub implements WsClientFrameHandler, Listener {

    /**
     * Constructor. Populates the existing subscription list from Twitch after 5 seconds. Schedules a task to remove handled messages from the
     * anti-duplicate map when they expire.
     */
    private EventSub() {
        ExecutorService.scheduleWithFixedDelay(() -> this.cleanupDuplicates(), CLEANUP_INTERVAL.toMillis(), CLEANUP_INTERVAL.toMillis(), TimeUnit.MILLISECONDS);
        Reflect.instance().loadPackageRecursive(EventSubSubscriptionType.class.getName().substring(0, EventSubSubscriptionType.class.getName().lastIndexOf('.')));
        Reflect.instance().getSubTypesOf(EventSubSubscriptionType.class).stream().forEachOrdered((c) -> {
            try {
                EventBus.instance().register(c.getDeclaredConstructor().newInstance());
            } catch (IllegalAccessException | IllegalArgumentException | InstantiationException | NoSuchMethodException | SecurityException | InvocationTargetException ex) {
                com.gmt2001.Console.err.printStackTrace(ex);
            }
        });

        this.connect();
    }

    private static final EventSub INSTANCE = new EventSub();
    private static final Duration CLEANUP_INTERVAL = Duration.ofMinutes(2);
    private int subscription_total = 0;
    private int subscription_total_cost = 0;
    private int subscription_max_cost = 0;
    private String session_id = null;
    private final ConcurrentMap<String, ZonedDateTime> handledMessages = new ConcurrentHashMap<>();
    private final ConcurrentMap<String, EventSubSubscription> subscriptions = new ConcurrentHashMap<>();
    private final ReentrantReadWriteLock rwl = new ReentrantReadWriteLock();
    private WSClient client = null;
    private WSClient oldClient = null;
    private boolean reconnecting = false;
    private Instant lastKeepAlive = Instant.MIN;
    private Duration keepaliveTimeout = Duration.ZERO;
    private ScheduledFuture keepAliveFuture;

    /**
     * Singleton instance getter.
     *
     * @return
     */
    public static EventSub instance() {
        return EventSub.INSTANCE;
    }

    /**
     * Gets all current EventSub subscriptions
     *
     * @return
     */
    public Map<String, EventSubSubscription> subscriptions() {
        return Collections.unmodifiableMap(this.subscriptions);
    }

    /**
     * Returns the total number of subscriptions. Only valid after a call to getSubscriptions
     *
     * @return
     */
    public int totalSubscriptionCount() {
        this.rwl.readLock().lock();
        try {
            return this.subscription_total;
        } finally {
            this.rwl.readLock().unlock();
        }
    }

    /**
     * Returns the total cost of all subscriptions. Only valid after a call to getSubscriptions
     *
     * @return
     */
    public int totalSubscriptionCost() {
        this.rwl.readLock().lock();
        try {
            return this.subscription_total_cost;
        } finally {
            this.rwl.readLock().unlock();
        }
    }

    /**
     * Returns the cost limit for subscriptions. Only valid after a call to getSubscriptions
     *
     * @return
     */
    public int subscriptionCostLimit() {
        this.rwl.readLock().lock();
        try {
            return this.subscription_max_cost;
        } finally {
            this.rwl.readLock().unlock();
        }
    }

    public String sessionId() {
        this.rwl.readLock().lock();
        try {
            return this.session_id;
        } finally {
            this.rwl.readLock().unlock();
        }
    }

    /**
     * Deletes a subscription
     *
     * @param id The id of the subscription to delete
     * @return
     */
    public Mono<Void> deleteSubscription(String id) {
        return Mono.<Void>create(emitter -> {
            try {
                Helix.instance().deleteEventSubSubscription(id).doOnSuccess(response -> {
                    if (response.has("error")) {
                        emitter.error(new IOException(response.toString()));
                    } else {
                        if (this.subscriptions.containsKey(id)) {
                            this.updateSubscription(this.subscriptions.get(id), EventSubSubscription.SubscriptionStatus.API_REMOVED);
                        }
                        emitter.success();
                    }
                }).doOnError(ex -> {
                    emitter.error(ex);
                    com.gmt2001.Console.debug.println("Failed to delete subscription [" + ex.getClass().getSimpleName() + "]: " + ex.getMessage());
                }).subscribe();
            } catch (IllegalArgumentException | JSONException ex) {
                emitter.error(ex);
                com.gmt2001.Console.debug.println("Failed to delete subscription [" + ex.getClass().getSimpleName() + "]: " + ex.getMessage());
            }
        }).publishOn(Schedulers.boundedElastic());
    }

    /**
     * Performs the create action for an {@link EventSubSubscriptionType}
     *
     * @param proposedSubscription The {@link EventSubSubscription} spec to create
     * @return The new subscription
     */
    Mono<EventSubSubscription> createSubscription(EventSubSubscription proposedSubscription) {
        return Mono.<EventSubSubscription>create(emitter -> {
            try {
                JSONStringer request = new JSONStringer();
                request.object();
                request.key("type").value(proposedSubscription.type());
                request.key("version").value(proposedSubscription.version());
                request.key("condition").object();
                proposedSubscription.condition().entrySet().forEach(kvp -> {
                    request.key(kvp.getKey()).value(kvp.getValue());
                });
                request.endObject();
                request.key("transport").object();
                request.key("method").value(proposedSubscription.transport().method());
                if (proposedSubscription.transport().hasCallback()) {
                    request.key("callback").value(proposedSubscription.transport().callback());
                }
                if (proposedSubscription.transport().hasSecret()) {
                    request.key("secret").value(proposedSubscription.transport().secret());
                }
                if (proposedSubscription.transport().hasSessionId()) {
                    request.key("session_id").value(proposedSubscription.transport().sessionId());
                }
                request.endObject();
                request.endObject();

                Helix.instance().createEventSubSubscription(request.toString()).doOnSuccess(response -> {
                    if (response.has("error")) {
                        emitter.error(new IOException(response.toString()));
                    } else {
                        EventSubSubscription subscription = EventSubSubscription.fromJSON(response.getJSONArray("data").getJSONObject(0));
                        this.updateSubscription(subscription);
                        emitter.success(subscription);
                    }
                }).doOnError(ex -> {
                    emitter.error(ex);
                    com.gmt2001.Console.debug.println("Failed to create subscription [" + ex.getClass().getSimpleName() + "]: " + ex.getMessage());
                }).subscribe();
            } catch (IllegalArgumentException | JSONException ex) {
                emitter.error(ex);
                com.gmt2001.Console.debug.println("Failed to create subscription [" + ex.getClass().getSimpleName() + "]: " + ex.getMessage());
            }
        }).publishOn(Schedulers.boundedElastic());
    }

    /**
     * Parses a date from an EventSub message into a {@link ZonedDateTime}
     *
     * @param date
     * @return
     */
    static ZonedDateTime parseDate(String date) {
        try {
            return ZonedDateTime.parse(date, DateTimeFormatter.ISO_OFFSET_DATE_TIME);
        } catch (DateTimeParseException ex) {
            com.gmt2001.Console.err.printStackTrace(ex);
        }

        return ZonedDateTime.now();
    }

    /**
     * Retrieves the secret used for signature verification
     *
     * @return
     */
    static String secret() {
        return CaselessProperties.instance().getProperty("appsecret", EventSub::generateSecret);
    }

    /**
     * Generates and stores a new secret for signature verification
     *
     * @return
     */
    private static String generateSecret() {
        Transaction transaction = CaselessProperties.instance().startTransaction(Transaction.PRIORITY_NORMAL);
        byte[] secret = new byte[64];
        SecureRandom rand = new SecureRandom();

        rand.nextBytes(secret);

        String ssecret = Base64.getEncoder().encodeToString(secret);

        transaction.setProperty("appsecret", ssecret);
        transaction.commit();

        return ssecret;
    }

    /**
     * Checks if the specified message has already been handled
     *
     * @param messageId The message id to check
     * @param timestamp The timestamp of the message
     * @return
     */
    boolean isDuplicate(String messageId, ZonedDateTime timestamp) {
        return this.handledMessages.putIfAbsent(messageId, timestamp) != null;
    }

    /**
     * Updates the local {@link EventSubSubscription} object with a new status
     *
     * @param subscription The subscription to update
     * @param newStatus The new status
     */
    private void updateSubscription(EventSubSubscription subscription, EventSubSubscription.SubscriptionStatus newStatus) {
        this.updateSubscription(subscription.clone(newStatus));
    }

    /**
     * Adds/updates an {@link EventSubSubscription} in the local cache and updates the subscription total
     *
     * @param subscription The subscription to add/update
     */
    private void updateSubscription(EventSubSubscription subscription) {
        this.rwl.writeLock().lock();
        try {
            this.subscriptions.put(subscription.id(), subscription);
            this.subscription_total = this.subscriptions.size();
        } finally {
            this.rwl.writeLock().unlock();
        }
    }

    /**
     * Removes expired message ids from the duplicate list
     */
    private void cleanupDuplicates() {
        ZonedDateTime expires = ZonedDateTime.now();
        this.handledMessages.forEach((id, ts) -> {
            if (ts.isBefore(expires)) {
                this.handledMessages.remove(id);
            }
        });
    }

    private void checkKeepAlive() {
        this.rwl.readLock().lock();
        try {
            if (this.lastKeepAlive != Instant.MIN && Duration.between(this.lastKeepAlive, Instant.now()).compareTo(this.keepaliveTimeout) > 0) {
                this.reconnecting = false;
                this.reconnect();
            }
        } finally {
            this.rwl.readLock().unlock();
        }
    }

    @Handler
    public void onTwitchOAuthReauthorizedEvent(TwitchOAuthReauthorizedEvent event) {
        if (event.isAPI()) {
            this.reconnecting = false;
            this.connect();
        }
    }

    public void reconnect() {
        this.connect();
    }

    private void connect() {
        this.connect("wss://eventsub-beta.wss.twitch.tv/ws");
    }

    private synchronized void connect(String uri) {
        if (!this.reconnecting) {
            if (this.client != null) {
                if (this.client.connected()) {
                    this.client.close();
                }
            }

            this.rwl.writeLock().lock();
            try {
                this.subscription_max_cost = 0;
                this.subscription_total = 0;
                this.subscription_total_cost = 0;
                this.subscriptions.clear();
                this.session_id = null;
                this.lastKeepAlive = Instant.MIN;
                this.keepAliveFuture.cancel(true);
            } finally {
                this.rwl.writeLock().unlock();
            }
        } else {
            this.oldClient = this.client;
        }

        try {
            this.client = new WSClient(URIUtil.create(uri), this);
            this.client.connect();
        } catch (InterruptedException | SSLException ex) {
            com.gmt2001.Console.err.printStackTrace(ex);
        }
    }

    private void handleMessage(JSONObject jso) {
        if (jso.has("metadata")) {
            JSONObject metadata = jso.getJSONObject("metadata");
            if (jso.has("payload")) {
                JSONObject payload = jso.getJSONObject("payload");
                if (metadata.has("message_id")) {
                    String message_id = metadata.getString("message_id");
                    if (metadata.has("message_timestamp")) {
                        ZonedDateTime message_timestamp = parseDate(metadata.getString("message_timestamp"));
                        if (!this.isDuplicate(message_id, message_timestamp)) {
                            if (metadata.has("message_type")) {
                                String message_type = metadata.getString("message_type");
                                switch (message_type) {
                                    case "session_welcome":
                                        if (payload.has("session")) {
                                            JSONObject session = payload.getJSONObject("session");
                                            if (session.has("id")) {
                                                this.rwl.writeLock().lock();
                                                try {
                                                    this.session_id = session.getString("id");
                                                    this.keepaliveTimeout = Duration.ofSeconds(session.getLong("keepalive_timeout_seconds"));
                                                    this.lastKeepAlive = Instant.now();
                                                    this.keepAliveFuture = ExecutorService.scheduleAtFixedRate(() -> this.checkKeepAlive(), this.keepaliveTimeout.toMillis(), this.keepaliveTimeout.toMillis(), TimeUnit.MILLISECONDS);
                                                } finally {
                                                    this.rwl.writeLock().unlock();
                                                }

                                                EventBus.instance().postAsync(new EventSubWelcomeEvent(this.reconnecting));

                                                if (this.reconnecting) {
                                                    this.reconnecting = false;
                                                    this.oldClient.close(WebSocketCloseStatus.NORMAL_CLOSURE);
                                                }
                                            }
                                        }
                                        break;
                                    case "session_keepalive":
                                        this.rwl.writeLock().lock();
                                        try {
                                            this.lastKeepAlive = Instant.now();
                                        } finally {
                                            this.rwl.writeLock().unlock();
                                        }
                                        break;
                                    case "session_reconnect ":
                                        if (payload.has("session")) {
                                            JSONObject session = payload.getJSONObject("session");
                                            if (session.has("reconnect_url")) {
                                                this.rwl.writeLock().lock();
                                                try {
                                                    this.lastKeepAlive = Instant.now();
                                                } finally {
                                                    this.rwl.writeLock().unlock();
                                                }

                                                this.reconnecting = true;
                                                this.connect(session.getString("reconnect_url"));
                                            }
                                        }
                                        break;
                                    case "revocation":
                                        EventSubInternalRevocationEvent event = new EventSubInternalRevocationEvent(metadata, payload);
                                        this.updateSubscription(event.subscription());
                                        EventBus.instance().postAsync(event);
                                        break;
                                    case "notification":
                                        this.rwl.writeLock().lock();
                                        try {
                                            this.lastKeepAlive = Instant.now();
                                        } finally {
                                            this.rwl.writeLock().unlock();
                                        }
                                        EventBus.instance().postAsync(new EventSubInternalNotificationEvent(metadata, payload));
                                        break;
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    @Override
    public void handleFrame(ChannelHandlerContext ctx, WebSocketFrame frame) {
        if (frame instanceof PingWebSocketFrame) {
            PingWebSocketFrame pingFrame = (PingWebSocketFrame) frame;
            this.client.send(new PongWebSocketFrame(pingFrame.content()));
        } else if (frame instanceof CloseWebSocketFrame) {
            CloseWebSocketFrame closeFrame = (CloseWebSocketFrame) frame;
            com.gmt2001.Console.out.println("EventSub connection closed [" + closeFrame.statusCode() +"] " + closeFrame.reasonText());
        } else if (frame instanceof TextWebSocketFrame) {
            TextWebSocketFrame textFrame = (TextWebSocketFrame) frame;
            try {
                handleMessage(new JSONObject(textFrame.text()));
            } catch (JSONException ex) {
                com.gmt2001.Console.err.printStackTrace(ex);
            }
        }
    }

    @Override
    public void handshakeComplete(ChannelHandlerContext ctx) {
    }

    @Override
    public void onClose() {
        this.rwl.writeLock().lock();
        try {
            this.session_id = null;
            this.lastKeepAlive = Instant.MIN;
            this.keepAliveFuture.cancel(true);
        } finally {
            this.rwl.writeLock().unlock();
        }
    }
}
