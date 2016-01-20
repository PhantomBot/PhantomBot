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
 * Event fired for generic CTCP events
 *
 * @author mohadib
 */
public class CtcpEvent extends MessageEvent
{

    private final String ctcpString, message;
    private final Channel channel;

    public CtcpEvent(
            String ctcpString,
            String message,
            String rawEventData,
            Channel channel,
            Session session)
    {
        super(channel, message, rawEventData, session, Type.CTCP_EVENT);
        this.ctcpString = ctcpString;
        this.message = message;
        this.channel = channel;
    }

    /**
     * Returns the CTCP query
     *
     * @return ctcp query
     */
    public String getCtcpString()
    {
        return ctcpString;
    }

    /*
     * (non-Javadoc) @see
     * me.mast3rplan.phantombot.jerklib.events.IrcMessageEvent#getChannel()
     */
    @Override
    public Channel getChannel()
    {
        return channel;
    }


    /*
     * (non-Javadoc) @see
     * me.mast3rplan.phantombot.jerklib.events.IrcMessageEvent#getMessage()
     */
    @Override
    public String getMessage()
    {
        return message;
    }
}
