package tv.phantombot.panel.PanelUser;

import com.gmt2001.Digest;
import com.gmt2001.datastore.DataStore;
import tv.phantombot.CaselessProperties;
import org.json.JSONObject;
import tv.phantombot.PhantomBot;
import tv.phantombot.panel.WsPanelHandler;
import tv.phantombot.panel.PanelUser.PanelUserHandler.Permission;

/**
 * Represents a panel user and should be managed through {@link PanelUserHandler}
 *
 * @author Sartharon
 */
public final class PanelUser {
    private String username;
    private String password;
    private String token;
    private Permission permission;
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
     * Constructor used when loading a database user
     */
    private PanelUser(String username, JSONObject userJO) {
        this.username = username;
        this.userType = Type.DATABASE;
        fromJSON(userJO);
    }

    /**
     * Constructor used for new user creations
     */
    private PanelUser(String username, Permission permission, boolean enabled) {
        this(username, permission, Type.NEW, enabled, false);
    }

    /**
     * Constructor used for the user defined in botlogin.txt
     */
    private PanelUser(String username, String password) {
        this(username, Permission.ADMINISTRATOR, Type.CONFIG, true, true);
        this.password = password;
    }

    /**
     * Internal constructor
     */
    private PanelUser(String username, Permission permission, Type userType, boolean enabled, boolean hasSetPassword) {
        this.username = username;
        this.permission = permission;
        this.userType = userType;
        this.enabled = enabled;
        this.hasSetPassword = hasSetPassword;
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
        if (this.token == null) {
            generateNewAuthToken();
            if(this.userType == Type.DATABASE) {
                this.save();
            }
        }
        return this.token;
    }

    /**
     * The user's {@link PanelUserHandler.Permission permission}
     * @return The user's {@link PanelUserHandler.Permission permission}
     */
    public Permission getPermission() {
        return this.permission;
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
     * Indicates if the panel user's properties (username, password, {@link PanelUserHandler.Permission permission}, ...) can be changed
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
     * @param permission The new {@link PanelUserHandler.Permission permission}
     */
    void setPermission(Permission permission) {
        this.permission = permission;
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
     * <br /><br />
     * Currently the {@code webauth} and {@code webauthro} values are used as the users websocket authentication token
     * @see WsPanelHandler#handleFrame() token usage
     */
    private void generateNewAuthToken() {
        if (this.permission == Permission.ADMINISTRATOR) {
            this.token = CaselessProperties.instance().getProperty("webauth");
        }
        if (this.permission == Permission.READ_ONLY) {
            this.token = CaselessProperties.instance().getProperty("webauthro");
        }
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
        DataStore dataStore = PhantomBot.instance().getDataStore();
        dataStore.del(PanelUserHandler.PANELUSERTABLE, this.username);
        this.username = newUsername;
    }

    private JSONObject toJSON() {
        JSONObject userJO = new JSONObject();
        userJO.put("pass", this.password);
        userJO.put("token", this.token);
        userJO.put("permission",this.permission.getValue());
        userJO.put("enabled", this.enabled);
        userJO.put("hasSetPassword", this.hasSetPassword);
        userJO.put("lastLogin", this.lastLogin);
        userJO.put("creationDate", this.creationDate);
        return userJO;
    }

    private void fromJSON(JSONObject userJO) {
        this.password = userJO.getString("pass");
        this.token = userJO.getString("token");
        this.hasSetPassword = userJO.getBoolean("hasSetPassword");
        this.permission = Permission.getByValue(userJO.getInt("permission"));
        this.enabled = userJO.getBoolean("enabled");
        this.lastLogin = userJO.getLong("lastLogin");
        this.creationDate = userJO.getLong("creationDate");
    }

    /**
     * Deletes the panel user from the database
     * @return {@code false} if the user is not a database user ({@link Type#DATABASE}); {@code true} otherwise
     * @see DataStore#del(String, String)
     */
    boolean delete() {
        if (this.userType != Type.DATABASE) {
            return false;
        }
        DataStore dataStore = PhantomBot.instance().getDataStore();
        dataStore.del(PanelUserHandler.PANELUSERTABLE, this.username);
        this.enabled = false;
        return true;
    }

    /**
     * Saves the panel user to the database
     * @return {@code false} if the user originated from the values defined in botlogin.txt; {@code true} otherwise
     * @see DataStore#set(String, String, String)
     */
    boolean save() {
        if (this.userType == Type.CONFIG) {
            return false;
        }

        this.userType = Type.DATABASE;
        DataStore dataStore = PhantomBot.instance().getDataStore();
        dataStore.set(PanelUserHandler.PANELUSERTABLE, this.username, this.toJSON().toString());
        return true;
    }

    /**
     * Creates a new panel user and saves the user in the database
     * @param username The username of the new panel user
     * @param permission The user's {@link PanelUserHandler.Permission permission}; {@code null} to assign the {@link PanelUserHandler.Permission#READ_ONLY default permission}
     * @param enabled {@code true} to enable the user; {@code false} to disable the user
     * @return The password generated for the new user
     */
    public static String create(String username, Permission permission, boolean enabled) {
        if (permission == null) {
            permission = Permission.READ_ONLY;
        }

        PanelUser user = new PanelUser(username, permission, enabled);
        user.setCreationDateNOW();
        user.generateNewAuthToken();
        String password = user.generateNewPassword();
        user.save();
        return password;
    }

    /**
     * Looks up a panel user by their username
     * @param username the username to lookup
     * @return The user if the username has been found; {@code null} otherwise
     * @see DataStore#exists(String, String)
     */
    public static PanelUser LookupByUsername(String username) {
        DataStore dataStore = PhantomBot.instance().getDataStore();
        if (dataStore.exists(PanelUserHandler.PANELUSERTABLE, username)) {
            String userJSONStr = dataStore.GetString(PanelUserHandler.PANELUSERTABLE , "", username);
            return new PanelUser(username, new JSONObject(userJSONStr));
        }
        if (username.equals(CaselessProperties.instance().getProperty("paneluser", "panel"))) {
            String password = Digest.sha256(CaselessProperties.instance().getProperty("panelpassword", "panel"));
            return new PanelUser(username, password);
        }
        return null;
    }
}