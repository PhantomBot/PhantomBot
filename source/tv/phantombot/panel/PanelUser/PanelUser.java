/*
 * Copyright (C) 2016-2023 phantombot.github.io/PhantomBot
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
package tv.phantombot.panel.PanelUser;

import java.util.Collections;
import java.util.List;
import java.util.Map;

import org.json.JSONArray;
import org.json.JSONObject;

import com.gmt2001.datastore.DataStore;
import com.gmt2001.datastore2.Datastore2;
import com.gmt2001.datastore2.record.Record8;
import com.gmt2001.security.Digest;

import tv.phantombot.CaselessProperties;
import tv.phantombot.PhantomBot;
import tv.phantombot.panel.WsPanelHandler;
import tv.phantombot.panel.PanelUser.PanelUserHandler.Permission;

/**
 * Represents a panel user and should be managed through {@link PanelUserHandler}
 *
 * @author Sartharon
 */
public final class PanelUser extends Record8<PanelUser, String, String, String, PermissionMap, Boolean, Long, Long, Boolean> {
    /**
     * Version of this record implementation
     */
    public static final long serialVersionUID = 1L;
    private static final PanelUser CONFIGUSER = new PanelUser(CaselessProperties.instance().getProperty("paneluser", "panel"), Digest.sha256(CaselessProperties.instance().getProperty("panelpassword", "panel")));
    private Type userType;
    /**
     * User types
     */
    public enum Type {
        /**
         * User originating from the botlogin.txt
         */
        CONFIG,
        /**
         * User originating from the database
         */
        DATABASE,
        /**
         * New user not saved to the database yet; temporary user
         */
        NEW;
    };

    /**
     * Default constructor
     */
    PanelUser() {
        super(PanelUserTable.instance(), true, () -> PanelUserTable.instance().USERNAME, () -> PanelUserTable.instance().PASSWORD,
            () -> PanelUserTable.instance().TOKEN, () -> PanelUserTable.instance().PERMISSIONS,
            () -> PanelUserTable.instance().ENABLED, () -> PanelUserTable.instance().CREATIONDATE,
            () -> PanelUserTable.instance().LASTLOGIN, () -> PanelUserTable.instance().HASSETPASSWORD);
        this.userType = Type.DATABASE;
    }

    /**
     * Constructor used when loading a database user
     */
    PanelUser(String username, JSONObject userJO) {
        this();
        this.setUsername(username);
        this.userType = Type.DATABASE;
        this.fromJSON(userJO);
    }

    /**
     * Constructor used for new user creations
     */
    PanelUser(String username, Map<String, Permission> permissions, boolean enabled, boolean canManageUsers, boolean canRestartBot) {
        this(username, permissions, Type.NEW, enabled, false, canManageUsers, canRestartBot);
    }

    /**
     * Constructor used for the user defined in botlogin.txt {@link CONFIGUSER}
     */
    PanelUser(String username, String password) {
        this(username, PanelUserHandler.getFullAccessPermissions(), Type.CONFIG, true, true, true, true);
        this.changePassword(password);
        this.setToken(CaselessProperties.instance().getProperty("webauth"));
    }

    /**
     * Internal constructor
     */
    PanelUser(String username, Map<String, Permission> permissions, Type userType, boolean enabled, boolean hasSetPassword, boolean canManageUsers, boolean canRestartBot) {
        this();
        this.values(username, "", null, PermissionMap.fromMap(permissions), enabled, 0L, 0L, hasSetPassword);
        this.userType = userType;
        this.setManageUserPermission(canManageUsers);
        this.setRestartPermission(canRestartBot);
    }

    /**
     * The panel user's name
     *
     * @return The panel user's current name
     */
    public String getUsername() {
        return this.value1();
    }

    /**
     * Sets the username
     *
     * @param value the username
     */
    public void setUsername(String value) {
        this.value1(value);
    }

    /**
     * The panel user's password
     *
     * @return The panel user's current password
     */
    public String getPassword() {
        return this.value2();
    }

    /**
     * Sets the password
     *
     * @param value the password
     */
    public void setPassword(String value) {
        this.value2(value);
    }

