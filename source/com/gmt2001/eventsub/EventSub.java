/*
 * Copyright (C) 2016-2021 phantombot.github.io/PhantomBot
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
import io.netty.handler.codec.http.HttpResponseStatus;
import io.netty.handler.codec.http.HttpUtil;
import static io.netty.handler.codec.http.HttpVersion.HTTP_1_1;
import io.netty.util.CharsetUtil;
import java.io.BufferedOutputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.lang.reflect.InvocationTargetException;
import java.net.URL;
import java.security.SecureRandom;
import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.Base64;
import java.util.Collections;
import java.util.Date;
import java.util.Enumeration;
import java.util.HashMap;
import java.util.Map;
import java.util.TreeSet;
import java.util.zip.GZIPInputStream;
import javax.net.ssl.HttpsURLConnection;
import org.apache.commons.io.IOUtils;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;
import org.json.JSONStringer;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import tv.phantombot.CaselessProperties;
import tv.phantombot.PhantomBot;
import tv.phantombot.event.EventBus;

/**
 *
 * @author gmt2001
 */
public class EventSub implements HttpRequestHandler {

    private EventSub() {
    }

    private static final EventSub INSTANCE = new EventSub();
    private static final String BASE = "https://api.twitch.tv/helix/eventsub/subscriptions";
    private static final int TIMEOUT = 2 * 1000;
    private int subscription_total = 0;
    private int subscription_total_cost = 0;
    private int subscription_max_cost = 0;
    private final HttpEventSubAuthenticationHandler authHandler = new HttpEventSubAuthenticationHandler();

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

    private enum RequestType {

        GET, POST, DELETE
    };

    /**
     * Gets all EventSub subscriptions
     *
     * @return
     */
    public Flux<EventSubSubscription> getSubscriptions() {
        return this.getSubscriptions(null);
    }

