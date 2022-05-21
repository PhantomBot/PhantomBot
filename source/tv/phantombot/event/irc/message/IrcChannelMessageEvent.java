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
package tv.phantombot.event.irc.message;

import java.util.Map;
import tv.phantombot.twitch.irc.TwitchSession;

public class IrcChannelMessageEvent extends IrcMessageEvent {

    /**
     * Class constructor.
     *
     * @param session
     * @param  sender
     * @param  message
     */
    public IrcChannelMessageEvent(TwitchSession session, String sender, String message) {
        super(session, sender, message);
    }

    /**
     * Class constructor.
     *
     * @param session
     * @param  sender
     * @param  message
     * @param     tags
     */
    public IrcChannelMessageEvent(TwitchSession session, String sender, String message, Map<String, String> tags) {
        super(session, sender, message, tags);
    }
}
