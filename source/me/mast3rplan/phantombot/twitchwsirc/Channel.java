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

import org.java_websocket.WebSocket;
import com.google.common.collect.Maps;

import java.util.HashMap;
import java.util.Map;
import java.util.Map.Entry;

import java.net.URI;

public class Channel {

    private static final Map<String, Channel> instances = Maps.newHashMap();
    private WebSocket webSocket;
    private Boolean sendMessages = false;
    private String channelName;

    /*
     * Creates an instance for a channel.
     *
     * @param  channelName  Twitch Channel
     * @param  webSocket    WebSocket object for writing data to
     */
    public static Channel instance(String channelName, WebSocket webSocket) {
        Channel instance = instances.get(channelName);
        if (instance == null) {
            instance = new Channel(channelName, webSocket);
            instances.put(channelName, instance);
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
    private Channel(String channelName, WebSocket webSocket) {
        this.channelName = channelName;
        this.webSocket = webSocket;
    }

    /*
     * Set if messages are allowed to be sent to Twitch WSIRC.
     *
     * @param  Boolean  Are messages allowed to be sent?
     */
    public void setAllowSendMessages(Boolean sendMessages) {
        this.sendMessages = sendMessages;
    }

    /*
     * Can messages be sent to WSIRC?
     *
     * @return  Boolean  Are messages allowed to be sent?
     */
    public Boolean getAllowSendMessages() {
        return sendMessages;
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
     * Sends a message to the channel (well, not yet, right now just log...)
     */
    public void say(String message) {
        com.gmt2001.Console.out.println("WSIRC::Channel::say(" + message + ")");
    }
}
