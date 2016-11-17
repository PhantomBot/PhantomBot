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

/*
 * Twitch WS-IRC Host Client
 * @author: illusionaryone
 */
package me.mast3rplan.phantombot.twitchwsirc;

import me.mast3rplan.phantombot.cache.ChannelHostCache;
import me.mast3rplan.phantombot.event.EventBus;
import me.mast3rplan.phantombot.event.twitch.host.TwitchHostedEvent;
import me.mast3rplan.phantombot.event.twitch.host.TwitchAutoHostedEvent;
import me.mast3rplan.phantombot.event.twitch.host.TwitchHostsInitializedEvent;

import com.google.common.collect.Maps;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.net.URI;
import java.nio.ByteBuffer;
import java.util.HashMap;
import java.util.Map;
import java.util.Map.Entry;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import javax.net.ssl.KeyManagerFactory;
import javax.net.ssl.SSLContext;
import javax.net.ssl.SSLSocketFactory;
import javax.net.ssl.TrustManagerFactory;

import org.java_websocket.WebSocket;
import org.java_websocket.WebSocketImpl;
import org.java_websocket.drafts.Draft;
import org.java_websocket.drafts.Draft_17;
import org.java_websocket.client.WebSocketClient;
import org.java_websocket.handshake.ServerHandshake;


public class TwitchWSHostIRC extends WebSocketClient {

    private static final Map<String, TwitchWSHostIRC> instances = Maps.newHashMap();
    private boolean badOauth = false;
    private boolean connected = false;
    private final String channelName;
    private final String login;
    private final String oAuth;
    private final EventBus eventBus;
    private final URI uri;
    private Pattern hostPattern = Pattern.compile("PRIVMSG \\w+ :(\\w+) is now hosting you for up to (\\d+) viewers");
    private Pattern autoHostPattern = Pattern.compile("PRIVMSG \\w+ :(\\w+) is now auto hosting you for up to (\\d+) viewers");

    /*
     * Creates an instance for a channel.
     *
     * @param  channel  Name of Twitch Channel for which this instance is created.
     * @param  login    User ID to login with.
     * @param  oauth    OAuth key to use for authentication.
     */
    public static TwitchWSHostIRC instance(String channelName, String oAuth, EventBus eventBus) {
        URI uri = null;
        TwitchWSHostIRC instance = instances.get(channelName);
        if (instance == null) {
            try {
                uri = new URI("wss://irc-ws.chat.twitch.tv");
                instance = new TwitchWSHostIRC(uri, channelName, oAuth, eventBus);
                instances.put(channelName, instance);
            } catch (Exception ex) {
                com.gmt2001.Console.err.println("Unable to capture hosting information from TwitchWSHostIRC: " + ex.getMessage());
            }
            return instance;
        }
        return instance;
    }

    /*
     * Constructor for TwitchWSIRC object.
     *
     * @param  channel  Name of Twitch Channel for which this instance is created.
     * @param  oauth    OAuth key to use for authentication.
     */
    private TwitchWSHostIRC(URI uri, String channelName, String oAuth, EventBus eventBus) {
        super(uri, new Draft_17(), null, 5000);
        if (channelName.startsWith("#")) {
            channelName = channelName.substring(1);
        }

        this.channelName = channelName;
        this.login = channelName;
        this.oAuth = oAuth;
        this.eventBus = eventBus;
        this.uri = uri;

        try {
            SSLContext sslContext = SSLContext.getInstance("TLS");
            sslContext.init(null, null, null);
            SSLSocketFactory sslSocketFactory = sslContext.getSocketFactory();
            this.setSocket(sslSocketFactory.createSocket());
        } catch (Exception ex) {
            com.gmt2001.Console.err.println(ex.getMessage());
            return;
        }

        connectWSS(false);
    }

    /*
     * Exposes the connected status of the object.
     *
     * @return  boolean  Is connected
     */
    public boolean isConnected() {
        return connected;
    }

    /*
     * Connect via WSS. This provides a secure connection to Twitch.
     *
     * @param   boolean  true if reconnecting
     * @return  boolean  true on success and false on failure
     */
    public boolean connectWSS(boolean reconnect) {
        try {
            if (reconnect) {
                try {
                    Thread.sleep(10000);
                } catch (InterruptedException ex) {
                    // Do nothing, this just means the sleep was interrupted.
                }
                com.gmt2001.Console.out.println("Reconnecting to Twitch Host Data Feed");
            } 
            this.connect();
            return true;
        } catch (Exception ex) {
            com.gmt2001.Console.err.println(ex.getMessage());
            return false;
        }
    }
     
    /*
     * Callback for connection opening to WS-IRC.  Calls send() directly to login to Twitch
     * IRC rather than sendAddQueue().
     *
     * @param  ServerHandShake  Handshake data provided by WebSocketClient
     */
    @Override
    public void onOpen(ServerHandshake handshakedata) {
        this.send("PASS " + oAuth);
        this.send("NICK " + login);
    }

    /*
     * Callback for connection closed from WS-IRC.
     *
     * @param  int      Exit code
     * @param  String   Reason for the connection closing 
     * @param  boolean  Remote closed connection or local did
     */
    @Override
    public void onClose(int code, String reason, boolean remote) {
        if (!badOauth) {
            com.gmt2001.Console.out.println("Failed to connect to Twitch Host Data Feed, retrying connection in 10 seconds...");
            com.gmt2001.Console.debug.println("Code [" + code + "] Reason [" + reason + "] Remote Hangup [" + remote + "]");
            connectWSS(true);
        }
    }

    /*
     * Callback for incoming messages from WS-IRC.
     *
     * @param  String  Incoming message
     */
    @Override
    public void onMessage(String message) {
        if (message.startsWith("PING")) {
            sendPong();
            return;
        }

        if (message.contains("002 " + this.channelName + " :")) {
            connected = true;
            com.gmt2001.Console.out.println("Connected to Twitch Host Data Feed");
            eventBus.post(new TwitchHostsInitializedEvent());
            return;
        }

        if (message.contains("Error logging in") || message.contains("Login authentication failed") && badOauth == false) {
            com.gmt2001.Console.out.println("");
            com.gmt2001.Console.out.println("API OAuth not allowed to gather host data, suggest updating to support auto-host capture. Current method will be decommissioned in the near future.");
            com.gmt2001.Console.out.println("Please obtain new API OAuth at https://phantombot.tv/oauth");
            com.gmt2001.Console.out.println("");
            badOauth = true;
            return;
        }

        if (message.startsWith(":jtv!jtv@jtv.tmi.twitch.tv")) {
            Matcher matcher = hostPattern.matcher(message);
            if (matcher.find()) {
                eventBus.post(new TwitchHostedEvent(matcher.group(1), Integer.parseInt(matcher.group(2))));
                return;
            }
            matcher = autoHostPattern.matcher(message);
            if (matcher.find()) {
                eventBus.post(new TwitchAutoHostedEvent(matcher.group(1), Integer.parseInt(matcher.group(2))));
                return;
            }
            return;
        }
    }

    /*
     * Callback for errors from WebSockets. Do not log the
     * ArrayIndexOutOfBoundsException, this is tossed by the API.
     *
     * @param  Exception  Java Exception thrown from WebSockets API
     */
    public void onError(Exception ex) {
        if (!ex.toString().contains("ArrayIndexOutOfBoundsException")) {
            com.gmt2001.Console.debug.println("Twitch WS-IRC (Host Data) Exception: " + ex);
        }
    }

    /*
     * Sends a PONG response to Twitch in reply to PING.
     */
    private void sendPong() {
        this.send("PONG :tmi.twitch.tv");
    }
}

