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
package me.mast3rplan.phantombot.event.twitch.follower;

import me.mast3rplan.phantombot.event.twitch.TwitchEvent;
import me.mast3rplan.phantombot.twitchwsirc.Channel;

public abstract class TwitchFollowerEvent extends TwitchEvent {

    private final String follower;
    private final Type type;

    public enum Type {

        FOLLOW,
        UNFOLLOW;
    }

    protected TwitchFollowerEvent(String follower, Type type) {
        this.follower = follower;
        this.type = type;
    }

    protected TwitchFollowerEvent(String follower, Type type, Channel channel) {
        super(channel);
        this.follower = follower;
        this.type = type;
    }

    public String getFollower() {
        return follower;
    }

    public Type getType() {
        return type;
    }

    public String toEventSocket() {
        return this.getFollower() + "|" + this.getType();
    }
}
