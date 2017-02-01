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
package me.mast3rplan.phantombot.event.devcommand;

import java.util.HashMap;
import java.util.LinkedList;
import java.util.List;
import java.util.Map;
import me.mast3rplan.phantombot.event.Event;

public class DeveloperCommandEvent extends Event {

    private final String sender;
    private final String arguments;
    private final Map<String, String> tags;
    private final String id;
    private String command;
    private String[] args;

    /**
     * @function DeveloperCommandEvent
     *
     * @usage Used to send command events
     * @param {string} sender
     * @param {string} command
     * @param {string} arguments
     */
    public DeveloperCommandEvent(String sender, String command, String arguments, String id) {
        this.sender = sender;
        this.command = command;
        this.arguments = arguments;
        this.id = id;
        this.tags = new HashMap<>();
        parse();
    }

    /** 
     * @function parse
     *
     * @usage Used to parse the command arguments
     */
    private void parse() {
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
        args = new String[tmpArgs.size()];
        int i = 0;
        for (String s : tmpArgs) {
            args[i] = s;
            ++i;
        }
    }

    /** 
     * @function getSender
     *
     * @usage Used to get the username who sent the command
     * @return {string} sender
     */
    public String getSender() {
        return sender;
    }

    /** 
     * @function getCommand
     *
     * @usage Used to get the command that was used
     * @return {string} command
     */
    public String getCommand() {
        return command.toLowerCase();
    }

    /** 
     * @function getArgs
     *
     * @usage Used to get all the command arguments
     * @return {string array} args
     */
    public String[] getArgs() {
        return args;
    }

    /** 
     * @function getArguments
     *
     * @usage Used to get the entire string of arguments
     * @return {string} arguments
     */
    public String getArguments() {
        return arguments;
    }

    /** 
     * @function getTags
     *
     * @usage Used to get the IRCv3 tags
     * @return {map string} tags
     */
    public Map<String, String> getTags() {
        return tags;
    }

    /** 
     * @function getId
     *
     * @usage Used to get the developer id
     * @return {String} id
     */
    public String getId() {
        return id;
    }

    /** 
     * @function toEventSocket
     *
     * @usage Used to get the command information that is available 
     * @return {string} sender|command|arguments|channel
     */
    public String toEventSocket() {
        return (this.getSender() + "|" + this.getCommand() + "|" + this.getArguments());
    }
}
