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
package me.mast3rplan.phantombot.event.discord;

import me.mast3rplan.phantombot.event.Event;

import net.dv8tion.jda.core.entities.User;
import net.dv8tion.jda.core.entities.Channel;

public class DiscordEvent extends Event {
	private final User user;
	private final Channel channel;
	private final String channelName;
	private final String sender;
	private final String username;
	private final String discrim;
	private final String mention;
	private final String senderId;

	public DiscordEvent(User user) {
		this.user = user;
		this.channel = null;
		this.channelName = null;
		this.username = user.getName();
		this.discrim = user.getDiscriminator();
		this.senderId = user.getId();
		this.sender = (username + "#" + discrim);
		this.mention = "<@" + senderId + ">";
	}

	public DiscordEvent(User user, Channel channel) {
		this.user = user;
		this.channel = channel;
		this.username = user.getName();
		this.discrim = user.getDiscriminator();
		this.channelName = channel.getName();
		this.senderId = user.getId();
		this.sender = (username + "#" + discrim);
		this.mention = "<@" + senderId + ">";
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

	public String getDiscriminator() {
		return this.discrim;
	}

	public String getSenderId() {
		return this.senderId;
	}

	public User getDiscordUser() {
		return this.user;
	}

	public Channel getDiscordChannel() {
		return this.channel;
	}
}
