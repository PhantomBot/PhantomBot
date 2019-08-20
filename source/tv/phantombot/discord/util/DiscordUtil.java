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
package tv.phantombot.discord.util;

import com.vdurmont.emoji.Emoji;
import sx.blah.discord.api.internal.json.objects.EmbedObject;

import sx.blah.discord.handle.obj.Permissions;
import sx.blah.discord.handle.obj.IChannel;
import sx.blah.discord.handle.obj.IMessage;
import sx.blah.discord.handle.obj.IUser;
import sx.blah.discord.handle.obj.IRole;

import sx.blah.discord.util.MissingPermissionsException;
import sx.blah.discord.util.DiscordException;
import sx.blah.discord.util.RequestBuffer;
import sx.blah.discord.util.EmbedBuilder;

import java.util.regex.Pattern;
import java.util.regex.Matcher;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

import java.io.FileNotFoundException;
import java.io.File;

import java.awt.Color;
import sx.blah.discord.handle.impl.obj.ReactionEmoji;

import sx.blah.discord.handle.obj.ActivityType;
import sx.blah.discord.handle.obj.StatusType;

import tv.phantombot.discord.DiscordAPI;

/**
 * Has all of the methods to work with Discord4J.
 *
 * @author IllusionaryOne
 * @author ScaniaTV
 */
public class DiscordUtil {

    /**
     * Method that removes the # in the channel name.
     *
     * @param  channelName
     * @return {String}
     */
    public String sanitizeChannelName(String channelName) {
        // We have to make sure that it's at the start.
        if (channelName.startsWith("#")) {
            return channelName.substring(1);
        } else {
            return channelName;
        }
    }

    /**
     * Method to send a message to a channel.
     *
     * @param  channel
     * @param  message
     * @return {IMessage}
     */
    public IMessage sendMessage(IChannel channel, String message) {
        return RequestBuffer.request(() -> {
            try {
                if (channel != null) {
                    com.gmt2001.Console.out.println("[DISCORD] [#" + channel.getName() + "] [CHAT] " + message);

                    return channel.sendMessage(message);
                } else if (DiscordAPI.instance().checkConnectionStatus() == DiscordAPI.ConnectionState.RECONNECTED) {
                    return sendMessage(channel, message);
                } else {
                    // Throw this if the channel object is null.
                    throw new DiscordException("Failed to send message due to the channel object being null.");
                }
            } catch (MissingPermissionsException | DiscordException ex) {
                com.gmt2001.Console.err.println("Failed to send a message: [" + ex.getClass().getSimpleName() + "] " + ex.getMessage());
                return null;
            }
        }).get();
    }

    /**
     * Method to send a message to a channel.
     *
     * @param  channelName
     * @param  message
     * @return {IMessage}
     */
    public IMessage sendMessage(String channelName, String message) {
        return sendMessage(getChannel(channelName), message);
    }

    /**
     * Method to send private messages to a user.
     *
     * @param user
     * @param message
     */
    public void sendPrivateMessage(IUser user, String message) {
        RequestBuffer.request(() -> {
            try {
                if (user != null) {
                    com.gmt2001.Console.out.println("[DISCORD] [@" + user.getName().toLowerCase() + "#" + user.getDiscriminator() + "] [DM] " + message);

                    user.getOrCreatePMChannel().sendMessage(message);
                } else if (DiscordAPI.instance().checkConnectionStatus() == DiscordAPI.ConnectionState.RECONNECTED) {
                    sendPrivateMessage(user, message);
                } else {
                    // Throw this if the user object is null.
                    throw new DiscordException("Failed to send private message due to the user being null.");
                }
            } catch (MissingPermissionsException | DiscordException ex) {
                com.gmt2001.Console.err.println("Failed to send a private message: [" + ex.getClass().getSimpleName() + "] " + ex.getMessage());
            }
        });
    }

    /**
     * Method to send private messages to a user.
     *
     * @param userName
     * @param message
     */
    public void sendPrivateMessage(String userName, String message) {
        sendPrivateMessage(getUser(userName), message);
    }

