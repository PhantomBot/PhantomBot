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
package tv.phantombot.event.pubsub.moderation;

public class PubSubModerationTimeoutEvent extends PubSubModerationEvent {
    private final String reason;
    private final String time;

    /**
     * Class constructor.
     *
     * @param username
     * @param creator
     * @param message
     * @param time
     */
    public PubSubModerationTimeoutEvent(String username, String creator, String message, String time) {
        super(username, creator, message);

        this.reason = "";
        this.time = time;
    }

    /**
     * Class constructor.
     *
     * @param username
     * @param creator
     * @param message
     * @param reason
     * @param time
     */
    public PubSubModerationTimeoutEvent(String username, String creator, String message, String reason, String time) {
        super(username, creator, message);

        this.reason = reason;
        this.time = time;
    }

    /**
     * Method that returns the reason as to why the user was banned.
     *
     * @return reason
     */
    public String getReason() {
        return this.reason;
    }

    /**
     * Method that returns the length of the timeout.
     *
     * @return time
     */
    public String getTime() {
        return this.time;
    }
}
