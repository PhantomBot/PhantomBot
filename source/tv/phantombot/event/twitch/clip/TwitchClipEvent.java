/*
 * Copyright (C) 2016-2020 phantom.bot
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
package tv.phantombot.event.twitch.clip;

import tv.phantombot.event.twitch.TwitchEvent;

import org.json.JSONObject;

public class TwitchClipEvent extends TwitchEvent {
    private final String clipURL;
    private final String creator;
    private final String clipTitle;
    private final JSONObject thumbnailObj;

    /**
     * Class constructor.
     *
     * @param {String}     clipURL
     * @param {String}     creator
     * @param {String}     clipTitle
     * @param {JSONObject} thumbnailObj
     */
    public TwitchClipEvent(String clipURL, String creator, String clipTitle, JSONObject thumbnailObj) {
        this.clipURL = clipURL;
        this.creator = creator;
        this.clipTitle = clipTitle;
        this.thumbnailObj = thumbnailObj;
    }

    /**
     * Method that returns the clip URL.
     *
     * @return {String} clipURL
     */
    public String getClipURL() {
        return this.clipURL;
    }

    /**
     * Method that returns the clip creator.
     *
     * @return {String} creator
     */
    public String getCreator() {
        return this.creator;
    }

    /**
     * Method that returns the clip title.
     *
     * @return {String} clipTitle
     */
    public String getClipTitle() {
        return this.clipTitle;
    }

    /**
     * Method that returns the object of thumnails.
     *
     * @return {JSONObject} thumbnailObj
     */
    public JSONObject getThumbnailObject() {
        return this.thumbnailObj;
    }
}
