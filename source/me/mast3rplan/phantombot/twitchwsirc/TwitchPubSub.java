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
 * TwitchPubSub.java
 * @author ScaniaTV
 */

package me.mast3rplan.phantombot.twitchwsirc;

import com.google.common.collect.Maps;
import com.gmt2001.Logger;

import java.util.Timer;
import java.util.TimerTask;

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
import org.json.JSONObject;
import org.json.JSONArray;

import java.util.HashMap;
import java.util.Map;
import java.util.Map.Entry;

import me.mast3rplan.phantombot.PhantomBot;
import me.mast3rplan.phantombot.event.EventBus;
import me.mast3rplan.phantombot.event.irc.message.IrcChannelMessageEvent;
import me.mast3rplan.phantombot.event.moderation.*;

import java.net.URI;

public class TwitchPubSub {
    private static final Map<String, TwitchPubSub> instances = Maps.newHashMap();
    private final Map<String, String> messageCache = Maps.newHashMap();
    private final Map<String, Long> timeoutCache = Maps.newHashMap();
    private final int channelId;
    private final String oAuth;
    private final int botId;
    private TwitchPubSubWS twitchPubSubWS;
    private Boolean reconAllowed = true;
    private Long lastReconnect = 0L;

    /*
     * This starts the PubSub instance.
     *
     * @param {string}  channel    Name of the channel to start the instance on. As of right now you can onyl start one instance.
     * @param {int}     channelId  The channel user id.
     * @param {int}     botId      The bot user id.
     * @param {string}  oauth      The bots tmi oauth token.
     */
    public static TwitchPubSub instance(String channel, int channelId, int botId, String oAuth) {
        TwitchPubSub instance = instances.get(channel);

        if (instance == null) {
            instance = new TwitchPubSub(channelId, botId, oAuth);
            instances.put(channel, instance);
        }

        return instance;
    }

    /*
     * Constructor for the PubSub class.
     *
     * @param {string}  channel    Name of the channel to start the instance on. As of right now you can onyl start one instance.
     * @param {int}     channelId  The channel user id.
     * @param {int}     botId      The bot user id.
     * @param {string}  oauth      The bots tmi oauth token.
     */
    private TwitchPubSub(int channelId, int botId, String oAuth) {
        this.channelId = channelId;
        this.botId = botId;
        this.oAuth = oAuth;

        try {
            this.twitchPubSubWS = new TwitchPubSubWS(new URI("wss://pubsub-edge.twitch.tv"), this, channelId, botId, oAuth);
            if (!this.twitchPubSubWS.connectWSS(false)) {
                throw new Exception("Failed to connect to PubSub.");
            }
        } catch (Exception ex) {
            com.gmt2001.Console.err.println("TwitchPubSub connection error: " + ex.getMessage());
            System.exit(0);
        }
    }

    /*
     * @event IrcChannelMessageEvent
     */
    public void ircChannelMessageEvent(IrcChannelMessageEvent event) {
        if (messageCache.size() > 100) {
            messageCache.clear();
        }
        messageCache.put(event.getSender(), event.getMessage());
    }

    /*
     * Try to reconnect to the PubSub websocket when the connection is closed with some logic.
     */
    @SuppressWarnings("SleepWhileInLoop")
    private void reconnectWSS() {
        Boolean reconnected = false;

        while (!reconnected) {
            if (lastReconnect + 10000L <= System.currentTimeMillis() && reconAllowed) {
                lastReconnect = System.currentTimeMillis();
                try {
                    this.twitchPubSubWS.delete();
                    this.twitchPubSubWS = new TwitchPubSubWS(new URI("wss://pubsub-edge.twitch.tv"), this, channelId, botId, oAuth);
                    reconnected = this.twitchPubSubWS.connectWSS(true);
                } catch (Exception ex) {
                    com.gmt2001.Console.err.println("TwitchPubSub failed to reconnect: " + ex.getMessage());
                    System.exit(0);
                }
            }

            try {
                Thread.sleep(100);
            } catch (InterruptedException ex) {
                com.gmt2001.Console.debug.println("TwitchPubSub failed to sleep before reconnecting: " + ex.getMessage());
            }
        }
    }

    /*
     * Private class for the websocket.
     */
    private class TwitchPubSubWS extends WebSocketClient {
        private final TwitchPubSubWS twitchPubSubWS;
        private final TwitchPubSub twitchPubSub;
        private final Timer timer = new Timer("me.mast3rplan.phantombot.twitchwsirc.TwitchPubSub");
        private final int channelId;
        private final String oAuth;
        private final int botId;
        private final URI uri;

