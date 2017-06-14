/*
 * Copyright (C) 2017 phantombot.tv
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

/**
 * Twitch WS-IRC Client
 * @author: illusionaryone
 */

package me.mast3rplan.phantombot.twitchwsirc;

import org.java_websocket.WebSocket;

import java.util.HashMap;
import java.util.Map;

import me.mast3rplan.phantombot.event.irc.channel.IrcChannelUserModeEvent;
import me.mast3rplan.phantombot.event.irc.channel.IrcChannelJoinEvent;
import me.mast3rplan.phantombot.event.irc.channel.IrcChannelLeaveEvent;
import me.mast3rplan.phantombot.event.irc.complete.IrcJoinCompleteEvent;
import me.mast3rplan.phantombot.event.irc.message.IrcChannelMessageEvent;
import me.mast3rplan.phantombot.event.irc.message.IrcPrivateMessageEvent;
import me.mast3rplan.phantombot.event.irc.message.IrcModerationEvent;
import me.mast3rplan.phantombot.event.irc.clearchat.IrcClearchatEvent;
import me.mast3rplan.phantombot.event.subscribers.NewReSubscriberEvent;
import me.mast3rplan.phantombot.event.subscribers.NewSubscriberEvent;
import me.mast3rplan.phantombot.event.subscribers.NewPrimeSubscriberEvent;
import me.mast3rplan.phantombot.event.bits.BitsEvent;
import me.mast3rplan.phantombot.event.EventBus;
import me.mast3rplan.phantombot.event.command.CommandEvent;
import me.mast3rplan.phantombot.script.ScriptEventManager;
import me.mast3rplan.phantombot.cache.UsernameCache;
import me.mast3rplan.phantombot.PhantomBot;

/*
 * Create an interface that is used to create event handling methods.
 */
interface TwitchWSIRCCommand {
    void exec(String message, String username, Map<String, String> tagsMap);
}

public class TwitchWSIRCParser {

    private Map<String, TwitchWSIRCCommand> parserMap = new HashMap<String, TwitchWSIRCCommand>();
    private ScriptEventManager scriptEventManager = ScriptEventManager.instance();
    private UsernameCache usernameCache = UsernameCache.instance();
    private Map<String, Boolean> moderators = new HashMap<>();
    private WebSocket webSocket;
    private String channelName;
    private Channel channel;
    private Session session;
    private EventBus eventBus;

    /**
     * Constructor for TwitchWSIRCParser object.  Performs construction
     * of the object and populates the event handling Map table.
     *
     * @param  WebSocket  The WebSocket object that can be read/written from/to.
     * @param  String     The name of the channel
     * @param  Channel    The Channel object, defines information regarding the channel
     * @param  Session    The Session object, defines information rgarding the session
     * @param  EventBus   EventBus, the bus for pushing events to
     */
    public TwitchWSIRCParser(WebSocket webSocket, String channelName, Channel channel, Session session, EventBus eventBus) {
        this.webSocket = webSocket;
        this.channelName = channelName.toLowerCase();
        this.channel = channel;
        this.session = session;
        this.eventBus = eventBus;

        parserMap.put("001", new TwitchWSIRCCommand() {
            public void exec(String message, String username, Map<String, String> tagsMap) {
                joinChannel();
            }
        });

        parserMap.put("PRIVMSG", new TwitchWSIRCCommand() {
            public void exec(String message, String username, Map<String, String> tagsMap) {
                privMsg(message, username, tagsMap);
            }
        });

        parserMap.put("CLEARCHAT", new TwitchWSIRCCommand() {
            public void exec(String message, String username, Map<String, String> tagsMap) {
                clearChat(message, tagsMap);
            }
        });

        parserMap.put("WHISPER", new TwitchWSIRCCommand() {
            public void exec(String message, String username, Map<String, String> tagsMap) {
                whisperMessage(message, username, tagsMap);
            }
        });

        parserMap.put("JOIN", new TwitchWSIRCCommand() {
            public void exec(String message, String username, Map<String, String> tagsMap) {
                joinUser(message, username, tagsMap);
            }
        });

        parserMap.put("PART", new TwitchWSIRCCommand() {
            public void exec(String message, String username, Map<String, String> tagsMap) {
                partUser(message, username, tagsMap);
            }
        });

        parserMap.put("NOTICE", new TwitchWSIRCCommand() {
            public void exec(String message, String username, Map<String, String> tagsMap) {
                noticeMessage(message, username, tagsMap);
            }
        });

        parserMap.put("USERSTATE", new TwitchWSIRCCommand() {
            public void exec(String message, String username, Map<String, String> tagsMap) {
                userState(tagsMap);
            }
        });

        parserMap.put("USERNOTICE", new TwitchWSIRCCommand() {
            public void exec(String message, String username, Map<String, String> tagsMap) {
                userNotice(message, username, tagsMap);
            }
        });
    }

