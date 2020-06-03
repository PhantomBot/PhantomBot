/*
 * Copyright (C) 2016-2018 phantombot.tv
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

/* Websocket accepts the following JSON data from the Player Interface
 *
 * // Authenticate
 * { "authenticate : "authentication_key" }
 *
 * // Tell the bot the current state of the player.
 * // Values are: NEW(-2), UNSTARTED(-1), ENDED(0), PLAYING(1), PAUSED(2), BUFFERING(3), CUED(5), KEEPALIVE(200)
 * { "status" : { "state" : integer value } }
 *
 * // Tell the bot if the player is ready or not
 * { "status" : { "ready" : true | false } }
 *
 * // Tell the bot if the player is ready or not and force a pause
 * { "status" : { "readypause" : true | false } }
 *
 * // Tell the bot the current song being played; from { "command" : "querysong" }
 * { "status" : { "currentid" : "YouTube ID" } }
 *
 * // Tell the bot the current volume setting of the player.
 * { "status" : { "volume" : integer value } }
 *
 * // Ask the bot for the current list of requested songs (songlist) or songs from the playlist (playlist).
 * { "query" : "songlist" }
 * { "query" : "playlist" }
 * { "query" : "currentsong" }
 *
 * // Delete requested song
 * { "deletesr" : "YouTube ID" }
 *
 * // Delete song from current playlist
 * { "deletepl" : "YouTube ID" }
 *
 * // Skip a song
 * { "command" : "skipsong" }
 *
 * // Steal a song
 * { "command" : "stealsong", "youTubeID" : "YouTube ID" }  // youTubeID is optional
 *
 * // Add a song request
 * { "command" : "songrequest", "search" : "search string" }
 *
 * // Toggle playlist randomizer
 * { "command" : "togglerandom" }
 *
 * -------------------------------------------------------------------------------------------------------------
 *
 * Websocket pushes the following to the Player Interface
 *
 * // Return authorization result.
 * { "authresult" : true/false }
 *
 * // Connection already opened for Player.
 * { "secondconnection" : true/false }
 *
 * // Instruct the Interface to play a song.
 * { "command" : { "play" : "YouTube ID", "duration" : "mm:ss", "title" : "Song Title", "requester" : "Username" } }
 *
 * // Instruct the Interface to pause.
 * { "command" : "pause" }
 *
 * // Instruct the Interface to change the volume.
 * { "command" : { "setvolume" : 1-100 } }
 *
 * // Instruct the Interface to return a JSON object describing the current song playing.
 * { "command" : "querysong" }
 *
 * // Provides the Interface with the current songlist from the bot.
 * { "songlist" : [ { "song" : "YouTube ID", "duration" : "mm:ss", "title" : "Song Title", "requester" : "Username" } ] }
 * { "playlistname" : "name", "playlist" : [ { "song" : "YouTube ID", "duration" : "mm:ss", "title" : "Song Title" } ] }
 */

/*
 * @author: IllusionaryOne
 */

package tv.phantombot.ytplayer;

import java.io.IOException;
import java.io.File;
import java.io.BufferedWriter;
import java.io.FileWriter;
import java.io.BufferedReader;
import java.io.FileReader;
import java.net.InetSocketAddress;
import java.net.InetAddress;
import java.util.Collection;
import java.util.regex.Pattern;
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

import tv.phantombot.PhantomBot;
import tv.phantombot.event.EventBus;
import tv.phantombot.event.ytplayer.*;
import tv.phantombot.event.command.CommandEvent;

public class YTWebSocketServer extends WebSocketServer {

    private String authString;
    private String authStringRO;
    private int currentVolume = 0;
    private int currentState = -10;
    private boolean clientConnected = false;
    private int bufferCounter = 0;

    private Map<String, wsSession> wsSessionMap = Maps.newHashMap();

    public YTWebSocketServer(String ip, int port, String authString, String authStringRO) throws Exception {
        super((!ip.isEmpty() ? new InetSocketAddress(ip, port) : new InetSocketAddress(port)));
        this.authString = authString;
        this.authStringRO = authStringRO;

        Thread.setDefaultUncaughtExceptionHandler(com.gmt2001.UncaughtExceptionHandler.instance());
    }

    @Override
    public void onOpen(WebSocket webSocket, ClientHandshake clientHandshake) {
        wsSessionMap.put(genSessionKey(webSocket), new wsSession(false, false, webSocket));
    }



