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
package tv.phantombot.event.command;

import java.util.HashMap;
import java.util.LinkedList;
import java.util.List;
import java.util.Map;
import tv.phantombot.event.Event;
import tv.phantombot.twitchwsirc.Channel;

public class CommandEvent extends Event {

    private final String sender;
    private final String arguments;
    private final Map<String, String> tags;
    private final Channel channel;
    private String command;
    private String[] args;

    public CommandEvent(String sender, String command, String arguments) {
        this.sender = sender;
        this.command = command;
        this.arguments = arguments;
        this.tags = new HashMap<>();
        this.channel = null;
        parse();
    }

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

    public String getSender() {
        return sender;
    }

    public String getCommand() {
        return command.toLowerCase();
    }

    public void setCommand(String command) {
        this.command = command;
    }

    public String[] getArgs() {
        return args;
    }

    public String getArguments() {
        return arguments;
    }

    public Map<String, String> getTags() {
        return tags;
    }

    public Channel getChannel() {
        return channel;
    }

    public String toEventSocket() {
        return (this.getSender() + "|" + this.getCommand() + "|" + this.getArguments() + "|" + this.getChannel());
    }
}
