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

import java.util.Map;
import org.json.JSONException;
import org.json.JSONObject;
import tv.phantombot.PhantomBot;
import tv.phantombot.cache.UsernameCache;

/**
 * Class that stores a Twitch user. Each user gets their own class.
 * This will mostly all be stored in an array.
 * Some information in class might be blank, 
 * since we can't always get all the information for all users.
 * When the blank information is needed, we will call our cache/API.
 * 
 * @author ScaniaTV
 */
public final class User {
    // The username of the user.
    private final String userName;
    // The display name of our User.
    private String displayName = "";
    // The ID from Twitch for this user.
    private String userID = ""; 
    // The date the user was created at.
    private String createdAt = "";
    // The logo URL for the user.
    private String logoUrl = "";
    // The type of user, either: user, staff, admin, global_mod
    private String userType = "";
    // Set's the group ID for the user.
    private int groupID = -1;
    // If the user is the bot owner.
    private boolean isOwner = false;
    // If the user is a bot admin.
    private boolean isAdministrator = false;
    // If the user is a moderator.
    private boolean isModerator = false;
    // If the user is a subscriber.
    private boolean isSubscriber = false;
    // If the user is a donator.
    private boolean isDonator = false;
    // If the user is a VIP.
    private boolean isVIP = false;
    // If the user is a bot regular.
    private boolean isRegular = false;
    
    /**
     * Class constructor.
     * 
     * @param userName The name of the user in lowercase.
     */
    public User(String userName) {
        this.userName = userName.toLowerCase();
    }
    
    /**
     * Class constructor.
     * 
     * @param userName The name of the user in lowercase.
     * @param groupID The group ID of the user.
     */
    public User(String userName, int groupID) {
        this.userName = userName.toLowerCase();
        this.groupID = groupID;
        
        this.updateUserStatus(groupID);
    }
    
    /**
     * Class constructor.
     * 
     * @param userName
     * @param displayName
     * @param userID 
     */
    public User(String userName, String displayName, String userID) {
        this.userName = userName.toLowerCase();
        this.displayName = sanitizeDisplayName(displayName);
        this.userID = userID;
    }
    
    /**
     * Class constructor.
     * 
     * @param userName
     * @param displayName
     * @param userID 
     * @param tags
     */
    public User(String userName, String displayName, String userID, Map<String, String> tags) {
        this.userName = userName.toLowerCase();
        this.displayName = sanitizeDisplayName(displayName);
        this.userID = userID;
    }
    
    /**
     * Method that gets the name of the user.
     * 
     * @return 
     */
    public String getUsername() {
        return userName;
    }
    
    /**
     * Method that gets the display name of the user.
     * 
     * @return 
     */
    public String getDisplayName() {
        // Build the object if needed.
        build(false);
        return displayName;
    }
    
    /**
     * Method that sets the user's display name.
     * 
     * @param displayName 
     */
    public void setDisplayName(String displayName) {
        this.displayName = sanitizeDisplayName(displayName);
    }
    
    /**
     * Method that gets the ID of the user.
     * 
     * @return 
     */
    public String getID() {
        // Build the object if needed.
        build(false);
        return userID;
    }
    
    /**
     * Method that sets the user's ID.
     * 
     * @param userID 
     */
    public void setID(String userID) {
        this.userID = userID;
    }
    
    /**
     * Method that gets the user type.
     * 
     * @return 
     */
    public String getType() {
        // Build the object if needed.
        build(true);
        return userType;
    }
    
    /**
     * Method that sets the user's type.
     * 
     * @param userType
     */
    public void setType(String userType) {
        this.userType = userType;
    }
    
    /**
     * Method that gets when the user was created.
     * 
     * @return 
     */
    public String getCreatedAt() {
        // Build the object if needed.
        build(true);
        return createdAt;
    }
    
    /**
     * Method that sets the user's created at date.
     * 
     * @param createdAt 
     */
    public void setCreatedAt(String createdAt) {
        this.createdAt = createdAt;
    }
    
    /**
     * Method that gets the logo of the user.
     * 
     * @return 
     */
    public String getLogo() {
        // Build the object if needed.
        build(true);
        return logoUrl;
    }
    