    @Override
    public void onClose(WebSocket webSocket, int i, String s, boolean b) {
        wsSession sessionData;

        sessionData = wsSessionMap.get(genSessionKey(webSocket));
        if (sessionData.isPlayer()) {
            EventBus.instance().postAsync(new YTPlayerDisconnectEvent());
        }
        wsSessionMap.remove(genSessionKey(webSocket));
    }

    @Override
    public void onMessage(WebSocket webSocket, String jsonString) {
        YTPlayerState    playerState;
        JSONObject       jsonObject;
        JSONObject       jsonStatus;
        wsSession        sessionData;
        Boolean          authenticated;
        String           dataString;
        int              dataInt;

        //com.gmt2001.Console.out.println("YTWebSocketServer::onMessage("+jsonString+")");

        try {
            jsonObject = new JSONObject(jsonString);
        } catch (JSONException ex) {
            com.gmt2001.Console.err.println("YTWebSocketServer: Bad JSON passed ["+jsonString+"]");
            com.gmt2001.Console.err.printStackTrace(ex);
            return;
        } catch (Exception ex) {
            com.gmt2001.Console.err.println("YTWebSocketServer: Exception Occurred");
            com.gmt2001.Console.err.printStackTrace(ex);
            return;
        }
        sessionData = wsSessionMap.get(genSessionKey(webSocket));
 
        if (jsonObject.has("authenticate")) {
            if (clientConnected) {
                com.gmt2001.Console.err.println("YTWebSocketServer: Rejecting additional player connection.");
                secondConnectionResult(webSocket);
                sessionData.setPlayer(false);
                webSocket.close();
                return;
            }

            authenticated = jsonObject.getString("authenticate").equals(authString);

            sessionData.setAuthenticated(authenticated);
            sessionData.setPlayer(true);
            authResult(authenticated, webSocket);
            if (authenticated) {
                if (!checkYouTubeKey(webSocket)) {
                    EventBus.instance().postAsync(new YTPlayerConnectEvent());
                }
            }

            return;
        }

        if (jsonObject.has("readauth")) {
            authenticated = jsonObject.getString("readauth").equals(authStringRO);
            sessionData.setAuthenticated(authenticated);
            sessionData.setPlayer(false);
            authResult(authenticated, webSocket);
            return;
        }

        if (!sessionData.isAuthenticated()) {
            authResult(false, webSocket);
            return;
        }

        if (!clientConnected && !sessionData.isPlayer()) {
            return;
        }

        if (jsonObject.has("status") && sessionData.isPlayer()) {
            jsonStatus = jsonObject.getJSONObject("status");
            if (jsonStatus.has("state")) {
                dataInt = jsonStatus.getInt("state");
                /* If the current status is buffering and then we receive an unstarted event, then the player
                 * is stuck. This normally happens with videos that are not allowed to play in the region
                 * and are not returned as such by the API lookup. Skip the song.  But, only skip the song if
                 * we get back the buffering state a few times.
                 */
                if (currentState == 3 && dataInt == -1) {
                    currentState = dataInt;
                    playerState = YTPlayerState.getStateFromId(dataInt);
                    if (bufferCounter++ == 3) {
                        EventBus.instance().postAsync(new YTPlayerSkipSongEvent());
                        bufferCounter = 0;
                    }
                } else {
                    bufferCounter = 0;
                    currentState = (dataInt == 200 ? currentState : dataInt);
                    playerState = YTPlayerState.getStateFromId(dataInt);
                    EventBus.instance().postAsync(new YTPlayerStateEvent(playerState));
                }
            } else if (jsonStatus.has("ready")) {
                currentState = -2;
                EventBus.instance().postAsync(new YTPlayerStateEvent(YTPlayerState.NEW));
            } else if (jsonStatus.has("readypause")) {
                currentState = -3;
                EventBus.instance().postAsync(new YTPlayerStateEvent(YTPlayerState.NEWPAUSE));
            } else if (jsonStatus.has("currentid")) {
                dataString = jsonStatus.getString("currentid");
                EventBus.instance().postAsync(new YTPlayerCurrentIdEvent(dataString));
            } else if (jsonStatus.has("volume")) {
                dataInt = jsonStatus.getInt("volume");
                currentVolume = dataInt;
                EventBus.instance().postAsync(new YTPlayerVolumeEvent(dataInt));
            } else if (jsonStatus.has("errorcode")) {
                dataInt = jsonStatus.getInt("errorcode");
                com.gmt2001.Console.err.println("Skipping song, YouTube has thrown an error: " + dataInt);
                EventBus.instance().postAsync(new YTPlayerSkipSongEvent());
            } else {
                com.gmt2001.Console.err.println("YTWebSocketServer: Bad ['status'] request passed ["+jsonString+"]");
                return;
            }
        } else if (jsonObject.has("query")) {
            if (jsonObject.getString("query").equals("songlist")) {
                EventBus.instance().postAsync(new YTPlayerRequestSonglistEvent());
            } else if (jsonObject.getString("query").equals("playlist")) {
                EventBus.instance().postAsync(new YTPlayerRequestPlaylistEvent());
            } else if (jsonObject.getString("query").equals("currentsong")) {
                EventBus.instance().postAsync(new YTPlayerRequestCurrentSongEvent());
            } else if (jsonObject.getString("query").equals("songrequesthistory")) {
                EventBus.instance().postAsync(new YTPlayerRequestSongHistoryEvent());
            } else {
                com.gmt2001.Console.err.println("YTWebSocketServer: Bad ['query'] request passed ["+jsonString+"]");
                return;
            }
        } else if (jsonObject.has("dbquery")) {
            handleDBQuery(webSocket, jsonObject.getString("query_id"), jsonObject.getString("table"));
        } else if (jsonObject.has("dbupdate")) {
            handleDBUpdate(webSocket, jsonObject.getString("query_id"), jsonObject.getJSONObject("update").getString("table"), jsonObject.getJSONObject("update").getString("key"), jsonObject.getJSONObject("update").getString("value"));
        } else if (jsonObject.has("deletesr") && sessionData.isPlayer()) {
            dataString = jsonObject.getString("deletesr");
            EventBus.instance().postAsync(new YTPlayerDeleteSREvent(dataString));
        } else if (jsonObject.has("deletepl") && sessionData.isPlayer()) {
            dataString = jsonObject.getString("deletepl");
            EventBus.instance().postAsync(new YTPlayerDeletePlaylistByIDEvent(dataString));
        } else if (jsonObject.has("command") && sessionData.isPlayer()) {
            if (jsonObject.getString("command").equals("togglerandom")) {
                EventBus.instance().postAsync(new YTPlayerRandomizeEvent());
            } else if (jsonObject.getString("command").equals("toggleshuffle")) {
                EventBus.instance().postAsync(new YTPlayerRandomizeEvent());
            } else if (jsonObject.getString("command").equals("skipsong")) {
                EventBus.instance().postAsync(new YTPlayerSkipSongEvent());
            } else if (jsonObject.getString("command").equals("stealsong")) {
                if (jsonObject.has("youTubeID")) {
                    EventBus.instance().postAsync(new YTPlayerStealSongEvent(jsonObject.getString("youTubeID"), jsonObject.getString("requester")));
                } else {
                    EventBus.instance().postAsync(new YTPlayerStealSongEvent());
                }
            } else if (jsonObject.getString("command").equals("songrequest")) {
                if (jsonObject.has("search")) {
                    dataString = jsonObject.getString("search");
                    EventBus.instance().postAsync(new YTPlayerSongRequestEvent(dataString));
                }
            } else if (jsonObject.getString("command").equals("loadpl")) {
                EventBus.instance().postAsync(new YTPlayerLoadPlaylistEvent(jsonObject.getString("playlist")));
            } else if (jsonObject.getString("command").equals("deletecurrent")) {
                EventBus.instance().postAsync(new YTPlayerDeleteCurrentEvent());
            } else {
                com.gmt2001.Console.err.println("YTWebSocketServer: Bad ['command'] request passed ["+jsonString+"]");
                return;
            }
        } else {
            com.gmt2001.Console.err.println("YTWebSocketServer: Unknown JSON passed ["+jsonString+"]");
            return;
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

    public void sendToAll(String text) {
        Collection<WebSocket> con = connections();
        synchronized (con) {
            for (WebSocket c : con) {
                c.send(text);
            }
        }
    }

    public void onWebsocketClosing(WebSocket ws, int code, String reason, boolean remote) {
    }

    public void onWebsocketCloseInitiated(WebSocket ws, int code, String reason) {
    }

    /**
     * Method that queries the DB.
     * @param webSocket
     * @param id
     * @param table
     */
    public void handleDBQuery(WebSocket webSocket, String id, String table) {
        JSONStringer jsonObject = new JSONStringer();

        jsonObject.object().key("query_id").value(id);

        try {
            String[] dbKeys = PhantomBot.instance().getDataStore().GetKeyList(table, "");
            for (String dbKey : dbKeys) {
                String value = PhantomBot.instance().getDataStore().GetString(table, "", dbKey);
                jsonObject.key(dbKey).value(value);
            }
        } catch (NullPointerException ex) {
            com.gmt2001.Console.debug.println("NULL returned from DB. DB Object not created yet.");
            return;
        }
        jsonObject.endObject();
        webSocket.send(jsonObject.toString());
    }

    //Method that updates the db.
    public void handleDBUpdate(WebSocket webSocket, String id, String table, String key, String value) {
        JSONStringer jsonObject = new JSONStringer();
        try {
            PhantomBot.instance().getDataStore().set(table, key, value);
        } catch (NullPointerException ex) {
            com.gmt2001.Console.debug.println("NULL returned from DB. DB Object not created yet.");
            return;
        }

        EventBus.instance().post(new CommandEvent(PhantomBot.instance().getBotName(), "reloadyt", ""));
        jsonObject.object().key("query_id").value(id).endObject();
        webSocket.send(jsonObject.toString());
    }

    // Methods for the Bot JS player to call.
    //
    public void play(String youtubeID, String songTitle, String duration, String requester) {
        JSONStringer jsonObject = new JSONStringer();

        jsonObject.object();
        jsonObject.key("command");
        jsonObject.object();
        jsonObject.key("play").value(youtubeID);
        jsonObject.key("duration").value(duration);
        jsonObject.key("title").value(songTitle);
        jsonObject.key("requester").value(requester);
        jsonObject.endObject();
        jsonObject.endObject();
        sendToAll(jsonObject.toString());
    }

    public void pause() {
        JSONStringer jsonObject = new JSONStringer();
        sendToAll(jsonObject.object().key("command").value("pause").endObject().toString());
    }

    public void currentId() {
        JSONStringer jsonObject = new JSONStringer();
        sendToAll(jsonObject.object().key("command").value("querysong").toString());
    }

    public void setVolume(int volume) {
        JSONStringer jsonObject = new JSONStringer();
        if (!(volume > 100 || volume < 0)) {
            currentVolume = volume;
            sendToAll(jsonObject.object().key("command").object().key("setvolume").value(volume).endObject().endObject().toString());
        }
    }

    public void authResult(Boolean authenticated, WebSocket webSocket) {
        JSONStringer jsonObject = new JSONStringer();
        webSocket.send(jsonObject.object().key("authresult").value(authenticated).endObject().toString());
    }

    private void secondConnectionResult(WebSocket webSocket) {
        JSONStringer jsonObject = new JSONStringer();
        webSocket.send(jsonObject.object().key("secondconnection").value(true).endObject().toString());
    }

    public int getVolume() {
        return currentVolume;
    }

    public int getPlayerState() {
        return currentState;
    }

    public void songList(String jsonString) {
        sendToAll(jsonString);
    }

    public void playList(String jsonString) {
        sendToAll(jsonString);
    }

    public void currentSong(String jsonString) {
        sendToAll(jsonString);
    }
    
    public void songRequestHistory(String jsonString) {
        sendToAll(jsonString);
    }
    
    public void queueStatus(String jsonString) {
        sendToAll(jsonString);
    }

    private static String genSessionKey(WebSocket webSocket) {
        return new String(Integer.toString(webSocket.getRemoteSocketAddress().hashCode()));
    }

    public void setClientConnected(boolean clientConnected) {
        this.clientConnected = clientConnected;
    }

    private boolean checkYouTubeKey(WebSocket webSocket) {
        JSONStringer jsonObject = new JSONStringer();
        webSocket.send(jsonObject.object().key("ytkeycheck").value(!PhantomBot.instance().isYouTubeKeyEmpty()).endObject().toString());

        if (PhantomBot.instance().isYouTubeKeyEmpty()) {
            com.gmt2001.Console.err.println("A YouTube API key has not been configured. Please review the instructions on the " +
                                            "PhantomBot Community Forum at: https://community.phantombot.tv/t/acquire-youtube-api-key/222");
        }
        return PhantomBot.instance().isYouTubeKeyEmpty();
    }

    // Class for storing Session data.
    private class wsSession {
        Boolean authenticated;
        Boolean player;
        WebSocket webSocket;

        public wsSession(Boolean authenticated, Boolean player, WebSocket webSocket) {
            this.authenticated = authenticated;
            this.player = player;
            this.webSocket = webSocket;
        }

        public void setAuthenticated(Boolean authenticated) {
            this.authenticated = authenticated;
        }
        public Boolean isAuthenticated() {
            return authenticated;
        }

        public void setPlayer(Boolean player) {
            this.player = player;
        }
        public Boolean isPlayer() {
            return player;
        }

        public void setWebSocket(WebSocket webSocket) {
            this.webSocket = webSocket;
        }
        public WebSocket getWebSocket() {
            return webSocket;
        }
    }


}
