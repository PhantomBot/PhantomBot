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

import me.mast3rplan.phantombot.jerklib.events.ChannelListEvent;
import me.mast3rplan.phantombot.jerklib.events.IRCEvent;

import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class ChanListParser implements CommandParser
{

    @Override
    public IRCEvent createEvent(IRCEvent event)
    {
        String data = event.getRawEventData();
        Pattern p = Pattern.compile("^:\\S+\\s322\\s\\S+\\s(\\S+)\\s(\\d+)\\s:(.*)$");
        Matcher m = p.matcher(data);
        if (m.matches())
        {
            return new ChannelListEvent(
                    data,
                    m.group(1),
                    m.group(3),
                    Integer.parseInt(m.group(2)),
                    event.getSession());
        }
        return event;
    }
}
