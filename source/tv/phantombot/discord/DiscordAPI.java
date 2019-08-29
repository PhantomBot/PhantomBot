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

package tv.phantombot.discord;

import discord4j.core.DiscordClient;
import discord4j.core.DiscordClientBuilder;
import discord4j.core.event.domain.guild.GuildCreateEvent;
import discord4j.core.event.domain.lifecycle.ReadyEvent;
import discord4j.core.object.entity.Channel;
import discord4j.core.object.entity.Guild;
import discord4j.core.object.entity.Message;
import discord4j.core.object.entity.User;
import java.util.List;
import tv.phantombot.event.discord.channel.DiscordChannelCommandEvent;
import tv.phantombot.event.discord.channel.DiscordChannelMessageEvent;
import tv.phantombot.event.discord.channel.DiscordChannelJoinEvent;
import tv.phantombot.event.discord.channel.DiscordChannelPartEvent;
import tv.phantombot.event.discord.uservoicechannel.DiscordUserVoiceChannelPartEvent;
import tv.phantombot.event.discord.reaction.DiscordMessageReactionEvent;
import tv.phantombot.event.EventBus;

import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

import tv.phantombot.discord.util.DiscordUtil;

import tv.phantombot.PhantomBot;
import tv.phantombot.event.discord.ready.DiscordReadyEvent;
import tv.phantombot.event.discord.role.DiscordRoleCreatedEvent;
import tv.phantombot.event.discord.role.DiscordRoleDeletedEvent;
import tv.phantombot.event.discord.role.DiscordRoleUpdatedEvent;


/**
 * Communicates with the Discord API.
 *
 * @author IllusionaryOne
 * @author ScaniaTV
 */
public class DiscordAPI extends DiscordUtil {
    private static final DiscordAPI instance = new DiscordAPI();
    private static DiscordClient client;
    private static Guild guild;
    private static ConnectionState reconnectState = ConnectionState.DISCONNECTED;
    private static DiscordClientBuilder builder;
    private boolean ready = false;

    /**
     * Method to return this class object.
     *
     * @return {Object}
     */
    public static DiscordAPI instance() {
        return instance;
    }

    /**
     * Class constructor
     */
    private DiscordAPI() {
        Thread.setDefaultUncaughtExceptionHandler(com.gmt2001.UncaughtExceptionHandler.instance());
    }
    
    /**
     * Enum list of our connection states.
     */
    public static enum ConnectionState {
        CONNECTED,
        RECONNECTED,
        DISCONNECTED,
        CANNOT_RECONNECT
    }

    /**
     * Method to connect to Discord.
     *
     * @param token
     */
    public void connect(String token) {
        DiscordAPI.builder = new DiscordClientBuilder(token);
        DiscordAPI.client = builder.build();
        DiscordAPI.client.login().doOnError(e -> {
             com.gmt2001.Console.err.println("Failed to authenticate with Discord: [" + e.getClass().getSimpleName() + "] " + e.getMessage());
        }).block();
        
        if (isLoggedIn()) {
            subscribeToEvents();
        }
    }

    /**
     * Method to reconnect to Discord.
     * @return 
     */
    public boolean reconnect() {
        ready = false;
        DiscordAPI.client.logout();
            
        DiscordAPI.client = builder.build();
        DiscordAPI.client.login().doOnError(e -> {
             com.gmt2001.Console.err.println("Failed to reconnect with Discord: [" + e.getClass().getSimpleName() + "] " + e.getMessage());
        }).block();
        
        if (isLoggedIn()) {
            subscribeToEvents();
        }
        
        return isLoggedIn();
    }
    
    private void subscribeToEvents() {
        DiscordAPI.client.getEventDispatcher().on(ReadyEvent.class) // Listen for ReadyEvent(s)
                .map(event -> event.getGuilds().size()) // Get how many guilds the bot is in
                .flatMap(size -> client.getEventDispatcher()
                    .on(GuildCreateEvent.class) // Listen for GuildCreateEvent(s)
                    .take(size) // Take only the first `size` GuildCreateEvent(s) to be received
                    .collectList()) // Take all received GuildCreateEvents and make it a List
                .subscribe(events -> DiscordEventListener.onDiscordReadyEvent(events));
    }
    
    /** 
     * Method that checks if we are logged in to Discord.
     * @return 
     */
    public boolean isLoggedIn() {
        return DiscordAPI.client.getSelfId().isPresent();
    }
    
        /** 
     * Method that checks if Discord is ready and has sent all Guilds.
     * @return 
     */
    public boolean isReady() {
        return ready;
    }
    
    /** 
     * Method that checks if we are still connected to Discord and reconnects if we are not. 
     * @return 
     */
    public ConnectionState checkConnectionStatus() {
        if (!isLoggedIn() || !isReady()) {
            com.gmt2001.Console.warn.println("Connection lost with Discord, attempting to reconnect...");
            if (reconnect()) {
                com.gmt2001.Console.warn.println("Connection re-established with Discord.");
                // We were able to reconnect.
                return ConnectionState.RECONNECTED;
            } else {
                // We are disconnected and could not reconnect.
                return ConnectionState.DISCONNECTED;
            }
        }
        // We are still connected, return true.
        return ConnectionState.CONNECTED;
    }

