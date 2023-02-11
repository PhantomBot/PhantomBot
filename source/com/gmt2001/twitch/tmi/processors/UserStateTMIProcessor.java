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
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Arrays;
import java.util.Map;
import tv.phantombot.event.EventBus;
import tv.phantombot.event.irc.channel.IrcChannelUserModeEvent;

/**
 * Handles the USERSTATE TMI command
 *
 * @author gmt2001
 */
public final class UserStateTMIProcessor extends AbstractTMIProcessor {

    private boolean isModerator = false;
    private Instant nextWarning = Instant.MIN;
    private static final int WARNING_INTERVAL_MINUTES = 15;

    public UserStateTMIProcessor() {
        super(Arrays.asList("USERSTATE", "PART"));
    }

    @Override
    protected void onMessage(TMIMessage item) {
        if (item.command().equals("PART")) {
            if (item.nick().equalsIgnoreCase(this.user())) {
                this.isModerator = false;
                this.session().setAllowSendMessages(false);
                this.tmi().rateLimiter().switchLimit(this.isModerator);
            }
            return;
        }

        Map<String, String> tags = item.tags();

        if (this.property("channel").equalsIgnoreCase(this.user()) || tags.get("mod").equals("1") || !tags.get("user-type").isEmpty()) {
            if (!this.isModerator) {
                EventBus.instance().postAsync(new IrcChannelUserModeEvent(this.session(), this.user(), "O", true));
                this.isModerator = true;
                this.tmi().rateLimiter().switchLimit(this.isModerator);
            }
        } else {
            if (this.isModerator) {
                EventBus.instance().postAsync(new IrcChannelUserModeEvent(this.session(), this.user(), "O", false));
                this.isModerator = false;
                this.tmi().rateLimiter().switchLimit(this.isModerator);
            }

            if (nextWarning.isBefore(Instant.now())) {
                nextWarning = Instant.now().plus(WARNING_INTERVAL_MINUTES, ChronoUnit.MINUTES);
                com.gmt2001.Console.warn.println();
                com.gmt2001.Console.warn.println(this.user() + " is not detected as a moderator!");
                com.gmt2001.Console.warn.println("A lower rate limit is being used to prevent global muting.");
                com.gmt2001.Console.warn.println("To fix this, the broadcaster must add " + this.user() + " as a moderator in Stream Manager");
                com.gmt2001.Console.warn.println("or type the following command in Twitch Chat: /mod " + this.user());
                com.gmt2001.Console.warn.println();
            }
        }
    }

    @Override
    protected void onClose() {
        this.isModerator = false;
    }

}
