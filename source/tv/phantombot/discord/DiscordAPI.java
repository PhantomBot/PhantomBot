/*
 * Copyright (C) 2016-2017 phantombot.tv
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

package tv.phantombot.discord;

import sx.blah.discord.modules.Configuration;

import sx.blah.discord.api.events.EventSubscriber;
import sx.blah.discord.api.IDiscordClient;
import sx.blah.discord.api.ClientBuilder;

import sx.blah.discord.handle.impl.events.MessageReceivedEvent;
import sx.blah.discord.handle.impl.events.UserLeaveEvent;
import sx.blah.discord.handle.impl.events.UserJoinEvent;
import sx.blah.discord.handle.impl.events.ReadyEvent;
import sx.blah.discord.handle.obj.IChannel;
import sx.blah.discord.handle.obj.IMessage;
import sx.blah.discord.handle.obj.IGuild;
import sx.blah.discord.handle.obj.IUser;

import sx.blah.discord.util.DiscordException;

/*
 * Communicates with the Discord API.
 *
 * @author Illusionaryone
 * @author ScaniaTV
 */
public class DiscordAPI extends DiscordUtil {
    private static final DiscordAPI instance = new DiscordAPI();
    public static IDiscordClient discordClient;
    public static IGuild guild;

    /*
     * Method to return this class object.
     *
     * @return {Object}
     */
    public static DiscordAPI instance() {
        return instance;
    }

    /*
     * Class constructor
     */
    private DiscordAPI() {
        Configuration.LOAD_EXTERNAL_MODULES = false;
        
        Thread.setDefaultUncaughtExceptionHandler(com.gmt2001.UncaughtExceptionHandler.instance());
    }

    /*
     * Method to connect to Discord.
     *
     * @param {String} token
     */
    public void connect(String token) {
        try {
            DiscordAPI.discordClient = new ClientBuilder().withToken(token).registerListener(new DiscordEventListener()).login();
        } catch (DiscordException ex) {
            com.gmt2001.Console.err.println("Failed to authenticate with Discord [" + ex.getClass().getSimpleName() + "] " + ex.getMessage());
        }
    }

    /*
     * Method to set the guild object.
     */
    private void setGuild() {
        DiscordAPI.guild = DiscordAPI.discordClient.getGuilds().get(0);
    }

    /*
     * Method to parse commands.
     *
     * @param {String} message
     */
    private void parseCommand(IUser user, IChannel channel, String message, boolean isAdmin) {
        String command = message.substring(1);
        String arguments = "";

        if (command.indexOf(" ") != -1) {
            String commandString = command;
            command = commandString.substring(0, commandString.indexOf(" "));
            arguments = commandString.substring(commandString.indexOf(" ") + 1);
        }

        //TODO: Update the discord event classes to work with Discord4J.
        //EventBus.instance().post(new DiscordCommandEvent(user, channel, command, arguments, isAdmin));
    }

    /*
     * Class to listen to events.
     */
    private class DiscordEventListener {

        @EventSubscriber
        public void onDiscordReadyEvent(ReadyEvent event) {
            com.gmt2001.Console.out.println("Successfully authenticated with Discord.");

            setGuild();
        }

        @EventSubscriber
        public void onDiscordMessageEvent(MessageReceivedEvent event) {
            IMessage iMessage = event.getMessage();
            IChannel iChannel = event.getChannel();
            IUser iUsername = event.getAuthor();

            String username = iUsername.getName().toLowerCase();
            String message = iMessage.getContent();
            String channel = iChannel.getName();
            boolean isAdmin = isAdministrator(iUsername);
            
            com.gmt2001.Console.out.println("[DISCORD] [#" + channel + "] " + username + ": " + message);

            if (message.startsWith("!")) {
                parseCommand(iUsername, iChannel, message, isAdmin);
            }

            //TODO: Update the discord event classes to work with Discord4J.
            //EventBus.instance().post(new DiscordMessageEvent(iUsername, iChannel, iMessage, isAdmin));
        }

        @EventSubscriber
        public void onDiscordUserJoinEvent(UserJoinEvent event) {
            //TODO: Update the discord event classes to work with Discord4J.
            //EventBus.instance().post(new DiscordJoinEvent(event.getUser()));
        }

        @EventSubscriber
        public void onDiscordUserLeaveEvent(UserLeaveEvent event) {
            //TODO: Update the discord event classes to work with Discord4J.
            //EventBus.instance().post(new DiscordLeaveEvent(event.getUser()));
        }
    }
}
