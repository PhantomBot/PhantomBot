/*
 * Copyright (C) 2016-2018 phantombot.tv
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

package tv.phantombot.scripts.core;

import net.engio.mbassy.listener.Handler;

import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;

import tv.phantombot.event.Listener;
import tv.phantombot.event.irc.channel.IrcChannelJoinEvent;
import tv.phantombot.event.irc.channel.IrcChannelLeaveEvent;
import tv.phantombot.event.irc.channel.IrcChannelUserModeEvent;
import tv.phantombot.event.irc.channel.IrcChannelUsersUpdateEvent;
import tv.phantombot.event.irc.message.IrcChannelMessageEvent;
import tv.phantombot.event.irc.message.IrcPrivateMessageEvent;


/**
 * Class that handles user permissions for PhantomBot.
 * 
 * @author ScaniaTV
 */
public class Permissions implements Listener {
    public static final Permissions INSTANCE = new Permissions();
    private final ConcurrentMap<String, User> users = new ConcurrentHashMap();
    
    /**
     * Method that returns this instance.
     * 
     * @return 
     */
    public static Permissions instance() {
        return INSTANCE;
    }
    
    /**
     * Method that removes a user from the cache.
     * 
     * @param username
     * @return 
     */
    public User getUser(String username) {
        User user = users.get(username.toLowerCase());
        
        // If the user doesn't exists, create new one.
        if (user == null) {
            // Create the user object.
            user = new User(username);
            // Add it to the object,
            users.put(user.getUsername(), user);
        }
        
        return user;
    }
    
    /**
     * Method that checks if the user is in the cache.
     * 
     * @param username
     * @return 
     */
    public boolean hasUser(String username) {
        return users.containsKey(username.toLowerCase());
    }
    
    /**
     * Method that removes a user if he doesn't exist.
     * 
     * @param username 
     */
    public void removeUser(String username) {
        username = username.toLowerCase();
        
        if (hasUser(username)) {
            users.remove(username);
        }
    }
    
    // A handler event for IrcChannelUsersUpdateEvent.
    @Handler
    private void ircChannelUsersUpdateEvent(IrcChannelUsersUpdateEvent event) {
        
    }
    
    // A handler event for IrcChannelJoinEvent.
    @Handler
    private void ircChannelJoinEvent(IrcChannelJoinEvent event) {
        
    }
    
    // A handler event for IrcChannelLeaveEvent.
    @Handler
    private void ircChannelLeaveEvent(IrcChannelLeaveEvent event) {
        
    }
    
    // A handler event for IrcChannelUserModeEvent.
    @Handler
    private void ircChannelUserModeEvent(IrcChannelUserModeEvent event) {
        
    }
    
    // A handler event for IrcPrivateMessageEvent.
    @Handler
    private void ircPrivateMessageEvent(IrcPrivateMessageEvent event) {
        
    }
    
    // A handler event for IrcChannelMessageEvent.
    @Handler
    private void ircChannelMessageEvent(IrcChannelMessageEvent event) {
        
    }
}
