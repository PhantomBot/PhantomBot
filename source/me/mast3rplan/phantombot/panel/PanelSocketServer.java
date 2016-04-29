/*
 * Copyright (C) 2015 www.phantombot.net
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

/* Websocket accepts the following JSON data from the Panel Interface
 *
 * Please take note of the "id" field with the "unique_id" value. There is
 * no guarantee that a call to the websocket will result in an immediate
 * reply to the Panel Interface. As such, a unique ID must be generated for 
 * each request and is part of every reply.
 *
 * // Authenticate
 * { "authenticate : "authentication_key" }
 *
 * // Get Version
 * { "version" : "unique_id" }
 *
 * // Send command - if username is not provided, defaults to the botname.
 * { "command" : "command line", "username" : "user name" }
 *
 * // Query DB
 * { "dbquery" : "query_id", "query" : { "table" : "table_name", "key" : "key_name" } }
 *
 * // Query DB keys and values
 * { "dbkeys" : "query_id", "query" : { "table" : "table_name"  } }
 *
 * // Update DB
 * { "dbupdate" : "query_id", "update" : { "table" : "table_name", "key" : "key_name", "value" : "new_value" } }
 *
 * // Delete from DB
 * { "dbdelkey" : "query_id", "delkey" : { "table" : "table_name", "key" : "key_name" } }
 * 
 * ---------------------------------------------------------------------------
 *
 * Websocket pushes the following to the Player Interface
 *
 * // Return authorization result.
 * { "authresult" : true/false }
 *
 * // Return Version
 * { "versionresult" : "unique_id", "version" : "core version (repo version)" }
 *
 * // Return DB query. Returns "error" key only if error occurred.
 * { "query_id" : "query_id", "results" :  { "table" : "table_name", "key_name" : "value" } }
 * { "query_id" : "query_id", "error" : "error" } 
 *
 * // Return DB keylist. Returns "error" key only if error occurred.
 * { "query_id" : "query_id", "results" : { [ "table" : "table_name", "key" : "key_name", "value" : "value" ] } }
 * { "query_id" : "query_id", "error" : "error" }
 *
 * // Return when DB has been updated.
 * { "query_id" : "query_id" }
 *
 * // Return when DB key has been deleted.
 * { "query_id" : "query_id" }
 */

/*
 * @author: IllusionaryOne
 */

package me.mast3rplan.phantombot.panel;

import java.io.IOException;
import java.io.File;
import java.io.BufferedWriter;
import java.io.FileWriter;
import java.io.BufferedReader;
import java.io.FileReader;
import java.net.InetSocketAddress;
import java.net.InetAddress;
import java.util.Collection;
import java.util.HashMap;
import java.util.Map;
import java.util.Map.Entry;

import com.google.common.collect.Maps;

import org.java_websocket.WebSocket;
import org.java_websocket.handshake.ClientHandshake;
import org.java_websocket.server.WebSocketServer;

import org.json.JSONArray;
import org.json.JSONObject;
import org.json.JSONException;
import org.json.JSONStringer;

import me.mast3rplan.phantombot.PhantomBot;

public class PanelSocketServer extends WebSocketServer {

    private String authString;
    private String authStringRO;
    private Map<String, wsSession> wsSessionMap = Maps.newHashMap();

    public PanelSocketServer(int port, String authString, String authStringRO) {
        super(new InetSocketAddress(port));
        this.authString = authString;
        this.authStringRO = authStringRO;

        Thread.setDefaultUncaughtExceptionHandler(com.gmt2001.UncaughtExceptionHandler.instance());
    }

    @Override
    public void onOpen(WebSocket webSocket, ClientHandshake clientHandshake) {
        wsSessionMap.put(genSessionKey(webSocket), new wsSession(false, true, webSocket));
        com.gmt2001.Console.debug.println("PanelSocketServer: Connection from " + 
                                          webSocket.getRemoteSocketAddress().getHostName() + 
                                          ":" + webSocket.getRemoteSocketAddress().getPort());

    }

