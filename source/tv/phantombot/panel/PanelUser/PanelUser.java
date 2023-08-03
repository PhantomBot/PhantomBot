package tv.phantombot.panel.PanelUser;

import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.jooq.Record1;
import org.jooq.impl.UpdatableRecordImpl;
import org.json.JSONArray;
import org.json.JSONObject;

import com.gmt2001.Digest;
import com.gmt2001.datastore.DataStore;
import com.gmt2001.datastore2.Datastore2;

import tv.phantombot.CaselessProperties;
import tv.phantombot.PhantomBot;
import tv.phantombot.panel.WsPanelHandler;
import tv.phantombot.panel.PanelUser.PanelUserHandler.Permission;

/**
 * Represents a panel user and should be managed through {@link PanelUserHandler}
 *
 * @author Sartharon
 */
public final class PanelUser extends UpdatableRecordImpl<PanelUser> {
    /**
     * Version of this record implementation
     */
    public static final long serialVersionUID = 1L;
    private static final PanelUser CONFIGUSER = new PanelUser(CaselessProperties.instance().getProperty("paneluser", "panel"), Digest.sha256(CaselessProperties.instance().getProperty("panelpassword", "panel")));
    private String username;
    private String password;
    private String token;
    private final Map<String, Permission> permissions = new HashMap<>();
    private boolean enabled;
    private Type userType;
    private long creationDate;
    private long lastLogin = -1;
    private boolean hasSetPassword = false;
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
     * Default constructor. Used by JOOQ
     */
    PanelUser() {
        super(PanelUserTable.instance());
        this.userType = Type.DATABASE;
    }

    /**
     * Constructor used when loading a database user
     */
    PanelUser(String username, JSONObject userJO) {
        super(PanelUserTable.instance());
        this.username = username;
        this.userType = Type.DATABASE;
        fromJSON(userJO);
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
        this.password = password;
        this.token = CaselessProperties.instance().getProperty("webauth");
    }

    /**
     * Internal constructor
     */
    PanelUser(String username, Map<String, Permission> permissions, Type userType, boolean enabled, boolean hasSetPassword, boolean canManageUsers, boolean canRestartBot) {
        super(PanelUserTable.instance());
        this.username = username;
        this.setPermission(permissions);
        this.userType = userType;
        this.enabled = enabled;
        this.hasSetPassword = hasSetPassword;
        this.setManageUserPermission(canManageUsers);
        this.setRestartPermission(canRestartBot);
    }

    /**
     * Used by JOOQ to stringify {@link #permissions} for storage in the database
     *
     * @return {@link #permissions} as a stringified JSON array
     */
    @SuppressWarnings({"unused"})
    private String permissions() {
        return this.getPermissionsToJSON(false, true).toString();
    }

    /**
     * Used by JOOQ to restore {@link #permissions} from the database
     *
     * @param data a stringified JSON array of permissions
     */
    @SuppressWarnings({"unused"})
    private void permissions(String data) {
        this.permissionsFromJSON(new JSONArray(data));
    }

    /**
     * The panel user's name
     * @return The panel user's current name
     */
    public String getUsername() {
        return this.username;
    }

    /**
     * The panel user's password
     * @return The panel user's current password
     */
    public String getPassword() {
        return this.password;
    }

    /**
     * The last time this user logged in to the panel
     * @return The last time this user logged in to the panel as Unix-Time; {@code -1} if the user has never logged in
     */
    public long getLastLogin() {
        return this.lastLogin;
    }

    /**
     * The user's current websocket authentication token
     * <br /><br />
     * A new token will automatically be generated and the user saved if there is no current token
     * @return The user's current websocket authentication token
     * @see WsPanelHandler#handleFrame() token usage
     */
    String getAuthToken() {
        if (this.token == null || this.token.isEmpty()) {
            generateNewAuthToken();
            if(this.userType == Type.DATABASE) {
                this.doupdate();
            }
        }
        return this.token;
    }

    /**
     * The user's {@link PanelUserHandler.Permission permissions}
     * @return The user's {@link PanelUserHandler.Permission permissions}
     */
    public Map<String, Permission> getPermission() {
        return Collections.unmodifiableMap(this.permissions);
    }

    /**
     * The {@link Type user's type}
     * <br /><br />
     * Used for user management
     * @return The {@link Type user type}
     */
    public Type getUserType() {
        return this.userType;
    }

    /**
     * Indicates if the panel user's properties (username, password, {@link PanelUserHandler.Permission permissions}, ...) can be changed
     * <br /><br />
     * The user defined in the botlogin.txt cannot
     * @return {@code true} if the user's properties can be changed; {@code false} otherwise
     */
    public boolean canBeEdited() {
        return this.userType != Type.CONFIG;
    }

    /**
     * The time at which this user was created
     * @return The time at which this user was created as Unix-Time
     */
    public long getCreationDate() {
        return this.creationDate;
    }

    /**
     * Indicates if the user has set their password or if it was generated automatically
     * @return {@code true} if the user's current password has been generated automatically
     */
    public boolean hasSetPassword() {
        return this.hasSetPassword;
    }

    /**
     * Indicates if the user is enabled
     * @return {@code true} if the user is enabled
     */
    public boolean isEnabled() {
        return this.enabled;
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
        return this.isConfigUser() || (permissions.containsKey("canManageUsers") && permissions.get("canManageUsers").equals(Permission.READ_WRITE));
    }

