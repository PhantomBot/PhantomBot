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
package me.mast3rplan.phantombot;

import com.gmt2001.Logger;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import me.mast3rplan.phantombot.event.EventBus;
import me.mast3rplan.phantombot.event.irc.channel.IrcChannelJoinEvent;
import me.mast3rplan.phantombot.event.irc.channel.IrcChannelLeaveEvent;
import me.mast3rplan.phantombot.event.irc.channel.IrcChannelUserModeEvent;
import me.mast3rplan.phantombot.event.irc.complete.IrcConnectCompleteEvent;
import me.mast3rplan.phantombot.event.irc.complete.IrcJoinCompleteEvent;
import me.mast3rplan.phantombot.event.irc.message.IrcChannelMessageEvent;
import me.mast3rplan.phantombot.event.irc.message.IrcModerationEvent;
import me.mast3rplan.phantombot.event.irc.message.IrcPrivateMessageEvent;
import me.mast3rplan.phantombot.event.irc.clearchat.IrcClearchatEvent;
import me.mast3rplan.phantombot.event.subscribers.NewReSubscriberEvent;
import me.mast3rplan.phantombot.event.subscribers.NewSubscriberEvent;
import me.mast3rplan.phantombot.event.command.CommandEvent;
import me.mast3rplan.phantombot.jerklib.Channel;
import me.mast3rplan.phantombot.jerklib.ModeAdjustment;
import me.mast3rplan.phantombot.jerklib.Session;
import me.mast3rplan.phantombot.jerklib.events.*;
import me.mast3rplan.phantombot.jerklib.listeners.IRCEventListener;
import me.mast3rplan.phantombot.cache.UsernameCache;
import me.mast3rplan.phantombot.script.ScriptEventManager;

public class IrcEventHandler implements IRCEventListener {

    private final ArrayList<String> mods = new ArrayList<>();
    private final ScriptEventManager scriptEventManager = ScriptEventManager.instance();
    private final UsernameCache usernameCache = UsernameCache.instance();
    private final EventBus eventBus = EventBus.instance();

    public void handleCommand(String username, String command) {
        String arguments = "";

        if (command.contains(" ")) {
            String commandString = command;
            command = commandString.substring(0, commandString.indexOf(" "));
            arguments = commandString.substring(commandString.indexOf(" ") + 1);
        }

        scriptEventManager.runDirect(new CommandEvent(username, command, arguments));
    }

    /**
     * Thread for starting the moderation event in the background.
     */
    public class ModerationRunnable implements Runnable {
        private Map<String, String> cmessageTags;
        private Channel cchannel;
        private String cusername;
        private String cmessage;
        private Session session;
        private EventBus eventBus;

        public ModerationRunnable(EventBus eventBus, Session session, String cusername, String cmessage, Channel cchannel, Map<String, String> cmessageTags) {
            this.eventBus = eventBus;
            this.session = session;
            this.cusername = cusername;
            this.cmessage = cmessage;
            this.cchannel = cchannel;
            this.cmessageTags = cmessageTags;
        }

        public void run() {
            scriptEventManager.runDirect(new IrcModerationEvent(session, cusername, cmessage, cchannel, cmessageTags));
        }
    }
      
