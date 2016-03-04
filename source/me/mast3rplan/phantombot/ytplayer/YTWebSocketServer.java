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


public class YTWebSocketServer extends WebSocketServer {

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
                playerState = YTPlayerState.getStateFromId(dataInt);
                EventBus.instance().postAsync(new YTPlayerStateEvent(playerState));
            } else if (jsonStatus.has("ready")) {
                EventBus.instance().postAsync(new YTPlayerStateEvent(YTPlayerState.NEW));
            } else if (jsonStatus.has("currentid")) {
                dataString = jsonStatus.getString("currentid");
                EventBus.instance().postAsync(new YTPlayerCurrentIdEvent(dataString));
            } else {
                com.gmt2001.Console.err.println("YTWebSocketServer: Bad ['status'] request passed ["+jsonString+"]");
                return;
            }
        } else if (jsonObject.has("query")) {
            if (jsonObject.getString("query").equals("songlist")) {
                EventBus.instance().postAsync(new YTPlayerRequestSonglistEvent());
            } else {
                com.gmt2001.Console.err.println("YTWebSocketServer: Bad ['query'] request passed ["+jsonString+"]");
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
    public void play(String youtubeID) {
        sendToAll("{ 'command' : 'play' : { 'song' : '" + youtubeID + "' } }");
    }

    public void pause() {
        sendToAll("{ 'command' : 'pause' }");
    }

    public void currentId() {
        sendToAll("{ 'command' : 'querysong' }");
    }

    public void setVolume(int volume) {
        if (!(volume > 100 || volume < 0)) {
            sendToAll("{ 'command' : 'setvolume' : { 'volume' : " + volume + "} }");
        }
    }

    // TODO: What should the Bot push here? Pre-built JSON? Array? CSV list?
    public void songList() {
    }

    // TODO: Implement this.
    public void stealSong(String songurl) {
    }
}