    /**
     * Method that sets the user's logo.
     * 
     * @param logoUrl 
     */
    public void setLogo(String logoUrl) {
        this.logoUrl = logoUrl;
    }
    
    /**
     * Method that sanitizes the display name.
     * 
     * @param name
     * @return 
     */
    private String sanitizeDisplayName(String name) {
        return name.replaceAll("\\\\s", " ");
    }
    
    /**
     * Method that sets the group ID for the user.
     * 
     * @param groupID 
     */
    public void setGroupID(int groupID) {
        this.groupID = groupID;
        PhantomBot.instance().getDataStore().set("group", getUsername(), String.valueOf(groupID));
    }
    
    /**
     * Method that gets the group ID for the user.
     * 
     * @return 
     */
    public int getGroupID() {
        build(false);
        return groupID;
    }
    
    /**
     * Method that says if this user is the owner of the bot.
     * 
     * @return 
     */
    public boolean isOwner() {
        build(false);
        return (isOwner || isAdministrator);
    }
    
    /**
     * Method that says if this user is an administrator.
     * 
     * @return 
     */
    public boolean isAdministrator() {
        build(false);
        return (isAdministrator || isOwner);
    }
    
    /**
     * Method that says if this user is a moderator.
     * 
     * @return 
     */
    public boolean isModerator() {
        build(false);
        return (isModerator || isAdministrator || isOwner);
    }
    
    /**
     * Method that returns if the user is a donator.
     * @return 
     */
    public boolean isDonator() {
        build(false);
        return isDonator;
    }
    
    /**
     * Method that returns if the user is a subscriber.
     * @return 
     */
    public boolean isSubscriber() {
        build(false);
        return isSubscriber;
    }
    
    /**
     * Method that returns if the user is a VIP.
     * @return 
     */
    public boolean isVIP() {
        build(false);
        return isVIP;
    }
    
    /**
     * Method that returns if the user is a regular.
     * @return 
     */
    public boolean isRegular() {
        build(false);
        return isRegular;
    }
    
    /***
     * Method that updates the status of the user, either a regular, VIP, sub, mod, etc.
     * 
     * @param groupID 
     */
    public void updateUserStatus(int groupID) {
        // Reset all of the permissions of the user.
        isOwner = (groupID >= 0);
        isAdministrator = (groupID >= 1);
        isModerator = (groupID >= 2);
        isSubscriber = (groupID == 3);
        isDonator = (groupID == 4);
        isVIP = (groupID == 5);
        isRegular = (groupID == 6);
    }
     
    /**
     * Method that builds this object if not done already.
     * 
     * @param full - If we should build the full object with all the user info.
     */
    private void build(boolean full) {
        if (!isBuilt(full)) {
            try {
                // This can query the API or our database.
                JSONObject user = UsernameCache.instance().getUserData(getUsername());
                
                // Make sure we got data.
                if (user.has("_id")) {
                    // Set the display name.
                    setDisplayName(user.getString("display_name"));
                    // Set the ID. Twitch can sometimes return a string/int.
                    setID(user.get("_id").toString());
                    // Set the type of user.
                    setType(user.getString("type"));
                    // Set when the user was created at.
                    setCreatedAt(user.getString("created_at"));
                    // Set the user's logo.
                    setLogo(user.getString("logo"));
                } else {
                    com.gmt2001.Console.err.println("Failed to get data for user: " + getUsername());
                }
                
                if (groupID == -1) {
                    String strID = PhantomBot.instance().getDataStore().get("group", getUsername());
                    if (strID != null) {
                        int id = Integer.parseInt(strID);
                        updateUserStatus(id);
                        setGroupID(id);
                    }
                }
            } catch (JSONException ex) {
                com.gmt2001.Console.err.logStackTrace(ex);
            }
        }
    }
    
    /**
     * If this object was built, meaning the display name is set and the ID is set.
     * 
     * @param isFull If we want to check if the entire object is built. We don't need this if we just want the display name/ID.
     * @return 
     */
    private boolean isBuilt(boolean isFull) {
        boolean built = ("".equals(displayName) || "".equals(userID) || groupID == -1);
        
        if (isFull && built) {
            built = ("".equals(userType) || "".equals(createdAt) || "".equals(logoUrl));
        }
        
        return !built;
    }
}
