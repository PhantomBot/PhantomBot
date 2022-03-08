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
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import net.engio.mbassy.listener.Handler;
import tv.phantombot.PhantomBot;
import tv.phantombot.event.Listener;
import tv.phantombot.event.irc.message.IrcModerationEvent;
import tv.phantombot.scripts.core.ModerationUtil.ChatMessage;
import tv.phantombot.twitch.irc.TwitchSession;

/**
 * Handles checking each message.
 * 
 * @author ScaniaTV
 */
public class Moderation extends ModerationUtil implements Listener {
    private static final Moderation INSTANCE = new Moderation();
    private final ScheduledExecutorService chatCacheHandler = Executors.newSingleThreadScheduledExecutor();
    public final ConcurrentHashMap<String, Object> settings = new ConcurrentHashMap<>();
    public final CopyOnWriteArrayList<ChatMessage> chatCache = new CopyOnWriteArrayList<>();
    private long lastPunishmentMessage = 0;
    
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
                settings.put(key.substring(5), Boolean.parseBoolean(value));
            } else if (key.startsWith("int_")) {
                // Int.
                settings.put(key.substring(4), Integer.parseInt(value));
            } else if (key.startsWith("float_")) {
                // Float.
                settings.put(key.substring(6), Float.parseFloat(value));
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
     * Method that loads all settings and blacklists and whitelists.
     */
    public void loadSettings() {
        // Handle loading settings, and the blacklist/whitelist.
    }
    
    /**
     * Method that gets the setting for a moderation filter.
     * 
     * @param key
     * @param defaultValue
     * @return 
     */
    private Object getSetting(String key, Object defaultValue) {
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
     * Method that either sends a timeout, ban, delete or warning on a user.
     * 
     * @param type
     * @param username
     * @param reason
     * @param filterType
     * @param session 
     */
    private void punishUser(FilterType type, String username, String reason, FilterType filterType, TwitchSession session) {
        
    }
    
    /**
     * Method that deletes a message from a user.
     * 
     * @param username - The user being punished.
     * @param message - The message said in chat to the user.
     * @param messageID - The ID of the message.
     * @param filterType - The type of filter applied to the user.
     * @param punishmentType - The type of punishment being applied to the user.
     * @param session  - The Twitch session to send messages.
     */
    private void deleteUser(String username, String message, String messageID, FilterType filterType, PunishmentType punishmentType, TwitchSession session) {
        session.sayNow(".delete " + messageID);
        sendPunishMessage(username, message, filterType, punishmentType, session);
    }
    
    /**
     * Method that sends a timeout on the user.
     * 
     * @param username - The user being punished.
     * @param message - The message said in chat to the user.
     * @param reason - The reason for the timeout, this is shown with the ban reason message from Twitch.
     * @param punishmentType - The type of punishment being applied to the user.
     * @param seconds - How long the timeout will last on the user.
     * @param filterType - The type of filter applied to the user.
     * @param session - The Twitch session to send messages.
     */
    private void timeoutUser(String username, String message, String reason, int seconds, FilterType filterType, PunishmentType punishmentType, TwitchSession session) {
        session.sayNow(".timeout " + username + " " + seconds + " " + reason);
        sendPunishMessage(username, message, filterType, punishmentType, session);
    }
    
    /**
     * Method that bans a user.
     * 
     * @param username - The user being punished.
     * @param message - The message said in chat to the user.
     * @param reason - The reason for the timeout, this is shown with the ban reason message from Twitch.
     * @param filterType - The type of filter applied to the user.
     * @param punishmentType - The type of punishment being applied to the user.
     * @param session - The Twitch session to send messages.
     */
    private void banUser(String username, String message, String reason, FilterType filterType,  PunishmentType punishmentType, TwitchSession session) {
        session.sayNow(".ban " + username + " " + reason);
        sendPunishMessage(username, message, filterType, punishmentType, session);
    }
    
    /**
     * Method that sends the message to chat.
     * 
     * @param username - The user being punished.
     * @param message - The message said in chat to the user.
     * @param filterType - The type of filter applied to the user.
     * @param punishmentType  - The type of punishment being applied to the user.
     * @param session - The Twitch session to send messages.
     */
    private void sendPunishMessage(String username, String message, FilterType filterType, PunishmentType punishmentType, TwitchSession session) {
        long currentTime = System.currentTimeMillis();
        
        if (!(boolean)getSetting(filterType.name() + "IsSilent", false) && (currentTime - lastPunishmentMessage) <= (long)getSetting("PunishmentMessageTimeout", 5000)) {
            message = message.replace("(username)", username);
        
            switch (punishmentType) {
                case WARNING:
                    message = message.replace("(punishment)", (String)getSetting("warning_tag", "(warning)"));
                    break;
                case PURGE:
                    message = message.replace("(punishment)", (String)getSetting("purged_tag", "(purged)"));
                    break;
                case TIMEOUT:
                    message = message.replace("(punishment)", (String)getSetting("timeout_tag", "(timeout)"));
                    break;
                case BAN:
                    message = message.replace("(punishment)", (String)getSetting("banned_tag", "(banned)"));
                    break;
            }
            
            // Send the message.
            session.sayNow(message);
            // Set when the last message was sent.
            lastPunishmentMessage = currentTime;
        }
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
