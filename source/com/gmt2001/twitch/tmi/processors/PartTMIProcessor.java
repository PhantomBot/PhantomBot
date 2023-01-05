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
package com.gmt2001.twitch.tmi.processors;

import com.gmt2001.twitch.tmi.TMIMessage;
import tv.phantombot.event.EventBus;
import tv.phantombot.event.irc.channel.IrcChannelLeaveEvent;

/**
 * Handles the PART IRC command
 *
 * @author gmt2001
 */
public final class PartTMIProcessor extends AbstractTMIProcessor {

    public PartTMIProcessor() {
        super("PART");
    }

    @Override
    protected void onMessage(TMIMessage item) {
        if (item.nick().equalsIgnoreCase(this.user())) {
            com.gmt2001.Console.out.println("Left #" + this.property("channel").toLowerCase());
        }

        EventBus.instance().postAsync(new IrcChannelLeaveEvent(this.session(), item.nick()));
        com.gmt2001.Console.debug.println("User Left Channel [" + item.nick() + " -> #" + this.property("channel").toLowerCase() + "]");
    }

}
