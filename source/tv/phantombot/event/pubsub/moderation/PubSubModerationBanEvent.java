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
package tv.phantombot.event.pubsub.moderation;

public class PubSubModerationBanEvent extends PubSubModerationEvent {
    private final String reason;

    /*
     * Class constructor.
     *
     * @param {String} username
     * @param {String} creator
     * @param {String} message
     * @param {String} reason
     */
    public PubSubModerationBanEvent(String username, String creator, String message, String reason) {
        super(username, creator, message);

        this.reason = reason;
    }

    /*
     * Method that returns the reason as to why the user was banned.
     *
     * @return {String} reason
     */
    public String getReason() {
        return this.reason;
    }
}
