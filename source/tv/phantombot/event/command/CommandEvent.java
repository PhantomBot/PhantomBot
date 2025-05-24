/*
 * Copyright (C) 2016-2024 phantombot.github.io/PhantomBot
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

import com.gmt2001.twitch.tmi.TMIMessage;
import com.gmt2001.twitch.tmi.processors.PrivMsgTMIProcessor;

import tv.phantombot.CaselessProperties;
import tv.phantombot.event.Event;

public class CommandEvent extends Event {

    private final String sender;
    private final String command;
    private final String arguments;
    private final Map<String, String> tags;
    private final String[] args;
    private boolean handeled = false;

    /**
     * Class constructor for this event without tags. Always send tags if you can.
     *
     * @param sender
     * @param command
     * @param arguments
     */
    public CommandEvent(String sender, String command, String arguments) {
        this(sender, command, arguments, new HashMap<>());
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
        super();
        if (sender == null) {
            throw new NullPointerException("sender");
        }
        if (command == null) {
            throw new NullPointerException("command");
        }
        this.sender = sender;
        this.command = command;
        this.arguments = arguments;
        this.args = this.parse();
        this.tags = (tags == null ? new HashMap<>() : tags);
    }

    private String[] parse() {
        return parseArgs(this.arguments, ' ', -1, false).toArray(String[]::new);
    }

    /**
     * Method that parses the command arguments. Double quotes can be used to prevent an argument containing the delimiter from splitting. Double
     * quotes that are literals can be escaped with backslash. Backslash requires escaping with another backslash.
     *
     * @param arguments The arguments as a single string
     * @param delimiter The delimiter by which arguments are split. Can be any char except double-quote or backslash
     * @param limit The maximum number of arguments to return. -1 indicates unlimited. Once limit is reached, the delimiter is automatically escaped
     * @param limitNoEscape If set true and limit > 0, the argument at position limit is treated as a literal string, as if all quotes,
     * backslashes, and delimiters are already escaped
     *
     * @return A List<String> of arguments
     */
    public static List<String> parseArgs(String arguments, char delimiter, int limit, boolean limitNoEscape) {
        if (delimiter == '"' || delimiter == '\\') {
            throw new IllegalArgumentException("Cannot use double-quote(\") or backslash(\\\\) as a delimiter");
        }

        if (limit == 0) {
            return new LinkedList<>();
        }

        List<String> tmpArgs = new LinkedList<>();
        boolean inquote = false;
        boolean escape = false;
        boolean quoteJustClosed = false; // Initialize quoteJustClosed flag
        StringBuilder tmpStr = new StringBuilder();
        
        int internalLimit = (limit > 0) ? limit - 1 : -1;

        for (char c : arguments.toCharArray()) {
            if (c == '\\' && !escape && (internalLimit == -1 || tmpArgs.size() < internalLimit || !limitNoEscape)) {
                escape = true;
                quoteJustClosed = false; // Any escape sequence start resets this
            } else if (c == '"' && !escape && (internalLimit == -1 || tmpArgs.size() < internalLimit || !limitNoEscape)) {
                if (inquote) { // This is a closing quote
                    tmpArgs.add(tmpStr.toString());
                    tmpStr.setLength(0);
                }
                inquote = !inquote;
                if (!inquote) { // A quote was just closed
                    quoteJustClosed = true;
                } else { // A quote was just opened
                    quoteJustClosed = false;
                }
                escape = false;
            } else if (!inquote && c == delimiter && (internalLimit == -1 || tmpArgs.size() < internalLimit)) {
                if (escape) {
                    escape = false; 
                }
                if (quoteJustClosed && tmpStr.length() == 0) {
                    // Do not add an empty tmpStr if it's empty *because* a quote just closed.
                } else {
                    tmpArgs.add(tmpStr.toString());
                }
                tmpStr.setLength(0);
                quoteJustClosed = false; // Any delimiter processing resets this flag.
            } else {
                tmpStr.append(c);
                quoteJustClosed = false; // Appending a character means tmpStr is not empty due to a quote closing.
                escape = false; // Reset escape status.
            }
        }

        // After the main loop, if a trailing backslash was detected (escape flag is true)
        if (escape) { // Note: quoteJustClosed might be true here if input is e.g. "\"\\"
            if (limitNoEscape && limit > 0 && tmpArgs.size() == internalLimit) {
                tmpStr.append('\\'); // Append literal backslash
            }
            // Else, the trailing backslash is dropped.
        }

        // Add the final part (current tmpStr or an implied empty string if arguments ended with delimiter)
        boolean addFinalPart = false;
        if (tmpStr.length() > 0) {
            addFinalPart = true;
        } else if (!quoteJustClosed && arguments.length() > 0 && arguments.charAt(arguments.length() - 1) == delimiter) {
            // Only consider adding an empty part for a trailing delimiter if a quote didn't just close.
            addFinalPart = true;
        }
        
        if (addFinalPart) {
            if (limit == -1 || tmpArgs.size() < limit) {
                tmpArgs.add(tmpStr.toString());
            }
        }
        
        return tmpArgs;
    }

    /**
     * Indicates if the given message appears to be a command, defined as exclamation point {@code !} followed by any character except for a space
     *
     * @param message The message to check
     * @return {@code true} if the message appears to be a command; false if nick or parameters is {@code null}, or the message does not appear to be a command
     */
    public static boolean isCommand(TMIMessage message) {
        if (message.nick() == null || message.parameters() == null) {
            return false;
        }

        return isCommand(PrivMsgTMIProcessor.stripAction(message.parameters()));
    }

    /**
     * Indicates if the given message appears to be a command, defined as exclamation point {@code !} followed by any character except for a space
     *
     * @param message The message to check
     * @return {@code true} if the message appears to be a command
     */
    public static boolean isCommand(String message) {
        /*
         * @botproperty commandprefix - A single character, used as the command prefix for Twitch. Default `'!'`
         * @botpropertycatsort commandprefix 100 20 Twitch
         */
        return message.charAt(0) == CaselessProperties.instance().getPropertyAsChar("commandprefix", '!') && message.indexOf(' ') != 1;
    }

    /**
     * Converts the given message into a CommandEvent
     *
     * @param sender The sender of the message
     * @param message The message to convert
     * @param tags Any IRCv3 tags attached to the message
     * @return {@code null} if {@link #isCommand(java.lang.String)} returns {@code false}; otherwise a {@link CommandEvent}
     */
    public static CommandEvent asCommand(String sender, String message, Map<String, String> tags) {
        if (isCommand(message)) {
            int idx = message.indexOf(' ');
            return new CommandEvent(sender, idx > 1 ? message.substring(1, idx) : message.substring(1),
                    idx == -1 ? "" : message.substring(idx + 1), tags);
        }

        return null;
    }

    /**
     * Marks this command as handeled
     */
    public synchronized void handeled() {
        this.handeled = true;
    }

    /**
     * Indicates if this command has been handeled
     *
     * @return {@code true} if handeled
     */
    public boolean isHandeled() {
        return this.handeled;
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
