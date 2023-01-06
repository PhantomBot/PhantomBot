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
package tv.phantombot;

import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.util.function.Supplier;
import org.apache.commons.lang3.SystemUtils;

public class ConfigurationManager {

    private static final String BOTLOGIN_TXT_LOCATION = "./config/botlogin.txt";
    private static final String OUAUTH_PREFIX = "oauth:";

    public static final String PROP_ENVOVERRIDE = "ENVOVERRIDE";

    public static final String PROP_BASEPORT = "baseport";
    public static final String PROP_USEHTTPS = "usehttps";
    public static final String PROP_WEBENABLE = "webenable";
    public static final String PROP_MUSICENABLE = "musicenable";
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
    public static final String PROP_USEROLLBAR = "userollbar";
    private static boolean newSetup = false;
    private static boolean setupStarted = false;

    private ConfigurationManager() {
        // private constructor to prevent users from instantiating a pure static class
    }

    static CaselessProperties getConfiguration() {
        /* Properties configuration */
        CaselessProperties startProperties = CaselessProperties.instance();
        startProperties.clear();

        /* Indicates that the botlogin.txt file should be overwritten/created. */
        boolean changed = false;

        /* Load up the bot info from the bot login file */
        try {
            if (new File(BOTLOGIN_TXT_LOCATION).exists()) {
                try ( FileInputStream inputStream = new FileInputStream(BOTLOGIN_TXT_LOCATION)) {
                    startProperties.load(inputStream);
                }
            }
        } catch (IOException ex) {
            com.gmt2001.Console.err.printStackTrace(ex);
        }

        /* Load up the bot info from the environment */
        String prefix = "PHANTOMBOT_";
        boolean envOverrides = System.getenv().containsKey(prefix + PROP_ENVOVERRIDE)
                && (System.getenv(prefix + PROP_ENVOVERRIDE).equalsIgnoreCase("true") || System.getenv(prefix + PROP_ENVOVERRIDE).equals("1"));
        System.getenv().entrySet().forEach((v) -> {
            String key = v.getKey().toUpperCase();
            String value = v.getValue();
            if (key.startsWith(prefix) && prefix.length() < key.length() && !key.equals(prefix + PROP_ENVOVERRIDE)) {
                key = key.substring(prefix.length()).toLowerCase();
                if (envOverrides) {
                    startProperties.setProperty(key, value);
                } else {
                    startProperties.putIfAbsent(key, value);
                }
            }
        });

        changed |= generateDefaultValues(startProperties);

        /* Make a new botlogin with the botName, oauth or channel is not found */
        if (startProperties.getProperty(PROP_CHANNEL, "").isBlank() && startProperties.getProperty(PROP_OAUTH, "").isBlank()) {
            newSetup = true;
        }

        changed |= correctCommonErrors(startProperties);

        /*
         * Iterate the properties and delete entries for anything that does not have a
         * value.
         */
        changed = startProperties.stringPropertyNames().stream().map((propertyKey) -> startProperties.remove(propertyKey, "")).reduce(changed, (accumulator, _item) -> accumulator | _item);

        if (!startProperties.getPropertyAsBoolean("allownonascii", false)) {
            for (String propertyKey : startProperties.stringPropertyNames()) {
                String olds = startProperties.getProperty(propertyKey, "");
                String news = olds.codePoints().filter(x -> x >= 32 || x <= 126).collect(StringBuilder::new, StringBuilder::appendCodePoint, StringBuilder::append).toString();

                if (!olds.equals(news)) {
                    startProperties.setProperty(propertyKey, news);
                    changed = true;
                }
            }
        }

        /* Check to see if anything changed */
        if (changed) {
            startProperties.store(false);
        }

        // fresh setup indicator should not be saved
        startProperties.setProperty("newSetup", newSetup ? "true" : "false");

        return startProperties;
    }

    public static boolean newSetup() {
        return newSetup;
    }

