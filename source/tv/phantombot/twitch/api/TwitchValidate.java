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
import com.gmt2001.httpclient.URIUtil;
import io.netty.handler.codec.http.HttpHeaders;
import io.netty.handler.codec.http.HttpMethod;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.concurrent.TimeUnit;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;
import tv.phantombot.PhantomBot;

/**
 * Handle Validate requests of the OAUTH2 token from Twitch.
 *
 * @author ScaniaTV, IllusionaryOne, gmt2001
 */
public class TwitchValidate {

    // The current instance
    private static final TwitchValidate instance = new TwitchValidate();
    // The base URL for Twitch API Helix.
    private static final String BASE_URL = "https://id.twitch.tv/oauth2/validate";
    private static final long REFRESH_INTERVAL = 3600000L;
    private static final long TIMEOUT_TIME = 5000L;
    @SuppressWarnings("MismatchedQueryAndUpdateOfCollection")
    private final List<String> scopesC = new CopyOnWriteArrayList<>();
    private final List<String> scopesMC = new CopyOnWriteArrayList<>();
    private String clientidC = "";
    private String loginC = "";
    private String useridC = "";
    public boolean validC = false;
    private Thread validateC = null;
    private ValidateRunnable validaterC = null;
    @SuppressWarnings("MismatchedQueryAndUpdateOfCollection")
    private final List<String> scopesA = new CopyOnWriteArrayList<>();
    private final List<String> scopesMA = new CopyOnWriteArrayList<>();
    private String clientidA = "";
    private String loginA = "";
    private String useridA = "";
    public boolean validA = false;
    private Thread validateA = null;
    private ValidateRunnable validaterA = null;

    /**
     * This class constructor.
     */
    private TwitchValidate() {
        // Set the default exception handler thread.
        Thread.setDefaultUncaughtExceptionHandler(com.gmt2001.UncaughtExceptionHandler.instance());
        ExecutorService.scheduleAtFixedRate(() -> this.doValidations(), REFRESH_INTERVAL, REFRESH_INTERVAL, TimeUnit.MILLISECONDS);
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

    private void doValidations() {
        this.doValidationA();
        this.doValidationC();
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
            HttpClientResponse response = HttpClient.request(HttpMethod.GET, URIUtil.create(BASE_URL), headers, null);

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
            validaterA = new ValidateRunnable(oAuthToken, type, 0);
            validateA = new Thread(validaterA, "tv.phantombot.twitch.api.TwitchValidate::ValidateRunnable");
            validateA.start();
        } catch (Exception ex) {
            com.gmt2001.Console.out.println("Unable to validate Twitch " + type + " OAUTH Token.");
        }
    }

    public void validateChat(String oAuthToken, String type) {
        try {
            validaterC = new ValidateRunnable(oAuthToken, type, 1);
            validateC = new Thread(validaterC, "tv.phantombot.twitch.api.TwitchValidate::ValidateRunnable");
            validateC.start();
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

    public List<String> getMissingChatScopes() {
        return new ArrayList<>(scopesMC);
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
            ExecutorService.execute(() -> this.doValidationC());
        }
    }

    public boolean hasAPIScope(String scope) {
        return scopesA.contains(scope);
    }

    public List<String> getAPIScopes() {
        return new ArrayList<>(scopesA);
    }

    public List<String> getMissingAPIScopes() {
        return new ArrayList<>(scopesMA);
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
            ExecutorService.execute(() -> this.doValidationA());
        }
    }

    public void checkOAuthInconsistencies(String channelName) {
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

        if (!this.hasChatScope("chat:edit")) {
            com.gmt2001.Console.warn.println("CHAT (oauth) does not have chat:edit. Bot may be unable to respond");
        } else if (!this.hasChatScope("moderator:manage:banned_users")) {
            com.gmt2001.Console.warn.println("Chat (oauth) does not have moderator:manage:banned_users. Bot may be unable to purge/timeout/ban");
        }

        if (!this.getAPILogin().equalsIgnoreCase(channelName) && this.getChatLogin().equalsIgnoreCase(channelName)) {
            com.gmt2001.Console.warn.println("API (apioauth) is not logged in as " + channelName + " but CHAT (oauth) is. OAuth tokens may be reversed");
        } else if (!this.getAPILogin().equalsIgnoreCase(channelName)) {
            com.gmt2001.Console.warn.println("API (apioauth) is not logged in as " + channelName + ". Some features may not work");
        }
    }

    public boolean hasOAuthInconsistencies(String channelName) {
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

        return !this.hasChatScope("chat:edit") || !this.hasChatScope("moderator:manage:banned_users") || (!this.getAPILogin().equalsIgnoreCase(channelName) && this.getChatLogin().equalsIgnoreCase(channelName));
    }

    /**
     * Runnable to push the validation checks to the background so as not to block the operation of the bot at start up.
     */
    private class ValidateRunnable implements Runnable {

        private String oAuthToken;
        private final String type;
        private final int tokenType;
        private boolean firstRun = true;
        private boolean lastFail = false;

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
                    if (lastFail || tokenType == 2) {
                        com.gmt2001.Console.err.println("Twitch reports your " + type + " OAUTH token as invalid. It may have expired, "
                                + "been disabled, or the Twitch API is experiencing issues.");
                        com.gmt2001.Console.debug.println(requestObj.toString(4));
                    } else {
                        lastFail = true;
                        PhantomBot.instance().getAuthFlow().refresh(tokenType == 1, tokenType == 0);
                    }
                    return;
                }

                lastFail = false;

                if (!requestObj.getBoolean("_success")) {
                    com.gmt2001.Console.err.println("Attempt to validate " + type + " OAUTH token failed.");
                    com.gmt2001.Console.debug.println(requestObj.toString(4));
                    return;
                }

                if (requestObj.has("scopes")) {
                    JSONArray scopesa = requestObj.getJSONArray("scopes");
                    (tokenType == 1 ? scopesC : scopesA).clear();
                    scopesa.iterator().forEachRemaining(obj -> {
                        (tokenType == 1 ? scopesC : scopesA).add((String) obj);
                    });

                    try {
                        JSONObject scopes = new JSONObject(Files.readString(Paths.get("./web/oauth/scopes.json")));
                        (tokenType == 1 ? scopesMC : scopesMA).clear();
                        scopes.getJSONObject(tokenType == 1 ? "bot" : "broadcaster").keys().forEachRemaining(scope -> {
                            if (!((tokenType == 1 ? scopesC : scopesA).contains(scope))) {
                                (tokenType == 1 ? scopesMC : scopesMA).add(scope);
                            }
                        });
                    } catch (JSONException | IOException e) {
                        com.gmt2001.Console.err.logStackTrace(e);
                    }
                }

                if (requestObj.has("client_id")) {
                    switch (tokenType) {
                        case 1:
                            clientidC = requestObj.getString("client_id");
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
