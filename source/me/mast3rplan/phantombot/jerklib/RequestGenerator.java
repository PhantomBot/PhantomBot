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
 * A class for writing Session level events. By that I mean not Channel level
 * stuff , though some methods can be passed a Channel or channel name as a
 * target.
 *
 * @author mohadib
 */
class RequestGenerator
{

    private Session session;

    /**
     * Sets the sessionnection to use
     *
     * @param session
     */
    void setSession(Session session)
    {
        this.session = session;
    }

    /**
     * Send Who request
     *
     * @param who
     */
    public void who(String who)
    {
        write(new WriteRequest("WHO " + who, session));
    }

    /**
     * Send a whois query
     *
     * @param nick - target of whois
     */
    public void whois(String nick)
    {
        write(new WriteRequest("WHOIS " + nick, session));
    }

    /**
     * Send WhoWas query
     *
     * @param nick
     */
    public void whoWas(String nick)
    {
        write(new WriteRequest("WHOWAS " + nick, session));
    }

    /**
     * Invite a user to a channel
     *
     * @param nick
     * @param chan
     */
    public void invite(String nick, Channel chan)
    {
        write(new WriteRequest("INVITE " + nick + " " + chan.getName(), session));
    }

    /**
     * Get a List of Channels from server.
     */
    public void chanList()
    {
        write(new WriteRequest("LIST", session));
    }

    /**
     * Get information on a secific channel
     *
     * @param channel
     */
    public void chanList(String channel)
    {
        write(new WriteRequest("LIST " + channel, session));
    }

    /**
     * Join a Channel
     *
     * @param channel
     */
    public void join(String channel)
    {
        write(new WriteRequest("JOIN " + channel, session));
    }

    /**
     * Join a password protected Channel
     *
     * @param channel
     * @param pass
     */
    public void join(String channel, String pass)
    {
        write(new WriteRequest("JOIN " + channel + " " + pass, session));
    }

    /**
     * Send a ctcp request
     *
     * @param target
     * @param request
     */
    public void ctcp(String target, String request)
    {
        write(new WriteRequest("\001" + request.toUpperCase() + "\001", session, target));
    }

    /**
     * Send a notice
     *
     * @param target
     * @param msg
     */
    public void notice(String target, String msg)
    {
        write(new WriteRequest("NOTICE " + target + " :" + msg, session));
    }

    /**
     * Set self away
     *
     * @param message
     */
    public void setAway(String message)
    {
        write(new WriteRequest("AWAY :" + message, session));
    }

    /**
     * Unset away
     */
    public void unSetAway()
    {
        write(new WriteRequest("AWAY", session));
    }

    /**
     * Send server version query
     */
    public void getServerVersion()
    {
        write(new WriteRequest("VERSION " + session.getConnection().getHostName(), session));
    }

    /**
     * Send server version query for specific hostmask pattern
     *
     * @param hostPattern
     */
    public void getServerVersion(String hostPattern)
    {
        write(new WriteRequest("VERSION " + hostPattern, session));
    }

    /**
     * Send nick change request
     *
     * @param nick
     */
    public void changeNick(String nick)
    {
        write(new WriteRequest("NICK " + nick, session));
    }

    /**
     * Set a mode
     *
     * @param target
     * @param mode
     */
    public void mode(String target, String mode)
    {
        write(new WriteRequest("MODE " + target + " " + mode, session));
    }

    /**
     * Send ctcp action
     *
     * @param target
     * @param actionText
     */
    public void action(String target, String actionText)
    {
        ctcp(target, actionText);
    }

    /**
     * Speak in a channel
     *
     * @param msg
     * @param channel
     * @see me.mast3rplan.phantombot.jerklib.Channel#say(String)
     */
    public void sayChannel(String msg, Channel channel)
    {
        write(new WriteRequest(msg, channel, session));
    }

    /**
     * Send a private message
     *
     * @param nick
     * @param msg
     */
    public void sayPrivate(String nick, String msg)
    {
        write(new WriteRequest(msg, session, nick));
    }

    /**
     * Send raw text to server
     *
     * @param data
     */
    public void sayRaw(String data)
    {
        write(new WriteRequest(data, session));
    }

    private void write(WriteRequest req)
    {
        Connection con = session.getConnection();
        if (con != null)
        {
            con.addWriteRequest(req);
        }
    }
}
