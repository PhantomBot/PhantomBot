/*
 * Copyright (C) 2016-2023 phantombot.github.io/PhantomBot
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
 * TwitchPubSub.java
 * @author ScaniaTV
 */
package tv.phantombot.twitch.pubsub;

import com.gmt2001.ExecutorService;
import com.gmt2001.Reflect;
import com.gmt2001.RollbarProvider;
import com.gmt2001.ratelimiters.ExponentialBackoff;
import com.gmt2001.wsclient.WSClient;
import com.gmt2001.wsclient.WsClientFrameHandler;
import io.netty.channel.ChannelHandlerContext;
import io.netty.handler.codec.http.websocketx.CloseWebSocketFrame;
import io.netty.handler.codec.http.websocketx.TextWebSocketFrame;
import io.netty.handler.codec.http.websocketx.WebSocketFrame;
import java.lang.reflect.Constructor;
import java.lang.reflect.InvocationTargetException;
import java.net.URI;
import java.net.URISyntaxException;
import java.time.Duration;
import java.util.Collections;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.SubmissionPublisher;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.locks.ReentrantLock;
import javax.net.ssl.SSLException;
import org.json.JSONException;
import org.json.JSONObject;
import tv.phantombot.PhantomBot;
import tv.phantombot.event.irc.message.IrcChannelMessageEvent;
import tv.phantombot.twitch.pubsub.processors.AbstractPubSubProcessor;

public class TwitchPubSub extends SubmissionPublisher<PubSubMessage> {

    private final Map<String, String> messageCache = new ConcurrentHashMap<>();
    private final int channelId;
    private final int botId;
    private String oAuth;
    private TwitchPubSubWS twitchPubSubWS;
    private final ReentrantLock reconnectLock = new ReentrantLock();
    private final ExponentialBackoff backoff = new ExponentialBackoff(1000L, 900000L);
    private boolean lastConnectSuccess = false;

    /**
     * Constructor for the PubSub class.
     *
     * @param channelId The channel user id.
     * @param botId The bot user id.
     * @param oAuth The APIOAuth token
     */
    public TwitchPubSub(int channelId, int botId, String oAuth) {
        this.channelId = channelId;
        this.botId = botId;
        this.oAuth = oAuth;

        ExecutorService.schedule(() -> {
            Reflect.instance().loadPackageRecursive(AbstractPubSubProcessor.class.getName().substring(0, AbstractPubSubProcessor.class.getName().lastIndexOf('.')));
            Reflect.instance().getSubTypesOf(AbstractPubSubProcessor.class).stream().filter((c) -> (!c.getName().equals(AbstractPubSubProcessor.class.getName()))).forEachOrdered((c) -> {
                for (Constructor constructor : c.getConstructors()) {
                    if (constructor.getParameterCount() == 0) {
                        try {
                            constructor.newInstance();
                        } catch (InstantiationException | IllegalAccessException | IllegalArgumentException | InvocationTargetException ex) {
                            com.gmt2001.Console.err.printStackTrace(ex);
                        }
                    }
                }
            });

            this.connect();
        }, 100, TimeUnit.MILLISECONDS);
    }

    public void setOAuth(String oAuth) {
        this.twitchPubSubWS.setOAuth(oAuth);
        this.oAuth = oAuth;

        if (!this.twitchPubSubWS.isConnected()) {
            this.connect();
        }
    }

    private void connect() {
        try {
            this.twitchPubSubWS = new TwitchPubSubWS(new URI("wss://pubsub-edge.twitch.tv"), this, this.oAuth);
            if (!this.twitchPubSubWS.connectWSS()) {
                this.lastConnectSuccess = false;
                com.gmt2001.Console.err.println("Failed to connect to PubSub.");
            } else {
                this.lastConnectSuccess = true;
            }
        } catch (URISyntaxException ex) {
            this.lastConnectSuccess = false;
            com.gmt2001.Console.err.printStackTrace(ex);
            com.gmt2001.Console.err.println("TwitchPubSub URI Failed");
        }
    }

    /**
     * @param event
     * @event IrcChannelMessageEvent
     */
    public void ircChannelMessageEvent(IrcChannelMessageEvent event) {
        if (messageCache.size() > 100) {
            messageCache.clear();
        }
        messageCache.put(event.getSender(), event.getMessage());
    }

