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

    private final String discordChannel;
    private final String discordUser;
    private final String discordMessage;

    public DiscordEvent(String discordChannel, String discordUser, String discordMessage) {
        this.discordChannel = discordChannel;
        this.discordUser = discordUser;
        this.discordMessage = discordMessage;
    }

    public String getDiscordChannel() {
        return this.discordChannel;
    }

    public String getDiscordUser() {
        return this.discordUser;
    }

    public String getDiscordMessage() {
        return this.discordMessage;
    }
}
