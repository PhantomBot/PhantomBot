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
package com.gmt2001.twitch.tmi.processors;

import com.gmt2001.twitch.tmi.TMIMessage;
import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;
import tv.phantombot.cache.UsernameCache;
import tv.phantombot.event.EventBus;
import tv.phantombot.event.command.CommandEvent;
import tv.phantombot.event.irc.channel.IrcChannelUserModeEvent;
import tv.phantombot.event.irc.message.IrcChannelMessageEvent;
import tv.phantombot.event.irc.message.IrcModerationEvent;
import tv.phantombot.event.irc.message.IrcPrivateMessageEvent;
import tv.phantombot.event.twitch.bits.TwitchBitsEvent;

/**
 * Handles the PRIVMSG IRC command and tracks moderators via IRCv3 item.tags()
 *
 * @author gmt2001
 */
public final class PrivMsgTMIProcessor extends AbstractTMIProcessor {

    private final List<String> moderators = new CopyOnWriteArrayList<>();

    public PrivMsgTMIProcessor() {
        super("PRIVMSG");
    }

    @Override
    protected void onMessage(TMIMessage item) {
        String message = item.parameters();

        if (message.charAt(0) == (char) 1 && message.startsWith("ACTION", 1)) {
            message = "/me " + message.substring(7).trim();
        }

        com.gmt2001.Console.out.println(item.nick() + ": " + message);

        com.gmt2001.Console.debug.println("IRCv3 Tags: " + item.tags());

        if (item.tags().containsKey("display-name") && item.tags().containsKey("user-id")) {
            UsernameCache.instance().addUser(item.nick(), item.tags().get("display-name"), item.tags().get("user-id"));
        }

        if (item.tags().containsKey("bits")) {
            EventBus.instance().postAsync(new TwitchBitsEvent(item.nick(), item.tags().get("bits"), message));
        }

        EventBus.instance().postAsync(new IrcModerationEvent(this.session(), item.nick(), message, item.tags()));

        if (item.tags().containsKey("subscriber") && item.tags().get("subscriber").equals("1")) {
            EventBus.instance().postAsync(new IrcPrivateMessageEvent(this.session(), "jtv", "SPECIALUSER " + item.nick() + " subscriber", item.tags()));
        }

        if (!item.nick().equalsIgnoreCase(this.property("user"))) {
            if (item.tags().get("mod").equals("1") || !item.tags().get("user-type").isEmpty()) {
                if (!this.moderators.contains(item.nick())) {
                    EventBus.instance().postAsync(new IrcChannelUserModeEvent(this.session(), item.nick(), "O", true));
                    this.moderators.add(item.nick());
                }
            } else {
                if (this.moderators.contains(item.nick())) {
                    EventBus.instance().postAsync(new IrcChannelUserModeEvent(this.session(), item.nick(), "O", false));
                    this.moderators.remove(item.nick());
                }
            }
        }

        if (message.startsWith("!") && message.indexOf(' ') != 1) {
            int idx = message.indexOf(' ');
            EventBus.instance().postAsync(new CommandEvent(item.nick(), idx > 1 ? message.substring(1, idx) : message.substring(1),
                    idx == -1 ? "" : message.substring(idx + 1), item.tags()));
        }

        EventBus.instance().postAsync(new IrcChannelMessageEvent(this.session(), item.nick(), message, item.tags()));
    }
}