        /*
         * Constructor for the PubSubWS class.
         *
         * @param {string}  channel    Name of the channel to start the instance on. As of right now you can onyl start one instance.
         * @param {int}     channelId  The channel user id.
         * @param {int}     botId      The bot user id.
         * @param {string}  oauth      The bots tmi oauth token.
         */
        private TwitchPubSubWS(URI uri, TwitchPubSub twitchPubSub, int channelId, int botId, String oAuth) {
            super(uri, new Draft_17(), null, 5000);

            this.uri = uri;
            this.channelId = channelId;
            this.botId = botId;
            this.oAuth = oAuth;
            this.twitchPubSub = twitchPubSub;
            this.twitchPubSubWS = this;
            this.startTimer();

            try {
                SSLContext sslContext = SSLContext.getInstance("TLS");
                sslContext.init(null, null, null);
                SSLSocketFactory sslSocketFactory = sslContext.getSocketFactory();
                this.setSocket(sslSocketFactory.createSocket());
            } catch (Exception ex) {
                com.gmt2001.Console.err.println("TwitchPubSubWS failed to connect: " + ex.getMessage());
            }
        }

        /*
         * Closes this class.
         */
        public void delete() {
            close();
        }

        /*
         * Creates a connection with the PubSub websocket.
         *
         * @param {boolean}  reconnect  Changes the console log message from connection to reconnecting.
         * @return {Boolean}
         */
        public Boolean connectWSS(Boolean reconnect) {
            if (!reconnect) {
                com.gmt2001.Console.debug.println("Connecting to Twitch PubSub-Edge (SSL) [" + this.uri.getHost() + "]");
            } else {
                com.gmt2001.Console.debug.println("Reconnecting to Twitch PubSub-Edge (SSL) [" + this.uri.getHost() + "]");
            }
    
            try { 
                connect();
                return true;
            } catch (Exception ex) {
                com.gmt2001.Console.err.println("TwitchPubSubWS failed to connect: " + ex.getMessage());
                return false;
            }
        }
    
        /**
         * Used to start the ping timer for PubSub. Since PubSub does not send pings, we need to requests them to keep our connection opened.
         * We will send a PING request every 4.9 minutes. Twitch recommends every 5 minutes.
         */
        private void startTimer() {
            timer.schedule(new PingTask(), 7000, 294000);
        }
    
        /**
         * This purges the ping timer. It is used when the user tries to connect with a bad oauth token.
         */
        private void closeTimer() {
            timer.cancel();
            timer.purge();
        }
    
        /*
         * This function parses the message we get from PubSub. Since everything is sent in a jsonObject there is a bit of checks to do.
         *
         * @param {jsonObject}  message  Message we get from PubSub.
         */
        private void parse(JSONObject message) {
            JSONObject dataObj;
            JSONObject messageObj;
            JSONObject data;
    
            if (message.has("data")) {
                dataObj = message.getJSONObject("data");
                if (dataObj.has("message")) {
                    messageObj = new JSONObject(dataObj.getString("message"));
                    if (messageObj.has("data")) {
                        data = messageObj.getJSONObject("data");
                        if (data.has("moderation_action") && data.has("args") && data.has("created_by")) {
                            JSONArray args = data.getJSONArray("args");
                            String action = data.getString("moderation_action");
                            String creator = data.getString("created_by");
                            String args1 = args.getString(0);
                            String args2 = (args.length() == 2 || args.length() == 3 ? args.getString(1) : "");
                            String args3 = (args.length() == 3 ? args.getString(2) : "");
                            
                            if (timeoutCache.containsKey(data.getString("target_user_id")) && (timeoutCache.get(data.getString("target_user_id")) - System.currentTimeMillis()) > 0) {
                                return;
                            }

                            timeoutCache.put(data.getString("target_user_id"), System.currentTimeMillis() + 1500);
                            switch (action) {
                                case "timeout":
                                    this.log(args1 + " has been timed out by " + creator + " for " + args2 + " seconds. " + (args3.length() == 0 ? "" : "Reason: " + args3)); 
                                    EventBus.instance().post(new TimeoutEvent(args1, creator, System.currentTimeMillis(), args2, args3, (messageCache.containsKey(args1.toLowerCase()) ? messageCache.get(args1.toLowerCase()) : "")));
                                    break;
                                case "untimeout":
                                    this.log(args1 + " has been un-timed out by " + creator + ".");
                                    EventBus.instance().post(new UnTimeoutEvent(args1, creator, System.currentTimeMillis()));
                                    break;
                                case "ban":
                                    this.log(args1 + " has been banned by " + creator + ". " + (args2.length() == 0 ? "" : "Reason: " + args2));
                                    EventBus.instance().post(new BannedEvent(args1, creator, System.currentTimeMillis(), args2, (messageCache.containsKey(args1.toLowerCase()) ? messageCache.get(args1.toLowerCase()) : "")));
                                    break;
                                case "unban":
                                    this.log(args1 + " has been un-banned by " + creator + ".");
                                    EventBus.instance().post(new UnBannedEvent(args1, creator, System.currentTimeMillis()));
                                    break;
                                case "mod":
                                    this.log(args1 + " has been modded by " + creator + ".");
                                    break;
                                case "unmod":
                                    this.log(args1 + " has been un-modded by " + creator + ".");
                                    break;
                                case "twitchbot_rejected":
                                    this.log("Message (" + args2 + ") from " + args1 + " has been rejected by AutoMod.");
                                    break;
                                case "denied_twitchbot_message":
                                    this.log(creator + " denied a message from " + args1 + ". Message id: " + data.getString("msg_id") + ".");
                                    break;
                                case "approved_twitchbot_message":
                                    this.log(creator + " allowed a message from " + args1 + ". Message id: " + data.getString("msg_id") + ".");
                                    break;
                            }
                        }
                    }
                }
            }
        }
    
