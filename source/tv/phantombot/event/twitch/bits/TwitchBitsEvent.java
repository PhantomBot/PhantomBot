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
package tv.phantombot.event.twitch.bits;

import tv.phantombot.event.twitch.TwitchEvent;

public class TwitchBitsEvent extends TwitchEvent {

    private final String username;
    private final String bits;
    private final String message;

    /**
     * Class constructor.
     *
     * @param username
     * @param bits
     * @param message
     */
    public TwitchBitsEvent(String username, String bits, String message) {
        this.username = username;
        this.bits = bits;
        this.message = message;
    }

    /**
     * Method that returns the username who cheered.
     *
     * @return username
     */
    public String getUsername() {
        return this.username;
    }

    /**
     * Method that returns the amount of bit the user cheered.
     *
     * @return bits
     */
    public String getBits() {
        return this.bits;
    }

    /**
     * *
     * Method that returns the message that was sent as part of the Bits tag.
     *
     * @return message
     */
    public String getMessage() {
        return this.message;
    }
}
