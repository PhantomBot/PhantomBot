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
import me.mast3rplan.phantombot.jerklib.Channel;
import me.mast3rplan.phantombot.jerklib.ModeAdjustment;
import me.mast3rplan.phantombot.jerklib.Session;
import me.mast3rplan.phantombot.jerklib.events.*;
import me.mast3rplan.phantombot.jerklib.listeners.IRCEventListener;
import me.mast3rplan.phantombot.cache.UsernameCache;

public class IrcEventHandler implements IRCEventListener {

    private final ArrayList<String> mods = new ArrayList<>();
    private boolean nomodwarn = true;

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
            PhantomBot.instance().getScriptEventManagerInstance().runDirect(new IrcModerationEvent(session, cusername, cmessage, cchannel, cmessageTags));
        }
    }
      
    @Override
    public void receiveEvent(IRCEvent event) {
        if (PhantomBot.instance().isExiting()) {
            return;
        }

        EventBus eventBus = EventBus.instance();
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

            com.gmt2001.Console.debug.println("Message from Channel [" + cmessageEvent.getChannel().getName() + "] " + cmessageEvent.getNick());

            if (PhantomBot.enableDebugging) {
                com.gmt2001.Console.debug.println("Channel Message Tags");
                com.gmt2001.Console.debug.println("    Raw: " + cmessageEvent.tagsString());

                for (Map.Entry<String, String> tag : cmessageTags.entrySet()) {
                    com.gmt2001.Console.debug.println("    " + tag.getKey() + " = " + tag.getValue());
                }
            }
            if (cmessageTags.containsKey("display-name")) {
                PhantomBot.instance().getUsernameCache().addUser(cusername, cmessageTags.get("display-name"));
            }

            if (cmessageTags.containsKey("subscriber")) {
                if (cmessageTags.get("subscriber").equalsIgnoreCase("1")) {
                    eventBus.postAsync(new IrcPrivateMessageEvent(session, "jtv", "SPECIALUSER " + cmessageEvent.getNick() + " subscriber", cmessageTags));
                }
            }

            if (cmessageTags.containsKey("user-type")) {
                if (cmessageTags.get("user-type").length() > 0
                        || cmessageEvent.getChannel().getName().replaceAll("#", "").equalsIgnoreCase(cmessageEvent.getNick())) {
                    if (!mods.contains(cmessageEvent.getNick().toLowerCase())) {
                        mods.add(cmessageEvent.getNick().toLowerCase());
                        com.gmt2001.Console.debug.println("IrcChannelUserModeEvent(MOD)" + cmessageEvent.getNick());
                        eventBus.postAsync(new IrcChannelUserModeEvent(session, cmessageEvent.getChannel(), cmessageEvent.getNick(), "O", true));
                    }
                } else {
                    if (mods.contains(cmessageEvent.getNick().toLowerCase())) {
                        mods.remove(cmessageEvent.getNick().toLowerCase());
                        com.gmt2001.Console.debug.println("IrcChannelUserModeEvent(NOT MOD)" + cmessageEvent.getNick());
                        eventBus.postAsync(new IrcChannelUserModeEvent(session, cmessageEvent.getChannel(), cmessageEvent.getNick(), "O", false));
                    }
                }
            }

            try {
                ModerationRunnable moderationRunnable = new ModerationRunnable(eventBus, session, cusername, cmessage, cchannel, cmessageTags);
                new Thread(moderationRunnable).start();
            } catch (Exception ex) {
                PhantomBot.instance().getScriptEventManagerInstance().runDirect(new IrcModerationEvent(session, cusername, cmessage, cchannel, cmessageTags));
            }

            eventBus.post(new IrcChannelMessageEvent(session, cusername, cmessage, cchannel, cmessageTags));

            if (cmessageEvent.getChannel().getName().replaceAll("#", "").equalsIgnoreCase(cmessageEvent.getNick())) {
                if (!mods.contains(cmessageEvent.getNick().toLowerCase())) {
                    mods.add(cmessageEvent.getNick().toLowerCase());
                    com.gmt2001.Console.debug.println("IrcChannelUserModeEvent(MOD)" + cmessageEvent.getNick());
                    eventBus.postAsync(new IrcChannelUserModeEvent(session, cmessageEvent.getChannel(), cmessageEvent.getNick(), "O", true));
                }
            }

            break;
        case CTCP_EVENT:
            CtcpEvent ctcmessageEvent = (CtcpEvent) event;

            if (ctcmessageEvent.getCtcpString().startsWith("ACTION")) {
                Channel ctcchannel = ctcmessageEvent.getChannel();
                String ctcusername = ctcmessageEvent.getNick();
                String ctcmessage = ctcmessageEvent.getCtcpString().replace("ACTION", "/me");
                Map<String, String> ctcmessageTags = ctcmessageEvent.tags();

                com.gmt2001.Console.debug.println("Message from Channel [" + ctcmessageEvent.getChannel().getName() + "] " + ctcmessageEvent.getNick());

                if (ctcmessageTags.containsKey("subscriber")) {
                    if (ctcmessageTags.get("subscriber").equalsIgnoreCase("1")) {
                        eventBus.postAsync(new IrcPrivateMessageEvent(session, "jtv", "SPECIALUSER " + ctcmessageEvent.getNick() + " subscriber", ctcmessageTags));
                    }
                }

                if (ctcmessageTags.containsKey("user-type")) {
                    if (ctcmessageTags.get("user-type").length() > 0
                            || ctcmessageEvent.getChannel().getName().replaceAll("#", "").equalsIgnoreCase(ctcmessageEvent.getNick())) {
                        if (!mods.contains(ctcmessageEvent.getNick().toLowerCase())) {
                            mods.add(ctcmessageEvent.getNick().toLowerCase());
                            com.gmt2001.Console.debug.println("IrcChannelUserModeEvent(MOD)" + ctcmessageEvent.getNick());
                            eventBus.postAsync(new IrcChannelUserModeEvent(session, ctcmessageEvent.getChannel(), ctcmessageEvent.getNick(), "O", true));
                        }
                    } else {
                        if (mods.contains(ctcmessageEvent.getNick().toLowerCase())) {
                            mods.remove(ctcmessageEvent.getNick().toLowerCase());
                            com.gmt2001.Console.debug.println("IrcChannelUserModeEvent(NOTMOD)" + ctcmessageEvent.getNick());
                            eventBus.postAsync(new IrcChannelUserModeEvent(session, ctcmessageEvent.getChannel(), ctcmessageEvent.getNick(), "O", false));
                        }
                    }
                }

                try {
                    ModerationRunnable moderationRunnable = new ModerationRunnable(eventBus, session, ctcusername, ctcmessage, ctcchannel, ctcmessageTags);
                    new Thread(moderationRunnable).start();
                } catch (Exception ex) {
                    PhantomBot.instance().getScriptEventManagerInstance().runDirect(new IrcModerationEvent(session, ctcusername, ctcmessage, ctcchannel, ctcmessageTags));
                }
                
                eventBus.post(new IrcChannelMessageEvent(session, ctcusername, ctcmessage, ctcchannel, ctcmessageTags));

                if (ctcmessageEvent.getChannel().getName().replaceAll("#", "").equalsIgnoreCase(ctcmessageEvent.getNick())) {
                    if (!mods.contains(ctcmessageEvent.getNick().toLowerCase())) {
                        mods.add(ctcmessageEvent.getNick().toLowerCase());
                        com.gmt2001.Console.debug.println("IrcChannelUserModeEvent(MOD)" + ctcmessageEvent.getNick());
                        eventBus.postAsync(new IrcChannelUserModeEvent(session, ctcmessageEvent.getChannel(), ctcmessageEvent.getNick(), "O", true));
                    }
                }
            }
            break;
        case PRIVATE_MESSAGE:
            MessageEvent pmessageEvent = (MessageEvent) event;
            String pusername = pmessageEvent.getNick();
            String pmessage = pmessageEvent.getMessage();

            eventBus.postPVMSG(new IrcPrivateMessageEvent(session, pusername, pmessage, pmessageEvent.tags()));
            break;
        case MODE_EVENT:
            ModeEvent modeEvent = (ModeEvent) event;

            if (modeEvent.getChannel() != null && modeEvent.getChannel().getName().length() > 1
                    && modeEvent.getModeType() == ModeEvent.ModeType.CHANNEL) {
                List<ModeAdjustment> l = modeEvent.getModeAdjustments();
                for (ModeAdjustment adj : l) {
                    com.gmt2001.Console.out.println("MODE [" + modeEvent.getChannel().getName() + "] " + adj.toString());

                    if (adj.getArgument().length() > 0) {
                        if (String.valueOf(adj.getMode()).equalsIgnoreCase("O")) {
                            if (adj.getAction() == ModeAdjustment.Action.PLUS) {
                                mods.add(adj.getArgument().toLowerCase());
                            } else {
                                mods.remove(adj.getArgument().toLowerCase());
                            }
                        }
                        // Twitch seems to send a +o and -o, even when modded, disabling this method of determining mod
                        // status for now, rather the user-type will be used.
                        // 
                        // [03-06-2016 @ 06:45:50.052] ircChannelUserMode illusionarybot | o | true | true
                        // [03-06-2016 @ 06:45:50.052] ircChannelUserMode notillusionaryone | o | true | true
                        // [03-06-2016 @ 06:46:45.812] MODE [#notillusionaryone] +o illusionaryone
                        // [03-06-2016 @ 06:46:45.813] ircChannelUserMode illusionaryone | o | true | true
                        // ** User is still a mod here, but reported with -o (not a mod)
                        // [03-06-2016 @ 06:48:39.851] MODE [#notillusionaryone] -o illusionaryone
                        // [03-06-2016 @ 06:48:39.852] ircChannelUserMode illusionaryone | o | false | false
                        // [03-06-2016 @ 06:51:45.518] MODE [#notillusionaryone] +o illusionaryone
                        // [03-06-2016 @ 06:51:45.519] ircChannelUserMode illusionaryone | o | true | true
                        // [03-06-2016 @ 06:53:06.548] IrcChannelUserModeEvent(NOT MOD)illusionaryone
                        // [03-06-2016 @ 06:53:06.552] ircChannelUserMode illusionaryone | O | false | false
                        //
                        // com.gmt2001.Console.out.println("IrcChannelUserModeEvent()" + adj.getArgument() + " " + (adj.getAction() == ModeAdjustment.Action.PLUS));
                        // eventBus.postAsync(new IrcChannelUserModeEvent(session, modeEvent.getChannel(), adj.getArgument(),
                        //                 String.valueOf(adj.getMode()), adj.getAction() == ModeAdjustment.Action.PLUS));
                    }
                }
            }
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

            eventBus.postPVMSG(new IrcPrivateMessageEvent(session, "jtv", ((NoticeEvent) event).getNoticeMessage(), ((NoticeEvent) event).tags()));
            break;
        case DEFAULT:
            if (event.command().equalsIgnoreCase("USERNOTICE")) {
                Map<String, String> ceventTags = event.tags();
                String username = "";
                String system_msg = "";
                String months = "";

                // Captures the user defined message, we using aren't this yet, but adding the code for it.
                // Note that Twitch sends \s as spaces and this would need to be transformed to spaces.
                //
                if (ceventTags.containsKey("system-msg")) {
                    system_msg = ceventTags.get("system-msg");
                }
                if (ceventTags.containsKey("login")) {
                    username = ceventTags.get("login");
                }
                if (ceventTags.containsKey("msg-param-months")) {
                    months = ceventTags.get("msg-param-months");
                }
                eventBus.post(new IrcChannelMessageEvent(session, "twitchnotify", username + " just subscribed for " + months + " months in a row!", PhantomBot.instance().getChannel()));
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
                    if (ceventTags.get("user-type").length() > 0
                            || session.getChannel(event.arg(0)).getName().replaceAll("#", "").equalsIgnoreCase(PhantomBot.instance().getSession().getNick())) {
                        if (!mods.contains(PhantomBot.instance().getSession().getNick().toLowerCase())) {
                            mods.add(PhantomBot.instance().getSession().getNick().toLowerCase());
                            eventBus.postAsync(new IrcChannelUserModeEvent(session, session.getChannel(event.arg(0)), PhantomBot.instance().getSession().getNick(), "O", true));
                        }
                    } else {
                        if (nomodwarn) {
                            nomodwarn = false;
                            com.gmt2001.Console.err.println(PhantomBot.instance().getSession().getNick().toUpperCase() + " IS NOT DETECTED AS A MODERATOR!");
                            com.gmt2001.Console.err.println("IF " + PhantomBot.instance().getSession().getNick().toUpperCase() + " IS NOT A MODERATOR IT WILL NOT RESPOND TO COMMANDS!");
                            com.gmt2001.Console.err.println("MAKE SURE TO ADD " + PhantomBot.instance().getSession().getNick().toUpperCase() + " AS A MODERATOR BY TYPING /mod " + PhantomBot.instance().getSession().getNick());
                        }

                        if (mods.contains(PhantomBot.instance().getSession().getNick().toLowerCase())) {
                            mods.remove(PhantomBot.instance().getSession().getNick().toLowerCase());
                            eventBus.postAsync(new IrcChannelUserModeEvent(session, session.getChannel(event.arg(0)), PhantomBot.instance().getSession().getNick(), "O", false));
                        }
                    }
                }

                if (event.arg(0).replaceAll("#", "").equalsIgnoreCase(PhantomBot.instance().getSession().getNick())) {
                    if (!mods.contains(PhantomBot.instance().getSession().getNick().toLowerCase())) {
                        mods.add(PhantomBot.instance().getSession().getNick().toLowerCase());
                        com.gmt2001.Console.debug.println("Userstate marked bot Moderator (Broadcaster)");
                        eventBus.postAsync(new IrcChannelUserModeEvent(session, session.getChannel(event.arg(0)), PhantomBot.instance().getSession().getNick(), "O", true));
                    }
                }
            }
            if (event.command().equalsIgnoreCase("WHISPER")) {
                Map<String, String> weventTags = event.tags();
                String wusername = event.getNick();
                String message = event.arg(1);
                eventBus.postAsync(new IrcPrivateMessageEvent(session, wusername, message, weventTags));
            }
            break;
        }
    }
}
