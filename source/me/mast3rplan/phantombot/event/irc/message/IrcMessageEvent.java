/*
 * Copyright (C) 2017 phantombot.tv
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
package me.mast3rplan.phantombot.event.irc.message;

import java.util.HashMap;
import java.util.Map;
import me.mast3rplan.phantombot.event.irc.IrcEvent;
import me.mast3rplan.phantombot.twitchwsirc.Channel;
import me.mast3rplan.phantombot.twitchwsirc.Session;
import org.apache.commons.lang3.CharUtils;

public abstract class IrcMessageEvent extends IrcEvent {

    private final String sender;
    private final String message;
    private final Map<String, String> tags;
    private final Channel channel;

    protected IrcMessageEvent(Session session, String sender, String message) {
        super(session);
        this.sender = sender;
        this.message = message;
        this.tags = new HashMap<>();
        this.channel = null;
    }

    protected IrcMessageEvent(Session session, String sender, String message, Map<String, String> tags) {
        super(session);
        this.sender = sender;
        this.message = message;
        this.channel = null;

        if (tags == null) {
            this.tags = new HashMap<>();
        } else {
            this.tags = tags;
        }
    }

    protected IrcMessageEvent(Session session, String sender, String message, Map<String, String> tags, Channel channel) {
        super(session);
        this.sender = sender;
        this.message = message;
        this.channel = channel;

        if (tags == null) {
            this.tags = new HashMap<>();
        } else {
            this.tags = tags;
        }
    }

    public String getSender() {
        return sender;
    }

    public String getMessage() {
        return message;
    }

    public Map<String, String> getTags() {
        return tags;
    }

    public int getCapsCount() {
        int count = 0;
        for (int i = 0, l = message.length(); i < l; ++i) {
            if (CharUtils.isAsciiAlphaUpper(message.charAt(i))) {
                ++count;
            }
        }
        return count;
    }

    public Channel getChannel() {
        return channel;
    }
}
