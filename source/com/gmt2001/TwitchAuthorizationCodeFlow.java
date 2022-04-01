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
import io.netty.handler.codec.http.FullHttpRequest;
import io.netty.handler.codec.http.HttpHeaders;
import io.netty.handler.codec.http.HttpMethod;
import io.netty.handler.codec.http.QueryStringDecoder;
import io.netty.handler.codec.http.QueryStringEncoder;
import java.nio.charset.Charset;
import java.time.ZoneOffset;
import java.util.Calendar;
import java.util.TimeZone;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import org.json.JSONObject;
import tv.phantombot.CaselessProperties;
import tv.phantombot.CaselessProperties.Transaction;
import tv.phantombot.PhantomBot;
import tv.phantombot.httpserver.HTTPOAuthHandler;
import tv.phantombot.twitch.api.TwitchValidate;

/**
 *
 * @author gmt2001
 */
public class TwitchAuthorizationCodeFlow {

    private static final String BASE_URL = "https://id.twitch.tv/oauth2";
    private static final long REFRESH_INTERVAL = 900000L;
    private static final int DEFAULT_EXPIRE_TIME = 900000;
    private boolean timerStarted = false;
    private Transaction refreshTransaction = null;
    private static Transaction newTransaction = null;

    public TwitchAuthorizationCodeFlow(String clientid, String clientsecret) {
        this.startup(clientid, clientsecret);
    }

    public boolean refresh(CaselessProperties properties) {
        return this.refresh(properties, true, true);
    }

    public boolean refresh(CaselessProperties properties, boolean shouldRefreshBot, boolean shouldRefreshAPI) {
        this.refreshTransaction = properties.startTransaction(Transaction.PRIORITY_NORMAL);
        return this.refreshTokens(properties, shouldRefreshBot, shouldRefreshAPI);
    }

    public boolean checkAndRefreshTokens(CaselessProperties properties) {
        this.refreshTransaction = properties.startTransaction(Transaction.PRIORITY_NORMAL);
        boolean bot = false;
        boolean api = false;

        Calendar c = Calendar.getInstance(TimeZone.getTimeZone(ZoneOffset.UTC));
        c.setTimeInMillis(properties.getPropertyAsLong("oauthexpires", 0L));
        c.add(Calendar.MILLISECOND, -((int) REFRESH_INTERVAL) - 1000);
        if (c.before(Calendar.getInstance(TimeZone.getTimeZone(ZoneOffset.UTC)))) {
            bot = true;
        }

        c = Calendar.getInstance(TimeZone.getTimeZone(ZoneOffset.UTC));
        c.setTimeInMillis(properties.getPropertyAsLong("apiexpires", 0L));
        c.add(Calendar.MILLISECOND, -((int) REFRESH_INTERVAL) - 1000);
        if (c.before(Calendar.getInstance(TimeZone.getTimeZone(ZoneOffset.UTC)))) {
            api = true;
        }

        com.gmt2001.Console.debug.println("bot=" + (bot ? "t" : "f") + "; api=" + (api ? "t" : "f"));

        return this.refreshTokens(properties, bot, api);
    }

    private boolean refreshTokens(CaselessProperties properties, boolean bot, boolean api) {
        boolean changed = false;
        if (bot) {
            boolean botchanged = this.refreshBotOAuth(properties);
            changed = changed || botchanged;
        }

        if (api) {
            boolean apichanged = this.refreshAPIOAuth(properties);
            changed = changed || apichanged;
        }

        if (changed) {
            this.refreshTransaction.commit();
            if (PhantomBot.instance() != null) {
                com.gmt2001.Console.debug.println("Saved oauth=" + PhantomBot.instance().getProperties().getProperty("oauth") + " refresh=" + PhantomBot.instance().getProperties().getProperty("refresh") + " oauthexpires=" + PhantomBot.instance().getProperties().getProperty("oauthexpires"));
                com.gmt2001.Console.debug.println("Saved apioauth=" + PhantomBot.instance().getProperties().getProperty("apioauth") + " apirefresh=" + PhantomBot.instance().getProperties().getProperty("apirefresh") + " apiexpires=" + PhantomBot.instance().getProperties().getProperty("apiexpires"));
                TwitchValidate.instance().updateChatToken(PhantomBot.instance().getProperties().getProperty("oauth"));
                TwitchValidate.instance().updateAPIToken(PhantomBot.instance().getProperties().getProperty("apioauth"));
            }
        }

        return changed;
    }

