package tv.phantombot.panel.PanelUser;

import java.util.ArrayList;
import java.util.Base64;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.json.JSONArray;
import org.json.JSONObject;
import org.json.JSONStringer;
import com.gmt2001.datastore.DataStore;
import tv.phantombot.PhantomBot;

/**
 * {@link PanelUser Panel user} management for the web panel and websocket
 *
 * @author Sartharon
 */
public final class PanelUserHandler {
    /**
     * Database table suffix for the {@link PanelUser panel users}
     */
    public static final String PANEL_USER_TABLE = "panelUsers";

    /**
     * Sections on the panel to which a user can be granted permissions to
     */
    private static final String[] PANEL_SECTIONS = {"dashboard", "commands", "moderation", "permissions", "timers", "alerts", "loyalty", "ranking",
                                                    "quotes", "keywords & emotes", "games", "giveaways", "discord", "history", "extra",
                                                    "audio", "stream overlay", "settings", "youtube player"};
    
    /**
     * Database tables that are generally called on the panel
     */
    private static final List<String> READ_ONLY_TABLES = List.of("paneluser", "settings", "groups", "panelsettings", "paneldata", "modules", "command");
    /**
     * Sections and their respectively called scripts on the panel
     */
    private static final Map<String, List<String>> PANEL_SECTION_SCRIPTS = Map.of("alerts", List.of("donationscache.java"),
                                                                                    "audio", List.of("./core/commandcooldown.js"),
                                                                                    "commands", List.of("./commands/customcommands.js", "./core/commandcooldown.js", "./core/commandregister.js"),
                                                                                    "dashboard", List.of("./core/panelhandler.js", "restartrunner"),
                                                                                    "discord", List.of("./discord/handlers/followhandler.js", "./discord/handlers/subscribehandler.js", "./discord/handlers/bitshandler.js", "./discord/handlers/cliphandler.js",
                                                                                                         "./discord/systems/greetingssystem.js", "./discord/handlers/streamlabshandler.js", "./discord/handlers/tipeeestreamhandler.js", "./discord/handlers/streamelementshandler.js",
                                                                                                          "./discord/core/commandcooldown.js", "./discord/commands/customcommands.js", "./discord/games/gambling.js", "./core/logging.js"),
                                                                                    "extra", List.of("./systems/commercialsystem.js", "./systems/queuesystem.js"),
                                                                                    "Games", List.of("./games/random.js"),
                                                                                    "keyword & emotes", List.of("./handlers/keywordemoteshandler.js", "./handlers/keywordhandler.js"),
                                                                                    "loyalty", List.of("./handlers/channelPointshandler.js"),
                                                                                    "settings", List.of("./core/corecommands.js", "./discord/core/commandcooldown.js", "./core/commandcooldown.js"));
    private static final List<String> READ_ONLY_COMMANDS = List.of("synconline silent");
    private static final Map<String, List<String>> PANEL_SECTION_TABLES = Map.of("commands", List.of("aliases", "cooldown", "command", "disabledcommands", "externalcommands", "hiddencommands", "paycom", "permcom", "pricecom"),
                                                                                    "moderation", List.of("blackList", "chatmoderator", "whitelist", "settings"),
                                                                                    "permission", List.of(""));
    /**
     * Messages for use as responses to the web panel
     */
    public enum PanelMessage {
        /**
         * {@link PanelUser Panel user} could not be found
         */
        UserNotFound("User does not exist!", true),
        /**
         * {@link PanelUser Panel user} already exits
         */
        UserAlreadyExists("User already exists!", true),
        /**
         * {@link PanelUser Panel user} is disabled
         */
        UserIsDisabled("User is disabled!", true),
        /**
         * {@link PanelUser Panel user} originates from the botlogin.txt
         */
        UserIsConfig("The config user cannot be edited or removed", true),
        /**
         * {@link PanelUser Panel user} could not be saved correctly
         */
        SaveError("Changes could not be saved", true),
        /**
         * {@link PanelUser Panel user} is not allowed to manage other panel users
         */
        CanNotManageError("Not allowed to manage other panel users", true),
        /**
         * {@link PanelUser Panel user} is not allowed to manage other panel users
         */
        InsufficientPermissions("You are missing the required permissions to complete this operation!", true),
        /**
         * General Error/Error placeholder
         */
        Error("Unknown", true),
        /**
         * General Success/Success placeholder
         */
        Success("Success",false);

