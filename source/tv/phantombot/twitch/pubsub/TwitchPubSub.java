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
 * TwitchPubSub.java
 * @author ScaniaTV
 */
package tv.phantombot.twitch.pubsub;

import com.gmt2001.ExponentialBackoff;
import com.gmt2001.Logger;
import com.gmt2001.RollbarProvider;
import com.gmt2001.datastore.DataStore;
import com.gmt2001.wsclient.WSClient;
import com.gmt2001.wsclient.WsClientFrameHandler;
import io.netty.channel.ChannelHandlerContext;
import io.netty.handler.codec.http.websocketx.CloseWebSocketFrame;
import io.netty.handler.codec.http.websocketx.TextWebSocketFrame;
import io.netty.handler.codec.http.websocketx.WebSocketFrame;
import java.net.URI;
import java.net.URISyntaxException;
import java.text.SimpleDateFormat;
import java.time.Duration;
import java.util.Calendar;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.locks.ReentrantLock;
import javax.net.ssl.SSLException;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;
import reactor.core.publisher.Mono;
import reactor.core.publisher.SignalType;
import tv.phantombot.PhantomBot;
import tv.phantombot.cache.TwitchCache;
import tv.phantombot.event.EventBus;
import tv.phantombot.event.irc.message.IrcChannelMessageEvent;
import tv.phantombot.event.pubsub.channelpoints.PubSubChannelPointsEvent;
import tv.phantombot.event.pubsub.following.PubSubFollowEvent;
import tv.phantombot.event.pubsub.moderation.PubSubModerationBanEvent;
import tv.phantombot.event.pubsub.moderation.PubSubModerationDeleteEvent;
import tv.phantombot.event.pubsub.moderation.PubSubModerationTimeoutEvent;
import tv.phantombot.event.pubsub.moderation.PubSubModerationUnBanEvent;
import tv.phantombot.event.pubsub.moderation.PubSubModerationUnTimeoutEvent;
import tv.phantombot.event.pubsub.videoplayback.PubSubStreamDownEvent;
import tv.phantombot.event.pubsub.videoplayback.PubSubStreamUpEvent;
import tv.phantombot.event.pubsub.videoplayback.PubSubViewCountEvent;
import tv.phantombot.event.twitch.follower.TwitchFollowEvent;
import tv.phantombot.event.twitch.offline.TwitchOfflineEvent;
import tv.phantombot.event.twitch.online.TwitchOnlineEvent;
import tv.phantombot.twitch.api.TwitchValidate;

public class TwitchPubSub {

    private final Map<String, String> messageCache = new ConcurrentHashMap<>();
    private final Map<String, Long> timeoutCache = new ConcurrentHashMap<>();
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

