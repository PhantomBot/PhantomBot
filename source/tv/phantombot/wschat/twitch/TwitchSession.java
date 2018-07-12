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
package tv.phantombot.wschat.twitch;

import java.net.URI;
import java.net.URISyntaxException;
import java.nio.channels.NotYetConnectedException;
import tv.phantombot.wschat.twitch.TwitchWSIRC;

import tv.phantombot.wschat.twitch.chat.utils.MessageQueue;

public class TwitchSession extends MessageQueue {
    private static TwitchSession instance;
    private final String botName;
    private final String channelName;
    private final String oAuth;
    private TwitchWSIRC twitchWSIRC;
    private long lastReconnect = 0;

    /*
     * Method that return this instance.
     *
     * @param  {String} channelName
     * @param  {String} botName
     * @param  {String} oAuth
     * @return {TwitchSession}
     */
    public static TwitchSession instance(String channelName, String botName, String oAuth) {
        if (instance == null) {
            instance = new TwitchSession(channelName, botName, oAuth);
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
    private TwitchSession(String channelName, String botName, String oAuth) {
        super(channelName);

        this.channelName = channelName;
        this.botName = botName;
        this.oAuth = oAuth;
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
     * Method that sends a raw message to the socket.
     *
     * @param {String} message
     */
    public void sendRaw(String message) {
        try {
            this.twitchWSIRC.send(message);
        } catch (NotYetConnectedException ex) {
            com.gmt2001.Console.debug.println("Failed to send message to Twitch: " + ex.getMessage());
        }
    }

    /*
     * Method that sends channel message.
     *
     * @param {String} message
     */
    public void send(String message) {
        sendRaw("PRIVMSG #" + getChannelName() + " :" + message);
    }

    /*
     * Method that will do the moderation check of the bot.
     */
    public void getModerationStatus() {
       send(".mods");
    }

    /*
     * Method that creates a connection with Twitch.
     */
    public TwitchSession connect() {
        // Start the write queue.
        this.start(this);
        
        // Connect to Twitch.
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
    @SuppressWarnings("SleepWhileInLoop")
    public void reconnect() {
        // Do not try to send messages anymore.
        this.setAllowSendMessages(false);
        // Variable that will break the reconnect loop.
        boolean reconnected = false;

        while (!reconnected) {
            if (lastReconnect + 10000 <= System.currentTimeMillis()) {
                lastReconnect = System.currentTimeMillis();
                try {
                    // Close the connection and destroy the class.
                    this.twitchWSIRC.close();
                    // Create a new connection.
                    this.twitchWSIRC = new TwitchWSIRC(new URI("wss://irc-ws.chat.twitch.tv"), channelName, botName, oAuth, this);
                    // Check if we are reconnected.
                    reconnected = this.twitchWSIRC.connectWSS(true);
                    // If we are connected, allow us the send messages again.
                    this.setAllowSendMessages(reconnected);
                } catch (URISyntaxException ex) {
                    com.gmt2001.Console.err.println("Error when reconnecting to Twitch [" + ex.getClass().getSimpleName() + "]: " + ex.getMessage());
                }
            }
            // Sleep for 5 seconds.
            try {
                Thread.sleep(5000);
            } catch (InterruptedException ex) {
                com.gmt2001.Console.debug.println("Sleep failed during reconnect [InterruptedException]: " + ex.getMessage());
            }
        }
    }

    /*
     * Method that stops everyting for TwitchWSIRC, there's no going back after this.
     */
    public void close() {
        // Kill the message queue.
        this.kill();
        // Send quit command to Twitch to exit correctly.
        sendRaw("QUIT");
        // Close connection.
        twitchWSIRC.close(1000, "bye");
    }
}