        private String message;
        private boolean isError;
        private String JSONkey;

        PanelMessage(String message, boolean isError) {
            this.message = message;
            this.isError = isError;
            this.JSONkey = isError ? "error" : "success";
        }

        /**
         * Gets the message intended for the web panel to be shown or handled there
         * @return The message for the panel
         */
        public String getMessage() {
            return this.message;
        }

        /**
         * Indicates if the message is an error or success message
         * @return {@code true} if this is message is an error message
         */
        public boolean isError() {
            return this.isError;
        }

        /**
         * Overrides the default message for each enum
         * @param message the message which should replace the default message
         * @return {@code this}
         */
        protected PanelMessage setResponse(String message) {
            this.message = message;
            return this;
        }

        /**
         * Get the JSON key under which the message should be send to the web panel
         * @return The JSON key under which the message should be send to the web panel
         */
        public String getJSONkey() {
            return this.JSONkey;
        }
    }

     /**
     * {@link PanelUser Panel user} web panel and websocket permission
     */
    public enum Permission{
        /**
         * Read and write access
         */
        READ_WRITE(1, "Full Access"),
        /**
         * Read only access
         */
        READ_ONLY(2, "Read Only");

        private int value;
        private String displayName;

        Permission(int value, String displayName) {
            this.value = value;
            this.displayName = displayName;
        }

        /**
         * The permissions value
         * @return The permissions value
         */
        public int getValue() {
            return this.value;
        }

        /**
         * The permissions display name
         * @return The permissions display name
         */
        public String getDisplayName(){
            return this.displayName;
        }

        /**
         * Get a permission enum by it's {@link Permission#value value}
         * @param value The permission's value to search for
         * @return The permission if it has been found; The {@link Permission#READ_ONLY default permission} otherwise
         */
        public static Permission getByValue(int value) {
            for (Permission permission : Permission.values()) {
                if (permission.getValue() == value) {
                    return permission;
                }
            }
            return Permission.READ_ONLY;
        }

        /**
         * Get a permission enum by it's {@link Permission#displayName display name}
         * @param name The permission's name to search for
         * @return The permission if it has been found; The {@link Permission#READ_ONLY default permission} otherwise
         */
        public static Permission getByName(String name) {
            for (Permission permission : Permission.values()) {
                if (permission.getDisplayName().equals(name)) {
                    return permission;
                }
            }
            return Permission.READ_ONLY;
        }
    }

    /**
     * Checks if the {@link PanelUser panel user} is allowed to logon to the web panel and/or use the websocket
     * @param base64Token The user's login token in base64 from the HTTP-Headers
     * @param requestUri The requested uri
     * @return {@code true} if the token is valid, the user is enabled and the user is allowed to access the uri; {@code false} otherwise
     * @see PanelUserHandler#checkLogin(String username, String password, String requestUri)
     */
    public static boolean checkLoginB64(String base64Token, String requestUri) {
        return checkLoginAndGetUserB64(base64Token, requestUri) != null;
    }

    /**
     * Checks if the {@link PanelUser panel user} is allowed to logon to the web panel and/or use the websocket
     * @param base64Token The user's login token in base64 from the HTTP-Headers
     * @param requestUri The requested uri
     * @return A {@link PanelUser} if the user exists, is enabled and is allowed to access the uri; {@code null} otherwise
     * @see PanelUserHandler#checkLoginAndGetUser(String username, String password, String requestUri)
     */
    public static PanelUser checkLoginAndGetUserB64(String base64Token, String requestUri) {
        if (base64Token == null || base64Token.isEmpty()) {
            return null;
        }
        String userpass = new String(Base64.getDecoder().decode(base64Token));
        int colon = userpass.indexOf(':');
        if (colon < 0) {
            return null;
        }
        String username = userpass.substring(0, colon);
        String password = userpass.substring(colon + 1);
        return checkLoginAndGetUser(username, password, requestUri);
    }

