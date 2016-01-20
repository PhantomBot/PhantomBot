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
import me.mast3rplan.phantombot.jerklib.events.QuitEvent;

import java.util.List;

public class QuitParser implements CommandParser
{

    @Override
    public QuitEvent createEvent(IRCEvent event)
    {
        Session session = event.getSession();
        String nick = event.getNick();
        List<Channel> chanList = event.getSession().removeNickFromAllChannels(nick);
        return new QuitEvent(
                event.getRawEventData(),
                session,
                event.arg(0), // message
                chanList);
    }
}
