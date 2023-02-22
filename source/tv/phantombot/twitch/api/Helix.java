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
package tv.phantombot.twitch.api;

import com.gmt2001.ExecutorService;
import com.gmt2001.HttpRequest;
import com.gmt2001.httpclient.HttpClient;
import com.gmt2001.httpclient.HttpClientResponse;
import com.gmt2001.httpclient.NotJSONException;
import com.gmt2001.httpclient.URIUtil;
import io.netty.handler.codec.http.HttpHeaders;
import io.netty.handler.codec.http.HttpMethod;
import java.math.BigInteger;
import java.net.URLEncoder;
import java.nio.charset.Charset;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Duration;
import java.time.Instant;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.Queue;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentLinkedQueue;
import java.util.concurrent.ConcurrentMap;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.locks.ReentrantLock;
import java.util.function.Supplier;
import java.util.regex.Pattern;
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
    private final Queue<Mono<JSONObject>> requestQueue = new ConcurrentLinkedQueue<>();
    @SuppressWarnings("MismatchedQueryAndUpdateOfCollection")
    private final ConcurrentMap<String, CallRequest> calls = new ConcurrentHashMap<>();
    private final ReentrantLock lock = new ReentrantLock();
    private Instant nextWarning = Instant.now();

    private Helix() {
        Thread.setDefaultUncaughtExceptionHandler(com.gmt2001.UncaughtExceptionHandler.instance());
        ExecutorService.schedule(() -> {
            ExecutorService.scheduleWithFixedDelay(Helix.instance()::processQueue, QUEUE_TIME, QUEUE_TIME, TimeUnit.MILLISECONDS);
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

                Instant d = Instant.now();
                calls.entrySet().stream().filter(kvp -> (kvp.getValue().expires.isBefore(d))).forEachOrdered(kvp -> {
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
     * @param oauth
     * @return
     */
    private JSONObject handleRequest(HttpMethod type, String endPoint, String data, String oauth) throws JSONException {
        try {
            return this.handleRequest(type, endPoint, data, false, oauth);
        } catch (Throwable ex) {
            if (ex.getCause() != null && ex.getMessage().startsWith("{")) {
                com.gmt2001.Console.err.printStackTrace(ex.getCause());
                /**
                 * @botproperty helixdebug - If `true`, debugging info for Twitch Helix API requests are sent to the debug log. Default `false`
                 * @botpropertycatsort helixdebug 100 900 Debug
                 */
                if (CaselessProperties.instance().getPropertyAsBoolean("helixdebug", false)) {
                    com.gmt2001.Console.debug.println(ex.getMessage());
                }
                JSONObject jso = new JSONObject(ex.getMessage());
                jso.put("error", "Exception");
                return jso;
            } else {
                com.gmt2001.Console.err.printStackTrace(ex);
                JSONObject jso = new JSONObject();
                jso.put("error", "Exception");
                return jso;
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
     * @param oauth
     * @return
     */
    private JSONObject handleRequest(HttpMethod type, String endPoint, String data, boolean isRetry, String oauth) throws JSONException, Throwable {
        JSONObject returnObject = new JSONObject();
        int responseCode = 0;

        this.checkRateLimit();

        try {
            if ((this.oAuthToken == null || this.oAuthToken.isBlank()) && (oauth == null || oauth.isBlank())) {
                throw new IllegalArgumentException("apioauth is required");
            }

            if (data == null) {
                data = "";
            }

            HttpHeaders headers = HttpClient.createHeaders(type, true);
            headers.add("Client-ID", CaselessProperties.instance().getProperty("clientid", TwitchValidate.instance().getAPIClientID()));
            headers.add("Authorization", "Bearer " + (oauth != null && !oauth.isBlank() ? oauth : this.oAuthToken));
            HttpClientResponse response = HttpClient.request(type, URIUtil.create(BASE_URL + endPoint), headers, data);

            responseCode = response.responseCode().code();

            if (CaselessProperties.instance().getPropertyAsBoolean("helixdebug", false)) {
                com.gmt2001.Console.debug.println("Helix ratelimit response > Limit: " + response.responseHeaders().getAsString("Ratelimit-Limit")
                        + " <> Remaining: " + response.responseHeaders().getAsString("Ratelimit-Remaining") + " <> Reset: "
                        + response.responseHeaders().getAsString("Ratelimit-Reset"));
            }

            this.updateRateLimits(response.responseHeaders().getInt("Ratelimit-Limit", RATELIMIT_DEFMAX),
                    response.responseHeaders().getInt("Ratelimit-Remaining", 1),
                    response.responseHeaders().getInt("Ratelimit-Reset", (int) (Instant.now().toEpochMilli() / 1000)) * 1000);

            try {
                if (responseCode == 204) {
                    returnObject = new JSONObject();
                    returnObject.put("message", response.responseCode().reasonPhrase());
                    returnObject.put("status", responseCode);
                } else {
                    returnObject = response.jsonOrThrow();
                }
            } catch (NotJSONException ex) {
                returnObject = new JSONObject();
                returnObject.put("message", response.responseBody());
                returnObject.put("error", "Not JSON");
                returnObject.put("status", responseCode);
                throw ex;
            }
            // Generate the return object,
            HttpRequest.generateJSONObject(returnObject, true, type.name(), data, endPoint, responseCode, "", "");
        } catch (Exception ex) {
            // Generate the return object.
            HttpRequest.generateJSONObject(returnObject, false, type.name(), data, endPoint, responseCode, ex.getClass().getSimpleName(), ex.getMessage());
            throw new Exception(returnObject.toString(), ex);
        }

        if (returnObject.has("error") && nextWarning.isBefore(Instant.now())) {
            this.nextWarning = Instant.now().plus(WARNING_INTERVAL_MINS, ChronoUnit.MINUTES);

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
            return this.handleRequest(type, endPoint, data, true, oauth);
        }

        return returnObject;
    }

    /**
     * Method that handles data for Helix.
     *
     * @param type
     * @param url
     * @param data
     * @param oauth
     * @return
     */
    private JSONObject handleRequest(HttpMethod type, String endPoint, String data) throws JSONException {
        return this.handleRequest(type, endPoint, data, null);
    }

    /**
     * Method that handles a request without any data being passed.
     *
     * @param type
     * @param endPoint
     * @return
     */
    private JSONObject handleRequest(HttpMethod type, String endPoint) throws JSONException {
        return this.handleRequest(type, endPoint, "", null);
    }

    private Mono<JSONObject> handleQueryAsync(String callid, Supplier<JSONObject> action) {
        return calls.computeIfAbsent(this.digest(callid), k -> {
            Mono<JSONObject> processor = Mono.<JSONObject>create(emitter -> {
                try {
                    emitter.success(action.get());
                } catch (JSONException | IllegalArgumentException ex) {
                    emitter.error(ex);
                }
            }).cache();
            requestQueue.add(processor);
            return new CallRequest(Instant.now().plusMillis(CACHE_TIME), processor);
        }).processor;
    }

    private Mono<JSONObject> handleMutatorAsync(String callid, Supplier<JSONObject> action) {
        return calls.computeIfAbsent(this.digest(callid), k -> {
            Mono<JSONObject> processor = Mono.<JSONObject>create(emitter -> {
                try {
                    emitter.success(action.get());
                } catch (JSONException | IllegalArgumentException ex) {
                    emitter.error(ex);
                }
            }).cache();
            requestQueue.add(processor);
            return new CallRequest(Instant.now().plusMillis(MUTATOR_CACHE_TIME), processor);
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
            @Nullable String before, @Nullable String after, @Nullable ZonedDateTime started_at, @Nullable ZonedDateTime ended_at)
            throws JSONException, IllegalArgumentException {
        String started_atS = null;
        String ended_atS = null;

        if (started_at != null || ended_at != null) {
            DateTimeFormatter dateTimeFormatter = DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss'Z'");
            if (started_at != null) {
                started_atS = started_at.format(dateTimeFormatter);
            }

            if (ended_at != null) {
                ended_atS = ended_at.format(dateTimeFormatter);
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

    /**
     * Colors to be used with {@link sendChatAnnouncement}
     */
    public enum AnnouncementColors {
        /**
         * The primary color of the channel
         */
        PRIMARY,
        /**
         * Blue
         */
        BLUE,
        /**
         * Green
         */
        GREEN,
        /**
         * Orange
         */
        ORANGE,
        /**
         * Purple
         */
        PURPLE;

        @Override
        public String toString() {
            return this.name().toLowerCase();
        }
    }

    /**
     * Sends an announcement to the broadcaster's chat room.
     *
     * @param broadcaster_id The ID of the broadcaster that owns the chat room to send the announcement to.
     * @param message The announcement to make in the broadcaster's chat room. Announcements are limited to a maximum of 500 characters; announcements
     * longer than 500 characters are truncated.
     * @param color The color used to highlight the announcement. If color is set to primary, the channel's accent color is used to highlight the
     * announcement (see Profile Accent Color under profile settings, Channel and Videos, and Brand).
     * @return
     * @throws JSONException
     * @throws IllegalArgumentException
     */
    public JSONObject sendChatAnnouncement(String broadcaster_id, String message, String color)
            throws JSONException, IllegalArgumentException {
        return this.sendChatAnnouncementAsync(broadcaster_id, message, color).block();
    }

    /**
     * Sends an announcement to the broadcaster's chat room.
     *
     * @param broadcaster_id The ID of the broadcaster that owns the chat room to send the announcement to.
     * @param message The announcement to make in the broadcaster's chat room. Announcements are limited to a maximum of 500 characters; announcements
     * longer than 500 characters are truncated.
     * @param color The color used to highlight the announcement. If color is set to primary, the channel's accent color is used to highlight the
     * announcement (see Profile Accent Color under profile settings, Channel and Videos, and Brand).
     * @return
     * @throws JSONException
     * @throws IllegalArgumentException
     */
    public Mono<JSONObject> sendChatAnnouncementAsync(String broadcaster_id, String message, String color)
            throws JSONException, IllegalArgumentException {
        AnnouncementColors ecolor;
        try {
            ecolor = AnnouncementColors.valueOf(color.toUpperCase().trim());
        } catch (IllegalArgumentException | NullPointerException ex) {
            ecolor = AnnouncementColors.PRIMARY;
        }

        return this.sendChatAnnouncementAsync(broadcaster_id, message, ecolor);
    }

    /**
     * Sends an announcement to the broadcaster's chat room.
     *
     * @param broadcaster_id The ID of the broadcaster that owns the chat room to send the announcement to.
     * @param message The announcement to make in the broadcaster's chat room. Announcements are limited to a maximum of 500 characters; announcements
     * longer than 500 characters are truncated.
     * @param color The color used to highlight the announcement. If color is set to primary, the channel's accent color is used to highlight the
     * announcement (see Profile Accent Color under profile settings, Channel and Videos, and Brand).
     * @return
     * @throws JSONException
     * @throws IllegalArgumentException
     */
    public JSONObject sendChatAnnouncement(String broadcaster_id, String message, AnnouncementColors color)
            throws JSONException, IllegalArgumentException {
        return this.sendChatAnnouncementAsync(broadcaster_id, message, color).block();
    }

    /**
     * Sends an announcement to the broadcaster's chat room.
     *
     * @param broadcaster_id The ID of the broadcaster that owns the chat room to send the announcement to.
     * @param message The announcement to make in the broadcaster's chat room. Announcements are limited to a maximum of 500 characters; announcements
     * longer than 500 characters are truncated.
     * @param color The color used to highlight the announcement. If color is set to primary, the channel's accent color is used to highlight the
     * announcement (see Profile Accent Color under profile settings, Channel and Videos, and Brand).
     * @return
     * @throws JSONException
     * @throws IllegalArgumentException
     */
    public Mono<JSONObject> sendChatAnnouncementAsync(String broadcaster_id, String message, AnnouncementColors color)
            throws JSONException, IllegalArgumentException {
        if (broadcaster_id == null || broadcaster_id.isBlank()) {
            throw new IllegalArgumentException("broadcaster_id");
        }

        if (message == null || message.isBlank()) {
            throw new IllegalArgumentException("message");
        }

        if (color == null) {
            throw new IllegalArgumentException("color");
        }

        JSONStringer js = new JSONStringer();

        js.object().key("message").value(message).key("color").value(color.toString()).endObject();

        String endpoint = "/chat/announcements?" + this.qspValid("broadcaster_id", broadcaster_id) + this.qspValid("&moderator_id", this.chooseModeratorId("moderator:manage:announcements"));

        return this.handleMutatorAsync(endpoint + js.toString(), () -> {
            return this.handleRequest(HttpMethod.POST, endpoint, js.toString(), this.chooseModeratorOAuth("moderator:manage:announcements"));
        });
    }

    /**
     * Bans a user from participating in a broadcaster's chat room, or puts them in a timeout.
     *
     * If the user is currently in a timeout, you can call this endpoint to change the duration of the timeout or ban them altogether. If the user is
     * currently banned, you cannot call this method to put them in a timeout instead.
     *
     * @param broadcaster_id The ID of the broadcaster whose chat room the user is being banned from.
     * @param user_id The ID of the user to ban or put in a timeout.
     * @param reason The reason the user is being banned or put in a timeout. The text is user defined and limited to a maximum of 500 characters.
     * @param duration To ban a user indefinitely, specify this value as {@code 0}. To put a user in a timeout, specify the timeout period, in
     * seconds. The minimum timeout is 1 second and the maximum is 1,209,600 seconds (2 weeks).
     * @return
     * @throws JSONException
     * @throws IllegalArgumentException
     */
    public JSONObject banUser(String broadcaster_id, String user_id, @Nullable String reason, int duration)
            throws JSONException, IllegalArgumentException {
        return this.banUserAsync(broadcaster_id, user_id, reason, duration).block();
    }

    /**
     * Bans a user from participating in a broadcaster's chat room, or puts them in a timeout.
     *
     * If the user is currently in a timeout, you can call this endpoint to change the duration of the timeout or ban them altogether. If the user is
     * currently banned, you cannot call this method to put them in a timeout instead.
     *
     * @param broadcaster_id The ID of the broadcaster whose chat room the user is being banned from.
     * @param user_id The ID of the user to ban or put in a timeout.
     * @param reason The reason the user is being banned or put in a timeout. The text is user defined and limited to a maximum of 500 characters.
     * @param duration To ban a user indefinitely, specify this value as {@code 0}. To put a user in a timeout, specify the timeout period, in
     * seconds. The minimum timeout is 1 second and the maximum is 1,209,600 seconds (2 weeks).
     * @return
     * @throws JSONException
     * @throws IllegalArgumentException
     */
    public Mono<JSONObject> banUserAsync(String broadcaster_id, String user_id, @Nullable String reason, int duration)
            throws JSONException, IllegalArgumentException {
        if (broadcaster_id == null || broadcaster_id.isBlank()) {
            throw new IllegalArgumentException("broadcaster_id");
        }

        if (user_id == null || user_id.isBlank()) {
            throw new IllegalArgumentException("user_id");
        }

        if (reason == null) {
            reason = "No reason given (PhantomBot)";
        }

        if (reason.length() > 500) {
            reason = reason.substring(0, 497) + "...";
        }

        duration = Math.max(0, Math.min(1209600, duration));

        JSONStringer js = new JSONStringer();

        js.object().key("data").object();

        if (duration > 0) {
            js.key("duration").value(duration);
        }

        js.key("reason").value(reason).key("user_id").value(user_id).endObject().endObject();

        String endpoint = "/moderation/bans?" + this.qspValid("broadcaster_id", broadcaster_id) + this.qspValid("&moderator_id", this.chooseModeratorId("moderator:manage:banned_users"));

        return this.handleMutatorAsync(endpoint + js.toString(), () -> {
            return this.handleRequest(HttpMethod.POST, endpoint, js.toString(), this.chooseModeratorOAuth("moderator:manage:banned_users"));
        });
    }

    /**
     * Removes the ban or timeout that was placed on the specified user.
     *
     * @param broadcaster_id The ID of the broadcaster whose chat room the user is banned from chatting in.
     * @param user_id The ID of the user to remove the ban or timeout from.
     * @return
     * @throws JSONException
     * @throws IllegalArgumentException
     */
    public JSONObject unbanUser(String broadcaster_id, String user_id)
            throws JSONException, IllegalArgumentException {
        return this.unbanUserAsync(broadcaster_id, user_id).block();
    }

    /**
     * Removes the ban or timeout that was placed on the specified user.
     *
     * @param broadcaster_id The ID of the broadcaster whose chat room the user is banned from chatting in.
     * @param user_id The ID of the user to remove the ban or timeout from.
     * @return
     * @throws JSONException
     * @throws IllegalArgumentException
     */
    public Mono<JSONObject> unbanUserAsync(String broadcaster_id, String user_id)
            throws JSONException, IllegalArgumentException {
        if (broadcaster_id == null || broadcaster_id.isBlank()) {
            throw new IllegalArgumentException("broadcaster_id");
        }

        if (user_id == null || user_id.isBlank()) {
            throw new IllegalArgumentException("user_id");
        }

        String endpoint = "/moderation/bans?" + this.qspValid("broadcaster_id", broadcaster_id) + this.qspValid("&moderator_id", this.chooseModeratorId("moderator:manage:banned_users")) + this.qspValid("&user_id", user_id);

        return this.handleMutatorAsync(endpoint, () -> {
            return this.handleRequest(HttpMethod.DELETE, endpoint, "", this.chooseModeratorOAuth("moderator:manage:banned_users"));
        });
    }

    /**
     * Removes a single chat message or all chat messages from the broadcaster's chat room.
     *
     * Restrictions when specifying a {@code message_id}: The message must have been created within the last 6 hours. The message must not belong to
     * the broadcaster.
     *
     * @param broadcaster_id The ID of the broadcaster that owns the chat room to remove messages from.
     * @param message_id The ID of the message to remove. The id tag in the PRIVMSG contains the message's ID. If {@code null}, the request removes
     * all messages in the broadcaster's chat room.
     * @return
     * @throws JSONException
     * @throws IllegalArgumentException
     */
    public JSONObject deleteChatMessages(String broadcaster_id, @Nullable String message_id)
            throws JSONException, IllegalArgumentException {
        return this.deleteChatMessagesAsync(broadcaster_id, message_id).block();
    }

    /**
     * Removes a single chat message or all chat messages from the broadcaster's chat room.
     *
     * Restrictions when specifying a {@code message_id}: The message must have been created within the last 6 hours. The message must not belong to
     * the broadcaster.
     *
     * @param broadcaster_id The ID of the broadcaster that owns the chat room to remove messages from.
     * @param message_id The ID of the message to remove. The id tag in the PRIVMSG contains the message's ID. If {@code null}, the request removes
     * all messages in the broadcaster's chat room.
     * @return
     * @throws JSONException
     * @throws IllegalArgumentException
     */
    public Mono<JSONObject> deleteChatMessagesAsync(String broadcaster_id, @Nullable String message_id)
            throws JSONException, IllegalArgumentException {
        if (broadcaster_id == null || broadcaster_id.isBlank()) {
            throw new IllegalArgumentException("broadcaster_id");
        }

        String endpoint = "/moderation/chat?" + this.qspValid("broadcaster_id", broadcaster_id) + this.qspValid("&moderator_id", this.chooseModeratorId("moderator:manage:chat_messages")) + this.qspValid("&message_id", message_id);

        return this.handleMutatorAsync(endpoint, () -> {
            return this.handleRequest(HttpMethod.DELETE, endpoint, "", this.chooseModeratorOAuth("moderator:manage:chat_messages"));
        });
    }

    /**
     * Raid another channel by sending the broadcaster's viewers to the targeted channel.
     *
     * Requires the API OAuth to belong to {@code from_broadcaster_id}.
     *
     * Rate Limit: The limit is 10 requests within a 10-minute window.
     *
     * @param from_broadcaster_id The ID of the broadcaster that's sending the raiding party.
     * @param to_broadcaster_id The ID of the broadcaster to raid.
     * @return
     * @throws JSONException
     * @throws IllegalArgumentException
     */
    public JSONObject startRaid(String from_broadcaster_id, String to_broadcaster_id)
            throws JSONException, IllegalArgumentException {
        return this.startRaidAsync(from_broadcaster_id, to_broadcaster_id).block();
    }

    /**
     * Raid another channel by sending the broadcaster's viewers to the targeted channel.
     *
     * Requires the API OAuth to belong to {@code from_broadcaster_id}.
     *
     * Rate Limit: The limit is 10 requests within a 10-minute window.
     *
     * @param from_broadcaster_id The ID of the broadcaster that's sending the raiding party.
     * @param to_broadcaster_id The ID of the broadcaster to raid.
     * @return
     * @throws JSONException
     * @throws IllegalArgumentException
     */
    public Mono<JSONObject> startRaidAsync(String from_broadcaster_id, String to_broadcaster_id)
            throws JSONException, IllegalArgumentException {
        if (from_broadcaster_id == null || from_broadcaster_id.isBlank()) {
            throw new IllegalArgumentException("from_broadcaster_id");
        }

        if (to_broadcaster_id == null || to_broadcaster_id.isBlank()) {
            throw new IllegalArgumentException("to_broadcaster_id");
        }

        String endpoint = "/raids?" + this.qspValid("from_broadcaster_id", from_broadcaster_id) + this.qspValid("&to_broadcaster_id", to_broadcaster_id);

        return this.handleMutatorAsync(endpoint, () -> {
            return this.handleRequest(HttpMethod.POST, endpoint);
        });
    }

    /**
     * Cancel a pending raid.
     *
     * Requires the API OAuth to belong to {@code broadcaster_id}.
     *
     * Rate Limit: The limit is 10 requests within a 10-minute window.
     *
     * @param broadcaster_id The ID of the broadcaster that sent the raiding party.
     * @return
     * @throws JSONException
     * @throws IllegalArgumentException
     */
    public JSONObject cancelRaid(String broadcaster_id)
            throws JSONException, IllegalArgumentException {
        return this.cancelRaidAsync(broadcaster_id).block();
    }

    /**
     * Cancel a pending raid.
     *
     * Requires the API OAuth to belong to {@code broadcaster_id}.
     *
     * Rate Limit: The limit is 10 requests within a 10-minute window.
     *
     * @param broadcaster_id The ID of the broadcaster that sent the raiding party.
     * @return
     * @throws JSONException
     * @throws IllegalArgumentException
     */
    public Mono<JSONObject> cancelRaidAsync(String broadcaster_id)
            throws JSONException, IllegalArgumentException {
        if (broadcaster_id == null || broadcaster_id.isBlank()) {
            throw new IllegalArgumentException("broadcaster_id");
        }

        String endpoint = "/raids?" + this.qspValid("broadcaster_id", broadcaster_id);

        return this.handleMutatorAsync(endpoint, () -> {
            return this.handleRequest(HttpMethod.DELETE, endpoint);
        });
    }

    /**
     * Updates the broadcaster's chat settings.
     *
     * Only supply a value for settings that are to be updated. All values that are to be unchanged must be set to {@code null}.
     *
     * Requires the API OAuth to belong to {@code broadcaster_id}.
     *
     * @param broadcaster_id The ID of the broadcaster whose chat settings you want to update.
     * @param emote_mode A Boolean value that determines whether chat messages must contain only emotes.
     * @param follower_mode A Boolean value that determines whether the broadcaster restricts the chat room to followers only, based on how long
     * they've followed.
     * @param follower_mode_duration The length of time, in minutes, that the followers must have followed the broadcaster to participate in the chat
     * room. You may specify a value in the range: 0 (no restriction) through 129600 (3 months).
     * @param non_moderator_chat_delay A Boolean value that determines whether the broadcaster adds a short delay before chat messages appear in the
     * chat room. This gives chat moderators and bots a chance to remove them before viewers can see the message.
     * @param non_moderator_chat_delay_duration The amount of time, in seconds, that messages are delayed from appearing in chat. Must be one of: 2,
     * 4, 6.
     * @param slow_mode A Boolean value that determines whether the broadcaster limits how often users in the chat room are allowed to send messages.
     * @param slow_mode_wait_time The amount of time, in seconds, that users need to wait between sending messages. You may specify a value in the
     * range: 3 (3 second delay) through 120 (2 minute delay).
     * @param subscriber_mode A Boolean value that determines whether only users that subscribe to the broadcaster's channel can talk in the chat
     * room.
     * @param unique_chat_mode A Boolean value that determines whether the broadcaster requires users to post only unique messages in the chat room.
     * Formerly known as r9k beta.
     * @return
     * @throws JSONException
     * @throws IllegalArgumentException
     */
    public JSONObject updateChatSettings(String broadcaster_id, @Nullable Boolean emote_mode, @Nullable Boolean follower_mode,
            @Nullable Integer follower_mode_duration, @Nullable Boolean non_moderator_chat_delay, @Nullable Integer non_moderator_chat_delay_duration,
            @Nullable Boolean slow_mode, @Nullable Integer slow_mode_wait_time, @Nullable Boolean subscriber_mode, @Nullable Boolean unique_chat_mode)
            throws JSONException, IllegalArgumentException {
        return this.updateChatSettingsAsync(broadcaster_id, emote_mode, follower_mode, follower_mode_duration, non_moderator_chat_delay,
                non_moderator_chat_delay_duration, slow_mode, slow_mode_wait_time, subscriber_mode, unique_chat_mode).block();
    }

    /**
     * Updates the broadcaster's chat settings.
     *
     * Only supply a value for settings that are to be updated. All values that are to be unchanged must be set to {@code null}.
     *
     * Requires the API OAuth to belong to {@code broadcaster_id}.
     *
     * @param broadcaster_id The ID of the broadcaster whose chat settings you want to update.
     * @param emote_mode A Boolean value that determines whether chat messages must contain only emotes.
     * @param follower_mode A Boolean value that determines whether the broadcaster restricts the chat room to followers only, based on how long
     * they've followed.
     * @param follower_mode_duration The length of time, in minutes, that the followers must have followed the broadcaster to participate in the chat
     * room. You may specify a value in the range: 0 (no restriction) through 129600 (3 months).
     * @param non_moderator_chat_delay A Boolean value that determines whether the broadcaster adds a short delay before chat messages appear in the
     * chat room. This gives chat moderators and bots a chance to remove them before viewers can see the message.
     * @param non_moderator_chat_delay_duration The amount of time, in seconds, that messages are delayed from appearing in chat. Must be one of: 2,
     * 4, 6.
     * @param slow_mode A Boolean value that determines whether the broadcaster limits how often users in the chat room are allowed to send messages.
     * @param slow_mode_wait_time The amount of time, in seconds, that users need to wait between sending messages. You may specify a value in the
     * range: 3 (3 second delay) through 120 (2 minute delay).
     * @param subscriber_mode A Boolean value that determines whether only users that subscribe to the broadcaster's channel can talk in the chat
     * room.
     * @param unique_chat_mode A Boolean value that determines whether the broadcaster requires users to post only unique messages in the chat room.
     * Formerly known as r9k beta.
     * @return
     * @throws JSONException
     * @throws IllegalArgumentException
     */
    public Mono<JSONObject> updateChatSettingsAsync(String broadcaster_id, @Nullable Boolean emote_mode, @Nullable Boolean follower_mode,
            @Nullable Integer follower_mode_duration, @Nullable Boolean non_moderator_chat_delay, @Nullable Integer non_moderator_chat_delay_duration,
            @Nullable Boolean slow_mode, @Nullable Integer slow_mode_wait_time, @Nullable Boolean subscriber_mode, @Nullable Boolean unique_chat_mode)
            throws JSONException, IllegalArgumentException {
        if (broadcaster_id == null || broadcaster_id.isBlank()) {
            throw new IllegalArgumentException("broadcaster_id");
        }

        boolean hasValues = false;

        JSONStringer js = new JSONStringer();

        js.object();

        if (emote_mode != null) {
            hasValues = true;
            js.key("emote_mode").value(emote_mode);
        }

        if (follower_mode != null) {
            hasValues = true;
            js.key("follower_mode").value(follower_mode);
        }

        if (follower_mode_duration != null) {
            hasValues = true;
            follower_mode_duration = Math.max(0, Math.min(129600, follower_mode_duration));
            js.key("follower_mode_duration").value(follower_mode_duration);
        }

        if (non_moderator_chat_delay != null) {
            hasValues = true;
            js.key("non_moderator_chat_delay").value(non_moderator_chat_delay);
        }

        if (non_moderator_chat_delay_duration != null) {
            if (non_moderator_chat_delay_duration != 2 && non_moderator_chat_delay_duration != 4 && non_moderator_chat_delay_duration != 6) {
                throw new IllegalArgumentException("non_moderator_chat_delay_duration");
            }

            hasValues = true;
            js.key("non_moderator_chat_delay_duration").value(non_moderator_chat_delay_duration);
        }

        if (slow_mode != null) {
            hasValues = true;
            js.key("slow_mode").value(slow_mode);
        }

        if (slow_mode_wait_time != null) {
            hasValues = true;
            slow_mode_wait_time = Math.max(3, Math.min(120, slow_mode_wait_time));
            js.key("slow_mode_wait_time").value(slow_mode_wait_time);
        }

        if (subscriber_mode != null) {
            hasValues = true;
            js.key("subscriber_mode").value(subscriber_mode);
        }

        if (unique_chat_mode != null) {
            hasValues = true;
            js.key("unique_chat_mode").value(unique_chat_mode);
        }

        js.endObject();

        if (!hasValues) {
            throw new IllegalArgumentException("Must provide at least one setting to update");
        }

        String endpoint = "/chat/settings?" + this.qspValid("broadcaster_id", broadcaster_id) + this.qspValid("&moderator_id", this.chooseModeratorId("moderator:manage:chat_settings"));

        return this.handleMutatorAsync(endpoint + js.toString(), () -> {
            return this.handleRequest(HttpMethod.PATCH, endpoint, js.toString(), this.chooseModeratorOAuth("moderator:manage:chat_settings"));
        });
    }

    /**
     * Sends a whisper message to the specified user.
     *
     * NOTE: uses the Bot (Chat) username and OAuth to send the whisper.
     *
     * NOTE: The user sending the whisper must have a verified phone number.
     *
     * NOTE: The API may silently drop whispers that it suspects of violating Twitch policies. (The API does not indicate that it dropped the whisper;
     * it returns a 204 status code as if it succeeded).
     *
     * Rate Limits: You may whisper to a maximum of 40 unique recipients per day. Within the per day limit, you may whisper a maximum of 3 whispers
     * per second and a maximum of 100 whispers per minute.
     *
     * The maximum message lengths are: 500 characters if the user you're sending the message to hasn't whispered you before. 10,000 characters if the
     * user you're sending the message to has whispered you before. Messages that exceed the maximum length are truncated.
     *
     * @param to_user_id The ID of the user to receive the whisper.
     * @param message The whisper message to send. The message must not be empty.
     * @return
     * @throws JSONException
     * @throws IllegalArgumentException
     */
    public JSONObject sendWhisper(String to_user_id, String message)
            throws JSONException, IllegalArgumentException {
        return this.sendWhisperAsync(to_user_id, message).block();
    }

    /**
     * Sends a whisper message to the specified user.
     *
     * NOTE: Uses the Bot (Chat) username and OAuth to send the whisper.
     *
     * NOTE: The user sending the whisper must have a verified phone number.
     *
     * NOTE: The API may silently drop whispers that it suspects of violating Twitch policies. (The API does not indicate that it dropped the whisper;
     * it returns a 204 status code as if it succeeded).
     *
     * Rate Limits: You may whisper to a maximum of 40 unique recipients per day. Within the per day limit, you may whisper a maximum of 3 whispers
     * per second and a maximum of 100 whispers per minute.
     *
     * The maximum message lengths are: 500 characters if the user you're sending the message to hasn't whispered you before. 10,000 characters if the
     * user you're sending the message to has whispered you before. Messages that exceed the maximum length are truncated.
     *
     * @param to_user_id The ID of the user to receive the whisper.
     * @param message The whisper message to send. The message must not be empty.
     * @return
     * @throws JSONException
     * @throws IllegalArgumentException
     */
    public Mono<JSONObject> sendWhisperAsync(String to_user_id, String message)
            throws JSONException, IllegalArgumentException {
        if (to_user_id == null || to_user_id.isBlank()) {
            throw new IllegalArgumentException("to_user_id");
        }

        if (message == null || message.isBlank()) {
            throw new IllegalArgumentException("message");
        }

        JSONStringer js = new JSONStringer();

        js.object().key("message").value(message).endObject();

        String endpoint = "/whispers?" + this.qspValid("from_user_id", TwitchValidate.instance().getChatUserID()) + this.qspValid("&to_user_id", to_user_id);

        return this.handleMutatorAsync(endpoint + js.toString(), () -> {
            return this.handleRequest(HttpMethod.POST, endpoint, js.toString(), CaselessProperties.instance().getProperty("oauth").replaceFirst("oauth:", ""));
        });
    }

    /**
     * Returns a list of Custom Reward objects for the Custom Rewards on a channel.
     *
     * @param id When used, this parameter filters the results and only returns reward objects for the Custom Rewards with matching ID. Maximum: 50
     * @param only_manageable_rewards When set to {@code true}, only returns custom rewards that the calling Client ID can manage. Default:
     * {@code false}.
     * @return
     * @throws JSONException
     * @throws IllegalArgumentException
     */
    public JSONObject getCustomReward(@Nullable List<String> id, @Nullable Boolean only_manageable_rewards)
            throws JSONException, IllegalArgumentException {
        return this.getCustomRewardAsync(id, only_manageable_rewards).block();
    }

    /**
     * Returns a list of Custom Reward objects for the Custom Rewards on a channel.
     *
     * @param id When used, this parameter filters the results and only returns reward objects for the Custom Rewards with matching ID. Maximum: 50
     * @param only_manageable_rewards When set to {@code true}, only returns custom rewards that the calling Client ID can manage. Default:
     * {@code false}.
     * @return
     * @throws JSONException
     * @throws IllegalArgumentException
     */
    public Mono<JSONObject> getCustomRewardAsync(@Nullable List<String> id, @Nullable Boolean only_manageable_rewards)
            throws JSONException, IllegalArgumentException {
        if (id != null && id.size() > 50) {
            throw new IllegalArgumentException("Limit 50 ids");
        }

        String ids = null;

        if (id != null && !id.isEmpty()) {
            ids = id.stream().limit(50).collect(Collectors.joining("&id="));
        }

        String only_manageable_rewardsS = null;

        if (only_manageable_rewards != null) {
            only_manageable_rewardsS = only_manageable_rewards ? "true" : "false";
        }

        String endpoint = "/channel_points/custom_rewards?" + this.qspValid("broadcaster_id", TwitchValidate.instance().getAPIUserID())
                + this.qspValid("&id", ids) + this.qspValid("&only_manageable_rewards", only_manageable_rewardsS);

        return this.handleQueryAsync(endpoint, () -> {
            return this.handleRequest(HttpMethod.GET, endpoint);
        });
    }

    /**
     * Hex color pattern for custom rewards
     */
    private static final Pattern HEXCOLOR = Pattern.compile("^#[0-9A-F]{6}$", Pattern.CASE_INSENSITIVE);

    /**
     * Creates a Custom Reward in the broadcaster\'s channel. The maximum number of custom rewards per channel is 50, which includes both enabled and
     * disabled rewards.
     *
     * @param title The custom reward\'s title. The title may contain a maximum of 45 characters and it must be unique amongst all of the
     * broadcaster\'s custom rewards.
     * @param cost The cost of the reward, in Channel Points. The minimum is 1 point.
     * @param is_enabled A Boolean value that determines whether the reward is enabled. Viewers see only enabled rewards. The default is {@code true}.
     * @param background_color The background color to use for the reward. Specify the color using Hex format (for example, {@code #9147FF}).
     * @param is_user_input_required A Boolean value that determines whether the user needs to enter information when redeeming the reward. See the
     * {@code prompt} field. The default is {@code false}.
     * @param prompt The prompt shown to the viewer when they redeem the reward. Specify a prompt if {@code is_user_input_required} is {@code true}.
     * The prompt is limited to a maximum of 200 characters.
     * @param is_max_per_stream_enabled A Boolean value that determines whether to limit the maximum number of redemptions allowed per live stream
     * (see the {@code max_per_stream} field). The default is {@code false}.
     * @param max_per_stream The maximum number of redemptions allowed per live stream. Applied only if {@code is_max_per_stream_enabled} is
     * {@code true}. The minimum value is {@code 1}.
     * @param is_max_per_user_per_stream_enabled A Boolean value that determines whether to limit the maximum number of redemptions allowed per user
     * per stream (see the {@code max_per_user_per_stream} field). The default is {@code false}.
     * @param max_per_user_per_stream The maximum number of redemptions allowed per user per stream. Applied only if
     * {@code is_max_per_user_per_stream_enabled} is {@code true}. The minimum value is {@code 1}.
     * @param is_global_cooldown_enabled A Boolean value that determines whether to apply a cooldown period between redemptions (see the
     * {@code global_cooldown_seconds} field for the duration of the cooldown period). The default is {@code false}.
     * @param global_cooldown_seconds The cooldown period, in seconds. Applied only if the {@code is_global_cooldown_enabled} field is {@code true}.
     * The minimum value is {@code 1}; however, the minimum value is {@code 60} for it to be shown in the Twitch UX.
     * @param should_redemptions_skip_request_queue A Boolean value that determines whether redemptions should be set to {@code FULFILLED} status
     * immediately when a reward is redeemed. If {@code false}, status is set to {@code UNFULFILLED} and follows the normal request queue process. The
     * default is {@code false}.
     * @return
     * @throws JSONException
     * @throws IllegalArgumentException
     */
    public JSONObject createCustomReward(String title, int cost, @Nullable Boolean is_enabled, @Nullable String background_color,
            @Nullable Boolean is_user_input_required, @Nullable String prompt, @Nullable Boolean is_max_per_stream_enabled,
            @Nullable Integer max_per_stream, @Nullable Boolean is_max_per_user_per_stream_enabled, @Nullable Integer max_per_user_per_stream,
            @Nullable Boolean is_global_cooldown_enabled, @Nullable Integer global_cooldown_seconds,
            @Nullable Boolean should_redemptions_skip_request_queue)
            throws JSONException, IllegalArgumentException {
        return this.createCustomRewardAsync(title, cost, is_enabled, background_color, is_user_input_required, prompt, is_max_per_stream_enabled,
                max_per_stream, is_max_per_user_per_stream_enabled, max_per_user_per_stream, is_global_cooldown_enabled, global_cooldown_seconds,
                should_redemptions_skip_request_queue).block();
    }

    /**
     * Creates a Custom Reward in the broadcaster\'s channel. The maximum number of custom rewards per channel is 50, which includes both enabled and
     * disabled rewards.
     *
     * @param title The custom reward\'s title. The title may contain a maximum of 45 characters and it must be unique amongst all of the
     * broadcaster\'s custom rewards.
     * @param cost The cost of the reward, in Channel Points. The minimum is 1 point.
     * @param is_enabled A Boolean value that determines whether the reward is enabled. Viewers see only enabled rewards. The default is {@code true}.
     * @param background_color The background color to use for the reward. Specify the color using Hex format (for example, {@code #9147FF}).
     * @param is_user_input_required A Boolean value that determines whether the user needs to enter information when redeeming the reward. See the
     * {@code prompt} field. The default is {@code false}.
     * @param prompt The prompt shown to the viewer when they redeem the reward. Specify a prompt if {@code is_user_input_required} is {@code true}.
     * The prompt is limited to a maximum of 200 characters.
     * @param is_max_per_stream_enabled A Boolean value that determines whether to limit the maximum number of redemptions allowed per live stream
     * (see the {@code max_per_stream} field). The default is {@code false}.
     * @param max_per_stream The maximum number of redemptions allowed per live stream. Applied only if {@code is_max_per_stream_enabled} is
     * {@code true}. The minimum value is {@code 1}.
     * @param is_max_per_user_per_stream_enabled A Boolean value that determines whether to limit the maximum number of redemptions allowed per user
     * per stream (see the {@code max_per_user_per_stream} field). The default is {@code false}.
     * @param max_per_user_per_stream The maximum number of redemptions allowed per user per stream. Applied only if
     * {@code is_max_per_user_per_stream_enabled} is {@code true}. The minimum value is {@code 1}.
     * @param is_global_cooldown_enabled A Boolean value that determines whether to apply a cooldown period between redemptions (see the
     * {@code global_cooldown_seconds} field for the duration of the cooldown period). The default is {@code false}.
     * @param global_cooldown_seconds The cooldown period, in seconds. Applied only if the {@code is_global_cooldown_enabled} field is {@code true}.
     * The minimum value is {@code 1}; however, the minimum value is {@code 60} for it to be shown in the Twitch UX.
     * @param should_redemptions_skip_request_queue A Boolean value that determines whether redemptions should be set to {@code FULFILLED} status
     * immediately when a reward is redeemed. If {@code false}, status is set to {@code UNFULFILLED} and follows the normal request queue process. The
     * default is {@code false}.
     * @return
     * @throws JSONException
     * @throws IllegalArgumentException
     */
    public Mono<JSONObject> createCustomRewardAsync(String title, int cost, @Nullable Boolean is_enabled, @Nullable String background_color,
            @Nullable Boolean is_user_input_required, @Nullable String prompt, @Nullable Boolean is_max_per_stream_enabled,
            @Nullable Integer max_per_stream, @Nullable Boolean is_max_per_user_per_stream_enabled, @Nullable Integer max_per_user_per_stream,
            @Nullable Boolean is_global_cooldown_enabled, @Nullable Integer global_cooldown_seconds,
            @Nullable Boolean should_redemptions_skip_request_queue)
            throws JSONException, IllegalArgumentException {
        if (title == null || title.isBlank() || title.length() > 45) {
            throw new IllegalArgumentException("title must not be blank or more than 45 characters");
        }

        if (cost < 1) {
            throw new IllegalArgumentException("cost must be at least 1");
        }

        if (background_color != null && !HEXCOLOR.matcher(background_color).matches()) {
            throw new IllegalArgumentException("background_color must be a full hex format color, satisfying the regex ^#[0-9A-F]{6}$");
        }

        if (prompt != null && prompt.length() > 200) {
            throw new IllegalArgumentException("prompt must be not be more than 200 characters");
        }

        if (is_max_per_stream_enabled != null && is_max_per_stream_enabled && (max_per_stream == null || max_per_stream < 1)) {
            throw new IllegalArgumentException("max_per_stream must be at least 1");
        }

        if (is_max_per_user_per_stream_enabled != null && is_max_per_user_per_stream_enabled
                && (max_per_user_per_stream == null || max_per_user_per_stream < 1)) {
            throw new IllegalArgumentException("max_per_user_per_stream must be at least 1");
        }

        if (is_global_cooldown_enabled != null && is_global_cooldown_enabled && (global_cooldown_seconds == null || global_cooldown_seconds < 1)) {
            throw new IllegalArgumentException("global_cooldown_seconds must be at least 1");
        }

        JSONStringer js = new JSONStringer();
        js.object();

        js.key("title").value(title).key("cost").value(cost);

        if (is_enabled != null) {
            js.key("is_enabled").value(is_enabled);
        }

        if (background_color != null) {
            js.key("background_color").value(background_color.toUpperCase());
        }

        if (is_user_input_required != null) {
            js.key("is_user_input_required").value(is_user_input_required);
        }

        if (prompt != null) {
            js.key("prompt").value(prompt);
        }

        if (is_max_per_stream_enabled != null) {
            js.key("is_max_per_stream_enabled").value(is_max_per_stream_enabled);

            if (max_per_stream == null) {
                max_per_stream = 1;
            }

            js.key("max_per_stream").value(max_per_stream);
        }

        if (is_max_per_user_per_stream_enabled != null) {
            js.key("is_max_per_user_per_stream_enabled").value(is_max_per_user_per_stream_enabled);

            if (max_per_user_per_stream == null) {
                max_per_user_per_stream = 1;
            }

            js.key("max_per_user_per_stream").value(max_per_user_per_stream);
        }

        if (is_global_cooldown_enabled != null) {
            js.key("is_global_cooldown_enabled").value(is_global_cooldown_enabled);

            if (global_cooldown_seconds == null) {
                global_cooldown_seconds = 1;
            }

            js.key("global_cooldown_seconds").value(global_cooldown_seconds);
        }

        if (should_redemptions_skip_request_queue != null) {
            js.key("should_redemptions_skip_request_queue").value(should_redemptions_skip_request_queue);
        }

        js.endObject();

        String endpoint = "/channel_points/custom_rewards?" + this.qspValid("broadcaster_id", TwitchValidate.instance().getAPIUserID());
        return this.handleMutatorAsync(endpoint + js.toString(), () -> {
            return this.handleRequest(HttpMethod.POST, endpoint, js.toString());
        });
    }

    /**
     * Updates a custom reward. The app used to create the reward is the only app that may update the reward.
     *
     * @param id The ID of the reward to update.
     * @param title The custom reward\'s title. The title may contain a maximum of 45 characters and it must be unique amongst all of the
     * broadcaster\'s custom rewards.
     * @param cost The cost of the reward, in Channel Points. The minimum is 1 point.
     * @param is_enabled A Boolean value that determines whether the reward is enabled. Viewers see only enabled rewards. The default is {@code true}.
     * @param is_paused A Boolean value that determines whether the reward is currently paused. Is {@code true} if the reward is paused. Viewers
     * can\'t redeem paused rewards.
     * @param background_color The background color to use for the reward. Specify the color using Hex format (for example, {@code #9147FF}).
     * @param is_user_input_required A Boolean value that determines whether the user needs to enter information when redeeming the reward. See the
     * {@code prompt} field. The default is {@code false}.
     * @param prompt The prompt shown to the viewer when they redeem the reward. Specify a prompt if {@code is_user_input_required} is {@code true}.
     * The prompt is limited to a maximum of 200 characters.
     * @param is_max_per_stream_enabled A Boolean value that determines whether to limit the maximum number of redemptions allowed per live stream
     * (see the {@code max_per_stream} field). The default is {@code false}.
     * @param max_per_stream The maximum number of redemptions allowed per live stream. Applied only if {@code is_max_per_stream_enabled} is
     * {@code true}. The minimum value is {@code 1}.
     * @param is_max_per_user_per_stream_enabled A Boolean value that determines whether to limit the maximum number of redemptions allowed per user
     * per stream (see the {@code max_per_user_per_stream} field). The default is {@code false}.
     * @param max_per_user_per_stream The maximum number of redemptions allowed per user per stream. Applied only if
     * {@code is_max_per_user_per_stream_enabled} is {@code true}. The minimum value is {@code 1}.
     * @param is_global_cooldown_enabled A Boolean value that determines whether to apply a cooldown period between redemptions (see the
     * {@code global_cooldown_seconds} field for the duration of the cooldown period). The default is {@code false}.
     * @param global_cooldown_seconds The cooldown period, in seconds. Applied only if the {@code is_global_cooldown_enabled} field is {@code true}.
     * The minimum value is {@code 1}; however, the minimum value is {@code 60} for it to be shown in the Twitch UX.
     * @param should_redemptions_skip_request_queue A Boolean value that determines whether redemptions should be set to {@code FULFILLED} status
     * immediately when a reward is redeemed. If {@code false}, status is set to {@code UNFULFILLED} and follows the normal request queue process. The
     * default is {@code false}.
     * @return
     * @throws JSONException
     * @throws IllegalArgumentException
     */
    public JSONObject updateCustomReward(String id, @Nullable String title, @Nullable Integer cost, @Nullable Boolean is_enabled,
            @Nullable Boolean is_paused, @Nullable String background_color, @Nullable Boolean is_user_input_required, @Nullable String prompt,
            @Nullable Boolean is_max_per_stream_enabled, @Nullable Integer max_per_stream, @Nullable Boolean is_max_per_user_per_stream_enabled,
            @Nullable Integer max_per_user_per_stream, @Nullable Boolean is_global_cooldown_enabled, @Nullable Integer global_cooldown_seconds,
            @Nullable Boolean should_redemptions_skip_request_queue)
            throws JSONException, IllegalArgumentException {
        return this.updateCustomRewardAsync(id, title, cost, is_enabled, is_paused, background_color, is_user_input_required, prompt,
                is_max_per_stream_enabled, max_per_stream, is_max_per_user_per_stream_enabled, max_per_user_per_stream, is_global_cooldown_enabled,
                global_cooldown_seconds, should_redemptions_skip_request_queue).block();
    }

    /**
     * Updates a custom reward. The app used to create the reward is the only app that may update the reward.
     *
     * @param id The ID of the reward to update.
     * @param title The custom reward\'s title. The title may contain a maximum of 45 characters and it must be unique amongst all of the
     * broadcaster\'s custom rewards.
     * @param cost The cost of the reward, in Channel Points. The minimum is 1 point.
     * @param is_enabled A Boolean value that determines whether the reward is enabled. Viewers see only enabled rewards. The default is {@code true}.
     * @param is_paused A Boolean value that determines whether the reward is currently paused. Is {@code true} if the reward is paused. Viewers
     * can\'t redeem paused rewards.
     * @param background_color The background color to use for the reward. Specify the color using Hex format (for example, {@code #9147FF}).
     * @param is_user_input_required A Boolean value that determines whether the user needs to enter information when redeeming the reward. See the
     * {@code prompt} field. The default is {@code false}.
     * @param prompt The prompt shown to the viewer when they redeem the reward. Specify a prompt if {@code is_user_input_required} is {@code true}.
     * The prompt is limited to a maximum of 200 characters.
     * @param is_max_per_stream_enabled A Boolean value that determines whether to limit the maximum number of redemptions allowed per live stream
     * (see the {@code max_per_stream} field). The default is {@code false}.
     * @param max_per_stream The maximum number of redemptions allowed per live stream. Applied only if {@code is_max_per_stream_enabled} is
     * {@code true}. The minimum value is {@code 1}.
     * @param is_max_per_user_per_stream_enabled A Boolean value that determines whether to limit the maximum number of redemptions allowed per user
     * per stream (see the {@code max_per_user_per_stream} field). The default is {@code false}.
     * @param max_per_user_per_stream The maximum number of redemptions allowed per user per stream. Applied only if
     * {@code is_max_per_user_per_stream_enabled} is {@code true}. The minimum value is {@code 1}.
     * @param is_global_cooldown_enabled A Boolean value that determines whether to apply a cooldown period between redemptions (see the
     * {@code global_cooldown_seconds} field for the duration of the cooldown period). The default is {@code false}.
     * @param global_cooldown_seconds The cooldown period, in seconds. Applied only if the {@code is_global_cooldown_enabled} field is {@code true}.
     * The minimum value is {@code 1}; however, the minimum value is {@code 60} for it to be shown in the Twitch UX.
     * @param should_redemptions_skip_request_queue A Boolean value that determines whether redemptions should be set to {@code FULFILLED} status
     * immediately when a reward is redeemed. If {@code false}, status is set to {@code UNFULFILLED} and follows the normal request queue process. The
     * default is {@code false}.
     * @return
     * @throws JSONException
     * @throws IllegalArgumentException
     */
    public Mono<JSONObject> updateCustomRewardAsync(String id, @Nullable String title, @Nullable Integer cost, @Nullable Boolean is_enabled,
            @Nullable Boolean is_paused, @Nullable String background_color, @Nullable Boolean is_user_input_required, @Nullable String prompt,
            @Nullable Boolean is_max_per_stream_enabled, @Nullable Integer max_per_stream, @Nullable Boolean is_max_per_user_per_stream_enabled,
            @Nullable Integer max_per_user_per_stream, @Nullable Boolean is_global_cooldown_enabled, @Nullable Integer global_cooldown_seconds,
            @Nullable Boolean should_redemptions_skip_request_queue)
            throws JSONException, IllegalArgumentException {
        if (id == null || id.isBlank()) {
            throw new IllegalArgumentException("id is required");
        }

        if (title != null && (title.isBlank() || title.length() > 45)) {
            throw new IllegalArgumentException("title must not be blank or more than 45 characters");
        }

        if (cost != null && cost < 1) {
            throw new IllegalArgumentException("cost must be at least 1");
        }

        if (background_color != null && !HEXCOLOR.matcher(background_color).matches()) {
            throw new IllegalArgumentException("background_color must be a full hex format color, satisfying the regex ^#[0-9A-F]{6}$");
        }

        if (prompt != null && prompt.length() > 200) {
            throw new IllegalArgumentException("prompt must be not be more than 200 characters");
        }

        if (is_max_per_stream_enabled != null && is_max_per_stream_enabled && (max_per_stream == null || max_per_stream < 1)) {
            throw new IllegalArgumentException("max_per_stream must be at least 1");
        }

        if (is_max_per_user_per_stream_enabled != null && is_max_per_user_per_stream_enabled
                && (max_per_user_per_stream == null || max_per_user_per_stream < 1)) {
            throw new IllegalArgumentException("max_per_user_per_stream must be at least 1");
        }

        if (is_global_cooldown_enabled != null && is_global_cooldown_enabled && (global_cooldown_seconds == null || global_cooldown_seconds < 1)) {
            throw new IllegalArgumentException("global_cooldown_seconds must be at least 1");
        }

        JSONStringer js = new JSONStringer();
        js.object();

        boolean hasUpdate = false;

        if (title != null) {
            hasUpdate = true;
            js.key("title").value(title);
        }

        if (cost != null) {
            hasUpdate = true;
            js.key("cost").value(cost);
        }

        if (is_enabled != null) {
            hasUpdate = true;
            js.key("is_enabled").value(is_enabled);
        }

        if (is_paused != null) {
            hasUpdate = true;
            js.key("is_paused").value(is_paused);
        }

        if (background_color != null) {
            hasUpdate = true;
            js.key("background_color").value(background_color.toUpperCase());
        }

        if (is_user_input_required != null) {
            hasUpdate = true;
            js.key("is_user_input_required").value(is_user_input_required);
        }

        if (prompt != null) {
            hasUpdate = true;
            js.key("prompt").value(prompt);
        }

        if (is_max_per_stream_enabled != null) {
            hasUpdate = true;
            js.key("is_max_per_stream_enabled").value(is_max_per_stream_enabled);

            if (max_per_stream == null) {
                max_per_stream = 1;
            }

            js.key("max_per_stream").value(max_per_stream);
        }

        if (is_max_per_user_per_stream_enabled != null) {
            hasUpdate = true;
            js.key("is_max_per_user_per_stream_enabled").value(is_max_per_user_per_stream_enabled);

            if (max_per_user_per_stream == null) {
                max_per_user_per_stream = 1;
            }

            js.key("max_per_user_per_stream").value(max_per_user_per_stream);
        }

        if (is_global_cooldown_enabled != null) {
            hasUpdate = true;
            js.key("is_global_cooldown_enabled").value(is_global_cooldown_enabled);

            if (global_cooldown_seconds == null) {
                global_cooldown_seconds = 1;
            }

            js.key("global_cooldown_seconds").value(global_cooldown_seconds);
        }

        if (should_redemptions_skip_request_queue != null) {
            hasUpdate = true;
            js.key("should_redemptions_skip_request_queue").value(should_redemptions_skip_request_queue);
        }

        js.endObject();

        if (!hasUpdate) {
            throw new IllegalArgumentException("Must specify at least 1 parameter to update");
        }

        String endpoint = "/channel_points/custom_rewards?" + this.qspValid("broadcaster_id", TwitchValidate.instance().getAPIUserID())
                + this.qspValid("&id", id);
        return this.handleMutatorAsync(endpoint + js.toString(), () -> {
            return this.handleRequest(HttpMethod.PATCH, endpoint, js.toString());
        });
    }

    /**
     * Deletes a custom reward that the broadcaster created. The app used to create the reward is the only app that may delete it. If the reward\'s
     * redemption status is {@code UNFULFILLED} at the time the reward is deleted, its redemption status is marked as {@code FULFILLED}.
     *
     * @param id The ID of the custom reward to delete.
     * @return
     * @throws JSONException
     * @throws IllegalArgumentException
     */
    public JSONObject deleteCustomReward(String id)
            throws JSONException, IllegalArgumentException {
        return this.deleteCustomRewardAsync(id).block();
    }

    /**
     * Deletes a custom reward that the broadcaster created. The app used to create the reward is the only app that may delete it. If the reward\'s
     * redemption status is {@code UNFULFILLED} at the time the reward is deleted, its redemption status is marked as {@code FULFILLED}.
     *
     * @param id The ID of the custom reward to delete.
     * @return
     * @throws JSONException
     * @throws IllegalArgumentException
     */
    public Mono<JSONObject> deleteCustomRewardAsync(String id)
            throws JSONException, IllegalArgumentException {
        if (id == null || id.isBlank()) {
            throw new IllegalArgumentException("id is required");
        }

        String endpoint = "/channel_points/custom_rewards?" + this.qspValid("broadcaster_id", TwitchValidate.instance().getAPIUserID())
                + this.qspValid("&id", id);
        return this.handleMutatorAsync(endpoint, () -> {
            return this.handleRequest(HttpMethod.DELETE, endpoint);
        });
    }

    /**
     * The status of a custom reward redemption
     */
    public enum CustomRewardRedemptionStatus {
        /**
         * Not fulfilled yet
         */
        UNFULFILLED,
        /**
         * Cancelled and refunded
         */
        CANCELED,
        /**
         * Fulfilled
         */
        FULFILLED
    }

    /**
     * Updates a redemption\'s status.
     *
     * You may update a redemption only if its status is UNFULFILLED. The app used to create the reward is the only app that may update the
     * redemption.
     *
     * @param id A list of IDs that identify the redemptions to update. You may specify a maximum of 50 IDs.
     * @param reward_id The ID that identifies the reward that\'s been redeemed.
     * @param newStatus The status to set the redemption to. Setting the status to {@link CustomRewardRedemptionStatus.CANCELLED} refunds the user\'s
     * channel points.
     * @return
     * @throws JSONException
     * @throws IllegalArgumentException
     */
    public JSONObject updateRedemptionStatus(List<String> id, String reward_id, CustomRewardRedemptionStatus newStatus)
            throws JSONException, IllegalArgumentException {
        return this.updateRedemptionStatusAsync(id, reward_id, newStatus).block();
    }

    /**
     * Updates a redemption\'s status.
     *
     * You may update a redemption only if its status is UNFULFILLED. The app used to create the reward is the only app that may update the
     * redemption.
     *
     * @param id A list of IDs that identify the redemptions to update. You may specify a maximum of 50 IDs.
     * @param reward_id The ID that identifies the reward that\'s been redeemed.
     * @param newStatus The status to set the redemption to. Setting the status to {@link CustomRewardRedemptionStatus.CANCELLED} refunds the user\'s
     * channel points.
     * @return
     * @throws JSONException
     * @throws IllegalArgumentException
     */
    public Mono<JSONObject> updateRedemptionStatusAsync(List<String> id, String reward_id, CustomRewardRedemptionStatus newStatus)
            throws JSONException, IllegalArgumentException {
        if (id == null || id.isEmpty()) {
            throw new IllegalArgumentException("id is required");
        }

        if (id.size() > 50) {
            throw new IllegalArgumentException("Limit 50 ids");
        }

        if (reward_id == null || reward_id.isBlank()) {
            throw new IllegalArgumentException("reward_id is required");
        }

        if (newStatus == CustomRewardRedemptionStatus.UNFULFILLED) {
            throw new IllegalArgumentException("newStatus can not be CustomRewardRedemptionStatus.UNFULFILLED");
        }

        String ids = id.stream().limit(50).collect(Collectors.joining("&id="));

        if (ids == null || ids.isBlank()) {
            throw new IllegalArgumentException("id is required");
        }

        JSONStringer js = new JSONStringer();
        js.object().key("status").value(newStatus.name()).endObject();

        String endpoint = "/channel_points/custom_rewards/redemptions?" + this.qspValid("broadcaster_id", TwitchValidate.instance().getAPIUserID())
                + this.qspValid("&id", ids) + this.qspValid("&reward_id", reward_id);
        return this.handleMutatorAsync(endpoint + js.toString(), () -> {
            return this.handleRequest(HttpMethod.PATCH, endpoint, js.toString());
        });
    }

    /**
     * Activates or deactivates the broadcaster’s Shield Mode.
     *
     * Twitch's Shield Mode feature is like a panic button that broadcasters can push to protect themselves from chat abuse coming from one or more
     * accounts. When activated, Shield Mode applies the overrides that the broadcaster configured in the Twitch UX. If the broadcaster hasn't
     * configured Shield Mode, it applies default overrides.
     *
     * @param broadcaster_id The ID of the broadcaster whose Shield Mode you want to activate or deactivate.
     * @param isActive A Boolean value that determines whether to activate Shield Mode. Set to {@code true} to activate Shield Mode; otherwise,
     * {@code false} to deactivate Shield Mode.
     * @return
     * @throws JSONException
     * @throws IllegalArgumentException
     */
    public JSONObject updateShieldModeStatus(String broadcaster_id, boolean isActive)
            throws JSONException, IllegalArgumentException {
        return this.updateShieldModeStatusAsync(broadcaster_id, isActive).block();
    }

    /**
     * Activates or deactivates the broadcaster’s Shield Mode.
     *
     * Twitch's Shield Mode feature is like a panic button that broadcasters can push to protect themselves from chat abuse coming from one or more
     * accounts. When activated, Shield Mode applies the overrides that the broadcaster configured in the Twitch UX. If the broadcaster hasn't
     * configured Shield Mode, it applies default overrides.
     *
     * @param broadcaster_id The ID of the broadcaster whose Shield Mode you want to activate or deactivate.
     * @param isActive A Boolean value that determines whether to activate Shield Mode. Set to {@code true} to activate Shield Mode; otherwise,
     * {@code false} to deactivate Shield Mode.
     * @return
     * @throws JSONException
     * @throws IllegalArgumentException
     */
    public Mono<JSONObject> updateShieldModeStatusAsync(String broadcaster_id, boolean isActive)
            throws JSONException, IllegalArgumentException {
        if (broadcaster_id == null || broadcaster_id.isBlank()) {
            throw new IllegalArgumentException("broadcaster_id");
        }

        JSONStringer js = new JSONStringer();
        js.object().key("is_active").value(isActive).endObject();

        String endpoint = "/moderation/shield_mode?" + this.qspValid("broadcaster_id", broadcaster_id) + this.qspValid("&moderator_id", TwitchValidate.instance().getAPIUserID());

        return this.handleMutatorAsync(endpoint + js.toString(), () -> {
            return this.handleRequest(HttpMethod.PUT, endpoint, js.toString());
        });
    }

    /**
     * Sends a Shoutout to the specified broadcaster.
     *
     * Rate Limits: The broadcaster may send a Shoutout once every 2 minutes. They may send the same broadcaster a Shoutout once every 60 minutes.
     *
     * @param from_broadcaster_id The ID of the broadcaster that's sending the Shoutout.
     * @param to_broadcaster_id The ID of the broadcaster that's receiving the Shoutout.
     * @return
     * @throws JSONException
     * @throws IllegalArgumentException
     */
    public JSONObject sendShoutout(String from_broadcaster_id, String to_broadcaster_id)
            throws JSONException, IllegalArgumentException {
        return this.sendShoutoutAsync(from_broadcaster_id, to_broadcaster_id).block();
    }

    /**
     * Sends a Shoutout to the specified broadcaster.
     *
     * Rate Limits: The broadcaster may send a Shoutout once every 2 minutes. They may send the same broadcaster a Shoutout once every 60 minutes.
     *
     * @param from_broadcaster_id The ID of the broadcaster that's sending the Shoutout.
     * @param to_broadcaster_id The ID of the broadcaster that's receiving the Shoutout.
     * @return
     * @throws JSONException
     * @throws IllegalArgumentException
     */
    public Mono<JSONObject> sendShoutoutAsync(String from_broadcaster_id, String to_broadcaster_id)
            throws JSONException, IllegalArgumentException {
        if (from_broadcaster_id == null || from_broadcaster_id.isBlank()) {
            throw new IllegalArgumentException("from_broadcaster_id is required");
        }

        if (to_broadcaster_id == null || to_broadcaster_id.isBlank()) {
            throw new IllegalArgumentException("to_broadcaster_id is required");
        }

        String endpoint = "/chat/shoutouts?" + this.qspValid("from_broadcaster_id", from_broadcaster_id) + this.qspValid("&to_broadcaster_id", to_broadcaster_id) + this.qspValid("&moderator_id", TwitchValidate.instance().getAPIUserID());

        return this.handleMutatorAsync(endpoint, () -> {
            return this.handleRequest(HttpMethod.POST, endpoint);
        });
    }

    /**
     * Creates an EventSub subscription.
     *
     * @param jsonString A JSON string describing the parameters of the new subscription
     * @return
     * @throws JSONException
     * @throws IllegalArgumentException
     */
    public Mono<JSONObject> createEventSubSubscriptionAsync(String jsonString)
            throws JSONException, IllegalArgumentException {
        if (jsonString == null || jsonString.isBlank()) {
            throw new IllegalArgumentException("jsonString is required");
        }

        String endpoint = "/eventsub/subscriptions";

        return this.handleMutatorAsync(endpoint + jsonString, () -> {
            return this.handleRequest(HttpMethod.POST, endpoint, jsonString);
        });
    }

    /**
     * Deletes an EventSub subscription.
     *
     * @param id The ID of the subscription to delete.
     * @return
     * @throws JSONException
     * @throws IllegalArgumentException
     */
    public Mono<JSONObject> deleteEventSubSubscriptionAsync(String id)
            throws JSONException, IllegalArgumentException {
        if (id == null || id.isBlank()) {
            throw new IllegalArgumentException("id is required");
        }

        String endpoint = "/eventsub/subscriptions?" + this.qspValid("id", id);

        return this.handleMutatorAsync(endpoint, () -> {
            return this.handleRequest(HttpMethod.DELETE, endpoint);
        });
    }

    /**
     * Gets a list of Channel Points Predictions that the broadcaster created.
     *
     * @param id The ID of the prediction to get; {@code null} to get the most recent predictions. You may specify a maximum of 25 IDs.
     * @param first The maximum number of items to return per page in the response. Minimum: 1. Maximum: 25.
     * @param after The cursor used to get the next page of results.
     * @return
     * @throws JSONException
     * @throws IllegalArgumentException
     */
    public JSONObject getPredictions(List<String> id, int first, String after)
            throws JSONException, IllegalArgumentException {
        return this.getPredictionsAsync(id, first, after).block();
    }

    /**
     * Gets a list of Channel Points Predictions that the broadcaster created.
     *
     * @param id The ID of the prediction to get; {@code null} to get the most recent predictions. You may specify a maximum of 25 IDs.
     * @param first The maximum number of items to return per page in the response. Minimum: 1. Maximum: 25.
     * @param after The cursor used to get the next page of results.
     * @return
     * @throws JSONException
     * @throws IllegalArgumentException
     */
    public Mono<JSONObject> getPredictionsAsync(List<String> id, int first, String after)
            throws JSONException, IllegalArgumentException {
        if (id != null && !id.isEmpty() && id.size() > 25) {
            throw new IllegalArgumentException("Limit 25 ids");
        }

        first = Math.min(25, Math.max(1, first));

        String ids = "";

        if (id != null && !id.isEmpty()) {
            ids = id.stream().limit(25).collect(Collectors.joining("&id="));
        }

        String endpoint = "/predictions?" + this.qspValid("broadcaster_id", TwitchValidate.instance().getAPIUserID())
            + this.qspValid("&id", ids) + this.qspValid("&first", Integer.toString(first))
            + this.qspValid("&after", after);

        return this.handleQueryAsync(endpoint, () -> {
            return this.handleRequest(HttpMethod.GET, endpoint);
        });
    }

    /**
     * Creates a Channel Points Prediction.
     *
     * @param title The question that the broadcaster is asking. The title is limited to a maximum of 45 characters.
     * @param seconds The length of time (in seconds) that the prediction will run for. The minimum is 30 seconds and the maximum is 1800 seconds (30 minutes).
     * @param choices The list of possible outcomes that the viewers may choose from. The list must contain a minimum of 2 choices and up to a maximum of 10 choices. Echo choice is limited to a maximum of 25 characters.
     * @return
     * @throws JSONException
     * @throws IllegalArgumentException
     */
    public JSONObject createPrediction(String title, long seconds, List<String> choices)
            throws JSONException, IllegalArgumentException {
        return this.createPrediction(title, Duration.ofSeconds(seconds), choices);
    }

    /**
     * Creates a Channel Points Prediction.
     *
     * @param title The question that the broadcaster is asking. The title is limited to a maximum of 45 characters.
     * @param duration The length of time that the prediction will run for. The minimum is 30 seconds and the maximum is 30 minutes.
     * @param choices The list of possible outcomes that the viewers may choose from. The list must contain a minimum of 2 choices and up to a maximum of 10 choices. Echo choice is limited to a maximum of 25 characters.
     * @return
     * @throws JSONException
     * @throws IllegalArgumentException
     */
    public JSONObject createPrediction(String title, Duration duration, List<String> choices)
            throws JSONException, IllegalArgumentException {
        return this.createPredictionAsync(title, duration, choices).block();
    }

    /**
     * Creates a Channel Points Prediction.
     *
     * @param title The question that the broadcaster is asking. The title is limited to a maximum of 45 characters.
     * @param duration The length of time that the prediction will run for. The minimum is 30 seconds and the maximum is 30 minutes.
     * @param choices The list of possible outcomes that the viewers may choose from. The list must contain a minimum of 2 choices and up to a maximum of 10 choices. Each choice is limited to a maximum of 25 characters.
     * @return
     * @throws JSONException
     * @throws IllegalArgumentException
     */
    public Mono<JSONObject> createPredictionAsync(String title, Duration duration, List<String> choices)
            throws JSONException, IllegalArgumentException {
        if (title == null || title.isBlank()) {
            throw new IllegalArgumentException("title is required");
        }

        if (duration.toSeconds() < 30) {
            duration = Duration.ofSeconds(30);
        }

        if (duration.toSeconds() > 1800) {
            duration = Duration.ofMinutes(30);
        }

        if (choices == null) {
            throw new IllegalArgumentException("choices is required");
        }

        List<String> validChoices = new ArrayList<>();

        for (String choice: choices) {
            if (choice != null &&  !choice.isBlank()) {
                if (choice.length() > 25) {
                    choice = choice.substring(0, 25);
                }

                validChoices.add(choice);
            }
        }

        if (validChoices.size() < 2 || validChoices.size() > 10) {
            throw new IllegalArgumentException("choices.size() must be >= 2 && <= 10");
        }

        if (title.length() > 45) {
            title = title.substring(0, 45);
        }

        JSONStringer js = new JSONStringer();
        js.object();

        js.key("broadcaster_id").value(TwitchValidate.instance().getAPIUserID());
        js.key("title").value(title);
        js.key("outcomes").array();
        validChoices.forEach(choice -> js.object().key("title").value(choice).endObject());
        js.endArray();
        js.key("prediction_window").value(duration.toSeconds());
        js.endObject();

        String endpoint = "/predictions";

        return this.handleMutatorAsync(endpoint + js.toString(), () -> {
            return this.handleRequest(HttpMethod.POST, endpoint, js.toString());
        });
    }

    /**
     * The status to set the prediction to for {@link #endPredictionAsync(String, PredictionStatus, String)})
     */
    public enum PredictionStatus {
        /**
         * The broadcaster is locking the prediction, which means viewers may no longer make predictions.
         */
        LOCKED,
        /**
         * The broadcaster is canceling the prediction and sending refunds to the participants.
         */
        CANCELED,
        /**
         * The winning outcome is determined and the Channel Points are distributed to the viewers who predicted the correct outcome.
         */
        RESOLVED
    }

    /**
     * Locks, resolves, or cancels a Channel Points Prediction.
     *
     * The broadcaster can update an active prediction to {@link PredictionStatus.LOCKED}, {@link PredictionStatus.RESOLVED}, or {@link PredictionStatus.CANCELED};
     * and update a locked prediction to {@link PredictionStatus.RESOLVED} or {@link PredictionStatus.CANCELED}.
     *
     * The broadcaster has up to 24 hours after the prediction window closes to resolve the prediction.
     * If not, Twitch sets the status to {@link PredictionStatus.CANCELED} and returns the points.
     *
     * @param id The ID of the prediction to update.
     * @param status The status to set the prediction to.
     * @param winningOutcomeId The ID of the winning outcome. You must set this parameter if you set status to {@link PredictionStatus.RESOLVED}.
     * @return
     * @throws JSONException
     * @throws IllegalArgumentException
     */
    public JSONObject endPrediction(String id, PredictionStatus status, String winningOutcomeId)
            throws JSONException, IllegalArgumentException {
        return this.endPredictionAsync(id, status, winningOutcomeId).block();
    }

    /**
     * Locks, resolves, or cancels a Channel Points Prediction.
     *
     * The broadcaster can update an active prediction to {@link PredictionStatus.LOCKED}, {@link PredictionStatus.RESOLVED}, or {@link PredictionStatus.CANCELED};
     * and update a locked prediction to {@link PredictionStatus.RESOLVED} or {@link PredictionStatus.CANCELED}.
     *
     * The broadcaster has up to 24 hours after the prediction window closes to resolve the prediction.
     * If not, Twitch sets the status to {@link PredictionStatus.CANCELED} and returns the points.
     *
     * @param id The ID of the prediction to update.
     * @param status The status to set the prediction to.
     * @param winningOutcomeId The ID of the winning outcome. You must set this parameter if you set status to {@link PredictionStatus.RESOLVED}.
     * @return
     * @throws JSONException
     * @throws IllegalArgumentException
     */
    public Mono<JSONObject> endPredictionAsync(String id, PredictionStatus status, String winningOutcomeId)
            throws JSONException, IllegalArgumentException {
                if (id == null || id.isBlank()) {
                    throw new IllegalArgumentException("id is required");
                }

                if (status == PredictionStatus.RESOLVED && (winningOutcomeId == null || winningOutcomeId.isBlank())) {
                    throw new IllegalArgumentException("winningOutcomeId is required");
                }

                JSONStringer js = new JSONStringer();
                js.object();

                js.key("broadcaster_id").value(TwitchValidate.instance().getAPIUserID());
                js.key("id").value(id);
                js.key("status").value(status.name());

                if (status == PredictionStatus.RESOLVED) {
                    js.key("winning_outcome_id").value(winningOutcomeId);
                }

                js.endObject();

                String endpoint = "/predictions";

                return this.handleMutatorAsync(endpoint + js.toString(), () -> {
                    return this.handleRequest(HttpMethod.PATCH, endpoint, js.toString());
                });
    }

    private String chooseModeratorId(String scope) {
        /**
         * @botproperty usebroadcasterforchatcommands - If `true`, certain redirected chat commands are sent as the broadcaster. Default `false`
         * @botpropertycatsort usebroadcasterforchatcommands 800 20 Twitch
         */
        if (TwitchValidate.instance().hasChatScope(scope) && !CaselessProperties.instance().getPropertyAsBoolean("usebroadcasterforchatcommands", false)) {
            return TwitchValidate.instance().getChatUserID();
        }

        return TwitchValidate.instance().getAPIUserID();
    }

    private String chooseModeratorOAuth(String scope) {
        if (TwitchValidate.instance().hasChatScope(scope) && !CaselessProperties.instance().getPropertyAsBoolean("usebroadcasterforchatcommands", false)) {
            return CaselessProperties.instance().getProperty("oauth").replaceFirst("oauth:", "");
        }

        return null;
    }

    private class CallRequest {

        private final Instant expires;
        private final Mono<JSONObject> processor;

        private CallRequest(Instant expires, Mono<JSONObject> processor) {
            this.expires = expires;
            this.processor = processor;
        }
    }
}
