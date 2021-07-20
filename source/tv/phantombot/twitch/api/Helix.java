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

package tv.phantombot.twitch.api;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.math.BigInteger;
import java.net.URL;
import java.net.URLEncoder;
import java.nio.charset.Charset;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Duration;
import java.time.Instant;
import java.util.Calendar;
import java.util.Date;
import java.util.List;
import java.util.Queue;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentLinkedQueue;
import java.util.concurrent.ConcurrentMap;
import java.util.concurrent.ScheduledThreadPoolExecutor;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.locks.ReentrantLock;
import java.util.function.Supplier;
import java.util.stream.Collectors;
import javax.net.ssl.HttpsURLConnection;
import org.json.JSONException;
import org.json.JSONObject;
import org.json.JSONStringer;
import reactor.core.publisher.Mono;
import reactor.util.annotation.Nullable;
import tv.phantombot.PhantomBot;

/**
 * Start of the Helix API. This class will handle the rate limits.
 * 
 * @author ScaniaTV
 */
public class Helix {
    // The current instance of Helix.
    private static final Helix INSTANCE = new Helix();
    // The base URL for Twitch API Helix.
    private static final String BASE_URL = "https://api.twitch.tv/helix";
    // The user agent for our requests to Helix.
    private static final String USER_AGENT = "PhantomBot/2021";
    // Our content type, should always be JSON.
    private static final String CONTENT_TYPE = "application/json";
    // Timeout which to wait for a response before killing it (5 seconds).
    private static final int TIMEOUT_TIME = 5000;
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
        tp.schedule(() -> {
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
        return URLEncoder.encode(input, Charset.forName("UTF-8"));
    }

    private String qspValid(String key, String value) {
        return value != null && !value.isBlank() ? key + "=" + value : "";
    }
    
    /**
     * Method that gets data from an InputStream.
     * 
     * @param stream
     * @return 
     */
    private String getStringFromInputStream(InputStream stream) throws IOException {
        BufferedReader reader = new BufferedReader(new InputStreamReader(stream));
        StringBuilder returnString = new StringBuilder();
        String line;
        
        while ((line = reader.readLine()) != null) {
            returnString.append(line);
        }
        
        return returnString.toString();
    }
    
    /**
     * Method that adds extra information to our returned object.
     * 
     * @param obj
     * @param isSuccess
     * @param requestType
     * @param data
     * @param url
     * @param responseCode
     * @param exception
     * @param exceptionMessage
     */
    private void generateJSONObject(JSONObject obj, boolean isSuccess, 
            String requestType, String data, String url, int responseCode, 
            String exception, String exceptionMessage) throws JSONException {
        
        obj.put("_success", isSuccess);
        obj.put("_type", requestType);
        obj.put("_post", data);
        obj.put("_url", url);
        obj.put("_http", responseCode);
        obj.put("_exception", exception);
        obj.put("_exceptionMessage", exceptionMessage);
    }
    
    /**
     * Method that handles data for Helix.
     * 
     * @param type
     * @param url
     * @param data
     * @return 
     */
    private JSONObject handleRequest(RequestType type, String endPoint, String data) throws JSONException {
        JSONObject returnObject = new JSONObject();
        InputStream inStream = null;
        int responseCode = 0;
        
        // Check our rate limit.
        this.checkRateLimit();

        // Update the end point URL, if it is an endpoint and not full URL.
        if (endPoint.startsWith("/")) {
            endPoint = BASE_URL + endPoint;
        }
        
        try {
            if (this.oAuthToken == null || this.oAuthToken.isBlank()) {
                throw new IllegalArgumentException("apioauth is required");
            }

            // Generate a new URL.
            URL url = new URL(endPoint);
            // Open the connection over HTTPS.
            HttpsURLConnection connection = (HttpsURLConnection) url.openConnection();
            // Add our headers.
            connection.addRequestProperty("Content-Type", CONTENT_TYPE);

            connection.addRequestProperty("Client-ID", PhantomBot.instance().getProperties().getProperty("clientid", (TwitchValidate.instance().getAPIClientID().isBlank() ? "7wpchwtqz7pvivc3qbdn1kajz42tdmb" : TwitchValidate.instance().getAPIClientID())));

            connection.addRequestProperty("Authorization", "Bearer " + this.oAuthToken);

            connection.addRequestProperty("User-Agent", USER_AGENT);
            // Add our request method.
            connection.setRequestMethod(type.name());
            // Set out timeout.
            connection.setConnectTimeout(TIMEOUT_TIME);
            // Set if we're doing output.
            connection.setDoOutput(!data.isEmpty());
            
            // Connect!
            connection.connect();
            
            // If we're outputting.
            if (connection.getDoOutput()) {
                // Get the output stream
                try (OutputStream outStream = connection.getOutputStream()) {
                    // Write to it and flush.
                    outStream.write(data.getBytes("UTF-8"));
                    outStream.flush();
                }
            }
            
            // Get our response code.
            responseCode = connection.getResponseCode();

            if (PhantomBot.instance().getProperties().getPropertyAsBoolean("helixdebug", false)) {
                com.gmt2001.Console.debug.println("Helix ratelimit response > Limit: " + connection.getHeaderField("Ratelimit-Limit") + " <> Remaining: "
                        + connection.getHeaderField("Ratelimit-Remaining") + " <> Reset: " + connection.getHeaderField("Ratelimit-Reset"));
            }
            // Handle the current limits.
            this.updateRateLimits(connection.getHeaderFieldInt("Ratelimit-Limit", RATELIMIT_DEFMAX),
                    connection.getHeaderFieldInt("Ratelimit-Remaining", 1),
                    connection.getHeaderFieldLong("Ratelimit-Reset", Date.from(Instant.now()).getTime()));

            // Get our response stream.
            if (responseCode == 200) {
                inStream = connection.getInputStream();
            } else {
                inStream = connection.getErrorStream();
            }

            // Parse the data.
            returnObject = new JSONObject(this.getStringFromInputStream(inStream));
            // Generate the return object,
            this.generateJSONObject(returnObject, true, type.name(), data, endPoint, responseCode, "", "");
        } catch (IOException | IllegalArgumentException | JSONException ex) {
            // Generate the return object.
            this.generateJSONObject(returnObject, false, type.name(), data, endPoint, responseCode, ex.getClass().getSimpleName(), ex.getMessage());
        } finally {
            if (inStream != null) {
                try {
                    inStream.close();
                } catch (IOException ex) {
                    // Generate the return object.
                    this.generateJSONObject(returnObject, false, type.name(), data, endPoint, responseCode, ex.getClass().getSimpleName(), ex.getMessage());
                }
            }
        }

        if (returnObject.has("error") && nextWarning.before(new Date())) {
            Calendar c = Calendar.getInstance();
            c.add(Calendar.MINUTE, WARNING_INTERVAL_MINS);
            nextWarning = c.getTime();

            com.gmt2001.Console.warn.println("Helix rejected a request [" + endPoint + "] " + returnObject.optInt("status", 0) + " "
                    + returnObject.optString("error", "Unknown") + ": " + returnObject.optString("message", "Unknown"));
        }

        if (PhantomBot.instance().getProperties().getPropertyAsBoolean("helixdebug", false)) {
            StackTraceElement st = com.gmt2001.Console.debug.findCaller("tv.phantombot.twitch.api.Helix");
            com.gmt2001.Console.debug.println("Caller: [" + st.getMethodName() + "()@" + st.getFileName() + ":" + st.getLineNumber() + "]");
            com.gmt2001.Console.debug.println(returnObject.toString(4));
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
    private JSONObject handleRequest(RequestType type, String endPoint) throws JSONException {
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
     * Method that get users by type.
     * 
     * @param type Either id or login
     * @param usernames A string array of Twitch usernames. Limit: 100
     * @return 
     */
    public JSONObject getChannelInformation(String broadcaster_id) throws JSONException, IllegalArgumentException {
        return this.getChannelInformationAsync(broadcaster_id).block();
    }
    
    /**
     * Method that get users by their names.
     * 
     * @param usernames A string array of Twitch usernames. Limit: 100
     * @return 
     */
    public Mono<JSONObject> getChannelInformationAsync(String broadcaster_id) throws JSONException, IllegalArgumentException {
        if (broadcaster_id == null || broadcaster_id.isBlank()) {
            throw new IllegalArgumentException("channelId");
        }

        String endpoint = "/channels?broadcaster_id=" + broadcaster_id;

        return this.handleQueryAsync(endpoint, () -> {
            return this.handleRequest(RequestType.GET, endpoint);
        });
    }
    
    /**
     * Method that gets a user by their name.
     * 
     * @param username The Twitch username.
     * @return 
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
            return this.handleRequest(RequestType.PATCH, endpoint, js.toString());
        });
    }
    
    /**
     * Method that get users by their ID.
     * 
     * @param ids A string array of user IDs. Limit: 100
     * @return 
     */
    public JSONObject searchCategories(String query, int first, @Nullable String after) throws JSONException, IllegalArgumentException {
        return this.searchCategoriesAsync(query, first, after).block();
    }
    
    /**
     * Method that gets a user by their ID.
     * 
     * @param id The ID of the user on Twitch.
     * @return 
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
            return this.handleRequest(RequestType.GET, endpoint);
        });
    }
    
    /**
     * Method that gets streams by type.
     * 
     * @param type Either user_login or user_id.
     * @param streams A string array of stream names. Limit: 100
     * @param parameters A string array of parameters allow by Twitch. You have to add the parameterName=value in the array.
     * @return 
     */
    public JSONObject getUsersFollows(@Nullable String from_id, @Nullable String to_id, int first, @Nullable String after)
            throws JSONException, IllegalArgumentException {
        return this.getUsersFollowsAsync(from_id, to_id, first, after).block();
    }
    
    /**
     * Method that gets streams by their names.
     * 
     * @param streams A string array of stream names. Limit: 100
     * @param parameters A string array of parameters allow by Twitch. You have to add the parameterName=value in the array.
     * @return 
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
            return this.handleRequest(RequestType.GET, endpoint);
        });
    }
    
    /**
     * Method that gets streams by their names.
     * 
     * @param stream The name of the stream to get.
     * @param parameters A string array of parameters allow by Twitch. You have to add the parameterName=value in the array.
     * @return 
     */
    public JSONObject getBroadcasterSubscriptions(String broadcaster_id, @Nullable List<String> user_id, int first, @Nullable String after)
            throws JSONException, IllegalArgumentException {
        return this.getBroadcasterSubscriptionsAsync(broadcaster_id, user_id, first, after).block();
    }
    
    /**
     * Method that gets streams by their names.
     * 
     * @param stream The name of the stream to get.
     * @return 
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

        if (user_id != null && user_id.size() > 0) {
            userIds = user_id.stream().limit(100).collect(Collectors.joining("&user_id="));
        }

        String endpoint = "/subscriptions?broadcaster_id=" + broadcaster_id + "&first=" + first
                + this.qspValid("&user_id", userIds) + this.qspValid("&after", after);

        return this.handleQueryAsync(endpoint, () -> {
            return this.handleRequest(RequestType.GET, endpoint);
        });
    }
    
    /**
     * Method that gets streams by their ID.
     * 
     * @param ids A string array of stream IDs. Limit: 100
     * @param parameters A string array of parameters allow by Twitch. You have to add the parameterName=value in the array.
     * @return 
     */
    public JSONObject getStreams(int first, @Nullable String before, @Nullable String after, @Nullable List<String> user_id,
            @Nullable List<String> user_login, @Nullable List<String> game_id, @Nullable List<String> language) throws JSONException, IllegalArgumentException {
        return this.getStreamsAsync(first, before, after, user_id, user_login, game_id, language).block();
    }
    
    /**
     * Method that gets streams by their id.
     * 
     * @param id The id of the stream to get.
     * @param parameters A string array of parameters allow by Twitch. You have to add the parameterName=value in the array.
     * @return 
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

        if (user_id != null && user_id.size() > 0) {
            userIds = user_id.stream().limit(100).collect(Collectors.joining("&user_id="));
        }

        String userLogins = null;

        if (user_login != null && user_login.size() > 0) {
            userLogins = user_login.stream().limit(100).collect(Collectors.joining("&user_login="));
        }

        String gameIds = null;

        if (game_id != null && game_id.size() > 0) {
            gameIds = game_id.stream().limit(100).collect(Collectors.joining("&game_id="));
        }

        String languages = null;

        if (language != null && language.size() > 0) {
            languages = language.stream().limit(100).collect(Collectors.joining("&language="));
        }

        String endpoint = "/streams?first=" + first + this.qspValid("&after", after) + this.qspValid("&before", before)
                + this.qspValid("&user_id", userIds) + this.qspValid("&user_login", userLogins) + this.qspValid("&game_id", gameIds) + this.qspValid("&language", languages);

        return this.handleQueryAsync(endpoint, () -> {
            return this.handleRequest(RequestType.GET, endpoint);
        });
    }
    
    /**
     * Method that gets streams by their IDs.
     * 
     * @param ids The IDs of the streams to get. Limit: 100
     * @return 
     */
    public JSONObject getUsers(@Nullable List<String> id, @Nullable List<String> login) throws JSONException {
        return this.getUsersAsync(id, login).block();
    }

    /**
     * Method that gets streams by their ID.
     * 
     * @param id The id of the stream to get.
     * @return 
     */
    public Mono<JSONObject> getUsersAsync(@Nullable List<String> id, @Nullable List<String> login) throws JSONException {
        String userIds = null;

        if (id != null && id.size() > 0) {
            userIds = id.stream().limit(100).collect(Collectors.joining("&id="));
        }

        String userLogins = null;

        if (login != null && login.size() > 0) {
            userLogins = login.stream().limit(100 - (id != null ? id.stream().count() : 0)).collect(Collectors.joining("&login="));
        }

        boolean both = false;

        if (id != null && id.size() > 0 && id.size() < 100 && login != null && login.size() > 0) {
            both = true;
        }

        String endpoint = "/users" + (userIds != null || userLogins != null ? "?" : "") + this.qspValid("id", userIds)
                + (both ? "&" : "") + this.qspValid("login", userLogins);

        return this.handleQueryAsync(endpoint, () -> {
            return this.handleRequest(RequestType.GET, endpoint);
        });
    }
    
    /**
     * Method that gets games by their type
     * 
     * @param type Either id or name
     * @param games The list of games. Limit: 100
     * @return 
     */
    public JSONObject startCommercial(String broadcaster_id, int length) throws JSONException, IllegalArgumentException {
        return this.startCommercialAsync(broadcaster_id, length).block();
    }
    
    /**
     * Method that gets games by their names.
     * 
     * @param gameNames A string array of game names. Limit: 100
     * @return 
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
            return this.handleRequest(RequestType.POST, endpoint, js.toString());
        });
    }
    
    /**
     * Method that gets a game by its name.
     * 
     * @param gameName The name of the game.
     * @return 
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
            return this.handleRequest(RequestType.GET, endpoint);
        });
    }
    
    /**
     * Method that gets games by their IDs.
     * 
     * @param gameIDs A string array of game IDs. Limit: 100
     * @return 
     */
    public JSONObject getGlobalEmotes() throws JSONException {
        return this.getGlobalEmotesAsync().block();
    }
    
    /**
     * Method that gets a game by its ID.
     * 
     * @param gameID The Id of the game.
     * @return 
     */
    public Mono<JSONObject> getGlobalEmotesAsync() throws JSONException {
        String endpoint = "/chat/emotes/global";

        return this.handleQueryAsync(endpoint, () -> {
            return this.handleRequest(RequestType.GET, endpoint);
        });
    }
    
    /**
     * Method that gets clips by type.
     * 
     * @param type Either broadcaster_id, game_id or id.
     * @param clipIds A string array of clips, games, or channel IDs. Limit: 100
     * @param parameters A string array of parameters allow by Twitch. You have to add the parameterName=value in the array.
     * @return 
     */
    public JSONObject getCheermotes(@Nullable String broadcaster_id) throws JSONException {
        return this.getCheermotesAsync(broadcaster_id).block();
    }
    
    /**
     * Method that gets clips from a broadcaster (channel).
     * 
     * @param channelId the ID of the broadcaster (channel).
     * @param parameters A string array of parameters allow by Twitch. You have to add the parameterName=value in the array.
     * @return 
     */
    public Mono<JSONObject> getCheermotesAsync(@Nullable String broadcaster_id) throws JSONException {
        String endpoint = "/bits/cheermotes" + this.qspValid("?broadcaster_id", broadcaster_id);

        return this.handleQueryAsync(endpoint, () -> {
            return this.handleRequest(RequestType.GET, endpoint);
        });
    }
    
    /**
     * Method that gets clips from a broadcaster (channel).
     * 
     * @param channelId the ID of the broadcaster (channel).
     * @return 
     */
    public JSONObject getVideos(@Nullable List<String> id, @Nullable String user_id, @Nullable String game_id, int first, @Nullable String before,
            @Nullable String after, @Nullable String language, @Nullable String period, @Nullable String sort, @Nullable String type)
            throws JSONException, IllegalArgumentException {
        return this.getVideosAsync(id, user_id, game_id, first, before, after, language, period, sort, type).block();
    }
    
    /**
     * Method that gets clips from a certain game.
     * 
     * @param gameId The ID of the game.
     * @param parameters A string array of parameters allow by Twitch. You have to add the parameterName=value in the array.
     * @return 
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

        if (id != null && id.size() > 0) {
            ids = id.stream().limit(100).collect(Collectors.joining("&id="));
        }

        String endpoint = "/videos?" + this.qspValid("id", ids) + (ids == null ? "first=" + first : "")
                + this.qspValid("&user_id", user_id) + this.qspValid("&game_id", game_id) + this.qspValid("&after", after)
                + this.qspValid("&before", before) + this.qspValid("&language", language) + this.qspValid("&period", period)
                + this.qspValid("&sort", sort) + this.qspValid("&type", type);

        return this.handleQueryAsync(endpoint, () -> {
            return this.handleRequest(RequestType.GET, endpoint);
        });
    }
    
    /**
     * Method that gets clips from a certain game.
     * 
     * @param gameId The ID of the game.
     * @return 
     */
    public JSONObject getChannelTeams(String broadcaster_id) throws JSONException, IllegalArgumentException {
        return this.getChannelTeamsAsync(broadcaster_id).block();
    }
    
    /**
     * Method that gets a bunch of clips by their IDs.
     * 
     * @param clipIds A string array of clip IDs. Limit: 100
     * @param parameters A string array of parameters allow by Twitch. You have to add the parameterName=value in the array.
     * @return 
     */
    public Mono<JSONObject> getChannelTeamsAsync(String broadcaster_id) throws JSONException, IllegalArgumentException {
        if (broadcaster_id == null || broadcaster_id.isBlank()) {
            throw new IllegalArgumentException("broadcaster_id");
        }

        String endpoint = "/teams/channel?broadcaster_id=" + broadcaster_id;

        return this.handleQueryAsync(endpoint, () -> {
            return this.handleRequest(RequestType.GET, endpoint);
        });
    }
    
    /**
     * Method that gets a bunch of clips by their IDs.
     * 
     * @param clipIds A string array of clip IDs.
     * @return 
     */
    public JSONObject getTeams(@Nullable String name, @Nullable String id) throws JSONException, IllegalArgumentException {
        return this.getTeamsAsync(name, id).block();
    }
    
    /**
     * Method that gets a clip by its ID.
     * 
     * @param clipId The ID of the clip
     * @return 
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
            return this.handleRequest(RequestType.GET, endpoint);
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

        if (id != null && id.size() > 0) {
            ids = id.stream().limit(100).collect(Collectors.joining("&id="));
        }

        String endpoint = "/clips?" + this.qspValid("id", ids) + (ids == null ? "first=" + first : "")
                + this.qspValid("&broadcaster_id", broadcaster_id) + this.qspValid("&game_id", game_id) + this.qspValid("&after", after)
                + this.qspValid("&before", before) + this.qspValid("&started_at", started_at) + this.qspValid("&ended_at", ended_at);

        return this.handleQueryAsync(endpoint, () -> {
            return this.handleRequest(RequestType.GET, endpoint);
        });
    }

    /**
     * The types of requests we can make to Helix.
     */
    private enum RequestType {
        GET,
        PATCH,
        POST
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
