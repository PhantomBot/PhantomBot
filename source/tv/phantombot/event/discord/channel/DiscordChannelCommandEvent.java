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

package tv.phantombot.event.discord.channel;

import sx.blah.discord.handle.obj.IUser;
import sx.blah.discord.handle.obj.IChannel;

import java.util.LinkedList;
import java.util.List;

public class DiscordChannelCommandEvent extends DiscordChannelEvent {
    private final String arguments;
    private final boolean isAdmin;
    private String command;
    private String[] args;

    public DiscordChannelCommandEvent(IUser user, IChannel channel, String command, String arguments, boolean isAdmin) {
        super(user, channel);

        this.command = command;
        this.arguments = arguments;
        this.isAdmin = isAdmin;
        parse();
    }

    private void parse() {
        List<String> tempArgs = new LinkedList<>();
        Boolean hasQuote = false;
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

        this.args = new String[tempArgs.size()];
        int i = 0;

        for (String s : tempArgs) {
            this.args[i] = s;
            ++i;
        }
    }

    public String setCommand(String command) {
        this.command = command;
        return this.command;
    }

    public String getCommand() {
        return this.command.toLowerCase();
    }

    public String getArguments() {
        return this.arguments;
    }

    public String[] getArgs() {
        return this.args;
    }

    public boolean isAdmin() {
        return this.isAdmin;
    }
}
