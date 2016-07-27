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

/*
 * Twitch WS-IRC Client
 * @author: illusionaryone
 */
package me.mast3rplan.phantombot.twitchwsirc;

import me.mast3rplan.phantombot.twitchwsirc.Channel;
import me.mast3rplan.phantombot.twitchwsirc.TwitchWSIRC;

import org.java_websocket.WebSocket;
import com.google.common.collect.Maps;

import java.util.HashMap;
import java.util.Map;
import java.util.Map.Entry;

import java.net.URI;

public class Session {

    private static final Map<String, Session> instances = Maps.newHashMap();
    public static Session session;
    private TwitchWSIRC twitchWSIRC;
    private Channel channel;
    private String channelName;
    private String botName;
    private String oAuth;

    /*
     * Creates an instance for a Session
     *
     * @param  botName  The name of the PhantomBot instance
     */
    public static Session instance(Channel channel, String channelName, String botName, String oAuth) {
        Session instance = instances.get(botName);
        if (instance == null) {
            instance = new Session(channel, channelName, botName, oAuth);
            instances.put(botName, instance);
            session = instance;
            return instance;
        }
        return instance;
    }

    /*
     * Constructor for the Session object.
     *
     * @param  channelName  Twitch Channel
     * @param  botName      Botname and name of the instance
     * @param  oAuth        OAUTH login
     */
    private Session(Channel channel, String channelName, String botName, String oAuth) {
        this.channelName = channelName;
        this.botName = botName;
        this.oAuth = oAuth;
        this.channel = channel;
    }

    /*
     * Returns the IRC Nick (login) for this Session.
     *
     * @return  String  The name of the PhantomBot instance, also the Twitch login ID.
     */
    public String getNick() {
        return this.botName;
    }

    /*
     *
     * @return  Session  Returns the session
     */
    public Session getSession() {
        return session;
    }

    /* Returns the Channel object related to this Session.
     *
     * @return  Channel      The related Channel object.
     */
    public Channel getChannel(String dummy) {
        return this.channel; 
    }
}
