package tv.phantombot;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.util.Arrays;
import java.util.Collections;
import java.util.Enumeration;
import java.util.Map.Entry;
import java.util.Properties;
import java.util.TreeSet;
import java.util.function.Supplier;

public class ConfigurationManager {

    private static final String BOTLOGIN_TXT_LOCATION = "./config/botlogin.txt";
    private static final String PANEL_STANDARD_USER = "panel";
    private static final String PANEL_STANDARD_PASSWORD = "panel";
    private static final String OUAUTH_PREFIX = "oauth:";

    public static final String PROP_BASEPORT = "baseport";
    public static final String PROP_USEHTTPS = "usehttps";
    public static final String PROP_WEBENABLE = "webenable";
    public static final String PROP_MSGLIMIT30 = "msglimit30";
    public static final String PROP_MUSICENABLE = "musicenable";
    public static final String PROP_WHISPERLIMIT60 = "whisperlimit60";
    public static final String PROP_OAUTH = "oauth";
    public static final String PROP_CHANNEL = "channel";
    public static final String PROP_OWNER = "owner";
    public static final String PROP_USER = "user";
    public static final String PROP_DEBUGON = "debugon";
    public static final String PROP_DEBUGLOG = "debuglog";
    public static final String PROP_RELOADSCRIPTS = "reloadscripts";
    public static final String PROP_RHINODEBUGGER = "rhinodebugger";
    public static final String PROP_WEBAUTH = "webauth";
    public static final String PROP_WEBAUTH_RO = "webauthro";
    public static final String PROP_PANEL_USER = "paneluser";
    public static final String PROP_PANEL_PASSWORD = "panelpassword";
    public static final String PROP_YTAUTH = "ytauth";
    public static final String PROP_YTAUTH_RO = "ytauthro";
    public static final String PROP_API_OAUTH = "apioauth";
    public static final String PROP_SILENTSCRIPTSLOAD = "silentscriptsload";

    private ConfigurationManager() {
        // private constructor to prevent users from instantiating a pure static class
    }

    static Properties getConfiguration() {
        /* List of properties that must exist. */
        String[] requiredProperties = new String[]{PROP_OAUTH, PROP_CHANNEL, PROP_OWNER, PROP_USER};
        String requiredPropertiesErrorMessage = "";

        /* Properties configuration */
        Properties startProperties = new Properties();

        /* Indicates that the botlogin.txt file should be overwritten/created. */
        Boolean changed = false;

        // Indicates that this is a fresh setup
        Boolean newSetup = false;

        /* Load up the bot info from the bot login file */
        try {
            if (new File(BOTLOGIN_TXT_LOCATION).exists()) {
                FileInputStream inputStream = new FileInputStream(BOTLOGIN_TXT_LOCATION);
                startProperties.load(inputStream);
                inputStream.close();
            } else {
                /*
                 * Fill in the Properties object with some default values. Note that some values
                 * are left unset to be caught in the upcoming logic to enforce settings.
                 */
                startProperties.setProperty(PROP_BASEPORT, "25000");
                startProperties.setProperty(PROP_USEHTTPS, "false");
                startProperties.setProperty(PROP_WEBENABLE, "true");
                startProperties.setProperty(PROP_MSGLIMIT30, "19.0");
                startProperties.setProperty(PROP_MUSICENABLE, "true");
                startProperties.setProperty(PROP_WHISPERLIMIT60, "60.0");
            }
        } catch (Exception ex) {
            com.gmt2001.Console.err.printStackTrace(ex);
        }
        /* Load up the bot info from the environment */
        for (Entry<String, String> v : System.getenv().entrySet()) {
            String prefix = "PHANTOMBOT_";
            String key = v.getKey().toUpperCase();
            String value = v.getValue();
            if (key.startsWith(prefix) && prefix.length() < key.length()) {
                key = key.substring(prefix.length()).toLowerCase();
                startProperties.setProperty(key, value);
            }
        }

        changed |= generateDefaultValues(startProperties);

        /* Make a new botlogin with the botName, oauth or channel is not found */
        if (startProperties.getProperty(PROP_USER) == null || startProperties.getProperty(PROP_OAUTH) == null || startProperties.getProperty(PROP_CHANNEL) == null) {
            doSetup(startProperties);
            changed = true;
            newSetup = true;
        }

        changed |= correctCommonErrors(startProperties);

        /*
         * Iterate the properties and delete entries for anything that does not have a
         * value.
         */
        for (String propertyKey : startProperties.stringPropertyNames()) {
            changed |= startProperties.remove(propertyKey, "");
        }

        /*
         * Check for required settings.
         */
        requiredPropertiesErrorMessage = String.join(" ", Arrays.stream(requiredProperties).filter(x -> startProperties.getProperty(x) == null).toArray(String[]::new));

        if (!requiredPropertiesErrorMessage.isEmpty()) {
            com.gmt2001.Console.err.println();
            com.gmt2001.Console.err.println("Missing Required Properties: " + requiredPropertiesErrorMessage);
            com.gmt2001.Console.err.println("Exiting PhantomBot");
            PhantomBot.exitError();
        }

        if (!startProperties.getProperty("allownonascii", "false").equalsIgnoreCase("true")) {
            for (String propertyKey : startProperties.stringPropertyNames()) {
                String olds = startProperties.getProperty(propertyKey);
                String news = olds.codePoints().filter(x -> x < 32 || x > 126).collect(StringBuilder::new, StringBuilder::appendCodePoint, StringBuilder::append).toString();

                if (!olds.equals(news)) {
                    startProperties.setProperty(propertyKey, news);
                    changed = true;
                }
            }
        }

        /* Check to see if anything changed */
        if (changed) {
            saveChanges(startProperties, BOTLOGIN_TXT_LOCATION);
        }

        // fresh setup indicator should not be saved
        startProperties.setProperty("newSetup", newSetup.toString());

        return startProperties;
    }