    private boolean refreshBotOAuth(CaselessProperties properties) {
        boolean changed = false;
        if (properties != null && properties.containsKey("refresh") && !properties.getProperty("refresh").isBlank()) {
            JSONObject result = tryRefresh(properties.getProperty("clientid"), properties.getProperty("clientsecret"), properties.getProperty("refresh"));

            if (result.has("error")) {
                com.gmt2001.Console.err.println(result.toString());
            } else {
                Calendar c = Calendar.getInstance(TimeZone.getTimeZone(ZoneOffset.UTC));
                c.add(Calendar.SECOND, result.optInt("expires_in", DEFAULT_EXPIRE_TIME));
                this.refreshTransaction.setProperty("oauth", "oauth:" + result.getString("access_token"));
                this.refreshTransaction.setProperty("refresh", result.getString("refresh_token"));
                this.refreshTransaction.setProperty("oauthexpires", c.getTimeInMillis() + "");

                com.gmt2001.Console.out.println("Refreshed the bot token");
                com.gmt2001.Console.debug.println("New oauth=" + result.getString("access_token") + " refresh=" + result.getString("refresh_token") + " oauthexpires=" + c.getTimeInMillis() + "");
                changed = true;
            }
        } else {
            com.gmt2001.Console.debug.println("skipped refresh " + (properties != null ? "t" : "f") + (properties != null && properties.containsKey("refresh") ? "t" : "f")
                    + (properties != null && properties.containsKey("refresh") && !properties.getProperty("refresh").isBlank() ? "t" : "f"));
        }

        return changed;
    }

    private boolean refreshAPIOAuth(CaselessProperties properties) {
        boolean changed = false;
        if (properties != null && properties.containsKey("apirefresh") && !properties.getProperty("apirefresh").isBlank()) {
            JSONObject result = tryRefresh(properties.getProperty("clientid"), properties.getProperty("clientsecret"), properties.getProperty("apirefresh"));

            if (result.has("error")) {
                com.gmt2001.Console.err.println(result.toString());
            } else {
                Calendar c = Calendar.getInstance(TimeZone.getTimeZone(ZoneOffset.UTC));
                c.add(Calendar.SECOND, result.optInt("expires_in", DEFAULT_EXPIRE_TIME));
                this.refreshTransaction.setProperty("apioauth", "oauth:" + result.getString("access_token"));
                this.refreshTransaction.setProperty("apirefresh", result.getString("refresh_token"));
                this.refreshTransaction.setProperty("apiexpires", c.getTimeInMillis() + "");

                com.gmt2001.Console.out.println("Refreshed the broadcaster token");
                com.gmt2001.Console.debug.println("New apioauth=" + result.getString("access_token") + " apirefresh=" + result.getString("refresh_token") + " apiexpires=" + c.getTimeInMillis() + "");
                changed = true;
            }
        } else {
            com.gmt2001.Console.debug.println("skipped refresh " + (properties != null ? "t" : "f") + (properties != null && properties.containsKey("apirefresh") ? "t" : "f")
                    + (properties != null && properties.containsKey("apirefresh") && !properties.getProperty("apirefresh").isBlank() ? "t" : "f"));
        }

        return changed;
    }

    private synchronized void startup(String clientid, String clientsecret) {
        if (this.timerStarted) {
            com.gmt2001.Console.debug.println("timer exists");
            return;
        }

        if (clientid != null && !clientid.isBlank() && clientsecret != null && !clientsecret.isBlank()) {
            com.gmt2001.Console.debug.println("starting timer");
            Executors.newSingleThreadScheduledExecutor().scheduleAtFixedRate(() -> {
                if (PhantomBot.instance() != null) {
                    checkAndRefreshTokens(PhantomBot.instance().getProperties());
                }
            }, REFRESH_INTERVAL, REFRESH_INTERVAL, TimeUnit.MILLISECONDS);
            this.timerStarted = true;
        } else {
            com.gmt2001.Console.debug.println("not starting");
        }
    }

