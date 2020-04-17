/*
 * Copyright (C) 2016-2019 phantombot.tv
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
import discord4j.core.object.entity.GuildEmoji;
import discord4j.core.object.entity.GuildMessageChannel;
import discord4j.core.object.entity.Member;
import discord4j.core.object.entity.Message;
import discord4j.core.object.entity.MessageChannel;
import discord4j.core.object.entity.PrivateChannel;
import discord4j.core.object.entity.Role;
import discord4j.core.object.entity.User;
import discord4j.core.object.presence.Activity;
import discord4j.core.object.presence.Presence;
import discord4j.core.object.reaction.ReactionEmoji;
import discord4j.core.object.util.Permission;
import discord4j.core.object.util.PermissionSet;
import discord4j.core.object.util.Snowflake;
import discord4j.core.spec.EmbedCreateSpec;
import discord4j.rest.http.client.ClientException;
import discord4j.rest.json.response.ErrorResponse;
import java.awt.Color;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.Collections;
import java.util.List;
import java.util.Set;
import java.util.function.Consumer;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import reactor.core.publisher.Flux;
import tv.phantombot.discord.DiscordAPI;

/**
 * Has all of the methods to work with Discord4J.
 *
 * @author IllusionaryOne
 * @author ScaniaTV
 */
public class DiscordUtil {

    public DiscordUtil() {
    }

    /**
     * Method that removes the # in the channel name.
     *
     * @param channelName
     * @return {String}
     */
    public String sanitizeChannelName(String channelName) {
        // We have to make sure that it's at the start.
        if (channelName.charAt(0) == '#') {
            return channelName.substring(1);
        } else {
            return channelName;
        }
    }

    /**
     * Method to send a message to a channel.
     *
     * @param channel
     * @param message
     * @return {Message}
     */
    public Message sendMessage(MessageChannel channel, String message) {
        if (channel != null) {
            if (channel.getType() == Channel.Type.DM) {
                sendPrivateMessage((PrivateChannel) channel, message);
                return null;
            }

            com.gmt2001.Console.out.println("[DISCORD] [#" + ((GuildMessageChannel) channel).getName() + "] [CHAT] " + message);

            return channel.createMessage(message).doOnError(e -> {
                com.gmt2001.Console.err.printStackTrace(e);
            }).onErrorReturn(null).block();
        } else if (DiscordAPI.instance().checkConnectionStatus() == DiscordAPI.ConnectionState.RECONNECTED) {
            return sendMessage(channel, message);
        } else {
            throw new IllegalArgumentException("channel object was null");
        }
    }

    /**
     * Method to send a message to a channel.
     *
     * @param channelName
     * @param message
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
            PrivateChannel channel = user.getPrivateChannel().doOnError(e -> {
                com.gmt2001.Console.err.printStackTrace(e);
            }).block();

            sendPrivateMessage(channel, message);
        } else {
            throw new IllegalArgumentException("user object was null");
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
     * Method to send private messages to a user.
     *
     * @param userName
     * @param message
     */
    public void sendPrivateMessage(PrivateChannel channel, String message) {
        if (channel != null) {
            User user = channel.getRecipients().blockFirst();
            String uname = "";
            String udisc = "";

            if (user != null) {
                uname = user.getUsername().toLowerCase();
                udisc = user.getDiscriminator();
            }

            com.gmt2001.Console.out.println("[DISCORD] [@" + uname + "#" + udisc + "] [DM] " + message);

            channel.createMessage(message).doOnError(e -> {
                com.gmt2001.Console.err.printStackTrace(e);
            }).block();
        } else if (DiscordAPI.instance().checkConnectionStatus() == DiscordAPI.ConnectionState.RECONNECTED) {
            sendPrivateMessage(channel, message);
        } else {
            throw new IllegalArgumentException("channel object was null");
        }
    }

    /**
     * Method to send embed messages.
     *
     * @param channel
     * @param embed
     * @return {Message}
     */
    public Message sendMessageEmbed(GuildMessageChannel channel, Consumer<? super EmbedCreateSpec> embed) {
        if (channel != null) {
            Message m = channel.createMessage(msg
                    -> msg.setEmbed(embed)
            ).doOnError(e -> {
                com.gmt2001.Console.err.printStackTrace(e);
            }).onErrorReturn(null).block();

            if (m != null) {
                com.gmt2001.Console.out.println("[DISCORD] [#" + channel.getName() + "] [EMBED] " + m.getEmbeds().get(0).getDescription().orElse(m.getEmbeds().get(0).getTitle().orElse("")));
            }

            return m;
        } else if (DiscordAPI.instance().checkConnectionStatus() == DiscordAPI.ConnectionState.RECONNECTED) {
            return sendMessageEmbed(channel, embed);
        } else {
            throw new IllegalArgumentException("channel object was null");
        }
    }

