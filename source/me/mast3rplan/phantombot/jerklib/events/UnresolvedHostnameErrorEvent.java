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

import java.nio.channels.UnresolvedAddressException;
import me.mast3rplan.phantombot.jerklib.Session;

/**
 * Error generated when a DNS lookup fails during connection.
 *
 * @author mohadib
 */
public class UnresolvedHostnameErrorEvent extends ErrorEvent
{

    private final String hostName;
    private final UnresolvedAddressException exception;

    public UnresolvedHostnameErrorEvent(
            Session session,
            String rawEventData,
            String hostName,
            UnresolvedAddressException exception)
    {
        super(rawEventData, session, ErrorType.UNRESOLVED_HOSTNAME);
        this.hostName = hostName;
        this.exception = exception;
    }

    /**
     * Gets the wrapped UnresolvedAddressException
     *
     * @return UnresolvedAddressException
     */
    public UnresolvedAddressException getException()
    {
        return exception;
    }

    /**
     * Gets the unresolvable hostname
     *
     * @return hostname that could not be resloved
     */
    @Override
    public String getHostName()
    {
        return hostName;
    }
}
