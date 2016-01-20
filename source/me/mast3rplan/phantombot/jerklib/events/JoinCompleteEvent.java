/* 
 * Copyright (C) 2015 www.phantombot.net
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
package me.mast3rplan.phantombot.jerklib.events;

import me.mast3rplan.phantombot.jerklib.Channel;
import me.mast3rplan.phantombot.jerklib.Session;

/**
 * Event that occurs when a join to a channel is complete
 *
 * @author mohadib
 */
public class JoinCompleteEvent extends IRCEvent
{

    private final Channel channel;

    public JoinCompleteEvent(String rawEventData, Session session, Channel channel)
    {
        super(rawEventData, session, Type.JOIN_COMPLETE);
        this.channel = channel;
    }

    /**
     * getChannel() returns Channel object for event
     *
     * @return <code>Channel</code>
     * @see Channel
     */
    public final Channel getChannel()
    {
        return channel;
    }
}