    private static Boolean generateDefaultValues(Properties startProperties) {
        Boolean changed = false;

        /* Check to see if there's a webOauth set */
        changed |= setDefaultIfMissing(startProperties, PROP_WEBAUTH, ConfigurationManager::generateWebAuth, "New webauth key has been generated for " + BOTLOGIN_TXT_LOCATION);
        /* Check to see if there's a webOAuthRO set */
        changed |= setDefaultIfMissing(startProperties, PROP_WEBAUTH_RO, ConfigurationManager::generateWebAuth, "New webauth read-only key has been generated for " + BOTLOGIN_TXT_LOCATION);
        /* Check to see if there's a panelUsername set */
        changed |= setDefaultIfMissing(startProperties, PROP_PANEL_USER, PANEL_STANDARD_USER,
                "No Panel Username, using default value of '" + PANEL_STANDARD_USER + "' for Control Panel and YouTube Player");
        /* Check to see if there's a panelPassword set */
        changed |= setDefaultIfMissing(startProperties, PROP_PANEL_PASSWORD, PANEL_STANDARD_PASSWORD,
                "No Panel Password, using default value of '" + PANEL_STANDARD_PASSWORD + "' for Control Panel and YouTube Player");
        /* Check to see if there's a youtubeOAuth set */
        changed |= setDefaultIfMissing(startProperties, PROP_YTAUTH, ConfigurationManager::generateWebAuth, "New YouTube websocket key has been generated for " + BOTLOGIN_TXT_LOCATION);
        /* Check to see if there's a youtubeOAuthThro set */
        changed |= setDefaultIfMissing(startProperties, PROP_YTAUTH_RO, ConfigurationManager::generateWebAuth, "New YouTube read-only websocket key has been generated for " + BOTLOGIN_TXT_LOCATION);
        return changed;
    }

    private static Boolean correctCommonErrors(Properties startProperties) {
        Boolean changed = false;

        /* Make sure the oauth has been set correctly */
        if (startProperties.getProperty(PROP_OAUTH) != null && !startProperties.getProperty(PROP_OAUTH).startsWith(OUAUTH_PREFIX) && !startProperties.getProperty(PROP_OAUTH).isEmpty()) {
            startProperties.setProperty(PROP_OAUTH, OUAUTH_PREFIX + startProperties.getProperty(PROP_OAUTH));
            changed = true;
        }

        /* Make sure the apiOAuth has been set correctly */
        if (startProperties.getProperty(PROP_API_OAUTH) != null && !startProperties.getProperty(PROP_API_OAUTH).startsWith(OUAUTH_PREFIX) && !startProperties.getProperty(PROP_API_OAUTH).isEmpty()) {
            startProperties.setProperty(PROP_API_OAUTH, OUAUTH_PREFIX + startProperties.getProperty(PROP_API_OAUTH));
            changed = true;
        }

        /* Make sure the channelName does not have a # */
        if (startProperties.getProperty(PROP_CHANNEL).startsWith("#")) {
            startProperties.setProperty(PROP_CHANNEL, startProperties.getProperty(PROP_CHANNEL).substring(1));
            changed = true;
        } else if (startProperties.getProperty(PROP_CHANNEL).contains(".tv")) {
            startProperties.setProperty(PROP_CHANNEL, startProperties.getProperty(PROP_CHANNEL).substring(startProperties.getProperty(PROP_CHANNEL).indexOf(".tv/") + 4).replaceAll("/", ""));
            changed = true;
        }

        /* Check for the owner after the channel check is done. */
        if (startProperties.getProperty(PROP_OWNER) == null && startProperties.getProperty(PROP_CHANNEL) != null && !startProperties.getProperty(PROP_CHANNEL).isEmpty()) {
            startProperties.setProperty(PROP_OWNER, startProperties.getProperty(PROP_CHANNEL));
            changed = true;
        }
        return changed;
    }

