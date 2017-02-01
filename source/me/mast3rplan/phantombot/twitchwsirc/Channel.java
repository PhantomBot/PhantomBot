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

/*
 * Twitch WS-IRC Client
 * @author: illusionaryone
 */
package me.mast3rplan.phantombot.twitchwsirc;
import me.mast3rplan.phantombot.twitchwsirc.Session;
import me.mast3rplan.phantombot.event.EventBus;

import org.java_websocket.WebSocket;
import com.google.common.collect.Maps;

import java.util.HashMap;
import java.util.Map;
import java.util.Map.Entry;

import java.net.URI;

public class Channel {

    private static final Map<String, Channel> instances = Maps.newHashMap();
    public static Channel channel;
    private TwitchWSIRC twitchWSIRC;
    private EventBus eventBus;
    private String channelName;
    private String botName;
    private String oAuth;
    private Session session;

    /*
     * Creates an instance for a channel.
     *
     * @param  channel  Twitch Channel
     */
    public static Channel instance(String channelName, String botName, String oAuth, EventBus eventBus) {
        Channel instance = instances.get(channelName);
        if (instance == null) {
            instance = new Channel(channelName, botName, oAuth, eventBus);
            instances.put(channelName, instance);
            channel = instance;
            return instance;
        }
        return instance;
    }

    /*
     * Constructor for the Channel object.
     *
     * @param  channelName  Twitch Channel
     * @param  webSocket    WebSocket object for writing data to
     */
    private Channel(String channelName, String botName, String oAuth, EventBus eventBus) {
        this.channelName = channelName;
        this.eventBus = eventBus;
        this.botName = botName;
        this.oAuth = oAuth;

        session = Session.instance(this, channelName, botName, oAuth, eventBus);
    }

    /*
     * Returns the name of the Channel.
     *
     * @return  String  Name of the channel.
     */
    public String getName() {
        return channelName;
    }

    /*
     * Returns the the Channel.
     *
     * @return  Channel  channel.
     */
    public Channel getChannel() {
        return channel;
    }
}
