/*
 * Copyright (C) 2016-2017 phantombot.tv
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
 * { "command" : "command line", "username" : "user name", "query_id" : "query_id" }
 *
 * // Query DB
 * { "dbquery" : "query_id", "query" : { "table" : "table_name", "key" : "key_name" } }
 *
 * // Query DB keys and values
 * { "dbkeys" : "query_id", "query" : { "table" : "table_name"  } }
 * { "dbkeyslist" : "query_id", "query" : [ { "table" : "table_name"  } ] }
 *
 * // Update DB
 * { "dbupdate" : "query_id", "update" : { "table" : "table_name", "key" : "key_name", "value" : "new_value" } }
 *
 * // Increment data in DB
 * { "dbincr" : "query_id", "incr" : { "table" : "table_name", "key" : "key_name", "value" : "incr_value" } }
 *
 * // Decrement data in DB
 * { "dbdecr" : "query_id", "decr" : { "table" : "table_name", "key" : "key_name", "value" : "decr_value" } }
 *
 * // Delete from DB
 * { "dbdelkey" : "query_id", "delkey" : { "table" : "table_name", "key" : "key_name" } }
 *
 * // Execute an Event
 * { "socket_event" : "query_id", "script" : "script_name", "args" : { arguments : arguments, args : [ ] } }
 *
 * ---------------------------------------------------------------------------
 *
 * Websocket pushes the following to the Panel Interface
 *
 * // Return authorization result.
 * { "authresult" : true/false }
 *
 * // Return Version
 * { "versionresult" : "unique_id", "version" : "core version (repo version)" }
 *
 * // Return Command Complete ID (does not mean it was successful, just that the bot returned
 * // control to the NewPanelSocketServer.
 * { "query_id" : "query_id" }
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
 *
 * // Request an audio byte to play.
 * { "audio_panel_hook" : "audio hook name" }
 *
 * // Request an alert image to be displayed.
 * { "alert_image" : "filename[,duration_in_seconds]" }
 *
 * // Return from an Event being executed.
 * { "query_id" : "query_id" }:

 */

package tv.phantombot.panel;

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
import java.util.LinkedList;
import java.util.List;

import com.gmt2001.TwitchAPIv5;

import com.google.common.collect.Maps;

import fr.bmartel.protocol.http.utils.StringUtils;
import fr.bmartel.protocol.websocket.listeners.IClientEventListener;
import fr.bmartel.protocol.websocket.server.IWebsocketClient;
import fr.bmartel.protocol.websocket.server.WebsocketServer;

import org.json.JSONArray;
import org.json.JSONObject;
import org.json.JSONException;
import org.json.JSONStringer;

import tv.phantombot.event.EventBus;
import tv.phantombot.event.webpanel.WebPanelSocketConnectedEvent;
import tv.phantombot.event.webpanel.WebPanelSocketUpdateEvent;

import tv.phantombot.PhantomBot;

/**
 * Provides a IWebsocketClientServer to provide service to the Control Panel. 
 * 
 * @author IllusionaryOne
 */
public class NewPanelSocketServer {

    private WebsocketServer server;
    private String authString;
    private String authStringRO;
    private Map<String, wsSession> wsSessionMap = Maps.newHashMap();
    private boolean dbCallNull = false;

    /**
     * Constructor for class which initializes the WebsocketServer object.
     *
     * @param port         The port to bind to.
     * @param authString   The authorization string to use for read/write connectivity.
     * @param authStringRO The authorizatin string to use for read-only connectivity.
     */
    public NewPanelSocketServer(int port, String authString, String authStringRO) throws Exception {
        this(port, authString, authStringRO, null, null);
    }

