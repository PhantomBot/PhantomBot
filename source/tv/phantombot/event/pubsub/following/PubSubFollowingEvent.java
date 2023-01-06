/*
 * Copyright (C) 2016-2023 phantombot.github.io/PhantomBot
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
package tv.phantombot.event.pubsub.following;

import tv.phantombot.event.pubsub.PubSubEvent;

public abstract class PubSubFollowingEvent extends PubSubEvent {

    private final String username;
    private final String userid;
    private final String displayname;

    /**
     * Abstract constructor.
     *
     * @param username
     * @param userid
     * @param displayname
     */
    protected PubSubFollowingEvent(String username, String userid, String displayname) {
        this.username = username;
        this.userid = userid;
        this.displayname = displayname;
    }

    /**
     * Method that returns the username that the even was triggered for.
     *
     * @return username
     */
    public String getUsername() {
        return this.username;
    }

    public String getUserid() {
        return this.userid;
    }

    public String getDisplayname() {
        return this.displayname;
    }
}
