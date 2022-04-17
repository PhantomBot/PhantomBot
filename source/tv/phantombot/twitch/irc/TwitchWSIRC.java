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
package tv.phantombot.twitch.irc;

import com.gmt2001.wsclient.WSClient;
import com.gmt2001.wsclient.WsClientFrameHandler;
import io.netty.channel.ChannelHandlerContext;
import io.netty.handler.codec.http.websocketx.CloseWebSocketFrame;
import io.netty.handler.codec.http.websocketx.TextWebSocketFrame;
import io.netty.handler.codec.http.websocketx.WebSocketFrame;
import java.net.URI;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import javax.net.ssl.SSLException;
import tv.phantombot.CaselessProperties;
import tv.phantombot.event.EventBus;
import tv.phantombot.event.irc.complete.IrcConnectCompleteEvent;

public class TwitchWSIRC implements WsClientFrameHandler {

    private final TwitchSession session;
    private final String botName;
    private final String channelName;
    private String oAuth;
    private TwitchWSIRCParser twitchWSIRCParser;
    private long lastPong = System.currentTimeMillis();
    private long lastPing = 0l;
    private boolean connecting = true;
    private boolean connected = false;
    private final URI uri;
    private final WSClient client;
    private final ExecutorService ircParseExecutorService = Executors.newCachedThreadPool();

    /**
     * Constructor
     *
     * @param uri The URI to connect to
     * @param channelName The channel to join
     * @param botName The username to login as
     * @param oAuth The OAuth token to authenticate the login
     * @param session The {@link TwitchSession} that controls the IRC session
     */
    public TwitchWSIRC(URI uri, String channelName, String botName, String oAuth, TwitchSession session) {
        this.uri = uri;
        this.channelName = channelName;
        this.botName = botName;
        this.oAuth = oAuth;
        this.session = session;
        WSClient nclient = null;
        try {
            nclient = new WSClient(uri, this);
        } catch (IllegalArgumentException | SSLException ex) {
            com.gmt2001.Console.err.printStackTrace(ex);
        } finally {
            this.client = nclient;
        }

        // Create a new ping timer that runs every 30 seconds.
        Executors.newSingleThreadScheduledExecutor().scheduleAtFixedRate(() -> {
            Thread.currentThread().setName("tv.phantombot.chat.twitchwsirc.TwitchWSIRC::pingTimer");
            Thread.setDefaultUncaughtExceptionHandler(com.gmt2001.UncaughtExceptionHandler.instance());

            if (!this.connected) {
                if (this.client.connected()) {
                    this.connected = true;
                } else {
                    return;
                }
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
                this.send("PING");

                // If Twitch's last pong was more than 3.5 minutes ago, close our connection.
            } else if (System.currentTimeMillis() > (this.lastPong + 210000)) {
                com.gmt2001.Console.out.println("Closing our connection with Twitch since no PONG got sent back.");
                com.gmt2001.Console.warn.println("Closing our connection with Twitch since no PONG got sent back.", true);
                this.session.reconnect();
            }
        }, 10, 30, TimeUnit.SECONDS);
    }

    /**
     * Changes the OAuth token for the next, and future, connect attempts
     *
     * @param oAuth The new OAuth token
     */
    public void setOAuth(String oAuth) {
        this.oAuth = oAuth;
    }

    /**
     * Connects to Twitch
     *
     * @return true if the socket has connected and is starting the handshake; false otherwise
     */
    public boolean connectWSS() {
        try {
            com.gmt2001.Console.out.println("Connecting to Twitch WS-IRC Server (SSL) [" + this.uri.getHost() + "]");
            this.connected = false;
            this.connecting = true;
            return this.client.connect();
        } catch (IllegalStateException | InterruptedException ex) {
            com.gmt2001.Console.err.printStackTrace(ex);
            return false;
        }
    }

    /**
     * Indicates if the socket is fully connected and ready to send/receive frames
     *
     * NOTE: Does not indicate authentication status
     *
     * @return true if connected; false otherwise
     */
    public boolean connected() {
        return this.client.connected();
    }

    /**
     * Updates the last pong timer
     */
    synchronized void gotPong() {
        this.lastPong = System.currentTimeMillis();
    }

    /**
     * Callback when the socket is fully connected and ready to send/receive messages
     *
     * Performs login and preps the parser
     */
    private void onOpen() {
        com.gmt2001.Console.out.println("Connected to " + this.botName + "@" + this.uri.getHost() + " (SSL)");

        this.twitchWSIRCParser = TwitchWSIRCParser.instance(this.client, this.channelName, this.session);

        // Send the oauth
        this.client.send("PASS " + this.oAuth);
        // Send the bot name.
        this.send("NICK " + this.botName);

        // Send an event saying that we are connected to Twitch.
        EventBus.instance().postAsync(new IrcConnectCompleteEvent(this.session));
    }

    /**
     * Callback that is called when the connection with Twitch is lost
     *
     * @param code The close status code
     * @param reason The close reason message
     */
    private void onClose(int code, String reason) {
        this.connected = false;
        // Reconnect if the bot isn't shutting down.
        if (!reason.equals("bye")) {
            if (!this.connecting) {
                com.gmt2001.Console.warn.println("Lost connection with Twitch, caused by: ");
                com.gmt2001.Console.warn.println("Code [" + code + "] Reason [" + reason + "]");

                this.connecting = true;
                this.session.reconnect();
            }
        } else {
            com.gmt2001.Console.out.println("Connection to Twitch WS-IRC was closed...");
            com.gmt2001.Console.debug.println("Code [" + code + "] Reason [" + reason + "]");
        }
    }

    /**
     * Callback that is called when we get a message from Twitch
     *
     * Automatically sends PONG in response to a PING, then queues the message to be parsed on the thread pool
     *
     * @param message The message
     */
    private void onMessage(String message) {
        if (message.startsWith("PING")) {
            this.send("PONG");
        }

        ircParseExecutorService.submit(() -> {
            Thread.currentThread().setName("tv.phantombot.chat.twitchwsirc.TwitchWSIRC.onMessage::parseData");
            Thread.setDefaultUncaughtExceptionHandler(com.gmt2001.UncaughtExceptionHandler.instance());
            this.twitchWSIRCParser.parseData(message, this);
        });
    }

    /**
     * Sends the message
     *
     * @param message The message to send
     */
    public void send(String message) {
        if (CaselessProperties.instance().getPropertyAsBoolean("ircdebug", false)) {
            com.gmt2001.Console.debug.println("<" + message);
        }
        this.client.send(message);
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
