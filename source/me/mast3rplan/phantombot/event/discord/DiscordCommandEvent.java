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
package me.mast3rplan.phantombot.event.discord;

import net.dv8tion.jda.core.entities.User;
import net.dv8tion.jda.core.entities.Channel;

import java.util.LinkedList;
import java.util.List;

public class DiscordCommandEvent extends DiscordEvent {

	private final String arguments;
    private final Boolean isAdmin;
    private String command;
	private String[] args;

	public DiscordCommandEvent(User sender, Channel channel, String command, String arguments, Boolean isAdmin) {
        super(sender, channel);

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

    public Boolean isAdmin() {
        return this.isAdmin;
    }
}
