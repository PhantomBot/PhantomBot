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
package tv.phantombot.event.irc.message;

import java.util.HashMap;
import java.util.Map;

import tv.phantombot.event.irc.IrcEvent;

import tv.phantombot.twitch.irc.TwitchSession;

public abstract class IrcMessageEvent extends IrcEvent {
    private final String sender;
    private final String message;
    private final Map<String, String> tags;

    /**
     * Class constructor.
     *
     * @param {TwitchSession} session
     * @param {String}  sender
     * @param {String}  message
     */
    protected IrcMessageEvent(TwitchSession session, String sender, String message) {
        super(session);

        this.sender = sender;
        this.message = message;
        this.tags = new HashMap<String, String>();
    }

    /**
     * Class constructor.
     *
     * @param {TwitchSession} session
     * @param {String}  sender
     * @param {String}  message
     * @param {Map}     tags
     */
    protected IrcMessageEvent(TwitchSession session, String sender, String message, Map<String, String> tags) {
        super(session);

        this.sender = sender;
        this.message = message;
        this.tags = (tags == null ? new HashMap<String, String>() : tags);
    }

    /**
     * Method that returns the sender.
     *
     * @return {String} sender
     */
    public String getSender() {
        return this.sender;
    }

    /**
     * Method that returns the message.
     *
     * @return {String} sender
     */
    public String getMessage() {
        return this.message;
    }

    /**
     * Method that returns the IRCv3 tags.
     *
     * @return {Map} tags
     */
    public Map<String, String> getTags() {
        return this.tags;
    }
}
