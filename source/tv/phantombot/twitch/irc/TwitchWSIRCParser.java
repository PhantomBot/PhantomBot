/*
 * Copyright (C) 2016-2019 phantombot.tv
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
package tv.phantombot.twitch.irc;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.BlockingDeque;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.concurrent.LinkedBlockingDeque;

import org.java_websocket.WebSocket;

import tv.phantombot.script.ScriptEventManager;
import tv.phantombot.PhantomBot;
import tv.phantombot.cache.UsernameCache;

import tv.phantombot.event.EventBus;
import tv.phantombot.event.command.CommandEvent;
import tv.phantombot.event.irc.channel.*;
import tv.phantombot.event.irc.clearchat.IrcClearchatEvent;
import tv.phantombot.event.irc.complete.IrcJoinCompleteEvent;
import tv.phantombot.event.irc.message.*;
import tv.phantombot.event.twitch.bits.TwitchBitsEvent;
import tv.phantombot.event.twitch.raid.TwitchRaidEvent;
import tv.phantombot.event.twitch.subscriber.*;
import tv.phantombot.twitch.irc.chat.utils.SubscriberBulkGifter;

// Create an interface that is used to create event handling methods.
interface TwitchWSIRCCommand{
    void exec(String message, String username, Map<String, String> tags);
}

public class TwitchWSIRCParser implements Runnable {
    // The user login sent in the anonymous sub gift event from Twitch.
    // See: https://discuss.dev.twitch.tv/t/anonymous-sub-gifting-to-launch-11-15-launch-details/18683
    private static final String ANONYMOUS_GIFTER_TWITCH_USER = "ananonymousgifter";
    private static TwitchWSIRCParser instance;
    private final ConcurrentMap<String, TwitchWSIRCCommand> parserMap = new ConcurrentHashMap<>(8);
    private final List<String> moderators = new CopyOnWriteArrayList<>();
    private final ScriptEventManager scriptEventManager = ScriptEventManager.instance();
    private final UsernameCache usernameCache = UsernameCache.instance();
    private final EventBus eventBus = EventBus.instance();
    private final ConcurrentMap<String, SubscriberBulkGifter> bulkSubscriberGifters = new ConcurrentHashMap<>();
    private final BlockingDeque<Map<String, String>> giftedSubscriptionEvents = new LinkedBlockingDeque<>();
    private WebSocket webSocket;
    private final TwitchSession session;
    private final String channelName;
    private final Thread runThread;

    public static synchronized TwitchWSIRCParser instance(WebSocket webSocket, String channelName, TwitchSession session) {
        if (instance == null) {
            instance = new TwitchWSIRCParser(webSocket, channelName, session);
        } else {
            instance.setWebSocket(webSocket);
        }
        
        return instance;
    }
    
    /**
     * Class constructor.
     *
     * @param {WebSocket} webSocket
     * @param {String}    channelName
     * @param {TwitchSession}   session
     */
    @SuppressWarnings("CallToThreadStartDuringObjectConstruction")
    private TwitchWSIRCParser(WebSocket webSocket, String channelName, TwitchSession session) {
        this.webSocket = webSocket;
        this.channelName = channelName;
        this.session = session;

        // 001 event from Twitch.
        parserMap.put("001", (TwitchWSIRCCommand) this::onChannelJoined);

        // PRIVMSG event from Twitch.
        parserMap.put("PRIVMSG", (TwitchWSIRCCommand) this::onPrivMsg);

        // CLEARCHAT event from Twitch.
        parserMap.put("CLEARCHAT", (TwitchWSIRCCommand) this::onClearChat);

        // WHISPER event from Twitch.
        parserMap.put("WHISPER", (TwitchWSIRCCommand) this::onWhisper);

        // JOIN event from Twitch.
        parserMap.put("JOIN", (TwitchWSIRCCommand) this::onJoin);

        // PART event from Twitch.
        parserMap.put("PART", (TwitchWSIRCCommand) this::onPart);

        // NOTICE event from Twitch.
        parserMap.put("NOTICE", (TwitchWSIRCCommand) this::onNotice);

        // USERSTATE event from Twitch.
        parserMap.put("USERSTATE", (TwitchWSIRCCommand) this::onUserState);

        // USERNOTICE event from Twitch.
        parserMap.put("USERNOTICE", (TwitchWSIRCCommand) this::onUserNotice);

        // Start a new thread for events.
        this.runThread = new Thread(this);
        this.runThread.start();
    }
    
    private void setWebSocket(WebSocket webSocket) {
        this.webSocket = webSocket;
    }

    /**
     * Method which is on a new thread that keeps track of gifted subscribers.
     */
    @Override
    public void run() {
        while (!PhantomBot.isInExitState()) {
            try {
                Map<String, String> tags = giftedSubscriptionEvents.take();

                if (bulkSubscriberGifters.containsKey(tags.get("login"))) {
                    SubscriberBulkGifter gifter = bulkSubscriberGifters.get(tags.get("login"));
                    if (gifter.getCurrentSubscriptionGifted() < gifter.getSubscritpionsGifted()) {
                        gifter.increaseCurrentSubscriptionGifted();
                    } else {
                        bulkSubscriberGifters.remove(tags.get("login"));
                    }
                } else {
                    if (tags.get("login").equalsIgnoreCase(ANONYMOUS_GIFTER_TWITCH_USER)) {
                        scriptEventManager.onEvent(new TwitchAnonymousSubscriptionGiftEvent(tags.get("msg-param-recipient-user-name"), tags.get("msg-param-months"), tags.get("msg-param-sub-plan")));
                    } else {
                        scriptEventManager.onEvent(new TwitchSubscriptionGiftEvent(tags.get("login"), tags.get("msg-param-recipient-user-name"), tags.get("msg-param-months"), tags.get("msg-param-sub-plan")));
                    }
                }
            } catch (InterruptedException ex) {
                com.gmt2001.Console.err.printStackTrace(ex);
            }
        }
    }

    /**
     * Method that splits messages with new lines then parses them.
     *
     * @param {String} rawMessage
     */
    public void parseData(String rawMessage) {
        try {
            if (rawMessage.contains("\n")) {
                String[] messageList = rawMessage.split("\n");

                for (String message : messageList) {
                    parseLine(message);
                }
            } else {
                parseLine(rawMessage);
            }
        } catch (Exception ex) {
            com.gmt2001.Console.err.println("Failed to parse Twitch message: [" + ex.getMessage() + "] \n\n {" + rawMessage + "}");
        }
    }

    /**
     * Method that parses raw badges.
     *
     * @param rawBadges
     * @return
     */
    private Map<String, String> parseBadges(String rawBadges) {
        // A user cannot have more than 4 badges, acording to Twitch.
        Map<String, String> badges = new HashMap<>(4);

        // Add default values.
        badges.put("user-type", "");
        badges.put("subscriber", "0");
        badges.put("turbo", "0");
        badges.put("premium", "0");
        badges.put("vip", "0");

        if (rawBadges.length() > 0) {
            String badgeParts[] = rawBadges.split(",", 4);

            for (String badge : badgeParts) {
                // Remove the `/1` from the badge.
                // For bits it can be `/1000`, so we need to use indexOf.
                badge = badge.substring(0, badge.indexOf("/"));

                switch (badge) {
                    case "staff":
                    case "global_mod":
                    case "admin":
                    case "broadcaster":
                    case "moderator":
                        badges.put("user-type", badge);
                        break;
                    case "subscriber":
                    case "founder":
                        badges.put("subscriber", "1");
                        break;
                    case "turbo":
                        badges.put("turbo", "1");
                        break;
                    case "premium":
                        badges.put("premium", "1");
                        break;
                    case "vip":
                        badges.put("vip", "1");
                        break;
                }
            }
        }

        return badges;
    }

    /**
     * Method that parses a single line message.
     *
     * @param {String} rawMessage
     */
    private void parseLine(String rawMessage) {
        Map<String, String> tags = new HashMap<>();
        String messageParts[] = rawMessage.split(" :", 3);
        String username = "";
        String message = "";
        String event;

        // Get tags from the messages.
        if (messageParts[0].startsWith("@")) {
            String[] tagParts = messageParts[0].substring(1).split(";");

            // We want to skip the first element which are badges, since they are parsed already.
            for (String tagPart : tagParts) {
                String[] keyValues = tagPart.split("=");
                if (keyValues.length > 0) {
                    if (keyValues[0].equals("badges")) {
                        tags.putAll(parseBadges((keyValues.length == 1 ? "" : keyValues[1])));
                    } else {
                        tags.putIfAbsent(keyValues[0], (keyValues.length == 1 ? "" : keyValues[1]));
                    }
                }
            }

            messageParts[0] = messageParts[1];

            if (messageParts.length > 2) {
                messageParts[1] = messageParts[2];
            }
        }

        // Cut leading space.
        if (messageParts[0].startsWith(" ")) {
            messageParts[0] = messageParts[0].substring(1);
        }

        // Cut leading space, trailing junk character, and assign message.
        if (messageParts.length > 1) {
            if (messageParts[1].startsWith(" ")) {
                messageParts[1] = messageParts[1].substring(1);
            }
            message = messageParts[1];
            if (message.length() > 1) {
                message = message.substring(0, message.length() - 1);
            }
        }

        // Get username if present.
        if (messageParts[0].contains("!")) {
            username = messageParts[0].substring(messageParts[0].indexOf("!") + 1, messageParts[0].indexOf("@"));
        }

        // Get the event code.
        event = messageParts[0].split(" ")[1];

        // Execute the event parser if a parser exists.
        if (parserMap.containsKey(event)) {
            parserMap.get(event).exec(message, username, tags);
        }
    }

    /**
     * Method that handles parsing commands.
     *
     * @param {String} message
     * @param {String} username
     * @param {Map}    tags
     */
    private void parseCommand(String message, String username, Map<String, String> tags) {
        String command = message.substring(1);
        String arguments = "";

        // Check for arguments.
        if (command.contains(" ")) {
            String commandString = command;
            command = commandString.substring(0, commandString.indexOf(" "));
            arguments = commandString.substring(commandString.indexOf(" ") + 1);
        }

        // Send the command.
        scriptEventManager.onEvent(new CommandEvent(username, command, arguments, tags));
    }

    /**
     * ----------------------------------------------------------------------
     * Event Handling Methods. The below methods are all referenced from the
     * parserMap object.
     * ----------------------------------------------------------------------
     */

    /**
     * Handles the 001 event from IRC.
     *
     * @param {String} message
     * @param {String} username
     * @param {Map}    tags
     */
    private void onChannelJoined(String message, String username, Map<String, String> tags) {
        // Request our tags
        webSocket.send("CAP REQ :twitch.tv/membership");
        webSocket.send("CAP REQ :twitch.tv/commands");
        webSocket.send("CAP REQ :twitch.tv/tags");

        // Join the channel.
        webSocket.send("JOIN #" + channelName);

        // Log in the console that web joined.
        com.gmt2001.Console.out.println("Channel Joined [#" + channelName + "]");

        // Port the channel joined event.
        eventBus.postAsync(new IrcJoinCompleteEvent(session));
    }

    /**
     * Handles the PRIVMSG event from IRC.
     *
     * @param {String} message
     * @param {String} username
     * @param {Map}    tags
     */
    private void onPrivMsg(String message, String username, Map<String, String> tags) {
        // Check to see if the user is using a ACTION in the channel (/me).
        if (message.startsWith("\001ACTION")) {
            message = message.replaceAll("\001", "").replace("ACTION", "/me");
        }

        // Print the message in the console
        com.gmt2001.Console.out.println(username + ": " + message);

        // Cache the user's display name and ID.
        if (tags.containsKey("display-name") && tags.containsKey("user-id")) {
            usernameCache.addUser(username, tags.get("display-name"), tags.get("user-id"));
        }

        // Check if the message is a cheer.
        if (tags.containsKey("bits")) {
            scriptEventManager.onEvent(new TwitchBitsEvent(username, tags.get("bits"), message));
        }

        // Check if the message is a command.
        if (message.startsWith("!")) {
            parseCommand(message, username, tags);
        }

        // Send the moderation event.
        scriptEventManager.onEvent(new IrcModerationEvent(session, username, message, tags));
        //eventBus.postAsync(new IrcModerationEvent(session, username, message, tags));

        // Check to see if the user is a channel subscriber.
        if (tags.containsKey("subscriber") && tags.get("subscriber").equals("1")) {
            eventBus.postAsync(new IrcPrivateMessageEvent(session, "jtv", "SPECIALUSER " + username + " subscriber", tags));
        }

        // Check to see if the user is a moderator.
        if (tags.containsKey("user-type")) {
            if (tags.get("user-type").length() > 0) {
                if (!moderators.contains(username)) {
                    eventBus.postAsync(new IrcChannelUserModeEvent(session, username, "O", true));
                    moderators.add(username);
                }
            } else {
                if (moderators.contains(username)) {
                    eventBus.postAsync(new IrcChannelUserModeEvent(session, username, "O", false));
                    moderators.remove(username);
                }
            }
        }

        // Send the message to the scripts.
        eventBus.post(new IrcChannelMessageEvent(session, username, message, tags));

        // Print the tags for debugging.
        com.gmt2001.Console.debug.println("IRCv3 Tags: " + tags);
    }

    /**
     * Handles the CLEARCHAT event from IRC.
     *
     * @param {String} message
     * @param {String} username
     * @param {Map}    tags
     */
    private void onClearChat(String message, String username, Map<String, String> tags) {
        String duration = "";
        String reason = "";

        // Get the ban duration in seconds.
        if (tags.containsKey("ban-duration")) {
            duration = tags.get("ban-duration");
        }

        // Get the ban reason if any.
        if (tags.containsKey("ban-reason")) {
            reason = tags.get("ban-reason").replaceAll("\\\\s", " ");
        }

        // Post the event.
        eventBus.postAsync(new IrcClearchatEvent(session, username, reason, duration));
    }

    /**
     * Handles the WHISPER event from IRC.
     *
     * @param {String} message
     * @param {String} username
     * @param {Map}    tags
     */
    private void onWhisper(String message, String username, Map<String, String> tags) {
        // Post the event.
        eventBus.postAsync(new IrcPrivateMessageEvent(session, username, message, tags));
        // Show the message in the console.
        com.gmt2001.Console.out.println("[WHISPER] " + username + ": " + message);
    }

    /**
     * Handles the JOIN event from IRC.
     *
     * @param {String} message
     * @param {String} username
     * @param {Map}    tags
     */
    private void onJoin(String message, String username, Map<String, String> tags) {
        // Post the event.
        eventBus.postAsync(new IrcChannelJoinEvent(session, username));
        // Show the message in debug mode.
        com.gmt2001.Console.debug.println("User Joined Channel [" + username + " -> " + channelName + "]");
    }

    /**
     * Handles the PART event from IRC.
     *
     * @param {String} message
     * @param {String} username
     * @param {Map}    tags
     */
    private void onPart(String message, String username, Map<String, String> tags) {
        // Post the event.
        eventBus.postAsync(new IrcChannelLeaveEvent(session, username));
        // Show the message in debug mode.
        com.gmt2001.Console.debug.println("User Left Channel [" + username + " -> " + channelName + "]");
    }

    /**
     * Handles the NOTICE event from IRC.
     *
     * @param {String} message
     * @param {String} username
     * @param {Map}    tags
     */
    private void onNotice(String message, String username, Map<String, String> tags) {
        switch (message) {
            case "Login authentication failed":
                com.gmt2001.Console.out.println();
                com.gmt2001.Console.out.println("Twitch Inidicated Login Failed. Check OAUTH password.");
                com.gmt2001.Console.out.println("Please see: https://community.phantombot.tv/t/twitch-indicates-the-oauth-password-is-incorrect");
                com.gmt2001.Console.out.println("Exiting PhantomBot.");
                com.gmt2001.Console.out.println();
                PhantomBot.exitError();
                break;
            case "Invalid NICK":
                com.gmt2001.Console.out.println();
                com.gmt2001.Console.out.println("Twitch Inidicated Invalid Bot Name. Check 'user=' setting in botlogin.txt");
                com.gmt2001.Console.out.println("Exiting PhantomBot.");
                com.gmt2001.Console.out.println();
                PhantomBot.exitError();
                break;
            default:
                eventBus.postAsync(new IrcPrivateMessageEvent(session, "jtv", message, tags));
                com.gmt2001.Console.debug.println("Message from jtv (NOTICE): " + message);
                break;
        }
    }

    /**
     * Handles the USERNOTICE event from IRC.
     *
     * @param {String} message
     * @param {String} username
     * @param {Map}    tags
     */
    private void onUserNotice(String message, String username, Map<String, String> tags) {
        if (tags.containsKey("msg-id")) {
            if (tags.get("msg-id").equalsIgnoreCase("resub")) {
                scriptEventManager.onEvent(new TwitchReSubscriberEvent(tags.get("login"), tags.get("msg-param-cumulative-months"), tags.get("msg-param-sub-plan")));
            } else if (tags.get("msg-id").equalsIgnoreCase("sub")) {
                if (tags.get("msg-param-sub-plan").equalsIgnoreCase("Prime")) {
                    scriptEventManager.onEvent(new TwitchPrimeSubscriberEvent(tags.get("login"), tags.get("msg-param-cumulative-months")));
                } else {
                    scriptEventManager.onEvent(new TwitchSubscriberEvent(tags.get("login"), tags.get("msg-param-sub-plan"), tags.get("msg-param-cumulative-months")));
                }
            } else if (tags.get("msg-id").equalsIgnoreCase("subgift")) {
                giftedSubscriptionEvents.add(tags);
            } else if (tags.get("msg-id").equalsIgnoreCase("anonsubgift")) {
                // Not in use by Twitch as of right now, 2019-01-03, leaving code there though.
                // See: https://discuss.dev.twitch.tv/t/anonymous-sub-gifting-to-launch-11-15-launch-details/18683
                giftedSubscriptionEvents.add(tags);
            } else if (tags.get("msg-id").equalsIgnoreCase("giftpaidupgrade")) {
                // Not in use yet, no examples either.
                // This will be when a user gifts a sub to a user that already is subscribed.
            } else if (tags.get("msg-id").equalsIgnoreCase("submysterygift")) {
                bulkSubscriberGifters.put(tags.get("login"), new SubscriberBulkGifter(tags.get("login"), Integer.parseInt(tags.get("msg-param-mass-gift-count")), false));

                // Send event for this.
                if (tags.get("login").equalsIgnoreCase(ANONYMOUS_GIFTER_TWITCH_USER)) {
                    scriptEventManager.onEvent(new TwitchMassAnonymousSubscriptionGiftedEvent(tags.get("msg-param-mass-gift-count"), tags.get("msg-param-sub-plan")));
                } else {
                    scriptEventManager.onEvent(new TwitchMassSubscriptionGiftedEvent(tags.get("login"), tags.get("msg-param-mass-gift-count"), tags.get("msg-param-sub-plan")));
                }
            } else if (tags.get("msg-id").equalsIgnoreCase("anonsubmysterygift")) {
                // Not in use by Twitch as of right now, 2019-01-03, leaving code there though.
                // See: https://discuss.dev.twitch.tv/t/anonymous-sub-gifting-to-launch-11-15-launch-details/18683
                bulkSubscriberGifters.put(tags.get("login"), new SubscriberBulkGifter(tags.get("login"), Integer.parseInt(tags.get("msg-param-mass-gift-count")), true));

                scriptEventManager.onEvent(new TwitchMassAnonymousSubscriptionGiftedEvent(tags.get("msg-param-mass-gift-count"), tags.get("msg-param-sub-plan")));
            } else {
                if (tags.get("msg-id").equalsIgnoreCase("raid")) {
                    scriptEventManager.onEvent(new TwitchRaidEvent(tags.get("login"), tags.get("msg-param-viewerCount")));
                }
            }
        }
    }

    /**
     * Handles the USERSTATE event from IRC.
     *
     * @param {String} message
     * @param {String} username
     * @param {Map}    tags
     */
    private void onUserState(String message, String username, Map<String, String> tags) {
        username = session.getBotName();

        if (tags.containsKey("user-type")) {
            if (tags.get("user-type").length() > 0) {
                if (!moderators.contains(username)) {
                    eventBus.postAsync(new IrcChannelUserModeEvent(session, username, "O", true));
                    moderators.add(username);
                }
            } else {
                if (channelName.equals(username)) {
                    if (!moderators.contains(username)) {
                        eventBus.postAsync(new IrcChannelUserModeEvent(session, username, "O", true));
                        moderators.add(username);
                    }
                } else if (tags.containsKey("display-name") && !tags.get("display-name").equalsIgnoreCase(username)) {
                    com.gmt2001.Console.out.println();
                    com.gmt2001.Console.out.println("[ERROR] oAuth token doesn't match the bot's Twitch account name.");
                    com.gmt2001.Console.out.println("[ERROR] Please go to http://twitchapps.com/tmi and generate a new token.");
                    com.gmt2001.Console.out.println("[ERROR] Be sure to go to twitch.tv and login as the bot before getting the token.");
                    com.gmt2001.Console.out.println("[ERROR] After, open the botlogin.txt file and replace the oauth= value with the token.");
                    com.gmt2001.Console.out.println();
                } else {
                    com.gmt2001.Console.out.println();
                    com.gmt2001.Console.out.println("[ERROR] " + username + " is not detected as a moderator!");
                    com.gmt2001.Console.out.println("[ERROR] You must add " + username + " as a channel moderator for it to chat.");
                    com.gmt2001.Console.out.println("[ERROR] Type /mod " + username + " to add " + username + " as a channel moderator.");
                    com.gmt2001.Console.out.println();

                    // We're not a mod thus we cannot send messages.
                    session.setAllowSendMessages(false);
                    // Remove the bot from the moderators list.
                    if (moderators.contains(username)) {
                        moderators.remove(username);
                        eventBus.postAsync(new IrcChannelUserModeEvent(session, username, "O", false));
                    }
                }
            }
        }
    }
}
