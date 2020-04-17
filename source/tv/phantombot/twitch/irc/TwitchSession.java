/*
 * Copyright (C) 2016-2019 phantombot.tv
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
import java.nio.channels.NotYetConnectedException;
import org.java_websocket.exceptions.WebsocketNotConnectedException;
import java.util.concurrent.locks.ReentrantLock;
import tv.phantombot.PhantomBot;

import tv.phantombot.twitch.irc.chat.utils.MessageQueue;

public class TwitchSession extends MessageQueue {
    private static TwitchSession instance;
    private final String botName;
    private final String channelName;
    private final String oAuth;
    private TwitchWSIRC twitchWSIRC;
    private final ReentrantLock lock = new ReentrantLock();
    private final ReentrantLock lock2 = new ReentrantLock();
    private static final long MAX_BACKOFF = 300000L;
    private long lastReconnect;
    private long nextBackoff = 1000L;

    /**
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

    private static TwitchSession instance() {
        return instance;
    }

    /**
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

    /**
     * Method that returns the channel name
     *
     * @return {String} channelName
     */
    public String getChannelName() {
        return this.channelName;
    }

    /**
     * Method that returns the bot name.
     *
     * @return {String} botName
     */
    public String getBotName() {
        return this.botName;
    }

    /**
     * Method that sends a raw message to the socket.
     *
     * @param {String} message
     */
    public void sendRaw(String message) {
        try {
            this.twitchWSIRC.send(message);
        } catch (NotYetConnectedException  ex) {
            com.gmt2001.Console.err.println("Failed to send message to Twitch [NotYetConnectedException]: " + ex.getMessage());
        } catch (WebsocketNotConnectedException ex) {
            reconnect();
            com.gmt2001.Console.err.println("Failed to send message to Twitch [WebsocketNotConnectedException]: " + ex.getMessage());
        } catch (Exception ex) {
            com.gmt2001.Console.err.println("Failed to send message to Twitch [" + ex.getClass().getSimpleName() + "]: " + ex.getMessage());
        }
    }

    /**
     * Method that sends channel message.
     *
     * @param {String} message
     */
    public void send(String message) {
        sendRaw("PRIVMSG #" + getChannelName() + " :" + message);
    }

    /**
     * Method that will do the moderation check of the bot.
     */
    public void getModerationStatus() {
       send(".mods");
    }

    /**
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
            com.gmt2001.Console.err.println("Fehler beim Erstellen einer neuen TwitchWSIRC-Instanz: " + ex.getMessage());
        }
        return this;
    }

    /**
     * Method that handles reconnecting with Twitch.
     */
    public void reconnect() {
        // Do not try to send messages anymore.
        this.setAllowSendMessages(false);
        if (lock.isLocked() || PhantomBot.instance().isExiting()) {
            return;
        }

        lock.lock();
        try {
            new Thread(() -> {
                TwitchSession.instance().doReconnect();
            }).start();
        } finally {
            lock.unlock();
        }
    }

    public void doReconnect() {
        if (lock2.tryLock()) {
            try {
                long now = System.currentTimeMillis();

                if (lastReconnect + (MAX_BACKOFF * 2) < now) {
                    nextBackoff = 1000L;
                } else {
                    com.gmt2001.Console.out.println("Delaying next connection attempt to prevent spam, " + (nextBackoff / 1000) + " seconds...");
                    com.gmt2001.Console.warn.println("Delaying next reconnect " + (nextBackoff / 1000) + " seconds...", true);
                    Thread.sleep(nextBackoff);
                }

                lastReconnect = now;
                nextBackoff = Math.min(MAX_BACKOFF, nextBackoff * 2L);

                this.twitchWSIRC.reconnectBlocking();

                // Should be connected now.
                this.setAllowSendMessages(true);
            } catch (InterruptedException ex) {
                com.gmt2001.Console.err.printStackTrace(ex);
            } finally {
                lock2.unlock();
            }
        }
    }

    /**
     * Method that stops everything for TwitchWSIRC, there's no going back after this.
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
