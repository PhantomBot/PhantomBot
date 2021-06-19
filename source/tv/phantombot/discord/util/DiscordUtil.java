/*
 * Copyright (C) 2016-2021 phantombot.github.io/PhantomBot
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
import discord4j.rest.util.Permission;
import discord4j.common.util.Snowflake;
import discord4j.core.object.entity.channel.Category;
import discord4j.core.object.entity.channel.GuildChannel;
import discord4j.core.object.entity.channel.NewsChannel;
import discord4j.core.object.entity.channel.StoreChannel;
import discord4j.core.object.entity.channel.TextChannel;
import discord4j.core.object.entity.channel.VoiceChannel;
import discord4j.rest.util.Color;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.Duration;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.NoSuchElementException;
import java.util.Optional;
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
    private static final String[] VALID_PATHS = new String[]{
        "./addons",
        "./config/audio-hooks",
        "./config/gif-alerts",
        "./logs",
        "./scripts"
    };

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

    public boolean isValidFilePath(String fileLocation) {
        Path p = Paths.get(fileLocation);
        String executionPath = PhantomBot.GetExecutionPath();

        for (String vp : VALID_PATHS) {
            if (p.toAbsolutePath().startsWith(Paths.get(executionPath, vp))) {
                return true;
            }
        }

        return false;
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
     * @param iteration
     * @return {Message}
     */
    public Mono<Message> sendMessageAsync(MessageChannel channel, String message, int iteration) {
        if (iteration >= MAX_ITERATION) {
            throw new IllegalStateException("connection failing");
        }

        if (iteration > 0) {
            com.gmt2001.Console.err.println("Request failed, trying again in " + (iteration * iteration) + " seconds...");
            Mono.delay(Duration.ofSeconds(iteration * iteration));
        }

        if (channel != null) {
            if (channel.getType() == Channel.Type.DM || channel.getType() == Channel.Type.GROUP_DM) {
                sendPrivateMessage((PrivateChannel) channel, message);
                return null;
            }

            return channel.createMessage(message).doOnError(e -> {
                com.gmt2001.Console.err.printStackTrace(e);
            }).onErrorResume(e -> sendMessageAsync(channel, message, iteration + 1))
                    .doOnSuccess(m -> com.gmt2001.Console.out.println("[DISCORD] [#" + DiscordUtil.channelName(channel) + "] [CHAT] " + message));
        } else if (DiscordAPI.instance().checkConnectionStatus() == DiscordAPI.ConnectionState.RECONNECTED) {
            return sendMessageAsync(channel, message, iteration + 1);
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
     * @param channel
     * @param message
     * @param iteration
     */
    public void sendPrivateMessage(PrivateChannel channel, String message, int iteration) {
        if (iteration >= MAX_ITERATION) {
            throw new IllegalStateException("connection failing");
        }

        if (iteration > 0) {
            com.gmt2001.Console.err.println("Request failed, trying again in " + (iteration * iteration) + " seconds...");
            Mono.delay(Duration.ofSeconds(iteration * iteration));
        }

        if (channel != null) {
            channel.getRecipients().take(1).singleOrEmpty().doOnSuccess(user -> {
                String uname;
                String udisc;

                if (user != null) {
                    uname = user.getUsername().toLowerCase();
                    udisc = user.getDiscriminator();
                } else {
                    uname = "";
                    udisc = "";
                }

                channel.createMessage(message).doOnError(e -> {
                    com.gmt2001.Console.err.printStackTrace(e);
                }).onErrorResume(e -> {
                    sendPrivateMessage(channel, message, iteration + 1);
                    return Mono.empty();
                }).doOnSuccess(m -> com.gmt2001.Console.out.println("[DISCORD] [@" + uname + "#" + udisc + "] [DM] " + message)).subscribe();
            }).subscribe();
        } else if (DiscordAPI.instance().checkConnectionStatus() == DiscordAPI.ConnectionState.RECONNECTED) {
            sendPrivateMessage(channel, message, iteration + 1);
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
     * @param iteration
     * @return {Message}
     */
    public Mono<Message> sendMessageEmbedAsync(GuildMessageChannel channel, Consumer<? super EmbedCreateSpec> embed, int iteration) {
        if (iteration >= MAX_ITERATION) {
            throw new IllegalStateException("connection failing");
        }

        if (iteration > 0) {
            com.gmt2001.Console.err.println("Request failed, trying again in " + (iteration * iteration) + " seconds...");
            Mono.delay(Duration.ofSeconds(iteration * iteration));
        }

        if (channel != null) {
            return channel.createMessage(msg
                    -> msg.setEmbed(embed)
            ).doOnError(e -> {
                com.gmt2001.Console.err.printStackTrace(e);
            }).onErrorResume(e -> sendMessageEmbedAsync(channel, embed, iteration + 1))
                    .doOnSuccess(m -> com.gmt2001.Console.out.println("[DISCORD] [#" + DiscordUtil.channelName(channel) + "] [EMBED] " + m.getEmbeds().get(0).getDescription().orElse(m.getEmbeds().get(0).getTitle().orElse(""))));
        } else if (DiscordAPI.instance().checkConnectionStatus() == DiscordAPI.ConnectionState.RECONNECTED) {
            return sendMessageEmbedAsync(channel, embed, iteration + 1);
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
     * @param iteration
     * @return {Message}
     */
    public Mono<Message> sendFileAsync(GuildMessageChannel channel, String message, String fileLocation, int iteration) {
        if (iteration >= MAX_ITERATION) {
            throw new IllegalStateException("connection failing");
        }

        if (iteration > 0) {
            com.gmt2001.Console.err.println("Request failed, trying again in " + (iteration * iteration) + " seconds...");
            Mono.delay(Duration.ofSeconds(iteration * iteration));
        }

        if (channel != null) {
            if (!this.isValidFilePath(fileLocation)) {
                com.gmt2001.Console.err.println("[DISCORD] [#" + DiscordUtil.channelName(channel) + "] [UPLOAD] [" + fileLocation + "] Rejecting fileLocation");
                return null;
            } else {
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
                    }).onErrorResume(e -> sendFileAsync(channel, message, fileLocation, iteration + 1))
                            .doOnSuccess(m -> com.gmt2001.Console.out.println("[DISCORD] [#" + DiscordUtil.channelName(channel) + "] [UPLOAD] [" + fileLocation + "]"));
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
                    }).onErrorResume(e -> sendFileAsync(channel, message, fileLocation, iteration + 1))
                            .doOnSuccess(m -> com.gmt2001.Console.out.println("[DISCORD] [#" + DiscordUtil.channelName(channel) + "] [UPLOAD] [" + fileLocation + "] " + message));
                }
            }
        } else if (DiscordAPI.instance().checkConnectionStatus() == DiscordAPI.ConnectionState.RECONNECTED) {
            return sendFileAsync(channel, message, fileLocation, iteration + 1);
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
        try {
            return DiscordAPI.getGuild().getChannels().filter(channel -> DiscordUtil.channelName(channel).equalsIgnoreCase(schannelName)
                    || DiscordUtil.channelIdAsString(channel).equals(schannelName)).take(1).single().map(c -> (GuildMessageChannel) c);
        } catch (NoSuchElementException ex) {
            com.gmt2001.Console.err.println("Unable to find channelName [" + channelName + "]");
            throw ex;
        }
    }

    @Deprecated
    public Map<String, Map<String, String>> getAllChannelInfo() {
        HashMap<String, Map<String, String>> data = new HashMap<>();
        getAllChannelInfoAsync(data).blockLast(Duration.ofSeconds(5L));
        return data;
    }

    public Flux<GuildChannel> getAllChannelInfoAsync(Map<String, Map<String, String>> data) {
        return DiscordAPI.getGuild().getChannels().doOnNext(channel -> {
            if (null != channel.getType()) {
                switch (channel.getType()) {
                    case GUILD_CATEGORY:
                        Category rc = (Category) channel;
                        data.putIfAbsent(rc.getId().asString(), new HashMap<>());
                        data.get(rc.getId().asString()).putIfAbsent("name", rc.getName());
                        break;
                    case GUILD_NEWS:
                        NewsChannel rn = (NewsChannel) channel;
                        if (rn.getCategoryId().isPresent()) {
                            if (!data.containsKey(rn.getCategoryId().get().asString())) {
                                data.putIfAbsent(rn.getCategoryId().get().asString(), new HashMap<>());
                            }

                            data.get(rn.getCategoryId().get().asString()).putIfAbsent(rn.getId().asString(), rn.getType().name() + ":" + rn.getName());
                        }
                        break;
                    case GUILD_STAGE_VOICE:
                        VoiceChannel rsv = (VoiceChannel) channel;
                        if (rsv.getCategoryId().isPresent()) {
                            if (!data.containsKey(rsv.getCategoryId().get().asString())) {
                                data.putIfAbsent(rsv.getCategoryId().get().asString(), new HashMap<>());
                            }

                            data.get(rsv.getCategoryId().get().asString()).putIfAbsent(rsv.getId().asString(), rsv.getType().name() + ":" + rsv.getName());
                        }
                        break;
                    case GUILD_STORE:
                        StoreChannel rs = (StoreChannel) channel;
                        if (rs.getCategoryId().isPresent()) {
                            if (!data.containsKey(rs.getCategoryId().get().asString())) {
                                data.putIfAbsent(rs.getCategoryId().get().asString(), new HashMap<>());
                            }

                            data.get(rs.getCategoryId().get().asString()).putIfAbsent(rs.getId().asString(), rs.getType().name() + ":" + rs.getName());
                        }
                        break;
                    case GUILD_TEXT:
                        TextChannel rt = (TextChannel) channel;
                        if (rt.getCategoryId().isPresent()) {
                            if (!data.containsKey(rt.getCategoryId().get().asString())) {
                                data.putIfAbsent(rt.getCategoryId().get().asString(), new HashMap<>());
                            }

                            data.get(rt.getCategoryId().get().asString()).putIfAbsent(rt.getId().asString(), rt.getType().name() + ":" + rt.getName());
                        }
                        break;
                    case GUILD_VOICE:
                        VoiceChannel rv = (VoiceChannel) channel;
                        if (rv.getCategoryId().isPresent()) {
                            if (!data.containsKey(rv.getCategoryId().get().asString())) {
                                data.putIfAbsent(rv.getCategoryId().get().asString(), new HashMap<>());
                            }

                            data.get(rv.getCategoryId().get().asString()).putIfAbsent(rv.getId().asString(), rv.getType().name() + ":" + rv.getName());
                        }
                        break;
                    default:
                        break;
                }
            }
        });
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
        try {
            return DiscordAPI.getGuild().getChannels().filter(channel -> DiscordUtil.channelIdAsString(channel).equals(channelId)).take(1).single().map(c -> (GuildMessageChannel) c);
        } catch (NoSuchElementException ex) {
            com.gmt2001.Console.err.println("Unable to find channelId [" + channelId + "]");
            throw ex;
        }
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
            com.gmt2001.Console.debug.println(userName);
            com.gmt2001.Console.debug.println(members.count().block());
        }

        Flux<Member> filteredMembers = members.filter(user -> user.getDisplayName().equalsIgnoreCase(userName) || user.getUsername().equalsIgnoreCase(userName) || user.getMention().equalsIgnoreCase(userName) || user.getNicknameMention().equalsIgnoreCase(userName));

        if (PhantomBot.getEnableDebugging()) {
            com.gmt2001.Console.debug.println(filteredMembers.count().block());
        }
        try {
            return filteredMembers.take(1).single().map(m -> (User) m);
        } catch (NoSuchElementException ex) {
            com.gmt2001.Console.err.println("Unable to find userName [" + userName + "]");
            throw ex;
        }
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
        try {
            return DiscordAPI.getGuild().getMembers().filter(user -> user.getId().asLong() == userId).take(1).single().map(m -> (User) m);
        } catch (NoSuchElementException ex) {
            com.gmt2001.Console.err.println("Unable to find userId [" + userId + "]");
            throw ex;
        }
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
        try {
            return DiscordAPI.getGuild().getMembers().filter(user -> user.getDisplayName().equalsIgnoreCase(userName)
                    && user.getDiscriminator().equalsIgnoreCase(discriminator)).take(1).single().map(m -> (User) m);
        } catch (NoSuchElementException ex) {
            com.gmt2001.Console.err.println("Unable to find userNameDiscriminator [" + userName + "#" + discriminator + "]");
            throw ex;
        }
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
        Flux<Role> roles = DiscordAPI.getGuild().getRoles();

        if (PhantomBot.getEnableDebugging()) {
            com.gmt2001.Console.debug.println(roleName);
            com.gmt2001.Console.debug.println(roles.count().block());
        }

        Flux<Role> filteredRoles = roles.filter(role -> role.getName().equalsIgnoreCase(roleName) || role.getMention().equalsIgnoreCase(roleName));

        if (PhantomBot.getEnableDebugging()) {
            com.gmt2001.Console.debug.println(filteredRoles.count().block());
        }

        try {
            return filteredRoles.take(1).single();
        } catch (NoSuchElementException ex) {
            com.gmt2001.Console.err.println("Unable to find roleName [" + roleName + "]");
            throw ex;
        }
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
        try {
            return DiscordAPI.getGuild().getRoles().filter(role -> role.getId().asString().equalsIgnoreCase(id)).take(1).single();
        } catch (NoSuchElementException ex) {
            com.gmt2001.Console.err.println("Unable to find roleId [" + id + "]");
            throw ex;
        }
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
            Set<Snowflake> rolesSf = new HashSet<>();

            for (Role role : roles) {
                rolesSf.add(role.getId());
            }

            m.edit(eds
                    -> eds.setRoles(rolesSf)
            ).doOnError(e -> {
                com.gmt2001.Console.err.println("Unable to edit member roles" + user.getMention() + " (" + DiscordAPI.getGuild().getName() + ")");
                com.gmt2001.Console.err.printStackTrace(e);
            }).subscribe();
        }).doOnError(e -> {
            com.gmt2001.Console.err.println("Unable to convert user to member " + user.getMention() + " (" + DiscordAPI.getGuild().getName() + ")");
            com.gmt2001.Console.err.printStackTrace(e);
        }).subscribe();
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
                com.gmt2001.Console.err.println("Unable to add member role" + user.getMention() + " (" + DiscordAPI.getGuild().getName() + ")");
                com.gmt2001.Console.err.printStackTrace(e);
            }).subscribe();
        }).doOnError(e -> {
            com.gmt2001.Console.err.println("Unable to convert user to member " + user.getMention() + " (" + DiscordAPI.getGuild().getName() + ")");
            com.gmt2001.Console.err.printStackTrace(e);
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
                com.gmt2001.Console.err.println("Unable to remove member role" + user.getMention() + " (" + DiscordAPI.getGuild().getName() + ")");
                com.gmt2001.Console.err.printStackTrace(e);
            }).subscribe();
        }).doOnError(e -> {
            com.gmt2001.Console.err.println("Unable to convert user to member " + user.getMention() + " (" + DiscordAPI.getGuild().getName() + ")");
            com.gmt2001.Console.err.printStackTrace(e);
        }).subscribe();
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
            com.gmt2001.Console.err.println("Unable to create role" + roleName + " (" + DiscordAPI.getGuild().getName() + ")");
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
            com.gmt2001.Console.err.println("Unable to delete role" + role.getName() + " (" + DiscordAPI.getGuild().getName() + ")");
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

        com.gmt2001.Console.debug.println("Attempting to delete " + amount + " messages from " + DiscordUtil.channelName(channel));
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

    /**
     * Method to return a message by its id.
     *
     * @param channelName
     * @param messageId
     * @return {Message}
     */
    public Message getMessageById(String channelName, String messageId) {
        GuildMessageChannel channel = getChannelAsync(channelName).block();
        if (channel != null) {
            return channel.getMessageById(Snowflake.of(messageId)).block();
        }

        return null;
    }

    /**
     * Method to edit message content.
     *
     * @param message
     * @param newMessage
     */
    public void editMessageContent(Message message, String newMessage) {
        message.edit(spec -> spec.setContent(newMessage)).subscribe();
    }

    /**
     * Method to edit message embeds.
     *
     * @param message
     * @param newEmbed
     */
    public void editMessageEmbed(Message message, Consumer<? super EmbedCreateSpec> newEmbed) {
        message.edit(spec -> spec.setEmbed(newEmbed)).subscribe();
    }

    /**
     * Method to return a list of all messages before the given message.
     *
     * @param channelName
     * @param messageId
     * @return {List<Message>}
     */
    public List<Message> getMessagesBefore(String channelName, String messageId) {
        GuildMessageChannel channel = getChannelAsync(channelName).block();
        List<Message> messageList = new ArrayList<>();
        if (channel != null) {
            channel.getMessagesBefore(Snowflake.of(messageId)).toIterable().forEach(message -> messageList.add(message));
        }
        return messageList;
    }

    /**
     * Method to return a the last message of a given channel.
     *
     * @param channelName
     * @return {Message}
     */
    public Message getLastMessage(String channelName) {
        GuildMessageChannel channel = getChannelAsync(channelName).block();
        if (channel != null) {
            return channel.getLastMessage().block();
        }

        return null;
    }

    public static Optional<Snowflake> channelId(Channel channel) {
        if (null != channel.getType()) {
            switch (channel.getType()) {
                case DM:
                case GROUP_DM:
                    return Optional.of(((PrivateChannel) channel).getId());
                case GUILD_CATEGORY:
                    return Optional.of(((Category) channel).getId());
                case GUILD_NEWS:
                    return Optional.of(((NewsChannel) channel).getId());
                case GUILD_STAGE_VOICE:
                    return Optional.of(((VoiceChannel) channel).getId());
                case GUILD_STORE:
                    return Optional.of(((StoreChannel) channel).getId());
                case GUILD_TEXT:
                    return Optional.of(((TextChannel) channel).getId());
                case GUILD_VOICE:
                    return Optional.of(((VoiceChannel) channel).getId());
                default:
                    break;
            }
        }

        return Optional.empty();
    }

    public static String channelIdAsString(Channel channel) {
        Optional<Snowflake> channelId = DiscordUtil.channelId(channel);

        if (channelId.isPresent()) {
            return channelId.get().asString();
        }

        return "";
    }

    public static String channelName(Channel channel) {
        if (null != channel.getType()) {
            switch (channel.getType()) {
                case DM:
                case GROUP_DM:
                    return ((PrivateChannel) channel).getMention();
                case GUILD_CATEGORY:
                    return ((Category) channel).getName();
                case GUILD_NEWS:
                    return ((NewsChannel) channel).getName();
                case GUILD_STAGE_VOICE:
                    return ((VoiceChannel) channel).getName();
                case GUILD_STORE:
                    return ((StoreChannel) channel).getName();
                case GUILD_TEXT:
                    return ((TextChannel) channel).getName();
                case GUILD_VOICE:
                    return ((VoiceChannel) channel).getName();
                default:
                    break;
            }
        }

        return "";
    }
}
