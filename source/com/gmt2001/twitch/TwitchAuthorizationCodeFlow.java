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
package com.gmt2001.twitch;

import com.gmt2001.ExecutorService;
import com.gmt2001.httpclient.HttpClient;
import com.gmt2001.httpclient.HttpClientResponse;
import com.gmt2001.httpclient.URIUtil;
import io.netty.handler.codec.http.FullHttpRequest;
import io.netty.handler.codec.http.HttpHeaders;
import io.netty.handler.codec.http.HttpMethod;
import io.netty.handler.codec.http.QueryStringDecoder;
import java.net.URI;
import java.nio.charset.Charset;
import java.time.ZoneOffset;
import java.util.Calendar;
import java.util.HashMap;
import java.util.Map;
import java.util.TimeZone;
import java.util.concurrent.TimeUnit;
import org.json.JSONObject;
import tv.phantombot.CaselessProperties;
import tv.phantombot.CaselessProperties.Transaction;
import tv.phantombot.event.EventBus;
import tv.phantombot.event.twitch.TwitchOAuthReauthorizedEvent;
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
    private static final int DEFAULT_EXPIRE_TIME = 15000;
    private boolean timerStarted = false;

    public TwitchAuthorizationCodeFlow(String clientid, String clientsecret) {
        this.startup(clientid, clientsecret);
    }

    public boolean refresh() {
        return this.refresh(true, true);
    }

    public boolean refresh(boolean shouldRefreshBot, boolean shouldRefreshAPI) {
        Transaction refreshTransaction = CaselessProperties.instance().startTransaction(Transaction.PRIORITY_NORMAL);
        return this.refreshTokens(refreshTransaction, shouldRefreshBot, shouldRefreshAPI);
    }

    public boolean checkAndRefreshTokens() {
        Transaction refreshTransaction = CaselessProperties.instance().startTransaction(Transaction.PRIORITY_NORMAL);
        boolean bot = false;
        boolean api = false;

        Calendar c = Calendar.getInstance(TimeZone.getTimeZone(ZoneOffset.UTC));
        c.setTimeInMillis(CaselessProperties.instance().getPropertyAsLong("oauthexpires", 0L));
        c.add(Calendar.MILLISECOND, -((int) REFRESH_INTERVAL) - 1000);
        if (c.before(Calendar.getInstance(TimeZone.getTimeZone(ZoneOffset.UTC)))) {
            bot = true;
        }

        c = Calendar.getInstance(TimeZone.getTimeZone(ZoneOffset.UTC));
        c.setTimeInMillis(CaselessProperties.instance().getPropertyAsLong("apiexpires", 0L));
        c.add(Calendar.MILLISECOND, -((int) REFRESH_INTERVAL) - 1000);
        if (c.before(Calendar.getInstance(TimeZone.getTimeZone(ZoneOffset.UTC)))) {
            api = true;
        }

        com.gmt2001.Console.debug.println("bot=" + (bot ? "t" : "f") + "; api=" + (api ? "t" : "f"));

        return this.refreshTokens(refreshTransaction, bot, api);
    }

    private synchronized boolean refreshTokens(Transaction refreshTransaction, boolean bot, boolean api) {
        boolean changed = false;
        if (bot) {
            boolean botchanged = this.refreshBotOAuth(refreshTransaction);
            changed = changed || botchanged;
        }

        if (api) {
            boolean apichanged = this.refreshAPIOAuth(refreshTransaction);
            changed = changed || apichanged;
        }

        if (changed) {
            refreshTransaction.commit();
            com.gmt2001.Console.debug.println("Saved oauth=" + CaselessProperties.instance().getProperty("oauth") + " refresh=" + CaselessProperties.instance().getProperty("refresh") + " oauthexpires=" + CaselessProperties.instance().getProperty("oauthexpires"));
            com.gmt2001.Console.debug.println("Saved apioauth=" + CaselessProperties.instance().getProperty("apioauth") + " apirefresh=" + CaselessProperties.instance().getProperty("apirefresh") + " apiexpires=" + CaselessProperties.instance().getProperty("apiexpires"));
            TwitchValidate.instance().updateChatToken(CaselessProperties.instance().getProperty("oauth"));
            TwitchValidate.instance().updateAPIToken(CaselessProperties.instance().getProperty("apioauth"));
        }

        return changed;
    }

    private boolean refreshBotOAuth(Transaction refreshTransaction) {
        boolean changed = false;
        if (CaselessProperties.instance().containsKey("refresh") && !CaselessProperties.instance().getProperty("refresh").isBlank()) {
            JSONObject result = tryRefresh(CaselessProperties.instance().getProperty("clientid"), CaselessProperties.instance().getProperty("clientsecret"), CaselessProperties.instance().getProperty("refresh"));

            if (result.has("error")) {
                com.gmt2001.Console.err.println(result.toString());
            } else if (!result.has("access_token") || !result.has("refresh_token")) {
                com.gmt2001.Console.err.println("Failed to refresh Chat (Bot) OAuth, Token or Refresh was missing: " + result.toString());
            } else {
                Calendar c = Calendar.getInstance(TimeZone.getTimeZone(ZoneOffset.UTC));
                c.add(Calendar.SECOND, result.optInt("expires_in", DEFAULT_EXPIRE_TIME));
                refreshTransaction.setProperty("oauth", "oauth:" + result.getString("access_token"));
                refreshTransaction.setProperty("refresh", result.getString("refresh_token"));
                refreshTransaction.setProperty("oauthexpires", c.getTimeInMillis() + "");

                com.gmt2001.Console.out.println("Refreshed the bot token");
                com.gmt2001.Console.debug.println("New oauth=" + result.getString("access_token") + " refresh=" + result.getString("refresh_token") + " oauthexpires=" + c.getTimeInMillis() + "");
                changed = true;
            }
        } else {
            com.gmt2001.Console.debug.println("skipped refresh " + (CaselessProperties.instance().containsKey("refresh") ? "t" : "f")
                    + (CaselessProperties.instance().containsKey("refresh") && !CaselessProperties.instance().getProperty("refresh").isBlank() ? "t" : "f"));
        }

        return changed;
    }

    private boolean refreshAPIOAuth(Transaction refreshTransaction) {
        boolean changed = false;
        if (CaselessProperties.instance().containsKey("apirefresh") && !CaselessProperties.instance().getProperty("apirefresh").isBlank()) {
            JSONObject result = tryRefresh(CaselessProperties.instance().getProperty("clientid"), CaselessProperties.instance().getProperty("clientsecret"), CaselessProperties.instance().getProperty("apirefresh"));

            if (result.has("error")) {
                com.gmt2001.Console.err.println(result.toString());
            } else if (!result.has("access_token") || !result.has("refresh_token")) {
                com.gmt2001.Console.err.println("Failed to refresh API (Caster) OAuth, Token or Refresh was missing: " + result.toString());
            } else {
                Calendar c = Calendar.getInstance(TimeZone.getTimeZone(ZoneOffset.UTC));
                c.add(Calendar.SECOND, result.optInt("expires_in", DEFAULT_EXPIRE_TIME));
                refreshTransaction.setProperty("apioauth", "oauth:" + result.getString("access_token"));
                refreshTransaction.setProperty("apirefresh", result.getString("refresh_token"));
                refreshTransaction.setProperty("apiexpires", c.getTimeInMillis() + "");

                com.gmt2001.Console.out.println("Refreshed the broadcaster token");
                com.gmt2001.Console.debug.println("New apioauth=" + result.getString("access_token") + " apirefresh=" + result.getString("refresh_token") + " apiexpires=" + c.getTimeInMillis() + "");
                changed = true;
            }
        } else {
            com.gmt2001.Console.debug.println("skipped refresh " + (CaselessProperties.instance().containsKey("apirefresh") ? "t" : "f")
                    + (CaselessProperties.instance().containsKey("apirefresh") && !CaselessProperties.instance().getProperty("apirefresh").isBlank() ? "t" : "f"));
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
            ExecutorService.scheduleAtFixedRate(() -> {
                checkAndRefreshTokens();
            }, REFRESH_INTERVAL, REFRESH_INTERVAL, TimeUnit.MILLISECONDS);
            this.timerStarted = true;
        } else {
            com.gmt2001.Console.debug.println("not starting");
        }
    }

    public static byte[] handleRequest(FullHttpRequest req, byte[] data, HTTPOAuthHandler handler) {
        /**
         * @botproperty clientid - The Twitch Developer Application Client ID
         * @botpropertycatsort clientid 20 20 Twitch
         */
        /**
         * @botproperty clientsecret - The Twitch Developer Application Client Secret
         * @botpropertycatsort clientsecret 30 20 Twitch
         */
        if ((req.uri().startsWith("/oauth/checkidsecret") || req.uri().startsWith("/oauth/broadcaster/checkidsecret")) && req.method() == HttpMethod.GET) {
            if (CaselessProperties.instance().getProperty("clientid") != null && !CaselessProperties.instance().getProperty("clientid").isBlank()
                    && CaselessProperties.instance().getProperty("clientsecret") != null && !CaselessProperties.instance().getProperty("clientsecret").isBlank()) {
                data = CaselessProperties.instance().getProperty("clientid").getBytes();
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
                Transaction newTransaction = CaselessProperties.instance().startTransaction(Transaction.PRIORITY_HIGH);
                newTransaction.setProperty("clientid", qsd.parameters().get("clientid").get(0).trim());
                newTransaction.setProperty("clientsecret", qsd.parameters().get("clientsecret").get(0).trim());
                newTransaction.commit();
                data = qsd.parameters().get("clientid").get(0).getBytes();
                PhantomBot.instance().getAuthFlow().startup(CaselessProperties.instance().getProperty("clientid"), CaselessProperties.instance().getProperty("clientsecret"));
            }

            com.gmt2001.Console.debug.println(new String(data));
        } else if ((req.uri().startsWith("/oauth/authorize") || req.uri().startsWith("/oauth/broadcaster/authorize")) && req.method() == HttpMethod.POST) {
            QueryStringDecoder qsd = new QueryStringDecoder(req.content().toString(Charset.defaultCharset()), false);
            if (!qsd.parameters().containsKey("code") || !qsd.parameters().containsKey("type") || !qsd.parameters().containsKey("redirect_uri")
                    || qsd.parameters().get("code").get(0).isBlank() || qsd.parameters().get("redirect_uri").get(0).isBlank()
                    || (!qsd.parameters().get("type").get(0).equals("bot") && !qsd.parameters().get("type").get(0).equals("broadcaster"))
                    || CaselessProperties.instance().getProperty("clientid") == null || CaselessProperties.instance().getProperty("clientid").isBlank()
                    || CaselessProperties.instance().getProperty("clientsecret") == null || CaselessProperties.instance().getProperty("clientsecret").isBlank()) {
                com.gmt2001.Console.debug.println("invalid parameter");
                com.gmt2001.Console.debug.println(!qsd.parameters().containsKey("code") + " " + !qsd.parameters().containsKey("type") + " " + !qsd.parameters().containsKey("redirect_uri")
                        + " " + (CaselessProperties.instance().getProperty("clientsecret") == null) + " " + (CaselessProperties.instance().getProperty("clientid") == null));
                try {
                    com.gmt2001.Console.debug.println(qsd.parameters().get("code").get(0).isBlank() + " " + qsd.parameters().get("type").get(0).isBlank() + " " + qsd.parameters().get("redirect_uri").get(0).isBlank()
                            + " " + (!qsd.parameters().get("type").get(0).equals("bot") && !qsd.parameters().get("type").get(0).equals("broadcaster"))
                            + " " + CaselessProperties.instance().getProperty("clientid").isBlank()
                            + " " + CaselessProperties.instance().getProperty("clientsecret").isBlank());
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
                    Transaction newTransaction = CaselessProperties.instance().startTransaction(Transaction.PRIORITY_HIGH);
                    Calendar c = Calendar.getInstance(TimeZone.getTimeZone(ZoneOffset.UTC));
                    c.add(Calendar.SECOND, result.optInt("expires_in", DEFAULT_EXPIRE_TIME));
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
                    TwitchValidate.instance().updateChatToken(CaselessProperties.instance().getProperty("oauth"));
                    TwitchValidate.instance().updateAPIToken(CaselessProperties.instance().getProperty("apioauth"));
                    PhantomBot.instance().reconnect();

                    EventBus.instance().postAsync(new TwitchOAuthReauthorizedEvent(!qsd.parameters().get("type").get(0).equals("bot")));

                    if (qsd.parameters().get("type").get(0).equals("bot")) {
                        com.gmt2001.Console.debug.println("Saved oauth=" + CaselessProperties.instance().getProperty("oauth") + " refresh=" + CaselessProperties.instance().getProperty("refresh") + " oauthexpires=" + CaselessProperties.instance().getProperty("oauthexpires"));
                    } else {
                        com.gmt2001.Console.debug.println("Saved apioauth=" + CaselessProperties.instance().getProperty("apioauth") + " apirefresh=" + CaselessProperties.instance().getProperty("apirefresh") + " apiexpires=" + CaselessProperties.instance().getProperty("apiexpires"));
                    }
                    data = CaselessProperties.instance().getProperty("clientid").getBytes();
                }
            }

            com.gmt2001.Console.debug.println(new String(data));
        }
        return data;
    }

    private static JSONObject tryAuthorize(String code, String redirect_uri) {
        Map<String, String> query = new HashMap<>();
        query.put("client_id", CaselessProperties.instance().getProperty("clientid"));
        query.put("client_secret", CaselessProperties.instance().getProperty("clientsecret"));
        query.put("code", code);
        query.put("grant_type", "authorization_code");
        query.put("redirect_uri", redirect_uri);

        return doRequest("/token", query);
    }

    private static JSONObject tryRefresh(String clientid, String clientsecret, String refresh_token) {
        Map<String, String> query = new HashMap<>();
        query.put("client_id", clientid);
        query.put("client_secret", clientsecret);
        query.put("refresh_token", refresh_token);
        query.put("grant_type", "refresh_token");

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
