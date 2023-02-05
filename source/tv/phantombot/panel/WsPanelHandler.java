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
package tv.phantombot.panel;

import com.gmt2001.httpwsserver.HTTPWSServer;
import com.gmt2001.httpwsserver.WebSocketFrameHandler;
import com.gmt2001.httpwsserver.WsFrameHandler;
import com.gmt2001.httpwsserver.auth.WsAuthenticationHandler;
import com.gmt2001.httpwsserver.auth.WsSharedRWTokenAuthenticationHandler;
import com.scaniatv.LangFileUpdater;
import io.netty.buffer.ByteBuf;
import io.netty.buffer.Unpooled;
import io.netty.channel.ChannelHandlerContext;
import io.netty.handler.codec.base64.Base64;
import io.netty.handler.codec.http.websocketx.TextWebSocketFrame;
import io.netty.handler.codec.http.websocketx.WebSocketFrame;
import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.Charset;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.Arrays;
import java.util.HashMap;
import java.util.LinkedList;
import java.util.List;
import java.util.Map;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;
import org.json.JSONStringer;
import tv.phantombot.CaselessProperties;
import tv.phantombot.PhantomBot;
import tv.phantombot.RepoVersion;
import tv.phantombot.cache.TwitchCache;
import tv.phantombot.discord.DiscordAPI;
import tv.phantombot.event.EventBus;
import tv.phantombot.event.webpanel.websocket.WebPanelSocketConnectEvent;
import tv.phantombot.event.webpanel.websocket.WebPanelSocketUpdateEvent;
import tv.phantombot.twitch.api.Helix;

/**
 *
 * @author gmt2001
 */
public class WsPanelHandler implements WsFrameHandler {

    @SuppressWarnings("MismatchedReadAndWriteOfArray")
    private static final String[] BLOCKED_DB_QUERY_TABLES = new String[]{"commandtoken"};
    private static final String[] BLOCKED_DB_UPDATE_TABLES = new String[]{};
    private final WsAuthenticationHandler authHandler;

    public WsPanelHandler(String panelAuthRO, String panelAuth) {
        this.authHandler = new WsSharedRWTokenAuthenticationHandler(panelAuthRO, panelAuth, 10, () -> {
            EventBus.instance().postAsync(new WebPanelSocketConnectEvent());
        });
    }

    @Override
    public WsFrameHandler register() {
        WebSocketFrameHandler.registerWsHandler("/ws/panel", this);
        return this;
    }

    @Override
    public WsAuthenticationHandler getAuthHandler() {
        return authHandler;
    }

    @Override
    public void handleFrame(ChannelHandlerContext ctx, WebSocketFrame frame) {
        if (frame instanceof TextWebSocketFrame) {
            TextWebSocketFrame tframe = (TextWebSocketFrame) frame;

            JSONObject jso;

            try {
                jso = new JSONObject(tframe.text());
            } catch (JSONException ex) {
                com.gmt2001.Console.err.logStackTrace(ex);
                return;
            }

            /**
             * @botproperty wsdebug - If `true`, information about inbound WS frames for the panel are sent to the debug log. Default `false`
             * @botpropertycatsort wsdebug 200 900 Debug
             */
            if (CaselessProperties.instance().getPropertyAsBoolean("wsdebug", false)) {
                com.gmt2001.Console.debug.println(jso.toString());
            }

            if (!ctx.channel().attr(WsSharedRWTokenAuthenticationHandler.ATTR_IS_READ_ONLY).get()) {
                handleRestrictedCommands(ctx, frame, jso);
            }

            handleUnrestrictedCommands(ctx, frame, jso);
        }
    }