    /**
     * Raw data parser. Either splits the string up and passes each line to
     * the line parser or just passes a single line to the line parser.
     *
     * @param  String  Incoming raw IRC message
     */
    public void parseData(String rawMessage) {
        if (rawMessage.indexOf("\n") != -1) {
            String[] messageList = rawMessage.split("\n");

            for (int idx = 0; idx < messageList.length; idx++) {
                String message = messageList[idx];
                parseLine(messageList[idx]);
            }
        } else {
            parseLine(rawMessage);
        }
    }

    /*
     * Parses one line of input.  This handles splitting apart the IRC message
     * into components, building up the tags information, getting the username,
     * pulling out the primary message, determining the event type and calling
     * a parser for that event.
     *
     * @param  String  Incoming single line of a raw IRC message
     */
    private void parseLine(String rawMessage) {
        //com.gmt2001.Console.out.println("rawMessage::" + rawMessage);
        Map<String, String> tagsMap = null;
        String messageParts[] = rawMessage.split(" :", 3);
        String userName = "";
        String eventCode = "";
        String message = "";

        /* Handle tags portion of message. */
        if (messageParts[0].startsWith("@")) {
            tagsMap = new HashMap<>();
            String[] tagParts = messageParts[0].substring(1).split(";");
            for (int idx = 0; idx < tagParts.length; idx++) {
                String[] keyValues = tagParts[idx].split("=");
                if (keyValues.length > 0) {
                    tagsMap.put(keyValues[0], keyValues.length == 1 ? "" : keyValues[1]);
                }
            }
            messageParts[0] = messageParts[1];
            if (messageParts.length > 2) {
                messageParts[1] = messageParts[2];
            }
        } else {
            tagsMap = new HashMap<>();
        }

        /* Cut leading space. */
        if (messageParts[0].startsWith(" ")) {
            messageParts[0] = messageParts[0].substring(1);
        }

        /* Cut leading space, trailing junk character, and assign message. */
        if (messageParts.length > 1) {
            if (messageParts[1].startsWith(" ")) {
                messageParts[1] = messageParts[1].substring(1);
            }
            message = messageParts[1];
            if (message.length() > 1) {
                message = message.substring(0, message.length() - 1);
            }
        } else {
            message = "";
        }

        /* Get username if present. */
        if (messageParts[0].indexOf("!") != -1) {
            userName = messageParts[0].substring(messageParts[0].indexOf("!") + 1, messageParts[0].indexOf("@"));
        }

        /* Get the event code. */
        eventCode = messageParts[0].split(" ")[1];

        /* Execute the event parser if a parser exists. */
        if (parserMap.containsKey(eventCode)) {
            parserMap.get(eventCode).exec(message, userName, tagsMap);
        }
    }

    /*
     * Joins a channel and sends the required Twitch CAP REQ data.
     * Note that this is sent directly and not added to the queue.
     */
    private void joinChannel() {
        webSocket.send("CAP REQ :twitch.tv/membership");
        webSocket.send("CAP REQ :twitch.tv/commands");
        webSocket.send("CAP REQ :twitch.tv/tags");

        webSocket.send("JOIN #" + channelName.toLowerCase());

        com.gmt2001.Console.out.println("Channel Joined [#" + channelName + "]");

        eventBus.postAsync(new IrcJoinCompleteEvent(session, channel));
    }

    /*
     * Handles commands.
     */
    private void commandEvent(String message, String username, Map<String, String> tagsMap) {
        String arguments = "";
        String command = message.substring(1);

        /** Does the command have arguments? */
        if (command.indexOf(" ") != -1) {
            String commandString = command;
            command = commandString.substring(0, commandString.indexOf(" "));
            arguments = commandString.substring(commandString.indexOf(" ") + 1);
        }

        /* Send the command event with the ircv3 tags from Twitch. */
        scriptEventManager.runDirect(new CommandEvent(username, command, arguments, tagsMap));
    }

    /*
     * ----------------------------------------------------------------------
     * Event Handling Methods. The below methods are all referenced from the
     * parserMap object.
     * ----------------------------------------------------------------------
     */

