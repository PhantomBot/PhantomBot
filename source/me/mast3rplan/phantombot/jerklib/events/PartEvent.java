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
 * PartIRCEvent is made when someone parts a channel
 *
 * @author mohadib
 */
public class PartEvent extends IRCEvent
{

    private final String who, partMessage;
    private final Channel channel;

    public PartEvent(String rawEventData, Session session, String who, Channel channel, String partMessage)
    {
        super(rawEventData, session, Type.PART);
        this.channel = channel;
        this.who = who;
        this.partMessage = partMessage;
    }

    /**
     * returns the nick of who parted
     *
     * @return nick of parted
     */
    @Override
    public final String getNick()
    {
        return who;
    }

    /**
     * returns the name of the channel parted
     *
     * @return name of channel parted
     */
    public final String getChannelName()
    {
        return channel.getName();
    }

    /**
     * returns IRCChannel object for channel parted
     *
     * @return Channel object parted
     * @see Channel
     */
    public final Channel getChannel()
    {
        return channel;
    }

    /**
     * returns part message if there is one
     *
     * @return part message
     */
    public final String getPartMessage()
    {
        return this.partMessage;
    }
}