    /**
     * Constructor for class which initializes the WebsocketServer object.
     *
     * @param port         The port to bind to.
     * @param authString   The authorization string to use for read/write connectivity.
     * @param authStringRO The authorizatin string to use for read-only connectivity.
     * @param keyFileName  Name of the keyfile for SSL encryption.
     * @param keyPassword  The password to unlock the keyfile.
     */
    public NewPanelSocketServer(int port, String authString, String authStringRO, String keyFileName, String keyPassword) throws Exception {
        this.authString = authString;
        this.authStringRO = authStringRO;

        Thread.setDefaultUncaughtExceptionHandler(com.gmt2001.UncaughtExceptionHandler.instance());
        server = new WebsocketServer(port);
        if (keyFileName != null && keyPassword != null) {
            server.setSsl(true);
            server.setSSLParams("JKS", "SunX509", "TLS", keyFileName, keyPassword);
        }

        server.addServerEventListener(new IClientEventListener() {

            @Override
            public void onMessageReceivedFromClient(IWebsocketClient client, String message) {
                onMessage(client, message);
            }

            @Override
            public void onClientConnection(IWebsocketClient client) {
                onOpen(client);
            }

            @Override
            public void onClientClose(IWebsocketClient client) {
                onClose(client);
            }

            @Override
            public void onServerError(IWebsocketClient client, String errorMessage) {
                serverError(errorMessage);
            }

            @Override
            public void onError(IWebsocketClient client, String errorMessage) {
                clientError(client, errorMessage);
            }
        });
    }
     

    /**
     * Starts the created WebsocketServer
     */
    public void start() throws Exception {
        try {
            server.start();
        } catch (Exception ex) {
            com.gmt2001.Console.err.println("Failed to start WebSocket Server: " + ex.getMessage());
            throw ex;
        }
    }

    /**
     * Override for the IWebsocketClientServer class which is called upon a new connection.
     *
     * @param webSocket       The IWebsocketClient object for this connection.
     */
    public void onOpen(IWebsocketClient webSocket) {
        wsSessionMap.put(genSessionKey(webSocket), new wsSession(false, true, webSocket));
        com.gmt2001.Console.debug.println("Connection from " + webSocket.getHostName() + ":" + webSocket.getPort());

    }

    /**
     * Override for the IWebsocketClientServer class which is called upon a disconnect.
     *
     * @param webSocket The IWebsocketClient object for this disconnect.
     */
    public void onClose(IWebsocketClient webSocket) {
        wsSessionMap.remove(genSessionKey(webSocket));
        com.gmt2001.Console.debug.println("Close from " + webSocket.getHostName() + ":" + webSocket.getPort());
    }

    /**
     * Override for the IWebsocketClientServer class which is called upon a server error.
     *
     * @param String The error message from the socket server.
     */
    public void serverError(String errorMessage) {
        com.gmt2001.Console.err.println("WebSocket Server Error, will attempt to restart server. Error: " + errorMessage);
        try {
            start();
        } catch (Exception ex) {
            com.gmt2001.Console.err.println("PhantomBot is Exiting...");
            System.exit(0);
        }
    }

    /**
     * Override for the IWebsocketClientServer class which is called upon a client connection error.
     *
     * @param String The error message from the socket server.
     */
    public void clientError(IWebsocketClient webSocket, String errorMessage) {
        /* TODO: This may also need to remove the session, will need to check more on this. */
        com.gmt2001.Console.debug.println("Error from Client Socket: " + errorMessage);
    }

    /**
     * Override for the IWebsocketClientServer class which is called when a message is received.
     *
     * @param webSocket  The IWebsocketClient object for this message.
     * @param jsonString The message sent on the IWebsocketClient.
     */
    public void onMessage(IWebsocketClient webSocket, String jsonString) {
        try {
            MessageRunnable messageRunnable = new MessageRunnable(webSocket, jsonString);
            new Thread(messageRunnable, "tv.phantombot.panel.NewPanelSocketServer::MessageRunnable").start();
        } catch (Exception ex) {
            handleMessage(webSocket, jsonString);
        }
    }

