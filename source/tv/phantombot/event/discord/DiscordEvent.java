/*
 * Copyright (C) 2016-2024 phantombot.github.io/PhantomBot
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
package tv.phantombot.event.discord;

import discord4j.core.object.entity.Message;
import discord4j.core.object.entity.User;
import discord4j.core.object.entity.channel.Channel;
import discord4j.core.object.entity.channel.VoiceChannel;
import tv.phantombot.discord.util.DiscordUtil;
import tv.phantombot.event.Event;

public abstract class DiscordEvent extends Event {

    private final User user;
    private final VoiceChannel voicechannel;
    private final Channel channel;
    private final Message message;
    private final String username;
    private final String channelName;
    private final String mention;
    private final String senderId;
    private final String channelId;

    /**
     * Class constructor for this event.
     */
    protected DiscordEvent() {
        this(null);
    }

    /**
     * Class constructor for this event.
     *
     * @param user
     */
    protected DiscordEvent(User user) {
        this(user, null, null);
    }

    /**
     * Class constructor for this event.
     *
     * @param user
     * @param channel
     */
    protected DiscordEvent(User user, Channel channel) {
        this(user, channel, null);
    }

    /**
     * Class constructor for this event.
     *
     * @param user
     * @param channel
     * @param message
     */
    protected DiscordEvent(User user, Channel channel, Message message) {
        this.user = user;
        this.channel = channel;
        this.voicechannel = null;
        this.message = message;

        if (channel != null) {
            this.channelName = DiscordUtil.channelName(channel);
            this.channelId = DiscordUtil.channelIdAsString(channel);
        } else {
            this.channelName = null;
            this.channelId = null;
        }

        if (user != null) {
            this.username = user.getUsername();
            this.senderId = user.getId().asString();
            this.mention = user.getMention();
        } else {
            this.username = null;
            this.senderId = null;
            this.mention = null;
        }
    }

    /**
     * Class constructor for this event.
     *
     * @param user
     * @param channel
     */
    protected DiscordEvent(User user, VoiceChannel voicechannel) {
        this.user = user;
        this.channel = null;
        this.voicechannel = voicechannel;
        this.message = null;
        this.channelName = DiscordUtil.channelName(channel);
        this.channelId = DiscordUtil.channelIdAsString(channel);

        if (user != null) {
            this.username = user.getUsername();
            this.senderId = user.getId().asString();
            this.mention = user.getMention();
        } else {
            this.username = null;
            this.senderId = null;
            this.mention = null;
        }
    }

    /**
     * Method that returns the sender of the event.
     *
     * @return {@link #getUsername()} converted to lowercase
     */
    public String getSender() {
        return this.getUsername().toLowerCase();
    }

    /**
     * Method that returns the username of the event.
     *
     * @return
     */
    public String getUsername() {
        return this.username;
    }

    /**
     * Method that returns the mention string for this user.
     *
     * @return
     */
    public String getMention() {
        return this.mention;
    }

    /**
     * Method that returns the channel name.
     *
     * @return
     */
    public String getChannel() {
        return this.channelName;
    }

    /**
     * Method that gets the raw message.
     *
     * @return
     */
    public String getMessage() {
        return this.message.getContent();
    }

    /**
     * Method that returns the channel ID.
     *
     * @return
     */
    public String getChannelId() {
        return this.channelId;
    }

    /**
     * Method that returns the user's discriminator.
     *
     * @return {@code 0}
     * @deprecated Discriminators have been removed from Discord
     */
    @Deprecated(since = "3.10.0.0", forRemoval = true)
    public String getDiscriminator() {
        return "0";
    }

    /**
     * Method that returns the user's ID.
     *
     * @return
     */
    public String getSenderId() {
        return this.senderId;
    }

    /**
     * Method that returns the user's object for Discord4J.
     *
     * @return
     */
    public User getDiscordUser() {
        return this.user;
    }

    /**
     * Method that returns the channel's object for Discord4J.
     *
     * @return
     */
    public Channel getDiscordChannel() {
        return this.channel;
    }

    /**
     * Method that returns the channel's object for Discord4J.
     *
     * @return
     */
    public Channel getDiscordVoiceChannel() {
        return this.voicechannel;
    }

    /**
     * Method that returns the message object
     *
     * @return
     */
    public Message getDiscordMessage() {
        return this.message;
    }
}
