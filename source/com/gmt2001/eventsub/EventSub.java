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
package com.gmt2001.eventsub;

import com.gmt2001.Reflect;
import com.gmt2001.httpclient.HttpClient;
import com.gmt2001.httpclient.HttpClientResponse;
import com.gmt2001.httpwsserver.HttpRequestHandler;
import com.gmt2001.httpwsserver.HttpServerPageHandler;
import com.gmt2001.httpwsserver.auth.HttpAuthenticationHandler;
import io.netty.buffer.ByteBuf;
import io.netty.buffer.Unpooled;
import io.netty.channel.ChannelFutureListener;
import io.netty.channel.ChannelHandlerContext;
import io.netty.handler.codec.http.DefaultFullHttpResponse;
import io.netty.handler.codec.http.FullHttpRequest;
import static io.netty.handler.codec.http.HttpHeaderNames.CONNECTION;
import static io.netty.handler.codec.http.HttpHeaderValues.CLOSE;
import io.netty.handler.codec.http.HttpHeaders;
import io.netty.handler.codec.http.HttpMethod;
import io.netty.handler.codec.http.HttpResponseStatus;
import io.netty.handler.codec.http.HttpUtil;
import static io.netty.handler.codec.http.HttpVersion.HTTP_1_1;
import io.netty.util.CharsetUtil;
import java.io.IOException;
import java.lang.reflect.InvocationTargetException;
import java.net.URI;
import java.net.URISyntaxException;
import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.Base64;
import java.util.Collections;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.locks.ReentrantReadWriteLock;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;
import org.json.JSONStringer;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Schedulers;
import tv.phantombot.CaselessProperties;
import tv.phantombot.CaselessProperties.Transaction;
import tv.phantombot.PhantomBot;
import tv.phantombot.event.EventBus;

/**
 * Manages EventSub subscriptions
 *
 * @author gmt2001
 */
public final class EventSub implements HttpRequestHandler {

    /**
     * Constructor. Populates the existing subscription list from Twitch after 5 seconds. Schedules a task to remove handled messages from the
     * anti-duplicate map when they expire.
     */
    private EventSub() {
        ScheduledExecutorService svc = Executors.newSingleThreadScheduledExecutor();
        svc.schedule(() -> this.getSubscriptions(true), 5, TimeUnit.SECONDS);
        svc.scheduleWithFixedDelay(() -> this.cleanupDuplicates(), CLEANUP_INTERVAL.toMillis(), CLEANUP_INTERVAL.toMillis(), TimeUnit.MILLISECONDS);
    }

    private static final EventSub INSTANCE = new EventSub();
    private static final String BASE = "https://api.twitch.tv/helix/eventsub/subscriptions";
    private static final Duration CLEANUP_INTERVAL = Duration.ofMinutes(2);
    private static final Duration SUBSCRIPTION_RETRIEVE_INTERVAL = Duration.ofDays(1);
    private int subscription_total = 0;
    private int subscription_total_cost = 0;
    private int subscription_max_cost = 0;
    private final HttpEventSubAuthenticationHandler authHandler = new HttpEventSubAuthenticationHandler();
    private final ConcurrentMap<String, ZonedDateTime> handledMessages = new ConcurrentHashMap<>();
    private final ConcurrentMap<String, EventSubSubscription> subscriptions = new ConcurrentHashMap<>();
    private Instant lastSubscriptionRetrieval;
    private final ReentrantReadWriteLock rwl = new ReentrantReadWriteLock();

    /**
     * Singleton instance getter.
     *
     * @return
     */
    public static EventSub instance() {
        return EventSub.INSTANCE;
    }

    /**
     * Loads subscription types and registers HTTP handling.
     *
     * @return
     */
    @Override
    public HttpRequestHandler register() {
        Reflect.instance().loadPackageRecursive(EventSubSubscriptionType.class.getName().substring(0, EventSubSubscriptionType.class.getName().lastIndexOf('.')));
        Reflect.instance().getSubTypesOf(EventSubSubscriptionType.class).stream().forEachOrdered((c) -> {
            try {
                EventBus.instance().register(c.getDeclaredConstructor().newInstance());
            } catch (IllegalAccessException | IllegalArgumentException | InstantiationException | NoSuchMethodException | SecurityException | InvocationTargetException ex) {
                com.gmt2001.Console.err.printStackTrace(ex);
            }
        });
        HttpServerPageHandler.registerHttpHandler("/eventsub", this);
        return this;
    }

    @Override
    public HttpAuthenticationHandler getAuthHandler() {
        return this.authHandler;
    }

