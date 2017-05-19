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

package com.illusionaryone;

import sx.blah.discord.api.events.EventSubscriber;
import sx.blah.discord.api.IDiscordClient;
import sx.blah.discord.api.ClientBuilder;

import sx.blah.discord.handle.impl.events.MessageReceivedEvent;
import sx.blah.discord.handle.impl.events.UserLeaveEvent;
import sx.blah.discord.handle.impl.events.UserJoinEvent;
import sx.blah.discord.handle.impl.events.ReadyEvent;

import sx.blah.discord.util.DiscordException;

/*
 * Communicates with the Discord API.
 *
 * @author Illusionaryone
 * @author ScaniaTV
 */
public class Discord {
    private static final Discord instance = new Discord();
    private IDiscordClient discordAPI;

    /*
     * @function instance
     *
     * @return {Object}
     */
    public static Discord instance() {
        return instance;
    }

    /*
     * @function Discord
     */
    private Discord() {
        Thread.setDefaultUncaughtExceptionHandler(com.gmt2001.UncaughtExceptionHandler.instance());
    }

    /*
     * @function connect
     *
     * @param {String} token
     */
    public void connect(String token) {
        try {
            discordAPI = new ClientBuilder().withToken(token).registerListener(new DiscordEventListener()).login();
        } catch (DiscordException ex) {
            com.gmt2001.Console.err.println("Failed to authenticate with Discord [" + ex.getClass().getSimpleName() + "] " + ex.getMessage());
        }
    }

    /*
     * @function sendMessage
     *
     * @param {String} channelName
     * @param {String} message
     */
    public void sendMessage(String channelName, String message) {
        // send messages with the built in limiter.
    }

    /*
     * @class DiscordEventListener
     */
    public class DiscordEventListener {

        @EventSubscriber
        public void onDiscordReadyEvent(ReadyEvent event) {
            com.gmt2001.Console.out.println("Successfully authenticated with Discord.");
        }

        @EventSubscriber
        public void onDiscordMessageEvent(MessageReceivedEvent event) {
            com.gmt2001.Console.out.println("[DISCORD] [#" + event.getChannel().getName() + "] " + event.getAuthor().getName().toLowerCase() + ": " + event.getMessage().getContent());

            // parse commands and send this to the event bus.
        }

        @EventSubscriber
        public void onUserJoinEvent(UserJoinEvent event) {
            // send this event with the event bus. event.getUser()
        }

        @EventSubscriber
        public void onUserLeaveEvent(UserLeaveEvent event) {
            // send this event with the event bus. event.getUser()
        }
    }
}
