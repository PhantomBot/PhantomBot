/*
 * Copyright (C) 2015 www.phantombot.net
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

        // :illusionaryone!illusionaryone@illusionaryone.tmi.twitch.tv PRIVMSG #notillusionaryone :hello
        // :illusionarybot!illusionarybot@illusionarybot.tmi.twitch.tv JOIN #notillusionaryone
        // :illusionaryone!illusionaryone@illusionaryone.tmi.twitch.tv PART #notillusionaryone
        // @badges=moderator/1;color=;display-name=IllusionaryBot;emotes=;mod=1;room-id=90595045;subscriber=0;turbo=0;user-id=106842370;user-type=mod :illusionarybot!illusionarybot@illusionarybot.tmi.twitch.tv PRIVMSG #notillusionaryone :hello
        // @badges=turbo/1;color=#317D1C;display-name=IllusionaryOne;emotes=;mod=0;room-id=90595045;subscriber=0;turbo=1;user-id=77632323;user-type= :illusionaryone!illusionaryone@illusionaryone.tmi.twitch.tv PRIVMSG #notillusionaryone :test
       // @badges=;color=#317D1C;display-name=IllusionaryOne;emotes=;message-id=61;thread-id=77632323_106842370;turbo=1;user-id=77632323;user-type= :illusionaryone!illusionaryone@illusionaryone.tmi.twitch.tv WHISPER illusionarybot :test

// @badges=turbo/1;color=#317D1C;display-name=IllusionaryOne;emotes=;mod=0;room-id=90595045;subscriber=0;turbo=1;user-id=77632323;user-type= :illusionaryone!illusionaryone@illusionaryone.tmi.twitch.tv PRIVMSG #notillusionaryone :ACTION jumps in the air

// @ban-duration=5;ban-reason=cuz\sreasons :tmi.twitch.tv CLEARCHAT #notillusionaryone :illusionaryone

/**
 * Twitch WS-IRC Client
 * @author: illusionaryone
 */

package me.mast3rplan.phantombot.twitchwsirc;

import com.google.common.collect.Maps;
import java.util.HashMap;
import java.util.Map;
import java.util.Map.Entry;
import java.util.ArrayList;

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
import me.mast3rplan.phantombot.event.command.CommandEvent;
import me.mast3rplan.phantombot.event.EventBus;

import org.java_websocket.WebSocket;

import me.mast3rplan.phantombot.PhantomBot;


/*
 * Create an interface that is used to create event handling methods.
 */
interface TwitchWSIRCCommand {
    void exec(String message, String username, Map<String, String> tagsMap);
}

public class TwitchWSIRCParser {

    private Map<String, TwitchWSIRCCommand> parserMap = new HashMap<String, TwitchWSIRCCommand>();
    private ArrayList<String> moderators = new ArrayList<>();
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