    /**
     * Method that will return the current guild.
     *
     * @return {Guild}
     */
    public static Guild getGuild() {
        return guild;
    }

    /**
     * Method that will return the current guild
     *
     * @return {DiscordClient}
     */
    public static DiscordClient getClient() {
        return client;
    }

    /**
     * Method to set the guild and shard objects.
     */
    private void setGuildAndShard(List<GuildCreateEvent> events) {
        // PhantomBot only works in one server, so throw an error if there's multiple.
        if (events.size() > 1) {
            com.gmt2001.Console.err.println("Discord bot account connected to multiple servers. Now disconnecting from Discord...");
            DiscordAPI.client.logout();
            reconnectState = ConnectionState.CANNOT_RECONNECT;
        } else {
            DiscordAPI.guild = events.get(0).getGuild();
        }
    }

    /**
     * Method to parse commands.
     *
     * @param {String} message
     */
    private void parseCommand(User user, Channel channel, Message message, boolean isAdmin) {
        if (message.getContent().isEmpty()) {
            return;
        }
        
        String command = message.getContent().get().substring(1);
        String arguments = "";

        if (command.contains(" ")) {
            String commandString = command;
            command = commandString.substring(0, commandString.indexOf(" "));
            arguments = commandString.substring(commandString.indexOf(" ") + 1);
        }

        EventBus.instance().postAsync(new DiscordChannelCommandEvent(user, channel, message, command, arguments, isAdmin));
    }

    /**
     * Class to listen to events.
     */
    private static class DiscordEventListener {
        public static void onDiscordReadyEvent(List<GuildCreateEvent> events) {
            com.gmt2001.Console.out.println("Successfully authenticated with Discord.");

            DiscordAPI.instance().ready = true;
            
            DiscordAPI.instance().setGuildAndShard(events);
            
            // Set a timer that checks our connection status with Discord every 60 seconds
            ScheduledExecutorService service = Executors.newSingleThreadScheduledExecutor();
            service.scheduleAtFixedRate(() -> {
                if (reconnectState != ConnectionState.CANNOT_RECONNECT && !PhantomBot.instance().isExiting()) {
                    if (DiscordAPI.instance().checkConnectionStatus() == ConnectionState.DISCONNECTED) {
                        com.gmt2001.Console.err.println("Connection with Discord was lost.");
                        com.gmt2001.Console.err.println("Reconnecting will be attempted in 60 seconds...");
                    }
                }
            }, 0, 1, TimeUnit.MINUTES);
            
            EventBus.instance().postAsync(new DiscordReadyEvent());
        }

        public void onDiscordMessageEvent(MessageReceivedEvent event) {
            Message iMessage = event.getMessage();
            Channel iChannel = event.getChannel();
            User iUsername = event.getAuthor();

            String username = iUsername.getName().toLowerCase();
            String message = iMessage.getContent();
            String channel = iChannel.getName();
            boolean isAdmin = isAdministrator(iUsername);

            com.gmt2001.Console.out.println("[DISCORD] [#" + channel + "] " + username + ": " + message);

            if (message.startsWith("!")) {
                parseCommand(iUsername, iChannel, iMessage, isAdmin);
            }

            EventBus.instance().postAsync(new DiscordChannelMessageEvent(iUsername, iChannel, iMessage, isAdmin));
        }

        @EventSubscriber
        public void onDiscordUserJoinEvent(UserJoinEvent event) {
            EventBus.instance().postAsync(new DiscordChannelJoinEvent(event.getUser()));
        }

        @EventSubscriber
        public void onDiscordUserLeaveEvent(UserLeaveEvent event) {
            EventBus.instance().postAsync(new DiscordChannelPartEvent(event.getUser()));
        }
        
        @EventSubscriber
        public void onDiscordRoleCreateEvent(RoleCreateEvent event) {
            EventBus.instance().post(new DiscordRoleCreatedEvent(event.getRole()));
        }
        
        @EventSubscriber
        public void onDiscordRoleUpdateEvent(RoleUpdateEvent event) { 
            EventBus.instance().post(new DiscordRoleUpdatedEvent(event.getRole()));
        }
        
        @EventSubscriber
        public void onDiscordRoleDeleteEvent(RoleDeleteEvent event) {
            EventBus.instance().post(new DiscordRoleDeletedEvent(event.getRole()));
        }
        
        @EventSubscriber
        public void onDiscordMessageReactionAddEvent(ReactionAddEvent event) {
            EventBus.instance().post(new DiscordMessageReactionEvent(event, DiscordMessageReactionEvent.ReactionType.ADD));
        }
        
        @EventSubscriber
        public void onDiscordMessageReactionRemoveEvent(ReactionRemoveEvent event) {
            EventBus.instance().post(new DiscordMessageReactionEvent(event, DiscordMessageReactionEvent.ReactionType.REMOVE));
        }

        @EventSubscriber
        public void onDiscordUserVoiceChannelJoinEvent(UserVoiceChannelJoinEvent event) {
        }
          
        @EventSubscriber
        public void onDiscordUserVoiceChannelLeaveEvent(UserVoiceChannelLeaveEvent event) {
            EventBus.instance().postAsync(new DiscordUserVoiceChannelPartEvent(event.getUser(), event.getVoiceChannel()));
        }
    }
}
