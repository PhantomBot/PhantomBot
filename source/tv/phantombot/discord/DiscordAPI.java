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

package tv.phantombot.discord;

import sx.blah.discord.modules.Configuration;

import sx.blah.discord.api.events.EventSubscriber;
import sx.blah.discord.api.internal.ShardImpl;
import sx.blah.discord.api.IDiscordClient;
import sx.blah.discord.api.ClientBuilder;

import sx.blah.discord.handle.impl.events.MessageReceivedEvent;
import sx.blah.discord.handle.impl.events.UserLeaveEvent;
import sx.blah.discord.handle.impl.events.UserJoinEvent;
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
import tv.phantombot.event.EventBus;

/*
 * Communicates with the Discord API.
 *
 * @author Illusionaryone
 * @author ScaniaTV
 */
public class DiscordAPI extends DiscordUtil {
    private static final DiscordAPI instance = new DiscordAPI();
    public static IDiscordClient client;
    public static ShardImpl shard;
    public static IGuild guild;
    
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
     * Method to connect to Discord.
     *
     * @param {String} token
     */
    public void connect(String token) {
        try {
            DiscordAPI.client = new ClientBuilder().withToken(token).registerListener(new DiscordEventListener()).login();
        } catch (DiscordException ex) {
            com.gmt2001.Console.err.println("Failed to authenticate with Discord: [" + ex.getClass().getSimpleName() + "] " + ex.getMessage());
        }
    }

    /*
     * Method to set the guild and shard objects.
     */
    private void setGuildAndShard() {
        // The bot should only be in one server, so this should be fine.
        DiscordAPI.guild = DiscordAPI.client.getGuilds().get(0);
        DiscordAPI.shard = (ShardImpl) DiscordAPI.client.getShards().get(0);
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

            setGuildAndShard();
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