    private static void saveChanges(Properties properties, String saveFileDestination) {
        Properties outputProperties = new Properties() {
            private static final long serialVersionUID = 1L;

            @Override
            public synchronized Enumeration<Object> keys() {
                return Collections.enumeration(new TreeSet<>(super.keySet()));
            }
        };

        try {
            try (FileOutputStream outputStream = new FileOutputStream(saveFileDestination)) {
                outputProperties.putAll(properties);
                outputProperties.store(outputStream, "PhantomBot Configuration File");
            }
        } catch (IOException ex) {
            com.gmt2001.Console.err.printStackTrace(ex);
        }
    }

    /**
     * Sets a default value to a properties object if the requested property does not exist
     *
     * @param properties the properties object to be modified
     * @param propertyName the name of the property, which should be set if null
     * @param defaultValue the default value, to which the property is set, if the property is missing in the properties object
     * @param setMessage the message which will be printed if the value is set to the given default value
     * @return {@code true} if the value has been set to default, {@code false} if the value is already present in the properties object
     */
    private static Boolean setDefaultIfMissing(Properties properties, String propertyName, String defaultValue, String generatedMessage) {
        return setDefaultIfMissing(properties, propertyName, () -> defaultValue, generatedMessage);
    }

    /**
     * Sets a default value to a properties object if the requested property does not exist
     *
     * @param properties the properties object to be modified
     * @param propertyName the name of the property, which should be generated if null
     * @param defaultValueGenerator the generating function, which generates the default value, if the property is missing in the properties object
     * @param generatedMessage the message which will be printed if the value is generated
     * @return {@code true} if the value has been generated, {@code false} if the value is already present in the properties object and does not have
     * to be generated
     */
    private static Boolean setDefaultIfMissing(Properties properties, String propertyName, Supplier<String> defaultValueGenerator, String generatedMessage) {
        Boolean changed = false;
        if (properties.getProperty(propertyName) == null) {
            properties.setProperty(propertyName, defaultValueGenerator.get());
            com.gmt2001.Console.debug.println(generatedMessage);
            changed = true;
        }
        return changed;
    }

    /**
     * Gets a boolean value from the a properties object and prints a message according to the property name.
     *
     * @param properties the Properties object to get the boolean value from
     * @param propertyName the name of the property to get
     * @param defaulValue the default value of the property
     * @return the value of the property. If parsing the value to a Boolean fails, the default value is returned.
     */
    public static Boolean getBoolean(Properties properties, String propertyName, Boolean defaulValue) {
        Boolean result = defaulValue;
        try {
            result = Boolean.parseBoolean(properties.getProperty(propertyName));
        } catch (Exception e) {
            com.gmt2001.Console.err.printStackTrace(e);
            com.gmt2001.Console.err.println("[Error] could not load property '" + propertyName + "'. Fallback to default value (" + defaulValue + ")");
        }

        return result;
    }