    /**
     * Checks if the {@link PanelUser panel user} is allowed to logon to the web panel and/or use the websocket
     * @param username The user's username
     * @param password The user's password
     * @return {@code true} if the exists and is enabled; {@code false} otherwise
     * @see PanelUserHandler#checkLogin(String username, String password, String requestUri)
     */
    public static boolean checkLogin(String username, String password) {
        return checkLogin(username, password, null);
    }

    /**
     * Checks if the {@link PanelUser panel user} is allowed to logon to the web panel and/or use the websocket
     * @param username The user's username
     * @param password The user's password
     * @return A {@link PanelUser} if the user exists, is enabled and is allowed to access the uri; {@code null} otherwise
     * @see PanelUserHandler#checkLoginAndGetUser(String username, String password, String requestUri)
     */
    public static PanelUser checkLoginAndGetUser(String username, String password) {
        return checkLoginAndGetUser(username, password, null);
    }

    /**
     * Checks if the {@link PanelUser panel user} is allowed to logon to the web panel and/or use the websocket
     * @param username The user's username
     * @param password The user's password
     * @param requestUri The requested uri
     * @return {@code true} if the user exists, is enabled and is allowed to access the uri; {@code false} otherwise
     * @see PanelUserHandler#checkLoginAndGetUser(String username, String password, String requestUri)
     */
    public static boolean checkLogin(String username, String password, String requestUri) {
        return checkLoginAndGetUser(username, password, requestUri) != null;
    }

    /**
     * Checks if the {@link PanelUser panel user} is allowed to logon to the web panel and/or use the websocket
     * @param username The user's username
     * @param password The user's password
     * @param requestUri The requested uri
     * @return A {@link PanelUser} if the user exists, is enabled and is allowed to access the uri; {@code null} otherwise
     * @see PanelUser#LookupByUsername(String) exists
     * @see PanelUser#isEnabled()
     */
    public static PanelUser checkLoginAndGetUser(String username, String password, String requestUri) {
        PanelUser user = PanelUser.LookupByUsername(username);
        if (user == null || !user.isEnabled()) {
            return null;
        }
        if (requestUri != null) {
            if ((requestUri.contains("/setup/") || requestUri.contains("/oauth/")) && !user.isConfigUser()){
                return null;
            }
            if (requestUri.contains("/ytplayer/") && !(user.getPermission().containsKey("youtube player") && user.getPermission().get("youtube player").equals(Permission.READ_WRITE))) {
                return null;
            }
        }
        if (password.equals(user.getPassword())) {
            user.setLastLoginNOW();
            user.save();
            return user;
        }
        return null;
    }

    /**
     * Checks if the {@link PanelUser panel user} is allowed to logon to the web panel and/or use the websocket by his authentication token
     * @param authToken The user's authentication token
     * @return A {@link PanelUser} if a user with that authentication token exists and is enabled; {@code null} otherwise
     * @see PanelUser#LookupByAuthToken(String)
     * @see PanelUser#isEnabled()
     */
    public static PanelUser checkAuthTokenAndGetUser(String authToken) {
        PanelUser user = PanelUser.LookupByAuthToken(authToken);
        if (user.isEnabled()) {
            return user;
        }
        return null;
    }

    /**
     * Get the authentication token for a {@link PanelUser panel user}
     * @param username The user's username
     * @return The user's websocket authentication token if the user exists and is enabled; {@code null} otherwise
     * @see PanelUser#getAuthToken() token generation
     * @see WsPanelHandler#handleFrame() token usage
     * @see PanelUser#LookupByUsername(String) exists
     * @see PanelUser#isEnabled()
     */
    public static String getUserAuthToken(String username) {
        PanelUser user = PanelUser.LookupByUsername(username);
        if (user == null) {
            return null;
        }
        if (!user.isEnabled()) {
            return null;
        }
        return user.getAuthToken();
    }

