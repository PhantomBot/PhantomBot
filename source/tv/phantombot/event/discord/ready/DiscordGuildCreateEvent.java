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
package tv.phantombot.event.discord.ready;

import discord4j.core.object.entity.Role;
import java.util.Collections;
import java.util.List;
import tv.phantombot.event.Event;

public class DiscordGuildCreateEvent extends Event {

    private final List<Role> roles;

    /**
     * Class constructor.
     *
     * @param roles
     */
    public DiscordGuildCreateEvent(List<Role> roles) {
        this.roles = Collections.unmodifiableList(roles);
    }

    public List<Role> getRoles() {
        return this.roles;
    }
}
