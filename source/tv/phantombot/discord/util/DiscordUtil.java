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

import sx.blah.discord.api.internal.json.objects.EmbedObject;

import sx.blah.discord.handle.obj.Permissions;
import sx.blah.discord.handle.obj.IChannel;
import sx.blah.discord.handle.obj.IMessage;
import sx.blah.discord.handle.obj.IGuild;
import sx.blah.discord.handle.obj.IUser;
import sx.blah.discord.handle.obj.IRole;

import sx.blah.discord.util.MissingPermissionsException;
import sx.blah.discord.util.DiscordException;
import sx.blah.discord.util.MessageBuilder;
import sx.blah.discord.util.RequestBuffer;
import sx.blah.discord.util.EmbedBuilder;

import java.util.regex.Pattern;
import java.util.regex.Matcher;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

import java.io.FileNotFoundException;
import java.io.File;

import java.time.LocalDateTime;

import java.awt.Color;

/*
 * Has all of the methods to work with Discord4J.
 *
 * @author Illusionaryone
 * @author ScaniaTV
 */
public class DiscordUtil {
	/*
     * Method to send a message to a channel.
     *
     * @param {IChannel} channel
     * @param {String}   message
     */
    public void sendMessage(IChannel channel, String message) {
        RequestBuffer.request(() -> {
            try {
                if (channel != null) {
                    com.gmt2001.Console.out.println("[DISCORD] [#" + channel.getName() + "] [CHAT] " + message);

                    channel.sendMessage(message);
                }
            } catch (MissingPermissionsException | DiscordException ex) {
                com.gmt2001.Console.err.println("Failed to send a message: [" + ex.getClass().getSimpleName() + "] " + ex.getMessage());
            }
        });
    }

    /*
     * Method to send a message to a channel.
     *
     * @param {String} channelName
     * @param {String} message
     */
    public void sendMessage(String channelName, String message) {
        sendMessage(getChannel(channelName), message);
    }

    /*
     * Method to send private messages to a user.
     *
     * @param {IUser}  user
     * @param {String} message
     */
    public void sendPrivateMessage(IUser user, String message) {
        RequestBuffer.request(() -> {
            try {
                if (user != null) {
                    com.gmt2001.Console.out.println("[DISCORD] [@" + user.getName().toLowerCase() + "#" + user.getDiscriminator() + "] [DM] " + message);

                    user.getOrCreatePMChannel().sendMessage(message);  
                }
            } catch (MissingPermissionsException | DiscordException ex) {
                com.gmt2001.Console.err.println("Failed to send a private message: [" + ex.getClass().getSimpleName() + "] " + ex.getMessage());
            }
        });
    }

    /*
     * Method to send private messages to a user.
     *
     * @param {String} userName
     * @param {String} message
     */
    public void sendPrivateMessage(String userName, String message) {
        sendPrivateMessage(getUser(userName), message);
    }

    /*
     * Method to send embed messages.
     *
     * @param {IChannel} channel
     * @param {String}   message
     * @param {String}   color
     */
    public void sendMessageEmbed(IChannel channel, String color, String message) {
        RequestBuffer.request(() -> {
            try {
                EmbedObject builder = new EmbedBuilder().withDescription(message).withColor(getColor(color)).build();

                if (channel != null) {
                    com.gmt2001.Console.out.println("[DISCORD] [#" + channel.getName() + "] [EMBED] " + message);

                    channel.sendMessage(builder);
                }
            } catch (MissingPermissionsException | DiscordException | IllegalArgumentException ex) {
                com.gmt2001.Console.err.println("Failed to send an embed message: [" + ex.getClass().getSimpleName() + "] " + ex.getMessage());
            }
        });
    }

    /*
     * Method to send embed messages.
     *
     * @param {String} channelName
     * @param {String} message
     * @param {String} color
     */
    public void sendMessageEmbed(String channelName, String color, String message) {
        sendMessageEmbed(getChannel(channelName), color, message);
    }

    /*
     * Method to send a file to a channel.
     *
     * @param {IChannel} channel
     * @param {String}   message
     * @param {String}   fileLocation
     */
    public void sendFile(IChannel channel, String message, String fileLocation) {
        RequestBuffer.request(() -> {
            try {
                if (channel != null) {
                    com.gmt2001.Console.out.println("[DISCORD] [#" + channel.getName() + "] [UPLOAD] [" + fileLocation + "] " + message);

                    if (message.isEmpty()) {
                        channel.sendFile(new File(fileLocation));
                    } else {
                        channel.sendFile(message, new File(fileLocation));
                    }
                }
            } catch (MissingPermissionsException | DiscordException | FileNotFoundException ex) {
                com.gmt2001.Console.err.println("Failed to upload a file: [" + ex.getClass().getSimpleName() + "] " + ex.getMessage());
            }
        });
    }

