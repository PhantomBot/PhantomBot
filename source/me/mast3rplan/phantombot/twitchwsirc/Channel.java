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
    //private final String[] users;
    public static Channel channel;
    private Boolean sendMessages = false;
    private String channelName;
    private String botName;

    /*
     * Creates an instance for a channel.
     *
     * @param  channel  Twitch Channel
     */
    public static Channel instance(String channelName, String botName) {
        Channel instance = instances.get(channelName);

        if (instance == null) {
            instance = new Channel(channelName, botName);
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
    private Channel(String channelName, String botName) {
        this.channelName = channelName;
        this.botName = botName;
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
     * Returns the the Channel.
     *
     * @return  Channel  channel.
     */
    public Channel getChannel() {
        return channel;
    }


    /*
     * Adds the user from the users array. When you connect to the channel, Twitch sends a list with all the current users in the channel.
     *
     * @param username 
     */
    /*public void addUser(String username) { // this is addNick in the old jerklib.
        if (!users.containsKey(username)) {
            users.put(username);
        }
    }*/

    /*
     * Removes the user from the users array.
     *
     * @param username 
     */
    /*public void removeUser(String username) {
        users.remove(username);
    }*/

    /*
     * Returs the users to permission.js
     *
     * @return array 
     */
    /*public List<String> getUsers() { // this is .getNicks in the permission.js atm.
        return users;
    }*/

    /*
     * Sends a message to the channel (well, not yet, right now just log...)
     *
     * @param  String  what to say? 
     */
    public void say(String message) {
        com.gmt2001.Console.out.println("WSIRC::Channel::say:(" + message + ")");
    }
}
