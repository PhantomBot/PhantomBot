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

import tv.phantombot.event.pubsub.PubSubEvent;

public abstract class PubSubModerationEvent extends PubSubEvent {
    private final String username;
    private final String creator;
    private final String message;

    /**
     * Abstract constructor.
     *
     * @param username
     * @param creator
     * @param message
     */
    protected PubSubModerationEvent(String username, String creator, String message) {
        this.username = username;
        this.creator = creator;
        this.message = message;
    }

    /**
     * Method that returns the username that the even was triggered for.
     *
     * @return username
     */
    public String getUsername() {
        return this.username;
    }

    /**
     * Method that returns the creator for the event.
     *
     * @return creator
     */
    public String getCreator() {
        return this.creator;
    }

    /**
     * Method that returns the message of the creator if one is given.
     *
     * @return message
     */
    public String getMessage() {
        return this.message;
    }
}
