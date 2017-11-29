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
package tv.phantombot.event.irc.channel;

import tv.phantombot.twitchwsirc.Channel;
import tv.phantombot.twitchwsirc.Session;

public class IrcChannelUsersUpdateEvent extends IrcChannelEvent {

    private final String[] users;
    private final String[] joins;
    private final String[] parts;

    public IrcChannelUsersUpdateEvent(Session session, Channel channel, String[] users, String[] joins, String[] parts) {
        super(session, channel);
        this.users = users;
        this.joins = joins;
        this.parts = parts;
    }

    public IrcChannelUsersUpdateEvent(String[] users, String[] joins, String[] parts) {
        super(null, null);
        this.users = users;
        this.joins = joins;
        this.parts = parts;
    }

    public String[] getUsers() {
        return users;
    }

    public String[] getJoins() {
        return joins;
    }

    public String[] getParts() {
        return parts;
    }
}
