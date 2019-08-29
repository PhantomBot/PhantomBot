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

package tv.phantombot.event.discord.uservoicechannel;

import discord4j.core.object.entity.User;
import discord4j.core.object.entity.VoiceChannel;

import tv.phantombot.event.discord.DiscordEvent;

public abstract class DiscordUserVoiceChannelEvent extends DiscordEvent {

    /**
     * Abstract constructor.
     *
     * @param {IUser} user
     */
    protected DiscordUserVoiceChannelEvent(User user) {
        super(user);
    }

    /**
     * Abstract constructor.
     *
     * @param {IUser}    user
     * @param {IVoiceChannel} voicechannel
     */
    protected DiscordUserVoiceChannelEvent(User user, VoiceChannel voicechannel) {
        super(user, voicechannel);
    }
}