    /**
     * Method to send embed messages.
     *
     * @param  channel
     * @param  builder
     * @return {IMessage}
     */
    public IMessage sendMessageEmbed(IChannel channel, EmbedObject builder) {
        return RequestBuffer.request(() -> {
            try {
                if (channel != null && builder != null) {
                    com.gmt2001.Console.out.println("[DISCORD] [#" + channel.getName() + "] [EMBED] ");

                    return channel.sendMessage(builder);
                } else if (DiscordAPI.instance().checkConnectionStatus() == DiscordAPI.ConnectionState.RECONNECTED) {
                    return sendMessageEmbed(channel, builder);
                } else {
                    // Throw this if the channel and builder object is null.
                    throw new DiscordException("Failed to send embed message due to either the channel or builder being null.");
                }
            } catch (MissingPermissionsException | IllegalArgumentException | DiscordException ex) {
                com.gmt2001.Console.err.println("Failed to send an embed message: [" + ex.getClass().getSimpleName() + "] " + ex.getMessage());
                return null;
            }
        }).get();
    }

    /**
     * Method to send embed messages.
     *
     * @param  channelName
     * @param builder
     * @return {IMessage}
     */
    public IMessage sendMessageEmbed(String channelName, EmbedObject builder) {
        return sendMessageEmbed(getChannel(channelName), builder);
    }

    /**
     * Method to send embed messages.
     *
     * @param  channel
     * @param  message
     * @param  color
     * @return {IMessage}
     */
    public IMessage sendMessageEmbed(IChannel channel, String color, String message) {
        return RequestBuffer.request(() -> {
            try {
                EmbedObject builder = new EmbedBuilder().withDescription(message).withColor(getColor(color)).build();

                if (channel != null) {
                    com.gmt2001.Console.out.println("[DISCORD] [#" + channel.getName() + "] [EMBED] " + message);

                    return channel.sendMessage(builder);
                } else if (DiscordAPI.instance().checkConnectionStatus() == DiscordAPI.ConnectionState.RECONNECTED) {
                    return sendMessageEmbed(channel, color, message);
                } else {
                    // Throw this if the channel object is null.
                    throw new DiscordException("Failed to send embed message due to the channel being null.");
                }
            } catch (MissingPermissionsException | IllegalArgumentException | DiscordException ex) {
                com.gmt2001.Console.err.println("Failed to send an embed message: [" + ex.getClass().getSimpleName() + "] " + ex.getMessage());
                return null;
            }
        }).get();
    }

    /**
     * Method to send embed messages.
     *
     * @param channelName
     * @param message
     * @param color
     * @return {IMessage}
     */
    public IMessage sendMessageEmbed(String channelName, String color, String message) {
        return sendMessageEmbed(getChannel(channelName), color, message);
    }

    /**
     * Method to send a file to a channel.
     *
     * @param  channel
     * @param  message
     * @param  fileLocation
     * @return {IMessage}
     */
    public IMessage sendFile(IChannel channel, String message, String fileLocation) {
        return RequestBuffer.request(() -> {
            try {
                if (channel != null) {
                    if (fileLocation.contains("..")) {
                        com.gmt2001.Console.err.println("[DISCORD] [#" + channel.getName() + "] [UPLOAD] [" + fileLocation + "] Rejecting fileLocation that contains '..'");
                        return null;
                    } else {
                        com.gmt2001.Console.out.println("[DISCORD] [#" + channel.getName() + "] [UPLOAD] [" + fileLocation + "] " + message);

                        if (message.isEmpty()) {
                            return channel.sendFile(new File("addons/" + fileLocation));
                        } else {
                            return channel.sendFile(message, new File("addons/" + fileLocation));
                        }
                    }
                } else if (DiscordAPI.instance().checkConnectionStatus() == DiscordAPI.ConnectionState.RECONNECTED) {
                    return sendFile(channel, message, fileLocation);
                } else {
                    // Throw this if the channel object is null.
                    throw new DiscordException("Failed to send file message due to the channel being null.");
                }
            } catch (MissingPermissionsException | FileNotFoundException | DiscordException ex) {
                com.gmt2001.Console.err.println("Failed to upload a file: [" + ex.getClass().getSimpleName() + "] " + ex.getMessage());
                return null;
            }
        }).get();
    }

    /**
     * Method to send a file to a channel.
     *
     * @param channelName
     * @param message
     * @param fileLocation
     * @return {IMessage}
     */
    public IMessage sendFile(String channelName, String message, String fileLocation) {
        return sendFile(getChannel(channelName), message, fileLocation);
    }

    /**
     * Method to send a file to a channel.
     *
     * @param  channel
     * @param  fileLocation
     * @return {IMessage}
     */
    public IMessage sendFile(IChannel channel, String fileLocation) {
        return sendFile(channel, "", fileLocation);
    }

