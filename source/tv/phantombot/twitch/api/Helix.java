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
import java.net.URL;
import java.net.URLEncoder;
import java.nio.charset.Charset;
import java.util.List;
import java.util.stream.Collectors;
import javax.net.ssl.HttpsURLConnection;
import org.json.JSONException;
import org.json.JSONObject;
import org.json.JSONStringer;
import reactor.util.annotation.Nullable;
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
    // The user agent for our requests to Helix.
    private static final String USER_AGENT = "PhantomBot/2018";
    // Our content type, should always be JSON.
    private static final String CONTENT_TYPE = "application/json";
    // Timeout which to wait for a response before killing it (5 seconds).
    private static final int TIMEOUT_TIME = 5000;

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

    private Helix() {
        Thread.setDefaultUncaughtExceptionHandler(com.gmt2001.UncaughtExceptionHandler.instance());
    }

    public void setOAuth(String oauth) {
        this.oAuthToken = oauth;
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

    /**
     * Method that handles our rate limits.
     *
     * @param limitReturned The limit returned from Helix.
     * @param limitResetTimeReturned The reset time for our limit returned from Helix.
     */
    private void handleUpdateRateLimits(String maxLimit, String limitReturned, String limitResetTimeReturned) {
        try {
            // Parse the rate limit returned.
            updateRateLimits(Integer.parseInt(maxLimit), Integer.parseInt(limitReturned),
                    Long.parseLong(limitResetTimeReturned));
        } catch (NumberFormatException ex) {
            com.gmt2001.Console.err.printStackTrace(ex);
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

            // Get the current rate limits.
            String maxlimit = connection.getHeaderField("Ratelimit-Limit");
            String limit = connection.getHeaderField("Ratelimit-Remaining");
            String reset = connection.getHeaderField("Ratelimit-Reset");
            // Handle the current limits.
            this.handleUpdateRateLimits(maxlimit, limit, reset);

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

    /**
     * Gets channel information for users.
     *
     * @param broadcaster_id ID of the channel to be retrieved.
     * @return
     * @throws JSONException
     * @throws IllegalArgumentException
     */
    public JSONObject getChannelInformation(String broadcaster_id) throws JSONException, IllegalArgumentException {
        if (broadcaster_id == null || broadcaster_id.isBlank()) {
            throw new IllegalArgumentException("channelId");
        }

        return this.handleRequest(RequestType.GET, "/channels?broadcaster_id=" + broadcaster_id);
    }

    /**
     * Modifies channel information for users. @paramref channelId is required. All others are optional, but at least one must be valid.
     *
     * @param broadcaster_id ID of the channel to be updated.
     * @param game_id The current game ID being played on the channel. Use “0” or “” (an empty string) to unset the game.
     * @param language The language of the channel. A language value must be either the ISO 639-1 two-letter code for a supported stream language or
     * “other”.
     * @param title The title of the stream. Value must not be an empty string.
     * @param delay Stream delay in seconds. Stream delay is a Twitch Partner feature; trying to set this value for other account types will return a
     * 400 error.
     * @return
     * @throws JSONException
     * @throws IllegalArgumentException
     */
    public JSONObject updateChannelInformation(String broadcaster_id, @Nullable String game_id, @Nullable String language, @Nullable String title, int delay) throws JSONException, IllegalArgumentException {
        if (broadcaster_id == null || broadcaster_id.isBlank()) {
            throw new IllegalArgumentException("channelId");
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

        return this.handleRequest(RequestType.PATCH, "/channels?broadcaster_id=" + broadcaster_id, js.toString());
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
        if (query == null || query.isBlank()) {
            throw new IllegalArgumentException("query");
        }

        if (first <= 0) {
            first = 20;
        }

        first = Math.max(1, Math.min(100, first));

        return this.handleRequest(RequestType.GET, "/search/categories?query=" + this.uriEncode(query) + "&first=" + first + this.qspValid("&after", after));
    }

    /**
     * Gets information on follow relationships between two Twitch users. This can return information like “who is qotrok following,” “who is
     * following qotrok,” or “is user X following user Y.” Information returned is sorted in order, most recent follow first. At minimum, from_id or
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
    public JSONObject getUsersFollows(@Nullable String from_id, @Nullable String to_id, int first, @Nullable String after) throws JSONException, IllegalArgumentException {
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

        return this.handleRequest(RequestType.GET, "/users/follows?" + this.qspValid("from_id", from_id) + (both ? "&" : "")
                + this.qspValid("to_id", to_id) + "&first=" + first + this.qspValid("&after", after));
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
    public JSONObject getBroadcasterSubscriptions(String broadcaster_id, @Nullable List<String> user_id, int first, @Nullable String after) throws JSONException, IllegalArgumentException {
        if (broadcaster_id == null || broadcaster_id.isBlank()) {
            throw new IllegalArgumentException("channelId");
        }

        if (first <= 0) {
            first = 20;
        }

        first = Math.max(1, Math.min(100, first));

        String userIds = null;

        if (user_id != null && user_id.size() > 0) {
            userIds = user_id.stream().limit(100).collect(Collectors.joining("&user_id="));
        }

        return this.handleRequest(RequestType.GET, "/subscriptions?broadcaster_id=" + broadcaster_id + "&first=" + first
                + this.qspValid("&user_id", userIds) + this.qspValid("&after", after));
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
     * supported stream language or “other”.
     * @return
     * @throws JSONException
     * @throws IllegalArgumentException
     */
    public JSONObject getStreams(int first, @Nullable String before, @Nullable String after, @Nullable List<String> user_id,
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

        return this.handleRequest(RequestType.GET, "/streams?first=" + first + this.qspValid("&after", after) + this.qspValid("&before", before)
                + this.qspValid("&user_id", userIds) + this.qspValid("&user_login", userLogins) + this.qspValid("&game_id", gameIds) + this.qspValid("&language", languages));
    }

    /**
     * The types of requests we can make to Helix.
     */
    private enum RequestType {
        GET,
        PATCH,
        PUT,
        POST,
        DELETE
    }
}