    /**
     * Gets all EventSub subscriptions matching the status in filter
     *
     * @param filter The status to match, null for all
     * @return
     */
    public Flux<EventSubSubscription> getSubscriptions(EventSubSubscription.SubscriptionStatus filter) {
        return Flux.<EventSubSubscription>create(emitter -> {
            try {
                JSONObject response = this.doRequest(EventSub.RequestType.GET, filter != null ? "?status=" + filter.name().toLowerCase() : "", "");

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
            } catch (IOException | JSONException ex) {
                emitter.error(ex);
                com.gmt2001.Console.debug.println("Failed to get data [" + ex.getClass().getSimpleName() + "]: " + ex.getMessage());
            }
        });
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
    public Mono deleteSubscription(String id) {
        return Mono.create(emitter -> {
            try {
                JSONObject response = this.doRequest(EventSub.RequestType.DELETE, "?id=" + id, "");

                if (response.has("error")) {
                    emitter.error(new IOException(response.toString()));
                } else {
                    emitter.success();
                }
            } catch (IOException | JSONException ex) {
                emitter.error(ex);
                com.gmt2001.Console.debug.println("Failed to delete subscription [" + ex.getClass().getSimpleName() + "]: " + ex.getMessage());
            }
        });
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
                JSONObject response = this.doRequest(EventSub.RequestType.POST, "", request.toString());

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
            } catch (IOException | JSONException ex) {
                emitter.error(ex);
                com.gmt2001.Console.debug.println("Failed to delete subscription [" + ex.getClass().getSimpleName() + "]: " + ex.getMessage());
            }
        });
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
        return PhantomBot.instance().getProperties().getProperty("appsecret", EventSub::generateSecret);
    }

    private static String generateSecret() {
        CaselessProperties properties = PhantomBot.instance().getProperties();
        byte[] secret = new byte[64];
        SecureRandom rand = new SecureRandom();

        rand.nextBytes(secret);

        CaselessProperties outputProperties = new CaselessProperties() {
            @Override
            public synchronized Enumeration<Object> keys() {
                return Collections.enumeration(new TreeSet<>(super.keySet()));
            }
        };

        try {
            try (FileOutputStream outputStream = new FileOutputStream("./config/botlogin.txt")) {
                outputProperties.putAll(properties);
                outputProperties.store(outputStream, "PhantomBot Configuration File");
            }

            com.gmt2001.Console.debug.println("reloading properties");
            if (PhantomBot.instance() != null) {
                PhantomBot.instance().reloadProperties();
            }
        } catch (IOException ex) {
            com.gmt2001.Console.err.printStackTrace(ex);
        }

        return Base64.getEncoder().encodeToString(secret);
    }

    private JSONObject doRequest(EventSub.RequestType type, String queryString, String post) throws IOException, JSONException {
        JSONObject response = this.getData(type, queryString, post);

        if (response.has("error") && response.getInt("status") == 401) {
            PhantomBot.instance().getAppFlow().getNewToken();
            try {
                Thread.sleep(TIMEOUT);
            } catch (InterruptedException ex) {
            }
            response = getData(type, queryString, post);
        }

        return response;
    }

    private void fillJSONObject(JSONObject jsonObject, boolean success, String type, String post,
            String url, int responseCode, String exception,
            String exceptionMessage, String jsonContent) throws JSONException {
        jsonObject.put("_success", success);
        jsonObject.put("_type", type);
        jsonObject.put("_post", post);
        jsonObject.put("_url", url);
        jsonObject.put("_http", responseCode);
        jsonObject.put("_exception", exception);
        jsonObject.put("_exceptionMessage", exceptionMessage);
        jsonObject.put("_content", jsonContent);
    }

    private JSONObject getData(EventSub.RequestType type, String queryString, String post) throws IOException, JSONException {
        JSONObject j = new JSONObject("{}");
        InputStream i = null;
        String content = "";

        try {
            URL u = new URL(EventSub.BASE + queryString);
            HttpsURLConnection c = (HttpsURLConnection) u.openConnection();
            c.addRequestProperty("Accept", "application/json");
            c.addRequestProperty("Content-Type", "application/json");

            c.addRequestProperty("Authorization", "Bearer " + PhantomBot.instance().getProperties().getProperty("apptoken"));
            c.addRequestProperty("Client-ID", PhantomBot.instance().getProperties().getProperty("clientid"));

            c.setRequestMethod(type.name());
            c.setConnectTimeout(TIMEOUT);
            c.setRequestProperty("User-Agent", "Mozilla/5.0 (Windows NT 6.1; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/44.0.2403.52 Safari/537.36 PhantomBotJ/2021");

            if (!post.isEmpty()) {
                c.setDoOutput(true);
            }

            c.connect();

            if (!post.isEmpty()) {
                try (BufferedOutputStream stream = new BufferedOutputStream(c.getOutputStream())) {
                    stream.write(post.getBytes());
                    stream.flush();
                }
            }

            if (c.getResponseCode() == 200) {
                i = c.getInputStream();
            } else {
                i = c.getErrorStream();
            }

            if (c.getResponseCode() == 204 || i == null) {
                content = "{}";
            } else {
                String charset = "utf-8";
                String ct = c.getContentType();
                if (ct != null) {
                    String[] cts = ct.split(" *; *");
                    for (int idx = 1; idx < cts.length; ++idx) {
                        String[] val = cts[idx].split("=", 2);
                        if (val[0].equalsIgnoreCase("charset") && val.length > 1) {
                            charset = val[1];
                        }
                    }
                }

                if ("gzip".equalsIgnoreCase(c.getContentEncoding())) {
                    i = new GZIPInputStream(i);
                }

                content = IOUtils.toString(i, charset);
            }

            j = new JSONObject(content);
            fillJSONObject(j, true, type.name(), post, EventSub.BASE + queryString, c.getResponseCode(), "", "", content);
        } catch (IOException | JSONException ex) {
            fillJSONObject(j, false, type.name(), post, EventSub.BASE + queryString, 0, ex.getClass().getSimpleName(), ex.getMessage(), content);
            throw ex;
        } finally {
            if (i != null) {
                try {
                    i.close();
                } catch (IOException ex) {
                    fillJSONObject(j, false, type.name(), post, EventSub.BASE + queryString, 0, "IOException", ex.getMessage(), content);
                    com.gmt2001.Console.err.println("IOException: " + ex.getMessage());
                }
            }
        }

        return j;
    }
}
