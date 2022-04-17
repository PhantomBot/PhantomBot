/*
 * Copyright (C) 2016-2022 phantombot.github.io/PhantomBot
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
import com.gmt2001.wsclient.WSClient;
import com.gmt2001.wsclient.WsClientFrameHandler;
import io.netty.channel.ChannelHandlerContext;
import io.netty.handler.codec.http.websocketx.CloseWebSocketFrame;
import io.netty.handler.codec.http.websocketx.TextWebSocketFrame;
import io.netty.handler.codec.http.websocketx.WebSocketFrame;
import java.net.URI;
import java.net.URISyntaxException;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.locks.ReentrantLock;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import javax.net.ssl.SSLException;
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
    private final ExponentialBackoff backoff = new ExponentialBackoff(1000L, 900000L);
    private boolean lastConnectSuccess = false;

    /**
     * Constructor for TwitchWSHostIRC object.
     *
     * @param channelName Name of Twitch Channel for which this instance is created.
     * @param oAuth OAuth key to use for authentication.
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
            this.twitchWSHostIRCWS = new TwitchWSHostIRCWS(this, new URI(this.twitchIRCWSS));
            if (!this.twitchWSHostIRCWS.connectWSS()) {
                this.lastConnectSuccess = false;
                com.gmt2001.Console.err.println("Unable to connect to Twitch Data Host Feed");
            } else {
                this.lastConnectSuccess = true;
            }
        } catch (URISyntaxException ex) {
            this.lastConnectSuccess = false;
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
        return this.twitchWSHostIRCWS.isConnected();
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
                if (!this.backoff.GetIsBackingOff()) {
                    this.shutdown();
                    com.gmt2001.Console.out.println("Delaying next connection (Host) attempt to prevent spam, " + (this.backoff.GetNextInterval() / 1000) + " seconds...");
                    com.gmt2001.Console.warn.println("Delaying next reconnect (Host) " + (this.backoff.GetNextInterval() / 1000) + " seconds...", true);
                    this.backoff.BackoffAsync(() -> {
                        this.connect();
                        if (!this.lastConnectSuccess) {
                            Executors.newSingleThreadScheduledExecutor().schedule(() -> this.reconnect(), 500, TimeUnit.MILLISECONDS);
                        }
                    });
                }
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
    private class TwitchWSHostIRCWS implements WsClientFrameHandler {

        private TwitchWSHostIRC twitchWSHostIRC;
        private boolean badOauth = false;
        private boolean connected = false;
        private final String channelName;
        private final String oAuth;
        private Pattern hostPattern = Pattern.compile("PRIVMSG \\w+ :(\\w+) is now hosting you for up to (\\d+) viewers");
        private Pattern hostPatternNoViewers = Pattern.compile("PRIVMSG \\w+ :(\\w+) is now hosting you.");
        private long lastPong = System.currentTimeMillis();
        private long lastPing = 0l;
        private boolean connecting = true;
        private final URI uri;
        private final WSClient client;

        /**
         * Constructor for TwitchWSIRC object.
         *
         * @param twitchWSHostIRC The {@link TwitchWSHostIRC} object that owns this session
         * @param uri The URI to connect to
         */
        private TwitchWSHostIRCWS(TwitchWSHostIRC twitchWSHostIRC, URI uri) {
            if (twitchWSHostIRC.GetChannelName().startsWith("#")) {
                this.channelName = twitchWSHostIRC.GetChannelName().substring(1);
            } else {
                this.channelName = twitchWSHostIRC.GetChannelName();
            }
            this.oAuth = twitchWSHostIRC.GetOAuth();
            this.uri = uri;
            this.twitchWSHostIRC = twitchWSHostIRC;

            WSClient nclient = null;
            try {
                nclient = new WSClient(uri, this);
            } catch (IllegalArgumentException | SSLException ex) {
                com.gmt2001.Console.err.printStackTrace(ex);
            } finally {
                this.client = nclient;
            }

            Executors.newSingleThreadScheduledExecutor().scheduleAtFixedRate(() -> {
                Thread.currentThread().setName("tv.phantombot.twitch.irc.host.TwitchWSHostIRC::pingTimer");
                Thread.setDefaultUncaughtExceptionHandler(com.gmt2001.UncaughtExceptionHandler.instance());

                if (!this.client.connected()) {
                    return;
                }

                if (this.connecting) {
                    this.lastPing = System.currentTimeMillis();
                    this.lastPong = System.currentTimeMillis();
                    this.connecting = false;
                    return;
                }

                // if we sent a ping longer than 3 minutes ago, send another one.
                if (System.currentTimeMillis() > (this.lastPing + 180000)) {
                    com.gmt2001.Console.debug.println("Sending a PING to Twitch.");
                    this.lastPing = System.currentTimeMillis();
                    this.client.send("PING");

                    // If Twitch's last pong was more than 3.5 minutes ago, close our connection.
                } else if (System.currentTimeMillis() > (this.lastPong + 210000)) {
                    com.gmt2001.Console.out.println("Closing our connection with Twitch (Host) since no PONG got sent back.");
                    com.gmt2001.Console.warn.println("Closing our connection with Twitch (Host) since no PONG got sent back.", true);
                    this.twitchWSHostIRC.reconnect();
                }
            }, 10, 30, TimeUnit.SECONDS);
        }

        /**
         * Updates the last pong timer
         */
        synchronized void gotPong() {
            this.lastPong = System.currentTimeMillis();
        }

        /**
         * Sends a message to the websocket.
         *
         * @param message
         */
        public void send(String message) {
            try {
                this.client.send(message);
            } catch (Exception ex) {
                com.gmt2001.Console.out.println("Failed to send message: " + ex.getMessage());
                com.gmt2001.Console.err.printStackTrace(ex);
            }
        }

        /**
         * Exposes the connected status of the object.
         *
         * @return Is connected
         */
        public boolean isConnected() {
            return this.client.connected() && this.connected;
        }

        /**
         * Connects to Twitch
         *
         * @return true if the socket has connected and is starting the handshake; false otherwise
         */
        public boolean connectWSS() {
            try {
                com.gmt2001.Console.out.println("Connecting to Twitch WS-IRC Server (SSL, Host) [" + this.uri.getHost() + "]");
                this.connecting = true;
                return this.client.connect();
            } catch (IllegalStateException | InterruptedException ex) {
                com.gmt2001.Console.err.printStackTrace(ex);
                return false;
            }
        }

        /**
         * Callback when the socket is fully connected and ready to send/receive messages
         *
         * Performs login
         */
        private void onOpen() {
            com.gmt2001.Console.out.println("Connected to " + this.channelName + "@" + this.uri.getHost() + " (SSL, Host)");

            // Send the oauth
            this.client.send("PASS " + this.oAuth);
            // Send the bot name.
            this.client.send("NICK " + this.channelName);
        }

        /**
         * Callback that is called when the connection with Twitch is lost
         *
         * @param code The close status code
         * @param reason The close reason message
         */
        private void onClose(int code, String reason) {
            // Reconnect if the bot isn't shutting down.
            if (!reason.equals("bye")) {
                if (!this.connecting) {
                    com.gmt2001.Console.warn.println("Lost connection with Twitch (Host), caused by: ");
                    com.gmt2001.Console.warn.println("Code [" + code + "] Reason [" + reason + "]");

                    this.connecting = true;
                    this.twitchWSHostIRC.reconnect();
                }
            } else {
                com.gmt2001.Console.out.println("Connection to Twitch WS-IRC (Host) was closed...");
                com.gmt2001.Console.debug.println("Code [" + code + "] Reason [" + reason + "]");
            }
        }

        /**
         * Callback that is called when we get a message from Twitch
         *
         * Automatically sends PONG in response to a PING, otherwise, processes the message
         *
         * @param message The message
         */
        public void onMessage(String message) {
            if (message.startsWith("PING")) {
                this.send("PONG");
                return;
            }

            if (message.startsWith("PONG")) {
                this.gotPong();
                return;
            }

            if (message.contains("002")) {
                // This is to make sure the caster created the oauth with his channel account and not the bot's.
                if (message.contains("002 " + this.channelName + " :")) {
                    this.connected = true;
                    com.gmt2001.Console.out.println("Connected to Twitch Host Data Feed");

                    Executors.newSingleThreadScheduledExecutor().schedule(() -> {
                        EventBus.instance().postAsync(new TwitchHostsInitializedEvent());
                        backoff.Reset();
                    }, 20, TimeUnit.SECONDS);
                } else {
                    this.connected = false;
                    this.badOauth = true;
                    com.gmt2001.Console.out.println("");
                    com.gmt2001.Console.out.println("Wrong API OAuth detected.");
                    com.gmt2001.Console.out.println("The API OAuth belongs to another account.");
                    com.gmt2001.Console.out.println("Please obtain new API OAuth with your channel account from the panel");
                    com.gmt2001.Console.out.println("Now disabling host module.");
                    com.gmt2001.Console.out.println("");
                    PhantomBot.instance().getDataStore().set("modules", "./handlers/hostHandler.js", "false");
                    this.close(1000, "bye");
                }
                return;
            }

            if (message.contains("Error logging in") || message.contains("Login authentication failed") && this.badOauth == false) {
                com.gmt2001.Console.out.println("");
                com.gmt2001.Console.out.println("API OAuth not allowed to gather host data.");
                com.gmt2001.Console.out.println("Please obtain new API OAuth from the panel");
                com.gmt2001.Console.out.println("Now disabling host module.");
                com.gmt2001.Console.out.println("");
                PhantomBot.instance().getDataStore().set("modules", "./handlers/hostHandler.js", "false");
                this.badOauth = true;
                this.close(1000, "bye");
                return;
            }

            if (message.startsWith(":jtv!jtv@jtv.tmi.twitch.tv")) {
                com.gmt2001.Console.debug.println("PRIVMSG::" + message);
                Matcher matcher = this.hostPattern.matcher(message);
                if (matcher.find()) {
                    EventBus.instance().postAsync(new TwitchHostedEvent(matcher.group(1), Integer.parseInt(matcher.group(2))));
                    return;
                }

                matcher = this.hostPatternNoViewers.matcher(message);
                if (matcher.find()) {
                    EventBus.instance().postAsync(new TwitchHostedEvent(matcher.group(1)));
                }
            }
        }

        /**
         * Closes the socket
         *
         * @param status The close status code to send
         * @param reason The close reason to send
         */
        public void close(int status, String reason) {
            this.client.close(status, reason);
        }

        @Override
        public void handleFrame(ChannelHandlerContext ctx, WebSocketFrame frame) {
            if (frame instanceof TextWebSocketFrame) {
                TextWebSocketFrame tframe = (TextWebSocketFrame) frame;
                this.onMessage(tframe.text());
            } else if (frame instanceof CloseWebSocketFrame) {
                CloseWebSocketFrame cframe = (CloseWebSocketFrame) frame;
                this.onClose(cframe.statusCode(), cframe.reasonText());
            }
        }

        @Override
        public void handshakeComplete(ChannelHandlerContext ctx) {
            this.onOpen();
        }

        @Override
        public void onClose() {
            this.onClose(0, "channel closed");
        }
    }
}
