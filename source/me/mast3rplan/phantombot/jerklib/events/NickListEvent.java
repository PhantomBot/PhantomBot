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

import java.util.List;

/**
 * Event fired when nick list event comes from server
 *
 * @author mohadib
 */
public class NickListEvent extends IRCEvent
{

    private final List<String> nicks;
    private final Channel channel;

    public NickListEvent(String rawEventData, Session session, Channel channel, List<String> nicks)
    {
        super(rawEventData, session, Type.NICK_LIST_EVENT);
        this.channel = channel;
        this.nicks = nicks;

    }

    /**
     * Gets the channel the nick list came from
     *
     * @return Channel
     * @see Channel
     */
    public Channel getChannel()
    {
        return channel;
    }

    /**
     * Gets the nick list for the Channel
     *
     * @return List of nicks in channel
     */
    public List<String> getNicks()
    {
        return nicks;
    }
}