    /**
     *
     * The user's token
     *
     * @return the user's token
     */
    public String getToken() {
        return this.value3();
    }

    /**
     * Sets the token
     *
     * @param value the token
     */
    public void setToken(String value) {
        this.value3(value);
    }

    /**
     * The user's permissions
     *
     * @return the permissions
     */
    public PermissionMap getPermissions() {
        return this.value4();
    }

    /**
     * Sets the permissions on the record and clears the permissions map
     *
     * @param value the new permissions
     */
    public void setPermissions(PermissionMap value) {
        this.value4(value);
    }

    /**
     * Sets the permissions on the record and clears the permissions map
     *
     * @param value the new permissions
     */
    public void setPermissions(JSONArray value) {
        this.value4(PermissionMap.fromJSON(value));
    }

    /**
     * Indicates if the user is enabled
     * @return {@code true} if the user is enabled
     */
    public boolean isEnabled() {
        return this.value5();
    }

    /**
     * Sets if the account is enabled
     *
     * @param value {@code true} for enabled
     */
    public void setIsEnabled(Boolean value) {
        this.value5(value);
    }

    /**
     * The time at which this user was created
     * @return The time at which this user was created as Unix-Time
     */
    public long getCreationDate() {
        return this.value6();
    }

    /**
     * Sets the account creation timestamp, in millis
     *
     * @param value the timestamp
     */
    public void setCreationDate(Long value) {
        this.value6(value);
    }

    /**
     * The last time this user logged in to the panel
     * @return The last time this user logged in to the panel as Unix-Time; {@code -1} if the user has never logged in
     */
    public long getLastLogin() {
        return this.value7();
    }

    /**
     * Sets the last login timestamp, in millis
     *
     * @param value the timestamp
     */
    public void setLastLogin(Long value) {
        this.value7(value);
    }

    /**
     * Indicates if the user has set their password or if it was generated automatically
     * @return {@code true} if the user's current password has been generated automatically
     */
    public boolean hasSetPassword() {
        return this.value8();
    }

    /**
     * Sets if the current account password is a temporary password that must be changed on next login
     *
     * @param value {@code false} if a temporary password
     */
    public void setHasSetPassword(Boolean value) {
        this.value8(value);
    }

    /**
     * The user's current websocket authentication token
     * <p>
     * A new token will automatically be generated and the user saved if there is no current token
     * @return The user's current websocket authentication token
     * @see WsPanelHandler#handleFrame() token usage
     */
    String getAuthToken() {
        if (this.getToken() == null || this.getToken().isEmpty()) {
            generateNewAuthToken();
            if(this.userType == Type.DATABASE) {
                this.doupdate();
            }
        }
        return this.getToken();
    }

    /**
     * The user's {@link PanelUserHandler.Permission permissions}
     * @return The user's {@link PanelUserHandler.Permission permissions}
     */
    public Map<String, Permission> getPermission() {
        return Collections.unmodifiableMap(this.getPermissions());
    }

    /**
     * The {@link Type user's type}
     * <p>
     * Used for user management
     * @return The {@link Type user type}
     */
    public Type getUserType() {
        return this.userType;
    }

    /**
     * Indicates if the panel user's properties (username, password, {@link PanelUserHandler.Permission permissions}, ...) can be changed
     * <p>
     * The user defined in the botlogin.txt cannot
     * @return {@code true} if the user's properties can be changed; {@code false} otherwise
     */
    public boolean canBeEdited() {
        return this.userType != Type.CONFIG;
    }

    /**
     * Indicates if the user is originating from the botlogin.txt
     * @return {@code true} if the user has been created from the username and password provided in the botlogin.txt
     */
    public boolean isConfigUser() {
        return this.userType == Type.CONFIG;
    }

    /**
     * Indicates if this user is allowed to manage other panel users
     *
     * @return {@code true} if allowed
     */
    public boolean canManageUsers() {
        return this.isConfigUser() || (this.getPermissions().containsKey("canManageUsers") && this.getPermissions().get("canManageUsers").equals(Permission.READ_WRITE));
    }

