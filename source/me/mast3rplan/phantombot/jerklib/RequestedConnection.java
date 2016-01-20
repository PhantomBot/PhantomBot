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
 * Class to encapsulate data about a requested connection,
 *
 * @author mohadib
 */
public class RequestedConnection
{

    private final String hostName;
    private final int port;
    private final String pass;
    private Profile profile;
    private final long requestedTime = System.currentTimeMillis();

    /**
     * Create new RequestedConnection object
     *
     * @param hostName - hostname to connect to
     * @param port - port to use
     * @param profile - profile to use
     */
    public RequestedConnection(String hostName, int port, Profile profile)
    {
        this.hostName = hostName;
        this.port = port;
        this.profile = profile;
        this.pass = null;
    }

    public RequestedConnection(String hostName, int port, String pass, Profile profile)
    {
        this.hostName = hostName;
        this.port = port;
        this.pass = pass;
        this.profile = profile;
    }

    /**
     * Get hostname
     *
     * @return hostname
     */
    public String getHostName()
    {
        return hostName;
    }

    /**
     * Get port
     *
     * @return port
     */
    public int getPort()
    {
        return port;
    }

    /**
     * Get profile
     *
     * @return profile
     */
    public Profile getProfile()
    {
        return profile;
    }

    /**
     * Get the time this RequestedConnection was created.
     *
     * @return time
     */
    public long getTimeRequested()
    {
        return requestedTime;
    }

    /*
     * (non-Javadoc) @see java.lang.Object#hashCode()
     */
    @Override
    public int hashCode()
    {
        return hostName.hashCode() + port + profile.hashCode();
    }

    /*
     * (non-Javadoc) @see java.lang.Object#equals(java.lang.Object)
     */
    @Override
    public boolean equals(Object o)
    {
        if (o instanceof RequestedConnection && o.hashCode() == hashCode())
        {
            RequestedConnection rCon = (RequestedConnection) o;
            return rCon.getHostName().equals(hostName)
                    && rCon.getPort() == port
                    && rCon.getProfile().equals(profile);
        }
        return false;
    }

    /**
     * Update the profile used with this requested connection
     *
     * @param profile
     */
    void setProfile(Profile profile)
    {
        this.profile = profile;
    }

    public String getPass()
    {
        return pass;
    }
}