    /**
     * Changes a {@link PanelUser panel user's} password
     * <br /><br />
     * Only existing and {@link PanelUser#canBeEdited() editable} {@link PanelUser panel users} can have their password changed
     * @param username
     * @param currentPassword
     * @param newPassword
     * @return The fitting {@link PanelMessage panel message}
     * @see PanelUser#LookupByUsername(String) exists
     */
    public static PanelMessage changePassword(String username, String currentPassword, String newPassword) {
        PanelUser user = PanelUser.LookupByUsername(username);
        if (user == null) {
            return PanelMessage.UserNotFound;
        }
        if (!user.canBeEdited()){
            return PanelMessage.UserIsConfig;
        }
        if (!currentPassword.equals(user.getPassword())) {
            return PanelMessage.Error.setResponse("Invalid password!");
        }

        user.setPassword(newPassword);
        if (!user.save()) {
            return PanelMessage.SaveError;
        }
        return PanelMessage.Success.setResponse("Password changed successfully");
    }

    /**
     * Creates a new {@link PanelUser panel user} with full access {@link Permission permissions} to all panel sections if the user does not exist
     * @param username The user's name
     * @param enabled {@code true} if the user should be enabled; {@code false} otherwise
     * @return The fitting {@link PanelMessage panel message}
     * @see PanelUser#create(String, Permission, boolean) User Creation
     * @see PanelUser#LookupByUsername(String) exists
     */
    public static PanelMessage createNewUser(String username, Boolean enabled) {
        return createNewUser(username, PanelUserHandler.getFullAccessPermissions(), enabled);
    }

    /**
     * Creates a new {@link PanelUser panel user} if the user does not exist
     * @param username The user's name
     * @param permission The user's {@link Permission#getDisplayName() permissions display name}
     * @param enabled {@code true} if the user should be enabled; {@code false} otherwise
     * @return The fitting {@link PanelMessage panel message}
     * @see PanelUser#create(String, Permission, boolean) User Creation
     * @see PanelUser#LookupByUsername(String) exists
     */
    public static PanelMessage createNewUser(String username, JSONArray jsoPermissions, Boolean enabled) {
        return createNewUser(username, getPermissionsFromJSON(jsoPermissions), enabled);
    }

    /**
     * Creates a new {@link PanelUser panel user} if the user does not exist
     * @param username The user's name
     * @param permission The user's {@link Permission permissions}
     * @param enabled {@code true} if the user should be enabled; {@code false} otherwise
     * @return The fitting {@link PanelMessage panel message}
     * @see PanelUser#create(String, Permission, boolean) User Creation
     * @see PanelUser#LookupByUsername(String) exists
     */
    public static PanelMessage createNewUser(String username, Map<String, Permission> permissions, Boolean enabled) {
        PanelUser user = PanelUser.LookupByUsername(username);
        if (user != null) {
            return PanelMessage.UserAlreadyExists;
        }
        String password = PanelUser.create(username, permissions, enabled);
        return PanelMessage.Success.setResponse(password);
    }

    /**
     * Deletes a {@link PanelUser panel user}
     * <br /><br />
     * Only existing and {@link PanelUser#canBeEdited() editable} {@link PanelUser panel users} can be deleted
     * @param username The user's name which should be deleted
     * @return The fitting {@link PanelMessage panel message}
     * @see PanelUser#delete() User deletion
     * @see PanelUser#LookupByUsername(String) exists
     */
    public static PanelMessage deleteUser(String username) {
        PanelUser user = PanelUser.LookupByUsername(username);
        if (user == null) {
            return PanelMessage.UserNotFound;
        }
        if (!user.canBeEdited()){
            return PanelMessage.UserIsConfig;
        }
        if(!user.delete()) {
            return PanelMessage.SaveError;
        }
        return PanelMessage.Success.setResponse("User successfully deleted");
    }

    private static Map<String, Permission> getPermissionsFromJSON(JSONArray jsoPermissions) {
        Map<String, Permission> permissions = new HashMap<>();
        if (jsoPermissions == null) {
            return permissions;
        }
        for (int i = 0; i < jsoPermissions.length(); i++) {
            JSONObject permissionObj = jsoPermissions.getJSONObject(i);
            String section = permissionObj.getString("section");
            Permission permission = Permission.getByName(permissionObj.getString("permission"));
            permissions.put(section, permission);
        }
        return permissions;
    }

