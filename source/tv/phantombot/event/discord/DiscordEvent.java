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

package tv.phantombot.event.discord;

import sx.blah.discord.handle.obj.IChannel;
import sx.blah.discord.handle.obj.IUser;

import tv.phantombot.event.Event;

public class DiscordEvent extends Event {
	private final IUser user;
	private final IChannel channel;
	private final String username;
	private final String channelName;
	private final String sender;
	private final String mention;
	private final String senderId;
	private final String channelId;
	private final String discrim;

	protected DiscordEvent(IUser user) {
		this.user = user;
		this.channel = null;
		this.channelName = null;
		this.channelId = null;
		this.username = user.getName();
		this.discrim = user.getDiscriminator();
		this.senderId = user.getStringID();
		this.sender = (username + "#" + discrim);
		this.mention = user.mention();
	}

	protected DiscordEvent(IUser user, IChannel channel) {
		this.user = user;
		this.channel = channel;
		this.channelName = channel.getName();
		this.channelId = channel.getStringID();
		this.username = user.getName();
		this.discrim = user.getDiscriminator();
		this.senderId = user.getStringID();
		this.sender = (username + "#" + discrim);
		this.mention = user.mention();
	}

	public String getSender() {
		return this.sender.toLowerCase();
	}

	public String getUsername() {
		return this.username;
	}

	public String getMention() {
		return this.mention;
	}

	public String getChannel() {
		return this.channelName;
	}

	public String getChannelId() {
		return this.channelId;
	}

	public String getDiscriminator() {
		return this.discrim;
	}

	public String getSenderId() {
		return this.senderId;
	}

	public IUser getDiscordUser() {
		return this.user;
	}

	public IChannel getDiscordChannel() {
		return this.channel;
	}
}
