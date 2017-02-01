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
package me.mast3rplan.phantombot.event.irc.channel;

import me.mast3rplan.phantombot.twitchwsirc.Channel;
import me.mast3rplan.phantombot.twitchwsirc.Session;

public class IrcChannelUserModeEvent extends IrcChannelEvent {

    private final String user;
    private final String mode;
    private final Boolean add;

    public IrcChannelUserModeEvent(Session session, Channel channel, String user, String mode, Boolean add) {
        super(session, channel);
        this.user = user;
        this.mode = mode;
        this.add = add;
    }

    public String getUser() {
        return user;
    }

    public String getMode() {
        return mode;
    }

    public Boolean getAdd() {
        return add;
    }
}
