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
import com.gmt2001.httpclient.HttpUrl;
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
import java.net.URISyntaxException;
import java.security.SecureRandom;
import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.time.Duration;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.Base64;
import java.util.Calendar;
import java.util.Collections;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.TimeZone;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;
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
 *
 * @author gmt2001
 */
public final class EventSub implements HttpRequestHandler {

    private EventSub() {
        Mono.delay(Duration.ofSeconds(5), Schedulers.boundedElastic()).doOnNext(l -> this.getSubscriptions(true)).subscribe();
        Flux.interval(Duration.ofMillis(CLEANUP_INTERVAL), Schedulers.boundedElastic()).doOnNext(l -> this.cleanupDuplicates()).onErrorContinue((e, o) -> com.gmt2001.Console.err.printStackTrace(e)).subscribe();
    }

    private static final EventSub INSTANCE = new EventSub();
    private static final String BASE = "https://api.twitch.tv/helix/eventsub/subscriptions";
    private static final long CLEANUP_INTERVAL = 120000L;
    private static final int SUBSCRIPTION_RETRIEVE_INTERVAL = 86400;
    private int subscription_total = 0;
    private int subscription_total_cost = 0;
    private int subscription_max_cost = 0;
    private final HttpEventSubAuthenticationHandler authHandler = new HttpEventSubAuthenticationHandler();
    private final ConcurrentMap<String, Date> handledMessages = new ConcurrentHashMap<>();
    private List<EventSubSubscription> subscriptions = Collections.emptyList();
    private Date lastSubscriptionRetrieval;

    public static EventSub instance() {
        return EventSub.INSTANCE;
    }

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
            EventBus.instance().postAsync(new EventSubInternalRevocationEvent(req));
        } else if (req.headers().get("Twitch-Eventsub-Message-Type").equals("webhook_callback_verification")) {
            EventSubInternalVerificationEvent event = new EventSubInternalVerificationEvent(req);
            EventBus.instance().postAsync(event);
            DefaultFullHttpResponse res = new DefaultFullHttpResponse(HTTP_1_1, HttpResponseStatus.OK, Unpooled.buffer());
            ByteBuf buf = Unpooled.copiedBuffer(event.getChallenge(), CharsetUtil.UTF_8);
            res.content().writeBytes(buf);
            buf.release();
            HttpUtil.setContentLength(res, res.content().readableBytes());

            com.gmt2001.Console.debug.println("200");

            res.headers().set(CONNECTION, CLOSE);
            ctx.writeAndFlush(res).addListener(ChannelFutureListener.CLOSE);
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
    public List<EventSubSubscription> getSubscriptions() {
        return this.getSubscriptions(false);
    }

    /**
     * Gets all EventSub subscriptions from the last API call. Retrieves the list again if it has been a while or if forced
     *
     * @param force true to force a retrieval
     * @return
     */
    public List<EventSubSubscription> getSubscriptions(boolean force) {
        this.doGetSubscriptions(force);
        return this.subscriptions;
    }

    private synchronized void doGetSubscriptions(boolean force) {
        Calendar c = Calendar.getInstance(TimeZone.getTimeZone(ZoneOffset.UTC));
        c.add(Calendar.SECOND, -EventSub.SUBSCRIPTION_RETRIEVE_INTERVAL);

        if (force || this.lastSubscriptionRetrieval.before(c.getTime())) {
            List<EventSubSubscription> n = new ArrayList<>();
            this.getSubscriptionsFromAPI().doOnNext(n::add).doOnComplete(() -> {
                this.subscriptions = Collections.unmodifiableList(n);
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
                        emitter.next(EventSub.JSONToEventSubSubscription(arr.getJSONObject(i)));
                    }

                    this.subscription_total = response.getInt("total");
                    this.subscription_total_cost = response.getInt("total_cost");
                    this.subscription_max_cost = response.getInt("max_total_cost");
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
        return this.subscription_total;
    }

    /**
     * Returns the total cost of all subscriptions. Only valid after a call to getSubscriptions
     *
     * @return
     */
    public int getTotalSubscriptionCost() {
        return this.subscription_total_cost;
    }

    /**
     * Returns the cost limit for subscriptions. Only valid after a call to getSubscriptions
     *
     * @return
     */
    public int getSubscriptionCostLimit() {
        return this.subscription_max_cost;
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
                    emitter.success();
                }
            } catch (URISyntaxException | IOException | JSONException ex) {
                emitter.error(ex);
                com.gmt2001.Console.debug.println("Failed to delete subscription [" + ex.getClass().getSimpleName() + "]: " + ex.getMessage());
            }
        }).publishOn(Schedulers.boundedElastic());
    }

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
                    JSONArray arr = response.getJSONArray("data");
                    JSONObject subscription = arr.getJSONObject(0);
                    Map<String, String> condition = new HashMap<>();

                    subscription.getJSONObject("condition").keySet().forEach(key -> condition.put(key, subscription.getJSONObject("condition").getString(key)));

                    emitter.success(new EventSubSubscription(
                            subscription.getString("id"), subscription.getString("status"), subscription.getString("type"), subscription.getString("version"),
                            subscription.getInt("cost"), condition, subscription.getString("created_at"),
                            new EventSubTransport(subscription.getJSONObject("transport").getString("method"), subscription.getJSONObject("transport").getString("callback"))
                    ));
                }
            } catch (URISyntaxException | IOException | JSONException ex) {
                emitter.error(ex);
                com.gmt2001.Console.debug.println("Failed to create subscription [" + ex.getClass().getSimpleName() + "]: " + ex.getMessage());
            }
        }).publishOn(Schedulers.boundedElastic());
    }

    static EventSubSubscription JSONToEventSubSubscription(JSONObject subscription) {
        Map<String, String> condition = new HashMap<>();

        subscription.getJSONObject("condition").keySet().forEach(key -> condition.put(key, subscription.getJSONObject("condition").getString(key)));

        return new EventSubSubscription(
                subscription.getString("id"), subscription.getString("status"), subscription.getString("type"), subscription.getString("version"),
                subscription.getInt("cost"), condition, subscription.getString("created_at"),
                new EventSubTransport(subscription.getJSONObject("transport").getString("method"), subscription.getJSONObject("transport").getString("callback"))
        );
    }

    static Date parseDate(String date) {
        try {
            SimpleDateFormat fmt = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ssZ");
            return fmt.parse(date);
        } catch (ParseException ex) {
            com.gmt2001.Console.err.printStackTrace(ex);
        }

        return new Date();
    }

    static String getSecret() {
        return CaselessProperties.instance().getProperty("appsecret", EventSub::generateSecret);
    }

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

    boolean isDuplicate(String messageId, Date timestamp) {
        return this.handledMessages.putIfAbsent(messageId, timestamp) != null;
    }

    private void cleanupDuplicates() {
        Calendar c = Calendar.getInstance(TimeZone.getTimeZone(ZoneOffset.UTC));
        c.add(Calendar.MINUTE, -10);
        Date expires = c.getTime();
        this.handledMessages.forEach((id, ts) -> {
            if (ts.before(expires)) {
                this.handledMessages.remove(id);
            }
        });
    }

    private JSONObject doRequest(HttpMethod type, String queryString, String post) throws IOException, JSONException, URISyntaxException {
        HttpUrl url = HttpUrl.fromUri(BASE, queryString);
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