    /**
     * Method to send a file to a channel.
     *
     * @param channelName
     * @param fileLocation
     * @return {IMessage}
     */
    public IMessage sendFile(String channelName, String fileLocation) {
        return sendFile(getChannel(channelName), "", fileLocation);
    }

    /**
     * Method that adds a reaction to a message.
     *
     * @param message The message object
     * @param emoji The reaction object
     */
    public void addReaction(IMessage message, ReactionEmoji emoji) {
        RequestBuffer.request(() -> {
            try {
                if (message != null && emoji != null) {
                    message.addReaction(emoji);
                } else if (DiscordAPI.instance().checkConnectionStatus() == DiscordAPI.ConnectionState.RECONNECTED) {
                    addReaction(message, emoji);
                } else {
                    // Throw this if the message object is null.
                    throw new DiscordException("Failed to add reaction to message due to the message or reaction being null.");
                }
            } catch (MissingPermissionsException | DiscordException ex) {
                com.gmt2001.Console.err.println("Failed to add a reaction: [" + ex.getClass().getSimpleName() + "] " + ex.getMessage());
            }
        }).get();
    }

    /**
     * Method that adds a reaction to a message.
     *
     * @param message The message object
     * @param emoji The reaction object
     */
    public void addReaction(IMessage message, Emoji emoji) {
        RequestBuffer.request(() -> {
            try {
                if (message != null && emoji != null) {
                    message.addReaction(emoji);
                } else if (DiscordAPI.instance().checkConnectionStatus() == DiscordAPI.ConnectionState.RECONNECTED) {
                    addReaction(message, emoji);
                } else {
                    // Throw this if the message object is null.
                    throw new DiscordException("Failed to add reaction to message due to the message or reaction being null.");
                }
            } catch (MissingPermissionsException | DiscordException ex) {
                com.gmt2001.Console.err.println("Failed to add a reaction: [" + ex.getClass().getSimpleName() + "] " + ex.getMessage());
            }
        }).get();
    }

    /**
     * Method that adds multiple reactions to a message.
     *
     * @param message The message object
     * @param emojis The reaction objects
     */
    public void addReactions(IMessage message, ReactionEmoji[] emojis) {
        for (ReactionEmoji emoji : emojis) {
            addReaction(message, emoji);
        }
    }

    /**
     * Method that adds multiple reactions to a message.
     *
     * @param message The message object
     * @param emojis The reaction objects
     */
    public void addReactions(IMessage message, Emoji[] emojis) {
        for (Emoji emoji : emojis) {
            addReaction(message, emoji);
        }
    }

    /**
     * Method to return a channel object by its name.
     *
     * @param  channelName - The name of the channel.
     * @return {IChannel}
     */
    public IChannel getChannel(String channelName) throws NullPointerException {
        // Remove any # in the channel name.
        channelName = sanitizeChannelName(channelName);
        
        List<IChannel> channels = DiscordAPI.getGuild().getChannels();

        for (IChannel channel : channels) {
            if (channel.getName().equalsIgnoreCase(channelName)
                    || channel.getStringID().equals(channelName)) {
                return channel;
            }
        }

        return null;
    }

    /**
     * Method to return a channel object by its ID.
     *
     * @param   channelId - The string ID of the channel
     * @return {IChannel}
     */
    public IChannel getChannelByID(String channelId) throws NullPointerException {
        List<IChannel> channels = DiscordAPI.getGuild().getChannels();

        for (IChannel channel : channels) {
            if (channel.getStringID().equals(channelId)) {
                return channel;
            }
        }
        return null;
    }

    /**
     * Method to return a user object by its name.
     *
     * @param  userName - The user's name.
     * @return {IUser}
     */
    public IUser getUser(String userName) throws NullPointerException {
        List<IUser> users = DiscordAPI.getGuild().getUsers();

        for (IUser user : users) {
            if (user.getDisplayName(DiscordAPI.getGuild()).equalsIgnoreCase(userName)) {
                return user;
            }
        }
        return null;
    }

    /**
     * Method to return a user object by its id.
     *
     * @param  userId - The ID of the user.
     * @return {IUser}
     */
    public IUser getUserById(long userId) throws NullPointerException {
        List<IUser> users = DiscordAPI.getGuild().getUsers();

        for (IUser user : users) {
            if (user.getLongID() == userId) {
                return user;
            }
        }
        return null;
    }