    @Override
    public void onClose(WebSocket webSocket, int i, String s, boolean b) {
        wsSessionMap.remove(genSessionKey(webSocket));
        com.gmt2001.Console.debug.println("PanelSocketServer: Disconnection from " + 
                                          webSocket.getRemoteSocketAddress().getHostName() + 
                                          ":" + webSocket.getRemoteSocketAddress().getPort());
    }

    @Override
    public void onMessage(WebSocket webSocket, String jsonString) {
        JSONObject jsonObject;
        JSONArray  jsonArray;
        wsSession  sessionData;
        Boolean    authenticated;
        String     dataString;
        String     uniqueID;
        int        dataInt;

        try {
            jsonObject = new JSONObject(jsonString);
        } catch (JSONException ex) {
            com.gmt2001.Console.err.println("PanelSocketServer: Bad JSON passed ["+jsonString+"]");
            com.gmt2001.Console.err.printStackTrace(ex);
            return;
        } catch (Exception ex) {
            com.gmt2001.Console.err.println("PanelSocketServer: Exception Occurred");
            com.gmt2001.Console.err.printStackTrace(ex);
            return;
        }
        sessionData = wsSessionMap.get(genSessionKey(webSocket));

        if (jsonObject.has("authenticate")) {
            authenticated = jsonObject.getString("authenticate").equals(authString);
            if (authenticated) {
                sessionData.setAuthenticated(authenticated);
                sessionData.setReadOnly(false);
            } else {
                authenticated = jsonObject.getString("authenticate").equals(authStringRO);
                sessionData.setAuthenticated(authenticated);
                sessionData.setReadOnly(true);
            } 
            return;
        }

        if (!sessionData.isAuthenticated()) {
            JSONStringer jsonStringer = new JSONStringer();
            jsonStringer.object().key("autherror").value("not authenticated").endObject();
            webSocket.send(jsonStringer.toString());
            return;
        }

        // debugMsg("PanelSocketServer::onMessage(" + jsonString + ")");

        try {
            if (jsonObject.has("command")) {
                dataString = jsonObject.getString("command");
                if (jsonObject.has("username")) {
                    PhantomBot.instance().handleCommand(jsonObject.getString("username"), dataString);
                } else {
                    PhantomBot.instance().handleCommand(PhantomBot.instance().getBotName(), dataString);
                }
                return;
            } else if (jsonObject.has("version")) {
                uniqueID = jsonObject.getString("version");
                doVersion(webSocket, uniqueID);
            } else if (jsonObject.has("dbquery")) {
                uniqueID = jsonObject.getString("dbquery");
                String table = jsonObject.getJSONObject("query").getString("table");
                String key = jsonObject.getJSONObject("query").getString("key");
                doDBQuery(webSocket, uniqueID, table, key);
                return;
            } else if (jsonObject.has("dbkeys")) {
                uniqueID = jsonObject.getString("dbkeys");
                String table = jsonObject.getJSONObject("query").getString("table");
                doDBKeysQuery(webSocket, uniqueID, table);
            } else if (jsonObject.has("dbupdate") && !sessionData.isReadOnly()) {
                uniqueID = jsonObject.getString("dbupdate");
                String table = jsonObject.getJSONObject("update").getString("table");
                String key = jsonObject.getJSONObject("update").getString("key");
                String value = jsonObject.getJSONObject("update").getString("value");
                doDBUpdate(webSocket, uniqueID, table, key, value);
            } else if (jsonObject.has("dbdelkey") && !sessionData.isReadOnly()) {
                uniqueID = jsonObject.getString("dbdelkey");
                String table = jsonObject.getJSONObject("delkey").getString("table");
                String key = jsonObject.getJSONObject("delkey").getString("key");
                doDBDelKey(webSocket, uniqueID, table, key);
            } else {
                com.gmt2001.Console.err.println("PanelSocketServer: Unknown JSON passed ["+jsonString+"]");
                return;
            }
        } catch (JSONException ex) {
            com.gmt2001.Console.err.println("PanelSocketServer::JSONException(" + ex.getMessage() + "): " + jsonString);
        } 
    }

