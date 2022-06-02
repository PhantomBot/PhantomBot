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
package tv.phantombot.twitch.irc;

import com.gmt2001.wsclient.WSClient;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.concurrent.Flow;
import java.util.concurrent.Flow.Subscription;
import java.util.concurrent.SubmissionPublisher;
import tv.phantombot.CaselessProperties;
import tv.phantombot.PhantomBot;
import tv.phantombot.cache.UsernameCache;
import tv.phantombot.event.EventBus;
import tv.phantombot.event.command.CommandEvent;
import tv.phantombot.event.irc.channel.IrcChannelJoinEvent;
import tv.phantombot.event.irc.channel.IrcChannelLeaveEvent;
import tv.phantombot.event.irc.channel.IrcChannelUserModeEvent;
import tv.phantombot.event.irc.clearchat.IrcClearchatEvent;
import tv.phantombot.event.irc.complete.IrcJoinCompleteEvent;
import tv.phantombot.event.irc.message.IrcChannelMessageEvent;
import tv.phantombot.event.irc.message.IrcModerationEvent;
import tv.phantombot.event.irc.message.IrcPrivateMessageEvent;
import tv.phantombot.event.twitch.bits.TwitchBitsEvent;
import tv.phantombot.event.twitch.raid.TwitchRaidEvent;
import tv.phantombot.event.twitch.subscriber.TwitchAnonymousSubscriptionGiftEvent;
import tv.phantombot.event.twitch.subscriber.TwitchMassAnonymousSubscriptionGiftedEvent;
import tv.phantombot.event.twitch.subscriber.TwitchMassSubscriptionGiftedEvent;
import tv.phantombot.event.twitch.subscriber.TwitchPrimeSubscriberEvent;
import tv.phantombot.event.twitch.subscriber.TwitchReSubscriberEvent;
import tv.phantombot.event.twitch.subscriber.TwitchSubscriberEvent;
import tv.phantombot.event.twitch.subscriber.TwitchSubscriptionGiftEvent;
import tv.phantombot.script.ScriptEventManager;
import tv.phantombot.twitch.irc.chat.utils.SubscriberBulkGifter;

// Create an interface that is used to create event handling methods.
interface TwitchWSIRCCommand {

    void exec(String message, String username, Map<String, String> tags);
}

public class TwitchWSIRCParser extends SubmissionPublisher<Map<String, String>> implements Flow.Processor<Map<String, String>, Map<String, String>> {

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
    private WSClient client;
    private final TwitchSession session;
    private final String channelName;
    private Subscription subscription;

    /**
     * Constructor
     *
     * @param client The {@link WSClient} running the socket session
     * @param channelName The currently connected channel
     * @param session The {@link TwitchSession} that controls the IRC session
     * @return A configured instance
     */
    public static synchronized TwitchWSIRCParser instance(WSClient client, String channelName, TwitchSession session) {
        if (instance == null) {
            instance = new TwitchWSIRCParser(client, channelName, session);
            instance.subscribe(instance);
        } else {
            instance.setClient(client);
        }

        return instance;
    }

    /**
     * Constructor
     *
     * @param client The {@link WSClient} running the socket session
     * @param channelName The currently connected channel
     * @param session The {@link TwitchSession} that controls the IRC session
     */
    private TwitchWSIRCParser(WSClient client, String channelName, TwitchSession session) {
        super();
        this.client = client;
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
    }

    /**
     * Sends the message
     *
     * @param message The message to send
     */
    private void send(String message) {
        if (CaselessProperties.instance().getPropertyAsBoolean("ircdebug", false)) {
            com.gmt2001.Console.debug.println("<" + message);
        }
        this.client.send(message);
    }

    /**
     * Changes the attached {@link WSClient}
     *
     * @param client The new {@link WSClient}
     */
    private void setClient(WSClient client) {
        this.client = client;
    }

    @Override
    public void onSubscribe(Flow.Subscription subscription) {
        this.subscription = subscription;
        this.subscription.request(1);
    }

    @Override
    public void onError(Throwable thrwbl) {
        com.gmt2001.Console.err.printStackTrace(thrwbl);
        com.gmt2001.Console.err.println("GiftSubTracker threw an exception and is being disconnected...");
    }

