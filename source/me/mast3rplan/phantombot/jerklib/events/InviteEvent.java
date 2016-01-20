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
 * Event fired when an Invite message is recieved from server
 *
 * @author <a href="mailto:robby.oconnor@gmail.com">Robert O'Connor</a>
 */
public class InviteEvent extends IRCEvent
{

    private final String channelName;

    public InviteEvent(String channelName, String rawEventData, Session session)
    {
        super(rawEventData, session, Type.INVITE_EVENT);
        this.channelName = channelName;
    }

    /**
     * Gets the channel to which we were invited to
     *
     * @return the channel we were invited to.
     */
    public String getChannelName()
    {
        return channelName;
    }
}