    private void handleRestrictedCommands(ChannelHandlerContext ctx, WebSocketFrame frame, JSONObject jso) {
        try {
            if (jso.has("command") || jso.has("command_sync")) {
                handleCommand(ctx, frame, jso);
            } else if (jso.has("dbupdate")) {
                handleDBUpdate(ctx, frame, jso);
            } else if (jso.has("dbincr")) {
                handleDBIncr(ctx, frame, jso);
            } else if (jso.has("dbdecr")) {
                handleDBDecr(ctx, frame, jso);
            } else if (jso.has("dbdelkey")) {
                handleDBDelKey(ctx, frame, jso);
            } else if (jso.has("socket_event")) {
                handleSocketEvent(ctx, frame, jso);
            } else if (jso.has("discordchannellist")) {
                handleDiscordChannelList(ctx, frame, jso);
            } else if (jso.has("channelpointslist")) {
                handleChannelPointsList(ctx, frame, jso);
            }
        } catch (Exception ex) {
            com.gmt2001.Console.err.println("Exception processing /ws/panel frame: " + jso.toString(), !PhantomBot.getEnableDebugging());
            com.gmt2001.Console.err.printStackTrace(ex);
            try {
                this.panelNotification("error", "An exception was thrown while attempting to handle the request. See the core-error log for details", "Processing Error");
            } catch (Exception ex2) {
                com.gmt2001.Console.err.printStackTrace(ex2);
            }
        }
    }

    private void handleCommand(ChannelHandlerContext ctx, WebSocketFrame frame, JSONObject jso) {
        if (PhantomBot.instance() == null) {
            return;
        }

        String command = jso.has("command_sync") ? jso.getString("command_sync") : jso.getString("command");
        String username = jso.has("username") ? jso.getString("username") : PhantomBot.instance().getBotName();
        String uniqueID = jso.has("query_id") ? jso.getString("query_id") : "";

        if (command.charAt(0) == '!') {
            command = command.substring(1);
        }

        if (!jso.has("command_sync")) {
            PhantomBot.instance().handleCommand(username, command);
        } else {
            PhantomBot.instance().handleCommandSync(username, command);
        }

        if (!uniqueID.isEmpty()) {
            JSONStringer jsonObject = new JSONStringer();
            jsonObject.object().key("query_id").value(uniqueID).endObject();
            WebSocketFrameHandler.sendWsFrame(ctx, frame, WebSocketFrameHandler.prepareTextWebSocketResponse(jsonObject.toString()));
        }
    }

    private void handleDBUpdate(ChannelHandlerContext ctx, WebSocketFrame frame, JSONObject jso) {
        if (PhantomBot.instance() == null || PhantomBot.instance().getDataStore() == null) {
            return;
        }

        String table = jso.getJSONObject("update").getString("table");
        String key = jso.getJSONObject("update").getString("key");
        String value = jso.getJSONObject("update").getString("value");
        String uniqueID = jso.has("dbupdate") ? jso.getString("dbupdate") : "";

        if (Arrays.stream(BLOCKED_DB_UPDATE_TABLES).anyMatch(t -> t.equals(table))) {
            return;
        }

        JSONStringer jsonObject = new JSONStringer();
        PhantomBot.instance().getDataStore().set(table, key, value);
        jsonObject.object().key("query_id").value(uniqueID).endObject();
        WebSocketFrameHandler.sendWsFrame(ctx, frame, WebSocketFrameHandler.prepareTextWebSocketResponse(jsonObject.toString()));
    }

    private void handleDBIncr(ChannelHandlerContext ctx, WebSocketFrame frame, JSONObject jso) {
        if (PhantomBot.instance() == null || PhantomBot.instance().getDataStore() == null) {
            return;
        }

        String table = jso.getJSONObject("incr").getString("table");
        String key = jso.getJSONObject("incr").getString("key");
        String value = jso.getJSONObject("incr").getString("value");
        String uniqueID = jso.has("dbincr") ? jso.getString("dbincr") : "";

        if (Arrays.stream(BLOCKED_DB_UPDATE_TABLES).anyMatch(t -> t.equals(table))) {
            return;
        }

        JSONStringer jsonObject = new JSONStringer();
        PhantomBot.instance().getDataStore().incr(table, key, Integer.parseInt(value));
        jsonObject.object().key("query_id").value(uniqueID).endObject();
        WebSocketFrameHandler.sendWsFrame(ctx, frame, WebSocketFrameHandler.prepareTextWebSocketResponse(jsonObject.toString()));
    }

