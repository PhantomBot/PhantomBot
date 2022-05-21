/*
 * Copyright (C) 2016-2022 phantombot.github.io/PhantomBot
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

public class DiscordChannelMessageEvent extends DiscordChannelEvent {
    private final boolean isAdmin;

    /**
     * Class constructor for this event.
     *
     * @param    user
     * @param channel
     * @param message
     * @param  isAdmin
     */
    public DiscordChannelMessageEvent(User user, Channel channel, Message message, boolean isAdmin) {
        super(user, channel, message);
        
        this.isAdmin = isAdmin;
    }

    /**
     * Method that returns if the user a admin in the server.
     *
     * @return isAdmin
     */
    public boolean isAdmin() {
        return this.isAdmin;
    }

    /**
     * Method that returns this object as a string.
     *
     * @return
     */
    @Override
    public String toString() {
        return "DiscordChannelMessageEvent -> { isAdmin: [" + this.isAdmin + "] }";
    }
}