    /*
     * Handles the PRIVMSG event from IRC.
     *
     * @param String message
     * @param String username
     * @param Map<String, String> tagsMap
     */
    private void privMsg(String message, String username, Map<String, String> tagsMap) {
        /* Check to see if the user is using a ACTION in the channel. (/me) */
        if (message.startsWith("\001ACTION")) {
            message = message.replaceAll("\001", "").replace("ACTION", "/me");
        }

        /* Print the parsed message in the console. */
        com.gmt2001.Console.out.println(username + ": " + message);

        /* Check to see if the users disaplay name. Used in the scripts. */
        if (tagsMap.containsKey("display-name") && tagsMap.containsKey("user-id")) {
            usernameCache.addUser(username, tagsMap.get("display-name"), tagsMap.get("user-id"));
        }

        /* Check to see if the user is donating/cheering bits. */
        if (tagsMap.containsKey("bits")) {
            scriptEventManager.runDirect(new BitsEvent(session, channel, username, tagsMap.get("bits")));
        }

        /* Check to see if the user is a channel subscriber. */
        if (tagsMap.containsKey("subscriber") && tagsMap.get("subscriber").equals("1")) {
            eventBus.postAsync(new IrcPrivateMessageEvent(session, "jtv", "SPECIALUSER " + username + " subscriber", tagsMap));
        }

        /* Check to see if the user is a moderator. */
        if (tagsMap.containsKey("user-type")) {
            if (tagsMap.get("user-type").length() > 0) {
                if (!moderators.containsKey(username)) {
                    eventBus.postAsync(new IrcChannelUserModeEvent(session, channel, username, "O", true));
                    moderators.put(username, true);
                }
            } else {
                if (channelName.equalsIgnoreCase(username)) {
                    if (!moderators.containsKey(username)) {
                        eventBus.postAsync(new IrcChannelUserModeEvent(session, channel, username, "O", true));
                        moderators.put(username, true);
                    }
                } else {
                    if (moderators.containsKey(username)) {
                        eventBus.postAsync(new IrcChannelUserModeEvent(session, channel, username, "O", false));
                        moderators.remove(username);
                    }
                }
            }
        }
        
        /* Check if the message is a command */
        if (message.startsWith("!")) {
            commandEvent(message, username, tagsMap);
        }

        /* Send the moderation event. */
        scriptEventManager.runDirect(new IrcModerationEvent(session, username, message, channel, tagsMap));

        /* Send the message to the scripts. */
        eventBus.postAsync(new IrcChannelMessageEvent(session, username, message, channel, tagsMap));

        /* Send an event to check if a user is a sub. */
        // eventBus.postAsync(new IrcPrivateMessageEvent(session, "jtv", "user-check " + username, tagsMap));

        /* Print the IRCv3 tags if debug mode is on, this is last so it doesn't slow down the code above. */
        com.gmt2001.Console.debug.println("IRCv3 Tags: " + tagsMap);

        /* Incrememnt the chat lines, this should be the last operation of this function. */
        session.chatLinesIncr();
    }

    /*
     * Handles the CLEARCHAT event from IRC.
     *
     * @param String username
     * @param Map<String, String> tagsMap
     */
    private void clearChat(String username, Map<String, String> tagsMap) {
        String banDuration = "";
        String banReason = "";

        /* This should never happen, but just in case. */
        if (username == null) {
            return;
        }

        if (tagsMap.containsKey("ban-duration")) {
            banDuration = tagsMap.get("ban-duration");
        }

        if (tagsMap.containsKey("ban-reason")) {
            banReason = "Reason: " + tagsMap.get("ban-reason").replaceAll("\\\\s", " ");
        }
        eventBus.postAsync(new IrcClearchatEvent(session, channel, username, banReason, banDuration));
    }

    /*
     * Handles the WHISPER event from IRC.
     *
     * @param String message
     * @param String username
     * @param Map<String, String> tagsMap
     */
    private void whisperMessage(String message, String username, Map<String, String> tagsMap) {
        eventBus.postAsync(new IrcPrivateMessageEvent(session, username, message, tagsMap));
        com.gmt2001.Console.out.println("[WHISPER] " + username + ": " + message);
    }

    /*
     * Handles the NOTICE event from IRC.
     *
     * @param String message
     * @param String username
     * @param Map<String, String> tagsMap
     */
    private void noticeMessage(String message, String username, Map<String, String> tagsMap) {
        if (message.equals("Login authentication failed")) {
            com.gmt2001.Console.out.println();
            com.gmt2001.Console.out.println("Twitch Inidicated Login Failed. Check OAUTH password.");
            com.gmt2001.Console.out.println("Exiting PhantomBot.");
            com.gmt2001.Console.out.println();
            System.exit(0);
            return;
        } else if (message.equals("Invalid NICK")) {
            com.gmt2001.Console.out.println();
            com.gmt2001.Console.out.println("Twitch Inidicated Invalid Bot Name. Check 'user' setting in botlogin.txt");
            com.gmt2001.Console.out.println("Exiting PhantomBot.");
            com.gmt2001.Console.out.println();
            System.exit(0);
            return;
        } else {
            eventBus.postAsync(new IrcPrivateMessageEvent(session, "jtv", message, tagsMap));
            com.gmt2001.Console.debug.println("Message from jtv (NOTICE): " + message); 
        }
    }