    private void handleDBDecr(ChannelHandlerContext ctx, WebSocketFrame frame, JSONObject jso) {
        if (PhantomBot.instance() == null || PhantomBot.instance().getDataStore() == null) {
            return;
        }

        String table = jso.getJSONObject("decr").getString("table");
        String key = jso.getJSONObject("decr").getString("key");
        String value = jso.getJSONObject("decr").getString("value");
        String uniqueID = jso.has("dbdecr") ? jso.getString("dbdecr") : "";

        if (Arrays.stream(BLOCKED_DB_UPDATE_TABLES).anyMatch(t -> t.equals(table))) {
            return;
        }

        JSONStringer jsonObject = new JSONStringer();
        PhantomBot.instance().getDataStore().decr(table, key, Integer.parseInt(value));
        jsonObject.object().key("query_id").value(uniqueID).endObject();
        WebSocketFrameHandler.sendWsFrame(ctx, frame, WebSocketFrameHandler.prepareTextWebSocketResponse(jsonObject.toString()));
    }

    private void handleDBDelKey(ChannelHandlerContext ctx, WebSocketFrame frame, JSONObject jso) {
        if (PhantomBot.instance() == null || PhantomBot.instance().getDataStore() == null) {
            return;
        }

        String table = jso.getJSONObject("delkey").getString("table");
        String key = jso.getJSONObject("delkey").getString("key");
        String uniqueID = jso.has("dbdelkey") ? jso.getString("dbdelkey") : "";

        if (Arrays.stream(BLOCKED_DB_UPDATE_TABLES).anyMatch(t -> t.equals(table))) {
            return;
        }

        JSONStringer jsonObject = new JSONStringer();
        PhantomBot.instance().getDataStore().del(table, key);
        jsonObject.object().key("query_id").value(uniqueID).endObject();
        WebSocketFrameHandler.sendWsFrame(ctx, frame, WebSocketFrameHandler.prepareTextWebSocketResponse(jsonObject.toString()));
    }

    private void handleSocketEvent(ChannelHandlerContext ctx, WebSocketFrame frame, JSONObject jso) {
        String script = jso.getString("script");
        JSONObject jargs = jso.getJSONObject("args");
        String arguments = jargs.isNull("arguments") ? null : jargs.get("arguments").toString();
        JSONArray jsonArray = jargs.isNull("args") ? null : jargs.getJSONArray("args");
        String uniqueID = jso.has("socket_event") ? jso.getString("socket_event") : "";
        boolean requiresReply = jso.has("requiresReply") ? jso.getBoolean("requiresReply") : false;

        JSONStringer jsonObject = new JSONStringer();
        List<String> tempArgs = new LinkedList<>();
        String[] args = new String[0];

        if (jsonArray != null) {
            for (int i = 0; i < jsonArray.length(); i++) {
                if (jsonArray.isNull(i)) {
                    tempArgs.add(null);
                } else {
                    tempArgs.add(jsonArray.get(i).toString());
                }
            }

            if (!tempArgs.isEmpty()) {
                int i = 0;
                args = new String[tempArgs.size()];

                for (String str : tempArgs) {
                    args[i] = str;
                    ++i;
                }
            }
        }

        EventBus.instance().postAsync(new WebPanelSocketUpdateEvent(uniqueID, script, arguments, args, requiresReply));
        if (!requiresReply) {
            jsonObject.object().key("query_id").value(uniqueID).endObject();
            WebSocketFrameHandler.sendWsFrame(ctx, frame, WebSocketFrameHandler.prepareTextWebSocketResponse(jsonObject.toString()));
        }
    }

    private void handleDiscordChannelList(ChannelHandlerContext ctx, WebSocketFrame frame, JSONObject jso) {
        HashMap<String, Map<String, String>> data = new HashMap<>();
        DiscordAPI.instance().getAllChannelInfoAsync(data).doOnComplete(() -> {
            String uniqueID = jso.has("discordchannellist") ? jso.getString("discordchannellist") : "";

            JSONStringer jsonObject = new JSONStringer();
            jsonObject.object().key("query_id").value(uniqueID);
            jsonObject.key("results").object().key("data").object();

            data.forEach((category, channels) -> {
                jsonObject.key(category).object();
                channels.forEach((channel, info) -> {
                    if (channel.equals("name")) {
                        jsonObject.key(channel).value(info);
                    } else {
                        try {
                            jsonObject.key(channel).object();
                            String[] sinfo = info.split(":", 2);
                            jsonObject.key("type").value(sinfo[0]);
                            jsonObject.key("name").value(sinfo[1]);
                        } catch (IndexOutOfBoundsException ex) {
                            com.gmt2001.Console.err.printStackTrace(ex);
                        } finally {
                            jsonObject.endObject();
                        }
                    }
                });
                jsonObject.endObject();
            });

            jsonObject.endObject().endObject().endObject();
            WebSocketFrameHandler.sendWsFrame(ctx, frame, WebSocketFrameHandler.prepareTextWebSocketResponse(jsonObject.toString()));
        }).subscribe();
    }

