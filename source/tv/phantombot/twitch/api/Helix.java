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
package tv.phantombot.twitch.api;

import com.gmt2001.HttpRequest;
import com.gmt2001.httpclient.HttpClient;
import com.gmt2001.httpclient.HttpClientResponse;
import com.gmt2001.httpclient.HttpUrl;
import io.netty.handler.codec.http.HttpHeaders;
import io.netty.handler.codec.http.HttpMethod;
import java.math.BigInteger;
import java.net.URLEncoder;
import java.nio.charset.Charset;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.text.SimpleDateFormat;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.Calendar;
import java.util.Date;
import java.util.List;
import java.util.Queue;
import java.util.TimeZone;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentLinkedQueue;
import java.util.concurrent.ConcurrentMap;
import java.util.concurrent.ScheduledThreadPoolExecutor;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.locks.ReentrantLock;
import java.util.function.Supplier;
import java.util.stream.Collectors;
import org.json.JSONException;
import org.json.JSONObject;
import org.json.JSONStringer;
import reactor.core.publisher.Mono;
import reactor.util.annotation.Nullable;
import tv.phantombot.CaselessProperties;
import tv.phantombot.PhantomBot;

/**
 * Start of the Helix API. This class will handle the rate limits.
 *
 * @author ScaniaTV
 * @author gmt2001
 */
public class Helix {

    // The current instance of Helix.
    private static final Helix INSTANCE = new Helix();
    // The base URL for Twitch API Helix.
    private static final String BASE_URL = "https://api.twitch.tv/helix";
    private static final int QUEUE_TIME = 5000;
    private static final int CACHE_TIME = 30000;
    private static final int MUTATOR_CACHE_TIME = 1000;
    private static final int RATELIMIT_DEFMAX = 120;
    private static final int WARNING_INTERVAL_MINS = 5;

    /**
     * Method that returns the instance of Helix.
     *
     * @return
     */
    public static Helix instance() {
        return INSTANCE;
    }

    // Time when our limit will fully reset.
    private long rateLimitResetEpoch = System.currentTimeMillis();
    // Our current rate limit before making any requests.
    private int remainingRateLimit = 120;
    // The rate limit, when full
    private int maxRateLimit = 120;
    private String oAuthToken = null;
    private final ScheduledThreadPoolExecutor tp = new ScheduledThreadPoolExecutor(1);
    private final Queue<Mono<JSONObject>> requestQueue = new ConcurrentLinkedQueue<>();
    private final ConcurrentMap<String, CallRequest> calls = new ConcurrentHashMap<>();
    private final ReentrantLock lock = new ReentrantLock();
    private Date nextWarning = new Date();

    private Helix() {
        Thread.setDefaultUncaughtExceptionHandler(com.gmt2001.UncaughtExceptionHandler.instance());
        this.tp.schedule(() -> {
            tp.scheduleWithFixedDelay(Helix.instance()::processQueue, QUEUE_TIME, QUEUE_TIME, TimeUnit.MILLISECONDS);
        }, 1000, TimeUnit.MILLISECONDS);
    }

    public void setOAuth(String oauth) {
        this.oAuthToken = oauth.replaceFirst("oauth:", "");
    }

    /**
     * Method that update the rate limits in sync.
     *
     * @param limit The number of requests left.
     * @param reset The time when our limits will reset.
     */
    private synchronized void updateRateLimits(int maxLimit, int limit, long reset) {
        maxRateLimit = maxLimit;
        remainingRateLimit = limit;
        rateLimitResetEpoch = reset;
    }

    /**
     * Method that gets the reset time for the rate limit.
     *
     * @return
     */
    private synchronized long getLimitResetTime() {
        return rateLimitResetEpoch;
    }

    /**
     * Method that gets the current rate limits.
     *
     * @return
     */
    private synchronized int getRemainingRateLimit() {
        return remainingRateLimit;
    }

    /**
     * Method that checks if we hit the limit.
     */
    private void checkRateLimit() {
        if (getRemainingRateLimit() <= 0) {
            try {
                // Sleep until a token is returned to the bucket
                Thread.sleep(System.currentTimeMillis() - (this.getLimitResetTime() / maxRateLimit) + 20);
            } catch (InterruptedException ex) {
                com.gmt2001.Console.err.printStackTrace(ex);
            }
        }
    }

    private Mono<Long> waitForRateLimit() {
        if (getRemainingRateLimit() <= 0) {
            return Mono.delay(Duration.ofMillis(System.currentTimeMillis() - (this.getLimitResetTime() / maxRateLimit) + 20));
        }

        return Mono.delay(Duration.ZERO);
    }

    private void processQueue() {
        if (!lock.isHeldByCurrentThread() && lock.tryLock()) {
            try {
                while (!requestQueue.isEmpty()) {
                    waitForRateLimit().then(requestQueue.poll()).block();
                }

                Date d = Calendar.getInstance().getTime();
                calls.entrySet().stream().filter(kvp -> (kvp.getValue().expires.before(d))).forEachOrdered(kvp -> {
                    calls.remove(kvp.getKey());
                });
            } finally {
                lock.unlock();
            }
        }
    }

    private String uriEncode(String input) {
        if (input == null) {
            return input;
        }

        return URLEncoder.encode(input, Charset.forName("UTF-8"));
    }

    private String qspValid(String key, String value) {
        return value != null && !value.isBlank() ? key + "=" + value : "";
    }

    /**
     * Method that handles data for Helix.
     *
     * @param type
     * @param url
     * @param data
     * @return
     */
    private JSONObject handleRequest(HttpMethod type, String endPoint, String data) throws JSONException {
        try {
            return this.handleRequest(type, endPoint, data, false);
        } catch (Throwable ex) {
            if (ex.getCause() != null && ex.getMessage().startsWith("{")) {
                com.gmt2001.Console.err.printStackTrace(ex.getCause());
                return new JSONObject(ex.getMessage());
            } else {
                com.gmt2001.Console.err.printStackTrace(ex);
                return new JSONObject();
            }
        }
    }

