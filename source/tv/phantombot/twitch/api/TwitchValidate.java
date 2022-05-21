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
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import org.json.JSONArray;
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
    private static final String BASE_URL = "https://id.twitch.tv/oauth2/validate";
    private static final long REFRESH_INTERVAL = 3600000L;
    private static final long TIMEOUT_TIME = 5000L;
    private final List<String> scopesC = new ArrayList<>();
    private String clientidC = "";
    private String loginC = "";
    private String useridC = "";
    public boolean validC = false;
    private Thread validateC = null;
    private ValidateRunnable validaterC = null;
    private final List<String> scopesA = new ArrayList<>();
    private String clientidA = "";
    private String loginA = "";
    private String useridA = "";
    public boolean validA = false;
    private Thread validateA = null;
    private ValidateRunnable validaterA = null;
    private final List<String> scopesT = new ArrayList<>();
    private String clientidT = "";
    private String loginT = "";
    private String useridT = "";
    public boolean validT = false;
    private Thread validateT = null;
    private ValidateRunnable validaterT = null;

    /**
     * This class constructor.
     */
    private TwitchValidate() {
        // Set the default exception handler thread.
        Thread.setDefaultUncaughtExceptionHandler(com.gmt2001.UncaughtExceptionHandler.instance());
        Executors.newSingleThreadScheduledExecutor().scheduleAtFixedRate(() -> this.doValidations(), REFRESH_INTERVAL, REFRESH_INTERVAL, TimeUnit.MILLISECONDS);
    }

    private void doValidationA() {
        if (validaterA != null) {
            if (validateA != null && validateA.isAlive()) {
                validateA.interrupt();
                validateA = null;
            }

            validaterA.run();
        }
    }

    private void doValidationC() {
        if (validaterC != null) {
            if (validateC != null && validateC.isAlive()) {
                validateC.interrupt();
                validateC = null;
            }

            validaterC.run();
        }
    }

    private void doValidationT() {
        if (validaterT != null) {
            if (validateT != null && validateT.isAlive()) {
                validateT.interrupt();
                validateT = null;
            }

            validaterT.run();
        }
    }

    private void doValidations() {
        this.doValidationA();
        this.doValidationC();
        this.doValidationT();
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
     * Method that handles data for Validation.
     *
     * @param type
     * @param data
     * @return
     */
    private JSONObject handleRequest(String oAuthToken) throws JSONException {
        JSONObject returnObject = new JSONObject();
        int responseCode = 0;

        try {
            HttpHeaders headers = HttpClient.createHeaders(HttpMethod.GET, true);
            headers.add("Authorization", "OAuth " + oAuthToken);
            HttpClientResponse response = HttpClient.request(HttpMethod.GET, HttpUrl.fromUri(BASE_URL), headers, null);

            responseCode = response.responseCode().code();

            // Parse the data.
            returnObject = response.jsonOrThrow();
            // Generate the return object,
            HttpRequest.generateJSONObject(returnObject, true, "GET", "", BASE_URL, responseCode, "", "");
        } catch (Exception ex) {
            // Generate the return object.
            HttpRequest.generateJSONObject(returnObject, false, "GET", "", BASE_URL, responseCode, ex.getClass().getSimpleName(), ex.getMessage());
            com.gmt2001.Console.debug.printStackTrace(ex);
        }

        return returnObject;
    }

    /**
     * Method that validates an oAuthToken.
     *
     * @param oAuthToken
     * @param type
     */
    public void validateAPI(String oAuthToken, String type) {
        try {
            scopesA.clear();
            validaterA = new ValidateRunnable(oAuthToken, type, 0);
            validateA = new Thread(validaterA, "tv.phantombot.twitch.api.TwitchValidate::ValidateRunnable");
            validateA.start();
        } catch (Exception ex) {
            com.gmt2001.Console.out.println("Unable to validate Twitch " + type + " OAUTH Token.");
        }
    }

    public void validateChat(String oAuthToken, String type) {
        try {
            scopesC.clear();
            validaterC = new ValidateRunnable(oAuthToken, type, 1);
            validateC = new Thread(validaterC, "tv.phantombot.twitch.api.TwitchValidate::ValidateRunnable");
            validateC.start();
        } catch (Exception ex) {
            com.gmt2001.Console.out.println("Unable to validate Twitch " + type + " OAUTH Token.");
        }
    }

    public void validateApp(String oAuthToken, String type) {
        try {
            scopesT.clear();
            validaterT = new ValidateRunnable(oAuthToken, type, 2);
            validateT = new Thread(validaterT, "tv.phantombot.twitch.api.TwitchValidate::ValidateRunnable");
            validateT.start();
        } catch (Exception ex) {
            com.gmt2001.Console.out.println("Unable to validate Twitch " + type + " OAUTH Token.");
        }
    }

    public boolean hasChatScope(String scope) {
        return scopesC.contains(scope);
    }

    public List<String> getChatScopes() {
        return new ArrayList<>(scopesC);
    }

    public String getChatClientID() {
        return this.clientidC;
    }

    public String getChatLogin() {
        return this.loginC;
    }

    public String getChatUserID() {
        return this.useridC;
    }

    public boolean isChatValid() {
        return this.validC;
    }

    public void updateChatToken(String token) {
        if (this.validaterC == null) {
            this.validateChat(token, "CHAT (oauth)");
        } else {
            this.validaterC.updateToken(token);
            Executors.newSingleThreadExecutor().execute(() -> this.doValidationC());
        }
    }

    public boolean hasAPIScope(String scope) {
        return scopesA.contains(scope);
    }

    public List<String> getAPIScopes() {
        return new ArrayList<>(scopesA);
    }

    public String getAPIClientID() {
        return this.clientidA;
    }

    public String getAPILogin() {
        return this.loginA;
    }

    public String getAPIUserID() {
        return this.useridA;
    }

    public boolean isAPIValid() {
        return this.validA;
    }

    public void updateAPIToken(String token) {
        if (this.validaterA == null) {
            this.validateAPI(token, "API (apioauth)");
        } else {
            this.validaterA.updateToken(token);
            Executors.newSingleThreadExecutor().execute(() -> this.doValidationA());
        }
    }

    public boolean hasAppScope(String scope) {
        return scopesT.contains(scope);
    }

    public List<String> getAppScopes() {
        return new ArrayList<>(scopesT);
    }

    public String getAppClientID() {
        return this.clientidT;
    }

    public String getAppLogin() {
        return this.loginT;
    }

    public String getAppUserID() {
        return this.useridT;
    }

    public boolean isAppValid() {
        return this.validT;
    }

    public void updateAppToken(String token) {
        if (this.validaterT == null) {
            this.validateApp(token, "APP (EventSub)");
        } else {
            this.validaterT.updateToken(token);
            Executors.newSingleThreadExecutor().execute(() -> this.doValidationT());
        }
    }

    public void checkOAuthInconsistencies(String botName) {
        if (validateA != null && validateA.isAlive()) {
            try {
                validateA.join(TIMEOUT_TIME);
            } catch (InterruptedException ex) {
                com.gmt2001.Console.err.logStackTrace(ex);
            }
        }

        if (validateC != null && validateC.isAlive()) {
            try {
                validateC.join(TIMEOUT_TIME);
            } catch (InterruptedException ex) {
                com.gmt2001.Console.err.logStackTrace(ex);
            }
        }

        if (this.hasAPIScope("chat:edit") && !this.hasChatScope("chat:edit")) {
            com.gmt2001.Console.warn.println("CHAT (oauth) does not have chat:edit but API (apioauth) does. OAuth tokens may be reversed");
        } else if (!this.hasChatScope("chat:edit")) {
            com.gmt2001.Console.warn.println("CHAT (oauth) does not have chat:edit. Bot may be unable to respond");
        } else if (!this.hasChatScope("channel:moderate")) {
            com.gmt2001.Console.warn.println("CHAT (oauth) does not have channel:moderate. Bot may be unable to purge/timeout/ban");
        }

        if (this.getAPILogin().equalsIgnoreCase(botName) && !this.getChatLogin().equalsIgnoreCase(botName)) {
            com.gmt2001.Console.warn.println("CHAT (oauth) is not logged in as " + botName + " but API (apioauth) is. OAuth tokens may be reversed");
        } else if (!this.getChatLogin().equalsIgnoreCase(botName)) {
            com.gmt2001.Console.warn.println("CHAT (oauth) is not logged in as " + botName + ". OAuth token may be under the wrong login");
        }
    }

    public boolean hasOAuthInconsistencies(String botName) {
        if (validateA != null && validateA.isAlive()) {
            try {
                validateA.join(TIMEOUT_TIME);
            } catch (InterruptedException ex) {
                com.gmt2001.Console.err.logStackTrace(ex);
            }
        }

        if (validateC != null && validateC.isAlive()) {
            try {
                validateC.join(TIMEOUT_TIME);
            } catch (InterruptedException ex) {
                com.gmt2001.Console.err.logStackTrace(ex);
            }
        }

        return this.hasAPIScope("chat:edit") && !this.hasChatScope("chat:edit") || !this.hasChatScope("chat:edit") || !this.hasChatScope("channel:moderate")
                || this.getAPILogin().equalsIgnoreCase(botName) && !this.getChatLogin().equalsIgnoreCase(botName) || !this.getChatLogin().equalsIgnoreCase(botName);
    }

    /**
     * Runnable to push the validation checks to the background so as not to block the operation of the bot at start up.
     */
    private class ValidateRunnable implements Runnable {

        private String oAuthToken;
        private final String type;
        private final int tokenType;
        private boolean firstRun = true;

        public ValidateRunnable(String oAuthToken, String type, int tokenType) {
            this.oAuthToken = oAuthToken.replace("oauth:", "");
            this.type = type;
            this.tokenType = tokenType;
        }

        public void updateToken(String token) {
            this.oAuthToken = token.replace("oauth:", "");
        }

        @Override
        public void run() {
            try {
                if (this.oAuthToken == null || this.oAuthToken.isBlank()) {
                    return;
                }

                JSONObject requestObj = handleRequest(oAuthToken);
                com.gmt2001.Console.debug.println(type + requestObj.toString(4));

                if (requestObj.has("message") && requestObj.getString("message").equals("invalid access token")) {
                    com.gmt2001.Console.err.println("Twitch reports your " + type + " OAUTH token as invalid. It may have expired, "
                            + "been disabled, or the Twitch API is experiencing issues.");
                    com.gmt2001.Console.debug.println(requestObj.toString(4));
                    return;
                }

                if (!requestObj.getBoolean("_success")) {
                    com.gmt2001.Console.err.println("Attempt to validate " + type + " OAUTH token failed.");
                    com.gmt2001.Console.debug.println(requestObj.toString(4));
                    return;
                }

                if (requestObj.has("scopes")) {
                    JSONArray scopesa = requestObj.getJSONArray("scopes");
                    (tokenType == 1 ? scopesC : (tokenType == 2 ? scopesT : scopesA)).clear();
                    scopesa.iterator().forEachRemaining(obj -> {
                        (tokenType == 1 ? scopesC : (tokenType == 2 ? scopesT : scopesA)).add((String) obj);
                    });
                }

                if (requestObj.has("client_id")) {
                    switch (tokenType) {
                        case 1:
                            clientidC = requestObj.getString("client_id");
                            break;
                        case 2:
                            clientidT = requestObj.getString("client_id");
                            break;
                        default:
                            clientidA = requestObj.getString("client_id");
                            break;
                    }
                }

                if (requestObj.has("login")) {
                    switch (tokenType) {
                        case 1:
                            loginC = requestObj.getString("login");
                            break;
                        case 2:
                            loginT = requestObj.getString("login");
                            break;
                        default:
                            loginA = requestObj.getString("login");
                            break;
                    }
                }

                if (requestObj.has("user_id")) {
                    switch (tokenType) {
                        case 1:
                            useridC = requestObj.getString("user_id");
                            break;
                        case 2:
                            useridT = requestObj.getString("user_id");
                            break;
                        default:
                            useridA = requestObj.getString("user_id");
                            break;
                    }
                }

                if (requestObj.has("user_id")) {
                    switch (tokenType) {
                        case 1:
                            validC = true;
                            break;
                        case 2:
                            validT = true;
                            break;
                        default:
                            validA = true;
                            break;
                    }
                }

                if (firstRun) {
                    com.gmt2001.Console.out.println("Validated Twitch " + type + " OAUTH Token.");
                    firstRun = false;
                } else {
                    com.gmt2001.Console.debug.println("Validated Twitch " + type + " OAUTH Token.");
                }
            } catch (JSONException ex) {
                com.gmt2001.Console.err.logStackTrace(ex);
            }
        }
    }
}
