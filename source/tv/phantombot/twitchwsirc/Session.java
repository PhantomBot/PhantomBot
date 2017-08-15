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

/*
 * @author illusionaryone
 */
package tv.phantombot.twitchwsirc;

import tv.phantombot.twitchwsirc.TwitchWSIRC;
import tv.phantombot.twitchwsirc.Channel;
import tv.phantombot.event.EventBus;
import tv.phantombot.PhantomBot;

import org.java_websocket.WebSocket;

import java.net.InetSocketAddress;

import java.util.concurrent.ConcurrentLinkedQueue;
import java.util.concurrent.LinkedBlockingDeque;
import java.util.concurrent.BlockingDeque;
import java.util.TimerTask;
import java.util.HashMap;
import java.util.Timer;
import java.util.Map;

import java.net.URI;

public class Session implements Runnable {
    private static final Map<String, Session> instances = new HashMap<>();
    private final ConcurrentLinkedQueue<Message> messages = new ConcurrentLinkedQueue<>();
    private final BlockingDeque<Message> queue = new LinkedBlockingDeque<>();
    private final Thread thread;
    private Boolean isKilled = false;
    private Boolean sendMessages = false;
    private TwitchWSIRC twitchWSIRC;
    private long lastReconnect = 0;
    private int chatLineCtr = 0;
    private String channelName;
    private EventBus eventBus;
    private Channel channel;
    private String botName;
    private int writes = 0;
    private String oAuth;
    
    /*
     * Method to start and get this instance.
     *
     * @param  {Channel} channel
     * @param  {String} channelName
     * @param  {String} botName
     * @param  {String} oAuth
     * @param  {EventBus} eventBus
     * @return {Object}
     */
    public static Session instance(Channel channel, String channelName, String botName, String oAuth, EventBus eventBus) {
        Session instance = instances.get(botName);
        
        if (instance == null) {
            instance = new Session(channel, channelName, botName, oAuth, eventBus);
            instances.put(botName, instance);
        }
        return instance;
    }

    /*
     * Class constructor
     *
     * @param  {Channel} channel
     * @param  {String} channelName
     * @param  {String} botName
     * @param  {String} oAuth
     * @param  {EventBus} eventBus
     * @return {Object}
     */
    private Session(Channel channel, String channelName, String botName, String oAuth, EventBus eventBus) {
        this.channelName = channelName.toLowerCase();
        this.eventBus = eventBus;
        this.channel = channel;
        this.botName = botName;
        this.oAuth = oAuth;

        Thread.setDefaultUncaughtExceptionHandler(com.gmt2001.UncaughtExceptionHandler.instance());

        // Start a new thread for our final queue.
        this.thread = new Thread(this, "tv.phantombot.twitchwsirc.Session::run");
        this.thread.setUncaughtExceptionHandler(com.gmt2001.UncaughtExceptionHandler.instance());
        this.thread.start();

        try {
            this.twitchWSIRC = TwitchWSIRC.instance(new URI("wss://irc-ws.chat.twitch.tv"), channelName, botName, oAuth, channel, this, eventBus);
            if (!this.twitchWSIRC.connectWSS(false)) {
                throw new Exception("Error when connecting to Twitch.");
            }
        } catch (Exception ex) {
            com.gmt2001.Console.err.println("Failed to create a new TwitchWSIRC instance: " + ex.getMessage());
            System.exit(0);
        }
    }

    /*
     * @function reconnect
     */
    public void reconnect() {
        Boolean reconnected = false;
        sendMessages = false;

        while (!reconnected) {
            if (lastReconnect + 10000L <= System.currentTimeMillis()) {
                lastReconnect = System.currentTimeMillis();
                try {
                    this.twitchWSIRC.delete();
                    this.twitchWSIRC = TwitchWSIRC.instance(new URI("wss://irc-ws.chat.twitch.tv"), channelName, botName, oAuth, channel, this, eventBus);
                    reconnected = this.twitchWSIRC.connectWSS(true);
                    sendMessages = reconnected;
                } catch (Exception ex) {
                    com.gmt2001.Console.err.println("Error when reconnecting to Twitch: " + ex.getMessage());
                    System.exit(0);
                }
            }
            try {
                Thread.sleep(500);
            } catch (InterruptedException ex) {
                com.gmt2001.Console.debug.println("Sleep failed during reconnect: " + ex.getMessage());
            }
        }
    }

    /*
     * Method that starts the queue timers
     */
    public void startTimers() {
        if (PhantomBot.useMessageQueue) {
            new Timer("tv.phantombot.twitchwsirc.Session::MessageHandler").schedule(new MessageHandler(this), 500, 1);
        } else {
            new Timer("tv.phantombot.twitchwsirc.Session::MessageHandlerNoLimit").schedule(new MessageHandlerNoLimit(this), 500, 1);  
        }
    }

