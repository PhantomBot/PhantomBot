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
package com.gmt2001.twitch.tmi.processors;

import com.gmt2001.twitch.tmi.TMIMessage;
import tv.phantombot.event.EventBus;
import tv.phantombot.event.irc.message.IrcPrivateMessageEvent;

/**
 * Handles the NOTICE TMI Command
 *
 * @author gmt2001
 */
public class NoticeTMIProcessor extends AbstractTMIProcessor {

    public NoticeTMIProcessor() {
        super("NOTICE");
    }

    @Override
    protected void onMessage(TMIMessage item) {
        if (item.tags().containsKey("msg-id")) {
            switch (item.tags().get("msg-id")) {
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
                    com.gmt2001.Console.err.println(item.tags().get("msg-id") + ": " + item.parameters());
                    break;
                default:
                    break;
            }
        }

        EventBus.instance().postAsync(new IrcPrivateMessageEvent(this.session(), "jtv", item.parameters(), item.tags()));
        com.gmt2001.Console.debug.println("Message from jtv (NOTICE): " + item.parameters());
    }

}