    @Override
    public void handleRequest(ChannelHandlerContext ctx, FullHttpRequest req) {
        if (!req.headers().contains("Twitch-Eventsub-Message-Type")) {
            DefaultFullHttpResponse res = new DefaultFullHttpResponse(HTTP_1_1, HttpResponseStatus.BAD_REQUEST, Unpooled.buffer());
            ByteBuf buf = Unpooled.copiedBuffer(res.status().toString(), CharsetUtil.UTF_8);
            res.content().writeBytes(buf);
            buf.release();
            HttpUtil.setContentLength(res, res.content().readableBytes());

            com.gmt2001.Console.debug.println("400");

            res.headers().set(CONNECTION, CLOSE);
            ctx.writeAndFlush(res).addListener(ChannelFutureListener.CLOSE);
            return;
        } else if (req.headers().get("Twitch-Eventsub-Message-Type").equals("notification")) {
            EventBus.instance().postAsync(new EventSubInternalNotificationEvent(req));
        } else if (req.headers().get("Twitch-Eventsub-Message-Type").equals("revocation")) {
            EventSubInternalRevocationEvent event = new EventSubInternalRevocationEvent(req);
            this.updateSubscription(event.getSubscription());
            EventBus.instance().postAsync(event);
        } else if (req.headers().get("Twitch-Eventsub-Message-Type").equals("webhook_callback_verification")) {
            EventSubInternalVerificationEvent event = new EventSubInternalVerificationEvent(req);
            this.updateSubscription(event.getSubscription());
            EventBus.instance().postAsync(event);
            DefaultFullHttpResponse res = new DefaultFullHttpResponse(HTTP_1_1, HttpResponseStatus.OK, Unpooled.buffer());
            ByteBuf buf = Unpooled.copiedBuffer(event.getChallenge(), CharsetUtil.UTF_8);
            res.content().writeBytes(buf);
            buf.release();
            HttpUtil.setContentLength(res, res.content().readableBytes());

            com.gmt2001.Console.debug.println("200");

            res.headers().set(CONNECTION, CLOSE);
            ctx.writeAndFlush(res).addListener(ChannelFutureListener.CLOSE);
            this.updateSubscription(event.getSubscription(), EventSubSubscription.SubscriptionStatus.ENABLED);
            return;
        } else {
            DefaultFullHttpResponse res = new DefaultFullHttpResponse(HTTP_1_1, HttpResponseStatus.NOT_FOUND, Unpooled.buffer());
            ByteBuf buf = Unpooled.copiedBuffer(res.status().toString(), CharsetUtil.UTF_8);
            res.content().writeBytes(buf);
            buf.release();
            HttpUtil.setContentLength(res, res.content().readableBytes());

            com.gmt2001.Console.debug.println("404");

            res.headers().set(CONNECTION, CLOSE);
            ctx.writeAndFlush(res).addListener(ChannelFutureListener.CLOSE);
            return;
        }

        DefaultFullHttpResponse res = new DefaultFullHttpResponse(HTTP_1_1, HttpResponseStatus.NO_CONTENT, Unpooled.buffer());
        HttpUtil.setContentLength(res, 0);

        com.gmt2001.Console.debug.println("204");

        res.headers().set(CONNECTION, CLOSE);
        ctx.writeAndFlush(res).addListener(ChannelFutureListener.CLOSE);
    }

    /**
     * Gets all EventSub subscriptions from the last API call. Retrieves the list again if it has been a while
     *
     * @return
     */
    public Map<String, EventSubSubscription> getSubscriptions() {
        return this.getSubscriptions(false);
    }

    /**
     * Gets all EventSub subscriptions from the last API call. Retrieves the list again if it has been a while or if forced
     *
     * @param force true to force a retrieval
     * @return
     */
    public Map<String, EventSubSubscription> getSubscriptions(boolean force) {
        this.doGetSubscriptions(force);
        return Collections.unmodifiableMap(this.subscriptions);
    }

    /**
     * Actually performs the getSubscriptions action
     *
     * @param force true to force a retrieval
     */
    private synchronized void doGetSubscriptions(boolean force) {
        if (force || this.lastSubscriptionRetrieval.isBefore(Instant.now().minus(SUBSCRIPTION_RETRIEVE_INTERVAL))) {
            Map<String, EventSubSubscription> n = new HashMap<>();
            this.getSubscriptionsFromAPI().doOnNext(s -> n.put(s.getId(), s)).doOnComplete(() -> {
                this.rwl.writeLock().lock();
                try {
                    this.subscriptions.clear();
                    this.subscriptions.putAll(n);
                } finally {
                    this.rwl.writeLock().unlock();
                }
            }).blockLast();
        }
    }

