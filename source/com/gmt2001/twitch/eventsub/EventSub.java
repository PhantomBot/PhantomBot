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
import java.lang.reflect.Constructor;
import java.lang.reflect.InvocationTargetException;
import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.Base64;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;
import java.util.concurrent.ScheduledFuture;
import java.util.concurrent.SubmissionPublisher;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.locks.ReentrantReadWriteLock;

import javax.net.ssl.SSLException;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;
import org.json.JSONStringer;

import com.gmt2001.ExecutorService;
import com.gmt2001.Reflect;
import com.gmt2001.httpclient.URIUtil;
import com.gmt2001.ratelimiters.ExponentialBackoff;
import com.gmt2001.twitch.eventsub.EventSubSubscription.SubscriptionStatus;
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
import tv.phantombot.event.eventsub.EventSubDisconnectedEvent;
import tv.phantombot.event.eventsub.EventSubWelcomeEvent;
import tv.phantombot.event.twitch.TwitchOAuthReauthorizedEvent;
import tv.phantombot.twitch.api.Helix;
import tv.phantombot.twitch.api.TwitchValidate;

/**
 * Manages EventSub subscriptions
 *
 * @author gmt2001
 */
public final class EventSub extends SubmissionPublisher<EventSubInternalEvent> implements WsClientFrameHandler, Listener {

    /**
     * Constructor. Schedules a task to remove handled messages from the anti-duplicate map when they expire. Loads the subscription types. Starts the WebSocket connection
     */
    private EventSub() {
        debug("Starting EventSub");
        ExecutorService.schedule(() -> {
            try {
                Reflect.instance().loadPackageRecursive(EventSubSubscriptionType.class.getName().substring(0, EventSubSubscriptionType.class.getName().lastIndexOf('.')));
                Reflect.instance().getSubTypesOf(EventSubSubscriptionType.class).stream().forEachOrdered((c) -> {
                    for (Constructor<?> constructor : c.getConstructors()) {
                        if (constructor.getParameterCount() == 0) {
                            try {
                                constructor.newInstance();
                            } catch (InstantiationException | IllegalAccessException | IllegalArgumentException | InvocationTargetException ex) {
                                com.gmt2001.Console.err.printStackTrace(ex);
                            }
                        }
                    }
                });

                ExecutorService.submit(() -> {
                    this.refreshSubscriptions();
                });

                ExecutorService.schedule(() -> {
                    try {
                        if (TwitchValidate.instance().isAPIValid()) {
                            this.connect();
                        }
                    } catch (Exception ex) {
                        debug("constructor connect", ex);
                    }
                }, 15, TimeUnit.SECONDS);

                ExecutorService.scheduleWithFixedDelay(() -> this.cleanupDuplicates(), CLEANUP_INTERVAL.toMillis(), CLEANUP_INTERVAL.toMillis(), TimeUnit.MILLISECONDS);
            } catch (Exception ex) {
                debug("constructor", ex);
            }
        }, 100, TimeUnit.MILLISECONDS);
    }

    private static final Duration CLEANUP_INTERVAL = Duration.ofMinutes(2);
    private String session_id = null;
    private final ConcurrentMap<String, ZonedDateTime> handledMessages = new ConcurrentHashMap<>();
    private final ConcurrentMap<String, EventSubSubscription> subscriptions = new ConcurrentHashMap<>();
    private final ReentrantReadWriteLock rwl = new ReentrantReadWriteLock();
    private WSClient client = null;
    private WSClient oldClient = null;
    private boolean reconnecting = false;
    private Instant lastKeepAlive = Instant.MIN;
    private Duration keepaliveTimeout = Duration.ZERO;
    private ExponentialBackoff backoff = new ExponentialBackoff(Duration.ofSeconds(1), Duration.ofMinutes(5), Duration.ofSeconds(30));
    private ScheduledFuture<?> keepAliveFuture;
    private static final EventSub INSTANCE = new EventSub();

    /**
     * Singleton instance getter.
     *
     * @return
     */
    public static EventSub instance() {
        return EventSub.INSTANCE;
    }

    /**
     * Indicates if EventSub debug output is enabled
     *
     * @return
     */
    public static boolean debug() {
        /**
         * @botproperty eventsubdebug - If `true`, prints debug messages for EventSub. Default `false`
         * @botpropertycatsort eventsubdebug 750 900 Debug
         */
        return CaselessProperties.instance().getPropertyAsBoolean("eventsubdebug", false);
    }

    /**
     * Logs a debug message for EventSub
     *
     * @param message The message to log
     */
    public static void debug(String message) {
        debug(message, null);
    }

