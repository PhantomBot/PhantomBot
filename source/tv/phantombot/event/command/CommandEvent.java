/*
 * Copyright (C) 2016-2022 phantombot.github.io/PhantomBot
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
package tv.phantombot.event.command;

import java.util.HashMap;
import java.util.LinkedList;
import java.util.List;
import java.util.Map;
import tv.phantombot.event.Event;

public class CommandEvent extends Event {

    private final String sender;
    private final String command;
    private final String arguments;
    private final Map<String, String> tags;
    private final String[] args;

    /**
     * Class constructor for this event without tags. Always send tags if you can.
     *
     * @param sender
     * @param command
     * @param arguments
     */
    public CommandEvent(String sender, String command, String arguments) {
        super();
        this.sender = sender;
        this.command = command;
        this.arguments = arguments;
        this.args = parse();
        this.tags = new HashMap<>();
    }

    /**
     * Class constructor for this event.
     *
     * @param sender
     * @param command
     * @param arguments
     * @param tags
     */
    public CommandEvent(String sender, String command, String arguments, Map<String, String> tags) {
        this.sender = sender;
        this.command = command;
        this.arguments = arguments;
        this.args = parse();
        this.tags = (tags == null ? new HashMap<>() : tags);
    }

    /**
     * Method that parses the command arguments.
     *
     * @return
     */
    private String[] parse() {
        List<String> tmpArgs = new LinkedList<>();
        boolean inquote = false;
        String tmpStr = "";

        for (char c : arguments.toCharArray()) {
            if (c == '"') {
                inquote = !inquote;
            } else if (!inquote && c == ' ') {
                if (tmpStr.length() > 0) {
                    tmpArgs.add(tmpStr);
                    tmpStr = "";
                }
            } else {
                tmpStr += c;
            }
        }

        if (tmpStr.length() > 0) {
            tmpArgs.add(tmpStr);
        }

        return tmpArgs.toArray(String[]::new);
    }

    /**
     * Method that will return the sender of this command.
     *
     * @return sender
     */
    public String getSender() {
        return this.sender;
    }

    /**
     * Method that will return the command name.
     *
     * @return
     */
    public String getCommand() {
        return this.command.toLowerCase();
    }

    /**
     * Method that will return the string of arguments.
     *
     * @return arguments
     */
    public String getArguments() {
        return this.arguments;
    }

    /**
     * Method that will return the array of arguments.
     *
     * @return args
     */
    public String[] getArgs() {
        return this.args.clone();
    }

    /**
     * Method that returns the IRCv3 tags in a map.
     *
     * @return tags
     */
    public Map<String, String> getTags() {
        return this.tags;
    }

    /**
     * Method that returns this object as a string.
     *
     * @return
     */
    @Override
    public String toString() {
        return "CommandEvent -> { command: [" + this.command + "] sender: [" + this.sender + "] arguments: [" + this.arguments + "] tags: [" + this.tags + "] }";
    }
}
