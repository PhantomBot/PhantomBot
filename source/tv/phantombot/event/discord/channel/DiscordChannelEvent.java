/*
 * Copyright (C) 2016-2023 phantombot.github.io/PhantomBot
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

import discord4j.core.object.entity.Message;
import discord4j.core.object.entity.User;
import discord4j.core.object.entity.channel.Channel;
import tv.phantombot.event.discord.DiscordEvent;

public abstract class DiscordChannelEvent extends DiscordEvent {

    /**
     * Abstract constructor.
     *
     * @param user
     */
    protected DiscordChannelEvent(User user) {
        super(user);
    }

    /**
     * Abstract constructor.
     *
     * @param user
     * @param channel
     */
    protected DiscordChannelEvent(User user, Channel channel) {
        super(user, channel);
    }

    /**
     * Abstract constructor.
     *
     * @param user
     * @param channel
     * @param message
     */
    protected DiscordChannelEvent(User user, Channel channel, Message message) {
        super(user, channel, message);
    }
}
