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

package tv.phantombot.event.discord.channel;

import sx.blah.discord.handle.obj.IMessage;
import sx.blah.discord.handle.obj.IChannel;
import sx.blah.discord.handle.obj.IUser;

public class DiscordChannelMessageEvent extends DiscordChannelEvent {
	private final IMessage message;
	private final String messageContent;
	private final boolean isAdmin;

	public DiscordChannelMessageEvent(IUser user, IChannel channel, IMessage message, boolean isAdmin) {
		super(user, channel);

		this.message = message;
		this.messageContent = message.getContent();
		this.isAdmin = isAdmin;
	}

	public String getMessage() {
		return this.messageContent;
	}

	public boolean isAdmin() {
		return this.isAdmin;
	}

	public IMessage getDiscordMessage() {
		return this.message;
	}
}