    /**
     * Allows or disallows the user to mange other user
     * @param permission {@code true} allows the user to manage users; {@code false} prohibits it
     */
    void setManageUserPermission(boolean permission) {
        PermissionMap permissions = this.getPermissions();
        permissions.put("canManageUsers", permission ? Permission.READ_WRITE : Permission.READ_ONLY);
        if (permission && !permissions.containsKey("settings")) {
            permissions.put("settings", Permission.READ_ONLY);
        }

        this.setPermissions(permissions);
    }

    /**
     * Indicates if this user is allowed to restart the bot
     *
     * @return {@code true} if allowed
     */
    public boolean canRestartBot() {
        return this.isConfigUser() || (this.getPermissions().containsKey("canRestartBot") && this.getPermissions().get("canRestartBot").equals(Permission.READ_WRITE));
    }

    /**
     * Allows or disallows the user to restart the bot
     * @param permission {@code true} allows the user to restart the bot; {@code false} prohibits it
     */
    void setRestartPermission(boolean permission) {
        PermissionMap permissions = this.getPermissions();
        permissions.put("canRestartBot", permission ? Permission.READ_WRITE : Permission.READ_ONLY);
        if (permission && !permissions.containsKey("settings")) {
            permissions.put("settings", Permission.READ_ONLY);
        }
        this.setPermissions(permissions);
    }

    private void setCreationDateNOW(){
        this.setCreationDate(System.currentTimeMillis());
    }

    /**
     * Updates the last time the user has logged in on the panel
     */
    void setLastLoginNOW() {
        this.setLastLogin(System.currentTimeMillis());
    }

    /**
     * Changes the user's password and marks that the password has been manually set by the user
     * @param password The new password
     */
    void changePassword(String password) {
        this.setPassword(password);
        this.setHasSetPassword(true);
    }

    /**
     * Changes the user's {@link PanelUserHandler.Permission permissions}
     * @param permission The new {@link PanelUserHandler.Permission permissions}
     */
    void setPermission(Map<String, Permission> permissions) {
        this.setPermission(PermissionMap.fromMap(permissions));
    }

    /**
     * Changes the user's {@link PanelUserHandler.Permission permissions}
     * @param permission The new {@link PanelUserHandler.Permission permissions}
     */
    void setPermission(PermissionMap permissions) {
        if (!permissions.containsKey("dashboard")) {
            permissions.put("dashboard", Permission.READ_ONLY);
        }

        this.setPermissions(permissions);
    }

    /**
     * Enables or disables the user
     * @param enabled {@code true} enables the user; {@code false} disabled the user
     */
    void setEnabled(boolean enabled) {
        this.setIsEnabled(enabled);
    }

    /**
     * Generates a new websocket authentication token for the user
     * @see WsPanelHandler#handleFrame() token usage
     */
    private void generateNewAuthToken() {
        String tempToken = PhantomBot.generateRandomString(30);

        while (Datastore2.instance().dslContext().fetchExists(PanelUserTable.instance(), PanelUserTable.instance().TOKEN.eq(tempToken))) {
            tempToken = PhantomBot.generateRandomString(30);
        }

        this.setToken(tempToken);
    }

    /**
     * Generates a new random 10 character long user password
     * @return The new password assigned to the user in plaintext
     * @see PhantomBot#generateRandomString(int) random string generation
     */
    String generateNewPassword() {
        String temp = PhantomBot.generateRandomString(10);
        this.setPassword(Digest.sha256(temp));
        this.setHasSetPassword(false);
        return temp;
    }

    /**
     * Changes the user's username
     */
    void changeUsername(String newUsername) {
        try {
            this.setUsername(newUsername);
            this.doupdate();
        } catch (Exception ex) {
            com.gmt2001.Console.err.printStackTrace(ex);
        }
    }

    /**
     * Gets the users {@link PanelUserHandler.Permission permissions} as a {@link JSONArray}
     * @param asDisplayName Indicates if the {@link PanelUserHandler.Permission permissions} should be included with their display name
     * @return A {@link JSONArray} with the users permissions
     */
    JSONArray getPermissionsToJSON(boolean asDisplayName) {
        return this.getPermissions().toJSON(asDisplayName, false);
    }