    /**
     * Method that splits messages with new lines then parses them
     *
     * @param rawMessage The untouched message to parse
     * @param client The {@link TwitchWSIRC} client for this session
     */
    public void parseData(String rawMessage, TwitchWSIRC client) {
        try {
            if (rawMessage.contains("\n")) {
                String[] messageList = rawMessage.split("\n");

                for (String message : messageList) {
                    parseLine(message, client);
                }
            } else {
                parseLine(rawMessage, client);
            }
        } catch (Exception ex) {
            com.gmt2001.Console.err.println("Failed to parse Twitch message: [" + ex.getMessage() + "] \n\n {" + rawMessage + "}");
            com.gmt2001.Console.err.printStackTrace(ex);
        }
    }

    /**
     * Method that parses raw badges
     *
     * @param rawBadges The raw badges tag to parse
     * @return A Map of the badges and their states
     */
    private Map<String, String> parseBadges(String rawBadges) {
        Map<String, String> badges = new HashMap<>();

        // Add default values.
        badges.put("user-type", "");
        badges.put("subscriber", "0");
        badges.put("turbo", "0");
        badges.put("premium", "0");
        badges.put("vip", "0");

        if (rawBadges.length() > 0) {
            String badgeParts[] = rawBadges.split(",");

            for (String badge : badgeParts) {
                // Remove the `/1` from the badge.
                // For bits it can be `/1000`, so we need to use indexOf.
                badge = badge.substring(0, badge.indexOf('/'));

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
                    default:
                        break;
                }
            }
        }

