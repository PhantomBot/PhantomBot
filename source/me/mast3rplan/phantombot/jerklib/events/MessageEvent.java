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

import me.mast3rplan.phantombot.jerklib.Channel;
import me.mast3rplan.phantombot.jerklib.Session;

/**
 * @author mohadib
 * @see me.mast3rplan.phantombot.jerklib.events.MessageEvent
 */
public class MessageEvent extends IRCEvent
{

    private final String message;
    private final Channel channel;

    public MessageEvent(
            Channel channel,
            String message,
            String rawEventData,
            Session session,
            Type type)
    {
        super(rawEventData, session, type);
        this.channel = channel;
        this.message = message;
    }

    /**
     * returns IRCChannel object the PrivMsg occured in
     *
     * @return the Channel object
     */
    public Channel getChannel()
    {
        return channel;
    }

    /**
     * getMessage() returns the message part of the event
     *
     * @return the message
     */
    public String getMessage()
    {
        return message;
    }

    /**
     * indicates if this message is private
     *
     * @return true if type == Type.PRIVATE_MESSAGE
     */
    public boolean isPrivate()
    {
        return getType() == Type.PRIVATE_MESSAGE;
    }
}
