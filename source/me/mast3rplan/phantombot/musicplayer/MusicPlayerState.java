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
package me.mast3rplan.phantombot.musicplayer;

public enum MusicPlayerState {

    NEW(-2),
    UNSTARTED(-1),
    ENDED(0),
    PLAYING(1),
    PAUSED(2),
    BUFFERING(3),
    CUED(5);
    public int i;

    private MusicPlayerState(int i) {
        this.i = i;
    }

    public static MusicPlayerState getStateFromId(int i) {
        for (MusicPlayerState mps : MusicPlayerState.values()) {
            if (mps.i == i) {
                return mps;
            }
        }
        return null;
    }
}
