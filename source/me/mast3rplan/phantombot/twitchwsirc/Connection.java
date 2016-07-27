/*
 * Copyright (C) 2016 www.phantombot.net
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

/*
 * Twitch WS-IRC Client
 * @author: scaniatv
 */
package me.mast3rplan.phantombot.twitchwsirc;

import me.mast3rplan.phantombot.twitchwsirc.Channel;
import me.mast3rplan.phantombot.twitchwsirc.Session;
import me.mast3rplan.phantombot.twitchwsirc.TwitchWSIRC;
import me.mast3rplan.phantombot.event.EventBus;

import com.google.common.collect.Maps;

import java.util.HashMap;
import java.util.Map;
import java.util.Map.Entry;

import java.net.URI;

public class Connection {

	private static final Map<String, Connection> instances = Maps.newHashMap();
    private TwitchWSIRC twitchWSIRC;
    private Channel channel;
    private String channelName;
    private String botName;
    private String oAuth;
    private EventBus eventBus;
    private Session session;

    public static Connection instance(Channel channel, String channelName, String botName, String oAuth, Session session, EventBus eventBus) {
        Connection instance = instances.get(botName);
        if (instance == null) {
            instance = new Connection(channel, channelName, botName, oAuth, session, eventBus);
            instances.put(botName, instance);
            return null;
        }
        return null;
    }

    private Connection(Channel channel, String channelName, String botName, String oAuth, Session session, EventBus eventBus) {
        this.channelName = channelName;
        this.botName = botName;
        this.oAuth = oAuth;
        this.eventBus = eventBus;
        this.channel = channel;
        this.session = session;

        try {
            this.twitchWSIRC = TwitchWSIRC.instance(new URI("wss://irc-ws.chat.twitch.tv"), channelName, botName, oAuth, channel, session, eventBus);
            twitchWSIRC.connectWSS();
        } catch (Exception ex) {
            com.gmt2001.Console.err.println("TwitchWSIRC URI Failed: " + ex.getMessage());
        }
    }
}