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
package com.illusionaryone;

import com.gmt2001.UncaughtExceptionHandler;

import me.mast3rplan.phantombot.event.EventBus;
import me.mast3rplan.phantombot.event.discord.DiscordMessageEvent;
import me.mast3rplan.phantombot.event.discord.DiscordCommandEvent;
import me.mast3rplan.phantombot.event.discord.DiscordJoinEvent;
import me.mast3rplan.phantombot.event.discord.DiscordLeaveEvent;
import me.mast3rplan.phantombot.script.ScriptEventManager;

import net.dv8tion.jda.core.JDA;
import net.dv8tion.jda.core.JDABuilder;
import net.dv8tion.jda.core.AccountType;
import net.dv8tion.jda.core.entities.Channel;
import net.dv8tion.jda.core.entities.Guild;
import net.dv8tion.jda.core.entities.Member;
import net.dv8tion.jda.core.entities.TextChannel;
import net.dv8tion.jda.core.entities.User;
import net.dv8tion.jda.core.events.Event;
import net.dv8tion.jda.core.events.ReadyEvent;
import net.dv8tion.jda.core.events.channel.text.update.TextChannelUpdateNameEvent;
import net.dv8tion.jda.core.events.channel.text.TextChannelCreateEvent;
import net.dv8tion.jda.core.events.channel.text.TextChannelDeleteEvent;
import net.dv8tion.jda.core.events.guild.member.GuildMemberJoinEvent;
import net.dv8tion.jda.core.events.guild.member.GuildMemberLeaveEvent;
import net.dv8tion.jda.core.events.guild.member.GuildMemberNickChangeEvent;
import net.dv8tion.jda.core.events.message.MessageReceivedEvent;
import net.dv8tion.jda.core.Permission;
import net.dv8tion.jda.core.utils.PermissionUtil;
import net.dv8tion.jda.core.hooks.EventListener;
import net.dv8tion.jda.core.utils.SimpleLog;
import net.dv8tion.jda.core.exceptions.RateLimitedException;

import javax.security.auth.login.LoginException;

import java.util.HashMap;
import java.util.Map;
import java.util.List;
import java.util.ArrayList;
import java.util.Collection;

/*
 * Communicates with the Discord API.
 *
 * @author illusionaryone
 * @author ScaniaTV
 */
public class DiscordAPI {

    private static final DiscordAPI instance = new DiscordAPI();
    private final Map<String, TextChannel> channelMap = new HashMap<>();
    private final Map<String, Member> userMap = new HashMap<>();
    private final List<Member> users = new ArrayList<>();
    private String botId;
    private JDA jdaAPI;

    /*
     * Returns the current instance of the Discord API.
     */
    public static DiscordAPI instance() {
        return instance;
    }

    /*
     * For the main class, will disable all of JDA's logging.
     */
    private DiscordAPI() {
        SimpleLog JDASocketLog = SimpleLog.getLog("JDASocket");
        JDASocketLog.setLevel(SimpleLog.Level.OFF);

        SimpleLog JDALog = SimpleLog.getLog("JDA");
        JDALog.setLevel(SimpleLog.Level.OFF);

        Thread.setDefaultUncaughtExceptionHandler(com.gmt2001.UncaughtExceptionHandler.instance());
    }

    /*
     * Attempts to connect to Discord with a provided token.
     *
     * @param {String} token
     */
    public void connect(String token) {
        try {
            jdaAPI = new JDABuilder(AccountType.BOT).setToken(token).addListener(new DiscordListener()).buildAsync();
        } catch (LoginException ex) {
            com.gmt2001.Console.err.println("Discord authentication failed: " + ex.getMessage());
        } catch (RateLimitedException ex) {
            com.gmt2001.Console.err.println("Discord authentication limit hit: " + ex.getMessage());
        }
    }

    /*
     * Gets all of the text channel names and places them in a map for future use.
     */
    private void getTextChannels() {
        for (TextChannel channel : jdaAPI.getTextChannels()) {
            addChannelToMap(channel);
        }
    }

