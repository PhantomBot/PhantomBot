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

import me.mast3rplan.phantombot.jerklib.Session;

/**
 * MOTDEvent is the event dispatched for every MOTD line from the server
 *
 * @author mohadib
 */
public class MotdEvent extends IRCEvent
{

    private final String motdLine, hostName;

    public MotdEvent(String rawEventData, Session session, String motdLine, String hostName)
    {
        super(rawEventData, session, Type.MOTD);
        this.motdLine = motdLine;
        this.hostName = hostName;
    }

    /**
     * Gets a line of the MOTD
     *
     * @return One line of the MOTD
     */
    public String getMotdLine()
    {
        return motdLine;
    }

    /**
     * returns name of host this event originated from
     *
     * @return hostname
     */
    @Override
    public String getHostName()
    {
        return hostName;
    }
}