    /**
     * Performs logic to attempt to reconnect to Twitch PubSub.
     */
    public void reconnect() {
        if (PhantomBot.instance().isExiting()) {
            return;
        }

        if (this.reconnectLock.tryLock()) {
            try {
                if (!this.backoff.GetIsBackingOff()) {
                    this.backoff.CancelReset();
                    this.shutdown();
                    com.gmt2001.Console.out.println("Delaying next connection (PubSub) attempt to prevent spam, " + (this.backoff.GetNextInterval() / 1000) + " seconds...");
                    com.gmt2001.Console.warn.println("Delaying next reconnect (PubSub) " + (this.backoff.GetNextInterval() / 1000) + " seconds...", true);
                    this.backoff.BackoffAsync(() -> {
                        this.connect();
                        if (!this.lastConnectSuccess) {
                            ExecutorService.schedule(() -> this.reconnect(), 500, TimeUnit.MILLISECONDS);
                        }
                    });
                }
            } finally {
                this.reconnectLock.unlock();
            }
        }
    }

    public void shutdown() {
        this.twitchPubSubWS.close(1000, "bye");
    }

    public void subscribeToTopics(String[] topics, String nonce) {
        this.twitchPubSubWS.subscribeToTopics(topics, nonce);
    }

    public void unsubscribeFromTopics(String[] topics, String nonce) {
        this.twitchPubSubWS.unsubscribeFromTopics(topics, nonce);
    }

    public int channelId() {
        return this.channelId;
    }

    public int botId() {
        return this.botId;
    }

    public Map<String, String> messageCache() {
        return Collections.unmodifiableMap(this.messageCache);
    }

    /**
     * Private class for the websocket.
     */
    private class TwitchPubSubWS implements WsClientFrameHandler {

        private final TwitchPubSub twitchPubSub;
        private String oAuth;
        private boolean hasSubscriptions = false;
        private long lastPong = System.currentTimeMillis();
        private long lastPing = 0l;
        private boolean connecting = true;
        private boolean connected = false;
        private final URI uri;
        private final WSClient client;

        /**
         * Constructor for the PubSubWS class.
         *
         * @param uri The URI to connect to
         * @param twitchPubSub The {@link TwitchPubSub} instance that owns this connection
         * @param oAuth The APIOAuth
         */
        private TwitchPubSubWS(URI uri, TwitchPubSub twitchPubSub, String oAuth) {
            this.uri = uri;
            this.oAuth = oAuth;
            this.twitchPubSub = twitchPubSub;

            WSClient nclient = null;
            try {
                nclient = new WSClient(uri, this);
            } catch (IllegalArgumentException | SSLException ex) {
                com.gmt2001.Console.err.printStackTrace(ex);
            } finally {
                this.client = nclient;
            }

            ExecutorService.scheduleAtFixedRate(() -> {
                Thread.currentThread().setName("tv.phantombot.twitch.pubsub.TwitchPubSub::pingTimer");
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
                    JSONObject jsonObject = new JSONObject();

                    jsonObject.put("type", "PING");
                    this.client.send(jsonObject);

                    // If Twitch's last pong was more than 3.5 minutes ago, close our connection.
                } else if (System.currentTimeMillis() > (this.lastPong + 210000)) {
                    com.gmt2001.Console.out.println("Closing our connection with Twitch (PubSub) since no PONG got sent back.");
                    com.gmt2001.Console.warn.println("Closing our connection with Twitch (PubSub) since no PONG got sent back.", true);
                    this.twitchPubSub.reconnect();
                }
            }, 10, 30, TimeUnit.SECONDS);
        }

        public boolean isConnected() {
            return this.client.connected() && this.connected;
        }

