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
package tv.phantombot.wschat.twitch.chat.utils;

public class Message {
    private final String message;
    private final String tags;
    private final boolean hasPriority;

    /*
     * Class constructor.
     *
     * @param {String} message
     */
    public Message(String message) {
        this.message = message;
        this.hasPriority = false;
        this.tags = "";
    }

    /*
     * Class constructor.
     *
     * @param {String} message
     * @param {boolean} hasPriority
     */
    public Message(String message, boolean hasPriority) {
        this.message = message;
        this.hasPriority = hasPriority;
        this.tags = "";
    }
    
    /*
     * Class constructor.
     *
     * @param {String} message
     * @param {boolean} hasPriority
     * @param {String} tags
     */
    public Message(String message, boolean hasPriority, String tags) {
        this.message = message;
        this.hasPriority = hasPriority;
        this.tags = tags;
    }

    /*
     * Method that returns the message.
     *
     * @return {String} message
     */
    public String getMessage() {
        return this.message;
    }

    /*
     * Method that returns if the message has priority.
     *
     * @return {boolean} hasPriority
     */
    public boolean hasPriority() {
        return this.hasPriority;
    }
    
    /*
     * Method that returns our custom tags if any.
     *
     * @return {String} tags
     */
    public String getTags() {
        return this.tags;
    }
}