    /*
     * Gets all of the usernames and places them in a map for future use.
     */
    private void getUserNames() {
        for (TextChannel channel : channelMap.values()) {
            for (Member member : channel.getMembers()) {
                addUserToMap(member);
            } 
        }
    }

    /*
     * Adds a user to the userMap.
     *
     * @param {Member} member
     */
    private void addUserToMap(Member member) {
        String username = (member.getNickname() == null ? member.getUser().getName() : member.getNickname()).toLowerCase();

        if (resolveUser(username) == null) {
            userMap.put(username, member);
            if (member.getNickname() != null) {
                userMap.put(member.getUser().getName(), member);
            }
            users.add(member);
        }
    }

    /*
     * Removes a user from the userMap
     *
     * @param {Member} member
     */
    private void removeUserFromMap(Member member) {
        String username = (member.getNickname() == null ? member.getUser().getName() : member.getNickname()).toLowerCase();

        if (resolveUser(username) != null) {
            userMap.remove(username);
            users.remove(member);
        }
    }

    /*
     * Adds a channel to the channelMap.
     *
     * @param {TextChannel} channel
     */
    private void addChannelToMap(TextChannel channel) {
        String channelName = channel.getName().toLowerCase();

        if (resolveChannel(channelName) == null) {
            channelMap.put(channelName, channel);
        }
    }

    /*
     * Removes a channel from the channelMap
     *
     * @param {TextChannel} channel
     */
    private void removeChannelFromMap(TextChannel channel) {
        String channelName = channel.getName().toLowerCase();

        if (resolveChannel(channelName) != null) {
            channelMap.remove(channelName);
        }
    }

    /*
     * Returns the current JDA api.
     */
    public JDA getJDA() {
        return this.jdaAPI;
    }

    /*
     * Returns a list of all the Discord users.
     */
    public List getUserMembers() {
        return this.users;
    }

    /*
     * Will return that user if he exists.
     *
     * @param  {String} username
     * @return {Boolean}
     */
    public Boolean isUser(String username) {
        return this.userMap.containsKey(username.replace("@", "").toLowerCase());
    }

    /*
     * Will return that channel if he exists.
     *
     * @param  {String} channel
     * @return {Boolean}
     */
    public Boolean isChannel(String channel) {
        return this.channelMap.containsKey(channel.replace("#", "").toLowerCase());
    }

    /*
     * Will return that user.
     *
     * @param  {String} username
     * @return {Member}
     */
    public Member resolveUser(String username) {
        return this.userMap.get(username.replace("@", "").toLowerCase());
    }

    /*
     * Will return that channel.
     *
     * @param  {String} channel
     * @return {TextChannel}
     */
    public TextChannel resolveChannel(String channel) {
        return this.channelMap.get(channel.replace("#", "").toLowerCase());
    }

    /*
     * Sends a message to a specific channel.
     *
     * @param {String} channel
     * @param {String} message
     */
    public void sendMessage(String channel, String message) {
        TextChannel textChannel = resolveChannel(channel);

        if (textChannel != null) {
            com.gmt2001.Console.out.println("[DISCORD] [#" + textChannel.getName() + "] [CHAT] " + message);
            textChannel.sendMessage(message).queue();
        }
    }

    /*
     * Parses the message into a command that the bot can read.
     *
     * @param {User}    sender
     * @param {Channel} channel
     * @param {String}  message
     */
    private void commandEvent(User sender, Channel channel, String message, Boolean isAdmin) {
        String command = message.substring(1);
        String arguments = "";

        if (command.contains(" ")) {
            String commandString = command;
            command = commandString.substring(0, commandString.indexOf(" "));
            arguments = commandString.substring(commandString.indexOf(" ") + 1);
        }

        ScriptEventManager.instance().runDirect(new DiscordCommandEvent(sender, channel, command, arguments, isAdmin));
    }

