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
 * The base class for all JerkLib events.
 *
 * @author mohadib
 */
public class IRCEvent extends EventToken
{

    /**
     * Type enum is used to determine type. It is returned from getType()
     */
    public enum Type
    {

        /**
         * Topic event - channel topic event
         */
        TOPIC,
        /**
         * Private message event - msg not sent to channel
         */
        PRIVATE_MESSAGE,
        /**
         * Channel message event - msg sent to a channel
         */
        CHANNEL_MESSAGE,
        /**
         * Server notice event
         */
        NOTICE,
        /**
         * Message of the day event
         */
        MOTD,
        /**
         * Default event - unreconized or ignored by JerkLib
         */
        DEFAULT,
        /**
         * Quit Event - when someone quits from a server
         */
        QUIT,
        /**
         * Part event - someone parts a channel
         */
        PART,
        /**
         * Join event - someone joins a channel
         */
        JOIN,
        /**
         * Nick change event - someones nick changed
         */
        NICK_CHANGE,
        /**
         * Nick in use event - The nick JerkLib is tring to use is in use
         */
        NICK_IN_USE,
        /**
         * unused
         */
        EXCEPTION,
        /**
         * Event spawned from irc numeric 005
         */
        SERVER_INFORMATION,
        CONNECT_COMPLETE,
        UPDATE_HOST_NAME,
        JOIN_COMPLETE,
        MODE_EVENT,
        KICK_EVENT,
        NICK_LIST_EVENT,
        WHO_EVENT,
        WHOIS_EVENT,
        WHOWAS_EVENT,
        CHANNEL_LIST_EVENT,
        INVITE_EVENT,
        SERVER_VERSION_EVENT,
        AWAY_EVENT,
        ERROR,
        CTCP_EVENT,
        CONNECTION_LOST,
    }
    private final Type type;
    private final String data;
    private final Session session;

    public IRCEvent(String data, Session session, Type type)
    {
        super(data);
        this.type = type;
        this.session = session;
        this.data = data;
    }

    /**
     * Used to find out the exact type of event the IrcEvent object is. The
     * IrcEvent object can be cast into a more specific event object to get
     * access to convience methods for the specific event types.
     *
     * @return Type of event
     */
    public Type getType()
    {
        return type;
    }

    /**
     * Returns the raw IRC data that makes up this event
     *
     * @return Raw IRC event text.
     */
    @Override
    public String getRawEventData()
    {
        return data;
    }

    /**
     * Gets session for connection
     *
     * @return Session
     */
    public Session getSession()
    {
        return session;
    }


    /*
     * (non-Javadoc) @see java.lang.Object#toString()
     */
    @Override
    public String toString()
    {
        return data;
    }
}