    /*
     * Handles the JOIN event from IRC.
     *
     * @param String message
     * @param String username
     * @param Map<String, String> tagsMap
     */
    private void joinUser(String message, String username, Map<String, String> tagMaps) {
        eventBus.postAsync(new IrcChannelJoinEvent(session, channel, username));
        com.gmt2001.Console.debug.println("User Joined Channel [" + username + "#" + channelName + "]");
    }

    /*
     * Handles the PART event from IRC.
     *
     * @param String message
     * @param String username
     * @param Map<String, String> tagsMap
     */
    private void partUser(String message, String username, Map<String, String> tagMaps) {
        eventBus.postAsync(new IrcChannelLeaveEvent(session, channel, username, message));
        com.gmt2001.Console.debug.println("User Left Channel [" + username + "#" + channelName + "]");
    }

    /*
     * Handles the USERNOTICE event from IRC.
     *
     * @param String message
     * @param String username
     * @param Map<String, String> tagsMap
     */
    private void userNotice(String message, String username, Map<String, String> tagsMap) {
        if (tagsMap.containsKey("msg-id")) {
            if (tagsMap.get("msg-id").equalsIgnoreCase("resub")) {
                scriptEventManager.runDirect(new NewReSubscriberEvent(session, channel, tagsMap.get("login"), tagsMap.get("msg-param-months")));
            } else {
                if (tagsMap.get("msg-id").equalsIgnoreCase("sub")) {
                    if (tagsMap.get("msg-param-sub-plan").equalsIgnoreCase("Prime")) {
                        scriptEventManager.runDirect(new NewPrimeSubscriberEvent(session, channel, tagsMap.get("login")));
                    } else {
                        scriptEventManager.runDirect(new NewSubscriberEvent(session, channel, tagsMap.get("login"), tagsMap.get("msg-param-sub-plan")));
                    }
                }
            }
        }
        
        com.gmt2001.Console.debug.println("USERNOTICE: " + tagsMap);
    }

    /*
     * Handles the USERSTATE event from IRC.
     *
     * @param Map<String, String> tagsMap
     */
    private void userState(Map<String, String> tagMaps) {
        if (tagMaps.containsKey("user-type")) {
            if (tagMaps.get("user-type").length() > 0) {
                if (!moderators.containsKey(session.getNick())) {
                    moderators.put(session.getNick(), true);
                    eventBus.postAsync(new IrcChannelUserModeEvent(session, channel, session.getNick(), "O", true));
                    com.gmt2001.Console.debug.println("Bot::" + session.getNick() + "::Moderator::true");
                }
            } else { 
                if (this.channelName.equalsIgnoreCase(session.getNick())) {
                    if (!moderators.containsKey(session.getNick())) {
                        moderators.put(session.getNick(), true);
                        eventBus.postAsync(new IrcChannelUserModeEvent(session, channel, session.getNick(), "O", true));
                        com.gmt2001.Console.debug.println("Caster::Bot::" + session.getNick() + "::Moderator::true");
                    }
                } else if (tagMaps.containsKey("display-name") && !tagMaps.get("display-name").equalsIgnoreCase(session.getNick())) {
                    com.gmt2001.Console.out.println();
                    com.gmt2001.Console.out.println("[ERROR] oAuth token doesn't match the bot's Twitch account name.");
                    com.gmt2001.Console.out.println("[ERROR] Please go to http://twitchapps.com/tmi and generate a new token.");
                    com.gmt2001.Console.out.println("[ERROR] Be sure to go to twitch.tv and login as the bot before getting the token.");
                    com.gmt2001.Console.out.println("[ERROR] After, open the botlogin.txt file and replace the oauth= value with the token.");
                    com.gmt2001.Console.out.println();
                } else {
                    com.gmt2001.Console.out.println();
                    com.gmt2001.Console.out.println("[ERROR] " + session.getNick() + " is not detected as a moderator!");
                    com.gmt2001.Console.out.println("[ERROR] You must add " + session.getNick() + " as a channel moderator for it to chat.");
                    com.gmt2001.Console.out.println("[ERROR] Type /mod " + session.getNick() + " to add " + session.getNick() + " as a channel moderator.");
                    com.gmt2001.Console.out.println();
                    this.session.setAllowSendMessages(false);
                    if (moderators.containsKey(session.getNick())) {
                        moderators.remove(session.getNick());
                        eventBus.postAsync(new IrcChannelUserModeEvent(session, channel, session.getNick(), "O", false));
                        com.gmt2001.Console.debug.println("Bot::" + session.getNick() + "::Moderator::false");
                    }
                }
            }
        }
        com.gmt2001.Console.debug.println("USERSTATE: " + tagMaps);
    }
}
