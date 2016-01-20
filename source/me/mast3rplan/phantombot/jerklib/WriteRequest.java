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
package me.mast3rplan.phantombot.jerklib;

/**
 * WriteRequest - this is sent to a Connection whenever a 'write' needs to
 * happen. There are 3 types of WriteRequests. PRIV_MSG , DIRECT_MSG , RAW_MSG
 * (from the Type enum). RAW_MSG is used when you need direct access to the IRC
 * stream , else PRIV_MSG or DIRECT_MSG should be used.
 *
 * @author mohadib
 */
public class WriteRequest
{

    private final Type type;
    private final String message, nick;
    private final Channel channel;
    private final Session session;

    /**
     * Type enum is used to determine type. It is returned from getType()
     * PRIV_MSG is a standard msg to an IRC channel. DIRECT_MSG is msg sent
     * directly to another user (not in a channel). RAW_MSG when direct access
     * to the IRC stream is needed.
     */
    public enum Type
    {

        CHANNEL_MSG, PRIVATE_MSG, RAW_MSG
    };

    /**
     * Create a request that will be written as a private message.
     *
     * @param message
     * @param con
     * @param nick
     */
    WriteRequest(String message, Session session, String nick)
    {
        this.type = Type.PRIVATE_MSG;
        this.message = message;
        this.session = session;
        this.nick = nick;
        this.channel = null;
    }

    /**
     * Create a request that will be written as a channel message.
     *
     * @param message
     * @param channel
     * @param con
     */
    WriteRequest(String message, Channel channel, Session session)
    {
        this.type = Type.CHANNEL_MSG;
        this.message = message;
        this.channel = channel;
        this.session = session;
        this.nick = null;
    }

    /**
     * Create a request that will be written as raw text.
     *
     * @param message
     * @param con
     */
    WriteRequest(String message, Session session)
    {
        this.type = Type.RAW_MSG;
        this.message = message;
        this.session = session;
        this.channel = null;
        this.nick = null;
    }

    /**
     * Type of request
     *
     * @return type
     */
    public Type getType()
    {
        return type;
    }

    /**
     * Get message part of request
     *
     * @return message
     */
    public String getMessage()
    {
        return message;
    }

    /**
     * Get Channel associated with the request. If no channel null will be
     * returned;
     *
     * @return channel or null if no channel for request
     */
    public Channel getChannel()
    {
        return channel;
    }

    /**
     * Get the nick used for this request
     *
     * @return nick
     */
    public String getNick()
    {
        return nick;
    }

    /**
     * Return the Session
     *
     * @return Session
     */
    public Session getSession()
    {
        return session;
    }

    /**
     * Gets the connection
     *
     * @return the connection
     */
    Connection getConnection()
    {
        return session.getConnection();
    }
}