    private void handleChannelPointsList(ChannelHandlerContext ctx, WebSocketFrame frame, JSONObject jso) {
        Helix.instance().getCustomRewardAsync(null, null).doOnSuccess(json -> {
            String uniqueID = jso.has("channelpointslist") ? jso.getString("channelpointslist") : "";

            JSONStringer jsonObject = new JSONStringer();
            jsonObject.object().key("query_id").value(uniqueID);
            jsonObject.key("results").object();
            if (json.has("data")) {
                jsonObject.key("data").array();
                json.getJSONArray("data").forEach(jsonObject::value);
                jsonObject.endArray();
            } else {
                jsonObject.key("error").value(json.has("error") ? json.getString("error") : "UNKWN");
                jsonObject.key("message").value(json.has("message") ? json.getString("message") : "UNKNOWN");
                jsonObject.key("status").value(json.has("status") ? json.getInt("status") : -1);
            }
            jsonObject.endObject().endObject();
            WebSocketFrameHandler.sendWsFrame(ctx, frame, WebSocketFrameHandler.prepareTextWebSocketResponse(jsonObject.toString()));
        }).doOnError(com.gmt2001.Console.err::printStackTrace).subscribe();
    }

    private void handleUnrestrictedCommands(ChannelHandlerContext ctx, WebSocketFrame frame, JSONObject jso) {
        try {
            if (jso.has("version")) {
                handleVersion(ctx, frame, jso);
            } else if (jso.has("remote")) {
                handleRemote(ctx, frame, jso);
            } else if (jso.has("dbquery")) {
                handleDBQuery(ctx, frame, jso);
            } else if (jso.has("dbkeys")) {
                handleDBKeysQuery(ctx, frame, jso);
            } else if (jso.has("dbkeyslist")) {
                handleDBKeysListQuery(ctx, frame, jso);
            } else if (jso.has("dbkeysbyorder")) {
                handleDBKeysByOrderQuery(ctx, frame, jso);
            } else if (jso.has("dbvaluesbyorder")) {
                handleDBValuesByOrderQuery(ctx, frame, jso);
            } else if (jso.has("dbkeyssearch")) {
                handleDBKeysSearchQuery(ctx, frame, jso);
            }
        } catch (Exception ex) {
            com.gmt2001.Console.err.println("Exception processing /ws/panel frame: " + jso.toString(), !PhantomBot.getEnableDebugging());
            com.gmt2001.Console.err.printStackTrace(ex);
            try {
                this.panelNotification("error", "An exception was thrown while attempting to handle the request. See the core-error log for details", "Processing Error");
            } catch (Exception ex2) {
                com.gmt2001.Console.err.printStackTrace(ex2);
            }
        }
    }

    private void handleVersion(ChannelHandlerContext ctx, WebSocketFrame frame, JSONObject jso) {
        if (PhantomBot.instance() == null) {
            return;
        }

        JSONStringer jsonObject = new JSONStringer();
        String version = PhantomBot.instance().getBotInfo();
        String uniqueID = jso.has("version") ? jso.getString("version") : "";

        jsonObject.object().key("versionresult").value(uniqueID);
        jsonObject.key("version").value(version);
        jsonObject.key("version-data").object().key("version").value(RepoVersion.getPhantomBotVersion()).key("commit").value(RepoVersion.getRepoVersion());
        jsonObject.key("build-type").value(RepoVersion.getBuildType()).endObject();
        jsonObject.key("java-version").value(System.getProperty("java.runtime.version"));
        jsonObject.key("os-version").value(System.getProperty("os.name"));
        jsonObject.endObject();
        WebSocketFrameHandler.sendWsFrame(ctx, frame, WebSocketFrameHandler.prepareTextWebSocketResponse(jsonObject.toString()));
    }

