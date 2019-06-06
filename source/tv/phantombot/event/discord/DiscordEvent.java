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

package tv.phantombot.event.discord;

import sx.blah.discord.handle.obj.IChannel;
import sx.blah.discord.handle.obj.IVoiceChannel;
import sx.blah.discord.handle.obj.IMessage;
import sx.blah.discord.handle.obj.IUser;

import tv.phantombot.event.Event;

public abstract class DiscordEvent extends Event {
    private final IUser user;
    private final IVoiceChannel voicechannel;
    private final IChannel channel;
    private final IMessage message;
    private final String username;
    private final String channelName;
    private final String sender;
    private final String mention;
    private final String senderId;
    private final String channelId;
    private final String discrim;

    /**
     * Class constructor for this event.
     */
    protected DiscordEvent() {
        this.user = null;
        this.channel = null;
        this.message = null;
        this.channelName = null;
        this.channelId = null;
        this.username = null;
        this.discrim = null;
        this.senderId = null;
        this.sender = null;
        this.mention = null;
        this.voicechannel = null;
    }
    
    /**
     * Class constructor for this event.
     *
     * @param {IUser} user
     */
    protected DiscordEvent(IUser user) {
        this.user = user;
        this.channel = null;
        this.message = null;
        this.channelName = null;
        this.channelId = null;
        this.voicechannel = null;
        this.username = user.getName();
        this.discrim = user.getDiscriminator();
        this.senderId = user.getStringID();
        this.sender = (username + "#" + discrim);
        this.mention = user.mention();
    }

    /**
     * Class constructor for this event.
     *
     * @param {IUser}    user
     * @param {IChannel} channel
     */
    protected DiscordEvent(IUser user, IChannel channel) {
        this.user = user;
        this.channel = channel;
        this.voicechannel = null;
        this.message = null;
        this.channelName = channel.getName();
        this.channelId = channel.getStringID();
        this.username = user.getName();
        this.discrim = user.getDiscriminator();
        this.senderId = user.getStringID();
        this.sender = (username + "#" + discrim);
        this.mention = user.mention();
    }
    
    /**
     * Class constructor for this event.
     *
     * @param {IUser}    user
     * @param {IChannel} channel
     * @param {IMessage} message
     */
    protected DiscordEvent(IUser user, IChannel channel, IMessage message) {
        this.user = user;
        this.channel = channel;
        this.voicechannel = null;
        this.message = message;
        this.channelName = channel.getName();
        this.channelId = channel.getStringID();
        this.username = user.getName();
        this.discrim = user.getDiscriminator();
        this.senderId = user.getStringID();
        this.sender = (username + "#" + discrim);
        this.mention = user.mention();
    }

    /**
     * Class constructor for this event.
     *
     * @param {IUser}    user
     * @param {IVoiceChannel} channel
     */
    protected DiscordEvent(IUser user, IVoiceChannel voicechannel) {
        this.user = user;
        this.channel = null;
        this.voicechannel = voicechannel;
        this.message = null;
        this.channelName = voicechannel.getName();
        this.channelId = voicechannel.getStringID();
        this.username = user.getName();
        this.discrim = user.getDiscriminator();
        this.senderId = user.getStringID();
        this.sender = (username + "#" + discrim);
        this.mention = user.mention();
    }

    /**
     * Method that returns the sender of the event with their discrim.
     *
     * @return {String}
     */
    public String getSender() {
        return this.sender.toLowerCase();
    }

    /**
     * Method that returns just the username of the event.
     *
     * @return {String}
     */
    public String getUsername() {
        return this.username;
    }

    /**
     * Method that returns the mention string for this user.
     *
     * @return {String}
     */
    public String getMention() {
        return this.mention;
    }

    /**
     * Method that returns the channel name.
     *
     * @return {String}
     */
    public String getChannel() {
        return this.channelName;
    }
    
    /**
     * Method that gets the raw message.
     * 
     * @return {String}
     */
    public String getMessage() {
        return this.message.getContent();
    }

    /**
     * Method that returns the channel ID.
     *
     * @return {String}
     */
    public String getChannelId() {
        return this.channelId;
    }

    /**
     * Method that returns the user's discriminator.
     *
     * @return {String}
     */
    public String getDiscriminator() {
        return this.discrim;
    }

    /**
     * Method that returns the user's ID.
     *
     * @return {String}
     */
    public String getSenderId() {
        return this.senderId;
    }

    /**
     * Method that returns the user's object for Discord4J.
     *
     * @return {IUser}
     */
    public IUser getDiscordUser() {
        return this.user;
    }

    /**
     * Method that returns the channel's object for Discord4J.
     *
     * @return {IChannel}
     */
    public IChannel getDiscordChannel() {
        return this.channel;
    }
    
    /**
     * Method that returns the message object
     * 
     * @return {IMessage}
     */
    public IMessage getDiscordMessage() {
        return this.message;
    }
}
