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

package tv.phantombot.event.discord.channel;

import discord4j.core.object.entity.Channel;
import discord4j.core.object.entity.Message;
import discord4j.core.object.entity.User;

public class DiscordChannelMessageEvent extends DiscordChannelEvent {
    private final boolean isAdmin;

    /**
     * Class constructor for this event.
     *
     * @param {IUser}    user
     * @param {IChannel} channel
     * @param {IMessage} message
     * @param {boolean}  isAdmin
     */
    public DiscordChannelMessageEvent(User user, Channel channel, Message message, boolean isAdmin) {
        super(user, channel, message);
        
        this.isAdmin = isAdmin;
    }

    /**
     * Method that returns if the user a admin in the server.
     *
     * @return {boolean} isAdmin
     */
    public boolean isAdmin() {
        return this.isAdmin;
    }

    /**
     * Method that returns this object as a string.
     *
     * @return {String}
     */
    @Override
    public String toString() {
        return "DiscordChannelMessageEvent -> { isAdmin: [" + this.isAdmin + "] }";
    }
}
