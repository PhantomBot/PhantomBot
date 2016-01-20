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
import me.mast3rplan.phantombot.jerklib.events.WhoisEvent;

import java.util.Arrays;
import java.util.List;

public class WhoisParser implements CommandParser
{

    private WhoisEvent we;

    @Override
    public IRCEvent createEvent(IRCEvent event)
    {
        switch (event.numeric())
        {
            case 311:
            {

                // "<nick> <user> <host> * :<real name>"
                we = new WhoisEvent(
                        event.arg(0),
                        event.arg(4),
                        event.arg(1),
                        event.arg(2),
                        event.getRawEventData(),
                        event.getSession());
                break;
            }
            case 319:
            {
                // "<nick> :{[@|+]<channel><space>}"
                // :kubrick.freenode.net 319 scripy mohadib :@#me.mast3rplan.phantombot.jerklib
                // kubrick.freenode.net 319 scripy mohadib :@#me.mast3rplan.phantombot.jerklib ##swing
                if (we != null)
                {
                    List<String> chanNames = Arrays.asList(event.arg(2).split("\\s+"));
                    we.setChannelNamesList(chanNames);
                    we.appendRawEventData(event.getRawEventData());
                }
                break;
            }
            case 312:
            {
                // "<nick> <server> :<server info>"
                // :kubrick.freenode.net 312 scripy mohadib irc.freenode.net :http://freenode.net/
                if (we != null)
                {
                    we.setWhoisServer(event.arg(2));
                    we.setWhoisServerInfo(event.arg(3));
                    we.appendRawEventData(event.getRawEventData());
                }
                break;
            }
            case 320:
            {
                // not in RFC1459
                // :kubrick.freenode.net 320 scripy mohadib :is identified to services
                if (we != null)
                {
                    we.appendRawEventData(event.getRawEventData());
                }
                break;
            }
            case 317:
            {
                //:anthony.freenode.net 317 scripy scripy 2 1202063240 :seconds idle,signon time
                // from rfc "<nick> <integer> :seconds idle"
                if (we != null)
                {
                    we.setSignOnTime(Integer.parseInt(event.arg(3)));
                    we.setSecondsIdle(Integer.parseInt(event.arg(2)));
                    we.appendRawEventData(event.getRawEventData());
                }
                break;
            }
            case 318:
            {
                // end of whois - fireevent
                if (we != null)
                {
                    we.appendRawEventData(event.getRawEventData());
                    return we;
                }
                break;
            }
        }
        return event;
    }
}
