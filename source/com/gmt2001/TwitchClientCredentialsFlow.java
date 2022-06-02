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
package com.gmt2001;

import com.gmt2001.httpclient.HttpClient;
import com.gmt2001.httpclient.HttpClientResponse;
import com.gmt2001.httpclient.HttpUrl;
import io.netty.handler.codec.http.HttpHeaders;
import io.netty.handler.codec.http.HttpMethod;
import java.time.ZoneOffset;
import java.util.Calendar;
import java.util.HashMap;
import java.util.Map;
import java.util.TimeZone;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import org.json.JSONObject;
import tv.phantombot.CaselessProperties;
import tv.phantombot.CaselessProperties.Transaction;
import tv.phantombot.twitch.api.TwitchValidate;

/**
 * Handles the Twitch Client Credentials Flow (App Token)
 *
 * @author gmt2001
 */
public class TwitchClientCredentialsFlow {

    private static final String BASE_URL = "https://id.twitch.tv/oauth2";
    private static final long REFRESH_INTERVAL = 86400000L;
    private static final String[] SCOPES = {"channel:read:subscriptions", "bits:read", "channel:moderate", "moderation:read",
        "channel:read:redemptions", "channel:read:polls", "channel:read:predictions", "channel:read:hype_train"};
    private boolean timerStarted = false;

    /**
     * Constructor
     *
     * @param clientid The developer app Client ID for the timer
     * @param clientsecret The developer app Client Secret for the timer
     */
    public TwitchClientCredentialsFlow(String clientid, String clientsecret) {
        this.startup(clientid, clientsecret);
    }

    /**
     * Gets a new App Token, regardless of expiration
     *
     * @param properties The properties object containing the Client ID, Client Secret, and where the token will be stored
     * @return true if a new token was saved
     */
    public boolean getNewToken(CaselessProperties properties) {
        return this.getAppToken(properties);
    }

    /**
     * Gets a new App Token, regardless of expiration
     *
     * @return true if a new token was saved
     */
    public boolean getNewToken() {
        return this.getAppToken(CaselessProperties.instance());
    }

    /**
     * Gets a new App Token, if the existing one is near expiration
     *
     * @param properties The properties object containing the Client ID, Client Secret, and where the token is be stored
     * @return true if a new token was saved
     */
    public boolean checkExpirationAndGetNewToken(CaselessProperties properties) {
        Calendar c = Calendar.getInstance(TimeZone.getTimeZone(ZoneOffset.UTC));
        c.setTimeInMillis(properties.getPropertyAsLong("apptokenexpires", 0L));
        c.add(Calendar.MILLISECOND, -((int) REFRESH_INTERVAL) - 1000);
        if (c.before(Calendar.getInstance(TimeZone.getTimeZone(ZoneOffset.UTC)))) {
            return this.getAppToken(properties);
        } else {
            com.gmt2001.Console.debug.println("skip update");
        }

        return false;
    }

    /**
     * Gets a new App Token, if the existing one is near expiration
     *
     * @return true if a new token was saved
     */
    public boolean checkExpirationAndGetNewToken() {
        return this.checkExpirationAndGetNewToken(CaselessProperties.instance());
    }

    private boolean getAppToken(CaselessProperties properties) {
        if (properties == null || !properties.containsKey("clientid") || properties.getProperty("clientid").isBlank()
                || !properties.containsKey("clientsecret") || properties.getProperty("clientsecret").isBlank()) {
            com.gmt2001.Console.debug.println("skipped refresh");
            return false;
        }

        boolean changed = false;
        Transaction transaction = properties.startTransaction(Transaction.PRIORITY_NORMAL);
        JSONObject result = TwitchClientCredentialsFlow.tryGetAppToken(properties.getProperty("clientid"), properties.getProperty("clientsecret"));

        if (result.has("error")) {
            com.gmt2001.Console.err.println(result.toString());
        } else if (!result.has("access_token") || !result.has("expires_in")) {
            com.gmt2001.Console.err.println("Failed to get App (EventSub) OAuth, Token or Expiration was missing: " + result.toString());
        } else {
            Calendar c = Calendar.getInstance(TimeZone.getTimeZone(ZoneOffset.UTC));
            c.add(Calendar.SECOND, result.getInt("expires_in"));
            transaction.setProperty("apptoken", result.getString("access_token"));
            transaction.setProperty("apptokenexpires", c.getTimeInMillis() + "");

            com.gmt2001.Console.out.println("Refreshed the app token");
            changed = true;
        }

        if (changed) {

            transaction.commit();

            TwitchValidate.instance().updateAppToken(CaselessProperties.instance().getProperty("apptoken"));
        }

        return changed;
    }

    private synchronized void startup(String clientid, String clientsecret) {
        if (this.timerStarted) {
            com.gmt2001.Console.debug.println("Timer exists");
            return;
        }
        if (clientid != null && !clientid.isBlank() && clientsecret != null && !clientsecret.isBlank()) {
            com.gmt2001.Console.debug.println("starting timer");
            Executors.newSingleThreadScheduledExecutor().scheduleAtFixedRate(() -> {
                checkExpirationAndGetNewToken();
            }, REFRESH_INTERVAL, REFRESH_INTERVAL, TimeUnit.MILLISECONDS);
            this.timerStarted = true;
        } else {
            com.gmt2001.Console.debug.println("not starting");
        }
    }

    private static JSONObject tryGetAppToken(String clientid, String clientsecret) {
        Map<String, String> query = new HashMap<>();
        query.put("client_id", clientid);
        query.put("client_secret", clientsecret);
        query.put("grant_type", "client_credentials");

        String scopes = "";
        for (String s : SCOPES) {
            if (!scopes.isEmpty()) {
                scopes += " ";
            }

            scopes += s;
        }

        query.put("scope", scopes);

        return doRequest("/token", query);
    }

    private static JSONObject doRequest(String path, Map<String, String> query) {
        try {
            HttpUrl url = HttpUrl.fromUri(BASE_URL, path).withQuery(query);
            HttpHeaders headers = HttpClient.createHeaders(HttpMethod.POST, true);

            HttpClientResponse response = HttpClient.post(url, headers, "");

            com.gmt2001.Console.debug.println(response.responseCode());

            return response.jsonOrThrow();
        } catch (Exception ex) {
            com.gmt2001.Console.debug.printStackTrace(ex);
            return new JSONObject("{\"error\": \"Internal\",\"message\":\"" + ex.toString() + "\",\"status\":0}");
        }
    }
}