    /**
     * Method that handles data for Helix.
     *
     * @param type
     * @param url
     * @param data
     * @param isRetry
     * @return
     */
    private JSONObject handleRequest(HttpMethod type, String endPoint, String data, boolean isRetry) throws JSONException, Throwable {
        JSONObject returnObject = new JSONObject();
        int responseCode = 0;

        this.checkRateLimit();

        try {
            if (this.oAuthToken == null || this.oAuthToken.isBlank()) {
                throw new IllegalArgumentException("apioauth is required");
            }

            if (data == null) {
                data = "";
            }

            HttpHeaders headers = HttpClient.createHeaders(type, true);
            headers.add("Client-ID", CaselessProperties.instance().getProperty("clientid", (TwitchValidate.instance().getAPIClientID().isBlank()
                    ? "7wpchwtqz7pvivc3qbdn1kajz42tdmb" : TwitchValidate.instance().getAPIClientID())));
            headers.add("Authorization", "Bearer " + this.oAuthToken);
            HttpClientResponse response = HttpClient.request(type, HttpUrl.fromUri(BASE_URL, endPoint), headers, data);

            responseCode = response.responseCode().code();

            if (CaselessProperties.instance().getPropertyAsBoolean("helixdebug", false)) {
                com.gmt2001.Console.debug.println("Helix ratelimit response > Limit: " + response.responseHeaders().getAsString("Ratelimit-Limit")
                        + " <> Remaining: " + response.responseHeaders().getAsString("Ratelimit-Remaining") + " <> Reset: "
                        + response.responseHeaders().getAsString("Ratelimit-Reset"));
            }

            this.updateRateLimits(response.responseHeaders().getInt("Ratelimit-Limit", RATELIMIT_DEFMAX),
                    response.responseHeaders().getInt("Ratelimit-Remaining", 1),
                    response.responseHeaders().getInt("Ratelimit-Reset", (int) (Date.from(Instant.now()).getTime() / 1000)) * 1000);

            returnObject = response.jsonOrThrow();
            // Generate the return object,
            HttpRequest.generateJSONObject(returnObject, true, type.name(), data, endPoint, responseCode, "", "");
        } catch (Exception ex) {
            // Generate the return object.
            HttpRequest.generateJSONObject(returnObject, false, type.name(), data, endPoint, responseCode, ex.getClass().getSimpleName(), ex.getMessage());
            throw new Exception(returnObject.toString(), ex);
        }

        if (returnObject.has("error") && nextWarning.before(new Date())) {
            Calendar c = Calendar.getInstance();
            c.add(Calendar.MINUTE, WARNING_INTERVAL_MINS);
            nextWarning = c.getTime();

            com.gmt2001.Console.warn.println("Helix rejected a request [" + endPoint + "] " + returnObject.optInt("status", 0) + " "
                    + returnObject.optString("error", "Unknown") + ": " + returnObject.optString("message", "Unknown"));
        }

        if (CaselessProperties.instance().getPropertyAsBoolean("helixdebug", false)) {
            StackTraceElement st = com.gmt2001.Console.debug.findCaller("tv.phantombot.twitch.api.Helix");
            com.gmt2001.Console.debug.println("Caller: [" + st.getMethodName() + "()@" + st.getFileName() + ":" + st.getLineNumber() + "]");
            com.gmt2001.Console.debug.println(returnObject.toString(4));
        }

        if (!isRetry && (responseCode == 401 || (returnObject.has("status") && returnObject.getInt("status") == 401)) && PhantomBot.instance() != null) {
            PhantomBot.instance().getAuthFlow().refresh(false, true);
            return this.handleRequest(type, endPoint, data, true);
        }

        return returnObject;
    }

    /**
     * Method that handles a request without any data being passed.
     *
     * @param type
     * @param endPoint
     * @return
     */
    private JSONObject handleRequest(HttpMethod type, String endPoint) throws JSONException {
        return this.handleRequest(type, endPoint, "");
    }

    private Mono<JSONObject> handleQueryAsync(String callid, Supplier<JSONObject> action) {
        return calls.computeIfAbsent(this.digest(callid), k -> {
            Calendar c = Calendar.getInstance();
            c.add(Calendar.MILLISECOND, CACHE_TIME);
            Mono<JSONObject> processor = Mono.<JSONObject>create(emitter -> {
                try {
                    emitter.success(action.get());
                } catch (JSONException | IllegalArgumentException ex) {
                    emitter.error(ex);
                }
            }).cache();
            requestQueue.add(processor);
            return new CallRequest(c.getTime(), processor);
        }).processor;
    }

    private Mono<JSONObject> handleMutatorAsync(String callid, Supplier<JSONObject> action) {
        return calls.computeIfAbsent(this.digest(callid), k -> {
            Calendar c = Calendar.getInstance();
            c.add(Calendar.MILLISECOND, MUTATOR_CACHE_TIME);
            Mono<JSONObject> processor = Mono.<JSONObject>create(emitter -> {
                try {
                    emitter.success(action.get());
                } catch (JSONException | IllegalArgumentException ex) {
                    emitter.error(ex);
                }
            }).cache();
            requestQueue.add(processor);
            return new CallRequest(c.getTime(), processor);
        }).processor;
    }

