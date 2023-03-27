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
package tv.phantombot.event.irc.channel;

import java.util.Collections;
import java.util.List;

import tv.phantombot.twitch.irc.TwitchSession;

/**
 * The list of users present in TMI is updated
 * @author gmt2001
 */
public class IrcChannelUsersUpdateEvent extends IrcChannelEvent {
    private final List<String> chatters;

    /**
     * Constructor
     *
     * @param chatters A list of login names for users who are currently in chat
     */
    public IrcChannelUsersUpdateEvent(List<String> chatters) {
        super(null);
        this.chatters = Collections.unmodifiableList(chatters);
    }

    /**
     * Class constructor.
     *
     * @param session
     * @param joins
     * @param parts
     * @deprecated Joins/Parts are not calculated anymore
     */
    @Deprecated(since = "3.8.0.0", forRemoval = true)
    public IrcChannelUsersUpdateEvent(TwitchSession session, String[] joins, String[] parts) {
        super(session);
        this.chatters = null;
    }

    /**
     * Class constructor.
     *
     * @param joins
     * @param parts
     * @deprecated Joins/Parts are not calculated anymore
     */
    @Deprecated(since = "3.8.0.0", forRemoval = true)
    public IrcChannelUsersUpdateEvent(String[] joins, String[] parts) {
        super(null);
        this.chatters = null;
    }

    /**
     * Method that returns the current array of users who joined the channel in the last 10 minutes.
     *
     * @return joins
     * @deprecated Joins/Parts are not calculated anymore
     */
    @Deprecated(since = "3.8.0.0", forRemoval = true)
    public String[] getJoins() {
        return new String[0];
    }

    /**
     * Method that returns the current array of users who left the channel in the last 10 minutes.
     *
     * @return parts
     * @deprecated Joins/Parts are not calculated anymore
     */
    @Deprecated(since = "3.8.0.0", forRemoval = true)
    public String[] getParts() {
        return new String[0];
    }

    /**
     * A list of login names for users who are currently in chat
     *
     * @return A list of login names for users who are currently in chat
     */
    public List<String> chatters() {
        return this.chatters;
    }
}
