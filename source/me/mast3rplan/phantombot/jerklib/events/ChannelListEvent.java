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
 * The event fired when a line from a channel listing is parsed
 *
 * @author mohaidb
 * @see Session#chanList()
 * @see Session#chanList(String)
 */
public class ChannelListEvent extends IRCEvent
{

    private final String channelName, topic;
    private final int numUsers;

    public ChannelListEvent(
            String rawEventData,
            String channelName,
            String topic,
            int numUsers,
            Session session)
    {
        super(rawEventData, session, Type.CHANNEL_LIST_EVENT);
        this.channelName = channelName;
        this.topic = topic;
        this.numUsers = numUsers;
    }

    /**
     * Gets the channel name
     *
     * @return the channel name
     */
    public String getChannelName()
    {
        return channelName;
    }

    /**
     * Gets the number of users in the channel
     *
     * @return number of users
     */
    public int getNumberOfUser()
    {
        return numUsers;
    }

    /**
     * Gets the topic of the channel
     *
     * @return the channel topic
     */
    public String getTopic()
    {
        return topic;
    }
}