    /**
     * Changes a {@link PanelUser panel user's} properties
     * <br /><br />
     * Only existing and {@link PanelUser#canBeEdited() editable} {@link PanelUser panel users} can be deleted
     * @param currentUsername The user's name which should be edited
     * @param newUsername The user's new name; {@code null} to not change the username
     * @param permission The user's new {@link Permission permissions}; {@code null} to not change the {@link Permission permission}
     * @param enabled {@code true} to enable the user; {@code false} to disable the user
     * @return The fitting {@link PanelMessage panel message}
     * @see PanelUser#LookupByUsername(String) exists
     */
    public static PanelMessage editUser(String currentUsername, String newUsername, JSONArray jsoPermissions, boolean enabled) {
        return editUser(currentUsername, newUsername, getPermissionsFromJSON(jsoPermissions), enabled);
    }

    /**
     * Changes a {@link PanelUser panel user's} properties
     * <br /><br />
     * Only existing and {@link PanelUser#canBeEdited() editable} {@link PanelUser panel users} can be deleted
     * @param currentUsername The user's name which should be edited
     * @param newUsername The user's new name; {@code null} to not change the username
     * @param permission The user's new {@link Permission permission}; {@code null} to not change the {@link Permission permissions}
     * @param enabled {@code true} to enable the user; {@code false} to disable the user
     * @return The fitting {@link PanelMessage panel message}
     * @see PanelUser#LookupByUsername(String) exists
     */
    public static PanelMessage editUser(String currentUsername, String newUsername, Map<String, Permission> permissions, boolean enabled) {
        PanelUser user = PanelUser.LookupByUsername(currentUsername);
        if (user == null) {
            return PanelMessage.UserNotFound;
        }
        if (!user.canBeEdited()){
            return PanelMessage.UserIsConfig;
        }
        if(newUsername != null && !currentUsername.equals(newUsername)){
            if (PanelUser.LookupByUsername(newUsername) != null) {
                return PanelMessage.UserAlreadyExists;
            }
            user.changeUsername(newUsername);
        }
        if (permissions != null && !permissions.isEmpty()) {
            user.setPermission(permissions);
        }
        user.setEnabled(enabled);
        if (!user.save()) {
            return PanelMessage.SaveError;
        }
        return PanelMessage.Success.setResponse("User successfully edited");
    }

    /**
     * Resets a {@link PanelUser panel user's} password
     * <br /><br />
     * Only existing and {@link PanelUser#canBeEdited() editable} {@link PanelUser panel users} can have their passwords reset
     * @param username The user's name who's password should be reset
     * @return The new random password
     * @see PanelUser#LookupByUsername(String) exists
     * @see PanelUser#generateNewPassword() password generation
     */
    public static PanelMessage resetPassword(String username) {
        PanelUser user = PanelUser.LookupByUsername(username);
        if (user == null) {
            return PanelMessage.UserNotFound;
        }
        if (!user.canBeEdited()){
            return PanelMessage.UserIsConfig;
        }

        String password = user.generateNewPassword();
        if (!user.save()) {
            return PanelMessage.SaveError;
        }
        return PanelMessage.Success.setResponse(password);
    }

    private static List<PanelUser> getAllUsers() {
        DataStore datastore = PhantomBot.instance().getDataStore();
        List<PanelUser> users = new ArrayList<>();
        if (!datastore.FileExists(PANEL_USER_TABLE)) {
            return users;
        }

        String[] keys = datastore.GetKeyList(PANEL_USER_TABLE, "");
        for (String key : keys) {
            users.add(PanelUser.LookupByUsername(key));
        }

        return users;
    }

    /**
     * Adds the {@link PanelUser panel users} safe properties (username, isEnabled, {@link Permission permissions}, creationDate, lastLogin) as an array to an {@link JSONStringer JSONStringer} instance
     * @param jsonObject The {@link JSONStringer JSONStringer} instance to which the array should be added to
     * @see PanelUser#getUsername() username
     * @see PanelUser#isEnabled() isEnabled
     * @see PanelUser#getPermission() permissions
     * @see PanelUser#getCreationDate() creationDate
     * @see PanelUser#getLastLogin() lastLogin
     */
    public static void getAllUsersJSONObject(JSONStringer jsonObject) {
        jsonObject.array();
        for (PanelUser user : getAllUsers()) {
            jsonObject.object()
                .key("username").value(user.getUsername())
                .key("isEnabled").value(user.isEnabled())
                .key("canManageUsers").value(user.canManageUsers())
                .key("permission").value(user.getPermissionsToJSON(true))
                .key("creationDate").value(user.getCreationDate())
                .key("lastLogin").value(user.getLastLogin())
                .endObject();
        }
        jsonObject.endArray();
    }

