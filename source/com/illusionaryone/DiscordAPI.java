
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
package com.illusionaryone;

import me.mast3rplan.phantombot.event.EventBus;
import me.mast3rplan.phantombot.event.discord.DiscordEvent;

import com.gmt2001.UncaughtExceptionHandler;
import net.dv8tion.jda.JDA;
import net.dv8tion.jda.JDABuilder;
import net.dv8tion.jda.MessageBuilder;
import net.dv8tion.jda.entities.Guild;
import net.dv8tion.jda.entities.TextChannel;
import net.dv8tion.jda.entities.Message;
import net.dv8tion.jda.Permission;
import net.dv8tion.jda.events.Event;
import net.dv8tion.jda.events.InviteReceivedEvent;
import net.dv8tion.jda.events.ReadyEvent;
import net.dv8tion.jda.events.message.MessageReceivedEvent;
import net.dv8tion.jda.events.guild.GuildJoinEvent;
import net.dv8tion.jda.events.guild.GuildLeaveEvent;
import net.dv8tion.jda.utils.PermissionUtil;
import net.dv8tion.jda.hooks.EventListener;
import net.dv8tion.jda.utils.SimpleLog;
import net.dv8tion.jda.utils.SimpleLog.Level;
import net.dv8tion.jda.utils.PermissionUtil;
import net.dv8tion.jda.exceptions.RateLimitedException;
import net.dv8tion.jda.exceptions.PermissionException;

import javax.security.auth.login.LoginException;
import java.io.File;
import java.io.IOException;
import java.util.Map;
import java.util.HashMap;
import java.util.Timer;
import java.util.TimerTask;
import java.util.concurrent.ConcurrentLinkedQueue;

/*
 * Communicates with the Discord API.
 *
 * @author illusionaryone
 */
public class DiscordAPI {

    private static final DiscordAPI instance = new DiscordAPI();
    private JDA jdaAPI = null;
    private Map<String, TextChannel> channelMap = new HashMap<>();
    private final ConcurrentLinkedQueue<Message> messageQueue = new ConcurrentLinkedQueue<>();
    private final Timer messageTimer = new Timer();

    public static DiscordAPI instance() {
        return instance;
    }

    private DiscordAPI() {
        /* The SimpleLog statements disable all logging from JDA. */
        SimpleLog JDASocketLog = SimpleLog.getLog("JDASocket");
        JDASocketLog.setLevel(SimpleLog.Level.OFF);
        SimpleLog JDALog = SimpleLog.getLog("JDA");
        JDALog.setLevel(SimpleLog.Level.OFF);

        Thread.setDefaultUncaughtExceptionHandler(com.gmt2001.UncaughtExceptionHandler.instance());
    }

    /*
     * Attempts to connect to Discord with a provided token.
     *
     * An error will be produced if the connection fails and the API connection is set to null so that
     * no other methods will attempt to do anything.
     */
    public void connect(String token) {
        try {
            jdaAPI = new JDABuilder().setBotToken(token).setAudioEnabled(false).addListener(new DiscordListener()).buildAsync();
        } catch (LoginException ex) {
            com.gmt2001.Console.err.println("Failed to Login to Discord: " + ex.getMessage());
            jdaAPI = null;
        }
    }

    /*
     * Puts a text message into the queue to be sent. This queue restricts the sending of messages to once a second
     * to attempt to not reach the Discord rate limit of 10 messages in 10 seconds.
     *
     * @param  channel  The name of a text channel to send a message to
     * @param  message  The text to send to the channel
     */
    public void sendMessage(String channel, String message) {
        if (jdaAPI != null) {
            messageQueue.add(new Message(channel, message)); 
        }
    }

    /*
     * @returns jda api.
     */
    public JDA jda() {
        return jdaAPI;
    }

    /*
     * Sends a text message to the given channel. This is private as it is behind the rate-limit logic.
     *
     * @param  channel  The name of a text channel to send a message to
     * @param  message  The text to send to the channel
     */
    private void println(String channel, String message) {
        if (jdaAPI != null) {
            if (channel.startsWith("#")) {
                channel = channel.substring(1);
            }
            TextChannel textChannel = channelMap.get(channel);
            if (textChannel != null) {
                try {
                    com.gmt2001.Console.out.println("[DISCORD] [#" + channel + "] [CHAT] " + message);
                    textChannel.sendMessage(message);
                } catch (RateLimitedException ex) {
                    com.gmt2001.Console.warn.println("Discord Rate Limit has been Exceeded");
                } catch (PermissionException ex) {
                    com.gmt2001.Console.err.println("ACTION REQUIRED: Discord Bot Account does not have Write Permission to Channel: " + channel);
                }
            }
        }
    }

    /*
     * Builds the internal hash map of the text channels that are available.  This hash ensures that messages are only sent
     * to valid channels.
     */
    private void getTextChannels() {
        if (jdaAPI != null) {
            for (TextChannel textChannel : jdaAPI.getTextChannels()) {
                channelMap.put(textChannel.getName(), textChannel);
            }
        }
    }

    /*
     * The DiscordListener class which is used by the JDABuilder.addListener() method.
     */
    private class DiscordListener implements EventListener {
        @Override
        public void onEvent(Event event) {
            if (event instanceof ReadyEvent) {
                ReadyEvent readyEvent = (ReadyEvent) event;
                getTextChannels();
                messageTimer.schedule(new MessageTask(), 100, 1);
                com.gmt2001.Console.out.println("Discord API is Ready");
            }

            if (event instanceof MessageReceivedEvent) {
                MessageReceivedEvent messageReceivedEvent = (MessageReceivedEvent) event;
                TextChannel textChannel = messageReceivedEvent.getTextChannel();

                String textChannelName = textChannel.getName();
                String messageText = messageReceivedEvent.getMessage().getContent();
                String messageAuthorName = messageReceivedEvent.getAuthorName();
                String messageAuthorMention = messageReceivedEvent.getAuthor().getAsMention();
                String messageAuthorDisc = messageReceivedEvent.getAuthor().getDiscriminator();
                String messageAuthorId = messageReceivedEvent.getAuthor().getId();
                Boolean isAdmin = PermissionUtil.checkPermission(messageReceivedEvent.getAuthor(), Permission.ADMINISTRATOR, messageReceivedEvent.getGuild());

                EventBus.instance().post(new DiscordEvent(textChannelName, messageAuthorName, messageAuthorMention, messageAuthorDisc, messageAuthorId, isAdmin, messageText));
            }
        }
    }

    /*
     * Message Class. Used for storing information about a queued message.
     */
    private class Message {
        private String channel;
        private String message;

        public Message(String channel, String message) {
            this.channel = channel;
            this.message = message;
        }

        public String getChannel() {
            return this.channel;
        }

        public String getMessage() {
            return this.message;
        }
    }

    /*
     * This is the timer task for sending messages. According to the API documentation, Discord allows
     * 5 messages in 5 seconds, therefore, we just allow one message a second to be sent.
     */
    private class MessageTask extends TimerTask {
        private long lastMsgTime = 0;
        private Double limit = ((5.0 / 5.0) * 1000);

        public MessageTask() {
            super();
            Thread.setDefaultUncaughtExceptionHandler(com.gmt2001.UncaughtExceptionHandler.instance());
        }

        @Override
        public void run() {
            if (System.currentTimeMillis() - lastMsgTime >= limit) {
                Message message = messageQueue.poll();
                if (message != null) {
                    println(message.getChannel(), message.getMessage());
                    lastMsgTime = System.currentTimeMillis();
                }
            }
        }
    }
}
