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
package tv.phantombot.event.irc.clearchat;

import tv.phantombot.event.irc.IrcEvent;
import tv.phantombot.twitch.irc.TwitchSession;

public class IrcClearmessageEvent extends IrcEvent {

    private final String username;
    private final String message;
    private final String msgId;

    /**
     * Class constructor
     *
     * @param session
     * @param username
     * @param message
     * @param msgId
     */
    public IrcClearmessageEvent(TwitchSession session, String username, String message, String msgId) {
        super(session);

        this.username = username;
        this.message = message;
        this.msgId = msgId;
    }

    /**
     * Method that returns the user who sent the deleted message
     *
     * @return username
     */
    public String getUsername() {
        return this.username;
    }

    /**
     * Method that returns the message that was deleted
     *
     * @return message
     */
    public String getMessage() {
        return this.message;
    }

    /**
     * Method that returns the message id that was deleted
     *
     * @return msgId
     */
    public String getMsgId() {
        return this.msgId;
    }
}