    /*
     * Handles message we get from Discord.
     *
     * @param {MessageReceivedEvent} event
     */
    private void handleMessages(MessageReceivedEvent event) {
        String channelName = event.getChannel().getName();
        String username = event.getAuthor().getName();
        String message = event.getMessage().getContent();
        String messageId = event.getMessage().getId();
        Channel channel = event.getTextChannel();
        User sender = event.getAuthor();
        Boolean isAdmin = PermissionUtil.checkPermission(channel, event.getMember(), Permission.ADMINISTRATOR);

        com.gmt2001.Console.out.println("[DISCORD] [#" + channelName + "] " + username.toLowerCase() + ": " + message);

        if (message.startsWith("!")) {
            commandEvent(sender, channel, message, isAdmin);
        }

        EventBus.instance().post(new DiscordMessageEvent(sender, channel, message, messageId, isAdmin));
    }

    /*
     * The DiscordListener class which is used by the JDABuilder.addListener() method.
     */
    private class DiscordListener implements EventListener {
        @Override
        public void onEvent(Event event) {
            // ReadyEvent - This will handle getting all of the channel and users and storing them in a HashMap.
            if (event instanceof ReadyEvent) {
                botId = jdaAPI.getSelfUser().getId();
                getTextChannels();
                getUserNames();
                
                com.gmt2001.Console.out.println("Discord API is Ready");
            } else 

            // MessageReceivedEvent - This will handle pasing the message and sending the events needed.
            if (event instanceof MessageReceivedEvent) {
                MessageReceivedEvent messageEvent = (MessageReceivedEvent) event;

                if (messageEvent.getMember().getUser().getId() != botId) {
                    try {
                        Message message = new Message(messageEvent);
                        new Thread(message).start();
                    } catch (Exception ex) {
                        handleMessages(messageEvent);
                    }
                }
            } else 

            // GuildMemberJoinEvent - This will handle adding the user to the userMap and sending an event.
            if (event instanceof GuildMemberJoinEvent) {
                GuildMemberJoinEvent guildMemberJoinEvent = (GuildMemberJoinEvent) event;
                Member member = guildMemberJoinEvent.getMember();

                addUserToMap(member);
                EventBus.instance().post(new DiscordJoinEvent(member));
            } else

            // GuildMemberLeaveEvent - This will handle removing the user from the userMap and sending an event.
            if (event instanceof GuildMemberLeaveEvent) {
                GuildMemberLeaveEvent guildMemberLeaveEvent = (GuildMemberLeaveEvent) event;
                Member member = guildMemberLeaveEvent.getMember();
                
                removeUserFromMap(member);
                EventBus.instance().post(new DiscordLeaveEvent(member));
            } else 

            // GuildMemberNickChangeEvent - This will handle adding the user to the userMap.
            if (event instanceof GuildMemberNickChangeEvent) {
                GuildMemberNickChangeEvent guildMemberNickChangeEvent = (GuildMemberNickChangeEvent) event;
                Member member = guildMemberNickChangeEvent.getMember();

                addUserToMap(member);
            } else 

            // TextChannelCreateEvent - This will handle adding the channel to the channelMap.
            if (event instanceof TextChannelCreateEvent) {
                TextChannelCreateEvent textChannelEvent = (TextChannelCreateEvent) event;
                
                addChannelToMap(textChannelEvent.getChannel());
            } else 

            // TextChannelUpdateNameEvent - This will handle adding the channel to the channelMap.
            if (event instanceof TextChannelUpdateNameEvent) {
                TextChannelUpdateNameEvent textChannelEvent = (TextChannelUpdateNameEvent) event;
                
                addChannelToMap(textChannelEvent.getChannel());
            } else 

            // TextChannelDeleteEvent - This will handle removing the channel from the channelMap.
            if (event instanceof TextChannelDeleteEvent) {
                TextChannelDeleteEvent textChannelEvent = (TextChannelDeleteEvent) event;
                
                removeChannelFromMap(textChannelEvent.getChannel());
            }
        }
    }

    /*
     * Class to handle messages we get from Discord on a new thread.
     */
    private class Message implements Runnable {
        private final MessageReceivedEvent event;

        public Message(MessageReceivedEvent event) {
            this.event = event;
        }

        @Override
        public void run() {
            handleMessages(event);
        }
    }
}