        this.connect();
    }

    public void setOAuth(String oAuth) {
        this.twitchPubSubWS.setOAuth(oAuth);
        this.oAuth = oAuth;
    }

    private void connect() {
        try {
            this.twitchPubSubWS = new TwitchPubSubWS(new URI("wss://pubsub-edge.twitch.tv"), this, this.channelId, this.botId, this.oAuth);
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
                    this.shutdown();
                    com.gmt2001.Console.out.println("Delaying next connection (PubSub) attempt to prevent spam, " + (this.backoff.GetNextInterval() / 1000) + " seconds...");
                    com.gmt2001.Console.warn.println("Delaying next reconnect (PubSub) " + (this.backoff.GetNextInterval() / 1000) + " seconds...", true);
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
        this.twitchPubSubWS.close(1000, "bye");
    }

    /**
     * Private class for the websocket.
     */
    private class TwitchPubSubWS implements WsClientFrameHandler {

        private final TwitchPubSub twitchPubSub;
        private final int channelId;
        private String oAuth;
        private final int botId;
        private boolean hasModerator = false;
        private boolean hasRedemptions = false;
        private boolean hasStreamupdown = false;
        private boolean hasFollowing = false;
        private long lastPong = System.currentTimeMillis();
        private long lastPing = 0l;
        private boolean connecting = true;
        private final URI uri;
        private final WSClient client;

        /**
         * Constructor for the PubSubWS class.
         *
         * @param uri The URI to connect to
         * @param twitchPubSub The {@link TwitchPubSub} instance that owns this connection
         * @param channelId The channel user id.
         * @param botId The bot user id.
         * @param oAuth The APIOAuth
         */
        private TwitchPubSubWS(URI uri, TwitchPubSub twitchPubSub, int channelId, int botId, String oAuth) {
            this.uri = uri;
            this.channelId = channelId;
            this.botId = botId;
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

            Executors.newSingleThreadScheduledExecutor().scheduleAtFixedRate(() -> {
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
            JSONObject data;

            if (message.has("data")) {
                dataObj = message.getJSONObject("data");
                if (dataObj.has("message")) {
                    messageObj = new JSONObject(dataObj.getString("message"));
                    data = messageObj.optJSONObject("data");
                    if (dataObj.getString("topic").startsWith("channel-points-channel-v1")) {
                        data = data.getJSONObject("redemption");
                        com.gmt2001.Console.out.println("Channel points redeemed by " + data.getJSONObject("user").getString("login") + " for reward " + data.getJSONObject("reward").getString("title"));
                        EventBus.instance().postAsync(new PubSubChannelPointsEvent(
                                data.getString("id"), data.getJSONObject("reward").getString("id"), data.getJSONObject("user").getString("id"),
                                data.getJSONObject("user").getString("login"), data.getJSONObject("user").optString("display_name", data.getJSONObject("user").getString("login")), data.getJSONObject("reward").getString("title"),
                                data.getJSONObject("reward").getInt("cost"), data.getJSONObject("reward").optString("prompt"), data.optString("user_input"), data.optString("status")
                        ));
                    } else if (dataObj.getString("topic").startsWith("chat_moderator_actions")) {
                        if (data.has("moderation_action") && !data.isNull("moderation_action") && data.has("created_by")) {
                            JSONArray args = data.optJSONArray("args");
                            String action = data.getString("moderation_action");
                            String creator = data.getString("created_by");
                            String args1 = args != null ? args.optString(0, data.getString("target_user_id")) : data.getString("target_user_id");
                            String args2 = args != null ? args.optString(1) : "";
                            String args3 = args != null ? args.optString(2) : "";

                            if (this.twitchPubSub.timeoutCache.containsKey(data.getString("target_user_id")) && (this.twitchPubSub.timeoutCache.get(data.getString("target_user_id")) - System.currentTimeMillis()) > 0) {
                                return;
                            }

                            this.twitchPubSub.timeoutCache.put(data.getString("target_user_id"), System.currentTimeMillis() + 1500);
                            switch (action) {
                                case "delete":
                                    this.logModeration(args1 + "'s message was deleted by " + creator);
                                    EventBus.instance().postAsync(new PubSubModerationDeleteEvent(args1, creator, args2));
                                    break;
                                case "timeout":
                                    this.logModeration(args1 + " has been timed out by " + creator + " for " + args2 + " seconds. " + (args3.length() == 0 ? "" : "Reason: " + args3));
                                    EventBus.instance().postAsync(new PubSubModerationTimeoutEvent(args1, creator, (this.twitchPubSub.messageCache.containsKey(args1.toLowerCase()) ? this.twitchPubSub.messageCache.get(args1.toLowerCase()) : ""), args3, args2));
                                    break;
                                case "untimeout":
                                    this.logModeration(args1 + " has been un-timed out by " + creator + ".");
                                    EventBus.instance().postAsync(new PubSubModerationUnTimeoutEvent(args1, creator));
                                    break;
                                case "ban":
                                    this.logModeration(args1 + " has been banned by " + creator + ". " + (args2.length() == 0 ? "" : "Reason: " + args2));
                                    EventBus.instance().postAsync(new PubSubModerationBanEvent(args1, creator, (this.twitchPubSub.messageCache.containsKey(args1.toLowerCase()) ? this.twitchPubSub.messageCache.get(args1.toLowerCase()) : ""), args2));
                                    break;
                                case "unban":
                                    this.logModeration(args1 + " has been un-banned by " + creator + ".");
                                    EventBus.instance().postAsync(new PubSubModerationUnBanEvent(args1, creator));
                                    break;
                                case "mod":
                                    this.logModeration(args1 + " has been modded by " + creator + ".");
                                    break;
                                case "unmod":
                                    this.logModeration(args1 + " has been un-modded by " + creator + ".");
                                    break;
                                case "twitchbot_rejected":
                                    this.logModeration("Message (" + args2 + ") from " + args1 + " has been rejected by AutoMod.");
                                    break;
                                case "denied_twitchbot_message":
                                    this.logModeration(creator + " denied a message from " + args1 + ". Message id: " + data.getString("msg_id") + ".");
                                    break;
                                case "approved_twitchbot_message":
                                    this.logModeration(creator + " allowed a message from " + args1 + ". Message id: " + data.getString("msg_id") + ".");
                                    break;
                            }
                        }
                    } else if (dataObj.getString("topic").startsWith("video-playback-by-id")) {
                        int chanid = Integer.parseInt(dataObj.getString("topic").substring(dataObj.getString("topic").lastIndexOf(".") + 1));
                        float srvtime = messageObj.optFloat("server_time");
                        switch (messageObj.getString("type")) {
                            case "stream-up":
                                if (chanid == this.channelId) {
                                    Mono.delay(Duration.ofSeconds(10)).doFinally((SignalType s) -> {
                                        TwitchCache.instance().syncStreamStatus(true);
                                        EventBus.instance().postAsync(new TwitchOnlineEvent());
                                        TwitchCache.instance().goOnlinePS();
                                    }).subscribe();
                                }
                                EventBus.instance().postAsync(new PubSubStreamUpEvent(chanid, srvtime, messageObj.getInt("play_delay")));
                                break;
                            case "stream-down":
                                if (chanid == this.channelId) {
                                    EventBus.instance().postAsync(new TwitchOfflineEvent());
                                    TwitchCache.instance().goOfflinePS();
                                }
                                EventBus.instance().postAsync(new PubSubStreamDownEvent(chanid, srvtime));
                                break;
                            case "viewcount":
                                if (chanid == this.channelId) {
                                    TwitchCache.instance().updateViewerCount(messageObj.getInt("viewers"));
                                }
                                EventBus.instance().postAsync(new PubSubViewCountEvent(chanid, srvtime, messageObj.getInt("viewers")));
                                break;
                        }
                    } else if (dataObj.getString("topic").startsWith("following")) {
                        int chanid = Integer.parseInt(dataObj.getString("topic").substring(dataObj.getString("topic").lastIndexOf(".") + 1));
                        if (chanid == this.channelId) {
                            SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ssXXX");
                            Calendar c = Calendar.getInstance();
                            DataStore datastore = PhantomBot.instance().getDataStore();
                            if (!datastore.exists("followed", messageObj.getString("username"))) {
                                EventBus.instance().postAsync(new TwitchFollowEvent(messageObj.getString("username"), sdf.format(c.getTime())));
                                datastore.set("followed", messageObj.getString("username"), "true");
                            }
                            if (!datastore.exists("followedDate", messageObj.getString("username"))) {
                                datastore.set("followedDate", messageObj.getString("username"), sdf.format(c.getTime()));
                            }
                        }
                        EventBus.instance().postAsync(new PubSubFollowEvent(messageObj.getString("username"), messageObj.getString("user_id"), messageObj.getString("display_name")));
                    }
                }
            }
        }

        /**
         * Logs the messages we get from PubSub.
         *
         * @param message Message that we will log.
         */
        private void logModeration(String message) {
            if (PhantomBot.instance().getDataStore().GetString("chatModerator", "", "moderationLogs").equals("true")) {
                Logger.instance().log(Logger.LogType.Moderation, "[" + Logger.instance().logTimestamp() + "] " + message);
            }
        }

        /**
         * Sends the topic subscription requests
         *
         * @param type The topics to subscribe to
         * @param nonce The nonce for the request
         */
        private void subscribeToTopics(String[] type, String nonce) {
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
         * Handles the event of when the socket opens, it also sends the login information and the topics we can to listen to.
         */
        private void onOpen() {
            try {
                com.gmt2001.Console.debug.println("Connected to Twitch PubSub-Edge (SSL) [" + this.uri.getHost() + "]");

                if (TwitchValidate.instance().hasAPIScope("channel:moderate")) {
                    String[] type = new String[]{"chat_moderator_actions." + (TwitchValidate.instance().getAPIUserID().equalsIgnoreCase("" + this.channelId) ? this.channelId : this.botId) + "." + this.channelId};
                    this.subscribeToTopics(type, "moderator");
                    com.gmt2001.Console.out.println("Requesting Twitch Moderation Data Feed");
                }

                if (TwitchValidate.instance().hasAPIScope("channel:read:redemptions")) {
                    String[] type2 = new String[]{"channel-points-channel-v1." + this.channelId};
                    this.subscribeToTopics(type2, "redemptions");
                    com.gmt2001.Console.out.println("Requesting Twitch Channel Points Data Feed");
                }

                String[] type3 = new String[]{"video-playback-by-id." + this.channelId};
                this.subscribeToTopics(type3, "streamupdown");
                com.gmt2001.Console.out.println("Requesting Twitch Stream Up/Down Data Feed");

                String[] type4 = new String[]{"following." + this.channelId};
                this.subscribeToTopics(type4, "following");
                com.gmt2001.Console.out.println("Requesting Twitch Follow Data Feed");
            } catch (JSONException ex) {
                com.gmt2001.Console.err.logStackTrace(ex);
            }
        }

        /**
         * Handles the event of when the socket closes, this will also attempt to reconnect to PubSub when it happens.
         *
         * @param code The code of why the socket closed.
         * @param reason The reasons as why the socket closed.
         */
        private void onClose(int code, String reason) {
            com.gmt2001.Console.debug.println("Code [" + code + "] Reason [" + reason + "]");

            if (!this.hasModerator && !this.hasRedemptions) {
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
                    if (messageObj.getString("nonce").equalsIgnoreCase("moderator")) {
                        this.hasModerator = !(messageObj.has("error") && messageObj.getString("error").length() > 0);
                        com.gmt2001.Console.debug.println("Got chat_moderator_actions response " + this.hasModerator);
                        if (!this.hasModerator) {
                            com.gmt2001.Console.err.println("WARNING: This APIOauth token was rejected for Moderation Feed (You can ignore the error if you aren't using this feature)");
                            com.gmt2001.Console.debug.println("TwitchPubSubWS Error: " + messageObj.getString("error"));
                            return;
                        } else {
                            com.gmt2001.Console.out.println("Connected to Twitch Moderation Data Feed");
                        }
                    } else if (messageObj.getString("nonce").equalsIgnoreCase("redemptions")) {
                        this.hasRedemptions = !(messageObj.has("error") && messageObj.getString("error").length() > 0);
                        com.gmt2001.Console.debug.println("Got channel-points-channel-v1 response " + this.hasRedemptions);
                        if (!this.hasRedemptions) {
                            com.gmt2001.Console.err.println("WARNING: This APIOauth token was rejected for Channel Points (You can ignore the error if you aren't using this feature)");
                            com.gmt2001.Console.debug.println("TwitchPubSubWS Error: " + messageObj.getString("error"));
                            return;
                        } else {
                            com.gmt2001.Console.out.println("Connected to Twitch Channel Points Data Feed");
                        }
                    } else if (messageObj.getString("nonce").equalsIgnoreCase("streamupdown")) {
                        this.hasStreamupdown = !(messageObj.has("error") && messageObj.getString("error").length() > 0);
                        com.gmt2001.Console.debug.println("Got video-playback-by-id response " + this.hasStreamupdown);
                        if (!this.hasStreamupdown) {
                            com.gmt2001.Console.err.println("WARNING: This APIOauth token was rejected for Stream Up/Down");
                            com.gmt2001.Console.debug.println("TwitchPubSubWS Error: " + messageObj.getString("error"));
                            return;
                        } else {
                            com.gmt2001.Console.out.println("Connected to Twitch Stream Up/Down Data Feed");
                            Mono.delay(Duration.ofSeconds(10)).doFinally((SignalType s) -> {
                                TwitchCache.instance().syncStreamStatus();
                            }).subscribe();
                        }
                    } else if (messageObj.getString("nonce").equalsIgnoreCase("following")) {
                        this.hasFollowing = !(messageObj.has("error") && messageObj.getString("error").length() > 0);
                        com.gmt2001.Console.debug.println("Got following response " + this.hasFollowing);
                        if (!this.hasFollowing) {
                            com.gmt2001.Console.err.println("WARNING: This APIOauth token was rejected for Following");
                            com.gmt2001.Console.debug.println("TwitchPubSubWS Error: " + messageObj.getString("error"));
                            return;
                        } else {
                            com.gmt2001.Console.out.println("Connected to Twitch Follow Data Feed");
                        }
                    }
                    backoff.Reset();
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
