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
import tv.phantombot.PhantomBot;

/**
 * Gets the authentication process started by requesting capabilities and sending NICK/PASS
 *
 * @author gmt2001
 */
public final class CapabilityTMIProcessor extends AbstractTMIProcessor {

    public CapabilityTMIProcessor() {
        super(new String[]{"CAP ACK", "CAP NAK", "NOTICE"});
    }

    @Override
    protected void onMessage(TMIMessage item) {
        if (item.command().equals("CAP NAK")) {
            com.gmt2001.Console.err.println("Some IRC capabilities were denied: " + item.parameters());
        } else if (item.command().equals("NOTICE")) {
            if (item.parameters().equals("Login authentication failed")) {
                com.gmt2001.Console.out.println();
                com.gmt2001.Console.out.println("Twitch rejected the bot (chat) OAuth");
                com.gmt2001.Console.out.println("Please re-auth the bot from the web panel");
                com.gmt2001.Console.out.println("The default url is https://localhost:25000/oauth/");
                com.gmt2001.Console.out.println();

                this.tmi().shutdown();
            } else if (item.parameters().equals("Invalid NICK")) {
                com.gmt2001.Console.out.println();
                com.gmt2001.Console.out.println("Twitch rejected the bot username");
                com.gmt2001.Console.out.println("Please check the user= value in botlogin.txt is set to the OAuth user");
                com.gmt2001.Console.out.println();

                this.tmi().shutdown();
                PhantomBot.exitError();
            }
        }
    }

    /**
     * Starts the authentication process by requesting capabilities and sending NICK/PASS
     */
    @Override
    protected void onOpen() {
        String pass = this.property("oauth");
        if (!pass.toLowerCase().startsWith("oauth:")) {
            pass = "oauth:" + pass;
        }

        this.tmi().sendCommand("CAP REQ", "twitch.tv/commands twitch.tv/membership twitch.tv/tags");
        this.tmi().sendRaw("PASS " + pass);
        this.tmi().sendRaw("NICK " + this.user());
    }
}
