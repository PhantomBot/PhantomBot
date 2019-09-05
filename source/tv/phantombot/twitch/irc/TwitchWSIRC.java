/*
 * Copyright (C) 2016-2018 phantombot.tv
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

import java.net.URI;
import java.security.KeyManagementException;
import java.security.NoSuchAlgorithmException;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import javax.net.ssl.SSLContext;
import javax.net.ssl.SSLSocketFactory;
import org.java_websocket.client.WebSocketClient;
import org.java_websocket.drafts.Draft_6455;
import org.java_websocket.enums.ReadyState;
import org.java_websocket.handshake.ServerHandshake;
import tv.phantombot.PhantomBot;
import tv.phantombot.event.EventBus;
import tv.phantombot.event.irc.complete.IrcConnectCompleteEvent;

public class TwitchWSIRC extends WebSocketClient {
    private final TwitchSession session;
    private final String botName;
    private final String channelName;
    private final String oAuth;
    private TwitchWSIRCParser twitchWSIRCParser;
    private long lastPong = System.currentTimeMillis();
    private long lastPing = 0l;
    private boolean connecting = true;

    /**
     * Class constructor.
     *
     * @param {URI}    uri
     * @param {String} channelName
     * @param {String} botName
     * @param {String} oAuth
     */
    public TwitchWSIRC(URI uri, String channelName, String botName, String oAuth, TwitchSession session) {
        super(uri, new Draft_6455());

        this.uri = uri;
        this.channelName = channelName;
        this.botName = botName;
        this.oAuth = oAuth;
        this.session = session;

        // Create a new ping timer that runs every 30 seconds.
        Executors.newSingleThreadScheduledExecutor().scheduleAtFixedRate(() -> {
            Thread.currentThread().setName("tv.phantombot.chat.twitchwsirc.TwitchWSIRC::pingTimer");

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
                com.gmt2001.Console.debug.println("Sending a PING to Twitch.");
                lastPing = System.currentTimeMillis();
                this.send("PING");
            }

            // If Twitch's last pong was more than 3.5 minutes ago, close our connection.
            if (System.currentTimeMillis() > (lastPong + 210000)) {
                com.gmt2001.Console.out.println("Closing our connection with Twitch since no PONG got sent back.");
                this.close();
            }
        }, 10, 30, TimeUnit.SECONDS);
    }

    /**
     * Method that sets sockets and connects to Twitch.
     *
     * @param {boolean} reconnect
     */
    public boolean connectWSS(boolean reconnect) {
        try {
            if (reconnect) {
                com.gmt2001.Console.out.println("Reconnecting to Twitch WS-IRC Server (SSL) [" + this.uri.getHost() + "]");
            } else {
                com.gmt2001.Console.out.println("Connecting to Twitch WS-IRC Server (SSL) [" + this.uri.getHost() + "]");
            }
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
            connecting = true;
            this.connect();
            return true;
        } catch (KeyManagementException | NoSuchAlgorithmException ex) {
            com.gmt2001.Console.err.printStackTrace(ex);
        }
        return false;
    }

    /**
     * Callback that is called when we open a connect to Twitch.
     *
     * @param {ServerHandshake} handshakedata
     */
    @Override
    public void onOpen(ServerHandshake handshakedata) {
        com.gmt2001.Console.out.println("Connected to " + this.botName + "@" + this.uri.getHost() + " (SSL)");
        
        this.twitchWSIRCParser = TwitchWSIRCParser.instance(this.getConnection(), channelName, session);
        
        // Send the oauth
        this.send("PASS " + oAuth);
        // Send the bot name.
        this.send("NICK " + botName);

        // Send an event saying that we are connected to Twitch.
        EventBus.instance().postAsync(new IrcConnectCompleteEvent(session));
    }

    /**
     * Callback that is called when the connection with Twitch is lost.
     *
     * @param {int}     code
     * @param {String}  reason
     * @param {boolean} remote
     */
    @Override
    public void onClose(int code, String reason, boolean remote) {
        // Reconnect if the bot isn't shutting down.
        if (!reason.equals("bye")) {
            com.gmt2001.Console.out.println("Lost connection to Twitch WS-IRC. Reconnecting...");
            com.gmt2001.Console.warn.println("Lost connection with Twitch, caused by: ", true);
            com.gmt2001.Console.warn.println("Code [" + code + "] Reason [" + reason + "] Remote Hangup [" + remote + "]", true);

            connecting = true;
            this.session.reconnect();
        } else {
            com.gmt2001.Console.out.println("Connection to Twitch WS-IRC was closed...");
        }
    }

    /**
     * Callback that is called when we get an error from the socket.
     *
     * @param {Exception} ex
     */
    @Override
    public void onError(Exception ex) {
        com.gmt2001.Console.debug.println("Twitch WS-IRC Exception [" + ex.getClass().getSimpleName() + "]: " + ex);
    }

    /**
     * Callback that is called when we get a message from Twitch.
     *
     * @param {String} message
     */
    @Override
    public void onMessage(String message) {
        if (message.startsWith("PONG")) {
            lastPong = System.currentTimeMillis();
        } else if (message.startsWith("PING")) {
            send("PONG");
        } else {
            try {
                new Thread(() -> {
                    twitchWSIRCParser.parseData(message);
                }).start();
            } catch (Exception ex) {
                twitchWSIRCParser.parseData(message);
            }
        }
    }
}