    private String digest(String input) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-1");
            md.update(input.getBytes());
            BigInteger bi = new BigInteger(1, md.digest());
            return bi.toString(16);
        } catch (NoSuchAlgorithmException ex) {
            com.gmt2001.Console.err.logStackTrace(ex);
        }

        return "";
    }

    /**
     * Gets channel information for users.
     *
     * @param broadcaster_id ID of the channel to be retrieved.
     * @return
     * @throws JSONException
     * @throws IllegalArgumentException
     */
    public JSONObject getChannelInformation(String broadcaster_id) throws JSONException, IllegalArgumentException {
        return this.getChannelInformationAsync(broadcaster_id).block();
    }

    /**
     * Gets channel information for users.
     *
     * @param broadcaster_id ID of the channel to be retrieved.
     * @return
     * @throws JSONException
     * @throws IllegalArgumentException
     */
    public Mono<JSONObject> getChannelInformationAsync(String broadcaster_id) throws JSONException, IllegalArgumentException {
        if (broadcaster_id == null || broadcaster_id.isBlank()) {
            throw new IllegalArgumentException("channelId");
        }

        String endpoint = "/channels?broadcaster_id=" + broadcaster_id;

        return this.handleQueryAsync(endpoint, () -> {
            return this.handleRequest(HttpMethod.GET, endpoint);
        });
    }

    /**
     * Modifies channel information for users. @paramref channelId is required. All others are optional, but at least one must be valid.
     *
     * @param broadcaster_id ID of the channel to be updated.
     * @param game_id The current game ID being played on the channel. Use "0" or "" (an empty string) to unset the game.
     * @param language The language of the channel. A language value must be either the ISO 639-1 two-letter code for a supported stream language or
     * "other".
     * @param title The title of the stream. Value must not be an empty string.
     * @param delay Stream delay in seconds. Stream delay is a Twitch Partner feature; trying to set this value for other account types will return a
     * 400 error.
     * @return
     * @throws JSONException
     * @throws IllegalArgumentException
     */
    public JSONObject updateChannelInformation(String broadcaster_id, @Nullable String game_id, @Nullable String language, @Nullable String title,
            int delay) throws JSONException, IllegalArgumentException {
        return this.updateChannelInformationAsync(broadcaster_id, game_id, language, title, delay).block();
    }

    /**
     * Modifies channel information for users. @paramref channelId is required. All others are optional, but at least one must be valid.
     *
     * @param broadcaster_id ID of the channel to be updated.
     * @param game_id The current game ID being played on the channel. Use "0" or "" (an empty string) to unset the game.
     * @param language The language of the channel. A language value must be either the ISO 639-1 two-letter code for a supported stream language or
     * "other".
     * @param title The title of the stream. Value must not be an empty string.
     * @param delay Stream delay in seconds. Stream delay is a Twitch Partner feature; trying to set this value for other account types will return a
     * 400 error.
     * @return
     * @throws JSONException
     * @throws IllegalArgumentException
     */
    public Mono<JSONObject> updateChannelInformationAsync(String broadcaster_id, @Nullable String game_id, @Nullable String language, @Nullable String title,
            int delay) throws JSONException, IllegalArgumentException {
        if (broadcaster_id == null || broadcaster_id.isBlank()) {
            throw new IllegalArgumentException("broadcaster_id");
        }

        if (game_id == null && (language == null || language.isBlank()) && (title == null || title.isBlank()) && delay < 0) {
            throw new IllegalArgumentException("must provide one valid argument");
        }

        JSONStringer js = new JSONStringer();
        js.object();

        if (game_id != null) {
            js.key("game_id").value(game_id);
        }

        if (language != null && !language.isBlank()) {
            js.key("broadcaster_language").value(language);
        }

        if (title != null && !title.isBlank()) {
            js.key("title").value(title);
        }

        if (delay >= 0) {
            js.key("delay").value(delay);
        }

        js.endObject();

        String endpoint = "/channels?broadcaster_id=" + broadcaster_id;

        return this.handleMutatorAsync(endpoint + js.toString(), () -> {
            return this.handleRequest(HttpMethod.PATCH, endpoint, js.toString());
        });
    }

    /**
     * Returns a list of games or categories that match the query via name either entirely or partially.
     *
     * @param query Search query.
     * @param first Maximum number of objects to return. Maximum: 100. Default: 20.
     * @param after Cursor for forward pagination: tells the server where to start fetching the next set of results, in a multi-page response. The
     * cursor value specified here is from the pagination response field of a prior query.
     * @return
     * @throws JSONException
     * @throws IllegalArgumentException
     */
    public JSONObject searchCategories(String query, int first, @Nullable String after) throws JSONException, IllegalArgumentException {
        return this.searchCategoriesAsync(query, first, after).block();
    }

    /**
     * Returns a list of games or categories that match the query via name either entirely or partially.
     *
     * @param query Search query.
     * @param first Maximum number of objects to return. Maximum: 100. Default: 20.
     * @param after Cursor for forward pagination: tells the server where to start fetching the next set of results, in a multi-page response. The
     * cursor value specified here is from the pagination response field of a prior query.
     * @return
     * @throws JSONException
     * @throws IllegalArgumentException
     */
    public Mono<JSONObject> searchCategoriesAsync(String query, int first, @Nullable String after) throws JSONException, IllegalArgumentException {
        if (query == null || query.isBlank()) {
            throw new IllegalArgumentException("query");
        }

        if (first <= 0) {
            first = 20;
        }

        first = Math.max(1, Math.min(100, first));

        String endpoint = "/search/categories?query=" + this.uriEncode(query) + "&first=" + first + this.qspValid("&after", after);

        return this.handleQueryAsync(endpoint, () -> {
            return this.handleRequest(HttpMethod.GET, endpoint);
        });
    }

    /**
     * Gets information on follow relationships between two Twitch users. This can return information like "who is qotrok following," "who is
     * following qotrok," or "is user X following user Y." Information returned is sorted in order, most recent follow first. At minimum, from_id or
     * to_id must be provided for a query to be valid.
     *
     * @param from_id User ID. The request returns information about users who are being followed by the from_id user.
     * @param to_id User ID. The request returns information about users who are following the to_id user.
     * @param first Maximum number of objects to return. Maximum: 100. Default: 20.
     * @param after Cursor for forward pagination: tells the server where to start fetching the next set of results, in a multi-page response. The
     * cursor value specified here is from the pagination response field of a prior query.
     * @return
     * @throws JSONException
     * @throws IllegalArgumentException
     */
    public JSONObject getUsersFollows(@Nullable String from_id, @Nullable String to_id, int first, @Nullable String after)
            throws JSONException, IllegalArgumentException {
        return this.getUsersFollowsAsync(from_id, to_id, first, after).block();
    }

    /**
     * Gets information on follow relationships between two Twitch users. This can return information like "who is qotrok following," "who is
     * following qotrok," or "is user X following user Y." Information returned is sorted in order, most recent follow first. At minimum, from_id or
     * to_id must be provided for a query to be valid.
     *
     * @param from_id User ID. The request returns information about users who are being followed by the from_id user.
     * @param to_id User ID. The request returns information about users who are following the to_id user.
     * @param first Maximum number of objects to return. Maximum: 100. Default: 20.
     * @param after Cursor for forward pagination: tells the server where to start fetching the next set of results, in a multi-page response. The
     * cursor value specified here is from the pagination response field of a prior query.
     * @return
     * @throws JSONException
     * @throws IllegalArgumentException
     */
    public Mono<JSONObject> getUsersFollowsAsync(@Nullable String from_id, @Nullable String to_id, int first, @Nullable String after)
            throws JSONException, IllegalArgumentException {
        if ((from_id == null || from_id.isBlank()) && (to_id == null || to_id.isBlank())) {
            throw new IllegalArgumentException("from_id or to_id");
        }

        if (first <= 0) {
            first = 20;
        }

        first = Math.max(1, Math.min(100, first));

        boolean both = false;
        if (from_id != null && !from_id.isBlank() && to_id != null && !to_id.isBlank()) {
            both = true;
        }

        String endpoint = "/users/follows?" + this.qspValid("from_id", from_id) + (both ? "&" : "")
                + this.qspValid("to_id", to_id) + "&first=" + first + this.qspValid("&after", after);

        return this.handleQueryAsync(endpoint, () -> {
            return this.handleRequest(HttpMethod.GET, endpoint);
        });
    }

    /**
     * Get all of the subscriptions for a specific broadcaster.
     *
     * @param broadcaster_id User ID of the broadcaster. Must match the User ID in the Bearer token.
     * @param user_id Filters results to only include potential subscriptions made by the provided user IDs. Accepts up to 100 values.
     * @param first Maximum number of objects to return. Maximum: 100. Default: 20.
     * @param after Cursor for forward pagination: tells the server where to start fetching the next set of results in a multi-page response. This
     * applies only to queries without user_id. If a user_id is specified, it supersedes any cursor/offset combinations. The cursor value specified
     * here is from the pagination response field of a prior query.
     * @return
     * @throws JSONException
     * @throws IllegalArgumentException
     */
    public JSONObject getBroadcasterSubscriptions(String broadcaster_id, @Nullable List<String> user_id, int first, @Nullable String after)
            throws JSONException, IllegalArgumentException {
        return this.getBroadcasterSubscriptionsAsync(broadcaster_id, user_id, first, after).block();
    }

    /**
     * Get all of the subscriptions for a specific broadcaster.
     *
     * @param broadcaster_id User ID of the broadcaster. Must match the User ID in the Bearer token.
     * @param user_id Filters results to only include potential subscriptions made by the provided user IDs. Accepts up to 100 values.
     * @param first Maximum number of objects to return. Maximum: 100. Default: 20.
     * @param after Cursor for forward pagination: tells the server where to start fetching the next set of results in a multi-page response. This
     * applies only to queries without user_id. If a user_id is specified, it supersedes any cursor/offset combinations. The cursor value specified
     * here is from the pagination response field of a prior query.
     * @return
     * @throws JSONException
     * @throws IllegalArgumentException
     */
    public Mono<JSONObject> getBroadcasterSubscriptionsAsync(String broadcaster_id, @Nullable List<String> user_id, int first, @Nullable String after)
            throws JSONException, IllegalArgumentException {
        if (broadcaster_id == null || broadcaster_id.isBlank()) {
            throw new IllegalArgumentException("broadcaster_id");
        }

        if (first <= 0) {
            first = 20;
        }

        first = Math.max(1, Math.min(100, first));

        String userIds = null;

        if (user_id != null && !user_id.isEmpty()) {
            userIds = user_id.stream().limit(100).collect(Collectors.joining("&user_id="));
        }

        String endpoint = "/subscriptions?broadcaster_id=" + broadcaster_id + "&first=" + first
                + this.qspValid("&user_id", userIds) + this.qspValid("&after", after);

        return this.handleQueryAsync(endpoint, () -> {
            return this.handleRequest(HttpMethod.GET, endpoint);
        });
    }

    /**
     * Gets information about active streams. Streams are returned sorted by number of current viewers, in descending order. Across multiple pages of
     * results, there may be duplicate or missing streams, as viewers join and leave streams.
     *
     * @param first Maximum number of objects to return. Maximum: 100. Default: 20.
     * @param before Cursor for backward pagination: tells the server where to start fetching the next set of results, in a multi-page response. The
     * cursor value specified here is from the pagination response field of a prior query.
     * @param after Cursor for forward pagination: tells the server where to start fetching the next set of results, in a multi-page response. The
     * cursor value specified here is from the pagination response field of a prior query.
     * @param user_id Returns streams broadcast by one or more specified user IDs. You can specify up to 100 IDs.
     * @param user_login Returns streams broadcast by one or more specified user login names. You can specify up to 100 names.
     * @param game_id Returns streams broadcasting a specified game ID. You can specify up to 100 IDs.
     * @param language Stream language. You can specify up to 100 languages. A language value must be either the ISO 639-1 two-letter code for a
     * supported stream language or "other".
     * @return
     * @throws JSONException
     * @throws IllegalArgumentException
     */
    public JSONObject getStreams(int first, @Nullable String before, @Nullable String after, @Nullable List<String> user_id,
            @Nullable List<String> user_login, @Nullable List<String> game_id, @Nullable List<String> language) throws JSONException, IllegalArgumentException {
        return this.getStreamsAsync(first, before, after, user_id, user_login, game_id, language).block();
    }

    /**
     * Gets information about active streams. Streams are returned sorted by number of current viewers, in descending order. Across multiple pages of
     * results, there may be duplicate or missing streams, as viewers join and leave streams.
     *
     * @param first Maximum number of objects to return. Maximum: 100. Default: 20.
     * @param before Cursor for backward pagination: tells the server where to start fetching the next set of results, in a multi-page response. The
     * cursor value specified here is from the pagination response field of a prior query.
     * @param after Cursor for forward pagination: tells the server where to start fetching the next set of results, in a multi-page response. The
     * cursor value specified here is from the pagination response field of a prior query.
     * @param user_id Returns streams broadcast by one or more specified user IDs. You can specify up to 100 IDs.
     * @param user_login Returns streams broadcast by one or more specified user login names. You can specify up to 100 names.
     * @param game_id Returns streams broadcasting a specified game ID. You can specify up to 100 IDs.
     * @param language Stream language. You can specify up to 100 languages. A language value must be either the ISO 639-1 two-letter code for a
     * supported stream language or "other".
     * @return
     * @throws JSONException
     * @throws IllegalArgumentException
     */
    public Mono<JSONObject> getStreamsAsync(int first, @Nullable String before, @Nullable String after, @Nullable List<String> user_id,
            @Nullable List<String> user_login, @Nullable List<String> game_id, @Nullable List<String> language) throws JSONException, IllegalArgumentException {
        if (before != null && !before.isBlank() && after != null && !after.isBlank()) {
            throw new IllegalArgumentException("can not use before and after at the same time");
        }

        if (first <= 0) {
            first = 20;
        }

        first = Math.max(1, Math.min(100, first));

        String userIds = null;

        if (user_id != null && !user_id.isEmpty()) {
            userIds = user_id.stream().limit(100).collect(Collectors.joining("&user_id="));
        }

        String userLogins = null;

        if (user_login != null && !user_login.isEmpty()) {
            userLogins = user_login.stream().limit(100).collect(Collectors.joining("&user_login="));
        }

        String gameIds = null;

        if (game_id != null && !game_id.isEmpty()) {
            gameIds = game_id.stream().limit(100).collect(Collectors.joining("&game_id="));
        }

        String languages = null;

        if (language != null && !language.isEmpty()) {
            languages = language.stream().limit(100).collect(Collectors.joining("&language="));
        }

        String endpoint = "/streams?first=" + first + this.qspValid("&after", after) + this.qspValid("&before", before)
                + this.qspValid("&user_id", userIds) + this.qspValid("&user_login", userLogins) + this.qspValid("&game_id", gameIds) + this.qspValid("&language", languages);

        return this.handleQueryAsync(endpoint, () -> {
            return this.handleRequest(HttpMethod.GET, endpoint);
        });
    }

    /**
     * Gets information about one or more specified Twitch users. Users are identified by optional user IDs and/or login name. If neither a user ID
     * nor a login name is specified, the user is looked up by Bearer token. Note: The limit of 100 IDs and login names is the total limit. You can
     * request, for example, 50 of each or 100 of one of them. You cannot request 100 of both.
     *
     * @param id User ID. Multiple user IDs can be specified. Limit: 100.
     * @param login User login name. Multiple login names can be specified. Limit: 100.
     * @return
     * @throws JSONException
     */
    public JSONObject getUsers(@Nullable List<String> id, @Nullable List<String> login) throws JSONException {
        return this.getUsersAsync(id, login).block();
    }

    /**
     * Gets information about one or more specified Twitch users. Users are identified by optional user IDs and/or login name. If neither a user ID
     * nor a login name is specified, the user is looked up by Bearer token. Note: The limit of 100 IDs and login names is the total limit. You can
     * request, for example, 50 of each or 100 of one of them. You cannot request 100 of both.
     *
     * @param id User ID. Multiple user IDs can be specified. Limit: 100.
     * @param login User login name. Multiple login names can be specified. Limit: 100.
     * @return
     * @throws JSONException
     */
    public Mono<JSONObject> getUsersAsync(@Nullable List<String> id, @Nullable List<String> login) throws JSONException {
        String userIds = null;

        if (id != null && !id.isEmpty()) {
            userIds = id.stream().limit(100).collect(Collectors.joining("&id="));
        }

        String userLogins = null;

        if (login != null && !login.isEmpty()) {
            userLogins = login.stream().limit(100 - (id != null ? id.stream().count() : 0)).collect(Collectors.joining("&login="));
        }

        boolean both = false;

        if (id != null && !id.isEmpty() && id.size() < 100 && login != null && !login.isEmpty()) {
            both = true;
        }

        String endpoint = "/users" + (userIds != null || userLogins != null ? "?" : "") + this.qspValid("id", userIds)
                + (both ? "&" : "") + this.qspValid("login", userLogins);

        return this.handleQueryAsync(endpoint, () -> {
            return this.handleRequest(HttpMethod.GET, endpoint);
        });
    }

    /**
     * Starts a commercial on a specified channel.
     *
     * @param broadcaster_id ID of the channel requesting a commercial.
     * @param length Desired length of the commercial in seconds. Valid options are 30, 60, 90, 120, 150, 180.
     * @return
     * @throws JSONException
     * @throws IllegalArgumentException
     */
    public JSONObject startCommercial(String broadcaster_id, int length) throws JSONException, IllegalArgumentException {
        return this.startCommercialAsync(broadcaster_id, length).block();
    }

    /**
     * Starts a commercial on a specified channel.
     *
     * @param broadcaster_id ID of the channel requesting a commercial.
     * @param length Desired length of the commercial in seconds. Valid options are 30, 60, 90, 120, 150, 180.
     * @return
     * @throws JSONException
     * @throws IllegalArgumentException
     */
    public Mono<JSONObject> startCommercialAsync(String broadcaster_id, int length) throws JSONException, IllegalArgumentException {
        if (broadcaster_id == null || broadcaster_id.isBlank()) {
            throw new IllegalArgumentException("broadcaster_id");
        }

        if (length != 30 && length != 60 && length != 90 && length != 120 && length != 150 && length != 180) {
            throw new IllegalArgumentException("length");
        }

        JSONStringer js = new JSONStringer();

        js.object().key("broadcaster_id").value(broadcaster_id).key("length").value(length).endObject();

        String endpoint = "/channels/commercial";

        return this.handleMutatorAsync(endpoint + js.toString(), () -> {
            return this.handleRequest(HttpMethod.POST, endpoint, js.toString());
        });
    }

    /**
     * Gets all custom emotes for a specific Twitch channel including subscriber emotes, Bits tier emotes, and follower emotes. Custom channel emotes
     * are custom emoticons that viewers may use in Twitch chat once they are subscribed to, cheered in, or followed the channel that owns the emotes.
     *
     * @param broadcaster_id The broadcaster whose emotes are being requested.
     * @return
     * @throws JSONException
     * @throws IllegalArgumentException
     */
    public JSONObject getChannelEmotes(String broadcaster_id) throws JSONException, IllegalArgumentException {
        return this.getChannelEmotesAsync(broadcaster_id).block();
    }

    /**
     * Gets all custom emotes for a specific Twitch channel including subscriber emotes, Bits tier emotes, and follower emotes. Custom channel emotes
     * are custom emoticons that viewers may use in Twitch chat once they are subscribed to, cheered in, or followed the channel that owns the emotes.
     *
     * @param broadcaster_id The broadcaster whose emotes are being requested.
     * @return
     * @throws JSONException
     * @throws IllegalArgumentException
     */
    public Mono<JSONObject> getChannelEmotesAsync(String broadcaster_id) throws JSONException, IllegalArgumentException {
        if (broadcaster_id == null || broadcaster_id.isBlank()) {
            throw new IllegalArgumentException("broadcaster_id");
        }

        String endpoint = "/chat/emotes?broadcaster_id=" + broadcaster_id;

        return this.handleQueryAsync(endpoint, () -> {
            return this.handleRequest(HttpMethod.GET, endpoint);
        });
    }

    /**
     * Gets all global emotes. Global emotes are Twitch-specific emoticons that every user can use in Twitch chat.
     *
     * @return
     * @throws JSONException
     */
    public JSONObject getGlobalEmotes() throws JSONException {
        return this.getGlobalEmotesAsync().block();
    }

    /**
     * Gets all global emotes. Global emotes are Twitch-specific emoticons that every user can use in Twitch chat.
     *
     * @return
     * @throws JSONException
     */
    public Mono<JSONObject> getGlobalEmotesAsync() throws JSONException {
        String endpoint = "/chat/emotes/global";

        return this.handleQueryAsync(endpoint, () -> {
            return this.handleRequest(HttpMethod.GET, endpoint);
        });
    }

    /**
     * Retrieves the list of available Cheermotes, animated emotes to which viewers can assign Bits, to cheer in chat. Cheermotes returned are
     * available throughout Twitch, in all Bits-enabled channels.
     *
     * @param broadcaster_id ID for the broadcaster who might own specialized Cheermotes.
     * @return
     * @throws JSONException
     */
    public JSONObject getCheermotes(@Nullable String broadcaster_id) throws JSONException {
        return this.getCheermotesAsync(broadcaster_id).block();
    }

    /**
     * Retrieves the list of available Cheermotes, animated emotes to which viewers can assign Bits, to cheer in chat. Cheermotes returned are
     * available throughout Twitch, in all Bits-enabled channels.
     *
     * @param broadcaster_id ID for the broadcaster who might own specialized Cheermotes.
     * @return
     * @throws JSONException
     */
    public Mono<JSONObject> getCheermotesAsync(@Nullable String broadcaster_id) throws JSONException {
        String endpoint = "/bits/cheermotes" + this.qspValid("?broadcaster_id", broadcaster_id);

        return this.handleQueryAsync(endpoint, () -> {
            return this.handleRequest(HttpMethod.GET, endpoint);
        });
    }

    /**
     * Gets video information by one or more video IDs, user ID, or game ID. For lookup by user or game, several filters are available that can be
     * specified as query parameters. Each request must specify one or more video ids, one user_id, or one game_id. A request that uses video ids can
     * not use any other parameter. If a game is specified, a maximum of 500 results are available.
     *
     * @param id ID of the video being queried. Limit: 100. If this is specified, you cannot use any of the other query parameters below.
     * @param user_id ID of the user who owns the video.
     * @param game_id ID of the game the video is of.
     * @param first Number of values to be returned when getting videos by user or game ID. Limit: 100. Default: 20.
     * @param before Cursor for backward pagination: tells the server where to start fetching the next set of results, in a multi-page response. The
     * cursor value specified here is from the pagination response field of a prior query.
     * @param after Cursor for forward pagination: tells the server where to start fetching the next set of results, in a multi-page response. The
     * cursor value specified here is from the pagination response field of a prior query.
     * @param language Language of the video being queried. Limit: 1. A language value must be either the ISO 639-1 two-letter code for a supported
     * stream language or "other".
     * @param period Period during which the video was created. Valid values: "all", "day", "week", "month". Default: "all".
     * @param sort Sort order of the videos. Valid values: "time", "trending", "views". Default: "time".
     * @param type Type of video. Valid values: "all", "upload", "archive", "highlight". Default: "all".
     * @return
     * @throws JSONException
     * @throws IllegalArgumentException
     */
    public JSONObject getVideos(@Nullable List<String> id, @Nullable String user_id, @Nullable String game_id, int first, @Nullable String before,
            @Nullable String after, @Nullable String language, @Nullable String period, @Nullable String sort, @Nullable String type)
            throws JSONException, IllegalArgumentException {
        return this.getVideosAsync(id, user_id, game_id, first, before, after, language, period, sort, type).block();
    }

    /**
     * Gets video information by one or more video IDs, user ID, or game ID. For lookup by user or game, several filters are available that can be
     * specified as query parameters. Each request must specify one or more video ids, one user_id, or one game_id. A request that uses video ids can
     * not use any other parameter. If a game is specified, a maximum of 500 results are available.
     *
     * @param id ID of the video being queried. Limit: 100. If this is specified, you cannot use any of the other query parameters below.
     * @param user_id ID of the user who owns the video.
     * @param game_id ID of the game the video is of.
     * @param first Number of values to be returned when getting videos by user or game ID. Limit: 100. Default: 20.
     * @param before Cursor for backward pagination: tells the server where to start fetching the next set of results, in a multi-page response. The
     * cursor value specified here is from the pagination response field of a prior query.
     * @param after Cursor for forward pagination: tells the server where to start fetching the next set of results, in a multi-page response. The
     * cursor value specified here is from the pagination response field of a prior query.
     * @param language Language of the video being queried. Limit: 1. A language value must be either the ISO 639-1 two-letter code for a supported
     * stream language or "other".
     * @param period Period during which the video was created. Valid values: "all", "day", "week", "month". Default: "all".
     * @param sort Sort order of the videos. Valid values: "time", "trending", "views". Default: "time".
     * @param type Type of video. Valid values: "all", "upload", "archive", "highlight". Default: "all".
     * @return
     * @throws JSONException
     * @throws IllegalArgumentException
     */
    public Mono<JSONObject> getVideosAsync(@Nullable List<String> id, @Nullable String user_id, @Nullable String game_id, int first, @Nullable String before,
            @Nullable String after, @Nullable String language, @Nullable String period, @Nullable String sort, @Nullable String type)
            throws JSONException, IllegalArgumentException {
        if ((id == null || id.isEmpty()) && (user_id == null || user_id.isBlank()) && (game_id == null || game_id.isBlank())) {
            throw new IllegalArgumentException("id, user_id, or game_id");
        }

        if (id != null && !id.isEmpty() && ((after != null && !after.isBlank()) || (before != null && !before.isBlank()) || (language != null && !language.isBlank())
                || (period != null && !period.isBlank()) || (sort != null && !sort.isBlank()) || (type != null && !type.isBlank()))) {
            throw new IllegalArgumentException("other parameters not allowed with video id");
        }

        int c = 0;
        if (id != null && !id.isEmpty()) {
            c++;
        }

        if (user_id != null && !user_id.isBlank()) {
            c++;
        }

        if (game_id != null && !game_id.isBlank()) {
            c++;
        }

        if (c > 1) {
            throw new IllegalArgumentException("only one of id, user_id, or game_id may be specified");
        }

        if (before != null && !before.isBlank() && after != null && !after.isBlank()) {
            throw new IllegalArgumentException("can not use before and after at the same time");
        }

        if (period != null && !period.isBlank() && !period.equals("all") && !period.equals("day") && !period.equals("week") && !period.equals("month")) {
            throw new IllegalArgumentException("period");
        }

        if (sort != null && !sort.isBlank() && !sort.equals("time") && !sort.equals("trending") && !sort.equals("views")) {
            throw new IllegalArgumentException("sort");
        }

        if (type != null && !type.isBlank() && !type.equals("all") && !type.equals("upload") && !type.equals("archive") && !type.equals("highlight")) {
            throw new IllegalArgumentException("type");
        }

        if (first <= 0) {
            first = 20;
        }

        first = Math.max(1, Math.min(100, first));

        String ids = null;

        if (id != null && !id.isEmpty()) {
            ids = id.stream().limit(100).collect(Collectors.joining("&id="));
        }

        String endpoint = "/videos?" + this.qspValid("id", ids) + (ids == null ? "first=" + first : "")
                + this.qspValid("&user_id", user_id) + this.qspValid("&game_id", game_id) + this.qspValid("&after", after)
                + this.qspValid("&before", before) + this.qspValid("&language", language) + this.qspValid("&period", period)
                + this.qspValid("&sort", sort) + this.qspValid("&type", type);

        return this.handleQueryAsync(endpoint, () -> {
            return this.handleRequest(HttpMethod.GET, endpoint);
        });
    }

    /**
     * Retrieves a list of Twitch Teams of which the specified channel/broadcaster is a member.
     *
     * @param broadcaster_id User ID for a Twitch user.
     * @return
     * @throws JSONException
     * @throws IllegalArgumentException
     */
    public JSONObject getChannelTeams(String broadcaster_id) throws JSONException, IllegalArgumentException {
        return this.getChannelTeamsAsync(broadcaster_id).block();
    }

    /**
     * Retrieves a list of Twitch Teams of which the specified channel/broadcaster is a member.
     *
     * @param broadcaster_id User ID for a Twitch user.
     * @return
     * @throws JSONException
     * @throws IllegalArgumentException
     */
    public Mono<JSONObject> getChannelTeamsAsync(String broadcaster_id) throws JSONException, IllegalArgumentException {
        if (broadcaster_id == null || broadcaster_id.isBlank()) {
            throw new IllegalArgumentException("broadcaster_id");
        }

        String endpoint = "/teams/channel?broadcaster_id=" + broadcaster_id;

        return this.handleQueryAsync(endpoint, () -> {
            return this.handleRequest(HttpMethod.GET, endpoint);
        });
    }

    /**
     * Gets information for a specific Twitch Team. One of the two query parameters must be specified to return Team information.
     *
     * @param name Team name.
     * @param id Team ID.
     * @return
     * @throws JSONException
     * @throws IllegalArgumentException
     */
    public JSONObject getTeams(@Nullable String name, @Nullable String id) throws JSONException, IllegalArgumentException {
        return this.getTeamsAsync(name, id).block();
    }

    /**
     * Gets information for a specific Twitch Team. One of the two query parameters must be specified to return Team information.
     *
     * @param name Team name.
     * @param id Team ID.
     * @return
     * @throws JSONException
     * @throws IllegalArgumentException
     */
    public Mono<JSONObject> getTeamsAsync(@Nullable String name, @Nullable String id) throws JSONException, IllegalArgumentException {
        if ((name == null || name.isBlank()) && (id == null || id.isBlank())) {
            throw new IllegalArgumentException("name or id");
        }

        if (name != null && !name.isBlank() && id != null && !id.isBlank()) {
            throw new IllegalArgumentException("only one of name or id can be specified");
        }

        String endpoint = "/teams?" + this.qspValid("name", name) + this.qspValid("id", id);

        return this.handleQueryAsync(endpoint, () -> {
            return this.handleRequest(HttpMethod.GET, endpoint);
        });
    }

    /**
     * Gets clip information by clip ID (one or more), broadcaster ID (one only), or game ID (one only). Note: The clips service returns a maximum of
     * 1000 clips.
     *
     * @param id ID of the clip being queried. Limit: 100. If this is specified, you cannot use any of the other query parameters below.
     * @param broadcaster_id ID of the broadcaster for whom clips are returned. Results are ordered by view count.
     * @param game_id ID of the game for which clips are returned. Results are ordered by view count.
     * @param first Maximum number of objects to return. Maximum: 100. Default: 20.
     * @param before Cursor for backward pagination: tells the server where to start fetching the next set of results, in a multi-page response. The
     * cursor value specified here is from the pagination response field of a prior query.
     * @param after Cursor for forward pagination: tells the server where to start fetching the next set of results, in a multi-page response. The
     * cursor value specified here is from the pagination response field of a prior query.
     * @param started_at Starting date/time for returned clips, in RFC3339 format. (The seconds value is ignored.) If this is specified, ended_at also
     * should be specified; otherwise, the ended_at date/time will be 1 week after the started_at value.
     * @param ended_at Ending date/time for returned clips, in RFC3339 format. (Note that the seconds value is ignored.) If this is specified,
     * started_at also must be specified; otherwise, the time period is ignored.
     * @return
     * @throws JSONException
     * @throws IllegalArgumentException
     */
    public JSONObject getClips(@Nullable List<String> id, @Nullable String broadcaster_id, @Nullable String game_id, int first,
            @Nullable String before, @Nullable String after, @Nullable String started_at, @Nullable String ended_at)
            throws JSONException, IllegalArgumentException {
        return this.getClipsAsync(id, broadcaster_id, game_id, first, before, after, started_at, ended_at).block();
    }

    /**
     * Gets clip information by clip ID (one or more), broadcaster ID (one only), or game ID (one only). Note: The clips service returns a maximum of
     * 1000 clips.
     *
     * @param id ID of the clip being queried. Limit: 100. If this is specified, you cannot use any of the other query parameters below.
     * @param broadcaster_id ID of the broadcaster for whom clips are returned. Results are ordered by view count.
     * @param game_id ID of the game for which clips are returned. Results are ordered by view count.
     * @param first Maximum number of objects to return. Maximum: 100. Default: 20.
     * @param before Cursor for backward pagination: tells the server where to start fetching the next set of results, in a multi-page response. The
     * cursor value specified here is from the pagination response field of a prior query.
     * @param after Cursor for forward pagination: tells the server where to start fetching the next set of results, in a multi-page response. The
     * cursor value specified here is from the pagination response field of a prior query.
     * @param started_at Starting date/time for returned clips. (The seconds value is ignored.) If this is specified, ended_at also should be
     * specified; otherwise, the ended_at date/time will be 1 week after the started_at value.
     * @param ended_at Ending date/time for returned clips. (Note that the seconds value is ignored.) If this is specified, started_at also must be
     * specified; otherwise, the time period is ignored.
     * @return
     * @throws JSONException
     * @throws IllegalArgumentException
     */
    public Mono<JSONObject> getClipsAsync(@Nullable List<String> id, @Nullable String broadcaster_id, @Nullable String game_id, int first,
            @Nullable String before, @Nullable String after, @Nullable Calendar started_at, @Nullable Calendar ended_at)
            throws JSONException, IllegalArgumentException {
        String started_atS = null;
        String ended_atS = null;

        if (started_at != null || ended_at != null) {
            SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss'Z'");
            Calendar c = Calendar.getInstance();
            c.setTimeZone(TimeZone.getTimeZone(ZoneOffset.UTC));

            if (started_at != null) {
                c.setTimeInMillis(started_at.getTimeInMillis());
                started_atS = sdf.format(c.getTime());
            }

            if (ended_at != null) {
                c.setTimeInMillis(ended_at.getTimeInMillis());
                ended_atS = sdf.format(c.getTime());
            }
        }

        return this.getClipsAsync(id, broadcaster_id, game_id, first, before, after, started_atS, ended_atS);
    }

    /**
     * Gets clip information by clip ID (one or more), broadcaster ID (one only), or game ID (one only). Note: The clips service returns a maximum of
     * 1000 clips.
     *
     * @param id ID of the clip being queried. Limit: 100. If this is specified, you cannot use any of the other query parameters below.
     * @param broadcaster_id ID of the broadcaster for whom clips are returned. Results are ordered by view count.
     * @param game_id ID of the game for which clips are returned. Results are ordered by view count.
     * @param first Maximum number of objects to return. Maximum: 100. Default: 20.
     * @param before Cursor for backward pagination: tells the server where to start fetching the next set of results, in a multi-page response. The
     * cursor value specified here is from the pagination response field of a prior query.
     * @param after Cursor for forward pagination: tells the server where to start fetching the next set of results, in a multi-page response. The
     * cursor value specified here is from the pagination response field of a prior query.
     * @param started_at Starting date/time for returned clips, in RFC3339 format. (The seconds value is ignored.) If this is specified, ended_at also
     * should be specified; otherwise, the ended_at date/time will be 1 week after the started_at value.
     * @param ended_at Ending date/time for returned clips, in RFC3339 format. (Note that the seconds value is ignored.) If this is specified,
     * started_at also must be specified; otherwise, the time period is ignored.
     * @return
     * @throws JSONException
     * @throws IllegalArgumentException
     */
    public Mono<JSONObject> getClipsAsync(@Nullable List<String> id, @Nullable String broadcaster_id, @Nullable String game_id, int first,
            @Nullable String before, @Nullable String after, @Nullable String started_at, @Nullable String ended_at)
            throws JSONException, IllegalArgumentException {
        if ((id == null || id.isEmpty()) && (broadcaster_id == null || broadcaster_id.isBlank()) && (game_id == null || game_id.isBlank())) {
            throw new IllegalArgumentException("id, broadcaster_id, or game_id");
        }

        if (id != null && !id.isEmpty() && ((after != null && !after.isBlank()) || (before != null && !before.isBlank())
                || (ended_at != null && !ended_at.isBlank()) || (started_at != null && !started_at.isBlank()))) {
            throw new IllegalArgumentException("other parameters not allowed with clip id");
        }

        if (ended_at != null && !ended_at.isBlank() && (started_at == null || started_at.isBlank())) {
            throw new IllegalArgumentException("started_at");
        }

        int c = 0;
        if (id != null && !id.isEmpty()) {
            c++;
        }

        if (broadcaster_id != null && !broadcaster_id.isBlank()) {
            c++;
        }

        if (game_id != null && !game_id.isBlank()) {
            c++;
        }

        if (c > 1) {
            throw new IllegalArgumentException("only one of id, broadcaster_id, or game_id may be specified");
        }

        if (before != null && !before.isBlank() && after != null && !after.isBlank()) {
            throw new IllegalArgumentException("can not use before and after at the same time");
        }

        if (first <= 0) {
            first = 20;
        }

        first = Math.max(1, Math.min(100, first));

        String ids = null;

        if (id != null && !id.isEmpty()) {
            ids = id.stream().limit(100).collect(Collectors.joining("&id="));
        }

        String endpoint = "/clips?" + this.qspValid("id", ids) + (ids == null ? "first=" + first : "")
                + this.qspValid("&broadcaster_id", broadcaster_id) + this.qspValid("&game_id", game_id) + this.qspValid("&after", after)
                + this.qspValid("&before", before) + this.qspValid("&started_at", started_at) + this.qspValid("&ended_at", ended_at);

        return this.handleQueryAsync(endpoint, () -> {
            return this.handleRequest(HttpMethod.GET, endpoint);
        });
    }

    private class CallRequest {

        private final Date expires;
        private final Mono<JSONObject> processor;

        private CallRequest(Date expires, Mono<JSONObject> processor) {
            this.expires = expires;
            this.processor = processor;
        }
    }
}