    private void fromJSON(JSONObject userJO) {
        this.setPassword(userJO.getString("pass"));
        this.setToken(userJO.getString("token"));
        this.setHasSetPassword(userJO.getBoolean("hasSetPassword"));
        this.setEnabled(userJO.getBoolean("enabled"));
        this.setLastLogin(userJO.getLong("lastLogin"));
        this.setCreationDate(userJO.getLong("creationDate"));
        this.setPermissions(userJO.getJSONArray("permissions"));
    }

    /**
     * Inserts the user into the database as a new row
     */
    void doinsert() {
        if (this.userType == Type.CONFIG) {
            return;
        }

        this.insert();
        this.userType = Type.DATABASE;
    }

    /**
     * Updates the existing user row in the database
     */
    void doupdate() {
        if (this.userType != Type.DATABASE) {
            return;
        }

        this.update();
    }

    /**
     * Deletes the user row from the database
     */
    void dodelete() {
        if (this.userType != Type.DATABASE) {
            return;
        }

        this.delete();
    }

    /**
     * Creates a new panel user and saves the user in the database
     * @param username The username of the new panel user
     * @param permission The user's {@link PanelUserHandler.Permission permissions}; {@code null} to assign no permissions}
     * @param enabled {@code true} to enable the user; {@code false} to disable the user
     * @return The password generated for the new user
     */
    public static String create(String username, Map<String, Permission> permissions, boolean enabled) {
        return create(username, permissions, enabled, false, false);
    }

    /**
     * Creates a new panel user and saves the user in the database
     * @param username The username of the new panel user
     * @param permission The user's {@link PanelUserHandler.Permission permissions}; {@code null} to assign no permissions}
     * @param enabled {@code true} to enable the user; {@code false} to disable the user
     * @return The password generated for the new user
     */
    public static String create(String username, Map<String, Permission> permissions, boolean enabled, boolean canManageUsers, boolean canRestartBot) {
        PanelUser user = new PanelUser(username, permissions, enabled, canManageUsers, canRestartBot);
        user.setCreationDateNOW();
        user.generateNewAuthToken();
        String password = user.generateNewPassword();
        user.doinsert();
        return password;
    }

    /**
     * Looks up a panel user by their username
     * @param username the username to lookup
     * @return the {@link PanelUser}; {@code null} if not found
     * @see DataStore#exists(String, String)
     */
    public static PanelUser LookupByUsername(String username) {
        if (username.equals(CaselessProperties.instance().getProperty("paneluser", "panel"))) {
            return CONFIGUSER;
        }

        return Datastore2.instance().dslContext().fetchOne(PanelUserTable.instance(), PanelUserTable.instance().USERNAME.equalIgnoreCase(username));
    }

    /**
     * Looks up a panel user by their websocket token
     * @param token the websocket token to lookup
     * @return the {@link PanelUser}; {@code null} if not found
     * @see PanelUser#LookupByUsername(String)
     */
    public static PanelUser LookupByAuthToken(String token) {
        if (token.equals(CaselessProperties.instance().getProperty("webauth")) || token.equals(CaselessProperties.instance().getProperty("webauthro"))) {
            return CONFIGUSER;
        }

        return Datastore2.instance().dslContext().fetchOne(PanelUserTable.instance(), PanelUserTable.instance().TOKEN.eq(token));
    }

    /**
     * Gets a list of all users, except for the config user
     *
     * @return a list of users
     */
    public static List<PanelUser> GetAll() {
        return Datastore2.instance().dslContext().fetch(PanelUserTable.instance());
    }

    /**
     * Indicates if the user with the specified username exists
     *
     * @param username the username to check
     * @return {@code true} if the username already exists in the database or is the config user
     */
    public static boolean UserExists(String username) {
        if (username.equals(CaselessProperties.instance().getProperty("paneluser", "panel"))) {
            return true;
        }

        return Datastore2.instance().dslContext().fetchExists(PanelUserTable.instance(), PanelUserTable.instance().USERNAME.equalIgnoreCase(username));
    }
}