    /**
     * Method to return a user object by its name and its discriminator.
     *
     * @param  userName
     * @param  discriminator
     * @return {IUser}
     */
    public IUser getUserWithDiscriminator(String userName, String discriminator) throws NullPointerException {
        List<IUser> users = DiscordAPI.getGuild().getUsersByName(userName, true);

        for (IUser user : users) {
            if (user.getDisplayName(DiscordAPI.getGuild()).equalsIgnoreCase(userName)
                    && user.getDiscriminator().equalsIgnoreCase(discriminator)) {
                return user;
            }
        }
        return null;
    }

    /**
     * Method to return a role object by its name.
     *
     * @param  roleName
     * @return {IRole}
     */
    public IRole getRole(String roleName) throws NullPointerException {
        List<IRole> roles = DiscordAPI.getClient().getRoles();

        for (IRole role : roles) {
            if (role.getName().equalsIgnoreCase(roleName)) {
                return role;
            }
        }
        return null;
    }

    /**
     * Method that returns a role by its ID.
     *
     * @param id
     * @return
     */
    public IRole getRoleByID(String id) throws NullPointerException {
       List<IRole> roles = DiscordAPI.getClient().getRoles();

        for (IRole role : roles) {
            if (role.getStringID().equalsIgnoreCase(id)) {
                return role;
            }
        }
        return null;
    }

    /**
     * Method to get an array of role objects by a string of role names.
     *
     * @param  roles
     * @return {IRole[]}
     */
    public IRole[] getRoleObjects(String[] roles) {
        IRole[] list = new IRole[roles.length];

        for (int i = 0; i < roles.length; i++) {
            list[i] = getRole(roles[i]);
        }
        return list;
    }

    /**
     * Method to get a list of a user's roles.
     *
     * @param  user
     * @return {List}
     */
    public IRole[] getUserRoles(IUser user) {
        List<IRole> roles = (user == null ? new ArrayList<>() : DiscordAPI.getGuild().getRolesForUser(user));

        return (roles.size() < 1 ? new IRole[0] : roles.toArray(new IRole[roles.size()]));
    }

    /**
     * Method to get a list of a user's roles.
     *
     * @param  userId
     * @return {List}
     */
    public IRole[] getUserRoles(String userId) {
        return getUserRoles(getUserById(Long.parseUnsignedLong(userId)));
    }

    /**
     * Method to edit roles on a user, multiple can be set at once to replace the current ones.
     *
     * @param user
     * @param roles
     */
    public void editUserRoles(IUser user, IRole[] roles) {
        RequestBuffer.request(() -> {
            try {
                if (roles != null && user != null) {
                    DiscordAPI.getGuild().editUserRoles(user, roles);
                }
            } catch (MissingPermissionsException | DiscordException ex) {
                com.gmt2001.Console.err.println("Failed to edit roles on user: [" + ex.getClass().getSimpleName() + "] " + ex.getMessage());
            }
        });
    }

    /**
     * Method to edit roles on a user, multiple can be set at once to replace the current ones.
     *
     * @param userId
     * @param roles
     */
    public void editUserRoles(String userId, IRole[] roles) {
        editUserRoles(getUserById(Long.parseUnsignedLong(userId)), roles);
    }

    /**
     * Method to set a role on a user.
     *
     * @param role
     * @param user
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

    /**
     * Method to set a role on a user.
     *
     * @param roleName
     * @param userName
     */
    public void addRole(String roleName, String userName) {
        addRole(getRole(roleName), getUser(userName));
    }

    /**
     * Method to set a role on a user.
     *
     * @param roleName
     * @param user
     */
    public void addRole(String roleName, IUser user) {
        addRole(getRole(roleName), user);
    }

    /**
     * Method to remove a role on a user.
     *
     * @param role
     * @param user
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

    /**
     * Method to remove a role on a user.
     *
     * @param roleName
     * @param userName
     */
    public void removeRole(String roleName, String userName) {
        removeRole(getRole(roleName), getUser(userName));
    }

    /**
     * Method to create a new role.
     *
     * @param roleName
     */
    public void createRole(String roleName) {
        RequestBuffer.request(() -> {
            try {
                DiscordAPI.getGuild().createRole().changeName(roleName);
            } catch (MissingPermissionsException | DiscordException ex) {
                com.gmt2001.Console.err.println("Failed to create role: [" + ex.getClass().getSimpleName() + "] " + ex.getMessage());
            }
        });
    }