    @Override
    public void receiveEvent(IRCEvent event) {
        if (PhantomBot.instance().isExiting()) {
            return;
        }

        Session session = event.getSession();

        switch (event.getType()) {

        case CONNECT_COMPLETE:
            com.gmt2001.Console.out.println("Connected to IRC " + session.getNick() + "@" + session.getConnectedHostName());
            eventBus.postAsync(new IrcConnectCompleteEvent(session));
            break;

        case JOIN_COMPLETE:
            com.gmt2001.Console.out.println("Channel Joined [" + ((JoinCompleteEvent) event).getChannel().getName() + "]");
            eventBus.postAsync(new IrcJoinCompleteEvent(session, ((JoinCompleteEvent) event).getChannel()));
            break;

        case JOIN:
            JoinEvent joinEvent = (JoinEvent) event;
            com.gmt2001.Console.debug.println("User Joined Channel [" + joinEvent.getChannelName() + "] " + joinEvent.getNick());
            eventBus.postAsync(new IrcChannelJoinEvent(session, joinEvent.getChannel(), joinEvent.getNick()));
            break;

        case PART:
            PartEvent partEvent = (PartEvent) event;
            mods.remove(partEvent.getNick().toLowerCase());
            com.gmt2001.Console.debug.println("User Left Channel [" + partEvent.getChannelName() + "] " + partEvent.getNick());
            eventBus.postAsync(new IrcChannelLeaveEvent(session, partEvent.getChannel(), partEvent.getNick(), partEvent.getPartMessage()));
            break;

        case CHANNEL_MESSAGE:
            MessageEvent cmessageEvent = (MessageEvent) event;
            Map<String, String> cmessageTags = cmessageEvent.tags();

            Channel cchannel = cmessageEvent.getChannel();
            String cusername = cmessageEvent.getNick();
            String cmessage = cmessageEvent.getMessage();

            com.gmt2001.Console.out.println(usernameCache.resolve(cusername, cmessageTags) + ": " + cmessage);

            if (cmessage.endsWith("subscribed!")) {
                if (cusername.equalsIgnoreCase("twitchnotify")) {
                    scriptEventManager.runDirect(new NewSubscriberEvent(session, cchannel, cmessage.substring(0, cmessage.indexOf(" ", 1))));
                }
            }

            if (PhantomBot.enableDebugging) {
                String rawTags = "IRCv3 Tags [Raw: " + cmessageEvent.tagsString() + "]";
                for (Map.Entry<String, String> tag : cmessageTags.entrySet()) {
                    rawTags += " [" + tag.getKey() + " = " + tag.getValue() + "]";
                }
                com.gmt2001.Console.debug.println(rawTags);
            }
            
            if (cmessageTags.containsKey("display-name")) {
                usernameCache.addUser(cusername, cmessageTags.get("display-name"));
            }

            if (cmessageTags.containsKey("subscriber")) {
                if (cmessageTags.get("subscriber").equalsIgnoreCase("1")) {
                    eventBus.postAsync(new IrcPrivateMessageEvent(session, "jtv", "SPECIALUSER " + cmessageEvent.getNick() + " subscriber", cmessageTags));
                }
            }

            if (cmessageTags.containsKey("user-type")) {
                if (cmessageTags.get("user-type").length() > 0) {
                    if (!mods.contains(cmessageEvent.getNick().toLowerCase())) {
                        mods.add(cmessageEvent.getNick().toLowerCase());
                        com.gmt2001.Console.debug.println("IrcChannelUserModeEvent(MOD): " + cmessageEvent.getNick());
                        eventBus.postAsync(new IrcChannelUserModeEvent(session, cmessageEvent.getChannel(), cmessageEvent.getNick(), "O", true));
                    }
                } else {
                    if (mods.contains(cmessageEvent.getNick().toLowerCase())) {
                        mods.remove(cmessageEvent.getNick().toLowerCase());
                        com.gmt2001.Console.debug.println("IrcChannelUserModeEvent(UNMOD): " + cmessageEvent.getNick());
                        eventBus.postAsync(new IrcChannelUserModeEvent(session, cmessageEvent.getChannel(), cmessageEvent.getNick(), "O", false));
                    }
                }
            } else {
                if (cmessageEvent.getChannel().getName().equalsIgnoreCase("#" + cmessageEvent.getNick())) {
                    if (!mods.contains(cmessageEvent.getNick().toLowerCase())) {
                        mods.add(cmessageEvent.getNick().toLowerCase());
                        com.gmt2001.Console.debug.println("IrcChannelUserModeEvent(MOD): " + cmessageEvent.getNick());
                        eventBus.postAsync(new IrcChannelUserModeEvent(session, cmessageEvent.getChannel(), cmessageEvent.getNick(), "O", true));
                    }
                }
            }

            try {
                ModerationRunnable moderationRunnable = new ModerationRunnable(eventBus, session, cusername, cmessage, cchannel, cmessageTags);
                new Thread(moderationRunnable).start();
            } catch (Exception ex) {
                scriptEventManager.runDirect(new IrcModerationEvent(session, cusername, cmessage, cchannel, cmessageTags));
            }

            if (cmessage.startsWith("!")) {
                handleCommand(cusername, cmessage.substring(1));
            }

            eventBus.post(new IrcChannelMessageEvent(session, cusername, cmessage, cchannel, cmessageTags));

            break;

        case CTCP_EVENT:
            CtcpEvent ctcmessageEvent = (CtcpEvent) event;

            if (ctcmessageEvent.getCtcpString().startsWith("ACTION")) {
                Channel ctcchannel = ctcmessageEvent.getChannel();
                String ctcusername = ctcmessageEvent.getNick();
                String ctcmessage = ctcmessageEvent.getCtcpString().replace("ACTION", "/me");
                Map<String, String> ctcmessageTags = ctcmessageEvent.tags();

                com.gmt2001.Console.out.println(usernameCache.resolve(ctcusername, ctcmessageTags) + ": " + ctcmessage);

                if (ctcmessageTags.containsKey("subscriber")) {
                    if (ctcmessageTags.get("subscriber").equalsIgnoreCase("1")) {
                        eventBus.postAsync(new IrcPrivateMessageEvent(session, "jtv", "SPECIALUSER " + ctcmessageEvent.getNick() + " subscriber", ctcmessageTags));
                    }
                }

                if (ctcmessageTags.containsKey("user-type")) {
                    if (ctcmessageTags.get("user-type").length() > 0) {
                        if (!mods.contains(ctcmessageEvent.getNick().toLowerCase())) {
                            mods.add(ctcmessageEvent.getNick().toLowerCase());
                            com.gmt2001.Console.debug.println("IrcChannelUserModeEvent(MOD): " + ctcmessageEvent.getNick());
                            eventBus.postAsync(new IrcChannelUserModeEvent(session, ctcmessageEvent.getChannel(), ctcmessageEvent.getNick(), "O", true));
                        }
                    } else {
                        if (mods.contains(ctcmessageEvent.getNick().toLowerCase())) {
                            mods.remove(ctcmessageEvent.getNick().toLowerCase());
                            com.gmt2001.Console.debug.println("IrcChannelUserModeEvent(UNMOD): " + ctcmessageEvent.getNick());
                            eventBus.postAsync(new IrcChannelUserModeEvent(session, ctcmessageEvent.getChannel(), ctcmessageEvent.getNick(), "O", false));
                        }
                    }
                } else {
                    if (ctcmessageEvent.getChannel().getName().equalsIgnoreCase("#" + ctcmessageEvent.getNick())) {
                        if (!mods.contains(ctcmessageEvent.getNick().toLowerCase())) {
                            mods.add(ctcmessageEvent.getNick().toLowerCase());
                            com.gmt2001.Console.debug.println("IrcChannelUserModeEvent(MOD): " + ctcmessageEvent.getNick());
                            eventBus.postAsync(new IrcChannelUserModeEvent(session, ctcmessageEvent.getChannel(), ctcmessageEvent.getNick(), "O", true));
                        }
                    }
                }

                try {
                    ModerationRunnable moderationRunnable = new ModerationRunnable(eventBus, session, ctcusername, ctcmessage, ctcchannel, ctcmessageTags);
                    new Thread(moderationRunnable).start();
                } catch (Exception ex) {
                    scriptEventManager.runDirect(new IrcModerationEvent(session, ctcusername, ctcmessage, ctcchannel, ctcmessageTags));
                }
                
                eventBus.post(new IrcChannelMessageEvent(session, ctcusername, ctcmessage, ctcchannel, ctcmessageTags));
            }
            break;

        case PRIVATE_MESSAGE:
            MessageEvent pmessageEvent = (MessageEvent) event;
            String pusername = pmessageEvent.getNick();
            String pmessage = pmessageEvent.getMessage();

            eventBus.postAsync(new IrcPrivateMessageEvent(session, pusername, pmessage, pmessageEvent.tags()));

            break;

        case MODE_EVENT:
            ModeEvent modeEvent = (ModeEvent) event;
            break;

        case NOTICE:
            String noticeMessage = ((NoticeEvent) event).getNoticeMessage();
            if (noticeMessage.startsWith("Error logging in") || noticeMessage.startsWith("Login unsuccessful")) {
                com.gmt2001.Console.out.println("");
                com.gmt2001.Console.out.println("Twitch Indicates the OAUTH Password is Incorrect. Please ensure that");
                com.gmt2001.Console.out.println("you generated an OAUTH for your bot account. This OAUTH value is to");
                com.gmt2001.Console.out.println("be placed in botlogin.txt as follows: oauth=oauth:your_oauth_key");
                com.gmt2001.Console.out.println("");
                com.gmt2001.Console.out.println("Login to Twitch using your bot account and then proceed to");
                com.gmt2001.Console.out.println("https://twitchapps.com/tmi/ to acquire the OAUTH token.");
                com.gmt2001.Console.out.println("");
                com.gmt2001.Console.out.println("Terminating PhantomBot");
                com.gmt2001.Console.out.println("");

                Logger.instance().log(Logger.LogType.Error, "\r\n" +
                                      "Twitch Indicates the OAUTH Password is Incorrect. Please ensure that\r\n" +
                                      "you generated an OAUTH for your bot account. This OAUTH value is to\r\n" +
                                      "be placed in botlogin.txt as follows: oauth=oauth:your_oauth_key\r\n\r\n" +
                                      "Login to Twitch using your bot account and then proceed to\r\n" +
                                      "https://twitchapps.com/tmi/ to acquire the OAUTH token.\r\n\r\n");
                System.exit(0);
            }

            eventBus.postAsync(new IrcPrivateMessageEvent(session, "jtv", ((NoticeEvent) event).getNoticeMessage(), ((NoticeEvent) event).tags()));
            break;

        case DEFAULT:
            if (event.command().equalsIgnoreCase("USERNOTICE")) {
                Map<String, String> ceventTags = event.tags();
                String username = "";
                String months = "";

                if (ceventTags.containsKey("login")) {
                    username = ceventTags.get("login");
                }

                if (ceventTags.containsKey("msg-param-months")) {
                    months = ceventTags.get("msg-param-months");
                }

                scriptEventManager.runDirect(new NewReSubscriberEvent(session, session.getChannel(event.arg(0)), username, months));
            }

            if (event.command().equalsIgnoreCase("CLEARCHAT")) {
                Map<String, String> ceventTags = event.tags();
                String username = event.arg(1);
                String ban_duration = "";
                String ban_reason = "";

                if (ceventTags.containsKey("ban-duration")) {
                    ban_duration = ceventTags.get("ban-duration");
                }
                if (ceventTags.containsKey("ban-reason")) {
                    ban_reason = ceventTags.get("ban-reason");
                }

                eventBus.postAsync(new IrcClearchatEvent(session, session.getChannel(event.arg(0)), username, ban_reason.replaceAll("\\\\s", " "), ban_duration));
            }
               

            if (event.command().equalsIgnoreCase("USERSTATE")) {
                Map<String, String> ceventTags = event.tags();

                if (ceventTags.containsKey("user-type")) {
                    if (ceventTags.get("user-type").length() > 0) {
                        if (!mods.contains(PhantomBot.instance().getSession().getNick().toLowerCase())) {
                            mods.add(PhantomBot.instance().getSession().getNick().toLowerCase());
                            com.gmt2001.Console.debug.println("Userstate marked bot Moderator (Broadcaster)");
                            eventBus.postAsync(new IrcChannelUserModeEvent(session, session.getChannel(event.arg(0)), PhantomBot.instance().getSession().getNick(), "O", true));
                        }
                    } else {
                        com.gmt2001.Console.err.println(PhantomBot.instance().getSession().getNick().toUpperCase() + " IS NOT DETECTED AS A MODERATOR!");
                        com.gmt2001.Console.err.println("IF " + PhantomBot.instance().getSession().getNick().toUpperCase() + " IS NOT A MODERATOR IT WILL NOT RESPOND TO COMMANDS!");
                        com.gmt2001.Console.err.println("MAKE SURE TO ADD " + PhantomBot.instance().getSession().getNick().toUpperCase() + " AS A MODERATOR BY TYPING /mod " + PhantomBot.instance().getSession().getNick());
                        com.gmt2001.Console.err.println("NOW SHUTTING DOWN...");
                        System.exit(0);

                        if (mods.contains(PhantomBot.instance().getSession().getNick().toLowerCase())) {
                            mods.remove(PhantomBot.instance().getSession().getNick().toLowerCase());
                            eventBus.postAsync(new IrcChannelUserModeEvent(session, session.getChannel(event.arg(0)), PhantomBot.instance().getSession().getNick(), "O", false));
                        }
                    }
                } else {
                    if (event.arg(0).equalsIgnoreCase("#" + PhantomBot.instance().getSession().getNick())) {
                        if (!mods.contains(PhantomBot.instance().getSession().getNick().toLowerCase())) {
                            mods.add(PhantomBot.instance().getSession().getNick().toLowerCase());
                            com.gmt2001.Console.debug.println("Userstate marked bot Moderator (Broadcaster)");
                            eventBus.postAsync(new IrcChannelUserModeEvent(session, session.getChannel(event.arg(0)), PhantomBot.instance().getSession().getNick(), "O", true));
                        }
                    }
                }
            }
            if (event.command().equalsIgnoreCase("WHISPER")) {
                Map<String, String> weventTags = event.tags();
                String wusername = event.getNick();
                String message = event.arg(1);
                eventBus.postPVMSG(new IrcPrivateMessageEvent(session, wusername, message, weventTags));
            }
            break;
        }
    }
}
