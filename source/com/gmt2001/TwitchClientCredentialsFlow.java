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
package com.gmt2001;

import io.netty.handler.codec.http.QueryStringEncoder;
import java.io.BufferedOutputStream;
import java.io.BufferedReader;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.net.URL;
import java.time.ZoneOffset;
import java.util.Calendar;
import java.util.Collections;
import java.util.Enumeration;
import java.util.TimeZone;
import java.util.Timer;
import java.util.TimerTask;
import java.util.TreeSet;
import java.util.stream.Collectors;
import javax.net.ssl.HttpsURLConnection;
import org.json.JSONException;
import org.json.JSONObject;
import tv.phantombot.CaselessProperties;
import tv.phantombot.PhantomBot;

/**
 * Handles the Twitch Client Credentials Flow (App Token)
 * @author gmt2001
 */
public class TwitchClientCredentialsFlow {

    private static final String BASE_URL = "https://id.twitch.tv/oauth2";
    private static final String USER_AGENT = "PhantomBot/2020";
    private static final long REFRESH_INTERVAL = 86400000L;
    private static final String[] SCOPES = {"channel:read:subscriptions", "bits:read", "channel:moderate", "moderation:read",
        "channel:read:redemptions", "channel:read:polls", "channel:read:predictions", "channel:read:hype_train"};
    private Timer t = null;

    /**
     * Constructor
     * @param clientid The developer app Client ID for the timer
     * @param clientsecret The developer app Client Secret for the timer
     */
    public TwitchClientCredentialsFlow(String clientid, String clientsecret) {
        this.startup(clientid, clientsecret);
    }

    /**
     * Gets a new App Token, regardless of expiration
     * @param properties The properties object containing the Client ID, Client Secret, and where the token will be stored
     * @return true if a new token was saved
     */
    public boolean getNewToken(CaselessProperties properties) {
        return this.getAppToken(properties);
    }

    /**
     * Gets a new App Token, regardless of expiration
     * @return true if a new token was saved
     */
    public boolean getNewToken() {
        return this.getAppToken(PhantomBot.instance().getProperties());
    }

    /**
     * Gets a new App Token, if the existing one is near expiration
     * @param properties The properties object containing the Client ID, Client Secret, and where the token is be stored
     * @return true if a new token was saved
     */
    public boolean checkExpirationAndGetNewToken(CaselessProperties properties) {
        Calendar c = Calendar.getInstance(TimeZone.getTimeZone(ZoneOffset.UTC));
        c.setTimeInMillis(Long.parseLong(properties.getProperty("apptokenexpires", "0")));
        c.add(Calendar.MILLISECOND, -((int) REFRESH_INTERVAL) - 1000);
        if (c.before(Calendar.getInstance(TimeZone.getTimeZone(ZoneOffset.UTC)))) {
            return this.getAppToken(properties);
        }

        return false;
    }

    /**
     * Gets a new App Token, if the existing one is near expiration
     * @return true if a new token was saved
     */
    public boolean checkExpirationAndGetNewToken() {
        return this.checkExpirationAndGetNewToken(PhantomBot.instance().getProperties());
    }

    private boolean getAppToken(CaselessProperties properties) {
        boolean changed = false;
        JSONObject result = TwitchClientCredentialsFlow.tryGetAppToken(properties.getProperty("clientid"), properties.getProperty("clientsecret"));

        if (result.has("error")) {
            com.gmt2001.Console.err.println(result.toString());
        } else {
            Calendar c = Calendar.getInstance(TimeZone.getTimeZone(ZoneOffset.UTC));
            c.add(Calendar.SECOND, result.getInt("expires_in"));
            properties.setProperty("apptoken", result.getString("access_token"));
            properties.setProperty("apptokenexpires", c.getTimeInMillis() + "");

            com.gmt2001.Console.out.println("Refreshed the app token");
            changed = true;
        }

        if (changed) {
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
        }

        return changed;
    }

    private synchronized void startup(String clientid, String clientsecret) {
        if (t != null) {
            return;
        }
        if (clientid != null && !clientid.isBlank() && clientsecret != null && !clientsecret.isBlank()) {
            com.gmt2001.Console.debug.println("starting timer");
            this.t = new Timer();
            this.t.scheduleAtFixedRate(new TimerTask() {
                @Override
                public void run() {
                    if (PhantomBot.instance() != null) {
                        checkExpirationAndGetNewToken();
                    }
                }
            }, REFRESH_INTERVAL, REFRESH_INTERVAL);
        }
    }

    private static JSONObject tryGetAppToken(String clientid, String clientsecret) {
        QueryStringEncoder qse = new QueryStringEncoder("/token");
        qse.addParam("client_id", clientid);
        qse.addParam("client_secret", clientsecret);
        qse.addParam("grant_type", "client_credentials");

        String scopes = "";
        for (String s : SCOPES) {
            if (!scopes.isEmpty()) {
                scopes += " ";
            }

            scopes += s;
        }

        qse.addParam("scope", scopes);

        return TwitchClientCredentialsFlow.doRequest(qse);
    }

    private static JSONObject doRequest(QueryStringEncoder qse) {
        try {
            URL url = new URL(BASE_URL + qse.toString());

            HttpsURLConnection connection = (HttpsURLConnection) url.openConnection();

            connection.addRequestProperty("Accept", "application/json");
            connection.addRequestProperty("Content-Type", "application/x-www-form-urlencoded");
            connection.addRequestProperty("User-Agent", USER_AGENT);
            connection.setRequestMethod("POST");
            connection.setConnectTimeout(5000);
            connection.setDoOutput(true);

            connection.connect();

            try (BufferedOutputStream stream = new BufferedOutputStream(connection.getOutputStream())) {
                stream.write("".getBytes());
                stream.flush();
            }

            com.gmt2001.Console.debug.println(connection.getResponseCode());

            if (connection.getResponseCode() == 200) {
                try (InputStream inStream = connection.getInputStream()) {
                    String r = new BufferedReader(new InputStreamReader(inStream)).lines().collect(Collectors.joining("\n"));
                    if (!r.startsWith("{")) {
                        r = "{\"error\": \"" + connection.getResponseMessage() + "\",\"message\":\"" + r + "\",\"status\":" + connection.getResponseCode() + "}";
                        com.gmt2001.Console.debug.println(r);
                    }
                    return new JSONObject(r);
                }
            } else {
                try (InputStream inStream = connection.getErrorStream()) {
                    String r = new BufferedReader(new InputStreamReader(inStream)).lines().collect(Collectors.joining("\n"));
                    if (!r.startsWith("{")) {
                        r = "{\"error\": \"" + connection.getResponseMessage() + "\",\"message\":\"" + r + "\",\"status\":" + connection.getResponseCode() + "}";
                        com.gmt2001.Console.debug.println(r);
                    }
                    JSONObject j = new JSONObject(r);
                    if (!j.has("error")) {
                        if (j.has("status")) {
                            j.put("error", j.getInt("status"));
                        } else {
                            j.put("error", j.getInt("E_UNKWN"));
                        }
                    }
                    return j;
                }
            }
        } catch (IOException | NullPointerException | JSONException ex) {
            com.gmt2001.Console.debug.printStackTrace(ex);
            return new JSONObject("{\"error\": \"Internal\",\"message\":\"" + ex.toString() + "\",\"status\":0}");
        }
    }
}