    /**
     * Method to delete a role.
     *
     * @param role
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

    /**
     * Method to delete a role.
     *
     * @param roleName
     */
    public void deleteRole(String roleName) {
        deleteRole(getRole(roleName));
    }

    /**
     * Method that gets a list of guild roles.
     *
     * @return
     */
    public List<IRole> getGuildRoles() {
        return DiscordAPI.getGuild().getRoles();
    }

    /**
     * Method to check if someone is an administrator.
     *
     * @param  user
     * @return {Boolean}
     */
    public boolean isAdministrator(IUser user) {
        return (user != null ? user.getPermissionsForGuild(DiscordAPI.getGuild()).contains(Permissions.ADMINISTRATOR) : false);
    }

    /**
     * Method to check if someone is an administrator.
     *
     * @param  userName
     * @return {Boolean}
     */
    public boolean isAdministrator(String userName) {
        return isAdministrator(getUser(userName));
    }

    /**
     * Method to bulk delete messages from a channel.
     *
     * @param channel
     * @param amount
     */
    public void bulkDelete(IChannel channel, int amount) {
        // Discord4J says that getting messages can block the current thread if they need to be requested from Discord's API.
        // So start this on a new thread to avoid that. Please note that you need to delete at least 2 messages.

        if (channel != null) {
            Thread thread;
            thread = new Thread(() -> {
                RequestBuffer.request(() -> {
                    try {
                        List<IMessage> messages = channel.getMessageHistory(amount < 2 ? 2 : amount);

                        channel.bulkDelete(messages);
                    } catch (DiscordException ex) {
                        com.gmt2001.Console.err.println("Failed to bulk delete messages: [" + ex.getClass().getSimpleName() + "] " + ex.getMessage());
                    }
                });
            }, "tv.phantombot.discord.util.DiscordUtil::bulkDelete");

            thread.start();
        }
    }

    /**
     * Method to bulk delete messages from a channel.
     *
     * @param channelName
     * @param amount
     */
    public void bulkDelete(String channelName, int amount) {
        bulkDelete(getChannel(channelName), amount);
    }

    /**
     * Method to bulk delete messages from a channel.
     *
     * @param channel
     * @param list
     */
    public void bulkDeleteMessages(IChannel channel, IMessage[] list) {
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

    /**
     * Method to bulk delete messages from a channel.
     *
     * @param channelName
     * @param messages
     */
    public void bulkDeleteMessages(String channelName, IMessage[] messages) {
        bulkDeleteMessages(getChannel(channelName), messages);
    }

    /**
     * Method to delete a message.
     *
     * @param message
     */
    public void deleteMessage(IMessage message) {
        RequestBuffer.request(() -> {
            try {
                if (message != null) {
                    message.delete();
                }
            } catch (DiscordException ex) {
                com.gmt2001.Console.err.println("Failed to delete a message: [" + ex.getClass().getSimpleName() + "] " + ex.getMessage());
            }
        });
    }

    /**
     * Method to set the current game.
     *
     * @param game
     */
    public void setGame(String game) {
        try {
            DiscordAPI.getShard().changePresence(StatusType.ONLINE, ActivityType.PLAYING, game);
        } catch (DiscordException ex) {
            com.gmt2001.Console.err.println("Failed to set game: [" + ex.getClass().getSimpleName() + "] " + ex.getMessage());
        }
    }

    /**
     * Method to set the current game and stream.
     *
     * @param game
     * @param url
     */
    public void setStream(String game, String url) {
        try {
            DiscordAPI.getShard().changeStreamingPresence(StatusType.ONLINE, game, url);
        } catch (DiscordException ex) {
            com.gmt2001.Console.err.println("Failed to set stream: [" + ex.getClass().getSimpleName() + "] " + ex.getMessage());
        }
    }

    /**
     * Method to remove the current game or reset the streaming status.
     *
     */
    public void removeGame() {
        DiscordAPI.getShard().changePresence(StatusType.ONLINE, ActivityType.PLAYING, null);
    }

    /**
     * Method that gets all server members
     * @return 
     */
    public List<IUser> getUsers() {
        return DiscordAPI.getClient().getUsers();
    }

    /**
     * Method to get a color object.
     *
     * @param  color
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