    public static byte[] handleRequest(FullHttpRequest req, byte[] data, HTTPOAuthHandler handler) {
        if ((req.uri().startsWith("/oauth/checkidsecret") || req.uri().startsWith("/oauth/broadcaster/checkidsecret")) && req.method() == HttpMethod.GET) {
            if (PhantomBot.instance().getProperties().getProperty("clientid") != null && !PhantomBot.instance().getProperties().getProperty("clientid").isBlank()
                    && PhantomBot.instance().getProperties().getProperty("clientsecret") != null && !PhantomBot.instance().getProperties().getProperty("clientsecret").isBlank()) {
                data = PhantomBot.instance().getProperties().getProperty("clientid").getBytes();
            } else {
                com.gmt2001.Console.debug.println("missing id or secret");
                data = "false".getBytes();
            }

            com.gmt2001.Console.debug.println(new String(data));
        } else if (req.uri().startsWith("/oauth/resetbroadcastertoken") && req.method() == HttpMethod.GET) {
            data = handler.changeBroadcasterToken().getBytes();
        } else if (req.uri().startsWith("/oauth/saveidsecret") && req.method() == HttpMethod.PUT) {
            QueryStringDecoder qsd = new QueryStringDecoder(req.content().toString(Charset.defaultCharset()), false);
            if (!qsd.parameters().containsKey("clientid") || !qsd.parameters().containsKey("clientsecret") || qsd.parameters().get("clientid").get(0).isBlank()
                    || qsd.parameters().get("clientsecret").get(0).isBlank()) {
                com.gmt2001.Console.debug.println("missing parameter");
                com.gmt2001.Console.debug.println(!qsd.parameters().containsKey("clientid") + " " + !qsd.parameters().containsKey("clientsecret"));
                try {
                    com.gmt2001.Console.debug.println(qsd.parameters().get("clientid").get(0).isBlank() + " " + qsd.parameters().get("clientsecret").get(0).isBlank());
                } catch (NullPointerException ex) {
                }
                data = "false".getBytes();
            } else {
                newTransaction = PhantomBot.instance().getProperties().startTransaction(Transaction.PRIORITY_HIGH);
                newTransaction.setProperty("clientid", qsd.parameters().get("clientid").get(0));
                newTransaction.setProperty("clientsecret", qsd.parameters().get("clientsecret").get(0));
                newTransaction.commit();
                data = qsd.parameters().get("clientid").get(0).getBytes();
                PhantomBot.instance().getAuthFlow().startup(PhantomBot.instance().getProperties().getProperty("clientid"), PhantomBot.instance().getProperties().getProperty("clientsecret"));
            }

            com.gmt2001.Console.debug.println(new String(data));
        } else if ((req.uri().startsWith("/oauth/authorize") || req.uri().startsWith("/oauth/broadcaster/authorize")) && req.method() == HttpMethod.POST) {
            QueryStringDecoder qsd = new QueryStringDecoder(req.content().toString(Charset.defaultCharset()), false);
            if (!qsd.parameters().containsKey("code") || !qsd.parameters().containsKey("type") || !qsd.parameters().containsKey("redirect_uri")
                    || qsd.parameters().get("code").get(0).isBlank() || qsd.parameters().get("redirect_uri").get(0).isBlank()
                    || (!qsd.parameters().get("type").get(0).equals("bot") && !qsd.parameters().get("type").get(0).equals("broadcaster"))
                    || PhantomBot.instance().getProperties().getProperty("clientid") == null || PhantomBot.instance().getProperties().getProperty("clientid").isBlank()
                    || PhantomBot.instance().getProperties().getProperty("clientsecret") == null || PhantomBot.instance().getProperties().getProperty("clientsecret").isBlank()) {
                com.gmt2001.Console.debug.println("invalid parameter");
                com.gmt2001.Console.debug.println(!qsd.parameters().containsKey("code") + " " + !qsd.parameters().containsKey("type") + " " + !qsd.parameters().containsKey("redirect_uri")
                        + " " + (PhantomBot.instance().getProperties().getProperty("clientsecret") == null) + " " + (PhantomBot.instance().getProperties().getProperty("clientid") == null));
                try {
                    com.gmt2001.Console.debug.println(qsd.parameters().get("code").get(0).isBlank() + " " + qsd.parameters().get("type").get(0).isBlank() + " " + qsd.parameters().get("redirect_uri").get(0).isBlank()
                            + " " + (!qsd.parameters().get("type").get(0).equals("bot") && !qsd.parameters().get("type").get(0).equals("broadcaster"))
                            + " " + PhantomBot.instance().getProperties().getProperty("clientid").isBlank()
                            + " " + PhantomBot.instance().getProperties().getProperty("clientsecret").isBlank());
                } catch (NullPointerException ex) {
                }
                data = "false|invalid input".getBytes();
            } else {
                JSONObject result = tryAuthorize(qsd.parameters().get("code").get(0), qsd.parameters().get("redirect_uri").get(0));
                if (result.has("error")) {
                    data = ("false|" + result.getString("message")).getBytes();
                    com.gmt2001.Console.err.println(result.toString());
                } else if (!result.has("access_token") || !result.has("refresh_token")) {
                    data = ("false|invalidJSONResponse" + result.toString()).getBytes();
                    com.gmt2001.Console.err.println(result.toString());
                } else {
                    newTransaction = PhantomBot.instance().getProperties().startTransaction(Transaction.PRIORITY_HIGH);
                    Calendar c = Calendar.getInstance(TimeZone.getTimeZone(ZoneOffset.UTC));
                    c.add(Calendar.SECOND, result.getInt("expires_in"));
                    newTransaction.setProperty((qsd.parameters().get("type").get(0).equals("bot") ? "" : "api") + "oauth", "oauth:" + result.getString("access_token"));
                    newTransaction.setProperty((qsd.parameters().get("type").get(0).equals("bot") ? "" : "api") + "refresh", result.getString("refresh_token"));
                    newTransaction.setProperty((qsd.parameters().get("type").get(0).equals("bot") ? "oauth" : "api") + "expires", c.getTimeInMillis() + "");

                    if (!qsd.parameters().get("type").get(0).equals("bot")) {
                        handler.changeBroadcasterToken();
                    }

                    if (qsd.parameters().get("type").get(0).equals("bot")) {
                        com.gmt2001.Console.debug.println("New oauth=" + result.getString("access_token") + " refresh=" + result.getString("refresh_token") + " oauthexpires=" + c.getTimeInMillis() + "");
                    } else {
                        com.gmt2001.Console.debug.println("New apioauth=" + result.getString("access_token") + " apirefresh=" + result.getString("refresh_token") + " apiexpires=" + c.getTimeInMillis() + "");
                    }

                    newTransaction.commit();
                    PhantomBot.instance().reconnect();

                    if (qsd.parameters().get("type").get(0).equals("bot")) {
                        com.gmt2001.Console.debug.println("Saved oauth=" + PhantomBot.instance().getProperties().getProperty("oauth") + " refresh=" + PhantomBot.instance().getProperties().getProperty("refresh") + " oauthexpires=" + PhantomBot.instance().getProperties().getProperty("oauthexpires"));
                    } else {
                        com.gmt2001.Console.debug.println("Saved apioauth=" + PhantomBot.instance().getProperties().getProperty("apioauth") + " apirefresh=" + PhantomBot.instance().getProperties().getProperty("apirefresh") + " apiexpires=" + PhantomBot.instance().getProperties().getProperty("apiexpires"));
                    }
                    data = PhantomBot.instance().getProperties().getProperty("clientid").getBytes();
                }
            }

            com.gmt2001.Console.debug.println(new String(data));
        }
        return data;
    }