    @Override
    public void onError(WebSocket webSocket, Exception e) {
        com.gmt2001.Console.err.printStackTrace(e);
    }

    public void dispose() {
        try {
            this.stop(2000);
        } catch (InterruptedException ex) {
            com.gmt2001.Console.err.printStackTrace(ex);
        }
    }

    public void onWebsocketClosing(WebSocket ws, int code, String reason, boolean remote) {
        com.gmt2001.Console.debug.println("PanelSocketServer::Closing WebSocket");
    }

    public void onWebsocketCloseInitiated(WebSocket ws, int code, String reason) {
        com.gmt2001.Console.debug.println("PanelSocketServer::Closing WebSocket Initiated");
    }

    private void doVersion(WebSocket webSocket, String id) {
        JSONStringer jsonObject = new JSONStringer();

        String version = PhantomBot.instance().getBotInfo();

        jsonObject.object().key("versionresult").value(id).key("version").value(version).endObject();
        webSocket.send(jsonObject.toString());
   }

    private void doDBQuery(WebSocket webSocket, String id, String table, String key) {
        JSONStringer jsonObject = new JSONStringer();

        String value = PhantomBot.instance().getDataStore().GetString(table, "", key);
        jsonObject.object().key("query_id").value(id).key("results").object();
        jsonObject.key("table").value(table).key(key).value(value).endObject().endObject();
        webSocket.send(jsonObject.toString());
    }

    private void doDBKeysQuery(WebSocket webSocket, String id, String table) {
        JSONStringer jsonObject = new JSONStringer();

        jsonObject.object().key("query_id").value(id).key("results").array();

        String[] dbKeys = PhantomBot.instance().getDataStore().GetKeyList(table, "");
        for (String dbKey : dbKeys) {
            String value = PhantomBot.instance().getDataStore().GetString(table, "", dbKey);
            jsonObject.object().key("table").value(table).key("key").value(dbKey).key("value").value(value).endObject();
        }

        jsonObject.endArray().endObject();
        webSocket.send(jsonObject.toString());
    }

    private void doDBUpdate(WebSocket webSocket, String id, String table, String key, String value) {
        JSONStringer jsonObject = new JSONStringer();
        PhantomBot.instance().getDataStore().set(table, key, value);
        jsonObject.object().key("query_id").value(id).endObject();
        webSocket.send(jsonObject.toString());
    }

    private void doDBDelKey(WebSocket webSocket, String id, String table, String key) {
        JSONStringer jsonObject = new JSONStringer();
        PhantomBot.instance().getDataStore().del(table, key);
        jsonObject.object().key("query_id").value(id).endObject();
        webSocket.send(jsonObject.toString());
    }

    private void debugMsg(String message) {
        com.gmt2001.Console.debug.println("PanelSocketServer: " + message);
    }

    private static String genSessionKey(WebSocket webSocket) {
        return new String(Integer.toString(webSocket.getRemoteSocketAddress().hashCode()));
    }

    // Class for storing Session data.
    private class wsSession {
        Boolean authenticated;
        Boolean readonly;
        WebSocket webSocket;

        public wsSession(Boolean authenticated, Boolean readonly, WebSocket webSocket) {
            this.authenticated = authenticated;
            this.readonly = readonly;
            this.webSocket = webSocket;
        }

        public void setAuthenticated(Boolean authenticated) {
            this.authenticated = authenticated;
        }
        public Boolean isAuthenticated() {
            return authenticated;
        }

        public void setReadOnly(Boolean readonly) {
            this.readonly = readonly;
        }
        public Boolean isReadOnly() {
            return readonly;
        }

        public void setWebSocket(WebSocket webSocket) {
            this.webSocket = webSocket;
        }
        public WebSocket getWebSocket() {
            return webSocket;
        }
    }

}
