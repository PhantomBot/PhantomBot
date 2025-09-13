/*
 * Copyright (C) 2016-2025 phantombot.github.io/PhantomBot
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
package com.gmt2001.twitch;

import java.net.URI;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.Calendar;
import java.util.HashMap;
import java.util.Map;
import java.util.TimeZone;
import java.util.concurrent.TimeUnit;

import org.json.JSONObject;

import com.gmt2001.httpclient.HttpClient;
import com.gmt2001.httpclient.HttpClientResponse;
import com.gmt2001.httpclient.URIUtil;
import com.gmt2001.util.concurrent.ExecutorService;

import io.netty.handler.codec.http.HttpHeaders;
import io.netty.handler.codec.http.HttpMethod;
import tv.phantombot.CaselessProperties;
import tv.phantombot.CaselessProperties.Transaction;
import tv.phantombot.twitch.api.TwitchValidate;

/**
 * Provider for Twitch Client Credentials Grant Flow (App Tokens)
 * 
 * @author gmt2001
 */
public class TwitchClientCredentialsFlow {
    private static final String BASE_URL = "https://id.twitch.tv/oauth2";
    private static final long REFRESH_INTERVAL = 900000L;
    private static final int DEFAULT_EXPIRE_TIME = 15000;
    private boolean timerStarted = false;
    private Instant lastRefresh = Instant.MIN;
    private static final Duration minRefreshInterval = Duration.ofMinutes(15);

    public TwitchClientCredentialsFlow(String clientid, String clientsecret) {
        this.startup(clientid, clientsecret);
    }

    public boolean refresh() {
        Transaction refreshTransaction = CaselessProperties.instance().startTransaction(Transaction.PRIORITY_NORMAL);
        return this.refreshToken(refreshTransaction);
    }

    public boolean checkAndRefreshToken() {
        Transaction refreshTransaction = CaselessProperties.instance().startTransaction(Transaction.PRIORITY_NORMAL);

        Calendar c = Calendar.getInstance(TimeZone.getTimeZone(ZoneOffset.UTC));
        c.setTimeInMillis(CaselessProperties.instance().getPropertyAsLong("appexpires", 0L));
        c.add(Calendar.MILLISECOND, -((int) REFRESH_INTERVAL) - 1000);
        if (c.after(Calendar.getInstance(TimeZone.getTimeZone(ZoneOffset.UTC)))) {
            com.gmt2001.Console.debug.println("app=f");
            return false;
        }

        com.gmt2001.Console.debug.println("app=t");

        return this.refreshToken(refreshTransaction);
    }

    private synchronized boolean refreshToken(Transaction refreshTransaction) {
        boolean changed = this.refreshAppOAuth(refreshTransaction);

        if (changed) {
            refreshTransaction.commit();
            com.gmt2001.Console.debug.println("Saved appoauth=" + CaselessProperties.instance().getProperty("appoauth") + " appexpires=" + CaselessProperties.instance().getProperty("appexpires"), "Saved new app");
            TwitchValidate.instance().updateAppToken(CaselessProperties.instance().getProperty("appoauth"));
        }

        return changed;
    }

    synchronized void startup(String clientid, String clientsecret) {
        if (this.timerStarted) {
            com.gmt2001.Console.debug.println("timer exists");
            return;
        }

        if (clientid != null && !clientid.isBlank() && clientsecret != null && !clientsecret.isBlank()) {
            com.gmt2001.Console.debug.println("starting timer");
            ExecutorService.scheduleAtFixedRate(() -> {
                checkAndRefreshToken();
            }, REFRESH_INTERVAL, REFRESH_INTERVAL, TimeUnit.MILLISECONDS);
            this.timerStarted = true;
        } else {
            com.gmt2001.Console.debug.println("not starting");
        }
    }

    private boolean refreshAppOAuth(Transaction refreshTransaction) {
        boolean changed = false;
        boolean minExpired = this.lastRefresh.plus(minRefreshInterval).isBefore(Instant.now());
        if (minExpired) {
            JSONObject result = tryAuthorize();

            if (result.has("error")) {
                com.gmt2001.Console.err.println(result.toString());
            } else if (!result.has("access_token")) {
                com.gmt2001.Console.err.println("Failed to refresh App OAuth, Token was missing: " + result.toString());
            } else {
                Calendar c = Calendar.getInstance(TimeZone.getTimeZone(ZoneOffset.UTC));
                c.add(Calendar.SECOND, result.optInt("expires_in", DEFAULT_EXPIRE_TIME));
                refreshTransaction.setProperty("appoauth", "oauth:" + result.getString("access_token"));
                refreshTransaction.setProperty("appexpires", c.getTimeInMillis() + "");
                this.lastRefresh = Instant.now();

                com.gmt2001.Console.out.println("Refreshed the app token");
                com.gmt2001.Console.debug.println("New appoauth=" + result.getString("access_token") + " appexpires=" + c.getTimeInMillis() + "", "Got new appoauth");
                changed = true;
            }
        } else {
            com.gmt2001.Console.debug.println("skipped refresh " + (minExpired ? "t" : "f"));
        }

        return changed;
    }

    private static JSONObject tryAuthorize() {
        Map<String, String> query = new HashMap<>();
        query.put("client_id", CaselessProperties.instance().getProperty("clientid"));
        query.put("client_secret", CaselessProperties.instance().getProperty("clientsecret"));
        query.put("grant_type", "client_credentials");

        return doRequest("/token", query);
    }

    private static JSONObject doRequest(String path, Map<String, String> query) {
        try {
            URI url = URIUtil.create(BASE_URL + path + HttpClient.createQuery(query));
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
