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
package me.mast3rplan.phantombot.jerklib.parsers;

import me.mast3rplan.phantombot.jerklib.events.ConnectionCompleteEvent;
import me.mast3rplan.phantombot.jerklib.events.IRCEvent;

public class ConnectionCompleteParser implements CommandParser
{

    /*
     * :irc.nmglug.org 001 namnar :Welcome to the nmglug.org * Lets user know
     * channels can now be joined etc.
     *
     * Lets user update *records* A requested connection to irc.freenode.net
     * might actually connect to kubrick.freenode.net etc
     */
    @Override
    public ConnectionCompleteEvent createEvent(IRCEvent event)
    {
        return new ConnectionCompleteEvent(
                event.getRawEventData(),
                event.prefix(), // actual hostname
                event.getSession(),
                event.getSession().getConnectedHostName() // requested hostname
        );
    }
}
