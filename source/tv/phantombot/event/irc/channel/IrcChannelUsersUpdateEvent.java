/*
 * Copyright (C) 2016-2022 phantombot.github.io/PhantomBot
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
package tv.phantombot.event.irc.channel;

import tv.phantombot.twitch.irc.TwitchSession;

public class IrcChannelUsersUpdateEvent extends IrcChannelEvent {

    private final String[] joins;
    private final String[] parts;

    /**
     * Class constructor.
     *
     * @param session
     * @param joins
     * @param parts
     */
    public IrcChannelUsersUpdateEvent(TwitchSession session, String[] joins, String[] parts) {
        super(session);

        this.joins = joins.clone();
        this.parts = parts.clone();
    }

    /**
     * Class constructor.
     *
     * @param joins
     * @param parts
     */
    public IrcChannelUsersUpdateEvent(String[] joins, String[] parts) {
        super(null);

        this.joins = joins.clone();
        this.parts = parts.clone();
    }

    /**
     * Method that returns the current array of users who joined the channel in the last 10 minutes.
     *
     * @return joins
     */
    public String[] getJoins() {
        return this.joins.clone();
    }

    /**
     * Method that returns the current array of users who left the channel in the last 10 minutes.
     *
     * @return parts
     */
    public String[] getParts() {
        return this.parts.clone();
    }
}
