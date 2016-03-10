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

/* Websocket accepts the following JSON data from the Player Interface
 *
 * // Tell the bot the current state of the player.
 * // Values are: NEW(-2), UNSTARTED(-1), ENDED(0), PLAYING(1), PAUSED(2), BUFFERING(3), CUED(5), KEEPALIVE(200)
 * { "status" : { "state" : integer value } }
 *
 * // Tell the bot if the player is ready or not
 * { "status" : { "ready" : true | false } }
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
 *
 * // Delete requested song
 * { "deletesr" : "YouTube ID" }
 *
 * -------------------------------------------------------------------------------------------------------------
 *
 * Websocket pushes the following to the Player Interface
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

package me.mast3rplan.phantombot.ytplayer;

import java.io.IOException;
import java.io.File;
import java.io.BufferedWriter;
import java.io.FileWriter;
import java.io.BufferedReader;
import java.io.FileReader;
import java.net.InetSocketAddress;
import java.util.Collection;
import java.util.regex.Pattern;
import me.mast3rplan.phantombot.event.EventBus;
import me.mast3rplan.phantombot.event.ytplayer.*;
import org.java_websocket.WebSocket;
import org.java_websocket.handshake.ClientHandshake;
import org.java_websocket.server.WebSocketServer;
import org.json.JSONArray;
import org.json.JSONObject;
import org.json.JSONException;
import org.json.JSONStringer;


public class YTWebSocketServer extends WebSocketServer {

    private int currentVolume = 0;
    private int currentState = -10;

    public YTWebSocketServer(int port) {
        super(new InetSocketAddress(port));

        Thread.setDefaultUncaughtExceptionHandler(com.gmt2001.UncaughtExceptionHandler.instance());
    }

    @Override
    public void onOpen(WebSocket webSocket, ClientHandshake clientHandshake) {
        EventBus.instance().postAsync(new YTPlayerConnectEvent());
    }

    @Override
    public void onClose(WebSocket webSocket, int i, String s, boolean b) {
        EventBus.instance().postAsync(new YTPlayerDisconnectEvent());
    }

    @Override
    public void onMessage(WebSocket webSocket, String jsonString) {
        YTPlayerState    playerState;
        JSONObject       jsonObject;
        JSONObject       jsonStatus;
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

        if (jsonObject.has("status")) {
            jsonStatus = jsonObject.getJSONObject("status");
            if (jsonStatus.has("state")) {
                dataInt = jsonStatus.getInt("state");
                currentState = (dataInt == 200 ? currentState : dataInt);
                playerState = YTPlayerState.getStateFromId(dataInt);
                EventBus.instance().postAsync(new YTPlayerStateEvent(playerState));
            } else if (jsonStatus.has("ready")) {
                currentState = -2;
                EventBus.instance().postAsync(new YTPlayerStateEvent(YTPlayerState.NEW));
            } else if (jsonStatus.has("currentid")) {
                dataString = jsonStatus.getString("currentid");
                EventBus.instance().postAsync(new YTPlayerCurrentIdEvent(dataString));
            } else if (jsonStatus.has("volume")) {
                dataInt = jsonStatus.getInt("volume");
                currentVolume = dataInt;
                EventBus.instance().postAsync(new YTPlayerVolumeEvent(dataInt));
            } else {
                com.gmt2001.Console.err.println("YTWebSocketServer: Bad ['status'] request passed ["+jsonString+"]");
                return;
            }
        } else if (jsonObject.has("query")) {
            if (jsonObject.getString("query").equals("songlist")) {
                EventBus.instance().postAsync(new YTPlayerRequestSonglistEvent());
            } else if (jsonObject.getString("query").equals("playlist")) {
                EventBus.instance().postAsync(new YTPlayerRequestPlaylistEvent());
            } else {
                com.gmt2001.Console.err.println("YTWebSocketServer: Bad ['query'] request passed ["+jsonString+"]");
                return;
            }
        } else if (jsonObject.has("deletesr")) {
            dataString = jsonObject.getString("deletesr");
            EventBus.instance().postAsync(new YTPlayerDeleteSREvent(dataString));
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
        } catch (IOException | InterruptedException ex) {
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
        throw new UnsupportedOperationException("Not supported yet.");
    }

    public void onWebsocketCloseInitiated(WebSocket ws, int code, String reason) {
        throw new UnsupportedOperationException("Not supported yet.");
    }

    public InetSocketAddress getLocalSocketAddress(WebSocket conn) {
        throw new UnsupportedOperationException("Not supported yet.");
    }

    public InetSocketAddress getRemoteSocketAddress(WebSocket conn) {
        throw new UnsupportedOperationException("Not supported yet.");
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
}
