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
import java.io.IOException;
import java.net.InetSocketAddress;
import java.nio.channels.*;
import java.util.*;
import java.util.concurrent.ConcurrentLinkedQueue;
import java.util.concurrent.CopyOnWriteArrayList;

import java.net.URI;

public class Session {

    private static final Map<String, Session> instances = Maps.newHashMap();
    public static Session session;
    private final ConcurrentLinkedQueue<Message> messages = new ConcurrentLinkedQueue<>();
    private final ConcurrentLinkedQueue<Message> sendQueue = new ConcurrentLinkedQueue<>();
    private final Timer sayTimer = new Timer();
    private final Boolean alternateBurst;
    private Long lastWrite = System.currentTimeMillis(); //last time a message was sent.
    private Long nextWrite = System.currentTimeMillis(); //next time that we are allowed to write.
    private int burst = 1; //current messages being sent in 2.5 seconds.
    private Boolean sendMessages = false;
    private TwitchWSIRC twitchWSIRC;
    private EventBus eventBus;
    private Channel channel;
    private String channelName;
    private String botName;
    private String oAuth;
    private int chatLineCtr = 0;
    private Long lastTry = 0L;
    private Long lastModTry = 0L;

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
        this.channelName = channelName.toLowerCase();
        this.eventBus = eventBus;
        this.channel = channel;
        this.botName = botName;
        this.oAuth = oAuth;
        this.alternateBurst = PhantomBot.wsIRCAlternateBurst;