    /**
     * Method to send embed messages.
     *
     * @param channelName
     * @param embed
     * @return {Message}
     */
    public Message sendMessageEmbed(String channelName, Consumer<? super EmbedCreateSpec> embed) {
        return sendMessageEmbed(getChannel(channelName), embed);
    }

    /**
     * Method to send embed messages.
     *
     * @param channel
     * @param message
     * @param color
     * @return {Message}
     */
    public Message sendMessageEmbed(GuildMessageChannel channel, String color, String message) {
        return sendMessageEmbed(channel, ebd
                -> ebd.setColor(getColor(color)).setDescription(message)
        );
    }

    /**
     * Method to send embed messages.
     *
     * @param channelName
     * @param message
     * @param color
     * @return {Message}
     */
    public Message sendMessageEmbed(String channelName, String color, String message) {
        return sendMessageEmbed(getChannel(channelName), color, message);
    }

    /**
     * Method to send a file to a channel.
     *
     * @param channel
     * @param message
     * @param fileLocation
     * @return {Message}
     */
    public Message sendFile(GuildMessageChannel channel, String message, String fileLocation) {
        if (channel != null) {
            if (fileLocation.contains("..")) {
                com.gmt2001.Console.err.println("[DISCORD] [#" + channel.getName() + "] [UPLOAD] [" + fileLocation + "] Rejecting fileLocation that contains '..'");
                return null;
            } else {
                com.gmt2001.Console.out.println("[DISCORD] [#" + channel.getName() + "] [UPLOAD] [" + fileLocation + "] " + message);

                if (message.isEmpty()) {
                    return channel.createMessage(msg
                            -> {
                        try {
                            msg.addFile(fileLocation, Files.newInputStream(Paths.get(fileLocation)));
                        } catch (IOException ex) {
                            com.gmt2001.Console.err.printStackTrace(ex);
                        }
                    }
                    ).doOnError(e -> {
                        com.gmt2001.Console.err.printStackTrace(e);
                    }).onErrorReturn(null).block();
                } else {
                    return channel.createMessage(msg
                            -> {
                        try {
                            msg.addFile(fileLocation, Files.newInputStream(Paths.get(fileLocation))).setContent(message);
                        } catch (IOException ex) {
                            com.gmt2001.Console.err.printStackTrace(ex);
                        }
                    }
                    ).doOnError(e -> {
                        com.gmt2001.Console.err.printStackTrace(e);
                    }).onErrorReturn(null).block();
                }
            }
        } else if (DiscordAPI.instance().checkConnectionStatus() == DiscordAPI.ConnectionState.RECONNECTED) {
            return sendFile(channel, message, fileLocation);
        } else {
            throw new IllegalArgumentException("channel object was null");
        }
    }

    /**
     * Method to send a file to a channel.
     *
     * @param channelName
     * @param message
     * @param fileLocation
     * @return {Message}
     */
    public Message sendFile(String channelName, String message, String fileLocation) {
        return sendFile(getChannel(channelName), message, fileLocation);
    }

    /**
     * Method to send a file to a channel.
     *
     * @param channel
     * @param fileLocation
     * @return {Message}
     */
    public Message sendFile(GuildMessageChannel channel, String fileLocation) {
        return sendFile(channel, "", fileLocation);
    }

    /**
     * Method to send a file to a channel.
     *
     * @param channelName
     * @param fileLocation
     * @return {Message}
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
                com.gmt2001.Console.err.printStackTrace(e);
            }).block();
        } else if (DiscordAPI.instance().checkConnectionStatus() == DiscordAPI.ConnectionState.RECONNECTED) {
            addReaction(message, emoji);
        } else {
            throw new IllegalArgumentException("message or emoji object was null");
        }
    }

    /**
     * Method that adds multiple reactions to a message.
     *
     * @param message The message object
     * @param emojis The reaction objects
     */
    public void addReactions(Message message, ReactionEmoji... emojis) {
        for (ReactionEmoji emoji : emojis) {
            addReaction(message, emoji);
        }
    }

    /**
     * Method that adds a reaction to a message.
     *
     * @param message The message object
     * @param emoji The emoji unicode
     */
    public void addReaction(Message message, String emoji) {
        List<GuildEmoji> gel = DiscordAPI.getGuild().getEmojis().collectList().block();
        ReactionEmoji re = null;

        if (gel != null) {
            for (GuildEmoji ge : gel) {
                if (ge.getName().equalsIgnoreCase(emoji)) {
                    re = ReactionEmoji.custom(ge);
                }
            }
        }

        if (re == null) {
            re = ReactionEmoji.unicode(emoji);
        }

        addReaction(message, re);
    }