    /*
     * Method that gets the bot name.
     *
     * @return {String}
     */
    public String getNick() {
        return this.botName.toLowerCase();
    }

    /*
     * Method that returns this object.
     *
     * @return {Session}
     */
    public Session getSession() {
        return this;
    }

    /*
     * Method that sets if we are allowed to send messages.
     *
     * @param {Boolean} sendMessages
     */
    public void setAllowSendMessages(boolean sendMessages) {
        this.sendMessages = sendMessages;
    }

    /*
     * Method that says if we are allowed to send messages.
     *
     * @return {Boolean}
     */
    public boolean getAllowSendMessages() {
        return this.sendMessages;
    }

    /*
     * Method that closes our connection with Twitch.
     */
    public void close() {
        twitchWSIRC.delete();
    }

    /*
     * Method that gets the channel object.
     *
     * @return {Channel}
     */
    public Channel getChannel(String dummy) {
        return this.channel; 
    }

    /*
     * Method that increases the current chat lines.
     */
    public void chatLinesIncr() {
        this.chatLineCtr++;
    }

    /*
     * Method that resets the current chat lines
     */
    public void chatLinesReset() {
        this.chatLineCtr = 0;
    }

    /*
     * Method that gets the current chat lines.
     *
     * @return {Int}
     */
    public int chatLinesGet() {
        return this.chatLineCtr;
    }

    /*
     * Method that gets how many messages we have send in a 30 second periode.
     *
     * @return {int}
     */
    public int getWrites() {
        return this.writes;
    }

    /*
     * Method that queues messages in the normal queue.
     *
     * @param {String} message
     */
    public void say(String message) {
        messages.add(new Message(message, false));
    }

    /*
     * Method to that sends a message to the final queue right away.
     *
     * @param {String} message
     */
    public void sayNow(String message) {
        queue.addFirst(new Message(message, message.startsWith(".")));
    }

    /*
     * Method that sends messages without printing anything in the console.
     *
     * @param {String} message
     */
    public void saySilent(String message) {
        twitchWSIRC.send("PRIVMSG #" + channelName + " :" + message);
    }

    /*
     * Method that sends messages and prints it in the console.
     *
     * @param {String} message
     */
    public void send(String message) {
        twitchWSIRC.send("PRIVMSG #" + channelName + " :" + message);
        com.gmt2001.Console.out.println("[CHAT] " + message);
    }

    /*
     * @class Message
     */
    private class Message {
        private final Boolean hasPriority;
        private final String message;

        public Message(String message, Boolean hasPriority) {
            this.message = message;
            this.hasPriority = hasPriority;
        }
    }

    /*
     * Run method. This is the final queue messages to through
     */
    @Override
    public void run() {
        long lastWrite = System.currentTimeMillis();
        long nextWrite = System.currentTimeMillis();
        Message message;
        long time = 0;

        while (!isKilled) {
            try {
                // Take an item from the queue, block if nothing is in it.
                message = queue.take();
                // Set the current time.
                time = System.currentTimeMillis();
                
                // if the message is a timeout, and we sent less than 100, send the timeout.
                if (sendMessages && (nextWrite < time || (message.hasPriority && writes < 99))) {
                    if (lastWrite > time) {
                        if (writes > 18 && !message.hasPriority) {
                            nextWrite = (time + (lastWrite - time));
                            continue;
                        }
                        writes++;
                    } else {
                        writes = 0;
                        lastWrite = (time + 30200);
                    }
    
                    send(message.message);
                }
            } catch (Exception ex) {
                ex.printStackTrace();
            }
        }
    }

    /*
     * @class MessageHandler
     */
    private class MessageHandler extends TimerTask {
        private final Session session;
        private long lastWrite = 0;
        private double limit = PhantomBot.getMessageInterval();

        public MessageHandler(Session session) {
            this.session = session;
        }

        @Override
        public void run() {
            if (System.currentTimeMillis() - lastWrite >= limit) {
                Message message = this.session.messages.poll();
                if (message != null) {
                    this.session.queue.add(new Message(message.message, false));
                    lastWrite = System.currentTimeMillis();
                }
            }
        }
    }

    /*
     * @class MessageHandlerNoLimit
     */
    private class MessageHandlerNoLimit extends TimerTask {
        private final Session session;

        public MessageHandlerNoLimit(Session session) {
            this.session = session;
        }

        @Override
        public void run() {
            Message message = this.session.messages.poll();
            if (message != null) {
                this.session.queue.add(new Message(message.message, false));
            }
        }
    }

    /*
     * Method that emits a fake message.
     */
    public void fakeTwitchMessage(String message) {
        twitchWSIRC.onMessage(message);
    }

    /*
     * Method to kill this.
     */
    public void kill() {
        this.sendMessages = false;
        this.isKilled = true;
    }
}
