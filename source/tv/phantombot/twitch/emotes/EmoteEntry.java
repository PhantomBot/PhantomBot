/*
 * Copyright (C) 2016-2026 phantombot.github.io/PhantomBot
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
package tv.phantombot.twitch.emotes;

import org.apache.commons.lang3.Validate;

/**
 * Represents an emote in its most basic form
 */
public class EmoteEntry {
    private final String id;
    private final String code;

    public EmoteEntry(String id, String code) {
        Validate.notEmpty(id, "id can't be empty");
        Validate.notEmpty(id, "code can't be empty");
        this.id = id;
        this.code = code;
    }

    /**
     * Gets the id that is often used to retrieve the corresponding image
     *
     * @return a string containing the id
     */
    public String getId() {
        return id;
    }

    /**
     * Gets the code that is assigned to the emote and gets replaced by the image
     *
     * @return a string containing the code that triggers the emote and gets replaced
     */
    public String getCode() {
        return code;
    }

    public String toString() {
        return "EmoteEntry(id=" + this.getId() + ", code=" + this.getCode() + ")";
    }
}
