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
 * NoticeIRCEvent - the event for notices from the server
 *
 * @author mohadib
 */
public class NoticeEvent extends IRCEvent
{

    private final String message, toWho, byWho;
    private final Channel channel;

    public NoticeEvent(String rawEventData, Session session, String message, String toWho, String byWho, Channel channel)
    {
        super(rawEventData, session, Type.NOTICE);
        this.message = message;
        this.toWho = toWho;
        this.byWho = byWho;
        this.channel = channel;
    }

    /**
     * returns notice message
     *
     * @return notice message
     */
    public String getNoticeMessage()
    {
        return message;
    }

    /**
     * Gets who sent the notice event
     *
     * @return who
     */
    public String byWho()
    {
        return byWho;
    }

    /**
     * If this is a Channel notice this will return the Channel
     *
     * @return Channel
     * @see Channel
     */
    public Channel getChannel()
    {
        return channel;
    }

    /**
     * If this notice is sent to a user this will return who
     *
     * @return who
     */
    public String toWho()
    {
        return toWho;
    }
}
