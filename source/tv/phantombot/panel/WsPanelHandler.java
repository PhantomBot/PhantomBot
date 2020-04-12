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
package tv.phantombot.panel;

import com.gmt2001.httpwsserver.WebSocketFrameHandler;
import com.gmt2001.httpwsserver.WsFrameHandler;
import com.gmt2001.httpwsserver.auth.WsAuthenticationHandler;
import com.gmt2001.httpwsserver.auth.WsSharedRWTokenAuthenticationHandler;
import io.netty.channel.ChannelHandlerContext;
import io.netty.handler.codec.http.websocketx.TextWebSocketFrame;
import io.netty.handler.codec.http.websocketx.WebSocketFrame;
import java.util.Arrays;
import java.util.LinkedList;
import java.util.List;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;
import org.json.JSONStringer;
import tv.phantombot.PhantomBot;
import tv.phantombot.event.EventBus;
import tv.phantombot.event.webpanel.websocket.WebPanelSocketUpdateEvent;

/**
 *
 * @author gmt2001
 */
public class WsPanelHandler implements WsFrameHandler {

    private static final String[] BLOCKED_DB_QUERY_TABLES = new String[]{"commandtoken"};
    private static final String[] BLOCKED_DB_UPDATE_TABLES = new String[]{};
    private final WsAuthenticationHandler authHandler;

    public WsPanelHandler(String panelAuthRO, String panelAuth) {
        authHandler = new WsSharedRWTokenAuthenticationHandler(panelAuthRO, panelAuth, 10);
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

            if (!ctx.channel().attr(WsSharedRWTokenAuthenticationHandler.ATTR_IS_READ_ONLY).get()) {
                handleRestrictedCommands(ctx, frame, jso);
            }

            handleUnrestrictedCommands(ctx, frame, jso);
        }
    }

    private void handleRestrictedCommands(ChannelHandlerContext ctx, WebSocketFrame frame, JSONObject jso) {
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
        }
    }

    private void handleCommand(ChannelHandlerContext ctx, WebSocketFrame frame, JSONObject jso) {
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
        String arguments = jso.getJSONObject("args").getString("arguments");
        JSONArray jsonArray = jso.getJSONObject("args").getJSONArray("args");
        String uniqueID = jso.has("socket_event") ? jso.getString("socket_event") : "";

        JSONStringer jsonObject = new JSONStringer();
        List<String> tempArgs = new LinkedList<>();
        String[] args = null;

        for (int i = 0; i < jsonArray.length(); i++) {
            tempArgs.add(jsonArray.getString(i));
        }

        if (!tempArgs.isEmpty()) {
            int i = 0;
            args = new String[tempArgs.size()];

            for (String str : tempArgs) {
                args[i] = str;
                ++i;
            }
        }

        EventBus.instance().post(new WebPanelSocketUpdateEvent(uniqueID, script, arguments, args));
        jsonObject.object().key("query_id").value(uniqueID).endObject();
        WebSocketFrameHandler.sendWsFrame(ctx, frame, WebSocketFrameHandler.prepareTextWebSocketResponse(jsonObject.toString()));
    }

    private void handleUnrestrictedCommands(ChannelHandlerContext ctx, WebSocketFrame frame, JSONObject jso) {
        if (jso.has("version")) {
            handleVersion(ctx, frame, jso);
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
    }

    private void handleVersion(ChannelHandlerContext ctx, WebSocketFrame frame, JSONObject jso) {
        JSONStringer jsonObject = new JSONStringer();
        String version = PhantomBot.instance().getBotInfo();
        String uniqueID = jso.has("version") ? jso.getString("version") : "";

        jsonObject.object().key("versionresult").value(uniqueID);
        jsonObject.key("version").value(version);
        jsonObject.key("java-version").value(System.getProperty("java.runtime.version"));
        jsonObject.key("os-version").value(System.getProperty("os.name"));
        jsonObject.endObject();
        WebSocketFrameHandler.sendWsFrame(ctx, frame, WebSocketFrameHandler.prepareTextWebSocketResponse(jsonObject.toString()));
    }

    public void handleDBQuery(ChannelHandlerContext ctx, WebSocketFrame frame, JSONObject jso) {
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
        WebSocketFrameHandler.broadcastWsFrame("/ws/panel", WebSocketFrameHandler.prepareTextWebSocketResponse(jsonString));
    }

    public void triggerAudioPanel(String audioHook) {
        JSONStringer jsonObject = new JSONStringer();
        jsonObject.object().key("audio_panel_hook").value(audioHook).endObject();
        sendJSONToAll(jsonObject.toString());
    }

    public void doAudioHooksUpdate() {
        JSONObject jso = new JSONObject();
        JSONObject query = new JSONObject();
        query.put("table", "audio_hooks");
        jso.put("query", query);
        jso.put("dbkeys", "audio_hook_reload");
        handleDBKeysQuery(null, null, jso);
    }

    public void alertImage(String imageInfo) {
        JSONStringer jsonObject = new JSONStringer();
        jsonObject.object().key("alert_image").value(imageInfo).endObject();
        sendJSONToAll(jsonObject.toString());
    }
}