    /*
     * Method to send a file to a channel.
     *
     * @param {String} channelName
     * @param {String} message
     * @param {String} fileLocation
     */
    public void sendFile(String channelName, String message, String fileLocation) {
        sendFile(getChannel(channelName), message, fileLocation);
    }

    /*
     * Method to send a file to a channel.
     *
     * @param {String} channelName
     * @param {String} fileLocation
     */
    public void sendFile(String channelName, String fileLocation) {
        sendFile(getChannel(channelName), "", fileLocation);
    }

    /*
     * Method to return a channel object by its name.
     *
     * @param  {String} channelName
     * @return {IChannel}
     */
    public IChannel getChannel(String channelName) {
        List<IChannel> channels = DiscordAPI.guild.getChannelsByName(channelName);

        for (IChannel channel : channels) {
            if (channel.getName().equals(channelName)) {
                return channel;
            }
        }
        return null;
    }

    /*
     * Method to return a user object by its name.
     *
     * @param  {String} userName
     * @return {IUser}
     */
    public IUser getUser(String userName) {
        List<IUser> users = DiscordAPI.guild.getUsersByName(userName, true);

        for (IUser user : users) {
            if (user.getDisplayName(DiscordAPI.guild).equals(userName)) {
                return user;
            }
        }
        return null;
    }

    /*
     * Method to return a user object by its name and its discriminator.
     *
     * @param  {String} userName
     * @param  {String} discriminator
     * @return {IUser}
     */
    public IUser getUserWithDiscriminator(String userName, String discriminator) {
        List<IUser> users = DiscordAPI.guild.getUsersByName(userName, true);

        for (IUser user : users) {
            if (user.getDisplayName(DiscordAPI.guild).equals(userName) && user.getDiscriminator().equals(discriminator)) {
                return user;
            }
        }
        return null;
    }

    /*
     * Method to return a role object by its name.
     *
     * @param  {String} roleName
     * @return {IRole}
     */
    public IRole getRole(String roleName) {
        List<IRole> roles = DiscordAPI.guild.getRolesByName(roleName);

        for (IRole role : roles) {
            if (role.getName().equals(roleName)) {
                return role;
            }
        }
        return null;
    }

    /*
     * Method to set a role on a user.
     *
     * @param {IRole} role
     * @param {IUser} user
     */
    public void addRole(IRole role, IUser user) {
        RequestBuffer.request(() -> {
            try {
                if (role != null && user != null) {
                    user.addRole(role);
                }
            } catch (MissingPermissionsException | DiscordException ex) {
                com.gmt2001.Console.err.println("Failed to add role on user: [" + ex.getClass().getSimpleName() + "] " + ex.getMessage());
            }
        });
    }

    /*
     * Method to set a role on a user.
     *
     * @param {String} roleName
     * @param {String} userName
     */
    public void addRole(String roleName, String userName) {
        addRole(getRole(roleName), getUser(userName));
    }

    /*
     * Method to remove a role on a user.
     *
     * @param {IRole} role
     * @param {IUser} user
     */
    public void removeRole(IRole role, IUser user) {
        RequestBuffer.request(() -> {
            try {
                if (role != null && user != null) {
                    user.removeRole(role);
                }
            } catch (MissingPermissionsException | DiscordException ex) {
                com.gmt2001.Console.err.println("Failed to remove role on user: [" + ex.getClass().getSimpleName() + "] " + ex.getMessage());
            }
        });
    }

    /*
     * Method to remove a role on a user.
     *
     * @param {String} roleName
     * @param {String} userName
     */
    public void removeRole(String roleName, String userName) {
        removeRole(getRole(roleName), getUser(userName));
    }
    
    /*
     * Method to create a new role.
     *
     * @param {String} roleName
     */
    public void createRole(String roleName) {
    	RequestBuffer.request(() -> {
    		try {
    			DiscordAPI.guild.createRole().changeName(roleName);
    		} catch (MissingPermissionsException | DiscordException ex) {
    			com.gmt2001.Console.err.println("Failed to create role: [" + ex.getClass().getSimpleName() + "] " + ex.getMessage());
    		}
    	});
    }

    /*
     * Method to delete a role.
     *
     * @param {IRole} role
     */
    public void deleteRole(IRole role) {
    	RequestBuffer.request(() -> {
    		try {
    			if (role != null) {
    				role.delete();
    			}
    		} catch (MissingPermissionsException | DiscordException ex) {
    			com.gmt2001.Console.err.println("Failed to delete role: [" + ex.getClass().getSimpleName() + "] " + ex.getMessage());
    		}
    	});
    }

    /*
     * Method to delete a role.
     *
     * @param {String} roleName
     */
    public void deleteRole(String roleName) {
    	deleteRole(getRole(roleName));
    }

