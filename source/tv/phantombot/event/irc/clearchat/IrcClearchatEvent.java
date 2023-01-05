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
package tv.phantombot.event.irc.clearchat;

import tv.phantombot.event.irc.IrcEvent;
import tv.phantombot.twitch.irc.TwitchSession;

public class IrcClearchatEvent extends IrcEvent {

    private final String username;
    private final String reason;
    private final String duration;

    /**
     * Class constructor
     *
     * @param session
     * @param username
     * @param reason
     * @param duration
     */
    public IrcClearchatEvent(TwitchSession session, String username, String reason, String duration) {
        super(session);

        this.username = username;
        this.reason = reason;
        this.duration = duration;
    }

    /**
     * Method that returns the user who was timed-out
     *
     * @return username
     */
    public String getUsername() {
        return this.username;
    }

    /**
     * Method that returns the reason the user was timed-out
     *
     * @return reason
     */
    public String getReason() {
        return this.reason;
    }

    /**
     * Method that returns the length the user was timed-out
     *
     * @return duration
     */
    public String getDuration() {
        return this.duration;
    }
}
