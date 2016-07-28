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

/*
 * Twitch WS-IRC Client
 * @author: illusionaryone
 */
package me.mast3rplan.phantombot.twitchwsirc;

import me.mast3rplan.phantombot.twitchwsirc.TwitchWSIRCParser;
import me.mast3rplan.phantombot.event.irc.complete.IrcConnectCompleteEvent;
import me.mast3rplan.phantombot.event.EventBus;

import com.google.common.collect.Maps;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.net.URI;
import java.nio.ByteBuffer;
import java.util.HashMap;
import java.util.Map;
import java.util.Map.Entry;

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


public class TwitchWSIRC extends WebSocketClient {

    private static final Map<String, TwitchWSIRC> instances = Maps.newHashMap();
    private final String channelName;
    private final String login;
    private final String oAuth;
    private final URI uri;
    private TwitchWSIRCParser ircParser;
    private EventBus eventBus;
    private Session session;
    private Channel channel;

    /*
     * Creates an instance for a channel.
     *
     * @param  channel  Name of Twitch Channel for which this instance is created.
     * @param  login    User ID to login with.
     * @param  oauth    OAuth key to use for authentication.
     */
    public static TwitchWSIRC instance(URI uri, String channelName, String login, String oAuth, Channel channel, Session session, EventBus eventBus) {
        TwitchWSIRC instance = instances.get(channelName);
        if (instance == null) {
            instance = new TwitchWSIRC(uri, channelName, login, oAuth, channel, session, eventBus);
            instances.put(channelName, instance);
            return instance;
        }
        return instance;
    }

    /*
     * Constructor for TwitchWSIRC object.
     *
     * @param  channel  Name of Twitch Channel for which this instance is created.
     * @param  login    User ID to login with.
     * @param  oauth    OAuth key to use for authentication.
     */
    private TwitchWSIRC(URI uri, String channelName, String login, String oAuth, Channel channel, Session session, EventBus eventBus) {
        super(uri, new Draft_17(), null, 5000);
        if (channelName.startsWith("#")) {
            channelName = channelName.substring(1);
        }

        this.channelName = channelName;
        this.login = login;
        this.oAuth = oAuth;
        this.uri = uri;
        this.eventBus = eventBus;
        this.channel = channel;
        this.session = session;
    }

    /*
     * Connect via WSS. This provides a secure connection to Twitch.
     *
     * @return  boolean  true on success and false on failure
     */
    public boolean connectWSS() {
        try {
            com.gmt2001.Console.out.println("Connecting to " + this.login + "@" + this.uri.getHost() + " (SSL)");
            SSLContext sslContext = SSLContext.getInstance("TLS");
            sslContext.init(null, null, null);
            SSLSocketFactory sslSocketFactory = sslContext.getSocketFactory();
            this.setSocket(sslSocketFactory.createSocket());
            this.ircParser = new TwitchWSIRCParser(this.getConnection(), channelName, channel, session, eventBus);
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
        com.gmt2001.Console.out.println("Connected to " + this.login + "@" + this.uri.getHost() + " (SSL)");
        this.send("PASS " + oAuth);
        this.send("NICK " + login);
        eventBus.postAsync(new IrcConnectCompleteEvent(session));
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
        com.gmt2001.Console.out.println("Disconnected from irc-ws.chat.twitch.tv.");
        com.gmt2001.Console.debug.println("Code [" + code + "] Reason [" + reason + "] Remote Hangup [" + remote + "]");
        if (remote) {
            com.gmt2001.Console.out.println("Attempting to Reconnect to irc-ws.chat.twitch.tv...");
            connectWSS();
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
        }
        
        if (message.startsWith(":") || message.startsWith("@")) {
            ircParser.parseData(message);
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
            com.gmt2001.Console.err.println("Twitch WS-IRC Exception: " + ex);
        }
    }

    /*
     * Sends a PONG response to Twitch in reply to PING.
     */
    private void sendPong() {
        this.send("PONG :tmi.twitch.tv");
    }
}