    /**
     * Adds the {@link Permission permissions} as an array to an {@link JSONStringer JSONStringer} instance
     * @param jsonObject The {@link JSONStringer JSONStringer} instance to which the {@link Permission permissions} array should be added to
     */
    public static void getPermissionsJSONObject(JSONStringer jsonObject) {
        jsonObject.array();
        for (Permission perm : Permission.values()) {
            jsonObject.object()
                .key("id").value(perm.getValue())
                .key("permission").value(perm.getDisplayName())
                .endObject();
        }
        jsonObject.endArray();
    }

    /**
     * Adds the {@link PanelUser panel user's} safe properties (username, isEnabled, {@link Permission permissions}, hasSetPassword, {@link PanelUser.Type userType) as an array to an {@link JSONStringer JSONStringer} instance
     * @param username The user's name which properties should be returned
     * @param jsonObject The {@link JSONStringer JSONStringer} instance to which the user's properties should be added to
     * @see PanelUser#getUsername() username
     * @see PanelUser#isEnabled() isEnabled
     * @see PanelUser#getPermission() permissions
     * @see PanelUser#hasSetPassword() hasSetPassword
     * @see PanelUser#getUserType() userType
     */
    public static void getUserJSONObject(String username, JSONStringer jsonObject) {
        PanelUser user = PanelUser.LookupByUsername(username);
        if (user == null) {
            jsonObject.object().key(PanelMessage.UserNotFound.getJSONkey()).value(PanelMessage.UserNotFound.getMessage()).endObject();
        }
        jsonObject.object().key("username").value(user.getUsername())
                            .key("isEnabled").value(user.isEnabled())
                            .key("canManageUsers").value(user.canManageUsers())
                            .key("permission").value(user.getPermissionsToJSON(true))
                            .key("hasSetPassword").value(user.hasSetPassword())
                            .key("userType").value(user.getUserType().toString())
                            .endObject();
    }

    /**
     * Adds the available {@link PANEL_SECTIONS panel sections} as an array to an {@link JSONStringer JSONStringer} instance
     * @param jsonObject The {@link JSONStringer JSONStringer} instance to which the {@link PANEL_SECTIONS panel sections} should be added to
     */
    public static void getAllPanelSectionsJSONObject(JSONStringer jsonObject) {
        jsonObject.array();
        for (String section : PANEL_SECTIONS) {
            if (!PhantomBot.instance().hasDiscordToken() && section.equalsIgnoreCase("discord")) {
                continue;
            }
            jsonObject.value(section);
        }
        jsonObject.endArray();
    }
    
    /**
     * Gets a permissions map which includes full permission to all available {@link PANEL_SECTIONS panel sections}
     */
    public static Map<String, Permission> getFullAccessPermissions() {
        Map<String, Permission> permissions = new HashMap<>();
        for (String section : PANEL_SECTIONS) {
            if (!PhantomBot.instance().hasDiscordToken() && section.equalsIgnoreCase("discord")) {
                continue;
            }
            permissions.put(section, Permission.READ_WRITE);
        }
        return permissions;
    }

     /**
     * Checks if a user is allowed to access a database table
     * @param user The {@link Paneluser user}
     * @param tablename The tableName to be checked
     * @param section The {@link PANEL_SECTIONS panel section} on which this request was created
     * @param isWriteAction Indicates if the action is an action requiring {@link Permission.READ_WRITE write permissions}
     * @return {@code true} if the user is allowed to access the table under the conditions; {@code false} otherwise
     */
    public static boolean checkPanelUserDatabaseAccess(PanelUser user, String tableName, String section, boolean isWriteAction) {
        com.gmt2001.Console.out.println("check table: " + tableName.toLowerCase() + " in section: " + section.toLowerCase() + " is read_write: " + isWriteAction);
        tableName = tableName.toLowerCase();
        if (!isWriteAction && READ_ONLY_TABLES.contains(tableName)) {
            com.gmt2001.Console.out.println("check table: allowed is read_only table");
            return true;
        }
        boolean res = checkPanelUserSectionAccess(user, section, isWriteAction);
        com.gmt2001.Console.out.println("check table is allowed: " + res);
        com.gmt2001.Console.err.println("Database access denied on table " + tableName + " for user " + user.getUsername());
        return res;
    }

