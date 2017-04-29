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
package me.mast3rplan.phantombot.event.command;

import java.util.HashMap;
import java.util.LinkedList;
import java.util.List;
import java.util.Map;
import me.mast3rplan.phantombot.event.Event;
import me.mast3rplan.phantombot.twitchwsirc.Channel;

public class CommandEvent extends Event {

    private final String sender;
    private final String arguments;
    private final Map<String, String> tags;
    private final Channel channel;
    private String command;
    private String[] args;

    /**
     * @function CommandEvent
     *
     * @usage Used to send command events
     * @param {string} sender
     * @param {string} command
     * @param {string} arguments
     */
    public CommandEvent(String sender, String command, String arguments) {
        this.sender = sender;
        this.command = command;
        this.arguments = arguments;
        this.tags = new HashMap<>();
        this.channel = null;
        parse();
    }

    /**
     * @function CommandEvent
     *
     * @usage Used to send command events
     * @param {string} sender
     * @param {string} command
     * @param {string} arguments
     * @prarm {map} tags
     */
    public CommandEvent(String sender, String command, String arguments, Map<String, String> tags) {
        this.sender = sender;
        this.command = command;
        this.arguments = arguments;
        this.channel = null;

        if (tags == null) {
            this.tags = new HashMap<>();
        } else {
            this.tags = tags;
        }
        parse();
    }

    /**
     * @function CommandEvent
     *
     * @usage Used to send command events
     * @param {string} sender
     * @param {string} command
     * @param {string} arguments
     * @param {map} tags
     * @param {channel} channel
     */
    public CommandEvent(String sender, String command, String arguments, Map<String, String> tags, Channel channel) {
        this.sender = sender;
        this.command = command;
        this.arguments = arguments;
        this.channel = channel;

        if (tags == null) {
            this.tags = new HashMap<>();
        } else {
            this.tags = tags;
        }
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
     * @function setCommand
     *
     * @usage Used to change the command that was sent, mostly used for aliases
     * @param {string} command
     */
    public void setCommand(String command) {
        this.command = command;
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
     * @function getChannel
     *
     * @usage Used to get the channel the command was sent from
     * @return {channel} channel
     */
    public Channel getChannel() {
        return channel;
    }

    /** 
     * @function toEventSocket
     *
     * @usage Used to get the command information that is available 
     * @return {string} sender|command|arguments|channel
     */
    public String toEventSocket() {
        return (this.getSender() + "|" + this.getCommand() + "|" + this.getArguments() + "|" + this.getChannel());
    }

    /** 
     * @function isModerator
     *
     * @usage Used to see if the sender is a moderator or higher. This includes: Channel Moderator, Broadcaster, Global Moderator, Admin and Staff.
     * @return {boolean}
     */
    public Boolean isModerator() {
        return (tags.containsKey("user-type") && tags.get("user-type").length() > 0) || (tags.get("room-id").equals(tags.get("user-id")));
    }

    /** 
     * @function isSubscriber
     *
     * @usage Used to see if the sender is the channel subscriber.
     * @return {boolean}
     */
    public Boolean isSubscriber() {
        return (tags.containsKey("subscriber") && tags.get("subscriber").equals("1"));
    }

    /** 
     * @function isBroadCaster
     *
     * @usage Used to see if the sender is the caster.
     * @return {boolean}
     */
    public Boolean isBroadCaster() {
        return (tags.get("room-id").equals(tags.get("user-id")));
    }

    /** 
     * @function isGlobalModerator
     *
     * @usage Used to see if the sender is a Global Moderator
     * @return {boolean}
     */
    public Boolean isGlobalModerator() {
        return (tags.containsKey("user-type") && tags.get("user-type").equals("global_mod"));
    }

    /** 
     * @function isAdministrator
     *
     * @usage Used to see if the sender is a admin
     * @return {boolean}
     */
    public Boolean isAdministrator() {
        return (tags.containsKey("user-type") && tags.get("user-type").equals("admin"));
    }

    /** 
     * @function isStaff
     *
     * @usage Used to see if the sender is a staff
     * @return {boolean}
     */
    public Boolean isStaff() {
        return (tags.containsKey("user-type") && tags.get("user-type").equals("staff"));
    }
}
