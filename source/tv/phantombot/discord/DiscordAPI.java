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

import com.mysql.fabric.xmlrpc.base.Array;
import sx.blah.discord.modules.Configuration;

import sx.blah.discord.api.events.EventSubscriber;
import sx.blah.discord.api.internal.ShardImpl;
import sx.blah.discord.api.IDiscordClient;
import sx.blah.discord.api.ClientBuilder;

import sx.blah.discord.handle.impl.events.guild.channel.message.MessageReceivedEvent;
import sx.blah.discord.handle.impl.events.guild.member.UserLeaveEvent;
import sx.blah.discord.handle.impl.events.guild.member.UserJoinEvent;
import sx.blah.discord.handle.impl.events.ReadyEvent;
import sx.blah.discord.handle.obj.IChannel;
import sx.blah.discord.handle.obj.IMessage;
import sx.blah.discord.handle.obj.IGuild;
import sx.blah.discord.handle.obj.IUser;

import sx.blah.discord.util.DiscordException;

import tv.phantombot.event.discord.channel.DiscordChannelCommandEvent;
import tv.phantombot.event.discord.channel.DiscordChannelMessageEvent;
import tv.phantombot.event.discord.channel.DiscordChannelJoinEvent;
import tv.phantombot.event.discord.channel.DiscordChannelPartEvent;
import tv.phantombot.discord.util.DiscordUtil;
import tv.phantombot.event.EventBus;

import java.util.ArrayList;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

import tv.phantombot.discord.util.DiscordUtil;

/*
 * Communicates with the Discord API.
 *
 * @author IllusionaryOne
 * @author ScaniaTV
 */
public class DiscordAPI extends DiscordUtil {
    private static final DiscordAPI instance = new DiscordAPI();
    private static IDiscordClient client;
    private static ShardImpl shard;
    private static IGuild guild;
    private static Long serverId;

    /*
     * Method to return this class object.
     *
     * @return {Object}
     */
    public static DiscordAPI instance() {
        return instance;
    }

    /*
     * Class constructor
     */
    private DiscordAPI() {
        Configuration.LOAD_EXTERNAL_MODULES = false;

        Thread.setDefaultUncaughtExceptionHandler(com.gmt2001.UncaughtExceptionHandler.instance());
    }
    
    /*
     * Enum list of our connection states.
     */
    public static enum ConnectionState {
        CONNECTED,
        RECONNECTED,
        DISCONNECTED
    }

    /*
     * Method to connect to Discord.
     *
     * @param {String} token
     */
    public void connect(String token, Long serverId) {
        try {
            DiscordAPI.client = new ClientBuilder().withToken(token).setMaxReconnectAttempts(150).setDaemon(false).registerListener(new DiscordEventListener()).login();
            DiscordAPI.serverId = serverId;
            
        } catch (DiscordException ex) {
            com.gmt2001.Console.err.println("Failed to authenticate with Discord: [" + ex.getClass().getSimpleName() + "] " + ex.getMessage());
        }
    }

    /*
     * Method to reconnect to Discord.
     */
    public boolean reconnect() {
        try {
            if (DiscordAPI.client.isLoggedIn()) {
                DiscordAPI.client.logout();
            }
            DiscordAPI.client.login();
            return true;
        } catch (DiscordException ex) {
            com.gmt2001.Console.err.println("Failed to reconnect with Discord: [" + ex.getClass().getSimpleName() + "] " + ex.getMessage());
        }
        return false;
    }
    
    /*
     * Mehtod that checks if we are still connected to Discord and reconnects if we are not. 
     */
    public ConnectionState checkConnectionStatus() {
        if (!DiscordAPI.client.isLoggedIn() || !DiscordAPI.client.isReady()) {
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

    /*
     * Method that will return the current shard.
     *
     * @return {ShardImpl}
     */
    public static ShardImpl getShard() {
        return shard;
    }

    /*
     * Method that will return the current guild.
     *
     * @return {IGuild}
     */
    public static IGuild getGuild() {
        return guild;
    }

    /*
     * Method that will return the current guild
     *
     * @return {IDiscordClient}
     */
    public static IDiscordClient getClient() {
        return client;
    }

    /*
     * Method to set the guild and shard objects.
     */
    private void setGuildAndShard() {
        if (DiscordAPI.getClient().getGuilds().size() > 1 && DiscordAPI.serverId != null) {
            // PhantomBot only works in one server, so throw an error if there's multiple.
            com.gmt2001.Console.err.println("Discord bot works only with one server. Please define 'discord_server' parameter if you want to unleash custom emotes. Now disconnecting from Discord...");
            DiscordAPI.client.logout();
        } else {
            if (DiscordAPI.serverId != null) {
                // Connecting to the defined server
                DiscordAPI.guild = DiscordAPI.getClient().getGuildByID(DiscordAPI.serverId);
            }
            if (DiscordAPI.guild == null){
                // Falling back to the first server in the list
                DiscordAPI.guild = DiscordAPI.getClient().getGuilds().get(0);
            }
            DiscordAPI.shard = (ShardImpl) DiscordAPI.getClient().getShards().get(0);
        }
    }

    private String getGuildNamesFormatted()
    {
        ArrayList<String> guilds = new ArrayList<>();

        for(IGuild guild : DiscordAPI.getClient().getGuilds()) {
            guilds.add("[" + guild.getName() + "]");
        }

        return String.join(",", guilds);
    }

    /*
     * Method to parse commands.
     *
     * @param {String} message
     */
    private void parseCommand(IUser user, IChannel channel, String message, boolean isAdmin) {
        String command = message.substring(1);
        String arguments = "";

        if (command.indexOf(" ") != -1) {
            String commandString = command;
            command = commandString.substring(0, commandString.indexOf(" "));
            arguments = commandString.substring(commandString.indexOf(" ") + 1);
        }

        EventBus.instance().postAsync(new DiscordChannelCommandEvent(user, channel, command, arguments, isAdmin));
    }

    /*
     * Class to listen to events.
     */
    private class DiscordEventListener {
        @EventSubscriber
        public void onDiscordReadyEvent(ReadyEvent event) {
            com.gmt2001.Console.out.println("Successfully authenticated with Discord.");
            com.gmt2001.Console.out.println("Connected to " + getGuildNamesFormatted() + ".");

            setGuildAndShard();
            
            // Set a timer that checks our connection status with Discord every 60 seconds
            ScheduledExecutorService service = Executors.newSingleThreadScheduledExecutor();
            service.scheduleAtFixedRate(() -> {
                if (checkConnectionStatus() == ConnectionState.DISCONNECTED) {
                    com.gmt2001.Console.err.println("Connection with Discord was disconnected.");
                    com.gmt2001.Console.err.println("Reconnecting will be attempted in 60 seconds...");
                }
            }, 0, 1, TimeUnit.MINUTES);
        }

        @EventSubscriber
        public void onDiscordMessageEvent(MessageReceivedEvent event) {
            IMessage iMessage = event.getMessage();
            IChannel iChannel = event.getChannel();
            IUser iUsername = event.getAuthor();

            String username = iUsername.getName().toLowerCase();
            String message = iMessage.getContent();
            String channel = iChannel.getName();
            boolean isAdmin = isAdministrator(iUsername);

            com.gmt2001.Console.out.println("[DISCORD] [#" + channel + "] " + username + ": " + message);

            if (message.startsWith("!")) {
                parseCommand(iUsername, iChannel, message, isAdmin);
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
    }
}
