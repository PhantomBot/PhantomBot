package tv.phantombot;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.util.Collections;
import java.util.Enumeration;
import java.util.Properties;
import java.util.TreeSet;
import java.util.Map.Entry;

public class ConfigurationManager {
    static Properties getConfiguration()
    {
        /* List of properties that must exist. */
        String requiredProperties[] = new String[] { "oauth", "channel", "owner", "user" };
        String requiredPropertiesErrorMessage = "";
        
        /* Properties configuration */
        Properties startProperties = new Properties();
        
        /* Indicates that the botlogin.txt file should be overwritten/created. */
        Boolean changed = false;
        
        // Indicates that this is a fresh setup
        Boolean newSetup = false;
        
        /* Load up the bot info from the bot login file */
        try {
            if (new File("./config/botlogin.txt").exists()) {
                FileInputStream inputStream = new FileInputStream("./config/botlogin.txt");
                startProperties.load(inputStream);
                inputStream.close();
            } else {
                /* Fill in the Properties object with some default values. Note that some values are left
                 * unset to be caught in the upcoming logic to enforce settings.
                 */
                startProperties.setProperty("baseport", "25000");
                startProperties.setProperty("usehttps", "false");
                startProperties.setProperty("webenable", "true");
                startProperties.setProperty("msglimit30", "19.0");
                startProperties.setProperty("musicenable", "true");
                startProperties.setProperty("whisperlimit60", "60.0");
            }
        } catch (IOException ex) {
            com.gmt2001.Console.err.printStackTrace(ex);
        } catch (Exception ex) {
            com.gmt2001.Console.err.printStackTrace(ex);
        }
        /* Load up the bot info from the environment */
        for (Entry<String, String> v : System.getenv().entrySet()) {
            String Prefix = "PHANTOMBOT_";
            String Key = v.getKey().toUpperCase();
            String Value = v.getValue();
            if (Key.startsWith(Prefix) && Prefix.length() < Key.length()) {
                Key = Key.substring(Prefix.length()).toLowerCase();
                startProperties.setProperty(Key, Value);
            }
        }
        /* Check to enable debug mode */
        if (startProperties.getProperty("debugon", "false").equals("true")) {
            com.gmt2001.Console.out.println("Debug Mode Enabled");
            PhantomBot.enableDebugging = true;
        }
        /* Check to enable debug to File */
        if (startProperties.getProperty("debuglog", "false").equals("true")) {
            com.gmt2001.Console.out.println("Debug Log Only Mode Enabled");
            PhantomBot.enableDebugging = true;
            PhantomBot.enableDebuggingLogOnly = true;
        }
        /* Check to enable Script Reloading */
        if (startProperties.getProperty("reloadscripts", "false").equals("true")) {
            com.gmt2001.Console.out.println("Enabling Script Reloading");
            PhantomBot.reloadScripts = true;
        }
        /* Check to enable Rhino Debugger */
        if (startProperties.getProperty("rhinodebugger", "false").equals("true")) {
            com.gmt2001.Console.out.println("Rhino Debugger will be launched if system supports it.");
            PhantomBot.enableRhinoDebugger = true;
        }
        /* Check to see if there's a webOauth set */
        if (startProperties.getProperty("webauth") == null) {
            startProperties.setProperty("webauth", generateWebAuth());
            com.gmt2001.Console.debug.println("New webauth key has been generated for ./config/botlogin.txt");
            changed = true;
        }
        /* Check to see if there's a webOAuthRO set */
        if (startProperties.getProperty("webauthro") == null) {
            startProperties.setProperty("webauthro", generateWebAuth());
            com.gmt2001.Console.debug.println("New webauth read-only key has been generated for ./config/botlogin.txt");
            changed = true;
        }
        /* Check to see if there's a panelUsername set */
        if (startProperties.getProperty("paneluser") == null) {
            com.gmt2001.Console.debug.println("No Panel Username, using default value of 'panel' for Control Panel and YouTube Player");
            startProperties.setProperty("paneluser", "panel");
            changed = true;
        }
        /* Check to see if there's a panelPassword set */
        if (startProperties.getProperty("panelpassword") == null) {
            com.gmt2001.Console.debug.println("No Panel Password, using default value of 'panel' for Control Panel and YouTube Player");
            startProperties.setProperty("panelpassword", "panel");
            changed = true;
        }
        /* Check to see if there's a youtubeOAuth set */
        if (startProperties.getProperty("ytauth") == null) {
            startProperties.setProperty("ytauth", generateWebAuth());
            com.gmt2001.Console.debug.println("New YouTube websocket key has been generated for ./config/botlogin.txt");
            changed = true;
        }
        /* Check to see if there's a youtubeOAuthThro set */
        if (startProperties.getProperty("ytauthro") == null) {
            startProperties.setProperty("ytauthro", generateWebAuth());
            com.gmt2001.Console.debug.println("New YouTube read-only websocket key has been generated for ./config/botlogin.txt");
            changed = true;
        }

        /* Make a new botlogin with the botName, oauth or channel is not found */
        if (startProperties.getProperty("user") == null || startProperties.getProperty("oauth") == null || startProperties.getProperty("channel") == null) {
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

                    startProperties.setProperty("oauth", System.console().readLine().trim());
                } while (startProperties.getProperty("oauth", "").length() <= 0);

                // api oauth.
                do {
                    com.gmt2001.Console.out.print("\r\n");
                    com.gmt2001.Console.out.print("3. You will now need your channel OAuth token for the bot to be able to change your title and game.\r\n");
                    com.gmt2001.Console.out.print("Please note, this OAuth token needs to be generated while you're logged in into your caster account.\r\n");
                    com.gmt2001.Console.out.print("If you're not logged in as the caster, please go to https://twitch.tv/ and login as the caster.\r\n");
                    com.gmt2001.Console.out.print("Get the your OAuth token here: https://phantombot.tv/oauth/\r\n");
                    com.gmt2001.Console.out.print("Please enter your OAuth token: ");

                    startProperties.setProperty("apioauth", System.console().readLine().trim());
                } while (startProperties.getProperty("apioauth", "").length() <= 0);

                // Channel name.
                do {
                    com.gmt2001.Console.out.print("\r\n");
                    com.gmt2001.Console.out.print("4. Please enter the name of the Twitch channel the bot should join: ");

                    startProperties.setProperty("channel", System.console().readLine().trim());
                } while (startProperties.getProperty("channel", "").length() <= 0);

                // Panel username.
                do {
                    com.gmt2001.Console.out.print("\r\n");
                    com.gmt2001.Console.out.print("5. Please enter a custom username for the web panel: ");

                    startProperties.setProperty("paneluser", System.console().readLine().trim());
                } while (startProperties.getProperty("paneluser", "").length() <= 0);

                // Panel password.
                do {
                    com.gmt2001.Console.out.print("\r\n");
                    com.gmt2001.Console.out.print("6. Please enter a custom password for the web panel: ");

                    startProperties.setProperty("panelpassword", System.console().readLine().trim());
                } while (startProperties.getProperty("panelpassword", "").length() <= 0);

                com.gmt2001.Console.out.print("\r\n");
                com.gmt2001.Console.out.print("PhantomBot will launch in 10 seconds.\r\n");
                com.gmt2001.Console.out.print("If you're hosting the bot locally you can access the control panel here: http://localhost:25000/panel \r\n");
                com.gmt2001.Console.out.print("If you're running the bot on a server, make sure to open the following ports: \r\n");
                com.gmt2001.Console.out.print("25000, 25003, and 25004. You have to change 'localhost' to your server ip to access the panel. \r\n");

                try {
                    Thread.sleep(10000);
                } catch (InterruptedException ex) {
                    com.gmt2001.Console.debug.println("Failed to sleep in setup: " + ex.getMessage());
                }

                changed = true;
                newSetup = true;
            } catch (NullPointerException ex) {
                com.gmt2001.Console.err.printStackTrace(ex);
                com.gmt2001.Console.out.println("[ERROR] Failed to setup PhantomBot. Now exiting...");
                PhantomBot.exitError();
            }
        }

        /* Make sure the oauth has been set correctly */
        if (startProperties.getProperty("oauth") != null) {
            if (!startProperties.getProperty("oauth").startsWith("oauth") && !startProperties.getProperty("oauth").isEmpty()) {
                startProperties.setProperty("oauth", "oauth:" + startProperties.getProperty("oauth"));
                changed = true;
            }
        }

        /* Make sure the apiOAuth has been set correctly */
        if (startProperties.getProperty("apioauth") != null) {
            if (!startProperties.getProperty("apioauth").startsWith("oauth") && !startProperties.getProperty("apioauth").isEmpty()) {
                startProperties.setProperty("apioauth", "oauth:" + startProperties.getProperty("apioauth"));
                changed = true;
            }
        }

        /* Make sure the channelName does not have a # */
        if (startProperties.getProperty("channel").startsWith("#")) {
            startProperties.setProperty("channel", startProperties.getProperty("channel").substring(1));
            changed = true;
        } else if (startProperties.getProperty("channel").contains(".tv")) {
            startProperties.setProperty("channel", startProperties.getProperty("channel").substring(startProperties.getProperty("channel").indexOf(".tv/") + 4).replaceAll("/", ""));
            changed = true;
        }

        /* Check for the owner after the channel check is done. */
        if (startProperties.getProperty("owner") == null) {
            if (startProperties.getProperty("channel") != null) {
                if (!startProperties.getProperty("channel").isEmpty()) {
                    startProperties.setProperty("owner", startProperties.getProperty("channel"));
                    changed = true;
                }
            }
        }

        /* Iterate the properties and delete entries for anything that does not have a
         * value.
         */
        for (String propertyKey : startProperties.stringPropertyNames()) {
            if (startProperties.getProperty(propertyKey).isEmpty()) {
                changed = true;
                startProperties.remove(propertyKey);
            }
        }

        /*
         * Check for required settings.
         */
        for (String requiredProperty : requiredProperties) {
            if (startProperties.getProperty(requiredProperty) == null) {
                requiredPropertiesErrorMessage += requiredProperty + " ";
            }
        }

        if (!requiredPropertiesErrorMessage.isEmpty()) {
            com.gmt2001.Console.err.println();
            com.gmt2001.Console.err.println("Missing Required Properties: " + requiredPropertiesErrorMessage);
            com.gmt2001.Console.err.println("Exiting PhantomBot");
            PhantomBot.exitError();
        }

        /* Check to see if anything changed */
        if (changed) {
            Properties outputProperties = new Properties() {
                @Override
                public synchronized Enumeration<Object> keys() {
                    return Collections.enumeration(new TreeSet<>(super.keySet()));
                }
            };

            try {
                try (FileOutputStream outputStream = new FileOutputStream("./config/botlogin.txt")) {
                    outputProperties.putAll(startProperties);
                    outputProperties.store(outputStream, "PhantomBot Configuration File");
                }
            } catch (IOException ex) {
                com.gmt2001.Console.err.printStackTrace(ex);
            }
        }
        
        // fresh setup indicator should not be saved
        startProperties.put("newSetup", newSetup);
        
        return startProperties;
    }
    
    /* gen a oauth */
    private static String generateWebAuth() {
        return PhantomBot.generateRandomString(30);
    }
}
