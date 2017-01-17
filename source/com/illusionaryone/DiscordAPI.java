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
import me.mast3rplan.phantombot.event.discord.DiscordMessageEvent;
import me.mast3rplan.phantombot.event.discord.DiscordCommandEvent;
import me.mast3rplan.phantombot.event.discord.DiscordJoinEvent;
import me.mast3rplan.phantombot.event.discord.DiscordLeaveEvent;

import com.gmt2001.UncaughtExceptionHandler;
import net.dv8tion.jda.JDA;
import net.dv8tion.jda.JDABuilder;
import net.dv8tion.jda.MessageBuilder;
import net.dv8tion.jda.entities.Guild;
import net.dv8tion.jda.entities.User;
import net.dv8tion.jda.entities.TextChannel;
import net.dv8tion.jda.entities.Message;
import net.dv8tion.jda.Permission;
import net.dv8tion.jda.events.Event;
import net.dv8tion.jda.events.InviteReceivedEvent;
import net.dv8tion.jda.events.ReadyEvent;
import net.dv8tion.jda.events.channel.text.TextChannelCreateEvent;
import net.dv8tion.jda.events.channel.text.TextChannelDeleteEvent;
import net.dv8tion.jda.events.channel.text.TextChannelUpdateNameEvent;
import net.dv8tion.jda.events.message.MessageReceivedEvent;
import net.dv8tion.jda.events.guild.member.GuildMemberJoinEvent;
import net.dv8tion.jda.events.guild.member.GuildMemberLeaveEvent;
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
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.concurrent.ConcurrentLinkedQueue;

/*
 * Communicates with the Discord API.
 *
 * @author illusionaryone
 */
public class DiscordAPI {

    private static final DiscordAPI instance = new DiscordAPI();
    private final ConcurrentLinkedQueue<MessageDelete> deleteQueue = new ConcurrentLinkedQueue<>();
    private final ConcurrentLinkedQueue<Message> messageQueue = new ConcurrentLinkedQueue<>();
    private final Map<String, TextChannel> channelMap = new HashMap<>();
    private final Map<String, String> userCache = new HashMap<>();
    private final Timer messageTimer = new Timer();
    private String botID;
    private JDA jdaAPI = null;
    
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
     * Returns the jda api, this is for the scripts.
     *
     * @return jda api.
     */
    public JDA jda() {
        return this.jdaAPI;
    }

    /*
     * Gets the bots user Id.
     *
     * @return {string} the bot id.
     */
    public String getBotId() {
        return this.botID;
    }

    /*
     * Used to delete a bunch of messages. Limit is 1 bulk / 1 second. This should handle that it also needs to be sent in a list.
     *
     * @param {String} username
     * @param {String} channel
     * @param {Array} messages
     */
    public void bulkDelete(String username, String channel, String[] messages) {
        List<String> list = new ArrayList<String>();

        for (String message : messages) {
            list.add(message);
        }
        deleteQueue.add(new MessageDelete(channel, list));
    }

    /*
     * Used to resolve a users id by his username. This can be inaccurate if multiple users have the same name.
     *
     * @param {String} username
     * @reutrn {String}
     */
    public String getUserId(String username) {
        if (userCache.containsKey(username.toLowerCase())) {
            return userCache.get(username.toLowerCase());
        }
        return username;
    }

