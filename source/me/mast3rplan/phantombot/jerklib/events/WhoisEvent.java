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

import java.util.Date;
import java.util.List;

/**
 * Fired when whois event recieved
 *
 * @author mohadib
 */
public class WhoisEvent extends IRCEvent
{

    private final String host, user, realName, nick;
    private String whoisServer, whoisServerInfo;
    private List<String> channelNames;
    private boolean isOp;
    private long secondsIdle;
    private int signOnTime;

    public WhoisEvent(String nick, String realName, String user, String host, String rawEventData, Session session)
    {
        super(rawEventData, session, Type.WHOIS_EVENT);
        this.nick = nick;
        this.realName = realName;
        this.user = user;
        this.host = host;
    }

    /**
     * A list of channel names the user is joined to
     *
     * @return List of Channel names
     */
    public List<String> getChannelNames()
    {
        return channelNames;
    }

    /**
     * @param chanNames
     */
    public void setChannelNamesList(List<String> chanNames)
    {
        channelNames = chanNames;
    }

    /**
     * the hostname of the whoised user
     *
     * @return hostname
     */
    public String getHost()
    {
        return host;
    }

    /**
     * gets username of whoised user
     *
     * @return Username
     */
    public String getUser()
    {
        return user;
    }

    /**
     * gets real name of whoised user
     *
     * @return real name
     */
    public String getRealName()
    {
        return realName;
    }

    /**
     * Gets the nick the whois event is about
     *
     * @return nick
     */
    @Override
    public String getNick()
    {
        return nick;
    }

    /**
     * not impled
     *
     * @return not impled
     */
    public boolean isAnOperator()
    {
        return isOp;
    }

    /**
     * returns true if person is idle , else false
     *
     * @return true if person is idle , else false
     */
    public boolean isIdle()
    {
        return secondsIdle > 0;
    }

    /**
     * returns how many seconds person has been idle
     *
     * @return amount in seconds person has been idle
     */
    public long secondsIdle()
    {
        return secondsIdle;
    }

    /**
     * @param secondsIdle
     */
    public void setSecondsIdle(int secondsIdle)
    {
        this.secondsIdle = secondsIdle();
    }

    /**
     * returns sign on time
     *
     * @return sign on time
     */
    public Date signOnTime()
    {
        return new Date(1000L * signOnTime);
    }

    /**
     * @param signOnTime
     */
    public void setSignOnTime(int signOnTime)
    {
        this.signOnTime = signOnTime;
    }

    /**
     * The hostname of the server who answered the whois query
     *
     * @return hostname
     */
    public String whoisServer()
    {
        return whoisServer;
    }

    /**
     * @param whoisServer
     */
    public void setWhoisServer(String whoisServer)
    {
        this.whoisServer = whoisServer;
    }

    /**
     * Gets whois server information
     *
     * @return server information
     */
    public String whoisServerInfo()
    {
        return whoisServerInfo;
    }

    /**
     * @param whoisServerInfo
     */
    public void setWhoisServerInfo(String whoisServerInfo)
    {
        this.whoisServerInfo = whoisServerInfo;
    }

    public void appendRawEventData(String rawEventData)
    {
        //this.rawEventData += "\r\n" + rawEventData;
    }
}