    /**
     * Method that adds a reaction to a message.
     *
     * @param message The message object
     * @param emojis The emoji unicodes
     */
    public void addReactions(Message message, String... emojis) {
        List<GuildEmoji> gel = DiscordAPI.getGuild().getEmojis().collectList().block();
        ReactionEmoji re;
        for (String emoji : emojis) {
            re = null;

            if (gel != null) {
                for (GuildEmoji ge : gel) {
                    if (ge.getName().equalsIgnoreCase(emoji)) {
                        re = ReactionEmoji.custom(ge);
                    }
                }
            }

            if (re == null) {
                re = ReactionEmoji.unicode(emoji);
            }

            addReaction(message, re);
        }
    }

    /**
     * Method to return a channel object by its name.
     *
     * @param channelName - The name of the channel.
     * @return {Channel}
     */
    public GuildMessageChannel getChannel(String channelName) {
        // Remove any # in the channel name.
        channelName = sanitizeChannelName(channelName);

        List<GuildChannel> channels = DiscordAPI.getGuild().getChannels().collectList().block();

        if (channels != null) {
            for (GuildChannel channel : channels) {
                if (channel.getName().equalsIgnoreCase(channelName)
                        || channel.getId().asString().equals(channelName)) {
                    return (GuildMessageChannel) channel;
                }
            }
        }

        return null;
    }

    /**
     * Method to return a channel object by its ID.
     *
     * @param channelId - The string ID of the channel
     * @return {Channel}
     */
    public GuildMessageChannel getChannelByID(String channelId) {
        List<GuildChannel> channels = DiscordAPI.getGuild().getChannels().collectList().block();

        if (channels != null) {
            for (GuildChannel channel : channels) {
                if (channel.getId().asString().equals(channelId)) {
                    return (GuildMessageChannel) channel;
                }
            }
        }

        return null;
    }

    /**
     * Method to return a user object by its name.
     *
     * @param userName - The user's name.
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
     * @param userId - The ID of the user.
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
     * @param userName
     * @param discriminator
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
     * @param roleName
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
     * @param roles
     * @return {Role[]}
     */
    public Role[] getRoleObjects(String... roles) {
        Role[] list = new Role[roles.length];

        for (int i = 0; i < roles.length; i++) {
            list[i] = getRole(roles[i]);
        }

        return list;
    }

    /**
     * Method to get a list of a user's roles.
     *
     * @param user
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

        return roles.isEmpty() ? new Role[0] : roles.toArray(new Role[0]);
    }

    /**
     * Method to get a list of a user's roles.
     *
     * @param userId
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
    public void editUserRoles(User user, Role... roles) {
        if (roles == null || user == null) {
            throw new IllegalArgumentException("user or roles object was null");
        }

        Member m = user.asMember(DiscordAPI.getGuild().getId()).block();

        if (m == null) {
            return;
        }

        Set<Snowflake> rolesSf = Collections.<Snowflake>emptySet();

        for (Role role : roles) {
            rolesSf.add(role.getId());
        }

        m.edit(eds
                -> eds.setRoles(rolesSf)
        ).doOnError(e -> {
            com.gmt2001.Console.err.printStackTrace(e);
        }).block();
    }

    /**
     * Method to edit roles on a user, multiple can be set at once to replace the current ones.
     *
     * @param userId
     * @param roles
     */
    public void editUserRoles(String userId, Role... roles) {
        editUserRoles(getUserById(Long.parseUnsignedLong(userId)), roles);
    }