    public static boolean setupStarted() {
        return setupStarted;
    }

    private static boolean generateDefaultValues(CaselessProperties startProperties) {
        boolean changed = false;

        changed |= setDefaultIfMissing(startProperties, PROP_BASEPORT, "25000", "Set default baseport");
        changed |= setDefaultIfMissing(startProperties, PROP_USEHTTPS, "true", "Set default usehttps");
        changed |= setDefaultIfMissing(startProperties, PROP_WEBENABLE, "true", "Set default webenable");
        changed |= setDefaultIfMissing(startProperties, PROP_MUSICENABLE, "true", "Set default musicenable");

        changed |= setDefaultIfMissing(startProperties, PROP_USEROLLBAR, "true", "Enabled Rollbar");

        /* Check to see if there's a webOauth set */
        changed |= setDefaultIfMissing(startProperties, PROP_WEBAUTH, ConfigurationManager::generateWebAuth, "New webauth key has been generated for " + BOTLOGIN_TXT_LOCATION);
        /* Check to see if there's a webOAuthRO set */
        changed |= setDefaultIfMissing(startProperties, PROP_WEBAUTH_RO, ConfigurationManager::generateWebAuth, "New webauth read-only key has been generated for " + BOTLOGIN_TXT_LOCATION);
        /* Check to see if there's a youtubeOAuth set */
        changed |= setDefaultIfMissing(startProperties, PROP_YTAUTH, ConfigurationManager::generateWebAuth, "New YouTube websocket key has been generated for " + BOTLOGIN_TXT_LOCATION);
        /* Check to see if there's a youtubeOAuthThro set */
        changed |= setDefaultIfMissing(startProperties, PROP_YTAUTH_RO, ConfigurationManager::generateWebAuth, "New YouTube read-only websocket key has been generated for " + BOTLOGIN_TXT_LOCATION);
        return changed;
    }

