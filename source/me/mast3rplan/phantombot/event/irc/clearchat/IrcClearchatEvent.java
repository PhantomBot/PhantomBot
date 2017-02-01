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
package me.mast3rplan.phantombot.event.irc.clearchat;

import me.mast3rplan.phantombot.event.irc.IrcEvent;
import me.mast3rplan.phantombot.twitchwsirc.Channel;
import me.mast3rplan.phantombot.twitchwsirc.Session;

public class IrcClearchatEvent extends IrcEvent {

    private final String user;
    private final String reason;
    private final String duration;
    private final Channel channel;

    public IrcClearchatEvent(Session session, Channel channel, String user, String reason, String duration) {
        super(session);
        this.channel = channel;
        this.user = user;
        this.reason = reason;
        this.duration = duration;
    }

    public Channel getChannel() {
        return channel;
    }

    public String getUser() {
        return user;
    }

    public String getReason() {
        return reason;
    }

    public String getDuration() {
        return duration;
    }
}
