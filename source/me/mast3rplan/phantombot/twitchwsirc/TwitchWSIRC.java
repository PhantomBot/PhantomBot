/*
 * Copyright (C) 2017 phantombot.tv
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
import com.gmt2001.Logger;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.net.URI;
import java.nio.ByteBuffer;
import java.util.HashMap;
import java.util.Map;
import java.util.Map.Entry;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;

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
    private TwitchWSIRCParser twitchWSIRCParser;
    private EventBus eventBus;
    private Session session;
    private Channel channel;
    private long lastPing = 0L;
    private boolean sentPing = false;
    private boolean pingRequest = false;

    private int sendPingWaitTime = Integer.parseInt(System.getProperty("ircsendpingwait", "480000"));
    private int pingWaitTime = Integer.parseInt(System.getProperty("ircpingwait", "600000"));

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

        /* Lowest value for sendPingWaitTime is 3 minutes. This is based on research that shows that Azure Cloud Services
         * drop TCP connections without activity for 4 minutes.
         */
        if (this.sendPingWaitTime < 180000) {
            this.sendPingWaitTime = 180000;
        }

        /* Lowest value for pingWaitTime is 6 minutes. This is based on Twitch indicating that they will send a PING
         * around every 5 minutes.  This provides a minute of padding.
         */
        if (this.pingWaitTime < 360000) {
            this.pingWaitTime = 360000;
        }

        /* Force a spread of two minutes between sendPingWaitTime and pingWaitTime. */
        if (this.pingWaitTime - this.sendPingWaitTime <= 60000) {
            this.pingWaitTime = this.sendPingWaitTime + 120000;
        }
    }

    /*
     * Delete an instance of TwitchWSIRC.
     *
     * @param  channel Name of the Twitch Channel that relates to an instance to delete.
     */
    public void delete(String channelName) {
        if (instances.containsKey(channelName)) {
            instances.remove(channelName);
            this.close();
        }
    }
    public void delete() {
        if (instances.containsKey(this.channelName)) {
            instances.remove(this.channelName);
            this.close();
        }
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
                com.gmt2001.Console.out.println("Reconnecting to Twitch WS-IRC Server (SSL) [" + this.uri.getHost() + "]");
            } else {
                com.gmt2001.Console.out.println("Connecting to Twitch WS-IRC Server (SSL) [" + this.uri.getHost() + "]");
            }
            SSLContext sslContext = SSLContext.getInstance("TLS");
            sslContext.init(null, null, null);
            SSLSocketFactory sslSocketFactory = sslContext.getSocketFactory();
            this.setSocket(sslSocketFactory.createSocket());
            this.twitchWSIRCParser = new TwitchWSIRCParser(this.getConnection(), channelName, channel, session, eventBus);
            this.connect();
            return true;
        } catch (Exception ex) {
            com.gmt2001.Console.err.println(ex.getMessage());
            return false;
        }
    }
     
    /*
     * Callback for connection opening to WS-IRC.  Calls send() directly to login to Twitch
     * IRC rather than sendAddQueue().  We set the lastPing time here as while Twitch has not
     * sent the PING, we did at least connect to Twitch and we will use this as our baseline
     * before starting up the timer to check the ping time.
     *
     * @param  ServerHandShake  Handshake data provided by WebSocketClient
     */
    @Override
    public void onOpen(ServerHandshake handshakedata) {
        com.gmt2001.Console.out.println("Connected to " + this.login + "@" + this.uri.getHost() + " (SSL)");
        this.send("PASS " + oAuth);
        this.send("NICK " + login);
        eventBus.postAsync(new IrcConnectCompleteEvent(session));
        lastPing = System.currentTimeMillis();
        checkPingTime();

        // I read in a post on the twitch dev forum that some guy had to request a first ping for Twitch to start sending pings to him. Maybe this is why people always disconnect a lot?
        // This should not hurt anything, it will only be sent once since I added a check.
        if (!pingRequest) {
            this.send("PING :tmi.twitch.tv");
            pingRequest = true;
        }
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
        com.gmt2001.Console.out.println("Lost connection to Twitch WS-IRC. Reconnecting...");
        com.gmt2001.Console.debug.println("Code [" + code + "] Reason [" + reason + "] Remote Hangup [" + remote + "]");

        // Log the reason and code for future debugging.
        Logger.instance().log(Logger.LogType.Error, "[" + Logger.instance().logTimestamp() + "] [SOCKET] Code [" + code + "] Reason [" + reason + "] Remote Hangup [" + remote + "]");
        this.session.reconnect();
    }

    /*
     * Callback for incoming messages from WS-IRC.
     *
     * @param  String  Incoming message
     */
    @Override
    public void onMessage(String message) {
        if (message.startsWith("PING")) {
            com.gmt2001.Console.debug.println("Got a PING from Twitch");
            lastPing = System.currentTimeMillis();
            sentPing = false;
            sendPong();
            return;
        } else if (message.startsWith(":tmi.twitch.tv PONG")) {
            com.gmt2001.Console.debug.println("Got a PONG from Twitch");
            lastPing = System.currentTimeMillis();
            sentPing = false;
            return;
        } else {
            try {
                MessageRunnable messageRunnable = new MessageRunnable(message);
                Thread thread = new Thread(messageRunnable);
                thread.start();
                thread.setName("MessageRunnable-" + thread.getId());
                long startThreadT = System.currentTimeMillis();
    
                while (thread.isAlive()) {
                    thread.join(2000);
                    if (((System.currentTimeMillis() - startThreadT) > 10000) && thread.isAlive()) {
                        thread.interrupt();
                        thread.join();
                    }
                }
            } catch (InterruptedException ex) {
                com.gmt2001.Console.debug.println("Interrupted Exception");
            } catch (Exception ex) {
                twitchWSIRCParser.parseData(message);
            }
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
            com.gmt2001.Console.debug.println("Twitch WS-IRC Exception: " + ex);
        }
    }

    /*
     * Sends a PONG response to Twitch in reply to PING.
     */
    private void sendPong() {
        this.send("PONG :tmi.twitch.tv");
        com.gmt2001.Console.debug.println("Sent a PONG to Twitch.");
    }

    /**
     * Class for starting threads to handling incoming messages (other than PING)
     */
    private class MessageRunnable implements Runnable {
        private String message;

        public MessageRunnable(String message) {
            this.message = message;
        }

        public void run() {
            twitchWSIRCParser.parseData(message);
            return;
        }
    }

    /**
     * Timer for checking to ensure that PINGs are received on a timely basis from Twitch
     * and if not a reconnection is requested, this also attempts to send a PING after a
     * period of time.
     */
    private void checkPingTime() {
        com.gmt2001.Console.debug.println("Ping Wait Time: " + pingWaitTime + " Send Ping Wait Time: " + sendPingWaitTime);
        ScheduledExecutorService service = Executors.newSingleThreadScheduledExecutor();
        service.scheduleAtFixedRate(new Runnable() {
            @Override
            public void run() {
                Thread.currentThread().setName("me.mast3rplan.phantombot.twitchwsirc.TwitchWSIRC::checkPingTime");

                if (System.currentTimeMillis() - lastPing >= sendPingWaitTime && !sentPing) {
                    com.gmt2001.Console.debug.println("Sending a PING to Twitch to Verify Connection");
                    sentPing = true;
                    send("PING :tmi.twitch.tv");
                }

                if (System.currentTimeMillis() - lastPing >= pingWaitTime) {
                    com.gmt2001.Console.debug.println("PING not Detected from Twitch - Forcing Reconnect (Timeout is " + pingWaitTime + "ms)");
                    close();
                }
            }
        }, 1, 1, TimeUnit.MINUTES);
    }
}

