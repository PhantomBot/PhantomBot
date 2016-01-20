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
 * Event fired when someone is kicked from a channel
 *
 * @author mohadib
 * @see Channel#kick(String, String)
 */
public class KickEvent extends IRCEvent
{

    private final String byWho, who, message;
    private final Channel channel;

    public KickEvent(
            String rawEventData,
            Session session,
            String byWho,
            String who,
            String message,
            Channel channel)
    {
        super(rawEventData, session, Type.KICK_EVENT);
        this.byWho = byWho;
        this.who = who;
        this.message = message;
        this.channel = channel;
    }

    /**
     * Gets the nick of the user who did the kicking
     *
     * @return nick
     */
    public String byWho()
    {
        return byWho;
    }

    /**
     * Gets the nick of who was kicked
     *
     * @return who was kicked
     */
    public String getWho()
    {
        return who;
    }

    /**
     * Gets the kick message
     *
     * @return message
     */
    public String getMessage()
    {
        return message;
    }

    /**
     * Gets the channel object someone was kicked from
     *
     * @return The Channel
     */
    public Channel getChannel()
    {
        return channel;
    }
}
