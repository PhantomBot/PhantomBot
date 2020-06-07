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

import discord4j.common.util.Snowflake;
import discord4j.core.object.entity.GuildEmoji;
import discord4j.core.object.entity.Member;
import discord4j.core.object.entity.Message;
import discord4j.core.object.entity.Role;
import discord4j.core.object.entity.User;
import discord4j.core.object.entity.channel.Channel;
import discord4j.core.object.entity.channel.GuildMessageChannel;
import discord4j.core.object.entity.channel.MessageChannel;
import discord4j.core.object.entity.channel.PrivateChannel;
import discord4j.core.object.presence.Activity;
import discord4j.core.object.presence.Presence;
import discord4j.core.object.reaction.ReactionEmoji;
import discord4j.core.spec.EmbedCreateSpec;
import discord4j.rest.http.client.ClientException;
import discord4j.rest.json.response.ErrorResponse;
import discord4j.rest.util.Color;
import discord4j.rest.util.Permission;
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
import reactor.core.publisher.Mono;
import tv.phantombot.PhantomBot;
import tv.phantombot.discord.DiscordAPI;

/**
 * Has all of the methods to work with Discord4J.
 *
 * @author IllusionaryOne
 * @author ScaniaTV
 */
public class DiscordUtil {

    private static final int MAX_ITERATION = 5;

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

    @Deprecated
    public Message sendMessage(MessageChannel channel, String message) {
        return sendMessageAsync(channel, message).block();
    }

    public Mono<Message> sendMessageAsync(MessageChannel channel, String message) {
        return sendMessageAsync(channel, message, 0);
    }

