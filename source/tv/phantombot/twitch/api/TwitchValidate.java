/*
 * Copyright (C) 2016-2019 phantombot.tv
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
import java.net.MalformedURLException;
import java.net.SocketTimeoutException;
import java.net.URL;

import javax.net.ssl.HttpsURLConnection;

import org.json.JSONException;
import org.json.JSONObject;

/**
 * Handle Validate requests of the OAUTH2 token from Twitch.
 * 
 * @author ScaniaTV, IllusionaryOne
 */
public class TwitchValidate {
    // The current instance 
    private static final TwitchValidate instance = new TwitchValidate();
    // The base URL for Twitch API Helix.
    private static final String BASE_URL = "https://api.twitch.tv/oauth2/validate";
    // The user agent for our requests to Helix.
    private static final String USER_AGENT = "PhantomBot/2018";
    // Our content type, should always be JSON.
    private static final String CONTENT_TYPE = "application/json";
    // Timeout which to wait for a response before killing it (5 seconds).
    private static final int TIMEOUT_TIME = 5000;
    
    /**
     * This class constructor.
     */
    private TwitchValidate() {
        // Set the default exception handler thread.
        Thread.setDefaultUncaughtExceptionHandler(com.gmt2001.UncaughtExceptionHandler.instance());
    }

    /**
     * Method that returns the instance of TwitchValidate.
     * 
     * @return 
     */
    public static TwitchValidate instance() {
        return instance;
    }
    
    /**
     * The types of requests we can make.
     */
    private enum RequestType {
        GET,
    };
    
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
     * Method that handles data for Vaidation.
     * 
     * @param type
     * @param data
     * @return 
     */
    private JSONObject handleRequest(RequestType type, String oAuthToken) throws JSONException {
        JSONObject returnObject = new JSONObject();
        InputStream inStream = null;
        int responseCode = 0;
        
        try {
            // Generate a new URL.
            URL url = new URL(BASE_URL);
            // Open the connection over HTTPS.
            HttpsURLConnection connection = (HttpsURLConnection) url.openConnection();
            // Add our headers.
            connection.addRequestProperty("Content-Type", CONTENT_TYPE);
            connection.addRequestProperty("Authorization", "OAuth " + oAuthToken);
            connection.addRequestProperty("User-Agent", USER_AGENT);
            // Add our request method.
            connection.setRequestMethod(type.name());
            // Set out timeout.
            connection.setConnectTimeout(TIMEOUT_TIME);
            
            // Connect!
            connection.connect();
            
            // Get our response code.
            responseCode = connection.getResponseCode();
            
            // Get our response stream.
            if (responseCode == 200) {
                inStream = connection.getInputStream();
            } else {
                inStream = connection.getErrorStream();
            }

            // Parse the data.
            returnObject = new JSONObject(getStringFromInputStream(inStream));
            // Generate the return object,
            generateJSONObject(returnObject, true, type.name(), "", BASE_URL, responseCode, "", "");
        } catch (JSONException ex) {
            // Generate the return object.
            generateJSONObject(returnObject, false, type.name(), "", BASE_URL, responseCode, "JSONException", ex.getMessage());
        } catch (NullPointerException ex) {
            // Generate the return object.
            generateJSONObject(returnObject, false, type.name(), "", BASE_URL, responseCode, "NullPointerException", ex.getMessage());
        } catch (MalformedURLException ex) {
            // Generate the return object.
            generateJSONObject(returnObject, false, type.name(), "", BASE_URL, responseCode, "MalformedURLException", ex.getMessage());
        } catch (SocketTimeoutException ex) {
            // Generate the return object.
            generateJSONObject(returnObject, false, type.name(), "", BASE_URL, responseCode, "SocketTimeoutException", ex.getMessage());
        } catch (IOException ex) {
            // Generate the return object.
            generateJSONObject(returnObject, false, type.name(), "", BASE_URL, responseCode, "IOException", ex.getMessage());
        } catch (Exception ex) {
            // Generate the return object.
            generateJSONObject(returnObject, false, type.name(), "", BASE_URL, responseCode, "Exception", ex.getMessage());
        } finally {
            if (inStream != null) {
                try {
                    inStream.close();
                } catch (IOException ex) {
                    // Generate the return object.
                    generateJSONObject(returnObject, false, type.name(), "", BASE_URL, responseCode, "IOException", ex.getMessage());
                }
            }
        }
        
        return returnObject;
    }

    /**
     * Method that validates an oAuthToken.
     * 
     * @param type
     * @param BASE_URL
     * @return 
     */
    public void validate(String oAuthToken, String type) {
        try {
            ValidateRunnable validateRunnable = new ValidateRunnable(oAuthToken, type);
            new Thread(validateRunnable, "tv.phantombot.twitch.api.TwitchValidate::ValidateRunnable").start();
        } catch (Exception ex) {
            com.gmt2001.Console.out.println("Unable to validate Twitch " + type + " OAUTH Token.");
        }
    }

    /**
     * Runnable to push the validation checks to the background so as not to block the operation of the bot at start up.
     */
    private class ValidateRunnable implements Runnable {
        private String oAuthToken;
        private String type;

        public ValidateRunnable(String oAuthToken, String type) {
            this.oAuthToken = oAuthToken;
            this.type = type;
        }

        @Override
        public void run() {
            try {
                JSONObject requestObj = handleRequest(RequestType.GET, oAuthToken);
                if (requestObj.has("message")) {
                    if (requestObj.getString("message").equals("invalid access token")) {
                        com.gmt2001.Console.err.println("Twitch reports your " + type + " OAUTH token as invalid. It may have expired, " +
                                "been disabled, or the Twitch API is experiencing issues.");
                        return;
                    }
                }
                com.gmt2001.Console.out.println("Validated Twitch " + type + " OAUTH Token.");
            } catch (JSONException ex) {
                com.gmt2001.Console.err.logStackTrace(ex);
            }
        }
    }
}
