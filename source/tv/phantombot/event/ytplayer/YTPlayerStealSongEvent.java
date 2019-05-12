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
package tv.phantombot.event.ytplayer;

public class YTPlayerStealSongEvent extends YTPlayerEvent {
    private final String youTubeID;
    private final String requester;

    /**
     * Class constructor.
     */
    public YTPlayerStealSongEvent() {
        this.youTubeID = "";
        this.requester = "";
    }

    /**
     * Class constructor.
     *
     * @param {String} youTubeID
     * @param {String} requester
     */
    public YTPlayerStealSongEvent(String youTubeID, String requester) {
        this.youTubeID = youTubeID;
        this.requester = requester;
    }

    /**
     * Method that returns the YouTube ID.
     *
     * @return {String} youTubeID
     */
    public String getYouTubeID() {
        return this.youTubeID;
    }

    /**
     * Method that returns requester.
     *
     * @return {String} requester
     */
    public String getRequester() {
        return this.requester;
    }
}
