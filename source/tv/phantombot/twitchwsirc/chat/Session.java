/*
 * Copyright (C) 2016-2017 phantombot.tv
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
package tv.phantombot.twitchwsirc.chat;

import java.net.URI;

import tv.phantombot.twitchwsirc.chat.utils.MessageQueue;
import tv.phantombot.twitchwsirc.chat.TwitchWSIRC;

public class Session extends MessageQueue {
	private static Session instance;
	private final String botName;
	private final String channelName;
	private final String oAuth;
	private TwitchWSIRC twitchWSIRC;

	/*
	 * Method that return this instance.
	 *
	 * @param  {String} channelName
	 * @param  {String} botName
	 * @param  {String} oAuth
	 * @return {Session}
	 */
	public static Session instance(String channelName, String botName, String oAuth) {
		if (instance == null) {
			instance = new Session(channelName, botName, oAuth);
		}
		return instance;
	}

	/*
	 * Class constructor.
	 *
	 * @param  {String} channelName
	 * @param  {String} botName
	 * @param  {String} oAuth
	 */
	private Session(String channelName, String botName, String oAuth) {
		super(channelName);

		this.channelName = channelName;
		this.botName = botName;
		this.oAuth = oAuth;

		// Set the session for our message queue.
		this.setSession(this);
	}

	/*
	 * Method that returns the channel name
	 *
	 * @return {String} channelName
	 */
	public String getChannelName() {
		return this.channelName;
	}

	/*
	 * Method that returns the bot name.
	 *
	 * @return {String} botName
	 */
	public String getBotName() {
		return this.botName;
	}

	/*
	 * Method that returns the socket
	 *
	 * @return {TwitchWSIRC} twitchWSIRC
	 */
	public TwitchWSIRC getSocket() {
		return this.twitchWSIRC;
	}

	/*
	 * Method that will do the moderation check of the bot.
	 */
	public void getModerationStatus() {
		getSocket().send("PRIVMSG #" + getChannelName() + " :.mods");
	}

	/*
	 * Method that creates a connection with Twitch.
	 */
	public Session connect() {
		try {
			this.twitchWSIRC = new TwitchWSIRC(new URI("wss://irc-ws.chat.twitch.tv"), channelName, botName, oAuth, this);
			if (!this.twitchWSIRC.connectWSS(false)) {
                throw new Exception("Error when connecting to Twitch.");
            }
		} catch (Exception ex) {
			com.gmt2001.Console.err.println("Failed to create a new TwitchWSIRC instance: " + ex.getMessage());
		}
		return this;
	}

	/*
	 * Method that handles reconnecting with Twitch.
	 */
	public void reconnect() {
		// Do not try to send messages anymore.
		this.setAllowSendMessages(false);
		// Variable that will break the reconnect loop.
		boolean reconnected = false;

		while (!reconnected) {
			try {
				// Close the connection and destroy the class.
				this.twitchWSIRC.close();
				// Create a new connection.
				this.twitchWSIRC = new TwitchWSIRC(new URI("wss://irc-ws.chat.twitch.tv"), channelName, botName, oAuth, this);
				// Check if we are reconnected.
				reconnected = this.twitchWSIRC.connectWSS(true);
				// If we are connected, allow us the send messages again.
				this.setAllowSendMessages(reconnected);
			} catch (Exception ex) {
				com.gmt2001.Console.err.println("Error when reconnecting to Twitch [" + ex.getClass().getSimpleName() + "]: " + ex.getMessage());
			}
			// Sleep for 15 seconds.
			try {
				Thread.sleep(15000);
			} catch (InterruptedException ex) {
				com.gmt2001.Console.debug.println("Sleep failed during reconnect [InterruptedException]: " + ex.getMessage());
			}
		}
	}

	/*
	 * Method that stops everyting for TwitchWSIRC, there's no going back after this.
	 */
	public void close() {
		this.kill();
		twitchWSIRC.close(1000, "bye");
	}
}
