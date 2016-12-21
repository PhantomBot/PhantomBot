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

/*
 * TwitchPubSub.java
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

import me.mast3rplan.phantombot.PhantomBot;

import java.net.URI;

public class TwitchPubSub extends WebSocketClient {
	private static final Map<String, TwitchPubSub> instances = Maps.newHashMap();
	private final Timer timer = new Timer();
	private final URI uri;
	private final int channelId;
	private final int botId;
	private final String oAuth;
	private Boolean reconAllowed;
	private Long lastReconnect;

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

	/*
	 * Constructor for the PubSub class.
	 *
	 * @param {string}  channel    Name of the channel to start the instance on. As of right now you can onyl start one instance.
	 * @param {int}     channelId  The channel user id.
	 * @param {int}     botId      The bot user id.
	 * @param {string}  oauth      The bots tmi oauth token.
	 */
	private TwitchPubSub(URI uri, int channelId, int botId, String oAuth) {
		super(uri, new Draft_17(), null, 5000);

		this.uri = uri;
		this.channelId = channelId;
		this.botId = botId;
		this.oAuth = oAuth;
		this.reconAllowed = true;

		this.connectWSS(false);
		this.startTimer();
	}

	/*
	 * Creates a connection with the PubSub websocket.
	 *
	 * @param {boolean}  reconnect  Changes the console log message from connection to reconnecting.
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

	/*
	 * Try to reconnect to the PubSub websocket when the connection is closed with some logic.
	 *
	 * @param {boolean}  sleep  Adds a sleep timer when trying to reconnect so we don't try spam the socket.
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

		if (lastReconnect + 10000L <= now && reconAllowed) {
			lastReconnect = now;
			try {
			    this.connectWSS(true);
			} catch (Exception ex) {
				com.gmt2001.Console.err.println("Twitch PubSub-Edge failed to reconnect: " + ex.getMessage());
			}
		}
	}

	/**
	 * Used to start the ping timer for PubSub. Since PubSub does not send pings, we need to requests them to keep our connection opened.
	 * We will send a PING request every 4.9 minutes. Twitch recommends every 5 minutes.
	 */
	private void startTimer() {
		timer.schedule(new PingTask(), 5000, 294000);
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

						switch (action) {
							case "timeout":
							    this.log(args1 + " has been timed out by " + creator + " for " + args2 + " seconds. " + (args3.length() == 0 ? "" : "Reason: " + args3)); 
							    break;
							case "untimeout":
							    this.log(args1 + " has been un-timed out by " + creator + ".");
							    break;
							case "ban":
							    this.log(args1 + " has been banned by " + creator + ". " + (args2.length() == 0 ? "" : "Reason: " + args2));
							    break;
							case "unban":
							    this.log(args1 + " has been un-banned by " + creator + ".");
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
		com.gmt2001.Console.out.println("Disconnected from Twitch PubSub-Edge.");
		
		this.reconnectWSS(false);
	}

	/*
	 * Handles the error event we can get from the socket. It will also print it in the console.
	 *
	 * @param {Exception}  ex  Exception message that the socket sent.
	 */
	@Override
	public void onError(Exception ex) {
        if (!ex.toString().contains("ArrayIndexOutOfBoundsException")) {
            com.gmt2001.Console.debug.println("Twitch PubSub-Edge Exception: " + ex);
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

		// com.gmt2001.Console.out.println("[PubSub Raw Message] " + messageObj);

		if (messageObj.has("type") && messageObj.getString("type").equalsIgnoreCase("reconnect")) {
			com.gmt2001.Console.debug.println("Twitch PubSub-Edge: Force reconnect required. (10 second delay)");
			this.reconnectWSS(true);
			return;
		}

		if (messageObj.has("error") && messageObj.getString("error").length() > 0) {
			com.gmt2001.Console.err.println("Twitch PubSub-Edge Error: " + messageObj.getString("error"));
			reconAllowed = false;
			return;
		}

		if (messageObj.has("type") && messageObj.getString("type").equalsIgnoreCase("pong")) {
			com.gmt2001.Console.debug.println("Twitch PubSub-Edge: Got a PONG.");
		}

		if (messageObj.has("type") && messageObj.getString("type").equalsIgnoreCase("message")) {
		    this.parse(messageObj);
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
			com.gmt2001.Console.debug.println("Twitch PubSub-Edge: Sent a PING.");
		}
	}
}
