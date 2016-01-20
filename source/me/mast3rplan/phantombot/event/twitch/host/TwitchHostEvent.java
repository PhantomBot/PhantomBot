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
package me.mast3rplan.phantombot.event.twitch.host;

import me.mast3rplan.phantombot.event.twitch.TwitchEvent;
import me.mast3rplan.phantombot.jerklib.Channel;

public abstract class TwitchHostEvent extends TwitchEvent
{

    private final String hoster;
    private final Type type;

    public enum Type
    {

        HOST,
        UNHOST;
    }

    protected TwitchHostEvent(String hoster, Type type)
    {
        this.hoster = hoster;
        this.type = type;
    }

    protected TwitchHostEvent(String hoster, Type type, Channel channel)
    {
        super(channel);
        this.hoster = hoster;
        this.type = type;
    }

    public String getHoster()
    {
        return hoster;
    }

    public Type getType()
    {
        return type;
    }

    public String toEventSocket()
    {
    	return this.getHoster() + "|" + this.getType();
    }
}
