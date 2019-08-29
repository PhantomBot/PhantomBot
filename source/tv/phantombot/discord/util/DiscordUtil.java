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

import discord4j.core.object.entity.Channel;
import discord4j.core.object.entity.GuildChannel;
import discord4j.core.object.entity.Member;
import discord4j.core.object.entity.Message;
import discord4j.core.object.entity.PrivateChannel;
import discord4j.core.object.entity.Role;
import discord4j.core.object.entity.TextChannel;
import discord4j.core.object.entity.User;
import discord4j.core.object.presence.Activity;
import discord4j.core.object.presence.Presence;
import discord4j.core.object.reaction.ReactionEmoji;

import java.util.regex.Pattern;
import java.util.regex.Matcher;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

import java.io.FileNotFoundException;
import java.io.File;

import java.awt.Color;
import java.io.FileInputStream;
import java.util.logging.Level;
import java.util.logging.Logger;

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
     * @return {Message}
     */
    public Message sendMessage(TextChannel channel, String message) {
        if (channel != null) {
            com.gmt2001.Console.out.println("[DISCORD] [#" + channel.getMention() + "] [CHAT] " + message);

            return channel.createMessage(message).doOnError(e -> {
                com.gmt2001.Console.err.println("Failed to send a message: [" + e.getClass().getSimpleName() + "] " + e.getMessage());
            }).onErrorReturn(null).block();
        } else if (DiscordAPI.instance().checkConnectionStatus() == DiscordAPI.ConnectionState.RECONNECTED) {
            return sendMessage(channel, message);
        } else {
            com.gmt2001.Console.err.println("Failed to send a message: [IllegalArgumentException] channel object was null");
        }
        
        return null;
    }

    /**
     * Method to send a message to a channel.
     *
     * @param  channelName
     * @param  message
     * @return {Message}
     */
    public Message sendMessage(String channelName, String message) {
        return sendMessage(getChannel(channelName), message);
    }

    /**
     * Method to send private messages to a user.
     *
     * @param user
     * @param message
     */
    public void sendPrivateMessage(User user, String message) {
        if (user != null) {
            com.gmt2001.Console.out.println("[DISCORD] [@" + user.getUsername().toLowerCase() + "#" + user.getDiscriminator() + "] [DM] " + message);
            
            PrivateChannel channel = user.getPrivateChannel().doOnError(e -> {
                com.gmt2001.Console.err.println("Failed to send a private message: [" + e.getClass().getSimpleName() + "] " + e.getMessage());
            }).block();
            
            if (channel != null) {
                channel.createMessage(message).doOnError(e -> {
                    com.gmt2001.Console.err.println("Failed to send a private message: [" + e.getClass().getSimpleName() + "] " + e.getMessage());
                }).block();
            }
        } else if (DiscordAPI.instance().checkConnectionStatus() == DiscordAPI.ConnectionState.RECONNECTED) {
            sendPrivateMessage(user, message);
        } else {
            com.gmt2001.Console.err.println("Failed to send a private message: [IllegalArgumentException] user object was null");
        }
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
     * @param  message
     * @param  color
     * @return {IMessage}
     */
    public Message sendMessageEmbed(TextChannel channel, String color, String message) {
        if (channel != null) {
            com.gmt2001.Console.out.println("[DISCORD] [#" + channel.getName() + "] [EMBED] " + message);

            return channel.createMessage(msg ->
                    msg.setEmbed(ebd ->
                            ebd.setColor(getColor(color)).setDescription(message)
                    )
            ).doOnError(e -> {
                com.gmt2001.Console.err.println("Failed to send an embed message: [" + e.getClass().getSimpleName() + "] " + e.getMessage());
            }).onErrorReturn(null).block();
        } else if (DiscordAPI.instance().checkConnectionStatus() == DiscordAPI.ConnectionState.RECONNECTED) {
            return sendMessageEmbed(channel, color, message);
        } else {
            com.gmt2001.Console.err.println("Failed to send an embed message: [IllegalArgumentException] channel object was null");
        }
        
        return null;
    }

    /**
     * Method to send embed messages.
     *
     * @param channelName
     * @param message
     * @param color
     * @return {IMessage}
     */
    public Message sendMessageEmbed(String channelName, String color, String message) {
        return sendMessageEmbed(getChannel(channelName), color, message);
    }

    /**
     * Method to send a file to a channel.
     *
     * @param  channel
     * @param  message
     * @param  fileLocation
     * @return {Message}
     */
    public Message sendFile(TextChannel channel, String message, String fileLocation) {
        if (channel != null) {
            if (fileLocation.contains("..")) {
                com.gmt2001.Console.err.println("[DISCORD] [#" + channel.getName() + "] [UPLOAD] [" + fileLocation + "] Rejecting fileLocation that contains '..'");
                return null;
            } else {
                com.gmt2001.Console.out.println("[DISCORD] [#" + channel.getName() + "] [UPLOAD] [" + fileLocation + "] " + message);

                if (message.isEmpty()) {
                    return channel.createMessage(msg -> 
                            {
                                try {
                                    msg.addFile(fileLocation, new FileInputStream(fileLocation));
                                } catch (FileNotFoundException ex) {
                                    com.gmt2001.Console.err.println("Failed to upload a file: [" + ex.getClass().getSimpleName() + "] " + ex.getMessage());
                                }
                            }
                    ).doOnError(e -> {
                        com.gmt2001.Console.err.println("Failed to send a message: [" + e.getClass().getSimpleName() + "] " + e.getMessage());
                    }).onErrorReturn(null).block();
                } else {
                    return channel.createMessage(msg -> 
                            {
                                try {
                                    msg.addFile(fileLocation, new FileInputStream(fileLocation)).setContent(message);
                                } catch (FileNotFoundException ex) {
                                    com.gmt2001.Console.err.println("Failed to upload a file: [" + ex.getClass().getSimpleName() + "] " + ex.getMessage());
                                }
                            }
                    ).doOnError(e -> {
                        com.gmt2001.Console.err.println("Failed to send a message: [" + e.getClass().getSimpleName() + "] " + e.getMessage());
                    }).onErrorReturn(null).block();
                }
            }
        } else if (DiscordAPI.instance().checkConnectionStatus() == DiscordAPI.ConnectionState.RECONNECTED) {
            return sendFile(channel, message, fileLocation);
        } else {
            com.gmt2001.Console.err.println("Failed to send a message: [IllegalArgumentException] channel object was null");
        }
        
        return null;
    }

    /**
     * Method to send a file to a channel.
     *
     * @param channelName
     * @param message
     * @param fileLocation
     * @return {IMessage}
     */
    public Message sendFile(String channelName, String message, String fileLocation) {
        return sendFile(getChannel(channelName), message, fileLocation);
    }

    /**
     * Method to send a file to a channel.
     *
     * @param  channel
     * @param  fileLocation
     * @return {IMessage}
     */
    public Message sendFile(TextChannel channel, String fileLocation) {
        return sendFile(channel, "", fileLocation);
    }

    /**
     * Method to send a file to a channel.
     *
     * @param channelName
     * @param fileLocation
     * @return {IMessage}
     */
    public Message sendFile(String channelName, String fileLocation) {
        return sendFile(getChannel(channelName), "", fileLocation);
    }

    /**
     * Method that adds a reaction to a message.
     *
     * @param message The message object
     * @param emoji The reaction object
     */
    public void addReaction(Message message, ReactionEmoji emoji) {
        if (message != null && emoji != null) {
            message.addReaction(emoji).doOnError(e -> {
                com.gmt2001.Console.err.println("Failed to add a reaction: [" + e.getClass().getSimpleName() + "] " + e.getMessage());
            }).block();
        } else if (DiscordAPI.instance().checkConnectionStatus() == DiscordAPI.ConnectionState.RECONNECTED) {
            addReaction(message, emoji);
        } else {
            com.gmt2001.Console.err.println("Failed to add a reaction: [IllegalArgumentException] message or emoji object was null");
        }
    }

    /**
     * Method that adds multiple reactions to a message.
     *
     * @param message The message object
     * @param emojis The reaction objects
     */
    public void addReactions(Message message, ReactionEmoji[] emojis) {
        for (ReactionEmoji emoji : emojis) {
            addReaction(message, emoji);
        }
    }

    /**
     * Method to return a channel object by its name.
     *
     * @param  channelName - The name of the channel.
     * @return {IChannel}
     */
    public TextChannel getChannel(String channelName) {
        // Remove any # in the channel name.
        channelName = sanitizeChannelName(channelName);
        
        List<GuildChannel> channels = DiscordAPI.getGuild().getChannels().collectList().block();

        if (channels!= null) {
            for (GuildChannel channel : channels) {
                if ((channel.getName().equalsIgnoreCase(channelName)
                        || channel.getId().asString().equals(channelName))
                        && channel.getType() == Channel.Type.GUILD_TEXT) {
                    return (TextChannel)channel;
                }
            }
        }

        return null;
    }

    /**
     * Method to return a channel object by its ID.
     *
     * @param   channelId - The string ID of the channel
     * @return {Channel}
     */
    public TextChannel getChannelByID(String channelId) {
        List<GuildChannel> channels = DiscordAPI.getGuild().getChannels().collectList().block();

        if (channels!= null) {
            for (GuildChannel channel : channels) {
                if ((channel.getId().asString().equals(channelId))
                        && channel.getType() == Channel.Type.GUILD_TEXT) {
                    return (TextChannel)channel;
                }
            }
        }

        return null;
    }

    /**
     * Method to return a user object by its name.
     *
     * @param  userName - The user's name.
     * @return {User}
     */
    public User getUser(String userName) {
        List<Member> users = DiscordAPI.getGuild().getMembers().collectList().block();

        if (users != null) {
            for (Member user : users) {
                if (user.getDisplayName().equalsIgnoreCase(userName)) {
                    return user;
                }
            }
        }
        
        return null;
    }

    /**
     * Method to return a user object by its id.
     *
     * @param  userId - The ID of the user.
     * @return {User}
     */
    public User getUserById(long userId) {
        List<Member> users = DiscordAPI.getGuild().getMembers().collectList().block();

        if (users != null) {
            for (Member user : users) {
                if (user.getId().asLong() == userId) {
                    return user;
                }
            }
        }
        
        return null;
    }

    /**
     * Method to return a user object by its name and its discriminator.
     *
     * @param  userName
     * @param  discriminator
     * @return {User}
     */
    public User getUserWithDiscriminator(String userName, String discriminator) {
        List<Member> users = DiscordAPI.getGuild().getMembers().collectList().block();

        if (users != null) {
            for (Member user : users) {
                if (user.getDisplayName().equalsIgnoreCase(userName)
                        && user.getDiscriminator().equalsIgnoreCase(discriminator)) {
                    return user;
                }
            }
        }
        
        return null;
    }

    /**
     * Method to return a role object by its name.
     *
     * @param  roleName
     * @return {Role}
     */
    public Role getRole(String roleName) {
        List<Role> roles = DiscordAPI.getGuild().getRoles().collectList().block();

        if (roles != null) {
            for (Role role : roles) {
                if (role.getName().equalsIgnoreCase(roleName)) {
                    return role;
                }
            }
        }
        
        return null;
    }

    /**
     * Method that returns a role by its ID.
     *
     * @param id
     * @return {Role}
     */
    public Role getRoleByID(String id) {
       List<Role> roles = DiscordAPI.getGuild().getRoles().collectList().block();

        if (roles != null) {
            for (Role role : roles) {
                if (role.getId().asString().equalsIgnoreCase(id)) {
                    return role;
                }
            }
        }
        
        return null;
    }

    /**
     * Method to get an array of role objects by a string of role names.
     *
     * @param  roles
     * @return {Role[]}
     */
    public Role[] getRoleObjects(String[] roles) {
        Role[] list = new Role[roles.length];

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
    public Role[] getUserRoles(User user) {
        Member m = user.asMember(DiscordAPI.getGuild().getId()).block();
        
        if (m == null) {
            return new Role[0];
        }
        
        List<Role> roles = m.getRoles().collectList().block();
        
        if (roles == null) {
            return new Role[0];
        }

        return (roles.size() < 1 ? new Role[0] : roles.toArray(new Role[roles.size()]));
    }

    /**
     * Method to get a list of a user's roles.
     *
     * @param  userId
     * @return {List}
     */
    public Role[] getUserRoles(String userId) {
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
        DiscordAPI.getClient().updatePresence(Presence.online(Activity.playing(game))).doOnError(e -> {
            com.gmt2001.Console.err.println("Failed to set stream: [" + e.getClass().getSimpleName() + "] " + e.getMessage());
        }).block();
    }

    /**
     * Method to set the current game and stream.
     *
     * @param game
     * @param url
     */
    public void setStream(String game, String url) {
        DiscordAPI.getClient().updatePresence(Presence.online(Activity.streaming(game, url))).doOnError(e -> {
            com.gmt2001.Console.err.println("Failed to set stream: [" + e.getClass().getSimpleName() + "] " + e.getMessage());
        }).block();
    }

    /**
     * Method to remove the current game or reset the streaming status.
     *
     */
    public void removeGame() {
        DiscordAPI.getClient().updatePresence(Presence.online()).block();
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