    /**
     * Method to set a role on a user.
     *
     * @param role
     * @param user
     */
    public void addRole(Role role, User user) {
        if (role == null || user == null) {
            throw new IllegalArgumentException("user or role object was null");
        }

        Member m = user.asMember(DiscordAPI.getGuild().getId()).block();

        if (m == null) {
            return;
        }

        m.addRole(role.getId()).doOnError(e -> {
            com.gmt2001.Console.err.printStackTrace(e);
        }).block();
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
    public void addRole(String roleName, User user) {
        addRole(getRole(roleName), user);
    }

    /**
     * Method to remove a role on a user.
     *
     * @param role
     * @param user
     */
    public void removeRole(Role role, User user) {
        if (role == null || user == null) {
            throw new IllegalArgumentException("user or role object was null");
        }

        Member m = user.asMember(DiscordAPI.getGuild().getId()).block();

        if (m == null) {
            return;
        }

        m.removeRole(role.getId()).doOnError(e -> {
            com.gmt2001.Console.err.printStackTrace(e);
        }).block();
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
        DiscordAPI.getGuild().createRole(role
                -> role.setName(roleName)
        ).doOnError(e -> {
            com.gmt2001.Console.err.printStackTrace(e);
        }).block();
    }

    /**
     * Method to delete a role.
     *
     * @param role
     */
    public void deleteRole(Role role) {
        role.delete().doOnError(e -> {
            com.gmt2001.Console.err.printStackTrace(e);
        }).block();
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
    public List<Role> getGuildRoles() {
        return DiscordAPI.getGuild().getRoles().collectList().block();
    }

    /**
     * Method to check if someone is an administrator.
     *
     * @param user
     * @return {Boolean}
     */
    public boolean isAdministrator(User user) {
        if (user == null) {
            throw new IllegalArgumentException("user object was null");
        }

        Member m = user.asMember(DiscordAPI.getGuild().getId()).block();

        if (m == null) {
            return false;
        }

        PermissionSet ps = m.getBasePermissions().block();

        if (ps == null) {
            return false;
        }

        return ps.contains(Permission.ADMINISTRATOR);
    }

    /**
     * Method to check if someone is an administrator.
     *
     * @param userName
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
    public void bulkDelete(GuildMessageChannel channel, int amount) {
        // Discord4J says that getting messages can block the current thread if they need to be requested from Discord's API.
        // So start this on a new thread to avoid that. Please note that you need to delete at least 2 messages.

        if (channel == null || amount < 2) {
            throw new IllegalArgumentException("channel object was null or amount was less than 2");
        }

        Thread thread;
        thread = new Thread(() -> {
            List<Message> msgs = channel.getMessagesBefore(channel.getLastMessageId().orElseThrow()).take(amount).collectList().block();

            if (msgs != null) {
                Flux<Snowflake> msgSfs = Flux.empty();

                msgs.forEach((msg) -> {
                    Flux.concat(msgSfs, Flux.just(msg.getId()));
                });

                channel.bulkDelete(msgSfs);
            }
        }, "tv.phantombot.discord.util.DiscordUtil::bulkDelete");

        thread.start();
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
    public void bulkDeleteMessages(GuildMessageChannel channel, Message... list) {
        if (channel == null || list == null || list.length < 2) {
            throw new IllegalArgumentException("channel object was null, list object was null, or amount was less than 2");
        }

        Flux<Snowflake> msgSfs = Flux.empty();

        for (Message msg : list) {
            Flux.concat(msgSfs, Flux.just(msg.getId()));
        }

        channel.bulkDelete(msgSfs);
    }

    /**
     * Method to bulk delete messages from a channel.
     *
     * @param channelName
     * @param messages
     */
    public void bulkDeleteMessages(String channelName, Message... messages) {
        bulkDeleteMessages(getChannel(channelName), messages);
    }

    /**
     * Method to delete a message.
     *
     * @param message
     */
    public void deleteMessage(Message message) {
        if (message == null) {
            throw new IllegalArgumentException("message object was null");
        }

        com.gmt2001.Console.debug.println("Deleteing Discord message: " + message.getId().asString());

        try {
            message.delete().block();
        } catch (RuntimeException e) {
            if (e instanceof ClientException) {
                ErrorResponse er = ((ClientException) e).getErrorResponse();
                if (er != null && er.getFields().containsKey("errorResponse")) {
                    ErrorResponse er2 = (ErrorResponse) er.getFields().get("errorResponse");
                    if (er2 != null && er2.getFields().containsKey("code") && (int) er2.getFields().get("code") == 10008) {
                        com.gmt2001.Console.err.println("Delete message failed (Unknown Message): " + message.getId().asString());
                        com.gmt2001.Console.debug.printStackTrace(e);
                        return;
                    }
                }
            }

            com.gmt2001.Console.err.printStackTrace(e);
        }
    }

    /**
     * Method to set the current game.
     *
     * @param game
     */
    public void setGame(String game) {
        DiscordAPI.getClient().updatePresence(Presence.online(Activity.playing(game))).doOnError(e -> {
            com.gmt2001.Console.err.printStackTrace(e);
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
            com.gmt2001.Console.err.printStackTrace(e);
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
     *
     * @return
     */
    public List<User> getUsers() {
        List<Member> m = DiscordAPI.getGuild().getMembers().collectList().block();
        List<User> u = Collections.<User>emptyList();

        if (m != null) {
            Collections.copy(u, m);
        }

        return u;
    }

    /**
     * Method to get a color object.
     *
     * @param color
     * @return {Color}
     */
    public Color getColor(String color) {
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
