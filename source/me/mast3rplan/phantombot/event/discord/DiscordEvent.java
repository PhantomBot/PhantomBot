/*
 * Copyright (C) 2016 phantombot.tv
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

public class DiscordEvent extends Event {
	private final String sender;
	private final String username;
	private final String discrim;
	private final String channel;
	private final String mention;
	private final String senderId;

	public DiscordEvent(String sender, String senderId, String discrim, String channel) {
		this.sender = (sender + "#" + discrim);
		this.mention = "<@" + senderId + ">";
		this.discrim = discrim;
		this.channel = channel;
		this.username = sender;
		this.senderId = senderId;
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
		return this.channel;
	}

	public String getDiscriminator() {
		return this.discrim;
	}

	public String getSenderId() {
		return this.senderId;
	}
}
