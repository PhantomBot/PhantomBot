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
package tv.phantombot.event.irc.message;

import java.util.Map;

import com.gmt2001.twitch.tmi.TMIMessage;

import tv.phantombot.twitch.irc.TwitchSession;

public class IrcChannelMessageEvent extends IrcMessageEvent {
    private final TMIMessage tmimsg;

    /**
     * Class constructor.
     *
     * @param session
     * @param sender
     * @param message
     */
    public IrcChannelMessageEvent(TwitchSession session, String sender, String message) {
        this(session, sender, message, null);
    }

    /**
     * Class constructor.
     *
     * @param session
     * @param sender
     * @param message
     * @param tags
     */
    public IrcChannelMessageEvent(TwitchSession session, String sender, String message, Map<String, String> tags) {
        this(session, sender, message, tags, null);
    }

    /**
     * Class constructor.
     *
     * @param session
     * @param sender
     * @param message
     * @param tags
     */
    public IrcChannelMessageEvent(TwitchSession session, String sender, String message, Map<String, String> tags, TMIMessage tmimsg) {
        super(session, sender, message, tags);
        this.tmimsg = tmimsg;
    }

    /**
     * The raw {@link TMIMessage} object
     *
     * @return
     */
    public TMIMessage tmimsg() {
        return this.tmimsg;
    }
}