    private static void doSetup(Properties startProperties) {
        try {

            com.gmt2001.Console.out.print("\r\n");
            com.gmt2001.Console.out.print("Welcome to the PhantomBot setup process!\r\n");
            com.gmt2001.Console.out.print("If you have any issues please report them on our forum, Tweet at us, or join our Discord!\r\n");
            com.gmt2001.Console.out.print("Forum: https://community.phantombot.tv/\r\n");
            com.gmt2001.Console.out.print("Documentation: https://docs.phantombot.tv/\r\n");
            com.gmt2001.Console.out.print("Twitter: https://twitter.com/PhantomBot/\r\n");
            com.gmt2001.Console.out.print("Discord: https://discord.gg/rkPqDuK/\r\n");
            com.gmt2001.Console.out.print("Support PhantomBot on Patreon: https://phantombot.tv/support/\r\n");
            com.gmt2001.Console.out.print("\r\n");

            final String os = System.getProperty("os.name").toLowerCase();

            // Detect Windows, MacOS, Linux or any other operating system.
            if (os.startsWith("win")) {
                com.gmt2001.Console.out.print("PhantomBot has detected that your device is running Windows.\r\n");
                com.gmt2001.Console.out.print("Here's the setup guide for Windows: https://community.phantombot.tv/t/windows-setup-guide/");
            } else if (os.startsWith("mac")) {
                com.gmt2001.Console.out.print("PhantomBot has detected that your device is running macOS.\r\n");
                com.gmt2001.Console.out.print("Here's the setup guide for macOS: https://community.phantombot.tv/t/macos-setup-guide/");
            } else {
                com.gmt2001.Console.out.print("PhantomBot has detected that your device is running Linux.\r\n");
                com.gmt2001.Console.out.print("Here's the setup guide for Ubuntu: https://community.phantombot.tv/t/ubuntu-16-04-lts-setup-guide/\r\n");
                com.gmt2001.Console.out.print("Here's the setup guide for CentOS: https://community.phantombot.tv/t/centos-7-setup-guide/");
            }

            com.gmt2001.Console.out.print("\r\n\r\n\r\n");

            // Bot name.
            do {
                com.gmt2001.Console.out.print("1. Please enter the bot's Twitch username: ");

                startProperties.setProperty("user", System.console().readLine().trim().toLowerCase());
            } while (startProperties.getProperty("user", "").length() <= 0);

            // Twitch oauth.
            do {
                com.gmt2001.Console.out.print("\r\n");
                com.gmt2001.Console.out.print("2. You will now need a OAuth token for the bot to be able to chat.\r\n");
                com.gmt2001.Console.out.print("Please note, this OAuth token needs to be generated while you're logged in into the bot's Twitch account.\r\n");
                com.gmt2001.Console.out.print("If you're not logged in as the bot, please go to https://twitch.tv/ and login as the bot.\r\n");
                com.gmt2001.Console.out.print("Get the bot's OAuth token here: https://twitchapps.com/tmi/\r\n");
                com.gmt2001.Console.out.print("Please enter the bot's OAuth token: ");

                startProperties.setProperty(PROP_OAUTH, System.console().readLine().trim());
            } while (startProperties.getProperty(PROP_OAUTH, "").length() <= 0);

            // api oauth.
            do {
                com.gmt2001.Console.out.print("\r\n");
                com.gmt2001.Console.out.print("3. You will now need your channel OAuth token for the bot to be able to change your title and game.\r\n");
                com.gmt2001.Console.out.print("Please note, this OAuth token needs to be generated while you're logged in into your caster account.\r\n");
                com.gmt2001.Console.out.print("If you're not logged in as the caster, please go to https://twitch.tv/ and login as the caster.\r\n");
                com.gmt2001.Console.out.print("Get the your OAuth token here: https://phantombot.tv/oauth/\r\n");
                com.gmt2001.Console.out.print("Please enter your OAuth token: ");

                startProperties.setProperty(PROP_API_OAUTH, System.console().readLine().trim());
            } while (startProperties.getProperty(PROP_API_OAUTH, "").length() <= 0);

            // Channel name.
            do {
                com.gmt2001.Console.out.print("\r\n");
                com.gmt2001.Console.out.print("4. Please enter the name of the Twitch channel the bot should join: ");

                startProperties.setProperty(PROP_CHANNEL, System.console().readLine().trim());
            } while (startProperties.getProperty(PROP_CHANNEL, "").length() <= 0);

            // Panel username.
            do {
                com.gmt2001.Console.out.print("\r\n");
                com.gmt2001.Console.out.print("5. Please enter a custom username for the web panel: ");

                startProperties.setProperty(PROP_PANEL_USER, System.console().readLine().trim());
            } while (startProperties.getProperty(PROP_PANEL_USER, "").length() <= 0);

            // Panel password.
            do {
                com.gmt2001.Console.out.print("\r\n");
                com.gmt2001.Console.out.print("6. Please enter a custom password for the web panel: ");

                startProperties.setProperty(PROP_PANEL_PASSWORD, System.console().readLine().trim());
            } while (startProperties.getProperty(PROP_PANEL_PASSWORD, "").length() <= 0);

            com.gmt2001.Console.out.print("\r\n");
            com.gmt2001.Console.out.print("PhantomBot will launch in 10 seconds.\r\n");
            com.gmt2001.Console.out.print("If you're hosting the bot locally you can access the control panel here: http://localhost:25000/panel \r\n");
            com.gmt2001.Console.out.print("If you're running the bot on a server, make sure to open the following ports: \r\n");
            com.gmt2001.Console.out.print("25000, 25003, and 25004. You have to change 'localhost' to your server ip to access the panel. \r\n");

            Thread.sleep(10000);

        } catch (InterruptedException ex) {
            com.gmt2001.Console.debug.println("Failed to sleep in setup: " + ex.getMessage());
            Thread.currentThread().interrupt();
        } catch (NullPointerException ex) {
            com.gmt2001.Console.err.printStackTrace(ex);
            com.gmt2001.Console.out.println("[ERROR] Failed to setup PhantomBot. Now exiting...");
            PhantomBot.exitError();
        }
    }

    /* gen a oauth */
    private static String generateWebAuth() {
        return PhantomBot.generateRandomString(30);
    }
}
