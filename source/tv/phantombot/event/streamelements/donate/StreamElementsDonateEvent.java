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
package tv.phantombot.event.streamelements.donate;

import tv.phantombot.event.streamelements.StreamElementsEvent;

public abstract class StreamElementsDonateEvent extends StreamElementsEvent {
    private final String jsonString;

    /**
     * Abstract constructor.
     *
     * @param jsonString
     */
    protected StreamElementsDonateEvent(String jsonString) {
        this.jsonString = jsonString;
    }

    /**
     * Method that returns the donation's JSON string.
     *
     * @return jsonString
     */
    public String getJsonString() {
        return this.jsonString;
    }

    /**
     * Method that converts the class into a string.
     *
     * @return
     */
    @Override
    public String toString() {
        return "StreamElementsDonateEvent -> { jsonString: [" + this.jsonString + "] }";
    }
}