    private void handleRemote(ChannelHandlerContext ctx, WebSocketFrame frame, JSONObject jso) {
        if (PhantomBot.instance() == null) {
            return;
        }

        JSONStringer jsonObject = new JSONStringer();
        String uniqueID = jso.has("id") ? jso.getString("id") : "";
        String query = jso.has("query") ? jso.getString("query") : "";

        jsonObject.object().key("id").value(uniqueID);
        jsonObject.key("query_id").value(uniqueID);

        if (query.equalsIgnoreCase("panelSettings")) {
            jsonObject.key("channelName").value(PhantomBot.instance().getChannelName());
            jsonObject.key("botName").value(PhantomBot.instance().getBotName());
            jsonObject.key("displayName").value(TwitchCache.instance().getDisplayName());
        } else if (query.equalsIgnoreCase("sslSettings")) {
            jsonObject.key("sslEnabled").value(HTTPWSServer.instance().isSsl());
            jsonObject.key("autoSSL").value(HTTPWSServer.instance().isAutoSsl());
        } else if (query.equalsIgnoreCase("userLogo")) {
            jsonObject.key("results").array();
            try ( InputStream inputStream = Files.newInputStream(Paths.get("./web/panel/img/logo.jpeg"))) {
                ByteBuf buf = Unpooled.copiedBuffer(inputStream.readAllBytes());
                try {
                    ByteBuf buf2 = Base64.encode(buf);
                    try {
                        jsonObject.object().key("logo").value(buf2.toString(Charset.forName("UTF-8"))).endObject();
                    } finally {
                        HTTPWSServer.releaseObj(buf2);
                    }
                } finally {
                    HTTPWSServer.releaseObj(buf);
                }
            } catch (IOException ex) {
                jsonObject.object().key("errors").array().object()
                        .key("status").value("500")
                        .key("title").value("Internal Server Error")
                        .key("detail").value("IOException: " + ex.getMessage())
                        .endObject().endArray().endObject();
                com.gmt2001.Console.err.printStackTrace(ex);
            }
            jsonObject.endArray();
        } else if (query.equalsIgnoreCase("loadLang")) {
            jsonObject.key("results").array().object();
            jsonObject.key("langFile").value(LangFileUpdater.getCustomLang(jso.getJSONObject("params").getString("lang-path")));
            jsonObject.endObject().endArray();
        } else if (query.equalsIgnoreCase("saveLang")) {
            jsonObject.key("results").array();
            if (!ctx.channel().attr(WsSharedRWTokenAuthenticationHandler.ATTR_IS_READ_ONLY).get()) {
                LangFileUpdater.updateCustomLang(jso.getJSONObject("params").getString("content"), jso.getJSONObject("params").getString("lang-path"), jsonObject);
            } else {
                jsonObject.object().key("errors").array().object()
                        .key("status").value("403")
                        .key("title").value("Forbidden")
                        .key("detail").value("Read-only Connection")
                        .endObject().endArray().endObject();
            }
            jsonObject.endArray();
        } else if (query.equalsIgnoreCase("getLangList")) {
            jsonObject.key("results").array();
            for (String langFile : LangFileUpdater.getLangFiles()) {
                jsonObject.value(langFile);
            }
            jsonObject.endArray();
        } else if (query.equalsIgnoreCase("games")) {
            jsonObject.key("results").array();
            try {
                String data = Files.readString(Paths.get("./web/panel/js/utils/gamesList.txt"));
                String search = jso.getJSONObject("params").getString("search").toLowerCase();

                for (String g : data.split("\n")) {
                    if (g.toLowerCase().startsWith(search)) {
                        jsonObject.value(g.replace("\r", ""));
                    }
                }
            } catch (IOException ex) {
                jsonObject.object().key("errors").array().object()
                        .key("status").value("500")
                        .key("title").value("Internal Server Error")
                        .key("detail").value("IOException: " + ex.getMessage())
                        .endObject().endArray().endObject();
                com.gmt2001.Console.err.printStackTrace(ex);
            }
            jsonObject.endArray();
        }

        jsonObject.endObject();
        WebSocketFrameHandler.sendWsFrame(ctx, frame, WebSocketFrameHandler.prepareTextWebSocketResponse(jsonObject.toString()));
    }