    /*
     * Used to resolve a users id and returns his name that can be mentioned.
     *
     * @param {String} username
     * @reutrn {String}
     */
    public String getUserMention(String username) {
        if (userCache.containsKey(username.replace("@", "").toLowerCase()) && username.startsWith("@")) {
            return "<@" + userCache.get(username.replace("@", "").toLowerCase()) + ">";
        }
        return username;
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
                    com.gmt2001.Console.warn.println("Discord Rate Limit has been Exceeded [RateLimitedException]: " + ex.getMessage());
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
     * Builds a hashmap (cache) of all the current users in the discord server with their id's. This is used to ping users later on.
     */
    private void getUsers() {
        if (jdaAPI != null) {
            for (User user : jdaAPI.getUsers()) {
                userCache.put(user.getUsername().toLowerCase(), user.getId());
            }
        }
    }

    /*
     * Get the command then will make the arguments for it. Works just like we do for Twitch.
     */
    private void commandEvent(String sender, String senderId, String message, String channel, String discrim, Boolean isAdmin) {
        String arguments = "";
        String command = message.substring(1);

        /* Does the command have arguments? */
        if (command.contains(" ")) {
            String commandString = command;
            command = commandString.substring(0, commandString.indexOf(" "));
            arguments = commandString.substring(commandString.indexOf(" ") + 1);
        }

        EventBus.instance().post(new DiscordCommandEvent(sender, senderId, discrim, channel, arguments, command, isAdmin));
    }

    /*
     * The DiscordListener class which is used by the JDABuilder.addListener() method.
     */
    private class DiscordListener implements EventListener {
        @Override
        public void onEvent(Event event) {
            /* ReadyEvent - Happens when the bots fully connects to Discord. */
            if (event instanceof ReadyEvent) {
                ReadyEvent readyEvent = (ReadyEvent) event;
                getTextChannels();
                getUsers();
                botID = jdaAPI.getSelfInfo().getId();
                messageTimer.schedule(new MessageTask(), 100, 1);
                messageTimer.schedule(new DeleteTask(), 100, 5);
                com.gmt2001.Console.out.println("Discord API is Ready");
            }

            /* MessageReceivedEvent - Happens when a new messages is said in the Discord server. */
            if (event instanceof MessageReceivedEvent) {
                MessageReceivedEvent messageEvent = (MessageReceivedEvent) event;
                if (messageEvent.getAuthor().getId().equalsIgnoreCase(getBotId())) {
                    return;
                }
                try {
                    OnMessage onMessage = new OnMessage(messageEvent);
                    new Thread(onMessage).start();
                } catch (Exception ex) {
                    handleMessages(messageEvent);
                }
            }

            /* GuildMemberJoinEvent - Happens when a user joins the server. */
            if (event instanceof GuildMemberJoinEvent) {
                GuildMemberJoinEvent joinEvent = (GuildMemberJoinEvent) event;
                userCache.put(joinEvent.getUser().getUsername().toLowerCase(), joinEvent.getUser().getId());
                EventBus.instance().post(new DiscordJoinEvent(joinEvent.getUser().getUsername(), joinEvent.getUser().getId(), joinEvent.getUser().getDiscriminator()));
            }

            /* GuildMemberLeaveEvent - Happens when a user leaves the server. */
            if (event instanceof GuildMemberLeaveEvent) {
                GuildMemberLeaveEvent partEvent = (GuildMemberLeaveEvent) event;
                if (userCache.containsKey(partEvent.getUser().getUsername().toLowerCase())) {
                    userCache.remove(partEvent.getUser().getUsername().toLowerCase(), partEvent.getUser().getId());
                }
                EventBus.instance().post(new DiscordLeaveEvent(partEvent.getUser().getUsername(), partEvent.getUser().getId(), partEvent.getUser().getDiscriminator()));
            }

            /* TextChannelCreateEvent - Happens when a user creates a new channel, this will also add the channel to our cache so the bot does not need a reboot. */
            if (event instanceof TextChannelCreateEvent) {
                TextChannelCreateEvent channelEvent = (TextChannelCreateEvent) event;
                channelMap.put(channelEvent.getChannel().getName(), channelEvent.getChannel());
            }

            /* TextChannelUpdateNameEvent - Happens when a user edits a channel name, this will also update the name in our cache so the bot does not need a reboot. */
            if (event instanceof TextChannelUpdateNameEvent) {
                TextChannelUpdateNameEvent channelEvent = (TextChannelUpdateNameEvent) event;
                channelMap.put(channelEvent.getChannel().getName(), channelEvent.getChannel());
                if (channelMap.containsKey(channelEvent.getOldName())) { 
                    channelMap.remove(channelEvent.getOldName());
                }
            }

            /* TextChannelDeleteEvent - Happens when a user deletes a channel, this will also remove the channel from our cache. */
            if (event instanceof TextChannelDeleteEvent) {
                TextChannelDeleteEvent channelEvent = (TextChannelDeleteEvent) event;
                if (channelMap.containsKey(channelEvent.getChannel().getName())) {
                    channelMap.remove(channelEvent.getChannel().getName());
                }
            }
        }
    }

    /*
     * Handles discord messages on a new thread.
     */
    private void handleMessages(MessageReceivedEvent event) {
        TextChannel channels = event.getTextChannel();
        String channel = channels.getName();
        String sender = event.getAuthorName();
        String channelId = channels.getId();
        String senderId = event.getAuthor().getId();
        String messageId = event.getMessage().getId();
        String message = event.getMessage().getContent();
        String discriminator = event.getAuthor().getDiscriminator();
        Boolean isAdmin = PermissionUtil.checkPermission(event.getAuthor(), Permission.ADMINISTRATOR, event.getGuild());

        com.gmt2001.Console.out.println("[DISCORD] [#" + channel + "] " + sender.toLowerCase() + ": " + message);
        if (message.startsWith("!")) {
            commandEvent(sender, senderId, message, channel, discriminator, isAdmin);
        }

        EventBus.instance().post(new DiscordMessageEvent(sender, senderId, discriminator, message, messageId, channel, channelId, isAdmin));
    }

    /*
     * Message Class. Used for storing information about a queued message.
     */
    private class Message {
        private final String channel;
        private final String message;

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
     * Class to delete messages.
     */
    private class MessageDelete {
        public final String channel;
        public final List<String> list;

        public MessageDelete(String channel, List<String> list) {
            this.channel = channel;
            this.list = list;
        }
    }

    /*
     * OnMessage Class. used to start a new thread when we get a message.
     */
    private class OnMessage implements Runnable {
        private final MessageReceivedEvent event;

        public OnMessage(MessageReceivedEvent event) {
            this.event = (MessageReceivedEvent) event;
        }

        @Override
        public void run() {
            handleMessages(event);
        }
    }

    /* 
     * Used to delete a bulk of messages and not hit the API limit of 1 bulk / 1 second.
     */
    private class DeleteTask extends TimerTask {
        private long lastDelete = 0;

        public DeleteTask() {
            super();
            Thread.setDefaultUncaughtExceptionHandler(com.gmt2001.UncaughtExceptionHandler.instance());
        }

        @Override
        public void run() {
            if (System.currentTimeMillis() - lastDelete >= 1050) {
                DiscordAPI.MessageDelete message = deleteQueue.poll();
                if (message != null) {
                    try {
                        if (channelMap.containsKey(message.channel)) {
                            channelMap.get(message.channel).deleteMessagesByIds(message.list);
                        }
                    } catch (Exception ex) {
                        com.gmt2001.Console.err.println("DiscordAPI::Failed to bulk delete messages [" + ex.getCause() + "]: " + ex.getMessage());
                    }
                    lastDelete = System.currentTimeMillis();
                }
            }
        }
    }

    /*
     * This is the timer task for sending messages. According to the API documentation, Discord allows
     * 5 messages in 5 seconds, therefore, we just allow one message a second to be sent.
     */
    private class MessageTask extends TimerTask {
        private final Double limit = ((5.0 / 5.0) * 1000);
        private long lastMsgTime = 0;

        public MessageTask() {
            super();
            Thread.setDefaultUncaughtExceptionHandler(com.gmt2001.UncaughtExceptionHandler.instance());
        }

        @Override
        public void run() {
            if (System.currentTimeMillis() - lastMsgTime >= limit) {
                DiscordAPI.Message message = messageQueue.poll();
                if (message != null) {
                    println(message.getChannel(), message.getMessage());
                    lastMsgTime = System.currentTimeMillis();
                }
            }
        }
    }
}