        /* 
         * Logs the messages we get from PubSub.
         *
         * @param {String}  message  Message that we will log.
         */
        private void log(String message) {
            if (PhantomBot.instance().getDataStore().GetString("chatModerator", "", "moderationLogs").equals("true")) {
                Logger.instance().log(Logger.LogType.Moderation, "[" + Logger.instance().logTimestamp() + "] " + message);
            }
        }
    
        /*
         * Handles the event of when the socket opens, it also sends the login information and the topics we can to listen to. 
         */
        @Override
        public void onOpen(ServerHandshake handshakedata) {
            com.gmt2001.Console.debug.println("Connected to Twitch PubSub-Edge (SSL) [" + this.uri.getHost() + "]");
            com.gmt2001.Console.out.println("Connected to Twitch Moderation Data Feed");


            String[] type = new String[] {"chat_moderator_actions." + botId + "." + channelId};
            JSONObject jsonObject = new JSONObject();
            JSONObject topics = new JSONObject();
    
            topics.put("topics", type);
            topics.put("auth_token", oAuth.replace("oauth:", ""));
            jsonObject.put("type", "LISTEN");
            jsonObject.put("data", topics);
    
            send(jsonObject.toString());
        }
    
        /*
         * Handles the event of when the socket closes, this will also attempt to reonnect to PubSub when it happens.
         *
         * @param {int}      code    The code of why the socket closed.
         * @param {string}   reason  The reasons as why the socket closed.
         * @param {boolean}  remote  Says if its a remote issue or not.
         */
        @Override
        public void onClose(int code, String reason, boolean remote) {
            com.gmt2001.Console.debug.println("Code [" + code + "] Reason [" + reason + "] Remote Hangup [" + remote + "]");
            com.gmt2001.Console.out.println("Lost connection to Twitch Moderation Data Feed, retrying in 10 seconds");
            
            closeTimer();
            twitchPubSub.reconnectWSS();
        }
    
        /*
         * Handles the error event we can get from the socket. It will also print it in the console.
         *
         * @param {Exception}  ex  Exception message that the socket sent.
         */
        @Override
        public void onError(Exception ex) {
            if (!ex.toString().contains("ArrayIndexOutOfBoundsException")) {
                com.gmt2001.Console.debug.println("TwitchPubSubWS Exception: " + ex);
            }
        }
    
        /*
         * Handles the event of when we get messages from the socket.
         *
         * @param {String}  message  Message the socket sent.
         */
        @Override
        public void onMessage(String message) {
            JSONObject messageObj = new JSONObject(message);
    
            com.gmt2001.Console.debug.println("[PubSub Raw Message] " + messageObj);
    
            if (!messageObj.has("type")) {
                return;
            }
    
            if (messageObj.has("error") && messageObj.getString("error").length() > 0) {
                com.gmt2001.Console.err.println("TwitchPubSubWS Error: " + messageObj.getString("error"));
                reconAllowed = false;
                return;
            }
    
            if (messageObj.getString("type").equalsIgnoreCase("pong")) {
                com.gmt2001.Console.debug.println("TwitchPubSubWS: Got a PONG.");
            }
    
            if (messageObj.getString("type").equalsIgnoreCase("message")) {
                parse(messageObj);
            }
        }
    
        /**
         * Class for the PING timer. Since PubSub doesn't send PINGS we need to request them.
         */
        private class PingTask extends TimerTask {
            @Override
            public void run() {
                JSONObject jsonObject = new JSONObject();
    
                jsonObject.put("type", "PING");
    
                send(jsonObject.toString());
                com.gmt2001.Console.debug.println("TwitchPubSubWS: Sent a PING.");
            }
        }
    }
}
