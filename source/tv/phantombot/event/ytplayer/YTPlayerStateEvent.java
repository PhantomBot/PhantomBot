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
package tv.phantombot.event.ytplayer;

import tv.phantombot.ytplayer.YTPlayerState;

public class YTPlayerStateEvent extends YTPlayerEvent {
    private final YTPlayerState state;

    /**
     * Class constructor.
     *
     * @param state
     */
    public YTPlayerStateEvent(YTPlayerState state) {
        this.state = state;
    }

    /**
     * Method that returns the player state.
     *
     * @return state
     */
    public YTPlayerState getState() {
        return this.state;
    }

    /**
     * Method that returns the player state ID.
     *
     * @return state.i
     */
    public int getStateId() {
        return this.state.i;
    }
}
