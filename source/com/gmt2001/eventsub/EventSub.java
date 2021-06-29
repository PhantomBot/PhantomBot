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

import com.gmt2001.HMAC;
import io.netty.handler.codec.http.FullHttpRequest;
import java.io.BufferedOutputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.net.URL;
import java.nio.charset.Charset;
import java.security.SecureRandom;
import java.util.Base64;
import java.util.Collections;
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

/**
 *
 * @author gmt2001
 */
public class EventSub {

    private EventSub() {
    }

    private static final String BASE = "https://api.twitch.tv/helix/eventsub/subscriptions";
    private static final int TIMEOUT = 2 * 1000;
    private static int subscription_total = 0;
    private static int subscription_total_cost = 0;
    private static int subscription_max_cost = 0;

    private enum request_type {

        GET, POST, DELETE
    };

    /**
     * Gets all EventSub subscriptions
     *
     * @return
     */
    public static Flux<EventSubSubscription> getSubscriptions() {
        return getSubscriptions(null);
    }

    /**
     * Gets all EventSub subscriptions matching the status in filter
     *
     * @param filter The status to match, null for all
     * @return
     */
    public static Flux<EventSubSubscription> getSubscriptions(EventSubSubscription.subscription_status filter) {
        return Flux.<EventSubSubscription>create(emitter -> {
            try {
                JSONObject response = doRequest(EventSub.request_type.GET, filter != null ? "?status=" + filter.name().toLowerCase() : "", "");

                if (response.has("error")) {
                    emitter.error(new IOException(response.toString()));
                } else {
                    JSONArray arr = response.getJSONArray("data");
                    for (int i = 0; i < arr.length(); i++) {
                        JSONObject subscription = arr.getJSONObject(i);
                        Map<String, String> condition = new HashMap<>();

                        subscription.getJSONObject("condition").keySet().forEach(key -> condition.put(key, subscription.getJSONObject("condition").getString(key)));

                        emitter.next(new EventSubSubscription(
                                subscription.getString("id"), subscription.getString("status"), subscription.getString("type"), subscription.getString("version"),
                                subscription.getInt("cost"), condition, subscription.getString("created_at"),
                                new EventSubTransport(subscription.getJSONObject("transport").getString("method"), subscription.getJSONObject("transport").getString("callback"))
                        ));
                    }

                    EventSub.subscription_total = response.getInt("total");
                    EventSub.subscription_total_cost = response.getInt("total_cost");
                    EventSub.subscription_max_cost = response.getInt("max_total_cost");
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
    public static int getTotalSubscriptionCount() {
        return EventSub.subscription_total;
    }

    /**
     * Returns the total cost of all subscriptions. Only valid after a call to getSubscriptions
     *
     * @return
     */
    public static int getTotalSubscriptionCost() {
        return EventSub.subscription_total_cost;
    }

    /**
     * Returns the cost limit for subscriptions. Only valid after a call to getSubscriptions
     *
     * @return
     */
    public static int getSubscriptionCostLimit() {
        return EventSub.subscription_max_cost;
    }

    /**
     * Deletes a subscription
     *
     * @param id The id of the subscription to delete
     * @return
     */
    public static Mono deleteSubscription(String id) {
        return Mono.create(emitter -> {
            try {
                JSONObject response = doRequest(EventSub.request_type.DELETE, "?id=" + id, "");

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

    static Mono<EventSubSubscription> createSubscription(EventSubSubscription proposedSubscription) {
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
                JSONObject response = doRequest(EventSub.request_type.POST, "", request.toString());

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

    /**
     * Validates an EventSub signature
     *
     * @param req The FullHttpRequest of the EventSub notification
     * @return true if the signature is valid and matches
     */
    public static boolean verifyEventSubSignature(FullHttpRequest req) {
        String id = req.headers().get("Twitch-Eventsub-Message-Id");
        String timestamp = req.headers().get("Twitch-Eventsub-Message-Timestamp");
        String body = req.content().toString(Charset.defaultCharset());
        String signature = req.headers().get("Twitch-Eventsub-Message-Signature").replaceAll("sha256=", "");

        return HMAC.compareHmacSha256(EventSub.getSecret(), id + timestamp + body, signature);
    }

    static String getSecret() {
        return PhantomBot.instance().getProperties().getProperty("appsecret", EventSub.generateSecret());
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

    private static JSONObject doRequest(EventSub.request_type type, String queryString, String post) throws IOException, JSONException {
        JSONObject response = getData(type, queryString, post);

        if (response.has("error") && response.getInt("status") == 401) {
            PhantomBot.instance().getAppFlow().getNewToken(PhantomBot.instance().getProperties());
            try {
                Thread.sleep(TIMEOUT);
            } catch (InterruptedException ex) {
            }
            response = getData(type, queryString, post);
        }

        return response;
    }

    private static void fillJSONObject(JSONObject jsonObject, boolean success, String type, String post,
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

    private static JSONObject getData(EventSub.request_type type, String queryString, String post) throws IOException, JSONException {
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