        parserMap.put("RECONNECT", new TwitchWSIRCCommand() {
            public void exec(String message, String username, Map<String, String> tagsMap) {
                //reconnect();
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
        if (messageParts[0].contains("!")) {
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
        webSocket.send("JOIN #" + this.channelName.toLowerCase());
        com.gmt2001.Console.out.println("Channel Joined [#" + this.channelName + "]");
        eventBus.postAsync(new IrcJoinCompleteEvent(this.session, this.channel));
    }

    /*
     * Handles commands.
     */
    private void commandEvent(String message, String username) {
        if (!message.startsWith("!")) {
            return;
        }

        String arguments = "";
        String command = message.substring(1);

        if (command.contains(" ")) {
            String commandString = command;
            command = commandString.substring(0, commandString.indexOf(" "));
            arguments = commandString.substring(commandString.indexOf(" ") + 1);
        }

        PhantomBot.instance().getScriptEventManagerInstance().runDirect(new CommandEvent(username, command, arguments));
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
        com.gmt2001.Console.out.println(username + ": " + message);

        if (tagsMap.containsKey("display-name")) {
            PhantomBot.instance().getUsernameCache().addUser(username, tagsMap.get("display-name"));
        }

        if (message.endsWith("subscribed!")) {
            if (username.equalsIgnoreCase("twitchnotify")) {
                PhantomBot.instance().getScriptEventManagerInstance().runDirect(new NewSubscriberEvent(this.session, channel, message.substring(0, message.indexOf(" ", 1))));
                com.gmt2001.Console.debug.println(message.substring(0, message.indexOf(" ", 1)) + " just subscribed!");
            }
        }

        if (tagsMap.containsKey("subscriber")) {
            if (tagsMap.get("subscriber").equals("1")) {
                com.gmt2001.Console.debug.println("Subscriber::" + username + "::true");
                eventBus.postAsync(new IrcPrivateMessageEvent(this.session, "jtv", "SPECIALUSER " + username + " subscriber", tagsMap)); 
            }
        }

        if (tagsMap.containsKey("user-type")) {
            if (tagsMap.get("user-type").length() > 0) {
                if (!moderators.contains(username.toLowerCase())) {
                    moderators.add(username.toLowerCase());
                    com.gmt2001.Console.debug.println("Moderator::" + username + "::true");
                    eventBus.postAsync(new IrcChannelUserModeEvent(this.session, this.channel, username, "O", true));
                }
            } else {
                if (this.channelName.equalsIgnoreCase(username)) {
                    if (!moderators.contains(username.toLowerCase())) {
                        moderators.add(username.toLowerCase());
                        com.gmt2001.Console.debug.println("Broadcaster::" + username + "::true");
                        eventBus.postAsync(new IrcChannelUserModeEvent(this.session, this.channel, username, "O", true));
                    }
                } else {
                    if (moderators.contains(username.toLowerCase())) {
                        moderators.remove(username.toLowerCase());
                        com.gmt2001.Console.debug.println("Moderator::" + username + "::false");
                        eventBus.postAsync(new IrcChannelUserModeEvent(this.session, this.channel, username, "O", false));
                    }
                }
            }
        }

        PhantomBot.instance().getScriptEventManagerInstance().runDirect(new IrcModerationEvent(this.session, username, message, this.channel, tagsMap));
        commandEvent(message, username);
        eventBus.post(new IrcChannelMessageEvent(this.session, username, message, this.channel, tagsMap));
    }

    /*
     * Handles the CLEARCHAT event from IRC.
     *
     * @param String username
     * @param Map<String, String> tagsMap
     */
    private void clearChat(String username, Map<String, String> tagsMap) {
        com.gmt2001.Console.debug.println(username + " has been timed out for " + tagsMap.get("ban-duration") + " seconds. Reason: " + tagsMap.get("ban-reason").replaceAll("\\\\s", " "));
        eventBus.postAsync(new IrcClearchatEvent(this.session, this.channel, username, tagsMap.get("ban-reason").replaceAll("\\\\s", " "), tagsMap.get("ban-duration")));
    }

    /*
     * Handles the WHISPER event from IRC.
     *
     * @param String message
     * @param String username
     * @param Map<String, String> tagsMap
     */
    private void whisperMessage(String message, String username, Map<String, String> tagsMap) {
        com.gmt2001.Console.out.println("Whisper: " + PhantomBot.instance().getUsernameCache().resolve(username, tagsMap) + ": " + message);
        eventBus.postAsync(new IrcPrivateMessageEvent(this.session, username, message, tagsMap));
    }

    /*
     * Handles the NOTICE event from IRC.
     *
     * @param String message
     * @param String username
     * @param Map<String, String> tagsMap
     */
    private void noticeMessage(String message, String username, Map<String, String> tagsMap) {
        if (message.equals("Error logging in")) {
            com.gmt2001.Console.out.println();
            com.gmt2001.Console.out.println("Twitch Inidicated Login Failed. Check OAUTH password.");
            com.gmt2001.Console.out.println("Exiting PhantomBot.");
            com.gmt2001.Console.out.println();
            System.exit(0);
            return;
        } else if (message.startsWith("The moderators of this room are: ")) {
            com.gmt2001.Console.debug.println("Message from jtv: " + message);
            eventBus.postAsync(new IrcPrivateMessageEvent(this.session, "jtv", message, tagsMap)); 
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
        com.gmt2001.Console.debug.println("User Joined Channel [" + username + "#" + this.channel + "]");
        eventBus.postAsync(new IrcChannelJoinEvent(this.session, this.channel, username));
    }

    /*
     * Handles the PART event from IRC.
     *
     * @param String message
     * @param String username
     * @param Map<String, String> tagsMap
     */
    private void partUser(String message, String username, Map<String, String> tagMaps) {
        com.gmt2001.Console.debug.println("User Left Channel [" + username + "#" + this.channel + "]");
        eventBus.postAsync(new IrcChannelLeaveEvent(this.session, this.channel, username, message));
    }

    /*
     * Handles the USERNOTICE event from IRC.
     *
     * @param String message
     * @param String username
     * @param Map<String, String> tagsMap
     */
    private void userNotice(String message, String username, Map<String, String> tagMaps) {
        if (tagMaps.containsKey("login") && tagMaps.containsKey("msg-param-months")) {
            PhantomBot.instance().getScriptEventManagerInstance().runDirect(new NewReSubscriberEvent(this.session, this.channel, tagMaps.get("login"), tagMaps.get("msg-param-months")));
            com.gmt2001.Console.debug.println(tagMaps.get("login") + " just subscribed for " + tagMaps.get("msg-param-months") + " months in a row!");
        }
    }

    /*
     * Handles the USERSTATE event from IRC.
     *
     * @param Map<String, String> tagsMap
     */
    private void userState(Map<String, String> tagMaps) {
        if (tagMaps.containsKey("user-type")) {
            if (tagMaps.get("user-type").length() > 0) {
                if (!moderators.contains(session.getNick())) {
                    moderators.add(session.getNick());
                    com.gmt2001.Console.debug.println("Bot::" + session.getNick() + "::Moderator::true");
                    eventBus.postAsync(new IrcChannelUserModeEvent(session, this.channel, session.getNick(), "O", true));
                }
            } else {
                com.gmt2001.Console.out.println("[ERROR] " + session.getNick() + " is not detected as a moderator!");
                com.gmt2001.Console.out.println("[ERROR] You must add " + session.getNick() + " as a channel moderator for it to chat.");
                session.setAllowSendMessages(false);
                if (moderators.contains(session.getNick())) {
                    moderators.remove(session.getNick());
                    com.gmt2001.Console.debug.println("Bot::" + session.getNick() + "::Moderator::false");
                    eventBus.postAsync(new IrcChannelUserModeEvent(session, this.channel, session.getNick(), "O", false));
                }
            }
        } else {
            if (this.channelName.equalsIgnoreCase(session.getNick())) {
                if (!moderators.contains(session.getNick())) {
                    moderators.add(session.getNick());
                    com.gmt2001.Console.debug.println("Bot::" + session.getNick() + "::Moderator::true");
                    eventBus.postAsync(new IrcChannelUserModeEvent(session, this.channel, session.getNick(), "O", true));
                }
            }
        }
    }

    /*
     * Handles the RECONNECT event from IRC.
     *
     */
    public void reconnect() {
        session.reconnect();
    }
}