    public void handleDBQuery(ChannelHandlerContext ctx, WebSocketFrame frame, JSONObject jso) {
        if (PhantomBot.instance() == null || PhantomBot.instance().getDataStore() == null) {
            return;
        }

        String table = jso.getJSONObject("query").getString("table");
        String key = jso.getJSONObject("query").getString("key");
        String uniqueID = jso.has("dbquery") ? jso.getString("dbquery") : "";

        if (Arrays.stream(BLOCKED_DB_QUERY_TABLES).anyMatch(t -> t.equals(table))) {
            return;
        }

        String value = PhantomBot.instance().getDataStore().GetString(table, "", key);

        JSONStringer jsonObject = new JSONStringer();

        jsonObject.object().key("query_id").value(uniqueID).key("results").object();
        jsonObject.key("table").value(table).key(key).value(value).key("value").value(value).endObject().endObject();
        WebSocketFrameHandler.sendWsFrame(ctx, frame, WebSocketFrameHandler.prepareTextWebSocketResponse(jsonObject.toString()));
    }

    public void handleDBKeysQuery(ChannelHandlerContext ctx, WebSocketFrame frame, JSONObject jso) {
        if (PhantomBot.instance() == null || PhantomBot.instance().getDataStore() == null) {
            return;
        }

        String table = jso.getJSONObject("query").getString("table");
        String uniqueID = jso.has("dbkeys") ? jso.getString("dbkeys") : "";

        if (Arrays.stream(BLOCKED_DB_QUERY_TABLES).anyMatch(t -> t.equals(table))) {
            return;
        }

        JSONStringer jsonObject = new JSONStringer();

        jsonObject.object().key("query_id").value(uniqueID).key("results").array();

        String[] dbKeys = PhantomBot.instance().getDataStore().GetKeyList(table, "");
        for (String dbKey : dbKeys) {
            String value = PhantomBot.instance().getDataStore().GetString(table, "", dbKey);
            jsonObject.object().key("table").value(table).key("key").value(dbKey).key("value").value(value).endObject();
        }

        jsonObject.endArray().endObject();

        if (ctx == null) {
            sendJSONToAll(jsonObject.toString());
        } else {
            WebSocketFrameHandler.sendWsFrame(ctx, frame, WebSocketFrameHandler.prepareTextWebSocketResponse(jsonObject.toString()));
        }
    }

    public void handleDBKeysListQuery(ChannelHandlerContext ctx, WebSocketFrame frame, JSONObject jso) {
        if (PhantomBot.instance() == null || PhantomBot.instance().getDataStore() == null) {
            return;
        }

        JSONArray jsonArray = jso.getJSONArray("query");
        String uniqueID = jso.has("dbkeyslist") ? jso.getString("dbkeyslist") : "";

        if (jsonArray.length() == 0) {
            return;
        }

        JSONStringer jsonObject = new JSONStringer();

        jsonObject.object().key("query_id").value(uniqueID).key("results").array();

        for (int i = 0; i < jsonArray.length(); i++) {
            if (jsonArray.getJSONObject(i).has("table")) {
                String table = jsonArray.getJSONObject(i).getString("table");

                if (Arrays.stream(BLOCKED_DB_QUERY_TABLES).anyMatch(t -> t.equals(table))) {
                    continue;
                }

                String[] dbKeys = PhantomBot.instance().getDataStore().GetKeyList(table, "");
                for (String dbKey : dbKeys) {
                    String value = PhantomBot.instance().getDataStore().GetString(table, "", dbKey);
                    jsonObject.object().key("table").value(table).key("key").value(dbKey).key("value").value(value).endObject();
                }
            }
        }

        jsonObject.endArray().endObject();
        WebSocketFrameHandler.sendWsFrame(ctx, frame, WebSocketFrameHandler.prepareTextWebSocketResponse(jsonObject.toString()));
    }

    public void handleDBKeysByOrderQuery(ChannelHandlerContext ctx, WebSocketFrame frame, JSONObject jso) {
        if (PhantomBot.instance() == null || PhantomBot.instance().getDataStore() == null) {
            return;
        }

        String table = jso.getJSONObject("query").getString("table");
        String limit = jso.getJSONObject("query").getString("limit");
        String offset = jso.getJSONObject("query").getString("offset");
        String order = jso.getJSONObject("query").getString("order");
        String uniqueID = jso.has("dbkeysbyorder") ? jso.getString("dbkeysbyorder") : "";

        if (Arrays.stream(BLOCKED_DB_QUERY_TABLES).anyMatch(t -> t.equals(table))) {
            return;
        }

        JSONStringer jsonObject = new JSONStringer();

        jsonObject.object().key("query_id").value(uniqueID).key("results").array();

        String[] dbKeys = PhantomBot.instance().getDataStore().GetKeysByOrder(table, "", order, limit, offset);
        for (String dbKey : dbKeys) {
            String value = PhantomBot.instance().getDataStore().GetString(table, "", dbKey);
            jsonObject.object().key("table").value(table).key("key").value(dbKey).key("value").value(value).endObject();
        }

        jsonObject.endArray().endObject();
        WebSocketFrameHandler.sendWsFrame(ctx, frame, WebSocketFrameHandler.prepareTextWebSocketResponse(jsonObject.toString()));
    }

