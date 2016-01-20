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

import me.mast3rplan.phantombot.jerklib.Session;
import me.mast3rplan.phantombot.jerklib.events.IRCEvent;
import me.mast3rplan.phantombot.jerklib.events.ServerVersionEvent;

/*
 * "<version>.<debuglevel> <server> :<comments>" :kubrick.freenode.net 351
 * scripy hyperion-1.0.2b(382). kubrick.freenode.net :iM dncrTS/v4
 * :kubrick.freenode.net 002 mohadib_ :Your host is
 * kubrick.freenode.net[kubrick.freenode.net/6667], running version
 * hyperion-1.0.2b :irc.nixgeeks.com 002 mohadib :Your host is irc.nixgeeks.com,
 * running version Unreal3.2.3
 */
public class ServerVersionParser implements CommandParser
{

    @Override
    public IRCEvent createEvent(IRCEvent event)
    {

        Session session = event.getSession();
        if (event.numeric() == 002)
        {
            return new ServerVersionEvent(
                    event.arg(1),
                    event.prefix(),
                    event.arg(1).substring(event.arg(1).indexOf("running ") + 8),
                    "",
                    event.getRawEventData(),
                    session);
        }

        return new ServerVersionEvent(
                event.arg(3),
                event.prefix(),
                event.arg(1),
                "",
                event.getRawEventData(),
                session);
    }
}