    /**
     * Parser of the data received on the IWebsocketClient.
     *
     * @param webSocket  The IWebsocketClient object for this message.
     * @param jsonString The message that was received on the IWebsocketClient, assumed to be a JSON message.
     */
    private void handleMessage(IWebsocketClient webSocket, String jsonString) {
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
            com.gmt2001.Console.err.println("NewPanelSocketServer: Bad JSON passed ["+jsonString+"]");
            com.gmt2001.Console.err.printStackTrace(ex);
            return;
        } catch (Exception ex) {
            com.gmt2001.Console.err.println("NewPanelSocketServer: Exception Occurred");
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

                if (!authenticated) {
                    authenticated = authenticateOauth(jsonObject.getString("authenticate"));
                    sessionData.setAuthenticated(authenticated);
                    sessionData.setReadOnly(false);
                }
            }
            return;
        }

        if (!sessionData.isAuthenticated()) {
            JSONStringer jsonStringer = new JSONStringer();
            jsonStringer.object().key("autherror").value("not authenticated").endObject();
            webSocket.send(jsonStringer.toString());
            return;
        }

        // debugMsg("NewPanelSocketServer::onMessage(" + jsonString + ")");

        try {
            if (jsonObject.has("command")) {
                String command = jsonObject.getString("command");
                String username = jsonObject.has("username") ? jsonObject.getString("username") : PhantomBot.instance().getBotName();
                uniqueID = jsonObject.has("query_id") ? jsonObject.getString("query_id") : "";
                doHandleCommand(webSocket, command, username, uniqueID);
                return;
            } else if (jsonObject.has("connected")) {
                handleConnection(webSocket, jsonObject.has("query_id") ? jsonObject.getString("query_id") : "");
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
            } else if (jsonObject.has("dbkeyslist")) {
                uniqueID = jsonObject.getString("dbkeyslist");
                jsonArray = jsonObject.getJSONArray("query");
                doDBKeysListQuery(webSocket, uniqueID, jsonArray);
            } else if (jsonObject.has("dbupdate") && !sessionData.isReadOnly()) {
                uniqueID = jsonObject.getString("dbupdate");
                String table = jsonObject.getJSONObject("update").getString("table");
                String key = jsonObject.getJSONObject("update").getString("key");
                String value = jsonObject.getJSONObject("update").getString("value");
                doDBUpdate(webSocket, uniqueID, table, key, value);
            } else if (jsonObject.has("dbincr") && !sessionData.isReadOnly()) {
                uniqueID = jsonObject.getString("dbincr");
                String table = jsonObject.getJSONObject("incr").getString("table");
                String key = jsonObject.getJSONObject("incr").getString("key");
                String value = jsonObject.getJSONObject("incr").getString("value");
                doDBIncr(webSocket, uniqueID, table, key, value);
            } else if (jsonObject.has("dbdecr") && !sessionData.isReadOnly()) {
                uniqueID = jsonObject.getString("dbdecr");
                String table = jsonObject.getJSONObject("decr").getString("table");
                String key = jsonObject.getJSONObject("decr").getString("key");
                String value = jsonObject.getJSONObject("decr").getString("value");
                doDBDecr(webSocket, uniqueID, table, key, value);
            } else if (jsonObject.has("dbdelkey") && !sessionData.isReadOnly()) {
                uniqueID = jsonObject.getString("dbdelkey");
                String table = jsonObject.getJSONObject("delkey").getString("table");
                String key = jsonObject.getJSONObject("delkey").getString("key");
                doDBDelKey(webSocket, uniqueID, table, key);
            } else if (jsonObject.has("socket_event") && !sessionData.isReadOnly()) {		
                uniqueID = jsonObject.getString("socket_event");		
                String script = jsonObject.getString("script");		
                String arguments = jsonObject.getJSONObject("args").getString("arguments");		
                JSONArray args = jsonObject.getJSONObject("args").getJSONArray("args");		
                doWSEvent(webSocket, uniqueID, script, arguments, args);
            } else if (jsonObject.has("dbkeysbyorder")) {
                uniqueID = jsonObject.getString("dbkeysbyorder");
                String table = jsonObject.getJSONObject("query").getString("table");
                String limit = jsonObject.getJSONObject("query").getString("limit");
                String offset = jsonObject.getJSONObject("query").getString("offset");
                String order = jsonObject.getJSONObject("query").getString("order");
                doDBKeysByOrder(webSocket, uniqueID, table, limit, offset, order);
            } else if (jsonObject.has("dbkeyssearch")) {
                uniqueID = jsonObject.getString("dbkeyssearch");
                String table = jsonObject.getJSONObject("query").getString("table");
                String key = jsonObject.getJSONObject("query").getString("key");
                String limit = jsonObject.getJSONObject("query").getString("limit");
                String offset = jsonObject.getJSONObject("query").getString("offset");
                String order = jsonObject.getJSONObject("query").getString("order");
                doDBKeysSearch(webSocket, uniqueID, table, key, limit, order, offset);
            } else {
                com.gmt2001.Console.err.println("NewPanelSocketServer: Unknown JSON passed [" + jsonString + "]");
                return;
            }
        } catch (JSONException ex) {
            com.gmt2001.Console.err.println("NewPanelSocketServer::JSONException(" + ex.getMessage() + "): " + jsonString);
        } 
    }

    /**
     * Stops the thread that controls this object, thus closing down the IWebsocketClientServer.
     */
    public void dispose() {
        server.closeServer();
    }

    /**
     * Sends data to all open IWebsocketClients.
     *
     * @param text Text to send to all open IWebsocketClients.
     */
    public void sendToAll(String text) {
        for (wsSession session: wsSessionMap.values()) {
            try {
                session.getIWebsocketClient().send(text);
            } catch (Exception ex) {
                com.gmt2001.Console.debug.println("Failed to send a message to the panel socket: [" + ex.getClass().getSimpleName() + "] " + ex.getMessage());
            }
        }
    }

    /**
     * Handles commands in PhantomBot and will optionally return a completion status.
     *
     * @param webSocket The IWebsocketClient which provided the command.
     * @param command   The command to execute in PhantomBot.
     * @param username  The user to execute the command as.
     * @param id        Optional unique ID which is sent back to the IWebsocketClient.
     */
    private void doHandleCommand(IWebsocketClient webSocket, String command, String username, String id) {
        PhantomBot.instance().handleCommand(username, command);
        if (!id.isEmpty()) {
            JSONStringer jsonObject = new JSONStringer();
            jsonObject.object().key("query_id").value(id).endObject();
            webSocket.send(jsonObject.toString());
        }
    }

    /**
     * handles event of when we are fully connected with the panel
     *
     * @param webSocket The WebSocket which provided the command.
     * @param id Optional unique ID which is sent back to the WebSocket.
     */
    private void handleConnection(IWebsocketClient webSocket, String id) {
        if (!id.isEmpty()) {
            JSONStringer jsonObject = new JSONStringer();
            jsonObject.object().key("query_id").value(id).endObject();
            webSocket.send(jsonObject.toString());
        }

        EventBus.instance().postAsync(new WebPanelSocketConnectedEvent());
    }

    /**
     * Provides a version payload.
     *
     * @param webSocket The IWebsocketClient which requested the version.
     * @param id        The unique ID which is sent back to the IWebsocketClient.
     */
    private void doVersion(IWebsocketClient webSocket, String id) {
        JSONStringer jsonObject = new JSONStringer();
        String version = "";

        try {
            version = PhantomBot.instance().getBotInfo();
        } catch (NullPointerException ex) {
            if (!dbCallNull) {
                dbCallNull = true;
                debugMsg("NULL returned from PhantomBot instance.");
            }
            return;
        }

        jsonObject.object().key("versionresult").value(id).key("version").value(version).endObject();
        webSocket.send(jsonObject.toString());
    }

    /**
     * Performs a query of the DataStore to return a specific value.
     *
     * @param webSocket The IWebsocketClient which requested the data.
     * @param id        The unique ID which is sent back to the IWebsocketClient.
     * @param table     Table name to query.
     * @param key       Key to query with.
     */
    private void doDBQuery(IWebsocketClient webSocket, String id, String table, String key) {
        JSONStringer jsonObject = new JSONStringer();
        String value = "";

        try {  
            value = PhantomBot.instance().getDataStore().GetString(table, "", key);
        } catch (NullPointerException ex) {
            if (!dbCallNull) {
                dbCallNull = true;
                debugMsg("NULL returned from DB. DB Object not created yet.");
            }
            return;
        }

        dbCallNull = false;
        jsonObject.object().key("query_id").value(id).key("results").object();
        jsonObject.key("table").value(table).key(key).value(value).key("value").value(value).endObject().endObject();
        webSocket.send(jsonObject.toString());
    }

    /**
     * Performs a query of the DataStore to return a list of keys.
     *
     * @param webSocket The IWebsocketClient which requested the data.
     * @param id        The unique ID which is sent back to the IWebsocketClient.
     * @param table     Table name to query.
     */
    private void doDBKeysQuery(IWebsocketClient webSocket, String id, String table) {
        JSONStringer jsonObject = new JSONStringer();

        jsonObject.object().key("query_id").value(id).key("results").array();

        try {
            String[] dbKeys = PhantomBot.instance().getDataStore().GetKeyList(table, "");
            for (String dbKey : dbKeys) {
                String value = PhantomBot.instance().getDataStore().GetString(table, "", dbKey);
                jsonObject.object().key("table").value(table).key("key").value(dbKey).key("value").value(value).endObject();
            }
        } catch (NullPointerException ex) {
            if (!dbCallNull) {
                debugMsg("NULL returned from DB. DB Object not created yet.");
            }
            return;
        }

        jsonObject.endArray().endObject();
        if (webSocket == null) {
            sendToAll(jsonObject.toString());
        } else {
            webSocket.send(jsonObject.toString());
        }
       
    }

    /**
     * Performs a query of the DataStore to return a list of values from multiple keys.
     *
     * @param webSocket The IWebsocketClient which requested the data.
     * @param id        The unique ID which is sent back to the IWebsocketClient.
     * @param table     Table name to query.
     * @param jsonArray JSON array object that holds a list of keys to query against the table with.
     */
    private void doDBKeysListQuery(IWebsocketClient webSocket, String id, JSONArray jsonArray) {
        JSONStringer jsonObject = new JSONStringer();

        if (jsonArray.length() == 0) {
            return;
        }

        jsonObject.object().key("query_id").value(id).key("results").array();

        try {
            for (int i = 0; i < jsonArray.length(); i++) {
                if (jsonArray.getJSONObject(i).has("table")) {
                    String table = jsonArray.getJSONObject(i).getString("table");
                    String[] dbKeys = PhantomBot.instance().getDataStore().GetKeyList(table, "");
                    for (String dbKey : dbKeys) {
                        String value = PhantomBot.instance().getDataStore().GetString(table, "", dbKey);
                        jsonObject.object().key("table").value(table).key("key").value(dbKey).key("value").value(value).endObject();
                    }
                }
            }
        } catch (NullPointerException ex) {
            if (!dbCallNull) {
                debugMsg("NULL returned from DB. DB Object not created yet.");
            }
            return;
        }

        jsonObject.endArray().endObject();
        webSocket.send(jsonObject.toString());
    }


    /**
     * Performs a query of the DataStore to return a list of values from multiple keys.
     *
     * @param webSocket The IWebsocketClient which requested the data.
     * @param id        The unique ID which is sent back to the IWebsocketClient.
     * @param table     Table name to query.
     * @param limit     Limit you want to get sent.
     * @param offset    the offset
     * @param order     ASC or DESC
     */
    private void doDBKeysByOrder(IWebsocketClient webSocket, String id, String table, String limit, String offset, String order) {
        JSONStringer jsonObject = new JSONStringer();

        jsonObject.object().key("query_id").value(id).key("results").array();

        try {
            String[] dbKeys = PhantomBot.instance().getDataStore().GetKeysByOrder(table, "", order, limit, offset);
            for (String dbKey : dbKeys) {
                String value = PhantomBot.instance().getDataStore().GetString(table, "", dbKey);
                jsonObject.object().key("table").value(table).key("key").value(dbKey).key("value").value(value).endObject();
            }
        } catch (NullPointerException ex) {
            if (!dbCallNull) {
                debugMsg("NULL returned from DB. DB Object not created yet.");
            }
            return;
        }

        jsonObject.endArray().endObject();
        if (webSocket == null) {
            sendToAll(jsonObject.toString());
        } else {
            webSocket.send(jsonObject.toString());
        }
    }

    /**
     * Performs a query of the DataStore to return a list of values from multiple keys.
     *
     * @param webSocket The IWebsocketClient which requested the data.
     * @param id        The unique ID which is sent back to the IWebsocketClient.
     * @param table     Table name to query.
     * @param key       key to search
     */
    private void doDBKeysSearch(IWebsocketClient webSocket, String id, String table, String key, String order, String limit, String offset) {
        JSONStringer jsonObject = new JSONStringer();

        jsonObject.object().key("query_id").value(id).key("results").array();

        try {
            String[] dbKeys = PhantomBot.instance().getDataStore().GetKeysByLikeKeysOrder(table, "", key, order, limit, offset);
            for (String dbKey : dbKeys) {
                String value = PhantomBot.instance().getDataStore().GetString(table, "", dbKey);
                jsonObject.object().key("table").value(table).key("key").value(dbKey).key("value").value(value).endObject();
            }
        } catch (NullPointerException ex) {
            if (!dbCallNull) {
                debugMsg("NULL returned from DB. DB Object not created yet.");
            }
            return;
        }

        jsonObject.endArray().endObject();
        if (webSocket == null) {
            sendToAll(jsonObject.toString());
        } else {
            webSocket.send(jsonObject.toString());
        }
    }

    /**
     * Performs an update of the DataStore.
     *
     * @param webSocket The IWebsocketClient which requested the data.
     * @param id        The unique ID which is sent back to the IWebsocketClient.
     * @param table     Table name to update.
     * @param key       The key to update.
     * @param value     The value to insert into the table related to the key.
     */
    private void doDBUpdate(IWebsocketClient webSocket, String id, String table, String key, String value) {
        JSONStringer jsonObject = new JSONStringer();
        try {
            PhantomBot.instance().getDataStore().set(table, key, value);
        } catch (NullPointerException ex) {
            if (!dbCallNull) {
                debugMsg("NULL returned from DB. DB Object not created yet.");
            }
            return;
        }

        jsonObject.object().key("query_id").value(id).endObject();
        webSocket.send(jsonObject.toString());
    }

    /**
     * Performs an update of the DataStore, incrementing a value.
     *
     * @param webSocket The IWebsocketClient which requested the data.
     * @param id        The unique ID which is sent back to the IWebsocketClient.
     * @param table     Table name to update.
     * @param key       The key to update.
     * @param value     The value to increment into the table related to the key.
     */
    private void doDBIncr(IWebsocketClient webSocket, String id, String table, String key, String value) {
        JSONStringer jsonObject = new JSONStringer();
        try {
            PhantomBot.instance().getDataStore().incr(table, key, Integer.parseInt(value));
        } catch (NullPointerException ex) {
            if (!dbCallNull) {
                debugMsg("NULL returned from DB. DB Object not created yet.");
            }
            return;
        }

        jsonObject.object().key("query_id").value(id).endObject();
        webSocket.send(jsonObject.toString());
    }

    /**
     * Performs an update of the DataStore, decrementing a value.
     *
     * @param webSocket The IWebsocketClient which requested the data.
     * @param id        The unique ID which is sent back to the IWebsocketClient.
     * @param table     Table name to update.
     * @param key       The key to update.
     * @param value     The value to decrement into the table related to the key.
     */
    private void doDBDecr(IWebsocketClient webSocket, String id, String table, String key, String value) {
        JSONStringer jsonObject = new JSONStringer();
        try {
            PhantomBot.instance().getDataStore().decr(table, key, Integer.parseInt(value));
        } catch (NullPointerException ex) {
            if (!dbCallNull) {
                debugMsg("NULL returned from DB. DB Object not created yet.");
            }
            return;
        }
        jsonObject.object().key("query_id").value(id).endObject();
        webSocket.send(jsonObject.toString());
    }

    /**
     * Performs a delete operation in the DataStore.
     *
     * @param webSocket The IWebsocketClient which requested the data.
     * @param id        The unique ID which is sent back to the IWebsocketClient.
     * @param table     Table name to update.
     * @param key       The key to delete.
     */
    private void doDBDelKey(IWebsocketClient webSocket, String id, String table, String key) {
        JSONStringer jsonObject = new JSONStringer();
        try {
            PhantomBot.instance().getDataStore().del(table, key);
        } catch (NullPointerException ex) {
            if (!dbCallNull) {
                debugMsg("NULL returned from DB. DB Object not created yet.");
            }
            return;
        }
        jsonObject.object().key("query_id").value(id).endObject();
        webSocket.send(jsonObject.toString());
    }

    /**
     * Performs a trigger in the Audio Panel, requesting an audio clip to be played.
     *
     * @param audioHook The name of the audio clip to play.
     */
    public void triggerAudioPanel(String audioHook) {
        JSONStringer jsonObject = new JSONStringer();
        jsonObject.object().key("audio_panel_hook").value(audioHook).endObject();
        debugMsg("triggerAudioPanel(" + audioHook + ")");
        sendToAll(jsonObject.toString());
    }

    /**
     * Peforms a forced query of the audio_hooks table to update audio hooks.
     */
    public void doAudioHooksUpdate() {
        doDBKeysQuery(null, "audio_hook_reload", "audio_hooks");
    }

    /**
     * Performs a trigger in the Alert Application, resulting in an image to be displayed
     * (and possibly audio to play).
     *
     * @param imageInfo The information relating to the image to display.
     */
    public void alertImage(String imageInfo) {
        JSONStringer jsonObject = new JSONStringer();
        jsonObject.object().key("alert_image").value(imageInfo).endObject();
        debugMsg("alertImage(" + imageInfo +")");
        sendToAll(jsonObject.toString());
    }

    /**
     * Executes an event directly.
     *
     * @param webSocket The websocket related to this call.
     * @param id        The event ID to be sent.
     * @param script    The script in which to execute the event.
     * @param arguments Any arguments that are needed for the event.
     * @param jsonArray Arguments provided in a JSONArray to be parsed out and processed.
     */
    private void doWSEvent(IWebsocketClient webSocket, String id, String script, String arguments, JSONArray jsonArray) {
        JSONStringer jsonObject = new JSONStringer();
        List<String> tempArgs = new LinkedList<>();
        String[] args = null;

        for (Object str : jsonArray) {
            tempArgs.add(str.toString());
        }

        if (tempArgs.size() > 0) {
            int i = 0;
            args = new String[tempArgs.size()];

            for (String str : tempArgs) {
                args[i] = str;
                ++i;
            }
        }

        EventBus.instance().postAsync(new WebPanelSocketUpdateEvent(id, script, arguments, args));
        debugMsg("doWSEvent(" + id + "::" + script + ")");

        jsonObject.object().key("query_id").value(id).endObject();
        webSocket.send(jsonObject.toString());
    }

    /**
     * Wrapper for the Console debug message.
     *
     * @param message Message to display.
     */
    private void debugMsg(String message) {
        com.gmt2001.Console.debug.println("NewPanelSocketServer: " + message);
    }

    /**
     * Generates a new session key for a IWebsocketClient connection.
     *
     * @param webSocket The IWebsocketClient connection to generate a session key for.
     * @return          Newly generated session key.
     */
    private static String genSessionKey(IWebsocketClient webSocket) {
        return new String(Integer.toString(webSocket.getRemoteSocketAddress().hashCode()));
    }

    /**
     * Authenticate via OAUTH information.
     *
     * @param  oauth   OAUTH to use to identify and authenticate a user.
     * @return         Indicates if authentication was successful.
     */
    private Boolean authenticateOauth(String oauth) {
        String value;
        String authUsername = TwitchAPIv5.instance().GetUserFromOauth(oauth);

        if (authUsername == null) {
            return false;
        }

        // TODO: This will be migrated into a file for management, for right now, this is in the
        //        database for testing purposes.
        try {
            value = PhantomBot.instance().getDataStore().GetString("ws_test_auth", "", authUsername);
        } catch (NullPointerException ex) {
            if (!dbCallNull) {
                dbCallNull = true;
                debugMsg("NULL returned from DB. DB Object not created yet.");
            }
            return false;
        }

        if (value == null) {
            return false;
        }
        if (value.equals(authUsername)) {
            return true;
        }
        
        return false;
    }

    /**
     * Stores Session data for the various open IWebsocketClient objects.
     */
    private class wsSession {
        Boolean authenticated;
        Boolean readonly;
        IWebsocketClient webSocket;

        /**
         * Constructor for wsSession class.
         *
         * @param authenticated Indicates if the session is authenticated.
         * @param readonly      Indicates if this is a read-only session.
         * @param webSocket     The IWebsocketClient object that this session relates to.
         */
        public wsSession(Boolean authenticated, Boolean readonly, IWebsocketClient webSocket) {
            this.authenticated = authenticated;
            this.readonly = readonly;
            this.webSocket = webSocket;
        }

        /**
         * Sets the authenticated value after the object is constructed.
         *
         * @param authenticated Indicates if the session is authenticated.
         */
        public void setAuthenticated(Boolean authenticated) {
            this.authenticated = authenticated;
        }

        /**
         * Indicates if this session is authenticated.
         *
         * @return Authentication status of the session.
         */
        public Boolean isAuthenticated() {
            return authenticated;
        }

        /**
         * Sets the readonly value after the object is constructed.
         *
         * @param readonly Indicates if the session is read-only.
         */
        public void setReadOnly(Boolean readonly) {
            this.readonly = readonly;
        }

        /**
         * Indicates if this session is readonly.
         *
         * @return Readonly status of the session.
         */
        public Boolean isReadOnly() {
            return readonly;
        }

        /**
         * Sets the IWebsocketClient object after the object is constructed.
         *
         * @param webSocket New IWebsocketClient object to associate to this session.
         */
        public void setIWebsocketClient(IWebsocketClient webSocket) {
            this.webSocket = webSocket;
        }

        /**
         * Gets the IWebsocketClient object that is associated to the session.
         *
         * @return IWebsocketClient object associated with session.
         */
        public IWebsocketClient getIWebsocketClient() {
            return webSocket;
        }
    }

    /**
     * Helper class responsible for spawning threads for handling input from a IWebsocketClient.
     */
    private class MessageRunnable implements Runnable {
        private IWebsocketClient webSocket;
        private String jsonString;

        /**
         * Constructor which sets the values on the object.
         *
         * @param webSocket  The IWebsocketClient object which provided data.
         * @param jsonString The data sent over the IWebsocketClient object.
         */
        public MessageRunnable(IWebsocketClient webSocket, String jsonString) {
            this.webSocket = webSocket;
            this.jsonString = jsonString;
        }

        /**
         * Execute the parser to handle the input data from the IWebsocketClient.
         */
        public void run() {
            handleMessage(webSocket, jsonString);
        }
    }
}
