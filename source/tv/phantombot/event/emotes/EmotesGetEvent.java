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
package tv.phantombot.event.emotes;

import tv.phantombot.cache.EmotesCache;

import java.util.List;

public class EmotesGetEvent extends EmotesEvent {
    private final List<EmotesCache.EmotesSet> emotesSet;

    public EmotesGetEvent(List<EmotesCache.EmotesSet> emotesSet) {
        if (emotesSet == null) {
            throw new IllegalArgumentException("EmotesSet cannot be null");
        }
        this.emotesSet = emotesSet;
    }

    public List<EmotesCache.EmotesSet> getEmotesSet() {
        return this.emotesSet;
    }
}
