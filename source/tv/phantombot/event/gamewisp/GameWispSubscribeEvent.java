/*
 * Copyright (C) 2016-2017 phantombot.tv
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
package tv.phantombot.event.gamewisp;

public class GameWispSubscribeEvent extends GameWispEvent {
    private final String username;
    private final int tier;

    /*
     * Class constructor
     *
     * @param {String} username
     * @param {int}    tier
     */
    public GameWispSubscribeEvent(String username, int tier) {
        this.username = username;
        this.tier = tier;
    }

    /*
     * Method that returns the subscriber's name.
     *
     * @return {String}
     */
    public String getUsername() {
        return this.username;
    }

    /*
     * Method that returns the user's tier.
     *
     * @return {int}
     */
    public int getTier() {
        return this.tier;
    }
}
