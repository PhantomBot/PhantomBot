/*
 * Copyright (C) 2016-2020 phantom.bot
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

import java.util.LinkedList;
import java.util.HashMap;
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
     * @param {String} sender
     * @param {String} command
     * @param {String} arguments
     * @param {Map}    tags
     */
    public CommandEvent(String sender, String command, String arguments) {
        this.sender = sender;
        this.command = command;
        this.arguments = arguments;
        this.args = parse();
        this.tags = new HashMap<String, String>();
    }

    /**
     * Class constructor for this event.
     *
     * @param {String} sender
     * @param {String} command
     * @param {String} arguments
     * @param {Map}    tags
     */
    public CommandEvent(String sender, String command, String arguments, Map<String, String> tags) {
        this.sender = sender;
        this.command = command;
        this.arguments = arguments;
        this.args = parse();
        this.tags = (tags == null ? new HashMap<String, String>() : tags);
    }

    /**
     * Method that parses the command arguments.
     *
     * @return {String[]}
     */
    private String[] parse() {
        List<String> tmpArgs = new LinkedList<String>();
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

        return tmpArgs.toArray(new String[tmpArgs.size()]);
    }

    /**
     * Method that will return the sender of this command.
     *
     * @return {String} sender
     */
    public String getSender() {
        return this.sender;
    }

    /**
     * Method that will return the command name.
     *
     * @return {String}
     */
    public String getCommand() {
        return this.command.toLowerCase();
    }

    /**
     * Method that will return the string of arguments.
     *
     * @return {String} arguments
     */
    public String getArguments() {
        return this.arguments;
    }

    /**
     * Method that will return the array of arguments.
     *
     * @return {String[]} args
     */
    public String[] getArgs() {
        return this.args;
    }

    /**
     * Method that returns the IRCv3 tags in a map.
     *
     * @return {Map} tags
     */
    public Map<String, String> getTags() {
        return this.tags;
    }

    /**
     * Method that returns this object as a string.
     *
     * @return {String}
     */
    @Override
    public String toString() {
        return "CommandEvent -> { command: [" + this.command + "] sender: [" + this.sender + "] arguments: [" + this.arguments + "] tags: [" + this.tags + "] }";
    }
}