    public void handleDBValuesByOrderQuery(ChannelHandlerContext ctx, WebSocketFrame frame, JSONObject jso) {
        if (PhantomBot.instance() == null || PhantomBot.instance().getDataStore() == null) {
            return;
        }

        String table = jso.getJSONObject("query").getString("table");
        String limit = jso.getJSONObject("query").getString("limit");
        String offset = jso.getJSONObject("query").getString("offset");
        String order = jso.getJSONObject("query").getString("order");
        String isNumber = jso.getJSONObject("query").getString("number");
        String uniqueID = jso.has("dbvaluesbyorder") ? jso.getString("dbvaluesbyorder") : "";

        if (Arrays.stream(BLOCKED_DB_QUERY_TABLES).anyMatch(t -> t.equals(table))) {
            return;
        }

        JSONStringer jsonObject = new JSONStringer();

        jsonObject.object().key("query_id").value(uniqueID).key("results").array();

        String[] dbKeys;
        if (isNumber.equals("true")) {
            dbKeys = PhantomBot.instance().getDataStore().GetKeysByNumberOrderValue(table, "", order, limit, offset);
        } else {
            dbKeys = PhantomBot.instance().getDataStore().GetKeysByOrderValue(table, "", order, limit, offset);
        }
        for (String dbKey : dbKeys) {
            String value = PhantomBot.instance().getDataStore().GetString(table, "", dbKey);
            jsonObject.object().key("table").value(table).key("key").value(dbKey).key("value").value(value).endObject();
        }

        jsonObject.endArray().endObject();
        WebSocketFrameHandler.sendWsFrame(ctx, frame, WebSocketFrameHandler.prepareTextWebSocketResponse(jsonObject.toString()));
    }

    public void handleDBKeysSearchQuery(ChannelHandlerContext ctx, WebSocketFrame frame, JSONObject jso) {
        if (PhantomBot.instance() == null || PhantomBot.instance().getDataStore() == null) {
            return;
        }

        String table = jso.getJSONObject("query").getString("table");
        String key = jso.getJSONObject("query").getString("key");
        String limit = jso.getJSONObject("query").getString("limit");
        String offset = jso.getJSONObject("query").getString("offset");
        String order = jso.getJSONObject("query").getString("order");
        String uniqueID = jso.has("dbkeyssearch") ? jso.getString("dbkeyssearch") : "";

        if (Arrays.stream(BLOCKED_DB_QUERY_TABLES).anyMatch(t -> t.equals(table))) {
            return;
        }

        JSONStringer jsonObject = new JSONStringer();

        jsonObject.object().key("query_id").value(uniqueID).key("results").array();

        String[] dbKeys = PhantomBot.instance().getDataStore().GetKeysByLikeKeysOrder(table, "", key, order, limit, offset);
        for (String dbKey : dbKeys) {
            String value = PhantomBot.instance().getDataStore().GetString(table, "", dbKey);
            jsonObject.object().key("table").value(table).key("key").value(dbKey).key("value").value(value).endObject();
        }

        jsonObject.endArray().endObject();
        WebSocketFrameHandler.sendWsFrame(ctx, frame, WebSocketFrameHandler.prepareTextWebSocketResponse(jsonObject.toString()));
    }

    public void sendJSONToAll(String jsonString) {
        try {
            WebSocketFrameHandler.broadcastWsFrame("/ws/panel", WebSocketFrameHandler.prepareTextWebSocketResponse(jsonString));
        } catch (Exception ex) {
            com.gmt2001.Console.err.printStackTrace(ex);
        }
    }

