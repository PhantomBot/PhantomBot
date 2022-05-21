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
package tv.phantombot.event.streamlabs.donate;

import org.json.JSONObject;
import tv.phantombot.event.streamlabs.StreamLabsEvent;

public abstract class StreamLabsDonateEvent extends StreamLabsEvent {

    private final JSONObject data;

    /**
     * Abstract constructor.
     *
     * @param jsonString
     */
    protected StreamLabsDonateEvent(JSONObject data) {
        this.data = data;
    }

    public JSONObject getData() {
        return this.data;
    }

    /**
     * Method that returns the donation's JSON string.
     *
     * @return jsonString
     */
    public String getJsonString() {
        return this.data.toString();
    }

    /**
     * Method that converts the class into a string.
     *
     * @return
     */
    @Override
    public String toString() {
        return "TwitchAlertsDonateEvent -> { jsonString: [" + this.getJsonString() + "] }";
    }
}
