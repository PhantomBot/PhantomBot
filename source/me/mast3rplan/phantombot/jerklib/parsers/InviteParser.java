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

import me.mast3rplan.phantombot.jerklib.events.IRCEvent;
import me.mast3rplan.phantombot.jerklib.events.InviteEvent;

public class InviteParser implements CommandParser
{
    /*
     * :r0bby!n=wakawaka@guifications/user/r0bby INVITE scripy1 :#jerklib2
     */
    /*
     * :yaloki!~yaloki@localhost INVITE SuSEmeet #test
     */

    @Override
    public IRCEvent createEvent(IRCEvent event)
    {
        return new InviteEvent(
                event.arg(0),
                event.getRawEventData(),
                event.getSession());
    }
}
