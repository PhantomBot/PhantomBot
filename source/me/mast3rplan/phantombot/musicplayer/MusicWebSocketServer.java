/*
 * Copyright (C) 2016 phantombot.tv
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
package me.mast3rplan.phantombot.musicplayer;

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
import me.mast3rplan.phantombot.event.musicplayer.*;
import org.java_websocket.WebSocket;
import org.java_websocket.handshake.ClientHandshake;
import org.java_websocket.server.WebSocketServer;

public class MusicWebSocketServer extends WebSocketServer {

    public MusicWebSocketServer(int port) {
        super(new InetSocketAddress(port));

        Thread.setDefaultUncaughtExceptionHandler(com.gmt2001.UncaughtExceptionHandler.instance());
    }

    @Override
    public void onOpen(WebSocket webSocket, ClientHandshake clientHandshake) {
        EventBus.instance().postAsync(new MusicPlayerConnectEvent());
    }

    @Override
    public void onClose(WebSocket webSocket, int i, String s, boolean b) {
        EventBus.instance().postAsync(new MusicPlayerDisconnectEvent());
    }

    @Override
    public void onMessage(WebSocket webSocket, String s) {
        String[] m = s.split(Pattern.quote("|"));
        if (m[0].equals("state")) {
            MusicPlayerState mps = MusicPlayerState.getStateFromId(Integer.parseInt(m[1]));
            EventBus.instance().postAsync(new MusicPlayerStateEvent(mps));
        }
        if (m[0].equals("ready")) {
            EventBus.instance().postAsync(new MusicPlayerStateEvent(MusicPlayerState.NEW));
        }
        if (m[0].equals("currentid")) {
            EventBus.instance().postAsync(new MusicPlayerCurrentIdEvent(m[1]));
        }
        if (m[0].equals("currentvolume")) {
            EventBus.instance().postAsync(new MusicPlayerCurrentVolumeEvent(Double.parseDouble(m[1])));
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

    public void cueNext() {
        sendToAll("next");
    }

    public void cuePrevious() {
        sendToAll("previous");
    }

    public void play() {
        sendToAll("play");
    }

    public void pause() {
        sendToAll("pause");
    }

    public void add(String video) {
        sendToAll("add|" + video);
    }

    public void reload() {
        sendToAll("reload");
    }

    public void cue(String video) {
        sendToAll("cue|" + video);
    }

    public void currentId() {
        sendToAll("currentid");
    }

    public void eval(String code) {
        sendToAll("eval|" + code);
    }

    public void setVolume(int volume) {
        if (!(volume > 100 || volume < 0)) {
            sendToAll("setvolume|" + volume);
        }
    }

    public void currentVolume() {
        sendToAll("currentvolume");
    }

    public void stealSong(String songurl) {
        try {
            BufferedWriter out;
            File playlist;
            File stealsong;
            try (BufferedReader in = new BufferedReader(new FileReader("addons/youtubePlayer/playlist.txt")) //playlist reader
                    ) {
                out = new BufferedWriter(new FileWriter("addons/youtubePlayer/stealsong.txt", true)); //writes stolen songs read from playlist
                playlist = new File("addons/youtubePlayer/playlist.txt"); //make the playlist known
                stealsong = new File("addons/youtubePlayer/stealsong.txt"); //this is where the stolen playlist songs go
                String data;                                                                    //establish variable for playlist lines
                out.write("");                                                                  //write new blank file stealsong.txt
                while ((data = in.readLine()) != null) {                                        //read each playlist line
                    data = data.trim();                                                     // remove leading and trailing whitespace
                    if (!data.equals("")) {                                                 // don't write out blank lines that exist on playlist.txt
                        out.append(data);                                                    //write playlist data to stealsong
                        out.newLine();                                                      //append a blank line so our stolen song doesnt get put side by side
                    }
                }                                                                               //after line reading, and writing all data to stealsong.txt, exit the loop
                out.append(songurl);                                                //add our stolen song
            } //writes stolen songs read from playlist
            out.close();                                                        //close stealsong
            playlist.delete();                                                  //delete playlist
            stealsong.renameTo(playlist);                                       //rename stealsong to our new playlist

        } catch (IOException e) {
            com.gmt2001.Console.err.printStackTrace(e);
            sendToAll("Steal song failed due to playlist.txt not existing.");
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
}
