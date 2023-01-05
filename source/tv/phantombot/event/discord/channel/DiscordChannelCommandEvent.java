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
package tv.phantombot.event.discord.channel;

import discord4j.core.object.entity.Message;
import discord4j.core.object.entity.User;
import discord4j.core.object.entity.channel.Channel;
import java.util.LinkedList;
import java.util.List;

public class DiscordChannelCommandEvent extends DiscordChannelEvent {

    private final String arguments;
    private final boolean isAdmin;
    private final String[] args;
    private String command;

    /**
     * Class constructor for this event.
     *
     * @param user
     * @param channel
     * @param command
     * @param arguments
     * @param isAdmin
     */
    public DiscordChannelCommandEvent(User user, Channel channel, Message message, String command, String arguments, boolean isAdmin) {
        super(user, channel, message);

        this.command = command;
        this.arguments = arguments;
        this.isAdmin = isAdmin;
        this.args = parse();
    }

    /**
     * Method that parses the command arguments.
     *
     * @return
     */
    private String[] parse() {
        List<String> tempArgs = new LinkedList<>();
        boolean hasQuote = false;
        String tempString = "";

        for (char c : arguments.toCharArray()) {
            if (c == '"') {
                hasQuote = !hasQuote;
            } else if (!hasQuote && c == ' ') {
                if (tempString.length() > 0) {
                    tempArgs.add(tempString);
                    tempString = "";
                }
            } else {
                tempString += c;
            }
        }

        if (tempString.length() > 0) {
            tempArgs.add(tempString);
        }

        return tempArgs.toArray(new String[tempArgs.size()]);
    }

    /**
     * Method that sets the command for this class. Mostly used for aliases.
     *
     * @return command
     */
    public String setCommand(String command) {
        this.command = command;
        return this.command;
    }

    /**
     * Method that returns the command.
     *
     * @return command
     */
    public String getCommand() {
        return this.command.toLowerCase();
    }

    /**
     * Method that returns the string of arguments.
     *
     * @return arguments
     */
    public String getArguments() {
        return this.arguments;
    }

    /**
     * Method that returns the array of arguments
     *
     * @return args
     */
    public String[] getArgs() {
        return this.args;
    }

    /**
     * Method that returns if the user a admin in the server.
     *
     * @retrun {boolean}
     */
    public boolean isAdmin() {
        return this.isAdmin;
    }

    /**
     * Method that returns this object as a string.
     *
     * @return
     */
    @Override
    public String toString() {
        return "DiscordChannelCommandEvent -> { command: [" + this.command + "] arguments: [" + this.arguments + "] isAdmin: [" + this.isAdmin + "] }";
    }
}
