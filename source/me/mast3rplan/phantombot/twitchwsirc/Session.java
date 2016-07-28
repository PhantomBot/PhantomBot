/*
 * Copyright (C) 2015 www.phantombot.net
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
 * Twitch WS-IRC Client
 * @author: illusionaryone
 */
package me.mast3rplan.phantombot.twitchwsirc;

import me.mast3rplan.phantombot.PhantomBot;
import me.mast3rplan.phantombot.twitchwsirc.Channel;
import me.mast3rplan.phantombot.twitchwsirc.TwitchWSIRC;
import me.mast3rplan.phantombot.event.EventBus;

import org.java_websocket.WebSocket;
import com.google.common.collect.Maps;

import java.util.Timer;
import java.util.TimerTask;
import java.util.HashMap;
import java.util.Map;
import java.util.Map.Entry;
import java.util.concurrent.ConcurrentLinkedQueue;
import java.util.concurrent.CopyOnWriteArrayList;

import java.net.URI;

public class Session {

    private static final Map<String, Session> instances = Maps.newHashMap();
    public static Session session;
    private TwitchWSIRC twitchWSIRC;
    private EventBus eventBus;
    private Channel channel;
    private String channelName;
    private String botName;
    private String oAuth;

    /* Message Queues for Throttling */
    private final Timer sayTimer = new Timer();
    private final ConcurrentLinkedQueue<Message> messages = new ConcurrentLinkedQueue<>();
    private final ConcurrentLinkedQueue<Message> sendQueue = new ConcurrentLinkedQueue<>();  // this would be the final queue

    /*
     * Creates an instance for a Session
     *
     * @param  botName  The name of the PhantomBot instance
     * @param  botName      Botname and name of the instance
     * @param  oAuth        OAUTH login
     * @param  Channel      Channel instance  
     * @param  eventBus     Eventbus
     */
    public static Session instance(Channel channel, String channelName, String botName, String oAuth, EventBus eventBus) {
        Session instance = instances.get(botName);
        if (instance == null) {
            instance = new Session(channel, channelName, botName, oAuth, eventBus);
            instances.put(botName, instance);
            session = instance;
            return instance;
        }
        return instance;
    }

    /*
     * Constructor for the Session object.
     *
     * @param  channelName  Twitch Channel
     * @param  botName      Botname and name of the instance
     * @param  oAuth        OAUTH login
     * @param  Channel      Channel instance  
     * @param  eventBus     Eventbus
     */ 
    private Session(Channel channel, String channelName, String botName, String oAuth, EventBus eventBus) {
        this.channelName = channelName;
        this.eventBus = eventBus;
        this.channel = channel;
        this.botName = botName;
        this.oAuth = oAuth;

        try {
            this.twitchWSIRC = TwitchWSIRC.instance(new URI("wss://irc-ws.chat.twitch.tv"), channelName, botName, oAuth, channel, this, eventBus);
            twitchWSIRC.connectWSS();
            sayTimer.schedule(new MessageTask(this), 100, 1);
            /* Create a timer for the final queue that sends data */
        } catch (Exception ex) {
            com.gmt2001.Console.err.println("TwitchWSIRC URI Failed: " + ex.getMessage());
        }
    }

    /*
     * Returns the IRC Nick (login) for this Session.
     *
     * @return  String  The name of the PhantomBot instance, also the Twitch login ID.
     */
    public String getNick() {
        return this.botName;
    }

    /*
     *
     * @return  Session  Returns the session
     */
    public Session getSession() {
        return session;
    }

    /*
     * Chat in the channel
     *
     * @param say
     */
    public void say(String message) {
        /* Here, would want to add directly to a queue that is throttled like doWrites() for .timeout. */
        messages.add(new Message(message));
    }

    /* Would want a function here called sendMessageQueue() or something for putting .timeouts in and the
     * regular messages.  This would call sendMessage() in the end and implement the logic from doWrites().
     */

    /*
     * Send a message over WSIRC
     *
     * @param  String  Message to send
     */
    public void sendMessage(String message) {
        twitchWSIRC.send("PRIVMSG #" + channelName + " :" + message);
        com.gmt2001.Console.out.println("[CHAT] " + message);
    }

    /* Returns the Channel object related to this Session.
     *
     * @return  Channel      The related Channel object.
     */
    public Channel getChannel(String dummy) {
        return this.channel; 
    }

    /* Would implement another thread for processing the sendMessageQueue() queue. */

    /* Message Throttling.  The following classes implement timers which work to ensure that PhantomBot
     * does not send messages too quickly.
     */
    class Message {
        public String message;

        public Message(String message) {
            this.message = message;
        }
    }
     
    class MessageTask extends TimerTask {
        private final Session session;
        private long lastMessage = 0;

        public MessageTask(Session session) {
            super();
            this.session = session;
            Thread.setDefaultUncaughtExceptionHandler(com.gmt2001.UncaughtExceptionHandler.instance());
        }

        @Override
        public void run() {
            if (PhantomBot.instance().isExiting()) {
                return;
            }

            long now = System.currentTimeMillis();
            if (now - lastMessage >= PhantomBot.instance().getMessageInterval()) {
                Message message = session.messages.poll();
                if (message != null) {
                    session.sendMessage(message.message);  // this would actually move the message object to the final send queue 
                    lastMessage = now;
                }
            }
        }
    }
}
