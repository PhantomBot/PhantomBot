/*
 * Copyright (C) 2015 www.phantombot.net
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
package me.mast3rplan.phantombot;

import java.lang.Integer;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import me.mast3rplan.phantombot.event.EventBus;
import me.mast3rplan.phantombot.event.twitch.host.TwitchHostedEvent;
import me.mast3rplan.phantombot.event.twitch.host.TwitchHostsInitializedEvent;
import me.mast3rplan.phantombot.event.twitch.host.TwitchUnhostedEvent;

import me.mast3rplan.phantombot.jerklib.Channel;
import me.mast3rplan.phantombot.jerklib.ModeAdjustment;
import me.mast3rplan.phantombot.jerklib.Session;
import me.mast3rplan.phantombot.jerklib.events.*;
import me.mast3rplan.phantombot.jerklib.listeners.IRCEventListener;

/*
 * Only looks for PMs from jtv regarding being hosted.
 */
public class IrcHostHandler implements IRCEventListener {

    private final ArrayList<String> mods = new ArrayList<>();

    @Override
    public void receiveEvent(IRCEvent event) {
        if (PhantomBot.instance().isExiting()) {
            return;
        }

        EventBus eventBus = EventBus.instance();
        Session session = event.getSession();

        switch (event.getType()) {

        case CONNECT_COMPLETE:
            com.gmt2001.Console.out.println("Host Monitoring Connected to IRC " + session.getNick() + "@" + session.getConnectedHostName());
            EventBus.instance().post(new TwitchHostsInitializedEvent());
            break;

        case PRIVATE_MESSAGE:
            MessageEvent pmessageEvent = (MessageEvent) event;
            String pusername = pmessageEvent.getNick();
            String pmessage = pmessageEvent.getMessage();

            if (pusername.equalsIgnoreCase("jtv")) {
                /* hoster is now hosting you for XX viewers. */
                if (pmessage.contains("is now hosting you for")) {
                    String[] messageSplit = pmessage.split(" ");
                    String hoster = messageSplit[0];
                    int users = Integer.parseInt(messageSplit[6]);
                    com.gmt2001.Console.out.println("Detected Host from " + hoster + " for " + users + " users");
                    EventBus.instance().post(new TwitchHostedEvent(hoster, users));
                }
            }
            break;
        }
    }
}
