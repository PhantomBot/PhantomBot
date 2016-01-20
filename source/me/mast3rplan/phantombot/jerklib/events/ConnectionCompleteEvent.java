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
 * Event made when connected to the server This event contains the real server
 * name. Example. When connection to 'irc.freenode.net' we might actually
 * connect to kornbluf.freenode.net or some other host. This event will have the
 * real hosts name.
 * <p/>
 * After receiving this event a Session is ready to join channels
 *
 * @author mohadib
 */
public class ConnectionCompleteEvent extends IRCEvent
{

    private final String hostName, oldHostName;

    public ConnectionCompleteEvent(String rawEventData, String hostName, Session session, String oldHostName)
    {
        super(rawEventData, session, Type.CONNECT_COMPLETE);
        this.hostName = hostName;
        this.oldHostName = oldHostName;
    }

    /**
     * Get the hostname used for the requested connection
     *
     * @return old host name
     */
    public String getOldHostName()
    {
        return oldHostName;
    }

    /**
     * Gets the actual hostname
     *
     * @return actual host name
     */
    public String getActualHostName()
    {
        return hostName;
    }
}