    private static JSONObject tryAuthorize(String code, String redirect_uri) {
        QueryStringEncoder qse = new QueryStringEncoder("/token");
        qse.addParam("client_id", PhantomBot.instance().getProperties().getProperty("clientid"));
        qse.addParam("client_secret", PhantomBot.instance().getProperties().getProperty("clientsecret"));
        qse.addParam("code", code);
        qse.addParam("grant_type", "authorization_code");
        qse.addParam("redirect_uri", redirect_uri);

        return doRequest(qse);
    }

    private static JSONObject tryRefresh(String clientid, String clientsecret, String refresh_token) {
        QueryStringEncoder qse = new QueryStringEncoder("/token");
        qse.addParam("client_id", clientid);
        qse.addParam("client_secret", clientsecret);
        qse.addParam("refresh_token", refresh_token);
        qse.addParam("grant_type", "refresh_token");

        return doRequest(qse);
    }

    private static JSONObject doRequest(QueryStringEncoder qse) {
        try {
            HttpUrl url = HttpUrl.fromUri(BASE_URL, qse.toString());
            HttpHeaders headers = HttpClient.createHeaders(HttpMethod.POST, true);

            HttpClientResponse response = HttpClient.post(url, headers, "");

            com.gmt2001.Console.debug.println(response.responseCode());

            return response.jsonOrThrow();
        } catch (Throwable ex) {
            com.gmt2001.Console.debug.printStackTrace(ex);
            return new JSONObject("{\"error\": \"Internal\",\"message\":\"" + ex.toString() + "\",\"status\":0}");
        }
    }
}