    /*
     * Method to check if someone is an administrator.
     *
     * @param  {IUser} user
     * @return {Boolean}
     */
    public boolean isAdministrator(IUser user) {
        return (user != null ? user.getPermissionsForGuild(DiscordAPI.guild).contains(Permissions.ADMINISTRATOR) : false);
    }

    /*
     * Method to check if someone is an administrator.
     *
     * @param  {String} userName
     * @return {Boolean}
     */
    public boolean isAdministrator(String userName) {
        return isAdministrator(getUser(userName));
    }

    /*
     * Method to bulk delete messages from a channel.
     *
     * @param {IChannel} channel
     * @param {Number}   amount
     */
    public void bulkDelete(IChannel channel, int amount) {
        // Discord4J says that getting messages can block the current thread if they need to be requested from Discord's API.
        // So start this on a new thread to avoid that. Please note that you need to delete at least 2 messages.

        if (channel != null) {
            Thread thread = new Thread(new Runnable() {
                @Override
                public void run() {
                    RequestBuffer.request(() -> {
                        try {
                            List<IMessage> messages = channel.getMessageHistoryFrom(LocalDateTime.now(), (amount < 2 ? 2 : amount));
                            
                            channel.bulkDelete(messages);
                        } catch (DiscordException ex) {
                            com.gmt2001.Console.err.println("Failed to bulk delete messages: [" + ex.getClass().getSimpleName() + "] " + ex.getMessage());
                        }
                    });
                }
            }, "tv.phantombot.discord.util.DiscordUtil::bulkDelete");
    
            thread.start();
        }
    }

    /*
     * Method to bulk delete messages from a channel.
     *
     * @param {String} channelName
     * @param {Number} amount
     */
    public void bulkDelete(String channelName, int amount) {
        bulkDelete(getChannel(channelName), amount);
    }

    /*
     * Method to bulk delete messages from a channel.
     *
     * @param {IChannel} channel
     * @param {Array}   list
     */
    public void bulkDeleteMessages(IChannel channel, IMessage[] list) {
        // Discord4J says that getting messages can block the current thread if they need to be requested from Discord's API.
        // So start this on a new thread to avoid that. Please note that you need to delete at least 2 messages.

        if (channel != null) {
            RequestBuffer.request(() -> {
                try {
                    List<IMessage> messages = Arrays.asList(list);
                
                    channel.bulkDelete(messages);
                } catch (DiscordException ex) {
                    com.gmt2001.Console.err.println("Failed to bulk delete messages: [" + ex.getClass().getSimpleName() + "] " + ex.getMessage());
                }
            });
        }
    }

    /*
     * Method to bulk delete messages from a channel.
     *
     * @param {String} channelName
     * @param {Array} messages
     */
    public void bulkDeleteMessages(String channelName, IMessage[] messages) {
        bulkDeleteMessages(getChannel(channelName), messages);
    }

    /*
     * Method to delete a message.
     *
     * @param {IMessage} message
     */
    public void deleteMessage(IMessage message) {
        message.delete();
    }

    /*
     * Method to set the current game.
     *
     * @param {String} game
     */
    public void setGame(String game) {
        DiscordAPI.shard.changePlayingText(game);
    }

    /*
     * Method to set the current game and stream.
     *
     * @param {String} game
     * @param {String} url
     */
    public void setStream(String game, String url) {
        DiscordAPI.shard.streaming(game, url);
    }

    /*
     * Method to remove the current game or reset the streaming status.
     *
     */
    public void removeGame() {
        DiscordAPI.shard.online();
    }

    /*
     * Method that gets all server members
     */
    public List<IUser> getUsers() {
        return DiscordAPI.client.getUsers();
    }

    /*
     * Method to get a color object.
     *
     * @param  {String} color
     * @return {Color}
     */
    public Color getColor(String color) throws IllegalArgumentException {
        Matcher match = Pattern.compile("(\\d{1,3}),?\\s?(\\d{1,3}),?\\s?(\\d{1,3})").matcher(color);

        if (match.find()) {
            return new Color(Integer.parseInt(match.group(1)), Integer.parseInt(match.group(2)), Integer.parseInt(match.group(3)));
        } else {
            switch (color) {
                case "black": 
                    return Color.black;
                case "blue": 
                    return Color.blue;
                case "cyan": 
                    return Color.cyan;
                case "gray": 
                    return Color.gray;
                case "green": 
                    return Color.green;
                case "magenta": 
                    return Color.magenta;
                case "orange": 
                    return Color.orange;
                case "pink": 
                    return Color.pink;
                case "red": 
                    return Color.red;
                case "white": 
                    return Color.white;
                case "yellow": 
                    return Color.yellow;
                default: 
                    return Color.gray;
            }
        }
    }
}
