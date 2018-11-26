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
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

import tv.phantombot.PhantomBot;
import tv.phantombot.event.Listener;
import tv.phantombot.event.irc.message.IrcModerationEvent;
import tv.phantombot.scripts.core.ModerationUtil.ChatMessage;

/**
 * This system has a lot of repeating code, mostly because when matching spam, 
 * once we hit the limit, we no longer need to keep matching, so we return true.
 * This doesn't allow us to make functions to get "totals" of things and reuse them.
 * 
 * @author ScaniaTV
 */
public class Moderation extends ModerationUtil implements Listener {
    private static final Moderation INSTANCE = new Moderation();
    private final ScheduledExecutorService chatCacheHandler = Executors.newSingleThreadScheduledExecutor();
    public final ConcurrentHashMap<String, Object> settings = new ConcurrentHashMap<>();
    public final CopyOnWriteArrayList<ChatMessage> chatCache = new CopyOnWriteArrayList<>();
    
    /**
     * Class constructor.
     */
    public Moderation() {
        //chatCacheHandler.schedule(this::cleanChatCache, 60, TimeUnit.SECONDS);
        
        // Load all settings from the DB.
        /*String[] keys = PhantomBot.instance().getDataStore().GetKeyList("chatModerator_Beta", "");
        for (String key : keys) {
            String value = PhantomBot.instance().getDataStore().get("chatModerator_Beta", key);
            
            if (key.startsWith("bool_")) {
                // boolean
                settings.put(key, Boolean.parseBoolean(value));
            } else if (key.startsWith("int_")) {
                // Int.
                settings.put(key, Integer.parseInt(value));
            } else if (key.startsWith("float_")) {
                // Float.
                settings.put(key, Float.parseFloat(value));
            } else {
                // String.
                settings.put(key, value);
            }
        }*/
        
        settings.put("float_maxCapsPercent", Float.parseFloat("0.10"));
    }
    
    /**
     * Method that returns this instance.
     * 
     * @return 
     */
    public static Moderation instance() {
        return INSTANCE;
    }
    
    /**
     * Method that gets the setting for a moderation filter.
     * 
     * @param key
     * @param defaultValue
     * @return 
     */
    private Object getSetting(String key, String defaultValue) {
        Object returnValue = defaultValue;
        
        if (settings.containsKey(key)) {
            returnValue = settings.get(key);
        }
        
        return returnValue;
    }
    
    /**
     * Method that gets chat messages and saves them.
     * 
     * @param event 
     */
    @Handler
    public void onIrcModerationMessage(IrcModerationEvent event) {
        /*chatCache.add(new ChatMessage(event.getSender(), event.getMessage()));
        
        if (hasURL(event.getMessage(), true, false)) {
            event.getSession().sayNow(".timeout " + event.getSender() + " 10");
            return;
        }
        if (hasSpecialLetters(event.getMessage(), (float)0.10)) {
            event.getSession().sayNow(".timeout " + event.getSender() + " 10");
            return;
        }
        if (hasMaximumCaps(event.getMessage(), 10, (float)settings.get("float_maxCapsPercent"), event.getTags().get("emotes"))) {
            event.getSession().sayNow(".timeout " + event.getSender() + " 10");
        }*/
    }
    
    /**
     * Method that handles clearing the cache.
     */
    private void cleanChatCache() {
        int maxChatCacheSize = PhantomBot.instance().getDataStore().GetInteger("chatModeration", "", "maxChatCacheSize");
        int keepMessageTime = (PhantomBot.instance().getDataStore().GetInteger("chatModeration", "", "oneManSpamKeepTime") * 1000);
        long currentTime = System.currentTimeMillis();
        
        for (int i = (chatCache.size() - 1); i >= 0; i--) {
            if (i > maxChatCacheSize || (currentTime - chatCache.get(i).getTime()) < keepMessageTime) {
                chatCache.remove(i);
            } else {
                // Break once the conditions don't match anymore
                // No need to keep looping for nothing.
                break;
            }
        }
    }
}
