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

import sx.blah.discord.modules.Configuration;

import sx.blah.discord.api.events.EventSubscriber;
import sx.blah.discord.api.IDiscordClient;
import sx.blah.discord.api.ClientBuilder;

import sx.blah.discord.handle.impl.events.MessageReceivedEvent;
import sx.blah.discord.handle.impl.events.UserLeaveEvent;
import sx.blah.discord.handle.impl.events.UserJoinEvent;
import sx.blah.discord.handle.impl.events.ReadyEvent;
import sx.blah.discord.handle.obj.Permissions;
import sx.blah.discord.handle.obj.IChannel;
import sx.blah.discord.handle.obj.IMessage;
import sx.blah.discord.handle.obj.IGuild;
import sx.blah.discord.handle.obj.IUser;
import sx.blah.discord.handle.obj.IRole;

import sx.blah.discord.util.DiscordException;
import sx.blah.discord.util.RequestBuffer;

import java.util.List;

/*
 * Communicates with the Discord API.
 *
 * @author Illusionaryone
 * @author ScaniaTV
 */
public class Discord {
    private static final Discord instance = new Discord();
    private IDiscordClient discordAPI;
    private IGuild guild;

    /*
     * @function instance
     *
     * @return {Object}
     */
    public static Discord instance() {
        return instance;
    }

    /*
     * @function Discord
     */
    private Discord() {
        Configuration.LOAD_EXTERNAL_MODULES = false;

        Thread.setDefaultUncaughtExceptionHandler(com.gmt2001.UncaughtExceptionHandler.instance());
    }

    /*
     * @function connect
     *
     * @param {String} token
     */
    public void connect(String token) {
        try {
            discordAPI = new ClientBuilder().withToken(token).registerListener(new DiscordEventListener()).login();
        } catch (DiscordException ex) {
            com.gmt2001.Console.err.println("Failed to authenticate with Discord [" + ex.getClass().getSimpleName() + "] " + ex.getMessage());
        }
    }

    /*
     * @function sendMessage
     *
     * @param {IChannel} channel
     * @param {String} message
     */
    public void sendMessage(IChannel channel, String message) {
        RequestBuffer.request(() -> {
            try {
                if (channel != null) {
                    channel.sendMessage(message);
                    com.gmt2001.Console.out.println("[DISCORD] [#" + channel.getName() + "] [CHAT] " + message);
                }
            } catch (DiscordException ex) {
                com.gmt2001.Console.err.println("Failed to send a message [" + ex.getClass().getSimpleName() + "] " + ex.getMessage());
            }
        });
    }

    /*
     * @function sendMessage
     *
     * @param {String} channelName
     * @param {String} message
     */
    public void sendMessage(String channelName, String message) {
        sendMessage(getChannel(channelName), message);
    }

    /*
     * @function sendPrivateMessage
     *
     * @param {IUser} user
     * @param {String} message
     */
    public void sendPrivateMessage(IUser user, String message) {
        RequestBuffer.request(() -> {
            try {
                if (user != null) {
                    user.getOrCreatePMChannel().sendMessage(message);
                    com.gmt2001.Console.out.println("[DISCORD] [@" + user.getName().toLowerCase() + "#" + user.getDiscriminator() + "] [DM] " + message);
                }
            } catch (DiscordException ex) {
                com.gmt2001.Console.err.println("Failed to send a private message [" + ex.getClass().getSimpleName() + "] " + ex.getMessage());
            }
        });
    }

    /*
     * @function sendPrivateMessage
     *
     * @param {String} userName
     * @param {String} message
     */
    public void sendPrivateMessage(String userName, String message) {
        sendPrivateMessage(getUser(userName), message);
    }

    /*
     * @function getChannel
     *
     * @param  {String} channelName
     * @return {IChannel}
     */
    public IChannel getChannel(String channelName) {
        List<IChannel> channels = guild.getChannelsByName(channelName);

        for (IChannel channel : channels) {
            if (channel.getName().equalsIgnoreCase(channelName)) {
                return channel;
            }
        }
        return null;
    }

    /*
     * @function getUser
     *
     * @param  {String} userName
     * @return {IUser}
     */
    public IUser getUser(String userName) {
        List<IUser> users = guild.getUsersByName(userName, true);

        for (IUser user : users) {
            if (user.getDisplayName(guild).equalsIgnoreCase(userName)) {
                return user;
            }
        }
        return null;
    }

    /*
     * @function getRole
     *
     * @param  {String} roleName
     * @return {IRole}
     */
    public IRole getRole(String roleName) {
        List<IRole> roles = guild.getRolesByName(roleName);

        for (IRole role : roles) {
            if (role.getName().equalsIgnoreCase(roleName)) {
                return role;
            }
        }
        return null;
    }

    /*
     * @function isAdministrator
     *
     * @param  {IUser} user
     * @return {Boolean}
     */
    public boolean isAdministrator(IUser user) {
        return user.getPermissionsForGuild(guild).contains(Permissions.ADMINISTRATOR);
    }

    /*
     * @function isModerator
     *
     * @param  {IUser} user
     * @return {Boolean}
     */
    public boolean isModerator(IUser user) {
        return user.getPermissionsForGuild(guild).contains(Permissions.KICK);
    }

    /*
     * @function setGuild
     */
    private void setGuild() {
        this.guild = discordAPI.getGuilds().get(0);
    }

    /*
     * @function parseCommand
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

        //TODO: Update the discord event classes to work with Discord4J.
        //EventBus.instance().post(new DiscordCommandEvent(user, channel, command, arguments, isAdmin));
    }

    /*
     * @class DiscordEventListener
     */
    private class DiscordEventListener {

        @EventSubscriber
        public void onDiscordReadyEvent(ReadyEvent event) {
            com.gmt2001.Console.out.println("Successfully authenticated with Discord.");

            setGuild();
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

            //TODO: Update the discord event classes to work with Discord4J.
            //EventBus.instance().post(new DiscordMessageEvent(iUsername, iChannel, iMessage, isAdmin));
        }

        @EventSubscriber
        public void onDiscordUserJoinEvent(UserJoinEvent event) {
            //TODO: Update the discord event classes to work with Discord4J.
            //EventBus.instance().post(new DiscordJoinEvent(event.getUser()));
        }

        @EventSubscriber
        public void onDiscordUserLeaveEvent(UserLeaveEvent event) {
            //TODO: Update the discord event classes to work with Discord4J.
            //EventBus.instance().post(new DiscordLeaveEvent(event.getUser()));
        }
    }
}