    public void doAudioHooksUpdate() {
        try {
            JSONObject jso = new JSONObject();
            JSONObject query = new JSONObject();
            query.put("table", "audio_hooks");
            jso.put("query", query);
            jso.put("dbkeys", "audio_hook_reload");
            handleDBKeysQuery(null, null, jso);
        } catch (JSONException ex) {
            com.gmt2001.Console.err.printStackTrace(ex);
        }
    }

    public void panelNotification(String type, String message) {
        this.panelNotification(type, message, null);
    }

    public void panelNotification(String type, String message, String title) {
        this.panelNotification(type, message, title, null);
    }

    public void panelNotification(String type, String message, String title, Integer timeout) {
        this.panelNotification(type, message, title, null, null);
    }

    public void panelNotification(String type, String message, String title, Integer timeout, Integer extendedTimeout) {
        this.panelNotification(type, message, title, null, null, null);
    }

    /**
     * Sends a toastr notification to everyone currently authenticated to the panel
     *
     * @param type The type of notification to show. Valid values: {@code success}, {@code error}, {@code warning}, {@code info}. Invalid values are
     * treated as {@code info}
     * @param message The message content of the notification
     * @param title The title of the notification. {@code null} or empty string for no title
     * @param timeout The timeout before the notification automatically closes. {@code null} for default; {@code 0} to not close until the {@code X}
     * is clicked
     * @param extendedTimeout The timeout before the notification automatically closes, if the user hover over it with their mouse. This should be
     * longer than {@code timeout} because the timer is shared. {@code null} for default; {@code 0} to not close until the {@code X} is clicked
     * @param progressBar {@code true} to show a progress bar indicating the time remaining in {@code timeout} until the notification closes
     * automatically; {@code false} to explicitly disable the progress bar on this notification; {@code null} for default
     */
    public void panelNotification(String type, String message, String title, Integer timeout, Integer extendedTimeout, Boolean progressBar) {
        JSONStringer jsonObject = new JSONStringer();
        jsonObject.object().key("query_id").value("notification").key("results").object()
                .key("type").value(type)
                .key("message").value(message)
                .key("title").value(title)
                .key("timeout").value(timeout)
                .key("extendedTimeout").value(extendedTimeout)
                .key("progressBar").value(progressBar)
                .endObject().endObject();
        WebSocketFrameHandler.broadcastWsFrame("/ws/panel", WebSocketFrameHandler.prepareTextWebSocketResponse(jsonObject.toString()));
    }

    /**
     * Sends an ack response to a WS query
     *
     * @param uniqueID The ID the callback is registered under, sent by the requester
     */
    public void sendAck(String uniqueID) {
        JSONStringer jsonObject = new JSONStringer();
        jsonObject.object().key("query_id").value(uniqueID).endObject();
        WebSocketFrameHandler.broadcastWsFrame("/ws/panel", WebSocketFrameHandler.prepareTextWebSocketResponse(jsonObject.toString()));
    }

    /**
     * Sends an object response to a WS query
     *
     * @param uniqueID The ID the callback is registered under, sent by the requester
     * @param obj A map of key/value pairs to send
     */
    public void sendObject(String uniqueID, Map<String, Object> obj) {
        JSONStringer jsonObject = new JSONStringer();
        jsonObject.object().key("query_id").value(uniqueID);
        jsonObject.key("results").object();
        obj.forEach((k, v) -> {
            jsonObject.key(k).value(v);
        });
        jsonObject.endObject().endObject();
        WebSocketFrameHandler.broadcastWsFrame("/ws/panel", WebSocketFrameHandler.prepareTextWebSocketResponse(jsonObject.toString()));
    }

    /**
     * Sends an array response to a WS query
     *
     * @param uniqueID The ID the callback is registered under, sent by the requester
     * @param obj A list of values to send
     */
    public void sendArray(String uniqueID, List<Object> obj) {
        JSONStringer jsonObject = new JSONStringer();
        jsonObject.object().key("query_id").value(uniqueID);
        jsonObject.key("results").object();
        jsonObject.key("data").array();
        obj.forEach(jsonObject::value);
        jsonObject.endArray();
        jsonObject.endObject().endObject();
        WebSocketFrameHandler.broadcastWsFrame("/ws/panel", WebSocketFrameHandler.prepareTextWebSocketResponse(jsonObject.toString()));
    }
}