    /**
     * Allows or disallows the user to mange other user
     * @param permission {@code true} allows the user to manage users; {@code false} prohibits it
     */
    void setManageUserPermission(boolean permission) {
        this.permissions.put("canManageUsers", permission ? Permission.READ_WRITE : Permission.READ_ONLY);
        if (permission && !this.permissions.containsKey("settings")) {
            this.permissions.put("settings", Permission.READ_ONLY);
        }
    }

    /**
     * Indicates if this user is allowed to restart the bot
     *
     * @return {@code true} if allowed
     */
    public boolean canRestartBot() {
        return this.isConfigUser() || (permissions.containsKey("canRestartBot") && permissions.get("canRestartBot").equals(Permission.READ_WRITE));
    }

    /**
     * Allows or disallows the user to restart the bot
     * @param permission {@code true} allows the user to restart the bot; {@code false} prohibits it
     */
    void setRestartPermission(boolean permission) {
        this.permissions.put("canRestartBot", permission ? Permission.READ_WRITE : Permission.READ_ONLY);
        if (permission && !this.permissions.containsKey("settings")) {
            this.permissions.put("settings", Permission.READ_ONLY);
        }
    }

    private void setCreationDateNOW(){
        this.creationDate = System.currentTimeMillis();
    }

    /**
     * Updates the last time the user has logged in on the panel
     */
    void setLastLoginNOW() {
        this.lastLogin = System.currentTimeMillis();
    }

    /**
     * Changes the user's password and marks that the password has been manually set by the user
     * @param password The new password
     */
    void setPassword(String password) {
        this.password = password;
        this.hasSetPassword = true;
    }

    /**
     * Changes the user's {@link PanelUserHandler.Permission permissions}
     * @param permission The new {@link PanelUserHandler.Permission permissions}
     */
    void setPermission(Map<String, Permission> permissions) {
        if (!permissions.containsKey("dashboard")) {
            permissions.put("dashboard", Permission.READ_ONLY);
        }
        this.permissions.clear();
        this.permissions.putAll(permissions);
    }

    /**
     * Enables or disables the user
     * @param enabled {@code true} enables the user; {@code false} disabled the user
     */
    void setEnabled(boolean enabled) {
        this.enabled = enabled;
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

        this.token = tempToken;
    }

    /**
     * Generates a new random 10 character long user password
     * @return The new password assigned to the user in plaintext
     * @see PhantomBot#generateRandomString(int) random string generation
     */
    String generateNewPassword() {
        String temp = PhantomBot.generateRandomString(10);
        this.password = Digest.sha256(temp);
        this.hasSetPassword = false;
        return temp;
    }

    /**
     * Changes the user's username
     */
    void changeUsername(String newUsername) {
        try {
            boolean oldEnabled = this.enabled;
            this.dodelete();
            this.enabled = oldEnabled;
            this.username = newUsername;
            this.doinsert();
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
        return getPermissionsToJSON(asDisplayName, false);
    }

    /**
     * Gets the users {@link PanelUserHandler.Permission permissions} as a {@link JSONArray}
     * @param asDisplayName Indicates if the {@link PanelUserHandler.Permission permissions} should be included with their display name
     * @param isSave Indicates if the {@link JSONArray} will be used to save the user; If {@code true}, special permissions will be included as well
     * @return A {@link JSONArray} with the users permissions
     */
    private JSONArray getPermissionsToJSON(boolean asDisplayName, boolean isSave) {
        JSONArray permissionsJSON = new JSONArray();
        int counter = 0;
        for (Map.Entry<String, Permission> entry : this.permissions.entrySet()) {
            if (!isSave && (entry.getKey().equalsIgnoreCase("canRestartBot") || entry.getKey().equalsIgnoreCase("canManageUsers"))) {
                continue;
            }
            JSONObject permissionJSON = new JSONObject();
            permissionJSON.put("section", entry.getKey());
            permissionJSON.put("permission", (asDisplayName ? entry.getValue().getDisplayName() : entry.getValue().getValue()));
            permissionsJSON.put(counter, permissionJSON);
            counter++;
        }
        return permissionsJSON;
    }

    private void fromJSON(JSONObject userJO) {
        this.password = userJO.getString("pass");
        this.token = userJO.getString("token");
        this.hasSetPassword = userJO.getBoolean("hasSetPassword");
        this.enabled = userJO.getBoolean("enabled");
        this.lastLogin = userJO.getLong("lastLogin");
        this.creationDate = userJO.getLong("creationDate");
        permissionsFromJSON(userJO.getJSONArray("permissions"));
    }

    private void permissionsFromJSON(JSONArray permissionsJSON) {
        permissions.clear();
        for (int i = 0; i < permissionsJSON.length(); i++) {
            JSONObject permissionObj = permissionsJSON.getJSONObject(i);
            String key = permissionObj.getString("section");
            Permission permission = Permission.getByValue(permissionObj.getInt("permission"));
            permissions.put(key, permission);
        }
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
        if (permissions == null) {
            permissions = new HashMap<>();
        }

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

        return Datastore2.instance().dslContext().fetchOne(PanelUserTable.instance(), PanelUserTable.instance().USERNAME.eq(username));
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

        return Datastore2.instance().dslContext().fetchExists(PanelUserTable.instance(), PanelUserTable.instance().USERNAME.eq(username));
    }

    /**
     * The primary key for this record, which is {@link #getUsername()}
     *
     * @return the primary key
     */
    @Override
    @SuppressWarnings({"unchecked", "rawtypes"})
    public Record1<String> key() {
        return (Record1) super.key();
    }
}