    /**
     * Method to send a message to a channel.
     *
     * @param channel
     * @param message
     * @return {Message}
     */
    public Mono<Message> sendMessageAsync(MessageChannel channel, String message, int iteration) {
        if (channel != null) {
            if (channel.getType() == Channel.Type.DM) {
                sendPrivateMessage((PrivateChannel) channel, message);
                return null;
            }

            com.gmt2001.Console.out.println("[DISCORD] [#" + ((GuildMessageChannel) channel).getName() + "] [CHAT] " + message);

            return channel.createMessage(message).doOnError(e -> {
                com.gmt2001.Console.err.printStackTrace(e);
            }).onErrorReturn(null);
        } else if (DiscordAPI.instance().checkConnectionStatus() == DiscordAPI.ConnectionState.RECONNECTED) {
            if (iteration >= MAX_ITERATION) {
                throw new IllegalStateException("connection failing");
            }
            return sendMessageAsync(channel, message, ++iteration);
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
    @Deprecated
    public Message sendMessage(String channelName, String message) {
        return sendMessageAsync(channelName, message).block();
    }

    public Mono<Message> sendMessageAsync(String channelName, String message) {
        return getChannelAsync(channelName).flatMap(channel -> sendMessageAsync(channel, message));
    }

    /**
     * Method to send private messages to a user.
     *
     * @param user
     * @param message
     */
    public void sendPrivateMessage(User user, String message) {
        if (user != null) {
            user.getPrivateChannel().doOnError(e -> {
                com.gmt2001.Console.err.printStackTrace(e);
            }).doOnSuccess(channel -> sendPrivateMessage(channel, message)).subscribe();
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
        getUserAsync(userName).doOnSuccess(user -> sendPrivateMessage(user, message)).subscribe();
    }

    public void sendPrivateMessage(PrivateChannel channel, String message) {
        sendPrivateMessage(channel, message, 0);
    }

    /**
     * Method to send private messages to a user.
     *
     * @param userName
     * @param message
     */
    public void sendPrivateMessage(PrivateChannel channel, String message, int iteration) {
        if (channel != null) {
            channel.getRecipients().take(1).singleOrEmpty().doOnSuccess(user -> {
                String uname = "";
                String udisc = "";

                if (user != null) {
                    uname = user.getUsername().toLowerCase();
                    udisc = user.getDiscriminator();
                }

                com.gmt2001.Console.out.println("[DISCORD] [@" + uname + "#" + udisc + "] [DM] " + message);

                channel.createMessage(message).doOnError(e -> {
                    com.gmt2001.Console.err.printStackTrace(e);
                }).subscribe();
            }).subscribe();
        } else if (DiscordAPI.instance().checkConnectionStatus() == DiscordAPI.ConnectionState.RECONNECTED) {
            if (iteration >= MAX_ITERATION) {
                throw new IllegalStateException("connection failing");
            }
            sendPrivateMessage(channel, message, ++iteration);
        } else {
            throw new IllegalArgumentException("channel object was null");
        }
    }

    @Deprecated
    public Message sendMessageEmbed(GuildMessageChannel channel, Consumer<? super EmbedCreateSpec> embed) {
        return sendMessageEmbedAsync(channel, embed).block();
    }

    public Mono<Message> sendMessageEmbedAsync(GuildMessageChannel channel, Consumer<? super EmbedCreateSpec> embed) {
        return sendMessageEmbedAsync(channel, embed, 0);
    }

    /**
     * Method to send embed messages.
     *
     * @param channel
     * @param embed
     * @return {Message}
     */
    public Mono<Message> sendMessageEmbedAsync(GuildMessageChannel channel, Consumer<? super EmbedCreateSpec> embed, int iteration) {
        if (channel != null) {
            return channel.createMessage(msg
                    -> msg.setEmbed(embed)
            ).doOnError(com.gmt2001.Console.err::printStackTrace).onErrorReturn(null)
                    .doOnSuccess(m -> com.gmt2001.Console.out.println("[DISCORD] [#" + channel.getName() + "] [EMBED] " + m.getEmbeds().get(0).getDescription().orElse(m.getEmbeds().get(0).getTitle().orElse(""))));
        } else if (DiscordAPI.instance().checkConnectionStatus() == DiscordAPI.ConnectionState.RECONNECTED) {
            if (iteration >= MAX_ITERATION) {
                throw new IllegalStateException("connection failing");
            }
            return sendMessageEmbedAsync(channel, embed, ++iteration);
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
    @Deprecated
    public Message sendMessageEmbed(String channelName, Consumer<? super EmbedCreateSpec> embed) {
        return sendMessageEmbedAsync(channelName, embed).block();
    }

    public Mono<Message> sendMessageEmbedAsync(String channelName, Consumer<? super EmbedCreateSpec> embed) {
        return getChannelAsync(channelName).flatMap(channel -> sendMessageEmbedAsync(channel, embed));
    }

    /**
     * Method to send embed messages.
     *
     * @param channel
     * @param message
     * @param color
     * @return {Message}
     */
    @Deprecated
    public Message sendMessageEmbed(GuildMessageChannel channel, String color, String message) {
        return sendMessageEmbedAsync(channel, color, message).block();
    }

    public Mono<Message> sendMessageEmbedAsync(GuildMessageChannel channel, String color, String message) {
        return sendMessageEmbedAsync(channel, ebd
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
    @Deprecated
    public Message sendMessageEmbed(String channelName, String color, String message) {
        return sendMessageEmbedAsync(channelName, ebd
                -> ebd.setColor(getColor(color)).setDescription(message)
        ).block();
    }

    @Deprecated
    public Message sendFile(GuildMessageChannel channel, String message, String fileLocation) {
        return sendFileAsync(channel, message, fileLocation).block();
    }

    public Mono<Message> sendFileAsync(GuildMessageChannel channel, String message, String fileLocation) {
        return sendFileAsync(channel, message, fileLocation, 0);
    }

    /**
     * Method to send a file to a channel.
     *
     * @param channel
     * @param message
     * @param fileLocation
     * @return {Message}
     */
    public Mono<Message> sendFileAsync(GuildMessageChannel channel, String message, String fileLocation, int iteration) {
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
                    }).onErrorReturn(null);
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
                    }).onErrorReturn(null);
                }
            }
        } else if (DiscordAPI.instance().checkConnectionStatus() == DiscordAPI.ConnectionState.RECONNECTED) {
            if (iteration >= MAX_ITERATION) {
                throw new IllegalStateException("connection failing");
            }
            return sendFileAsync(channel, message, fileLocation, ++iteration);
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
    @Deprecated
    public Message sendFile(String channelName, String message, String fileLocation) {
        return sendFileAsync(channelName, message, fileLocation).block();
    }

    public Mono<Message> sendFileAsync(String channelName, String message, String fileLocation) {
        return getChannelAsync(channelName).flatMap(channel -> sendFileAsync(channel, message, fileLocation));
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
    @Deprecated
    public Message sendFile(String channelName, String fileLocation) {
        return sendFileAsync(channelName, "", fileLocation).block();
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
            }).subscribe();
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
        DiscordAPI.getGuild().getEmojis().collectList().doOnSuccess(gel -> {
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
        }).subscribe();
    }

    /**
     * Method that adds a reaction to a message.
     *
     * @param message The message object
     * @param emojis The emoji unicodes
     */
    public void addReactions(Message message, String... emojis) {
        DiscordAPI.getGuild().getEmojis().collectList().doOnSuccess(gel -> {
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
        }).subscribe();
    }

    /**
     * Method to return a channel object by its name.
     *
     * @param channelName - The name of the channel.
     * @return {Channel}
     */
    @Deprecated
    public GuildMessageChannel getChannel(String channelName) {
        return getChannelAsync(channelName).block();
    }

    public Mono<GuildMessageChannel> getChannelAsync(String channelName) {
        String schannelName = sanitizeChannelName(channelName);
        return DiscordAPI.getGuild().getChannels().filter(channel -> channel.getName().equalsIgnoreCase(schannelName)
                || channel.getId().asString().equals(schannelName)).take(1).single().map(c -> (GuildMessageChannel) c);
    }

    /**
     * Method to return a channel object by its ID.
     *
     * @param channelId - The string ID of the channel
     * @return {Channel}
     */
    @Deprecated
    public GuildMessageChannel getChannelByID(String channelId) {
        return getChannelByIDAsync(channelId).block();
    }

    public Mono<GuildMessageChannel> getChannelByIDAsync(String channelId) {
        return DiscordAPI.getGuild().getChannels().filter(channel -> channel.getId().asString().equals(channelId)).take(1).single().map(c -> (GuildMessageChannel) c);
    }

    @Deprecated
    public User getUser(String userName) {
        return getUserAsync(userName).block();
    }

    /**
     * Method to return a user object by its name.
     *
     * @param userName - The user's name.
     * @return {User}
     */
    public Mono<User> getUserAsync(String userName) {
        Flux<Member> members = DiscordAPI.getGuild().getMembers();

        if (PhantomBot.getEnableDebugging()) {
            com.gmt2001.Console.debug.println(members.count().block());
        }

        Flux<Member> filteredMembers = members.filter(user -> user.getDisplayName().equalsIgnoreCase(userName) || user.getUsername().equalsIgnoreCase(userName));

        if (PhantomBot.getEnableDebugging()) {
            com.gmt2001.Console.debug.println(filteredMembers.count().block());
        }

        return filteredMembers.take(1).single().map(m -> (User) m);
    }

    @Deprecated
    public User getUserById(long userId) {
        return getUserByIdAsync(userId).block();
    }

    /**
     * Method to return a user object by its id.
     *
     * @param userId - The ID of the user.
     * @return {User}
     */
    public Mono<User> getUserByIdAsync(long userId) {
        return DiscordAPI.getGuild().getMembers().filter(user -> user.getId().asLong() == userId).take(1).single().map(m -> (User) m);
    }

    @Deprecated
    public User getUserWithDiscriminator(String userName, String discriminator) {
        return getUserWithDiscriminatorAsync(userName, discriminator).block();
    }

    /**
     * Method to return a user object by its name and its discriminator.
     *
     * @param userName
     * @param discriminator
     * @return {User}
     */
    public Mono<User> getUserWithDiscriminatorAsync(String userName, String discriminator) {
        return DiscordAPI.getGuild().getMembers().filter(user -> user.getDisplayName().equalsIgnoreCase(userName)
                && user.getDiscriminator().equalsIgnoreCase(discriminator)).take(1).single().map(m -> (User) m);
    }

    @Deprecated
    public Role getRole(String roleName) {
        return getRoleAsync(roleName).block();
    }

    /**
     * Method to return a role object by its name.
     *
     * @param roleName
     * @return {Role}
     */
    public Mono<Role> getRoleAsync(String roleName) {
        return DiscordAPI.getGuild().getRoles().filter(role -> role.getName().equalsIgnoreCase(roleName)).take(1).single();
    }

    @Deprecated
    public Role getRoleByID(String id) {
        return getRoleByIDAsync(id).block();
    }

    /**
     * Method that returns a role by its ID.
     *
     * @param id
     * @return {Role}
     */
    public Mono<Role> getRoleByIDAsync(String id) {
        return DiscordAPI.getGuild().getRoles().filter(role -> role.getId().asString().equalsIgnoreCase(id)).take(1).single();
    }

    /**
     * Method to get an array of role objects by a string of role names.
     *
     * @param roles
     * @return {Role[]}
     */
    @Deprecated
    public Role[] getRoleObjects(String... roles) {
        return getRoleObjectsAsync(roles).block();
    }

    public Mono<Role[]> getRoleObjectsAsync(String... roles) {
        return Mono.fromCallable(() -> {
            return Flux.fromArray(roles).map(r -> getRoleAsync(r).block()).toStream().toArray(i -> new Role[i]);
        });
    }

    /**
     * Method to get a list of a user's roles.
     *
     * @param user
     * @return {List}
     */
    @Deprecated
    public Role[] getUserRoles(User user) {
        return getUserRolesAsync(user).block();
    }

    public Mono<Role[]> getUserRolesAsync(User user) {
        return user.asMember(DiscordAPI.getGuild().getId()).flatMap(m -> m.getRoles().collectList().map(roles -> roles.isEmpty() ? new Role[0] : roles.toArray(new Role[0]))).onErrorReturn(new Role[0]);
    }

    /**
     * Method to get a list of a user's roles.
     *
     * @param userId
     * @return {List}
     */
    @Deprecated
    public Role[] getUserRoles(String userId) {
        return getUserRolesAsync(userId).block();
    }

    public Mono<Role[]> getUserRolesAsync(String userId) {
        return getUserByIdAsync(Long.parseUnsignedLong(userId)).flatMap(user -> getUserRolesAsync(user));
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

        user.asMember(DiscordAPI.getGuild().getId()).doOnSuccess(m -> {
            Set<Snowflake> rolesSf = Collections.<Snowflake>emptySet();

            for (Role role : roles) {
                rolesSf.add(role.getId());
            }

            m.edit(eds
                    -> eds.setRoles(rolesSf)
            ).doOnError(e -> {
                com.gmt2001.Console.err.printStackTrace(e);
            }).subscribe();
        });
    }

    /**
     * Method to edit roles on a user, multiple can be set at once to replace the current ones.
     *
     * @param userId
     * @param roles
     */
    public void editUserRoles(String userId, Role... roles) {
        getUserByIdAsync(Long.parseUnsignedLong(userId)).subscribe(user -> editUserRoles(user, roles));
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

        user.asMember(DiscordAPI.getGuild().getId()).doOnSuccess(m -> {
            m.addRole(role.getId()).doOnError(e -> {
                com.gmt2001.Console.err.printStackTrace(e);
            }).subscribe();
        }).subscribe();
    }

    /**
     * Method to set a role on a user.
     *
     * @param roleName
     * @param userName
     */
    public void addRole(String roleName, String userName) {
        com.gmt2001.Console.debug.println(userName + " > " + roleName);
        getRoleAsync(roleName).subscribe(role -> {
            com.gmt2001.Console.debug.println(role);
            getUserAsync(userName).subscribe(user -> {
                com.gmt2001.Console.debug.println(user);
                addRole(role, user);
            });
        });
    }

    /**
     * Method to set a role on a user.
     *
     * @param roleName
     * @param user
     */
    public void addRole(String roleName, User user) {
        getRoleAsync(roleName).subscribe(role -> addRole(role, user));
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

        user.asMember(DiscordAPI.getGuild().getId()).doOnSuccess(m -> {
            m.removeRole(role.getId()).doOnError(e -> {
                com.gmt2001.Console.err.printStackTrace(e);
            }).subscribe();
        });
    }

    /**
     * Method to remove a role on a user.
     *
     * @param roleName
     * @param userName
     */
    public void removeRole(String roleName, String userName) {
        getRoleAsync(roleName).subscribe(role -> getUserAsync(userName).subscribe(user -> removeRole(role, user)));
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
        }).subscribe();
    }

    /**
     * Method to delete a role.
     *
     * @param role
     */
    public void deleteRole(Role role) {
        role.delete().doOnError(e -> {
            com.gmt2001.Console.err.printStackTrace(e);
        }).subscribe();
    }

    /**
     * Method to delete a role.
     *
     * @param roleName
     */
    public void deleteRole(String roleName) {
        getRoleAsync(roleName).subscribe(role -> deleteRole(role));
    }

    /**
     * Method that gets a list of guild roles.
     *
     * @return
     */
    @Deprecated
    public List<Role> getGuildRoles() {
        return getGuildRolesAsync().block();
    }

    public Mono<List<Role>> getGuildRolesAsync() {
        return DiscordAPI.getGuild().getRoles().collectList();
    }

    /**
     * Method to check if someone is an administrator.
     *
     * @param user
     * @return {Boolean}
     */
    @Deprecated
    public boolean isAdministrator(User user) {
        return isAdministratorAsync(user).block();
    }

    public Mono<Boolean> isAdministratorAsync(User user) {
        if (user == null) {
            throw new IllegalArgumentException("user object was null");
        }

        return user.asMember(DiscordAPI.getGuild().getId()).onErrorReturn(null).flatMap(m -> m.getBasePermissions()).map(ps -> ps != null && ps.contains(Permission.ADMINISTRATOR));
    }

    /**
     * Method to check if someone is an administrator.
     *
     * @param userName
     * @return {Boolean}
     */
    @Deprecated
    public boolean isAdministrator(String userName) {
        return isAdministratorAsync(userName).block();
    }

    public Mono<Boolean> isAdministratorAsync(String userName) {
        return getUserAsync(userName).flatMap(user -> isAdministratorAsync(user));
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

        com.gmt2001.Console.debug.println("Attempting to delete " + amount + " messages from " + channel.getName());
        Thread thread;
        thread = new Thread(() -> {
            channel.getMessagesBefore(channel.getLastMessageId().orElseThrow()).take(amount).collectList().doOnSuccess(msgs -> {
                com.gmt2001.Console.debug.println("Found " + msgs.size() + " messages to delete");
                channel.bulkDelete(Flux.fromIterable(msgs).map(msg -> msg.getId())).doOnNext(s -> com.gmt2001.Console.err.println("Rejected message " + s.asString() + " from delete operation for being too old")).doOnError(e -> com.gmt2001.Console.debug.printStackTrace(e)).doOnComplete(() -> com.gmt2001.Console.debug.println("Bulk delete complete")).subscribe();
            }).subscribe();
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
        getChannelAsync(channelName).subscribe(channel -> bulkDelete(channel, amount));
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
        getChannelAsync(channelName).subscribe(channel -> bulkDeleteMessages(channel, messages));
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

        message.delete().doOnError(e -> {
            if (e instanceof ClientException) {
                ErrorResponse er = ((ClientException) e).getErrorResponse().get();
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
        }).subscribe();
    }

    /**
     * Method to set the current game.
     *
     * @param game
     */
    public void setGame(String game) {
        DiscordAPI.getGateway().updatePresence(Presence.online(Activity.playing(game))).doOnError(e -> {
            com.gmt2001.Console.err.printStackTrace(e);
        }).subscribe();
    }

    /**
     * Method to set the current game and stream.
     *
     * @param game
     * @param url
     */
    public void setStream(String game, String url) {
        DiscordAPI.getGateway().updatePresence(Presence.online(Activity.streaming(game, url))).doOnError(e -> {
            com.gmt2001.Console.err.printStackTrace(e);
        }).subscribe();
    }

    /**
     * Method to remove the current game or reset the streaming status.
     *
     */
    public void removeGame() {
        DiscordAPI.getGateway().updatePresence(Presence.online()).subscribe();
    }

    /**
     * Method that gets all server members
     *
     * @return
     */
    @Deprecated
    public List<User> getUsers() {
        return getUsersAsync().block();
    }

    public Mono<List<User>> getUsersAsync() {
        return DiscordAPI.getGuild().getMembers().map(m -> (User) m).collectList();
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
            return Color.of(Integer.parseInt(match.group(1)), Integer.parseInt(match.group(2)), Integer.parseInt(match.group(3)));
        } else {
            switch (color) {
                case "black":
                    return Color.BLACK;
                case "blue":
                    return Color.BLUE;
                case "cyan":
                    return Color.CYAN;
                case "gray":
                    return Color.GRAY;
                case "green":
                    return Color.GREEN;
                case "magenta":
                    return Color.MAGENTA;
                case "orange":
                    return Color.ORANGE;
                case "pink":
                    return Color.PINK;
                case "red":
                    return Color.RED;
                case "white":
                    return Color.WHITE;
                case "yellow":
                    return Color.YELLOW;
                default:
                    return Color.GRAY;
            }
        }
    }
}
