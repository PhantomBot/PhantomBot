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

package tv.phantombot.event.twitch.bits;

import tv.phantombot.event.twitch.TwitchEvent;

public class TwitchBitsEvent extends TwitchEvent {
    private final String username;
    private final String bits;

    /*
     * Class constructor.
     *
     * @param {String} username
     * @param {String} bits
     */
    public TwitchBitsEvent(String username, String bits) {
        this.username = username;
        this.bits = bits;
    }

    /*
     * Method that returns the username who cheered.
     *
     * @return {String} username
     */
    public String getUsername() {
        return this.username;
    }

    /*
     * Method that returns the amount of bit the user cheered.
     *
     * @return {String} bits
     */
    public String getBits() {
        return this.bits;
    }
}