    /**
     * Gets all EventSub subscriptions from the API
     *
     * @return
     */
    public Flux<EventSubSubscription> getSubscriptionsFromAPI() {
        return this.getSubscriptionsFromAPI(null);
    }

    /**
     * Gets all EventSub subscriptions matching the status in filter from the API
     *
     * @param filter The status to match, null for all
     * @return
     */
    public Flux<EventSubSubscription> getSubscriptionsFromAPI(EventSubSubscription.SubscriptionStatus filter) {
        return Flux.<EventSubSubscription>create(emitter -> {
            try {
                JSONObject response = this.doRequest(HttpMethod.GET, filter != null ? "?status=" + filter.name().toLowerCase() : "", "");

                if (response.has("error")) {
                    emitter.error(new IOException(response.toString()));
                } else {
                    JSONArray arr = response.getJSONArray("data");
                    for (int i = 0; i < arr.length(); i++) {
                        emitter.next(EventSubSubscription.fromJSON(arr.getJSONObject(i)));
                    }

                    this.rwl.writeLock().lock();
                    try {
                        this.subscription_total = response.getInt("total");
                        this.subscription_total_cost = response.getInt("total_cost");
                        this.subscription_max_cost = response.getInt("max_total_cost");
                    } finally {
                        this.rwl.writeLock().unlock();
                    }
                    emitter.complete();
                }
            } catch (URISyntaxException | IOException | JSONException ex) {
                emitter.error(ex);
                com.gmt2001.Console.debug.println("Failed to get data [" + ex.getClass().getSimpleName() + "]: " + ex.getMessage());
            }
        }).publishOn(Schedulers.boundedElastic());
    }

    /**
     * Returns the total number of subscriptions. Only valid after a call to getSubscriptions
     *
     * @return
     */
    public int getTotalSubscriptionCount() {
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
    public int getTotalSubscriptionCost() {
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
    public int getSubscriptionCostLimit() {
        this.rwl.readLock().lock();
        try {
            return this.subscription_max_cost;
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
                JSONObject response = this.doRequest(HttpMethod.DELETE, "?id=" + id, "");

                if (response.has("error")) {
                    emitter.error(new IOException(response.toString()));
                } else {
                    if (this.subscriptions.containsKey(id)) {
                        this.updateSubscription(this.subscriptions.get(id), EventSubSubscription.SubscriptionStatus.API_REMOVED);
                    }
                    emitter.success();
                }
            } catch (URISyntaxException | IOException | JSONException ex) {
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
                request.key("type").value(proposedSubscription.getType());
                request.key("version").value(proposedSubscription.getVersion());
                request.key("condition").object();
                proposedSubscription.getCondition().entrySet().forEach(kvp -> {
                    request.key(kvp.getKey()).value(kvp.getValue());
                });
                request.endObject();
                request.key("transport").object();
                request.key("method").value(proposedSubscription.getTransport().getMethod());
                request.key("callback").value(proposedSubscription.getTransport().getCallback());
                request.key("secret").value(proposedSubscription.getTransport().getSecret());
                request.endObject();
                request.endObject();
                JSONObject response = this.doRequest(HttpMethod.POST, "", request.toString());

                if (response.has("error")) {
                    emitter.error(new IOException(response.toString()));
                } else {
                    EventSubSubscription subscription = EventSubSubscription.fromJSON(response.getJSONArray("data").getJSONObject(0));
                    this.updateSubscription(subscription);
                    emitter.success(subscription);
                }
            } catch (URISyntaxException | IOException | JSONException ex) {
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
    static String getSecret() {
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
            this.subscriptions.put(subscription.getId(), subscription);
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

    /**
     * Sends requests to Helix. Handles 401 responses by attempting to get a new token and trying again
     *
     * @param type The method to use
     * @param queryString The query string
     * @param post The post data
     * @return
     * @throws IOException
     * @throws JSONException
     * @throws URISyntaxException
     */
    private JSONObject doRequest(HttpMethod type, String queryString, String post) throws IOException, JSONException, URISyntaxException {
        URI url = URI.create(BASE + queryString);
        HttpHeaders headers = HttpClient.createHeaders(type, true);
        HttpClientResponse response = HttpClient.request(type, url, headers, post);
        JSONObject jso = response.json();

        if (jso.has("error") && jso.has("status") && jso.getInt("status") == 401) {
            PhantomBot.instance().getAppFlow().getNewToken();
            response = HttpClient.request(type, url, headers, post);
            jso = response.json();
        }

        return jso;
    }
}