        return badges;
    }

    /**
     * Method that parses a single line message
     *
     * @param rawMessage The untouched message to parse
     * @param client The {@link TwitchWSIRC} client for this session
     */
    private void parseLine(String rawMessage, TwitchWSIRC client) {
        Map<String, String> tags = new HashMap<>();
        String messageParts[] = rawMessage.split(" :", 3);
        String username = "";
        String message = "";
        String event;
        int offset = 0;

        if (CaselessProperties.instance().getPropertyAsBoolean("ircdebug", false)) {
            com.gmt2001.Console.debug.println(">" + rawMessage.trim());
        }

        if (rawMessage.startsWith("PONG")) {
            client.gotPong();
            return;
        }

        if (rawMessage.startsWith("PING")) {
            return;
        }

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

            offset++;
        }

        // Cut leading space.
        if (messageParts[0 + offset].startsWith(" ")) {
            messageParts[0 + offset] = messageParts[0 + offset].substring(1);
        }

        // Cut leading space, trailing junk character, and assign message.
        if (messageParts.length > 1 + offset) {
            if (messageParts[1 + offset].startsWith(" ")) {
                messageParts[1 + offset] = messageParts[1 + offset].substring(1);
            }
            message = messageParts[1 + offset];
            if (message.length() > 1) {
                message = message.substring(0, message.length() - 1);
            }
        }

        String[] prefixcommand = messageParts[0 + offset].split(" ");
        int eventindex = prefixcommand.length > 1 ? 1 : 0;

        // Get username if present.
        if (prefixcommand.length > 1 && prefixcommand[0].contains("!") && prefixcommand[0].contains("@")) {
            username = prefixcommand[0].substring(prefixcommand[0].indexOf('!') + 1, prefixcommand[0].indexOf('@'));
        } else if (prefixcommand.length > 1) {
            username = prefixcommand[0];
        }

        // Get the event code.
        event = prefixcommand[eventindex];

        // Execute the event parser if a parser exists.
        if (parserMap.containsKey(event)) {
            parserMap.get(event).exec(message, username, tags);
        }
    }

    /**
     * Method that handles parsing commands
     *
     * @param message The parsed message
     * @param username The parsed sender username
     * @param tags The tags attached to the message
     */
    private void parseCommand(String message, String username, Map<String, String> tags) {
        String command = message.substring(1);
        String arguments = "";

        // Check for arguments.
        if (command.contains(" ")) {
            String commandString = command;
            command = commandString.substring(0, commandString.indexOf(' '));
            arguments = commandString.substring(commandString.indexOf(' ') + 1);
        }

        // Send the command.
        scriptEventManager.onEvent(new CommandEvent(username, command, arguments, tags));
    }

    /**
     * ---------------------------------------------------------------------- Event Handling Methods. The below methods are all referenced from the
     * parserMap object. ----------------------------------------------------------------------
     */
    /**
     * Handles the 001 event from IRC
     *
     * @param message The parsed message
     * @param username The parsed sender username
     * @param tags The tags attached to the message
     */
    private void onChannelJoined(String unusedMessage, String unusedUsername, Map<String, String> unusedTags) {
        // Request our tags
        this.send("CAP REQ :twitch.tv/membership");
        this.send("CAP REQ :twitch.tv/commands");
        this.send("CAP REQ :twitch.tv/tags");

        // Join the channel.
        this.send("JOIN #" + channelName);

        // Log in the console that web joined.
        com.gmt2001.Console.out.println("Channel Joined [#" + channelName + "]");

        // Port the channel joined event.
        eventBus.postAsync(new IrcJoinCompleteEvent(session));
    }

    /**
     * Handles the PRIVMSG event from IRC
     *
     * @param message The parsed message
     * @param username The parsed sender username
     * @param tags The tags attached to the message
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
        eventBus.postAsync(new IrcChannelMessageEvent(session, username, message, tags));

        // Print the tags for debugging.
        com.gmt2001.Console.debug.println("IRCv3 Tags: " + tags);
    }

    /**
     * Handles the CLEARCHAT event from IRC
     *
     * @param message The parsed message
     * @param username The parsed sender username
     * @param tags The tags attached to the message
     */
    private void onClearChat(String unusedMessage, String username, Map<String, String> tags) {
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
     * Handles the WHISPER event from IRC
     *
     * @param message The parsed message
     * @param username The parsed sender username
     * @param tags The tags attached to the message
     */
    private void onWhisper(String message, String username, Map<String, String> tags) {
        // Post the event.
        eventBus.postAsync(new IrcPrivateMessageEvent(session, username, message, tags));
        // Show the message in the console.
        com.gmt2001.Console.out.println("[WHISPER] " + username + ": " + message);
    }

    /**
     * Handles the JOIN event from IRC
     *
     * @param message The parsed message
     * @param username The parsed sender username
     * @param tags The tags attached to the message
     */
    private void onJoin(String unusedMessage, String username, Map<String, String> unusedTags) {
        // Post the event.
        eventBus.postAsync(new IrcChannelJoinEvent(session, username));
        // Show the message in debug mode.
        com.gmt2001.Console.debug.println("User Joined Channel [" + username + " -> " + channelName + "]");
    }

    /**
     * Handles the PART event from IRC
     *
     * @param message The parsed message
     * @param username The parsed sender username
     * @param tags The tags attached to the message
     */
    private void onPart(String unusedMessage, String username, Map<String, String> unusedTags) {
        // Post the event.
        eventBus.postAsync(new IrcChannelLeaveEvent(session, username));
        // Show the message in debug mode.
        com.gmt2001.Console.debug.println("User Left Channel [" + username + " -> " + channelName + "]");
    }

    /**
     * Handles the NOTICE event from IRC
     *
     * @param message The parsed message
     * @param username The parsed sender username
     * @param tags The tags attached to the message
     */
    private void onNotice(String message, String unusedUsername, Map<String, String> tags) {
        if (tags.containsKey("msg-id")) {
            switch (tags.get("msg-id")) {
                case "msg_banned":
                case "msg_bad_characters":
                case "msg_channel_blocked":
                case "msg_channel_suspended":
                case "msg_facebook":
                case "msg_followersonly_followed":
                case "msg_ratelimit":
                case "msg_rejected":
                case "msg_rejected_mandatory":
                case "msg_verified_email":
                case "msg_requires_verified_phone_number":
                case "no_permission":
                case "tos_ban":
                case "whisper_banned":
                case "whisper_banned_recipient":
                case "whisper_restricted":
                case "whisper_restricted_recipient":
                    com.gmt2001.Console.err.println(tags.get("msg-id") + ": " + message);
                    break;
                default:
                    break;
            }
        }
        switch (message) {
            case "Login authentication failed":
                com.gmt2001.Console.out.println();
                com.gmt2001.Console.out.println("Twitch Indicated Login Failed. Check OAUTH password.");
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
     * Handles the USERNOTICE event from IRC
     *
     * @param message The parsed message
     * @param username The parsed sender username
     * @param tags The tags attached to the message
     */
    private void onUserNotice(String message, String unusedUsername, Map<String, String> tags) {
        if (tags.containsKey("msg-id")) {
            if (tags.get("msg-id").equalsIgnoreCase("resub")) {
                scriptEventManager.onEvent(new TwitchReSubscriberEvent(tags.get("login"), tags.get("msg-param-cumulative-months"), tags.get("msg-param-sub-plan"), message));
            } else if (tags.get("msg-id").equalsIgnoreCase("sub")) {
                if (tags.get("msg-param-sub-plan").equalsIgnoreCase("Prime")) {
                    scriptEventManager.onEvent(new TwitchPrimeSubscriberEvent(tags.get("login"), tags.get("msg-param-cumulative-months")));
                } else {
                    scriptEventManager.onEvent(new TwitchSubscriberEvent(tags.get("login"), tags.get("msg-param-sub-plan"), tags.get("msg-param-cumulative-months"), message));
                }
            } else if (tags.get("msg-id").equalsIgnoreCase("subgift")) {
                this.submit(tags);
            } else if (tags.get("msg-id").equalsIgnoreCase("anonsubgift")) {
                // Not in use by Twitch as of right now, 2019-01-03, leaving code there though.
                // See: https://discuss.dev.twitch.tv/t/anonymous-sub-gifting-to-launch-11-15-launch-details/18683
                this.submit(tags);
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
     * Handles the USERSTATE event from IRC
     *
     * @param message The parsed message
     * @param username The parsed sender username
     * @param tags The tags attached to the message
     */
    private void onUserState(String unusedMessage, String username, Map<String, String> tags) {
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
                    com.gmt2001.Console.out.println("[ERROR] Please go to https://phantombot.github.io/PhantomBot/oauth/ and generate a new token.");
                    com.gmt2001.Console.out.println("[ERROR] Be sure to go to twitch.tv and login as the bot before getting the token.");
                    com.gmt2001.Console.out.println("[ERROR] After, open the botlogin.txt file and replace the oauth= value with the token.");
                    com.gmt2001.Console.out.println();
                } else {
                    // Since the "user-type" tag in deprecated and Twitch wants us to reply on badges
                    // A user can sometimes lose its badge for no reason from one message to another
                    // So, this could possibly make the bot lose its moderator powers, even though the bot
                    // is still a mod, so checking the "mod" tag before removing a user's moderator permissions
                    // is the only way to fix this, an admin or staff member could lose moderation powers from the bot
                    // for a second if they are not a channel moderator, so the bot would try and time them out if a moderation
                    // filter is triggered. This fix is only to prevent the bot from losing moderator powers.
                    if (!tags.containsKey("mod") || !tags.get("mod").equals("1")) {
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

    @Override
    public void onNext(Map<String, String> item) {
        try {
            if (bulkSubscriberGifters.containsKey(item.get("login"))) {
                SubscriberBulkGifter gifter = bulkSubscriberGifters.get(item.get("login"));
                if (gifter.getCurrentSubscriptionGifted() < gifter.getSubscritpionsGifted()) {
                    gifter.increaseCurrentSubscriptionGifted();
                } else {
                    bulkSubscriberGifters.remove(item.get("login"));
                }
            } else {
                if (item.get("login").equalsIgnoreCase(ANONYMOUS_GIFTER_TWITCH_USER)) {
                    scriptEventManager.onEvent(new TwitchAnonymousSubscriptionGiftEvent(item.get("msg-param-recipient-user-name"), item.get("msg-param-months"), item.get("msg-param-sub-plan")));
                } else {
                    scriptEventManager.onEvent(new TwitchSubscriptionGiftEvent(item.get("login"), item.get("msg-param-recipient-user-name"), item.get("msg-param-months"), item.get("msg-param-sub-plan")));
                }
            }
        } catch (Exception ex) {
            com.gmt2001.Console.err.printStackTrace(ex);
        }
        this.subscription.request(1);
    }

    @Override
    public void onComplete() {
        this.close();
    }
}