    private static boolean correctCommonErrors(CaselessProperties startProperties) {
        boolean changed = false;

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
        if (startProperties.getProperty(PROP_CHANNEL) != null && startProperties.getProperty(PROP_CHANNEL).startsWith("#")) {
            startProperties.setProperty(PROP_CHANNEL, startProperties.getProperty(PROP_CHANNEL).substring(1));
            changed = true;
        } else if (startProperties.getProperty(PROP_CHANNEL) != null && startProperties.getProperty(PROP_CHANNEL).contains(".tv")) {
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

    /**
     * Sets a default value to a properties object if the requested property does not exist
     *
     * @param properties the properties object to be modified
     * @param propertyName the name of the property, which should be set if null
     * @param defaultValue the default value, to which the property is set, if the property is missing in the properties object
     * @param setMessage the message which will be printed if the value is set to the given default value
     * @return if the value is already present in the properties object
     */
    private static boolean setDefaultIfMissing(CaselessProperties properties, String propertyName, String defaultValue, String generatedMessage) {
        return setDefaultIfMissing(properties, propertyName, () -> defaultValue, generatedMessage);
    }

    /**
     * Sets a default value to a properties object if the requested property does not exist
     *
     * @param properties the properties object to be modified
     * @param propertyName the name of the property, which should be generated if null
     * @param defaultValueGenerator the generating function, which generates the default value, if the property is missing in the properties object
     * @param generatedMessage the message which will be printed if the value is generated
     * @return if the value is already present in the properties object and does not have to be generated
     */
    private static boolean setDefaultIfMissing(CaselessProperties properties, String propertyName, Supplier<String> defaultValueGenerator, String generatedMessage) {
        boolean changed = false;
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
     * @return the value of the property. If parsing the value to a boolean fails, the default value is returned.
     */
    public static boolean getBoolean(CaselessProperties properties, String propertyName, boolean defaulValue) {
        return properties.getPropertyAsBoolean(propertyName, defaulValue);
    }

    static void doSetup() {
        setupStarted = true;
        if (!newSetup) {
            return;
        }

        // Spacers
        com.gmt2001.Console.out.println();
        com.gmt2001.Console.out.println();
        com.gmt2001.Console.out.println();
        // Welcome
        com.gmt2001.Console.out.println("Welcome to the PhantomBot setup process!");
        com.gmt2001.Console.out.println("If you have any issues please join our Discord!");
        com.gmt2001.Console.out.println("Discord: https://discord.gg/YKvMd78");
        com.gmt2001.Console.out.println();
        com.gmt2001.Console.out.println();

        // OS guide links
        if (RepoVersion.isDocker()) {
            com.gmt2001.Console.out.println("PhantomBot has detected that your device is running Docker");
            com.gmt2001.Console.out.println("We recommend using our official docker-compose.yml to setup the container:");
            com.gmt2001.Console.out.println("    https://github.com/PhantomBot/PhantomBot/blob/master/docker-compose.yml");
            com.gmt2001.Console.out.println();
            com.gmt2001.Console.out.println("Please see the comments at the top of the file for the command to run it");
            com.gmt2001.Console.out.println();
            com.gmt2001.Console.out.println("For automatic updates, see the comments at the top of the file");
            com.gmt2001.Console.out.println("    for enabling the ouroboros profile");
            com.gmt2001.Console.out.println();
            com.gmt2001.Console.out.println("To customize the settings within the file, see the comments throughout the file");
        } else if (SystemUtils.IS_OS_WINDOWS) {
            com.gmt2001.Console.out.println("PhantomBot has detected that your device is running Windows");
            com.gmt2001.Console.out.println("Here's the setup guide for Windows:");
            com.gmt2001.Console.out.println("    https://phantombot.dev/guides/#guide=content/setupbot/windows");
        } else if (SystemUtils.IS_OS_LINUX) {
            com.gmt2001.Console.out.println("PhantomBot has detected that your device is running Linux");
            com.gmt2001.Console.out.println("Here's the setup guide for Ubuntu:");
            com.gmt2001.Console.out.println("    https://phantombot.dev/guides/#guide=content/setupbot/ubuntu");
            com.gmt2001.Console.out.println("Here's the setup guide for CentOS:");
            com.gmt2001.Console.out.println("    https://phantombot.dev/guides/#guide=content/setupbot/centos");
        } else if (SystemUtils.IS_OS_MAC) {
            com.gmt2001.Console.out.println("PhantomBot has detected that your device is running macOS");
            com.gmt2001.Console.out.println("Here's the setup guide for macOS:");
            com.gmt2001.Console.out.println("    https://phantombot.dev/guides/#guide=content/setupbot/macos");
        } else if (SystemUtils.IS_OS_FREE_BSD || SystemUtils.IS_OS_NET_BSD || SystemUtils.IS_OS_OPEN_BSD) {
            com.gmt2001.Console.out.println("PhantomBot has detected that your device is running BSD");
            com.gmt2001.Console.out.println("Sorry, we do not have any setup guides for this OS");
            com.gmt2001.Console.out.println("It is probably similar to one of the Linux OSes, but may require tweaks");
            com.gmt2001.Console.out.println("Here's the setup guide for Ubuntu:");
            com.gmt2001.Console.out.println("    https://phantombot.dev/guides/#guide=content/setupbot/ubuntu");
            com.gmt2001.Console.out.println("Here's the setup guide for CentOS:");
            com.gmt2001.Console.out.println("    https://phantombot.dev/guides/#guide=content/setupbot/centos");
            com.gmt2001.Console.out.println("If you are having trouble figuring it out, join Discord and someone will");
            com.gmt2001.Console.out.println("  try to help");
        } else if (SystemUtils.IS_OS_UNIX) {
            com.gmt2001.Console.out.println("PhantomBot has detected that your device is running Unix");
            com.gmt2001.Console.out.println("Sorry, we do not have any setup guides for this OS");
            com.gmt2001.Console.out.println("It is probably similar to one of the Linux OSes, but may require tweaks");
            com.gmt2001.Console.out.println("Here's the setup guide for Ubuntu:");
            com.gmt2001.Console.out.println("    https://phantombot.dev/guides/#guide=content/setupbot/ubuntu");
            com.gmt2001.Console.out.println("Here's the setup guide for CentOS:");
            com.gmt2001.Console.out.println("    https://phantombot.dev/guides/#guide=content/setupbot/centos");
            com.gmt2001.Console.out.println("If you are having trouble figuring it out, join Discord and someone will");
            com.gmt2001.Console.out.println("  try to help");
        } else {
            com.gmt2001.Console.out.println("PhantomBot is not able to detect your OS type");
            com.gmt2001.Console.out.println("Sorry, we do not have any setup guides for this OS");
            com.gmt2001.Console.out.println("If you are having trouble figuring it out, join Discord and someone will");
            com.gmt2001.Console.out.println("  try to help");
        }

        // Contribute
        com.gmt2001.Console.out.println();
        com.gmt2001.Console.out.println("See an issue with the setup guide for your OS? We welcome all contributies via GitHub:");
            com.gmt2001.Console.out.println("    https://github.com/PhantomBot/PhantomBot");

        // Webserver info
        com.gmt2001.Console.out.println();
        com.gmt2001.Console.out.println();
        com.gmt2001.Console.out.println("The default URL for the bots webserver is http://localhost:" + CaselessProperties.instance().getPropertyAsInt("baseport", 25000));
        com.gmt2001.Console.out.println();
        com.gmt2001.Console.out.println("If you are hosting the bot remotely, please substitute \"localhost\" with the");
        com.gmt2001.Console.out.println("    appropriate IP address, hostname, or domain name");
        com.gmt2001.Console.out.println("NOTE: The \":" + CaselessProperties.instance().getPropertyAsInt("baseport", 25000) + "\" part is still needed at the end");
        com.gmt2001.Console.out.println("For example, \"http://coolstreamer.tv:" + CaselessProperties.instance().getPropertyAsInt("baseport", 25000) + "\"");
        com.gmt2001.Console.out.println();
        com.gmt2001.Console.out.println();
        com.gmt2001.Console.out.println("NOTE: Due to automatic self-signed SSL being enabled by default, your browser may");
        com.gmt2001.Console.out.println("    complain about an insecure connection");
        com.gmt2001.Console.out.println("This error appears because a global certificate authority has not verified");
        com.gmt2001.Console.out.println("    the self-signed certificate");
        com.gmt2001.Console.out.println("It is safe to use the buttons provided by the browser to continue anyway");
        com.gmt2001.Console.out.println();
        com.gmt2001.Console.out.println("On Firefox: ");
        com.gmt2001.Console.out.println("    Message title: \"Warning: Potential Security Risk Ahead\"");
        com.gmt2001.Console.out.println("    To continue: Click \"Advanced...\", then click \"Accept the Risk and Continue\"");
        com.gmt2001.Console.out.println();
        com.gmt2001.Console.out.println("On Chrome/Edge: ");
        com.gmt2001.Console.out.println("    Message title: \"Your connection is not private\"");
        com.gmt2001.Console.out.println("    To continue: Click \"Advanced\", then click \"Proceed to localhost (unsafe)\"");
        com.gmt2001.Console.out.println("    NOTE: If you are hosting remotely, \"localhost\" in the above proceed link will");
        com.gmt2001.Console.out.println("    be substituted with the appropriate IP address, hostname, or domain name");
        com.gmt2001.Console.out.println();
        com.gmt2001.Console.out.println();
        com.gmt2001.Console.out.println("The current panel username is: " + CaselessProperties.instance().getProperty("paneluser", "panel"));
        com.gmt2001.Console.out.println("The current panel password is: " + CaselessProperties.instance().getProperty("panelpassword", ""));
        com.gmt2001.Console.out.println();
        com.gmt2001.Console.out.println();

        // Bot Setup page steps
        int step = 0;
        com.gmt2001.Console.out.println("Please perform these steps for first run setup:");
        com.gmt2001.Console.out.println();
        com.gmt2001.Console.out.println(++step + ". From the webserver homepage, click the \"Bot Setup\" button and login with");
        com.gmt2001.Console.out.println("    the credentials above");
        com.gmt2001.Console.out.println(++step + ". In the \"Admin\" section, set the radio button for \"channel\" to the right,");
        com.gmt2001.Console.out.println("    enabling the textbox");
        com.gmt2001.Console.out.println(++step + ". In the textbox, fill in the name of the Twitch channel the bot will join");
        com.gmt2001.Console.out.println(++step + ". (Optional) Expand the \"Panel Login\" section and change the login credentials");
        com.gmt2001.Console.out.println("    for the bots webserver");
        com.gmt2001.Console.out.println("  NOTE: All other sections are completely optional, we recommend finishing initial");
        com.gmt2001.Console.out.println("        setup first and then returning to them later");
        com.gmt2001.Console.out.println("  NOTE: If you change the values in some of the other sections, you may have to");
        com.gmt2001.Console.out.println("          restart the bot for them to take effect");
        com.gmt2001.Console.out.println("        A restart is NOT required if only changing the values specified above for");
        com.gmt2001.Console.out.println("          initial setup");
        com.gmt2001.Console.out.println(++step + ". Click the \"Save\" button at the top of the page, ensure a green success bar appears");
        com.gmt2001.Console.out.println(++step + ". Click the PhantomBot logo in the top-left to return to the homepage");

        // OAuth Setup page steps
        com.gmt2001.Console.out.println(++step + ". From the webserver homepage, click the \"OAuth Setup\" button and login with");
        com.gmt2001.Console.out.println("    the credentials above");
        com.gmt2001.Console.out.println("  NOTE: If you changed the credentials in the \"Panel Login\" section, use the");
        com.gmt2001.Console.out.println("          new credentials you created instead");
        com.gmt2001.Console.out.println(++step + ". Follow the instructions on the page in order");
        com.gmt2001.Console.out.println("  NOTE: The \"Connect With Twitch Bot\" button sets up the Bot account");
        com.gmt2001.Console.out.println("        This is the account that will send messages to chat");
        com.gmt2001.Console.out.println("        Please ensure the correct account is selected at the top of the Twitch");
        com.gmt2001.Console.out.println("          authorization page");
        com.gmt2001.Console.out.println("        For the account you would like the bot to appear as when it sends messages");
        com.gmt2001.Console.out.println("          to chat");
        com.gmt2001.Console.out.println();
        com.gmt2001.Console.out.println("  NOTE: The \"Connect With Twitch Broadcaster\" button sets up the Broadcaster/API");
        com.gmt2001.Console.out.println("          account");
        com.gmt2001.Console.out.println("        This is the account that will send requests to the API and login to");
        com.gmt2001.Console.out.println("          PubSub/EventSub");
        com.gmt2001.Console.out.println("        You can use a moderators account instead if required, but some features");
        com.gmt2001.Console.out.println("          may not work due to restrictions by Twitch. For example, Channel Points");
        com.gmt2001.Console.out.println("        Yes, we know that viewers on the website can see some of these events,");
        com.gmt2001.Console.out.println("          but Twitch puts higher restrictions on the APIs to mitigate bad actors");

        // Spacers
        com.gmt2001.Console.out.println();
        com.gmt2001.Console.out.println();
        com.gmt2001.Console.out.println();
    }

    /* gen a oauth */
    private static String generateWebAuth() {
        return PhantomBot.generateRandomString(30);
    }
}
