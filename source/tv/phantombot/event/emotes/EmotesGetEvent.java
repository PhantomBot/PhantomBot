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
package tv.phantombot.event.emotes;

import org.json.JSONObject;

public class EmotesGetEvent extends EmotesEvent {
    private final JSONObject twitchEmotes;
    private final JSONObject bttvEmotes;
    private final JSONObject bttvLocalEmotes;
    private final JSONObject ffzEmotes;
    private final JSONObject ffzLocalEmotes;

    /**
     * Class constructor
     *
     * @param {JSONObject} twitchEmotes
     * @param {JSONObject} bttvEmotes
     * @param {JSONObject} bttvLocalEmotes
     * @param {JSONObject} ffzEmotes
     * @param {JSONObject} ffzLocalEmotes
     */
    public EmotesGetEvent(JSONObject twitchEmotes, JSONObject bttvEmotes, JSONObject bttvLocalEmotes, JSONObject ffzEmotes, JSONObject ffzLocalEmotes) {
        this.twitchEmotes = twitchEmotes;
        this.bttvEmotes = bttvEmotes;
        this.bttvLocalEmotes = bttvLocalEmotes;
        this.ffzEmotes = ffzEmotes;
        this.ffzLocalEmotes = ffzLocalEmotes;
    }

    /**
     * Method that returns the JSONObject emotes from Twitch.
     *
     * @param {JSONObject} twitchEmotes
     */
    public JSONObject getTwitchEmotes() {
        return this.twitchEmotes;
    }

    /**
     * Method that returns the JSONObject emotes from bttv.
     *
     * @param {JSONObject} bttvEmotes
     */
    public JSONObject getBttvEmotes() {
        return this.bttvEmotes;
    }

    /**
     * Method that returns the JSONObject emotes from bttv local emotes.
     *
     * @param {JSONObject} bttvLocalEmotes
     */
    public JSONObject getBttvLocalEmotes() {
        return this.bttvLocalEmotes;
    }

    /**
     * Method that returns the JSONObject emotes from ffz.
     *
     * @param {JSONObject} ffzEmotes
     */
    public JSONObject getFfzEmotes() {
        return this.ffzEmotes;
    }

    /**
     * Method that returns the JSONObject emotes from ffz local emotes.
     *
     * @param {JSONObject} ffzLocalEmotes
     */
    public JSONObject getFfzLocalEmotes() {
        return this.ffzLocalEmotes;
    }
}
