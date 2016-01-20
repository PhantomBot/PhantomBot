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
import me.mast3rplan.phantombot.jerklib.events.IRCEvent;
import me.mast3rplan.phantombot.jerklib.events.TopicEvent;

import java.util.HashMap;
import java.util.Map;

/*
 * :sterling.freenode.net 332 scrip #test :Welcome to #test - This channel is
 * :sterling.freenode.net 333 scrip #test LuX 1159267246
 */
public class TopicParser implements CommandParser
{

    private final Map<Channel, TopicEvent> topicMap = new HashMap<>();

    @Override
    @SuppressWarnings("element-type-mismatch")
    public IRCEvent createEvent(IRCEvent event)
    {
        if (event.numeric() == 332)
        {
            TopicEvent tEvent = new TopicEvent(
                    event.getRawEventData(),
                    event.getSession(),
                    event.getSession().getChannel(event.arg(1)),
                    event.arg(2));
            if (topicMap.containsValue(tEvent.getChannel()))
            {
                topicMap.get(tEvent.getChannel()).appendToTopic(tEvent.getTopic());
            } else
            {
                topicMap.put(tEvent.getChannel(), tEvent);
            }
        } else
        {
            Channel chan = event.getSession().getChannel(event.arg(1));
            if (topicMap.containsKey(chan))
            {
                TopicEvent tEvent = topicMap.get(chan);
                topicMap.remove(chan);
                tEvent.setSetBy(event.arg(2));
                tEvent.setSetWhen(event.arg(3));
                chan.setTopicEvent(tEvent);
                return tEvent;
            }
        }
        return event;
    }
}
