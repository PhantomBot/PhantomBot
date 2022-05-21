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

public class IrcChannelUserModeEvent extends IrcChannelEvent {
    private final String user;
    private final String mode;
    private final boolean add;

    /**
     * Class constructor
     *
     * @param session
     * @param  user
     * @param  mode
     * @param add
     */
    public IrcChannelUserModeEvent(TwitchSession session, String user, String mode, boolean add) {
        super(session);

        this.user = user;
        this.mode = mode;
        this.add = add;
    }

    /**
     * Method that returns the user whose mode changed
     *
     * @return user
     */
    public String getUser() {
        return this.user;
    }

    /**
     * Method that returns the user's mode.
     *
     * @return mode
     */
    public String getMode() {
        return this.mode;
    }

    /**
     * Method that returns if the user got OP or not.
     *
     * @return add
     */
    public boolean getAdd() {
        return this.add;
    }
}