    /**
     * Logs a debug message for EventSub
     *
     * @param message The message to log
     * @param ex The exception to log
     */
    public static void debug(String message, Throwable ex) {
        if (debug()) {
            com.gmt2001.Console.debug.println(message);

            if (ex != null) {
                com.gmt2001.Console.debug.printStackTrace(ex);
            }
        }
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
     * Returns the WebSocket session ID
     *
     * @return
     */
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
                Helix.instance().deleteEventSubSubscriptionAsync(id).doOnSuccess(response -> {
                    if (response.has("error")) {
                        if (debug()) {
                            debug("deleteSubscription(" + id + ") error " + response.toString(4));
                        }
                        emitter.error(new IOException(response.toString()));
                    } else {
                        if (debug()) {
                            debug("deleteSubscription(" + id + ") success " + response.toString(4));
                        }
                        if (this.subscriptions.containsKey(id)) {
                            this.updateSubscription(this.subscriptions.get(id), EventSubSubscription.SubscriptionStatus.API_REMOVED);
                        }
                        emitter.success();
                    }
                }).doOnError(ex -> {
                    debug("deleteSubscription(" + id + ") doOnError", ex);
                    emitter.error(ex);
                    com.gmt2001.Console.debug.println("Failed to delete subscription [" + ex.getClass().getSimpleName() + "]: " + ex.getMessage());
                }).subscribe();
            } catch (IllegalArgumentException | JSONException ex) {
                debug("deleteSubscription(" + id + ") catch", ex);
                emitter.error(ex);
                com.gmt2001.Console.debug.println("Failed to delete subscription [" + ex.getClass().getSimpleName() + "]: " + ex.getMessage());
            }
        }).publishOn(Schedulers.boundedElastic());
    }

    /**
     * Refreshes the internal list of existing subscriptions
     */
    public void refreshSubscriptions() {
        this.refreshSubscriptions(null).subscribe();
    }

    /**
     * Refreshes the internal list of existing subscriptions
     *
     * @param after The pagination cursor
     */
    private Mono<JSONObject> refreshSubscriptions(String after) {
        return Helix.instance().getEventSubSubscriptionsAsync(null, null, null, after).doOnSuccess(response -> {
            if (response.has("error")) {
                if (debug()) {
                    debug("refreshSubscriptions(" + after + ") error " + response.toString(4));
                }
            } else {
                if (debug()) {
                    debug("refreshSubscriptions(" + after + ") success " + response.toString(4));
                }

                JSONArray jsa = response.getJSONArray("data");

                for (int i = 0; i < jsa.length(); i++) {
                    EventSubSubscription subscription = EventSubSubscription.fromJSON(jsa.getJSONObject(i));
                    this.updateSubscription(subscription);
                }

                JSONObject pagination = response.getJSONObject("pagination");
                if (pagination.has("cursor") && !pagination.isNull("cursor")) {
                    this.refreshSubscriptions(pagination.getString("cursor"));
                } else {
                    this.cleanupSubscriptions();
                }
            }
        }).doOnError(ex -> {
            debug("refreshSubscriptions(" + after + ") doOnError", ex);
            com.gmt2001.Console.debug.println("Failed to refresh subscriptions [" + ex.getClass().getSimpleName() + "]: " + ex.getMessage());
        });
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

                Helix.instance().createEventSubSubscriptionAsync(request.toString()).doOnSuccess(response -> {
                    if (response.has("error")) {
                        if (debug()) {
                            debug("createSubscription(" + proposedSubscription.type() + ") error " + response.toString(4));
                        }
                        emitter.error(new IOException(response.toString()));
                    } else {
                        if (debug()) {
                            debug("createSubscription(" + proposedSubscription.type() + ") success " + response.toString(4));
                        }
                        EventSubSubscription subscription = EventSubSubscription.fromJSON(response.getJSONArray("data").getJSONObject(0));
                        this.updateSubscription(subscription);
                        emitter.success(subscription);
                    }
                }).doOnError(ex -> {
                    debug("createSubscription(" + proposedSubscription.type() + ") doOnError", ex);
                    emitter.error(ex);
                    com.gmt2001.Console.debug.println("Failed to create subscription [" + ex.getClass().getSimpleName() + "]: " + ex.getMessage());
                }).subscribe();
            } catch (IllegalArgumentException | JSONException ex) {
                debug("createSubscription(" + proposedSubscription.type() + ") catch", ex);
                emitter.error(ex);
                com.gmt2001.Console.debug.println("Failed to create subscription [" + ex.getClass().getSimpleName() + "]: " + ex.getMessage());
            }
        }).publishOn(Schedulers.boundedElastic());
    }

    /**
     * Parses a date from an EventSub message into a {@link ZonedDateTime}
     *
     * @param date A date string to parse in RFC3339 format
     * @return
     */
    public static ZonedDateTime parseDate(String date) {
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
        this.subscriptions.put(subscription.id(), subscription);
    }

    /**
     * Removes non-enabled subscriptions from the subscription list
     */
    private void cleanupSubscriptions() {
        this.subscriptions.forEach((id, subscription) -> {
            if (subscription.status() != SubscriptionStatus.ENABLED) {
                this.subscriptions.remove(id);
            }
        });
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

    /**
     * Checks if the Keep-Alive timeout has been reached
     */
    private void checkKeepAlive() {
        boolean shouldReconnect = false;
        this.rwl.readLock().lock();
        try {
            shouldReconnect = this.lastKeepAlive != Instant.MIN && Duration.between(this.lastKeepAlive, Instant.now()).compareTo(this.keepaliveTimeout) > 0;
        } finally {
            this.rwl.readLock().unlock();
        }

        if (shouldReconnect) {
            debug("KeepAlive Failed");
            this.reconnecting = false;
            if (this.backoff != null) {
                this.backoff.BackoffOnceAsync(this::reconnect);
            }
        }
    }

    /**
     * Restarts EventSub when the API OAuth is re-authorized manually
     *
     * @param event The event object
     */
    @Handler
    public void onTwitchOAuthReauthorizedEvent(TwitchOAuthReauthorizedEvent event) {
        if (event.isAPI()) {
            debug("APIOAuth Reauthorized");
            this.reconnecting = false;
            this.connect();
        }
    }

    /**
     * Restarts the EventSub connection
     */
    public void reconnect() {
        this.connect();
    }

    /**
     * Connects to EventSub
     */
    private void connect() {
        this.connect("wss://eventsub.wss.twitch.tv/ws");
    }

    /**
     * Connects to EventSub at the specified URI
     *
     * @param uri The URI to connect to
     */
    private synchronized void connect(String uri) {
        if (!this.reconnecting) {
            if (this.client != null) {
                if (this.client.connected()) {
                    this.client.close();
                }
            }

            this.rwl.writeLock().lock();
            try {
                List<Mono<Void>> deleteList = new ArrayList<>();
                this.subscriptions.forEach((id, subscription) -> {
                    deleteList.add(this.deleteSubscription(id).timeout(Duration.ofSeconds(15)));
                });
                this.subscriptions.clear();
                this.session_id = null;
                this.lastKeepAlive = Instant.MIN;
                if (this.keepAliveFuture != null) {
                    this.keepAliveFuture.cancel(true);
                }
                Mono.whenDelayError(deleteList).block();
            } catch (Exception ex) {
                com.gmt2001.Console.err.logStackTrace(ex);
            } finally {
                this.rwl.writeLock().unlock();
            }
        } else {
            this.oldClient = this.client;
        }

        ExecutorService.schedule(() -> {
            debug("Connecting...");

            try {
                this.client = new WSClient(URIUtil.create(uri), this);
                this.client.connect();
            } catch (InterruptedException | SSLException ex) {
                com.gmt2001.Console.err.printStackTrace(ex);
            }
        }, 250, TimeUnit.MILLISECONDS);
    }

    /**
     * Parses an EventSub websocket message
     *
     * @param jso The JSON data to parse
     */
    private void handleMessage(JSONObject jso) {
        boolean handled = false;
        if (debug()) {
            debug("handleMessage jso " + jso.toString(4));
        }
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
                                                handled = true;
                                                this.rwl.writeLock().lock();
                                                try {
                                                    this.session_id = session.getString("id");
                                                    this.keepaliveTimeout = Duration.ofSeconds(session.getLong("keepalive_timeout_seconds")).plusSeconds(1);
                                                    this.lastKeepAlive = Instant.now();
                                                    this.keepAliveFuture = ExecutorService.scheduleAtFixedRate(() -> this.checkKeepAlive(), this.keepaliveTimeout.toMillis(), this.keepaliveTimeout.toMillis(), TimeUnit.MILLISECONDS);
                                                } finally {
                                                    this.rwl.writeLock().unlock();
                                                }

                                                debug("handleMessage welcome " + (this.reconnecting ? " (reconnecting) " : ""));

                                                EventBus.instance().postAsync(new EventSubWelcomeEvent(this.reconnecting));

                                                if (this.reconnecting) {
                                                    this.refreshSubscriptions();
                                                    this.reconnecting = false;
                                                    this.oldClient.close(WebSocketCloseStatus.NORMAL_CLOSURE);
                                                }
                                            }
                                        }
                                        break;
                                    case "session_keepalive":
                                        handled = true;
                                        this.rwl.writeLock().lock();
                                        try {
                                            this.lastKeepAlive = Instant.now();
                                        } finally {
                                            this.rwl.writeLock().unlock();
                                        }
                                        debug("handleMessage keepalive");
                                        break;
                                    case "session_reconnect ":
                                        if (payload.has("session")) {
                                            JSONObject session = payload.getJSONObject("session");
                                            if (session.has("reconnect_url")) {
                                                handled = true;
                                                this.rwl.writeLock().lock();
                                                try {
                                                    this.lastKeepAlive = Instant.now();
                                                } finally {
                                                    this.rwl.writeLock().unlock();
                                                }

                                                debug("handleMessage reconnect");

                                                com.gmt2001.Console.out.println("EventSub received a force-reconnect. Reconnect will be attempted in " + Duration.ofMillis(this.backoff.GetNextInterval()).toString());

                                                this.reconnecting = true;
                                                this.connect(session.getString("reconnect_url"));
                                            }
                                        }
                                        break;
                                    case "revocation":
                                        handled = true;
                                        debug("handleMessage revoked");
                                        EventSubInternalRevocationEvent event = new EventSubInternalRevocationEvent(metadata, payload);
                                        this.updateSubscription(event.subscription());
                                        this.submit(event);
                                        break;
                                    case "notification":
                                        handled = true;
                                        debug("handleMessage notification");
                                        this.rwl.writeLock().lock();
                                        try {
                                            this.lastKeepAlive = Instant.now();
                                        } finally {
                                            this.rwl.writeLock().unlock();
                                        }
                                        this.submit(new EventSubInternalNotificationEvent(metadata, payload));
                                        break;
                                }
                            }
                        } else {
                            debug("handleMessage duplicate " + message_id);
                        }
                    }
                }
            }
        }

        if (!handled) {
            debug("handleMessage !handled");
        }
    }

    @Override
    public void handleFrame(ChannelHandlerContext ctx, WebSocketFrame frame) {
        if (frame instanceof PingWebSocketFrame) {
            debug("handleFrame PING");
            PingWebSocketFrame pingFrame = (PingWebSocketFrame) frame;
            this.client.send(new PongWebSocketFrame(pingFrame.content()));
        } else if (frame instanceof CloseWebSocketFrame) {
            debug("handleFrame CLOSE");
            CloseWebSocketFrame closeFrame = (CloseWebSocketFrame) frame;
            com.gmt2001.Console.out.println("EventSub connection closed [" + closeFrame.statusCode() +"] " + closeFrame.reasonText());
        } else if (frame instanceof TextWebSocketFrame) {
            TextWebSocketFrame textFrame = (TextWebSocketFrame) frame;
            try {
                debug("handleFrame TEXT");
                handleMessage(new JSONObject(textFrame.text()));
            } catch (JSONException ex) {
                com.gmt2001.Console.err.printStackTrace(ex);
            }
        }
    }

    @Override
    public void handshakeComplete(ChannelHandlerContext ctx) {
        debug("handshakeComplete");
        com.gmt2001.Console.out.println("EventSub connected");
    }

    @Override
    public void onClose() {
        if (this.oldClient != null && !this.oldClient.connected()) {
            debug("onClose oldClient");
            this.oldClient = null;
        }
        if (this.client != null && !this.client.connected()) {
            debug("onClose client");
            this.rwl.writeLock().lock();
            try {
                this.session_id = null;
                this.lastKeepAlive = Instant.MIN;
                if (this.keepAliveFuture != null) {
                    this.keepAliveFuture.cancel(true);
                }
                EventBus.instance().postAsync(new EventSubDisconnectedEvent());
                if (this.backoff != null) {
                    com.gmt2001.Console.out.println("EventSub connection closed. Reconnect will be attempted in " + Duration.ofMillis(this.backoff.GetNextInterval()).toString());
                    this.backoff.BackoffOnceAsync(this::reconnect);
                } else {
                    com.gmt2001.Console.out.println("EventSub connection closed");
                }
            } finally {
                this.rwl.writeLock().unlock();
            }
            this.client = null;
        }
    }

    /**
     * Shuts down EventSub
     */
    public void shutdown() {
        if (this.client != null) {
            this.backoff = null;
            this.client.close(WebSocketCloseStatus.NORMAL_CLOSURE);
        }
    }
}