        try {
            this.twitchWSIRC = TwitchWSIRC.instance(new URI("wss://irc-ws.chat.twitch.tv"), channelName, botName, oAuth, channel, this, eventBus);
            if (!twitchWSIRC.connectWSS(false)) {
                com.gmt2001.Console.err.println("Unable to login to Twitch. PhantomBot will exit.");
                System.exit(0);
            }
        } catch (Exception ex) {
            com.gmt2001.Console.err.println("TwitchWSIRC URI Failed, PhantomBot will exit: " + ex.getMessage());
            System.exit(0);
        }
    }

    /*
     * Trys to reconnect to Twitch.
     */
    public void reconnect() {
        Boolean reconnected = false;

        while (!reconnected) {
            if (lastTry + 10000L <= System.currentTimeMillis()) {
                lastTry = System.currentTimeMillis();
                try {
                    this.twitchWSIRC.delete();
                    this.twitchWSIRC = TwitchWSIRC.instance(new URI("wss://irc-ws.chat.twitch.tv"), channelName, botName, oAuth, channel, this, eventBus);
                    reconnected = this.twitchWSIRC.connectWSS(true);
                } catch (Exception ex) {
                    com.gmt2001.Console.err.println("Failed to reconnect to TwitchWSIRC... PhantomBot will now exit: " + ex.getMessage());
                    System.exit(0);
                } 
            }
            try {
                Thread.sleep(1000);
            } catch (InterruptedException ex) {
                com.gmt2001.Console.debug.println("Sleep failed during reconnect: " + ex.getMessage());
            }
        }
    }

    /*
     * Starts the timers.
     *
     */
    public void startTimers() {
        sayTimer.schedule(new MessageTask(this), 100, 1); // start a timer queue for normal messages.
        if (alternateBurst) {
            sayTimer.schedule(new SendMsgAlternate(), 100, 1); // start a timer for the final queue for the timeouts and messages.
        } else {
            sayTimer.schedule(new SendMsg(), 100, 1); // start a timer for the final queue for the timeouts and messages.
        }
    }

    /*
     * leaves the channel.
     *
     */
    private void leave() {
        twitchWSIRC.send("PART #" + channelName.toLowerCase());
    }

    /*
     * joins the channel.
     *
     */
    private void join() {
        twitchWSIRC.send("JOIN #" + channelName.toLowerCase());
    }

    /*
     * rejoins the channel. used with $.session in init.js and for the RECONNECT event from Twitch.
     *
     */
    public void rejoin() {
        leave();
        join();
        com.gmt2001.Console.out.println("Channel Joined [#" + channelName + "]");
    }

    /*
     * Returns the IRC Nick (login) for this Session.
     *
     * @return  String  The name of the PhantomBot instance, also the Twitch login ID.
     */
    public String getNick() {
        return this.botName.toLowerCase();
    }

    /*
     *
     * @return  Session  Returns the session
     */
    public Session getSession() {
        return session;
    }

    /*
     * Set if messages are allowed to be sent to Twitch WSIRC.
     *
     * @param  Boolean  Are messages allowed to be sent?
     */
    public void setAllowSendMessages(Boolean sendMessages) {
        this.sendMessages = sendMessages;
    }

    /*
     * Can messages be sent to WSIRC?
     *
     * @return  Boolean  Are messages allowed to be sent?
     */
    public Boolean getAllowSendMessages() {
        return sendMessages;
    }

    /*
     * Close the connection to WSIRC.
     */
    public void close() {
        this.twitchWSIRC.delete();
    }
    public void close(String channelName) {
        this.twitchWSIRC.delete(channelName);
    }

    /*
     * Chat in the channel
     *
     * @param message
     */
    public void say(String message) {
        if (message.startsWith(".timeout ")) { //check if the message starts with a "." for timeouts. ".timeout <user>".
            sendQueue.add(new Message(message));
            return;
        }
        messages.add(new Message(message));
    }

    /*
     * Chat in the channel without anything showing in the console. used for .mods atm.
     *
     * @param message
     */
    public void saySilent(String message) {
        twitchWSIRC.send("PRIVMSG #" + channelName + " :" + message);
    }

    /*
     * Send a message over WSIRC
     */
    public void sendWSMessages() {
        if (sendQueue.isEmpty() || nextWrite > System.currentTimeMillis()) { // check to make sure the queue is not empty, and make sure we are not sending too many messages too fast.
            return;
        }
        if (System.currentTimeMillis() - lastWrite < 2500) { // Only thing that could trigger this are timeouts. Normal messages wont even come close to this limit.
            if (burst == 19) {
                nextWrite = System.currentTimeMillis() + 30500; // wait 30.5 seconds in case we ever hit 19 messages. then burst them out at a max of 19 in 30 seconds.
                burst = 1;
                return;
            }
            burst++;//add messages being sent in 2.5 seconds.
        } else {
            burst = 1;
            lastWrite = System.currentTimeMillis();
        }

        Message message = session.sendQueue.poll();
        if (message != null && sendMessages) { //make sure the message is not null, and make sure we are allowed to send messages.
            twitchWSIRC.send("PRIVMSG #" + channelName + " :" + message.message);// send the message to Twitch.
            com.gmt2001.Console.out.println("[CHAT] " + message.message);//print the message in the console once its sent to Twitch.
        } else {
            if (!sendMessages && message != null) {
                com.gmt2001.Console.out.println();
                com.gmt2001.Console.out.println("[ERROR] " + getNick() + " is not detected as a moderator!");
                if (lastModTry + 60000 <= System.currentTimeMillis()) {
                    lastModTry = System.currentTimeMillis();
                    com.gmt2001.Console.out.println("[INFO] Trying to automatically detect moderator status now.");
                    saySilent(".mods");
                } else {
                    com.gmt2001.Console.out.println("[INFO] Will try to automatically detect moderator status in 60 seconds.");
                }
                com.gmt2001.Console.out.println();
            }
        }
    }

    /*
     * Send a message over WSIRC
     */
    private void sendWSMessagesAlternate() {
        if (sendQueue.isEmpty() || nextWrite > System.currentTimeMillis()) {
            return;
        }
        if (System.currentTimeMillis() - lastWrite < 3000) {
            if (burst == 5) {
                nextWrite = System.currentTimeMillis() + 8000;
                burst = 1;
                return;
            }
            burst++;
        } else {
            burst = 1;
            lastWrite = System.currentTimeMillis();
        }

        Message message = session.sendQueue.poll();
        if (message != null && sendMessages) { //make sure the message is not null, and make sure we are allowed to send messages.
            twitchWSIRC.send("PRIVMSG #" + channelName + " :" + message.message);// send the message to Twitch.
            com.gmt2001.Console.out.println("[CHAT] " + message.message);//print the message in the console once its sent to Twitch.
        } else {
            if (!sendMessages && message != null) {
                com.gmt2001.Console.out.println();
                com.gmt2001.Console.out.println("[ERROR] " + getNick() + " is not detected as a moderator!");
                if (lastModTry + 60000 <= System.currentTimeMillis()) {
                    lastModTry = System.currentTimeMillis();
                    com.gmt2001.Console.out.println("[INFO] Trying to automatically detect moderator status now.");
                    saySilent(".mods");
                } else {
                    com.gmt2001.Console.out.println("[INFO] Will try to automatically detect moderator status in 60 seconds.");
                }
                com.gmt2001.Console.out.println();
            }
        }
    }

    /* Returns the Channel object related to this Session.
     *
     * @return  Channel      The related Channel object.
     */
    public Channel getChannel(String dummy) {
        return this.channel; 
    }

    /*
     * Increments the chat line counter.
     */
    public void chatLinesIncr() {
        this.chatLineCtr++;
    }

    /*
     * Resets the chat line counter.
     */
    public void chatLinesReset() {
        this.chatLineCtr = 0;
    }

    /*
     * Retruns the chat line counter.
     *
     * @return    int    Number of lines in chat (PRIVMSG)
     */
    public int chatLinesGet() {
        return this.chatLineCtr;
    }

    /* 
     * Send the messages that are in the current queue. or return if the queue is empty.
     *
     */
    class SendMsg extends TimerTask {
        @Override
        public void run() {
            sendWSMessages();
        }
    }

    /* 
     * Send the messages that are in the current queue. or return if the queue is empty.
     *
     */
    class SendMsgAlternate extends TimerTask {
        @Override
        public void run() {
            sendWSMessagesAlternate();
        }
    }


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
        private final double messageLimit = PhantomBot.getMessageInterval();
        private long lastMessage = 0;

        public MessageTask(Session session) {
            super();
            this.session = session;
            Thread.setDefaultUncaughtExceptionHandler(com.gmt2001.UncaughtExceptionHandler.instance());
        }

        @Override
        public void run() {
            if (System.currentTimeMillis() - lastMessage >= messageLimit) {
                Message message = session.messages.poll();
                if (message != null) {
                    session.sendQueue.add(new Message(message.message)); //add the message in the final queue, to make sure timeouts are not limiting us.
                    lastMessage = System.currentTimeMillis();
                }
            }
        }
    }
}
