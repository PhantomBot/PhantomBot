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
 * @author illusionaryone
 */
package me.mast3rplan.phantombot.twitchwsirc;

import me.mast3rplan.phantombot.twitchwsirc.TwitchWSIRC;
import me.mast3rplan.phantombot.twitchwsirc.Channel;
import me.mast3rplan.phantombot.event.EventBus;
import me.mast3rplan.phantombot.PhantomBot;

import org.java_websocket.WebSocket;

import java.net.InetSocketAddress;

import java.util.concurrent.ConcurrentLinkedDeque;
import java.util.concurrent.ConcurrentLinkedQueue;
import java.util.TimerTask;
import java.util.HashMap;
import java.util.Timer;
import java.util.Map;

import java.net.URI;

public class Session {
    private static final Map<String, Session> instances = new HashMap<>();
    private final ConcurrentLinkedQueue<Message> messages = new ConcurrentLinkedQueue<>();
    private final ConcurrentLinkedDeque<Message> queue = new ConcurrentLinkedDeque<>();
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
     * @function instance
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
     * @function Session
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

        while (!reconnected) {
            if (lastReconnect + 10000L <= System.currentTimeMillis()) {
                lastReconnect = System.currentTimeMillis();
                try {
                    this.twitchWSIRC.delete();
                    this.twitchWSIRC = TwitchWSIRC.instance(new URI("wss://irc-ws.chat.twitch.tv"), channelName, botName, oAuth, channel, this, eventBus);
                    reconnected = this.twitchWSIRC.connectWSS(true);
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
     * @function startTimers
     */
    public void startTimers() {
        if (PhantomBot.useMessageQueue) {
            new Timer("me.mast3rplan.phantombot.twitchwsirc.Session::MessageHandler").schedule(new MessageHandler(this), 500, 1);
        } else {
            new Timer("me.mast3rplan.phantombot.twitchwsirc.Session::MessageHandlerNoLimit").schedule(new MessageHandlerNoLimit(this), 500, 1);  
        }
        new Timer("me.mast3rplan.phantombot.twitchwsirc.Session::QueueHandler").schedule(new QueueHandler(this), 500, 1);
    }

    /*
     * @function getNick
     *
     * @return {String}
     */
    public String getNick() {
        return this.botName.toLowerCase();
    }

    /*
     * @function getSession
     *
     * @return {Session}
     */
    public Session getSession() {
        return this;
    }

    /*
     * @function setAllowSendMessages
     *
     * @param {Boolean} sendMessages
     */
    public void setAllowSendMessages(Boolean sendMessages) {
        this.sendMessages = sendMessages;
    }

    /*
     * @function getAllowSendMessages
     *
     * @return {Boolean}
     */
    public Boolean getAllowSendMessages() {
        return this.sendMessages;
    }

    /*
     * @function close
     */
    public void close() {
        this.twitchWSIRC.delete();
    }

    /*
     * @function getChannel
     *
     * @return {Channel}
     */
    public Channel getChannel(String dummy) {
        return this.channel; 
    }

    /*
     * @function chatLinesIncr
     */
    public void chatLinesIncr() {
        this.chatLineCtr++;
    }

    /*
     * @function chatLinesReset
     */
    public void chatLinesReset() {
        this.chatLineCtr = 0;
    }

    /*
     * @function chatLinesGet
     *
     * @return {Int}
     */
    public int chatLinesGet() {
        return this.chatLineCtr;
    }

    /*
     * @function hasQueue
     *
     * @return {Boolean}
     */
    public Boolean hasQueue() {
        return this.messages.isEmpty();
    }

    /*
     * @function isLimited
     *
     * @return {Boolean}
     */
    public Boolean isLimited() {
        return this.writes > 7;
    }

    /*
     * @function say
     *
     * @param {String} message
     */
    public void say(String message) {
        if (message.startsWith(".timeout")) {
            this.queue.addFirst(new Message(message, true));
            return;
        }
        this.messages.add(new Message(message, false));
    }

    /*
     * @function saySilent
     *
     * @param {String} message
     */
    public void saySilent(String message) {
        if (this.twitchWSIRC.isOpen()) {
            this.twitchWSIRC.send("PRIVMSG #" + channelName + " :" + message);
        }
    }

    /*
     * @function send
     *
     * @param {String} message
     */
    public void send(String message) {
        if (this.twitchWSIRC.isOpen()) {
            this.twitchWSIRC.send("PRIVMSG #" + channelName + " :" + message);
            com.gmt2001.Console.out.println("[CHAT] " + message);
        }
    }

    /*
     * @class Message
     */
    private class Message {
        private final Boolean hasPriority;
        private final String message;
        private final long queueTime;

        public Message(String message, Boolean hasPriority) {
            this.message = message;
            this.hasPriority = hasPriority;
            this.queueTime = (System.currentTimeMillis() + 3000);
        }
    }

    /*
     * @class QueueHandler
     */
    private class QueueHandler extends TimerTask {
        private final Session session;
        private long lastWrite = System.currentTimeMillis();
        private long nextWrite = System.currentTimeMillis();
        private long time = 0;

        public QueueHandler(Session session) {
            this.session = session;
        }

        @Override
        public void run() {
            time = System.currentTimeMillis();

            if (!this.session.queue.isEmpty() && nextWrite < time) {
                if (lastWrite > time) {
                    if (writes == 19) {
                        nextWrite = (time + (lastWrite - time));
                        return;
                    }
                    writes++;
                } else {
                    writes = 1;
                    lastWrite = (time + 30200);
                }

                Message message = this.session.queue.poll();
                if (message != null && this.session.sendMessages && (message.queueTime > time || message.hasPriority)) {
                    this.session.send(message.message);
                    return;
                }
                writes--;
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
     * @function fakeTwitchMessage
     */
    public void fakeTwitchMessage(String message) {
        twitchWSIRC.onMessage(message);
    }
}
