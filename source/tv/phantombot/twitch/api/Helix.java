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
import java.net.MalformedURLException;
import java.net.SocketTimeoutException;
import java.net.URL;
import javax.net.ssl.HttpsURLConnection;
import org.json.JSONException;
import org.json.JSONObject;

/**
 * Start of the Helix API. This class will handle the rate limits.
 * 
 * @author ScaniaTV
 */
public class Helix {
    // The current instance of Helix.
    private static Helix INSTANCE;
    // The base URL for Twitch API Helix.
    private static final String BASE_URL = "https://api.twitch.tv/helix";
    // The user agent for our requests to Helix.
    private static final String USER_AGENT = "PhantomBot/2018";
    // Our content type, should always be JSON.
    private static final String CONTENT_TYPE = "application/json";
    // Timeout which to wait for a response before killing it (5 seconds).
    private static final int TIMEOUT_TIME = 5000;
    // Time when our limit will reset.
    private long rateLimitResetEpoch = System.currentTimeMillis();
    // Our current rate limit before making any requests.
    private int currentRateLimit = 120;
    // The user's oauth token -- this is required.
    private final String oAuthToken;
    private final String clientid;
    
    /**
     * This class constructor.
     * 
     * @param oAuthToken The token used for all requests.
     */
    public Helix(String oAuthToken) {
        this.oAuthToken = oAuthToken.replace("oauth:", "");
        this.clientid = TwitchValidate.instance().getAPIClientID();
        
        // Set the default exception handler thread.
        Thread.setDefaultUncaughtExceptionHandler(com.gmt2001.UncaughtExceptionHandler.instance());
    }
    
    /**
     * Method that sets the default instance.
     * 
     * @param instance The instance to be set by default.
     */
    public static void setInstance(Helix instance) {
        INSTANCE = instance;
    }
    
    /**
     * Method that returns the instance of Helix.
     * 
     * @return 
     */
    public static Helix getInstance() {
        return INSTANCE;
    }
    
    /**
     * The types of requests we can make to Helix.
     */
    private enum RequestType {
        GET,
        PUT,
        POST,
        DELETE
    };
    
