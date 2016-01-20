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

import me.mast3rplan.phantombot.jerklib.Channel;
import me.mast3rplan.phantombot.jerklib.Session;
import me.mast3rplan.phantombot.jerklib.events.IRCEvent;
import me.mast3rplan.phantombot.jerklib.events.KickEvent;

/**
 * @author mohadib
 */
public class KickParser implements CommandParser
{

    @Override
    public IRCEvent createEvent(IRCEvent event)
    {
        Session session = event.getSession();
        Channel channel = session.getChannel(event.arg(0));

        String msg = "";
        if (event.args().size() == 3)
        {
            msg = event.arg(2);
        }

        return new KickEvent(
                event.getRawEventData(),
                session,
                event.getNick(), // byWho
                event.arg(1), // victim
                msg, // message
                channel);
    }
}
