/*
 * Copyright (C) 2016-2020 phantom.bot
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
package tv.phantombot.twitch.irc.host;

import tv.phantombot.event.EventBus;
import tv.phantombot.event.twitch.host.TwitchHostedEvent;
import tv.phantombot.event.twitch.host.TwitchAutoHostedEvent;
import tv.phantombot.event.twitch.host.TwitchHostsInitializedEvent;

import java.net.URI;
import java.net.URISyntaxException;
import java.security.KeyManagementException;
import java.security.NoSuchAlgorithmException;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.locks.ReentrantLock;

import javax.net.ssl.SSLContext;
import javax.net.ssl.SSLSocketFactory;
import org.java_websocket.drafts.Draft_6455;
import org.java_websocket.client.WebSocketClient;
import org.java_websocket.handshake.ServerHandshake;

import tv.phantombot.PhantomBot;

public class TwitchWSHostIRC {
    private static final Map<String, TwitchWSHostIRC> instances = new ConcurrentHashMap<>();
    private final String twitchIRCWSS = "wss://irc-ws.chat.twitch.tv";
    private final String channelName;
    private final String oAuth;
    private final EventBus eventBus;
    private TwitchWSHostIRCWS twitchWSHostIRCWS;
    private final ReentrantLock lock = new ReentrantLock();
    private final ReentrantLock lock2 = new ReentrantLock();
    private static final long MAX_BACKOFF = 300000L;
    private long lastReconnect;
    private long nextBackoff = 1000L;

    /**
     * Creates an instance for a Twitch WS Host IRC Session
     *
     * @param  channelName  Name of Twitch Channel for which this instance is created.
     * @param  oAuth        OAuth key to use for authentication.
     * @param  eventBus     EventBus for performing work on.
     */
    public static TwitchWSHostIRC instance(String channelName, String oAuth, EventBus eventBus) {
        TwitchWSHostIRC instance = instances.get(channelName);
        if (instance == null) {
            instance = new TwitchWSHostIRC(channelName, oAuth, eventBus);
            instances.put(channelName, instance);
            return instance;
        }
        return instance;
    }
    
    private static TwitchWSHostIRC instance(String channelName) {
        TwitchWSHostIRC instance = instances.get(channelName);
        return instance;
    }

    /**
     * Constructor for TwitchWSHostIRC object.
     *
     * @param  channelName  Name of Twitch Channel for which this instance is created.
     * @param  oAuth        OAuth key to use for authentication.
     * @param  eventBus     EventBus for performing work on.
     */
    private TwitchWSHostIRC(String channelName, String oAuth, EventBus eventBus) {
        this.channelName = channelName;
        this.oAuth = oAuth;
        this.eventBus = eventBus;

        try {
            twitchWSHostIRCWS = new TwitchWSHostIRCWS(this, new URI(twitchIRCWSS));
            if (!twitchWSHostIRCWS.connectWSS()) {
                com.gmt2001.Console.err.println("Unable to connect to Twitch Data Host Feed. Exiting PhantomBot");
                PhantomBot.exitError();
            }
        } catch (URISyntaxException ex) {
            com.gmt2001.Console.debug.printStackTrace(ex);
            com.gmt2001.Console.err.println("TwitchWSHostIRC URI Failed. Exiting PhantomBot.");
            PhantomBot.exitError();
        }
    }

    /**
     * Public data access to channelName
     *
     * @return  String  this.channelName
     */
    public String GetChannelName() {
        return this.channelName;
    }

    /**
     * Public data access to oAuth
     *
     * @return  String  this.oAuth
     */
    public String GetOAuth() {
        return this.oAuth;
    }

    /**
     * Public data access to eventBus
     *
     * @return  EventBus  this.eventBus
     */
    public EventBus GetEventBus() {
        return this.eventBus;
    }

    /**
     * Exposes the connected status of the object.
     *
     * @return  boolean  Is connected
     */
    public boolean isConnected() {
        return twitchWSHostIRCWS.isConnected();
    }

    /**
     * Performs logic to attempt to reconnect to Twitch WS-IRC for Host Data.
     */
    public void reconnect() {
        if (lock.isLocked() || PhantomBot.instance().isExiting()) {
            return;
        }
        
        lock.lock();
        try {
            new Thread( () -> {
                TwitchWSHostIRC.instance(channelName).doReconnect();
            }).start();
        } finally {
            lock.unlock();
        }
    }
    
    public void doReconnect() {
        if (lock2.tryLock()) {
            try {
                long now = System.currentTimeMillis();

                if (lastReconnect + (MAX_BACKOFF * 2) < now) {
                    nextBackoff = 1000L;
                } else {
                    Thread.sleep(nextBackoff);
                }
                
                lastReconnect = now;
                nextBackoff = Math.min(MAX_BACKOFF, nextBackoff * 2L);
                
                this.twitchWSHostIRCWS.reconnectBlocking();
            } catch (InterruptedException ex) {
                com.gmt2001.Console.err.printStackTrace(ex);
            } finally {
                lock2.unlock();
            }
        }
    }

    /**
     * Class for handling the physical connection to Twitch WS-IRC for the Data Host Feed.
     */
    private class TwitchWSHostIRCWS extends WebSocketClient {
        private TwitchWSHostIRC twitchWSHostIRC;
        private boolean badOauth = false;
        private boolean connected = false;
        private final String channelName;
        private final String login;
        private final String oAuth;
        private final EventBus eventBus;
        private Pattern hostPattern = Pattern.compile("PRIVMSG \\w+ :(\\w+) is now hosting you for up to (\\d+) viewers");
        private Pattern autoHostPattern = Pattern.compile("PRIVMSG \\w+ :(\\w+) is now auto hosting you for up to (\\d+) viewers");
        private Pattern hostPatternNoViewers = Pattern.compile("PRIVMSG \\w+ :(\\w+) is now hosting you.");
        private Pattern autoHostPatternNoViewers = Pattern.compile("PRIVMSG \\w+ :(\\w+) is now auto hosting you.");
        private long lastPing = 0L;
        private boolean sentPing = false;

        private int sendPingWaitTime = Integer.parseInt(System.getProperty("ircsendpingwait", "480000"));
        private int pingWaitTime = Integer.parseInt(System.getProperty("ircpingwait", "600000"));

        /**
         * Constructor for TwitchWSIRC object.
         *
         * @param  channel  Name of Twitch Channel for which this instance is created.
         * @param  oauth    OAuth key to use for authentication.
         */
        private TwitchWSHostIRCWS(TwitchWSHostIRC twitchWSHostIRC, URI uri) {
            super(uri, new Draft_6455(), null, 5000);

            if (twitchWSHostIRC.GetChannelName().startsWith("#")) {
                channelName = twitchWSHostIRC.GetChannelName().substring(1);
            } else {
                channelName = twitchWSHostIRC.GetChannelName();
            }
            login = channelName;
            oAuth = twitchWSHostIRC.GetOAuth();
            eventBus = twitchWSHostIRC.GetEventBus();
            this.uri = uri;
            this.twitchWSHostIRC = twitchWSHostIRC;

            /* Lowest value for sendPingWaitTime is 3 minutes. This is based on research that shows that Azure Cloud Services
             * drop TCP connections without activity for 4 minutes.
             */
            if (sendPingWaitTime < 180000) {
                sendPingWaitTime = 180000;
            }

            /* Lowest value for pingWaitTime is 6 minutes. This is based on Twitch indicating that they will send a PING
             * around every 5 minutes.  This provides a minute of padding.
             */
            if (pingWaitTime < 360000) {
                pingWaitTime = 360000;
            }

            /* Force a spread of two minutes between sendPingWaitTime and pingWaitTime. */
            if (pingWaitTime - sendPingWaitTime <= 60000) {
                pingWaitTime = sendPingWaitTime + 120000;
            }

            try {
                SSLContext sslContext = SSLContext.getInstance("TLS");
                sslContext.init(null, null, null);
                SSLSocketFactory sslSocketFactory = sslContext.getSocketFactory();
                this.setSocketFactory(sslSocketFactory);
            } catch (KeyManagementException | NoSuchAlgorithmException ex) {
                com.gmt2001.Console.err.println(ex.getMessage());
            }
        }

        /**
         * Sends a message to the websocket.
         *
         * @param {String} message
         */
        @Override
        public void send(String message) {
            try {
                super.send(message);
            } catch (Exception  ex) {
                com.gmt2001.Console.out.println("Failed to send message: " + ex.getMessage());
            }
        }

        /**
         * Exposes the connected status of the object.
         *
         * @return  boolean  Is connected
         */
        public boolean isConnected() {
            return connected;
        }

        /**
         * Connect via WSS. This provides a secure connection to Twitch.
         *
         * @return  boolean  true on success and false on failure
         */
        public boolean connectWSS() {
            try {
                connect();
                return true;
            } catch (Exception ex) {
                com.gmt2001.Console.err.println(ex.getMessage());
                return false;
            }
        }

        /**
         * Callback for connection opening to WS-IRC.  Calls send() directly to login to Twitch
         * IRC rather than sendAddQueue().
         *
         * @param  ServerHandShake  Handshake data provided by WebSocketClient
         */
        @Override
        public void onOpen(ServerHandshake handshakedata) {
            send("PASS " + oAuth);
            send("NICK " + login);
        }

        /**
         * Callback for connection closed from WS-IRC.
         *
         * @param  int      Exit code
         * @param  String   Reason for the connection closing
         * @param  boolean  Remote closed connection or local did
         */
        @Override
        public void onClose(int code, String reason, boolean remote) {
            if (!badOauth) {
                com.gmt2001.Console.out.println("Lost connection to Twitch Host Data Feed, retrying in 10 seconds");
                com.gmt2001.Console.debug.println("Code [" + code + "] Reason [" + reason + "] Remote Hangup [" + remote + "]");
                twitchWSHostIRC.reconnect();
            }
        }

        /**
         * Callback for incoming messages from WS-IRC.
         *
         * @param  String  Incoming message
         */
        @Override
        public void onMessage(String message) {
            if (message.startsWith("PING")) {
                com.gmt2001.Console.debug.println("Got a PING from Twitch Host Data Feed");
                sentPing = false;
                lastPing = System.currentTimeMillis();
                sendPong();
                return;
            }

            if (message.startsWith(":tmi.twitch.tv PONG")) {
                com.gmt2001.Console.debug.println("Got a PONG from Twitch Host Data Feed");
                sentPing = false;
                lastPing = System.currentTimeMillis();
                return;
            }

            if (message.contains("002")) {
                // This is to make sure the caster created the oauth with his channel account and not the bot's.
                if (message.contains("002 " + channelName + " :")) {
                    connected = true;
                    com.gmt2001.Console.out.println("Connected to Twitch Host Data Feed");
                    lastPing = System.currentTimeMillis();
                    checkPingTime();

                    // All caches wait 20 seconds, so wait 20 seconds here too.
                    try {
                        Thread.sleep(20 * 1000);
                    } catch (InterruptedException ex) {
                        com.gmt2001.Console.debug.println("TwitchWSIRC: Failed to sleep: [InterruptedException] " + ex.getMessage());
                    }
                    eventBus.postAsync(new TwitchHostsInitializedEvent());
                } else {
                    connected = false;
                    badOauth = true;
                    com.gmt2001.Console.out.println("");
                    com.gmt2001.Console.out.println("Wrong API OAuth detected.");
                    com.gmt2001.Console.out.println("The API OAuth belongs to another account.");
                    com.gmt2001.Console.out.println("Please obtain new API OAuth at with your channel account: https://phantombot.github.io/PhantomBot/oauth/");
                    com.gmt2001.Console.out.println("Now disabling host module.");
                    com.gmt2001.Console.out.println("");
                    PhantomBot.instance().getDataStore().set("modules", "./handlers/hostHandler.js", "false");
                    close();
                }
                return;
            }

            if (message.contains("Error logging in") || message.contains("Login authentication failed") && badOauth == false) {
                com.gmt2001.Console.out.println("");
                com.gmt2001.Console.out.println("API OAuth not allowed to gather host data.");
                com.gmt2001.Console.out.println("Please obtain new API OAuth at: https://phantombot.github.io/PhantomBot/oauth/");
                com.gmt2001.Console.out.println("Now disabling host module.");
                com.gmt2001.Console.out.println("");
                PhantomBot.instance().getDataStore().set("modules", "./handlers/hostHandler.js", "false");
                badOauth = true;
                close();
                return;
            }

            if (message.startsWith(":jtv!jtv@jtv.tmi.twitch.tv")) {
                com.gmt2001.Console.debug.println("PRIVMSG::" + message);
                Matcher matcher = hostPattern.matcher(message);
                if (matcher.find()) {
                    eventBus.postAsync(new TwitchHostedEvent(matcher.group(1), Integer.parseInt(matcher.group(2))));
                    return;
                }

                matcher = hostPatternNoViewers.matcher(message);
                if (matcher.find()) {
                    eventBus.postAsync(new TwitchHostedEvent(matcher.group(1)));
                    return;
                }

                matcher = autoHostPattern.matcher(message);
                if (matcher.find()) {
                    eventBus.postAsync(new TwitchAutoHostedEvent(matcher.group(1), Integer.parseInt(matcher.group(2))));
                    return;
                }

                matcher = autoHostPatternNoViewers.matcher(message);
                if (matcher.find()) {
                    eventBus.postAsync(new TwitchAutoHostedEvent(matcher.group(1)));
                }
            }
        }

        /**
         * Callback for errors from WebSockets. Do not log the
         * ArrayIndexOutOfBoundsException, this is tossed by the API.
         *
         * @param  Exception  Java Exception thrown from WebSockets API
         */
        @Override
        public void onError(Exception ex) {
            if (!ex.toString().contains("ArrayIndexOutOfBoundsException")) {
                com.gmt2001.Console.debug.println("Twitch WS-IRC (Host Data) Exception: " + ex);
            }
        }

        /**
         * Sends a PONG response to Twitch in reply to PING.
         */
        private void sendPong() {
            send("PONG :tmi.twitch.tv");
        }

        /**
         * Timer for checking to ensure that PINGs are received on a timely basis from Twitch
         * and if not a reconnection is requested, this also attempts to send a PING after a
         * period of time.
         */
        private void checkPingTime() {
            ScheduledExecutorService service = Executors.newSingleThreadScheduledExecutor();
            service.scheduleAtFixedRate(() -> {
                Thread.currentThread().setName("tv.phantombot.twitchwsirc.TwitchWSHostIRC::checkPingTime");
                
                if (System.currentTimeMillis() - lastPing >= sendPingWaitTime && !sentPing) {
                    com.gmt2001.Console.debug.println("Sending a PING to Twitch (Host Data) to Verify Connection");
                    sentPing = true;
                    send("PING :tmi.twitch.tv");
                }
                
                if (System.currentTimeMillis() - lastPing >= pingWaitTime) {
                    com.gmt2001.Console.debug.println("PING not Detected from Twitch (Host Data) - Forcing Reconnect (Timeout is " + pingWaitTime + "ms)");
                    close();
                }
            }, 1, 1, TimeUnit.MINUTES);
        }
    }
}
