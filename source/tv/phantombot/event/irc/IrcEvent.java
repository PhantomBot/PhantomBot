/*
 * Copyright (C) 2016-2018 phantombot.tv
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
package tv.phantombot.event.irc;

import tv.phantombot.event.Event;

import tv.phantombot.twitch.irc.TwitchSession;

public abstract class IrcEvent extends Event {
    private final TwitchSession session;

    /**
     * Class constructor
     *
     * @param {TwitchSession} session
     */
    protected IrcEvent(TwitchSession session) {
        this.session = session;
    }

    /**
     * Method that returns the session.
     *
     * @param {TwitchSession} session
     */
    public TwitchSession getSession() {
        return this.session;
    }
}