    /**
     * Checks if a user is allowed send websocket events to a specific script
     * @param user The {@link Paneluser user}
     * @param script The script path being accessed
     * @param section The {@link PANEL_SECTIONS panel section} on which this request was created
     * @return {@code true} if the user is allowed to access the table under the conditions; {@code false} otherwise
     */
    public static boolean checkPanelUserScriptAccess(PanelUser user, String script, String section) {
        com.gmt2001.Console.out.println("check script: " + script.toLowerCase() + " in section: " + section.toLowerCase());
        if (user.getUserType() == PanelUser.Type.CONFIG) {
            com.gmt2001.Console.out.println("check script: allowed is config user");
            return true;
        }
        script = script.toLowerCase();
        if (script.equalsIgnoreCase("donationcache.java")) {
            com.gmt2001.Console.out.println("check script: denied is donationcache");
            com.gmt2001.Console.err.println("Script access denied to script " + script + " for user " + user.getUsername());
            return false;
        }
        section = section.toLowerCase();
        if (section.equalsIgnoreCase("dashboard")) {
            com.gmt2001.Console.out.println("check script: allowed is dashboard");
            return true;
        }
        boolean res = PANEL_SECTION_SCRIPTS.containsKey(section) && PANEL_SECTION_SCRIPTS.get(section).contains(script) && checkPanelUserSectionAccess(user, section, true);
        com.gmt2001.Console.out.println("check script is allowed: " + res);
        com.gmt2001.Console.err.println("Script access denied to script " + script + " for user " + user.getUsername());
        return res;
    }

    /**
     * Checks if a user has to access a {@link PANEL_SECTIONS panel section}
     * @param user The {@link Paneluser user}
     * @param section The {@link PANEL_SECTIONS panel section} on which this request was created
     * @param isWriteAction Indicates if the action is an action requiring {@link Permission.READ_WRITE write permissions}
     * @return {@code true} if the user is allowed to access the table under the conditions; {@code false} otherwise
     */
    public static boolean checkPanelUserSectionAccess(PanelUser user, String section, boolean isWriteAction) {
        com.gmt2001.Console.out.println("check section: " + section.toLowerCase() + " is read_write: " + isWriteAction);
        if (user.getUserType() == PanelUser.Type.CONFIG) {
            com.gmt2001.Console.out.println("check section: allowed is config user");
            return true;
        }
        section = section.toLowerCase();

        if (!isWriteAction && user.getPermission().containsKey(section)
            && (user.getPermission().get(section).equals(Permission.READ_ONLY)|| user.getPermission().get(section).equals(Permission.READ_WRITE))) {
                com.gmt2001.Console.out.println("check section: allowed is read_only");
            return true;
        }
        if (isWriteAction && user.getPermission().containsKey(section)
            && user.getPermission().get(section).equals(Permission.READ_WRITE)) {
                com.gmt2001.Console.out.println("check section: allowed is read_write");
            return true;
        }
        com.gmt2001.Console.out.println("check section: denied");
        com.gmt2001.Console.err.println("Section access denied on section " + section + " for user " + user.getUsername());
        return false;
    }

    /**
     * Checks if a user is allowed to send a command to the bots modules
     * @param user The {@link Paneluser user}
     * @param command The command which has been sent by the user through the panel
     * @param section The {@link PANEL_SECTIONS panel section} on which this request was created
     * @return {@code true} if the user is allowed to access the table under the conditions; {@code false} otherwise
     */
    public static boolean checkPanelUserCommandAccess(PanelUser user, String command, String section) {
        if (READ_ONLY_COMMANDS.contains(command.split(" ")[0])) {
            return checkPanelUserSectionAccess(user, section, false);
        }
        return checkPanelUserSectionAccess(user, section, true);
    }
}
