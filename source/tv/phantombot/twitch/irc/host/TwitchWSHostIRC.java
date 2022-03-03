/*
 * Copyright (C) 2016-2021 phantombot.github.io/PhantomBot
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

import com.gmt2001.ExponentialBackoff;
import java.net.URI;
import java.net.URISyntaxException;
import java.security.KeyManagementException;
import java.security.NoSuchAlgorithmException;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.locks.ReentrantLock;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import javax.net.ssl.SSLContext;
import javax.net.ssl.SSLSocketFactory;
import org.java_websocket.client.WebSocketClient;
import org.java_websocket.drafts.Draft_6455;
import org.java_websocket.enums.ReadyState;
import org.java_websocket.handshake.ServerHandshake;
import tv.phantombot.PhantomBot;
import tv.phantombot.event.EventBus;
import tv.phantombot.event.twitch.host.TwitchHostedEvent;
import tv.phantombot.event.twitch.host.TwitchHostsInitializedEvent;

public class TwitchWSHostIRC {

    private final String twitchIRCWSS = "wss://irc-ws.chat.twitch.tv";
    private final String channelName;
    private String oAuth;
    private TwitchWSHostIRCWS twitchWSHostIRCWS;
    private final ReentrantLock reconnectLock = new ReentrantLock();
    private final ExponentialBackoff backoff = new ExponentialBackoff(5000L, 900000L);

    /**
     * Constructor for TwitchWSHostIRC object.
     *
     * @param channelName Name of Twitch Channel for which this instance is created.
     * @param oAuth OAuth key to use for authentication.
     * @param eventBus EventBus for performing work on.
     */
    public TwitchWSHostIRC(String channelName, String oAuth) {
        this.channelName = channelName;
        this.oAuth = oAuth;

        this.connect();
    }

    public void setOAuth(String oAuth) {
        this.oAuth = oAuth;
    }

    /**
     * Public data access to channelName
     *
     * @return String this.channelName
     */
    public String GetChannelName() {
        return this.channelName;
    }

    /**
     * Public data access to oAuth
     *
     * @return String this.oAuth
     */
    public String GetOAuth() {
        return this.oAuth;
    }

    private void connect() {
        try {
            this.twitchWSHostIRCWS = new TwitchWSHostIRCWS(this, new URI(twitchIRCWSS));
            if (!this.twitchWSHostIRCWS.connectWSS()) {
                com.gmt2001.Console.err.println("Unable to connect to Twitch Data Host Feed");
            }
        } catch (URISyntaxException ex) {
            com.gmt2001.Console.err.printStackTrace(ex);
            com.gmt2001.Console.err.println("TwitchWSHostIRC URI Failed");
        }
    }

    /**
     * Exposes the connected status of the object.
     *
     * @return boolean Is connected
     */
    public boolean isConnected() {
        return twitchWSHostIRCWS.isConnected();
    }

    /**
     * Performs logic to attempt to reconnect to Twitch WS-IRC for Host Data.
     */
    public void reconnect() {
        if (PhantomBot.instance().isExiting()) {
            return;
        }

        if (this.reconnectLock.tryLock()) {
            try {
                com.gmt2001.Console.out.println("Delaying next connection attempt to prevent spam, " + (this.backoff.GetNextInterval() / 1000) + " seconds...");
                com.gmt2001.Console.warn.println("Delaying next reconnect " + (this.backoff.GetNextInterval() / 1000) + " seconds...", true);
                this.backoff.Backoff();

                this.shutdown();
                Thread.sleep(500);
                this.connect();
                Thread.sleep(500);
            } catch (InterruptedException ex) {
                com.gmt2001.Console.err.printStackTrace(ex);
            } finally {
                this.reconnectLock.unlock();
            }
        }
    }

    public void shutdown() {
        this.twitchWSHostIRCWS.send("QUIT");

        try {
            Thread.sleep(250);
        } catch (InterruptedException ex) {
        }
        // Close connection.
        this.twitchWSHostIRCWS.close(1000, "bye");
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
        private Pattern hostPattern = Pattern.compile("PRIVMSG \\w+ :(\\w+) is now hosting you for up to (\\d+) viewers");
        private Pattern hostPatternNoViewers = Pattern.compile("PRIVMSG \\w+ :(\\w+) is now hosting you.");
        private long lastPong = System.currentTimeMillis();
        private long lastPing = 0l;
        private boolean connecting = true;

        /**
         * Constructor for TwitchWSIRC object.
         *
         * @param channel Name of Twitch Channel for which this instance is created.
         * @param oauth OAuth key to use for authentication.
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
            this.uri = uri;
            this.twitchWSHostIRC = twitchWSHostIRC;

            Executors.newSingleThreadScheduledExecutor().scheduleAtFixedRate(() -> {
                Thread.currentThread().setName("tv.phantombot.twitch.irc.host.TwitchWSHostIRC::pingTimer");

                if (this.getReadyState() != ReadyState.OPEN) {
                    return;
                }

                if (this.connecting) {
                    lastPing = System.currentTimeMillis();
                    lastPong = System.currentTimeMillis();
                    this.connecting = false;
                    return;
                }

                // if we sent a ping longer than 3 minutes ago, send another one.
                if (System.currentTimeMillis() > (lastPing + 180000)) {
                    com.gmt2001.Console.debug.println("Sending a PING to Twitch (Host).");
                    lastPing = System.currentTimeMillis();
                    this.send("PING");

                    // If Twitch's last pong was more than 3.5 minutes ago, close our connection.
                } else if (System.currentTimeMillis() > (lastPong + 210000)) {
                    com.gmt2001.Console.out.println("Closing our connection with Twitch (Host) since no PONG got sent back.");
                    com.gmt2001.Console.warn.println("Closing our connection with Twitch (Host) since no PONG got sent back.", true);
                    this.close();
                }
            }, 10, 30, TimeUnit.SECONDS);
        }

        synchronized void gotPong() {
            lastPong = System.currentTimeMillis();
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
            } catch (Exception ex) {
                com.gmt2001.Console.out.println("Failed to send message: " + ex.getMessage());
                com.gmt2001.Console.err.printStackTrace(ex);
            }
        }

        /**
         * Exposes the connected status of the object.
         *
         * @return boolean Is connected
         */
        public boolean isConnected() {
            return connected;
        }

        /**
         * Connect via WSS. This provides a secure connection to Twitch.
         *
         * @return boolean true on success and false on failure
         */
        public boolean connectWSS() {
            try {
                com.gmt2001.Console.out.println("Connecting to Twitch WS-IRC Server (SSL, Host) [" + this.uri.getHost() + "]");
                // Get our context.
                SSLContext sslContext = SSLContext.getInstance("TLS");
                // Init the context.
                sslContext.init(null, null, null);
                // Get a socket factory.
                SSLSocketFactory sslSocketFactory = sslContext.getSocketFactory();
                // Set TCP no delay.
                this.setTcpNoDelay(PhantomBot.getTwitchTcpNodelay());
                // Set the socket.
                this.setSocketFactory(sslSocketFactory);
                // Connect.
                this.setConnectionLostTimeout(30);
                this.connect();
                return true;
            } catch (KeyManagementException | NoSuchAlgorithmException ex) {
                com.gmt2001.Console.err.printStackTrace(ex);
            }
            return false;
        }

        /**
         * Callback for connection opening to WS-IRC. Calls send() directly to login to Twitch IRC rather than sendAddQueue().
         *
         * @param ServerHandShake Handshake data provided by WebSocketClient
         */
        @Override
        public void onOpen(ServerHandshake handshakedata) {
            com.gmt2001.Console.out.println("Connected to " + this.login + "@" + this.uri.getHost() + " (SSL, Host)");
            send("PASS " + oAuth);
            send("NICK " + login);
        }

        /**
         * Callback for connection closed from WS-IRC.
         *
         * @param int Exit code
         * @param String Reason for the connection closing
         * @param boolean Remote closed connection or local did
         */
        @Override
        public void onClose(int code, String reason, boolean remote) {
            // Reconnect if the bot isn't shutting down.
            if (!reason.equals("bye")) {
                com.gmt2001.Console.warn.println("Lost connection with Twitch (Host), caused by: ");
                com.gmt2001.Console.warn.println("Code [" + code + "] Reason [" + reason + "] Remote Hangup [" + remote + "]");

                connecting = true;
                this.twitchWSHostIRC.reconnect();
            } else {
                com.gmt2001.Console.out.println("Connection to Twitch (Host) WS-IRC was closed...");
            }
        }

        /**
         * Callback for incoming messages from WS-IRC.
         *
         * @param String Incoming message
         */
        @Override
        public void onMessage(String message) {
            if (message.startsWith("PING")) {
                send("PONG");
                return;
            }

            if (message.startsWith("PONG")) {
                this.gotPong();
                return;
            }

            if (message.contains("002")) {
                // This is to make sure the caster created the oauth with his channel account and not the bot's.
                if (message.contains("002 " + channelName + " :")) {
                    connected = true;
                    com.gmt2001.Console.out.println("Connected to Twitch Host Data Feed");

                    // All caches wait 20 seconds, so wait 20 seconds here too.
                    try {
                        Thread.sleep(20 * 1000);
                    } catch (InterruptedException ex) {
                        com.gmt2001.Console.debug.println("TwitchWSIRC: Failed to sleep: [InterruptedException] " + ex.getMessage());
                    }
                    EventBus.instance().postAsync(new TwitchHostsInitializedEvent());
                } else {
                    connected = false;
                    badOauth = true;
                    com.gmt2001.Console.out.println("");
                    com.gmt2001.Console.out.println("Wrong API OAuth detected.");
                    com.gmt2001.Console.out.println("The API OAuth belongs to another account.");
                    com.gmt2001.Console.out.println("Please obtain new API OAuth with your channel account from the panel");
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
                com.gmt2001.Console.out.println("Please obtain new API OAuth from the panel");
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
                    EventBus.instance().postAsync(new TwitchHostedEvent(matcher.group(1), Integer.parseInt(matcher.group(2))));
                    return;
                }

                matcher = hostPatternNoViewers.matcher(message);
                if (matcher.find()) {
                    EventBus.instance().postAsync(new TwitchHostedEvent(matcher.group(1)));
                }
            }
        }

        /**
         * Callback for errors from WebSockets. Do not log the ArrayIndexOutOfBoundsException, this is tossed by the API.
         *
         * @param Exception Java Exception thrown from WebSockets API
         */
        @Override
        public void onError(Exception ex) {
            if (!ex.toString().contains("ArrayIndexOutOfBoundsException")) {
                com.gmt2001.Console.err.printStackTrace(ex);
            }
        }
    }
}
