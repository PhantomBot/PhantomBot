/*
 * Copyright (C) 2016 phantombot.tv
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

/**
 * Twitch PubSub
 * @author: ScaniaTV
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
import java.util.ArrayList;

import me.mast3rplan.phantombot.PhantomBot;

import java.net.URI;

public class TwitchPubSub extends WebSocketClient {
	private static final Map<String, TwitchPubSub> instances = Maps.newHashMap();
	private final Timer timer = new Timer();
	private final URI uri;
	private Boolean reconnectAllowed = true;
	private Long lastReconnect;
	private int channelId;
	private int botId;
	private String oAuth;

	/**
	 * @function instance
	 * @info used to start this instance.
	 *
	 * @param {string} channel
	 * @param {int} channelId
	 * @param {string} oauth
	 */
	public static TwitchPubSub instance(String channel, int channelId, int botId, String oAuth) {
		TwitchPubSub instance = instances.get(channel);
		if (instance == null) {
			try {
			    instance = new TwitchPubSub(new URI("wss://pubsub-edge.twitch.tv"), channelId, botId, oAuth);
			    instances.put(channel, instance);
			} catch (Exception ex) {
                com.gmt2001.Console.err.println("Twitch PubSub-Edge URI Failed, PhantomBot will exit: " + ex.getMessage());
                System.exit(0);
			}
		}
		return instance;
	}

	/**
	 * @function TwitchPubSub
	 * @info used to start this class.
	 *
	 * @param {string} channel
	 * @param {int} channelId
	 * @param {string} oauth
	 */
	private TwitchPubSub(URI uri, int channelId, int botId, String oAuth) {
		super(uri, new Draft_17(), null, 5000);

		this.uri = uri;
		this.channelId = channelId;
		this.botId = botId;
		this.oAuth = oAuth;

		this.connectWSS(false);
		this.startTimer();
	}

	/**
	 * @function connectWSS
	 * @info Used to connect and reconnect to pubsub.
	 *
	 * @param {boolean} reconnect
	 */
	private void connectWSS(Boolean reconnect) {
		if (!reconnect) {
		    com.gmt2001.Console.debug.println("Connecting to Twitch PubSub-Edge (SSL) [" + this.uri.getHost() + "]");
		} else {
			com.gmt2001.Console.out.println("Reconnecting to Twitch PubSub-Edge (SSL) [" + this.uri.getHost() + "]");
		}
		try {
		    SSLContext sslContext = SSLContext.getInstance("TLS");
            sslContext.init(null, null, null);
            SSLSocketFactory sslSocketFactory = sslContext.getSocketFactory();
            this.setSocket(sslSocketFactory.createSocket());
            this.connect();
        } catch (Exception ex) {
        	com.gmt2001.Console.err.println("Twitch PubSub-Edge failed to connect: " + ex.getMessage());
        }
	}

	/**
	 * @function reconnectWSS
	 * @info Used to reconnect to pubsub.
	 *
	 * @param {boolean} sleep
	 */
	private void reconnectWSS(Boolean sleep) {
		if (sleep) {
			try {
				Thread.sleep(10000);
			} catch (InterruptedException ex) {
				com.gmt2001.Console.err.println("Twitch PubSub-Edge: Failed to sleep before reconnecting: " + ex.getMessage());
			}
		}

		Long now = System.currentTimeMillis();

		if (lastReconnect + 10000L <= now && reconnectAllowed) {
			lastReconnect = now;
			try {
			    this.connectWSS(true);
			} catch (Exception ex) {
				com.gmt2001.Console.err.println("Twitch PubSub-Edge failed to reconnect: " + ex.getMessage());
			}
		}
	}

	/**
	 * @function startTimer
	 * @info Starts the ping timer since we need to send pings to pubsub.
	 *
	 */
	private void startTimer() {
		timer.schedule(new PingTask(), 5000, 294000);
	}

	/**
	 * @function closeTimer
	 * @info Stops the ping timers
	 *
	 */
	private void closeTimer() {
		timer.cancel();
        timer.purge();
	}

	/**
	 * @function parse
	 * @info Used to parse messages we get from pubsub
	 *
	 * @param {jsonObject} message
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
						String username = args.getString(0);
						String time = (args.length() == 2 || args.length() == 3 ? args.getString(1) : "");
						String reason = (args.length() == 3 ? args.getString(2) : "");

						switch (action) {
							case "timeout":
							    this.log(username + " has been timed out by " + creator + " for " + time + " seconds. " + (reason.length() == 0 ? "" : "Reason: " + reason)); 
							    break;
							case "untimeout":
							    this.log(username + " has been un-timed out by " + creator + ".");
							    break;
							case "ban":
							    this.log(username + " has been banned by " + creator + ". " + (time.length() == 0 ? "" : "Reason: " + time));
							    break;
							case "unban":
							    this.log(username + " has been un-banned by " + creator + ".");
							    break;
							case "mod":
							    this.log(username + " has been modded by " + creator + ".");
							    break;
							case "unmod":
							    this.log(username + " has been un-modded by " + creator + ".");
							    break;
							case "twitchbot_rejected":
							    this.log("Message (" + time + ") from " + username + " has been rejected by AutoMod.");
							    break;
							case "denied_twitchbot_message":
							    this.log(creator + " denied a message from " + username + ". Message id: " + data.getString("msg_id") + ".");
							    break;
							case "approved_twitchbot_message":
							    this.log(creator + " allowed a message from " + username + ". Message id: " + data.getString("msg_id") + ".");
							    break;
						}
					}
				}
			}
		}
	}

	/**
	 * @function log
	 * @info Used to log messages once they are parsed.
	 *
	 * @param {string} message
	 */
	private void log(String message) {
		if (PhantomBot.instance().getDataStore().GetString("chatModerator", "", "moderationLogs").equals("true")) {
		    Logger.instance().log(Logger.LogType.Moderation, "[" + Logger.instance().logTimestamp() + "] " + message);
		}
	}

	/**
	 * @function onOpen
	 * @info Used to get messages from the socket when it opens
	 *
	 * @param {ServerHandshake} handshakedata
	 */
	@Override
	public void onOpen(ServerHandshake handshakedata) {
		com.gmt2001.Console.debug.println("Connected to Twitch PubSub-Edge (SSL) [" + this.uri.getHost() + "]");
		com.gmt2001.Console.out.println("Connected to Twitch Moderation Data Feed");

		JSONObject jsonObject = new JSONObject();
		JSONObject topics = new JSONObject();
		String[] type = new String[] {"chat_moderator_actions." + botId + "." + channelId}; // listen as the bot in the channel.

		jsonObject.put("type", "LISTEN");
		topics.put("topics", type);
		topics.put("auth_token", oAuth.replace("oauth:", ""));
		jsonObject.put("data", topics);

		this.send(jsonObject.toString()); // Send the info to connect in a jsonObject.
	}

	/**
	 * @function onClose
	 * @info Used to get messages from the socket when it closes.
	 *
	 * @param {int} code
	 * @param {string} reason
	 * @param {boolean} remote
	 */
	@Override
	public void onClose(int code, String reason, boolean remote) {
		com.gmt2001.Console.out.println("Disconnected from Twitch PubSub-Edge");
		com.gmt2001.Console.debug.println("Code [" + code + "] Reason [" + reason + "] Remote Hangup [" + remote + "]");

		this.reconnectWSS(false);
	}

	/**
	 * @function onError
	 * @info Used to get messages from the socket when it errors
	 *
	 * @param {Exception} ex
	 */
	@Override
	public void onError(Exception ex) {
        if (!ex.toString().contains("ArrayIndexOutOfBoundsException")) {
            com.gmt2001.Console.debug.println("Twitch PubSub-Edge Exception: " + ex);
        }
    }

    /**
	 * @function onMessage
	 * @info Used to get messages from the socket.
	 *
	 * @param {String} message
	 */
	@Override
	public void onMessage(String message) {
		//com.gmt2001.Console.out.println("[Twitch PubSub-Edge Raw Message] " + message);

		JSONObject messageObj = new JSONObject(message);

		if (messageObj.has("type") && messageObj.getString("type").equalsIgnoreCase("reconnect")) {
			com.gmt2001.Console.debug.println("Twitch PubSub-Edge: Force reconnect required. (10 second sleep)");
			this.reconnectWSS(true);
			return;
		}

		if (messageObj.has("error") && messageObj.getString("error").length() > 0) {
			com.gmt2001.Console.err.println("Twitch PubSub-Edge Error: " + messageObj.getString("error"));
			reconnectAllowed = false;
			return;
		}

		if (messageObj.has("type") && messageObj.getString("type").equalsIgnoreCase("pong")) {
			com.gmt2001.Console.debug.println("Twitch PubSub-Edge: got a pong.");
		}

		if (messageObj.has("type") && messageObj.getString("type").equalsIgnoreCase("message")) {
		    this.parse(messageObj);
		}
	}

	/**
	 * @class PingTask
	 * @info Used to send pings to pubsub in json format.
	 *
	 */
	class PingTask extends TimerTask {
		@Override
		public void run() {
			JSONObject jsonObject = new JSONObject();

			jsonObject.put("type", "PING");

			send(jsonObject.toString()); // Send a ping in a jsonObject.
			com.gmt2001.Console.debug.println("Twitch PubSub-Edge: sent a ping.");
		}
	}
}
