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

package tv.phantombot.scripts.core;

import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;
import net.engio.mbassy.listener.Handler;
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
    private ConcurrentMap<String, User> users = new ConcurrentHashMap<>();
    
    /**
     * Method that returns this instance.
     * 
     * @return 
     */
    public static Permissions instance() {
        return INSTANCE;
    }
    
    /**
     * Method that gets a user.
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
    private void removeUser(String username) {
        if (hasUser(username)) {
            users.remove(username.toLowerCase());
        }
    }
    
    /**
     * Puts a user in the map.
     * @param username
     * @param user 
     */
    private void putUser(String username, User user) {
        // According to docs, put overwrites the value.
        users.put(username.toLowerCase(), user);
    }
    
    /**
     * Method that adds a user to the map and creates it.
     * 
     * @param username 
     */
    private void addUser(String username) {
        if (!hasUser(username)) {
            // Create the user object.
            User user = new User(username);
            // Add it to the object.
            putUser(username, user);
        }
    }
    
    /**
     * A handler event for IrcChannelUsersUpdateEvent.
     * @param event
     */
    @Handler
    private synchronized void ircChannelUsersUpdateEvent(IrcChannelUsersUpdateEvent event) {
        /*ConcurrentMap<String, User> usersMap = new ConcurrentHashMap<>();
        List<String> usersList = event.getUsers();
        
        // Generate the new user list.
        usersList.forEach((user) -> {
            usersMap.put(user, getUser(user));
        });
        
        // Update the users map.
        this.users = usersMap;*/
    }
    
    /**
     * A handler event for IrcChannelJoinEvent.
     * @param event
     */
    @Handler
    private synchronized void ircChannelJoinEvent(IrcChannelJoinEvent event) {
        addUser(event.getUser());
    }
    
    /**
     * A handler event for IrcChannelLeaveEvent.
     * @param event
     */
    @Handler
    private synchronized void ircChannelLeaveEvent(IrcChannelLeaveEvent event) {
        removeUser(event.getUser());
    }
    
    /**
     * A handler event for IrcChannelUserModeEvent.
     * @param event
     */
    @Handler
    private synchronized void ircChannelUserModeEvent(IrcChannelUserModeEvent event) {
        
    }
    
    /**
     * A handler event for IrcPrivateMessageEvent.
     * @param event
     */
    @Handler
    private synchronized void ircPrivateMessageEvent(IrcPrivateMessageEvent event) {
        
    }
    
    /**
     * A handler event for IrcChannelMessageEvent.
     * @param event
     */
    @Handler
    private synchronized void ircChannelMessageEvent(IrcChannelMessageEvent event) {
        addUser(event.getSender());
    }
}