    /**
     * Method that update the rate limits in sync.
     * 
     * @param limit The number of requests left.
     * @param reset The time when our limits will reset.
     */
    private synchronized void updateRateLimits(int limit, long reset) {
        currentRateLimit = limit;
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
    private synchronized int getCurrentRateLimit() {
        return currentRateLimit;
    }
    
    /**
     * Method that checks if we hit the limit.
     */
    private void checkRateLimit() {
        if (getCurrentRateLimit() <= 0) {
            try {
                // Sleep for the time remaining for the limit to reset.
                Thread.sleep(System.currentTimeMillis() - getLimitResetTime());
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
    private void handleUpdateRateLimits(String limitReturned, String limitResetTimeReturned) {
        try {
            // Parse the rate limit returned.
            updateRateLimits(Integer.parseInt(limitReturned), 
                    Long.parseLong(limitResetTimeReturned));
        } catch (NumberFormatException ex) {
            com.gmt2001.Console.err.printStackTrace(ex);
        }
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
        checkRateLimit();
        
        // Update the end point URL, if it is an endpoint and not full URL.
        if (endPoint.startsWith("/")) {
            endPoint = BASE_URL + endPoint;
        }
        
        try {
            // Generate a new URL.
            URL url = new URL(endPoint);
            // Open the connection over HTTPS.
            HttpsURLConnection connection = (HttpsURLConnection) url.openConnection();
            // Add our headers.
            connection.addRequestProperty("Content-Type", CONTENT_TYPE);

            if (!clientid.isEmpty()) {
                connection.addRequestProperty("Client-ID", clientid);
            }

            if (!oAuthToken.isEmpty()) {
                connection.addRequestProperty("Authorization", "Bearer " + oAuthToken);
            }

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
            String limit = connection.getHeaderField("Ratelimit-Remaining");
            String reset = connection.getHeaderField("Ratelimit-Reset");
            // Handle the current limits.
            handleUpdateRateLimits(limit, reset);
                
            // Get our response stream.
            if (responseCode == 200) {
                inStream = connection.getInputStream();
            } else {
                inStream = connection.getErrorStream();
            }

            // Parse the data.
            returnObject = new JSONObject(getStringFromInputStream(inStream));
            // Generate the return object,
            generateJSONObject(returnObject, true, type.name(), data, endPoint, responseCode, "", "");
        } catch (JSONException ex) {
            // Generate the return object.
            generateJSONObject(returnObject, false, type.name(), data, endPoint, responseCode, "JSONException", ex.getMessage());
        } catch (NullPointerException ex) {
            // Generate the return object.
            generateJSONObject(returnObject, false, type.name(), data, endPoint, responseCode, "NullPointerException", ex.getMessage());
        } catch (MalformedURLException ex) {
            // Generate the return object.
            generateJSONObject(returnObject, false, type.name(), data, endPoint, responseCode, "MalformedURLException", ex.getMessage());
        } catch (SocketTimeoutException ex) {
            // Generate the return object.
            generateJSONObject(returnObject, false, type.name(), data, endPoint, responseCode, "SocketTimeoutException", ex.getMessage());
        } catch (IOException ex) {
            // Generate the return object.
            generateJSONObject(returnObject, false, type.name(), data, endPoint, responseCode, "IOException", ex.getMessage());
        } catch (Exception ex) {
            // Generate the return object.
            generateJSONObject(returnObject, false, type.name(), data, endPoint, responseCode, "Exception", ex.getMessage());
        } finally {
            if (inStream != null) {
                try {
                    inStream.close();
                } catch (IOException ex) {
                    // Generate the return object.
                    generateJSONObject(returnObject, false, type.name(), data, endPoint, responseCode, "IOException", ex.getMessage());
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
        return handleRequest(type, endPoint, "");
    }
    
    /**
     * Method that get users by type.
     * 
     * @param type Either id or login
     * @param usernames A string array of Twitch usernames. Limit: 100
     * @return 
     */
    public JSONObject getUsersByType(String type, String[] usernames) throws JSONException {
        return handleRequest(RequestType.GET, "/users?" + type + "=" + String.join("&" + type + "=", usernames));
    }
    
    /**
     * Method that get users by their names.
     * 
     * @param usernames A string array of Twitch usernames. Limit: 100
     * @return 
     */
    public JSONObject getUsersByNames(String[] usernames) throws JSONException {
        return getUsersByType("login", usernames);
    }
    
    /**
     * Method that gets a user by their name.
     * 
     * @param username The Twitch username.
     * @return 
     */
    public JSONObject getUserByName(String username) throws JSONException {
        return getUsersByNames(new String[] { 
            username 
        });
    }
    
    /**
     * Method that get users by their ID.
     * 
     * @param ids A string array of user IDs. Limit: 100
     * @return 
     */
    public JSONObject getUsersByIds(String[] ids) throws JSONException {
        return getUsersByType("id", ids);
    }
    
    /**
     * Method that gets a user by their ID.
     * 
     * @param id The ID of the user on Twitch.
     * @return 
     */
    public JSONObject getUserById(String id) throws JSONException {
        return getUsersByIds(new String[] { 
            id 
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
    private JSONObject getStreamsByType(String type, String[] streams, String[] parameters) throws JSONException {
        return handleRequest(RequestType.GET, "/streams?" + type + "=" + String.join("&" + type + "=", streams) + (parameters.length > 0 ? "&" + String.join("&", parameters) : "")); 
    }
    
    /**
     * Method that gets streams by their names.
     * 
     * @param streams A string array of stream names. Limit: 100
     * @param parameters A string array of parameters allow by Twitch. You have to add the parameterName=value in the array.
     * @return 
     */
    public JSONObject getStreamsByNames(String[] streams, String[] parameters) throws JSONException {
        return getStreamsByType("user_login", streams, parameters);
    }
    
    /**
     * Method that gets streams by their names.
     * 
     * @param stream The name of the stream to get.
     * @param parameters A string array of parameters allow by Twitch. You have to add the parameterName=value in the array.
     * @return 
     */
    public JSONObject getStreamByName(String stream, String[] parameters) throws JSONException {
        return getStreamsByNames(new String[] { 
            stream 
        }, parameters);
    }
    
    /**
     * Method that gets streams by their names.
     * 
     * @param stream The name of the stream to get.
     * @return 
     */
    public JSONObject getStreamByName(String stream) throws JSONException {
        return getStreamsByNames(new String[] { 
            stream 
        }, new String[0]);
    }
    
    /**
     * Method that gets streams by their ID.
     * 
     * @param ids A string array of stream IDs. Limit: 100
     * @param parameters A string array of parameters allow by Twitch. You have to add the parameterName=value in the array.
     * @return 
     */
    public JSONObject getStreamsByIds(String[] ids, String[] parameters) throws JSONException {
        return getStreamsByType("user_id", ids, parameters);
    }
    
    /**
     * Method that gets streams by their id.
     * 
     * @param id The id of the stream to get.
     * @param parameters A string array of parameters allow by Twitch. You have to add the parameterName=value in the array.
     * @return 
     */
    public JSONObject getStreamById(String id, String[] parameters) throws JSONException {
        return getStreamsByIds(new String[] {
            id
        }, parameters);
    }
    
    /**
     * Method that gets streams by their IDs.
     * 
     * @param ids The IDs of the streams to get. Limit: 100
     * @return 
     */
    public JSONObject getStreamsByIds(String[] ids) throws JSONException {
        return getStreamsByIds(ids, new String[0]);
    }

    /**
     * Method that gets streams by their ID.
     * 
     * @param id The id of the stream to get.
     * @return 
     */
    public JSONObject getStreamById(String id) throws JSONException {
        return getStreamsByIds(new String[] { 
            id 
        }, new String[0]);
    }
    
    /**
     * Method that gets games by their type
     * 
     * @param type Either id or name
     * @param games The list of games. Limit: 100
     * @return 
     */
    private JSONObject getGamesByType(String type, String games[]) throws JSONException {
        return handleRequest(RequestType.GET, "/games?" + type + "=" + String.join("&" + type + "=", games));
    }
    
    /**
     * Method that gets games by their names.
     * 
     * @param gameNames A string array of game names. Limit: 100
     * @return 
     */
    public JSONObject getGamesByNames(String gameNames[]) throws JSONException {
        return getGamesByType("name", gameNames);
    }
    
    /**
     * Method that gets a game by its name.
     * 
     * @param gameName The name of the game.
     * @return 
     */
    public JSONObject getGameByName(String gameName) throws JSONException {
        return getGamesByNames(new String[] {
            gameName
        });
    }
    
    /**
     * Method that gets games by their IDs.
     * 
     * @param gameIDs A string array of game IDs. Limit: 100
     * @return 
     */
    public JSONObject getGamesByIds(String gameIDs[]) throws JSONException {
        return getGamesByType("id", gameIDs);
    }
    
    /**
     * Method that gets a game by its ID.
     * 
     * @param gameID The Id of the game.
     * @return 
     */
    public JSONObject getGameById(String gameID) throws JSONException {
        return getGamesByNames(new String[] {
            gameID
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
    private JSONObject getClipsByType(String type, String clipIds[], String[] parameters) throws JSONException {
        return handleRequest(RequestType.GET, "/clips?" + type + "=" + String.join("&" + type + "=", clipIds) + (parameters.length > 0 ? "&" + String.join("&", parameters) : ""));
    }
    
    /**
     * Method that gets clips from a broadcaster (channel).
     * 
     * @param channelId the ID of the broadcaster (channel).
     * @param parameters A string array of parameters allow by Twitch. You have to add the parameterName=value in the array.
     * @return 
     */
    public JSONObject getBroadcasterClipsById(String channelId, String[] parameters) throws JSONException {
        return getClipsByType("broadcaster_id", new String[] {
            channelId
        }, parameters);
    }
    
    /**
     * Method that gets clips from a broadcaster (channel).
     * 
     * @param channelId the ID of the broadcaster (channel).
     * @return 
     */
    public JSONObject getBroadcasterClipsById(String channelId) throws JSONException {
        return getClipsByType("broadcaster_id", new String[] {
            channelId
        }, new String[0]);
    }
    
    /**
     * Method that gets clips from a certain game.
     * 
     * @param gameId The ID of the game.
     * @param parameters A string array of parameters allow by Twitch. You have to add the parameterName=value in the array.
     * @return 
     */
    public JSONObject getGameClipsById(String gameId, String[] parameters) throws JSONException {
        return getClipsByType("game_id", new String[] { 
            gameId
        }, parameters);
    }
    
    /**
     * Method that gets clips from a certain game.
     * 
     * @param gameId The ID of the game.
     * @return 
     */
    public JSONObject getGameClipsById(String gameId) throws JSONException {
        return getClipsByType("game_id", new String[] { 
            gameId
        }, new String[0]);
    }
    
    /**
     * Method that gets a bunch of clips by their IDs.
     * 
     * @param clipIds A string array of clip IDs. Limit: 100
     * @param parameters A string array of parameters allow by Twitch. You have to add the parameterName=value in the array.
     * @return 
     */
    public JSONObject getClipsById(String[] clipIds, String[] parameters) throws JSONException {
        return getClipsByType("id", clipIds, parameters);
    }
    
    /**
     * Method that gets a bunch of clips by their IDs.
     * 
     * @param clipIds A string array of clip IDs.
     * @return 
     */
    public JSONObject getClipsById(String[] clipIds) throws JSONException {
        return getClipsByType("id", clipIds, new String[0]);
    }
    
    /**
     * Method that gets a clip by its ID.
     * 
     * @param clipId The ID of the clip
     * @return 
     */
    public JSONObject getClipById(String clipId) throws JSONException {
        return getClipsByType("id", new String[] { 
            clipId 
        }, new String[0]);
    }
}