        /**
         * Updates the last pong timer
         */
        synchronized void gotPong() {
            this.lastPong = System.currentTimeMillis();
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
                com.gmt2001.Console.out.println("Connecting to Twitch PubSub Server (SSL) [" + this.uri.getHost() + "]");
                this.connecting = true;
                return this.client.connect();
            } catch (IllegalStateException | InterruptedException ex) {
                com.gmt2001.Console.err.printStackTrace(ex);
                return false;
            }
        }

        /**
         * Sends the message
         *
         * @param message The message to send
         */
        public void send(String message) {
            this.client.send(message);
        }

        /**
         * Sends the message
         *
         * @param message The message to send
         */
        public void send(JSONObject message) {
            this.client.send(message);
        }

        /**
         * This function parses the message we get from PubSub. Since everything is sent in a jsonObject there is a bit of checks to do.
         *
         * @param message Message we get from PubSub.
         */
        private void parse(JSONObject message) throws JSONException {
            JSONObject dataObj;
            JSONObject messageObj;

            if (message.has("data")) {
                dataObj = message.getJSONObject("data");
                if (dataObj.has("message")) {
                    messageObj = new JSONObject(dataObj.getString("message"));
                    this.twitchPubSub.submit(new PubSubMessage(PubSubMessage.PubSubMessageType.MESSAGE, dataObj.getString("topic"), messageObj));
                }
            }
        }

        /**
         * Sends the topic subscription requests
         *
         * @param type The topics to subscribe to
         * @param nonce The nonce for the request
         */
        public void subscribeToTopics(String[] type, String nonce) {
            JSONObject jsonObject = new JSONObject();
            JSONObject topics = new JSONObject();

            topics.put("topics", type);
            topics.put("auth_token", this.oAuth.replace("oauth:", ""));
            jsonObject.put("type", "LISTEN");
            jsonObject.put("nonce", nonce);
            jsonObject.put("data", topics);

            this.send(jsonObject);
        }

        /**
         * Sends the topic subscription cancellation requests
         *
         * @param type The topics to unsubscribe from
         * @param nonce The nonce for the request
         */
        public void unsubscribeFromTopics(String[] type, String nonce) {
            JSONObject jsonObject = new JSONObject();
            JSONObject topics = new JSONObject();

            topics.put("topics", type);
            topics.put("auth_token", this.oAuth.replace("oauth:", ""));
            jsonObject.put("type", "UNLISTEN");
            jsonObject.put("nonce", nonce);
            jsonObject.put("data", topics);

            this.send(jsonObject);
        }

        /**
         * Handles the event of when the socket opens, it also sends the login information and the topics we can to listen to.
         */
        private void onOpen() {
            com.gmt2001.Console.debug.println("Connected to Twitch PubSub-Edge (SSL) [" + this.uri.getHost() + "]");
            this.twitchPubSub.submit(new PubSubMessage(PubSubMessage.PubSubMessageType.OPEN));
            this.connected = true;
        }

        /**
         * Handles the event of when the socket closes, this will also attempt to reconnect to PubSub when it happens.
         *
         * @param code The code of why the socket closed.
         * @param reason The reasons as why the socket closed.
         */
        private void onClose(int code, String reason) {
            com.gmt2001.Console.warn.println("Code [" + code + "] Reason [" + reason + "]");

            this.twitchPubSub.submit(new PubSubMessage(PubSubMessage.PubSubMessageType.CLOSE));
            this.connected = false;

            if (!this.hasSubscriptions) {
                com.gmt2001.Console.out.println("Disconnected from Twitch PubSub due to no valid topic subscriptions");
                return;
            }

            if (!reason.equals("bye")) {
                com.gmt2001.Console.out.println("Lost connection to Twitch PubSub, retrying soon...");
                this.twitchPubSub.reconnect();
            }
        }

        /**
         * Handles the event of when we get messages from the socket.
         *
         * @param message Message the socket sent.
         */
        private void onMessage(String message) {
            try {
                JSONObject messageObj = new JSONObject(message);

                com.gmt2001.Console.debug.println("[PubSub Raw Message] " + messageObj);

                if (!messageObj.has("type")) {
                    return;
                }

                if (messageObj.getString("type").equalsIgnoreCase("response")) {
                    this.hasSubscriptions = !(messageObj.has("error") && messageObj.getString("error").length() > 0);
                    this.twitchPubSub.submit(new PubSubMessage(PubSubMessage.PubSubMessageType.SUBSCRIBERESULT, messageObj));
                    backoff.ResetIn(Duration.ofSeconds(30));
                } else if (messageObj.has("error") && messageObj.getString("error").length() > 0) {
                    com.gmt2001.Console.err.println("TwitchPubSubWS Error: " + messageObj.getString("error"));
                    return;
                }

                if (messageObj.getString("type").equalsIgnoreCase("reconnect")) {
                    com.gmt2001.Console.out.println("Received RECONNECT from Twitch PubSub");
                    this.twitchPubSub.reconnect();
                    return;
                }

                if (messageObj.getString("type").equalsIgnoreCase("pong")) {
                    this.gotPong();
                    com.gmt2001.Console.debug.println("TwitchPubSubWS: Got a PONG.");
                    return;
                }

                this.parse(messageObj);
            } catch (JSONException ex) {
                Map<String, Object> locals = RollbarProvider.localsToCustom(new String[]{"message"}, new Object[]{message});
                com.gmt2001.Console.err.logStackTrace(ex, locals);
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
