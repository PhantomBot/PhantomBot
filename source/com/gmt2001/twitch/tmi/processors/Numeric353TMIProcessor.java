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
import tv.phantombot.event.irc.channel.IrcChannelJoinEvent;

/**
 * Handles the numeric 353 IRC command
 *
 * @author gmt2001
 */
public class Numeric353TMIProcessor extends AbstractTMIProcessor {

    public Numeric353TMIProcessor() {
        super("353");
    }

    @Override
    protected void onMessage(TMIMessage item) {
        String[] nicks = item.parameters().split(" ");

        for (String nick : nicks) {
            if (!nick.equalsIgnoreCase(this.user())) {
                EventBus.instance().postAsync(new IrcChannelJoinEvent(this.session(), nick));
                com.gmt2001.Console.debug.println("User Joined Channel [" + nick + " -> #" + this.property("channel").toLowerCase() + "]");
            }
        }
    }

}
