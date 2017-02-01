/*
 * Copyright (C) 2017 phantombot.tv
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

import me.mast3rplan.phantombot.twitchwsirc.Channel;

public class TwitchHostedEvent extends TwitchHostEvent {

    public TwitchHostedEvent(String hoster) {
        super(hoster, Type.HOST);
    }
    public TwitchHostedEvent(String hoster, int users) {
        super(hoster, Type.HOST, users);
    }
    public TwitchHostedEvent(String hoster, Channel channel) {
        super(hoster, Type.HOST, 0, channel);
    }

    public TwitchHostedEvent(String hoster, int users, Channel channel) {
        super(hoster, Type.HOST, users, channel);
    }
}
