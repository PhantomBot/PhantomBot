package tv.phantombot.panel.PanelUser;

import java.util.ArrayList;
import java.util.Base64;
import java.util.List;
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
    protected static final String PANELUSERTABLE = "panelUsers";
    /**
     * Messages for use as responses to the web panel
     */
    public static enum PanelMessage {
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
         * General Error/Error placeholder
         */
        Error("", true),
        /**
         * General Success/Success placeholder
         */
        Success("Success",false);

        private String message;
        private boolean isError;
        private String JSONkey;

        private PanelMessage(String message, boolean isError) {
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
    public static enum Permission{
        /**
         * Full access
         */
        ADMINISTRATOR(1, "Full Access"),
        /**
         * Read only access
         */
        READ_ONLY(2, "Read Only");

        private int value;
        private String displayName;

        private Permission(int value, String displayName) {
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
            for (Permission b : Permission.values()) {
                if (b.getValue() == value) {
                    return b;
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
            for (Permission b : Permission.values()) {
                if (b.getDisplayName().equals(name)) {
                    return b;
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
        if (base64Token == null || base64Token.isEmpty()) {
            return false;
        }
        String userpass = new String(Base64.getDecoder().decode(base64Token));
        int colon = userpass.indexOf(':');
        if (colon < 0) {
            return false;
        }
        String username = userpass.substring(0, colon);
        String password = userpass.substring(colon + 1);
        return checkLogin(username, password, requestUri);
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
     * @param requestUri The requested uri
     * @return {@code true} if the user exists, is enabled and is allowed to access the uri; {@code false} otherwise
     * @see PanelUser#LookupByUsername(String) exists
     * @see PanelUser#isEnabled()
     */
    public static boolean checkLogin(String username, String password, String requestUri) {
        PanelUser user = PanelUser.LookupByUsername(username);
        if (user == null) {
            return false;
        }
        if (!user.isEnabled()) {
            return false;
        }
        if (requestUri != null && (requestUri.contains("/setup/") || requestUri.contains("/oauth/"))) {
            if (!user.isConfigUser()){
                return false;
            }
        }
        if (password.equals(user.getPassword())) {
            user.setLastLoginNOW();
            user.save();
            return true;
        }
        return false;
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
     * Creates a new {@link PanelUser panel user} if the user does not exist
     * @param username The user's name
     * @param permission The user's {@link Permission#getDisplayName() permission display name}
     * @param enabled {@code true} if the user should be enabled; {@code false} otherwise
     * @return The fitting {@link PanelMessage panel message}
     * @see PanelUser#create(String, Permission, boolean) User Creation
     * @see PanelUser#LookupByUsername(String) exists
     */
    public static PanelMessage createNewUser(String username, String permission, Boolean enabled) {
        return createNewUser(username, Permission.getByName(permission), enabled);
    }

    /**
     * Creates a new {@link PanelUser panel user} if the user does not exist
     * @param username The user's name
     * @param permission The user's {@link Permission permission}
     * @param enabled {@code true} if the user should be enabled; {@code false} otherwise
     * @return The fitting {@link PanelMessage panel message}
     * @see PanelUser#create(String, Permission, boolean) User Creation
     * @see PanelUser#LookupByUsername(String) exists
     */
    public static PanelMessage createNewUser(String username, Permission permission, Boolean enabled) {
        PanelUser user = PanelUser.LookupByUsername(username);
        if (user != null) {
            return PanelMessage.UserAlreadyExists;
        }
        String password = PanelUser.create(username, permission, enabled);
        return PanelMessage.Success.setResponse(password);
        /*user = PanelUser.create(username, permission, enabled);
        String password = user.generateNewPassword();
        if (!user.save()) {
            return PanelMessage.SaveError;
        }
        return PanelMessage.Success.setResponse(password);*/
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

    /**
     * Changes a {@link PanelUser panel user's} properties
     * <br /><br />
     * Only existing and {@link PanelUser#canBeEdited() editable} {@link PanelUser panel users} can be deleted
     * @param currentUsername The user's name which should be edited
     * @param newUsername The user's new name; {@code null} to not change the username
     * @param permission The user's new {@link Permission permission}; {@code null} to not change the {@link Permission permission}
     * @param enabled {@code true} to enable the user; {@code false} to disable the user
     * @return The fitting {@link PanelMessage panel message}
     * @see PanelUser#LookupByUsername(String) exists
     */
    public static PanelMessage editUser(String currentUsername, String newUsername, String permission, boolean enabled) {
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
        if (permission != null) {
            Permission perm = Permission.getByName(permission);
            user.setPermission(perm);
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
        List<PanelUser> users = new ArrayList<PanelUser>();
        if (!datastore.FileExists(PANELUSERTABLE)) {
            return users;
        }
           
        String[] keys = datastore.GetKeyList(PANELUSERTABLE, "");
        for (String key : keys) {
            users.add(PanelUser.LookupByUsername(key));
        }

        return users;
    }

    /**
     * Adds the {@link PanelUser panel users} safe properties (username, isEnabled, {@link Permission permission}, creationDate, lastLogin) as an array to an {@link JSONStringer JSONStringer} instance
     * @param jsonObject The {@link JSONStringer JSONStringer} instance to which the array should be added to
     * @see PanelUser#getUsername() username
     * @see PanelUser#isEnabled() isEnabled
     * @see PanelUser#getPermission() permission
     * @see PanelUser#getCreationDate() creationDate
     * @see PanelUser#getLastLogin() lastLogin
     */
    public static void getAllUsersJSONObject(JSONStringer jsonObject) {
        jsonObject.array();
        for (PanelUser user : getAllUsers()) {
            jsonObject.object()
                .key("username").value(user.getUsername())
                .key("isEnabled").value(user.isEnabled())
                .key("permission").value(user.getPermission().getDisplayName())
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
    public static void getPermissionsJSON(JSONStringer jsonObject) {
        jsonObject.array();
        for (Permission perm : Permission.values()) {
            jsonObject.object()
                .key("permission").value(perm.getDisplayName())
                .endObject();
        }
        jsonObject.endArray();
    }

    /**
     * Adds the {@link PanelUser panel user's} safe properties (username, isEnabled, {@link Permission permission}, hasSetPassword, {@link PanelUser.Type userType) as an array to an {@link JSONStringer JSONStringer} instance
     * @param username The user's name which properties should be returned
     * @param jsonObject The {@link JSONStringer JSONStringer} instance to which the user's properties should be added to
     * @see PanelUser#getUsername() username
     * @see PanelUser#isEnabled() isEnabled
     * @see PanelUser#getPermission() permission
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
                            .key("permission").value(user.getPermission().getDisplayName())
                            .key("hasSetPassword").value(user.hasSetPassword())
                            .key("userType").value(user.getUserType().toString())
                            .endObject();
    }
}
