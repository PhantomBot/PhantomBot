/*
 * Copyright (C) 2016-2017 phantombot.tv
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
package tv.phantombot.event.twitter;

import tv.phantombot.event.Event;
import tv.phantombot.twitchwsirc.Channel;

public class TwitterRetweetEvent extends Event {

    /* This class uses an array of String objects for the usernames to reduce
     * the number of calls to the bus.
     */
    private final String[] userNameArray;
    private final Channel channel;

    public TwitterRetweetEvent(String[] userNameArray) {
        this.userNameArray = userNameArray;
        this.channel = null;
    }

    public TwitterRetweetEvent(String[] userNameArray, Channel channel) {
        this.userNameArray = userNameArray;
        this.channel = channel;
    }

    public String[] getUserNameArray() {
        return userNameArray;
    }

    public Channel getChannel() {
        return channel;
    }
}
