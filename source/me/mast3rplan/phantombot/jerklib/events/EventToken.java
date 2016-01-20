/* 
 * Copyright (C) 2015 www.phantombot.net
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
package me.mast3rplan.phantombot.jerklib.events;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * A Class to parse a line of IRC text
 * <p/>
 * <
 * pre> &lt;message&gt; ::= [':' &lt;prefix&gt; &lt;SPACE&gt; ] &lt;command&gt;
 * &lt;params&gt; &lt;crlf&gt; &lt;prefix&gt; ::= &lt;servername&gt; |
 * &lt;nick&gt; [ '!' &lt;user&gt; ] [ '
 *
 * @' &lt;host&gt; ] &lt;command&gt; ::= &lt;letter&gt; { &lt;letter&gt; } |
 * &lt;number&gt; &lt;number&gt; &lt;number&gt; &lt;SPACE&gt; ::= ' ' { ' ' }
 * &lt;params&gt; ::= &lt;SPACE&gt; [ ':' &lt;trailing&gt; | &lt;middle&gt;
 * &lt;params&gt; ]
 *
 * &lt;middle&gt; ::= &lt;Any *non-empty* sequence of octets not including SPACE
 * or NUL or CR or LF, the first of which may not be ':'&gt; &lt;trailing&gt;
 * ::= &lt;Any, possibly *empty*, sequence of octets not including NUL or CR or
 * LF&gt;
 * </pre>
 *
 * @author mohadib
 */
public class EventToken
{

    private final String data;
    private String tagsString = "", argumentsString = "", prefix = "", command = "";
    private final List<String> arguments = new ArrayList<>();
    private final Map<String, String> tags = new HashMap<>();
    private int offset = 0;

    /**
     * Create a new EventToken
     *
     * @param data to parse
     */
    public EventToken(String data)
    {
        this.data = data;
        parse();
    }

    /**
     * Parse message
     */
    private void parse()
    {
        if (data.length() == 0)
        {
            return;
        }

        //see if message has prefix
        if (data.substring(offset).startsWith("@"))
        {
            extractTags(data);
            incTillChar();
        }

        //see if message has prefix
        if (data.substring(offset).startsWith(":"))
        {
            extractPrefix(data);
            incTillChar();
        }

        //get command
        if (data.length() > offset)
        {
            int idx = data.indexOf(" ", offset);

            if (idx >= 0)
            {
                command = data.substring(offset, idx);
                offset += command.length();
            }
        }

        incTillChar();
        extractArguments();
    }

    /**
     * Extract arguments from message
     */
    private void extractArguments()
    {
        String argument = "";
        argumentsString = data.substring(offset);

        if (argumentsString.startsWith(":"))
        {
            argumentsString = argumentsString.substring(1);
        }

        for (int i = offset; i < data.length(); i++)
        {
            if (!Character.isWhitespace(data.charAt(i)))
            {
                argument += data.charAt(i);

                //if argument.equals(":") then arg is everything till EOL
                if (argument.length() == 1 && argument.equals(":"))
                {
                    argument = data.substring(i + 1);
                    arguments.add(argument);
                    return;
                }
                offset++;
            } else
            {
                if (argument.length() > 0)
                {
                    arguments.add(argument);
                    argument = "";
                }
                offset++;
            }
        }

        if (argument.length() != 0)
        {
            arguments.add(argument);
        }
    }

    /**
     * Increment offset until a non-whitespace char is found
     */
    private void incTillChar()
    {
        for (int i = offset; i < data.length(); i++)
        {
            if (!Character.isWhitespace(data.charAt(i)))
            {
                return;
            }
            offset++;
        }
    }

    /**
     * Extract prefix part of messgae , inc offset
     *
     * @param data
     */
    private void extractPrefix(String data)
    {
        //set prefix - : is at 0
        prefix = data.substring(offset + 1, data.indexOf(" ", offset + 1));

        //increment offset , +1 is for : removed
        offset += prefix.length() + 1;
    }

    private void extractTags(String data)
    {
        //set tagsString - @ is at 0
        tagsString = data.substring(offset + 1, data.indexOf(" ", offset + 1));

        //increment offset , +1 is for @ removed
        //offset += tagsString.length() + 1;
        if (data.charAt(offset) == '@')
        {
            offset++;
        }

        String tag = "";
        String value = "";
        boolean onTag = true;

        for (int i = offset; i < data.length(); i++)
        {
            if (!Character.isWhitespace(data.charAt(i)) && data.charAt(i) != ';')
            {
                if (onTag)
                {
                    if (data.charAt(i) != '=')
                    {
                        tag += data.charAt(i);
                    } else
                    {
                        onTag = false;
                    }
                } else
                {
                    value += data.charAt(i);
                }

                offset++;
            } else
            {
                if (tag.length() > 0)
                {
                    tags.put(tag, value);
                    tag = "";
                    value = "";
                    onTag = true;
                }

                offset++;
            }

            if (Character.isWhitespace(data.charAt(i)))
            {
                break;
            }
        }
    }

    /**
     * Gets hostname from message
     *
     * @return hostname or empty string if hostname could not be parsed
     */
    public String getHostName()
    {
        int index = prefix.indexOf('@');
        if (index != -1 && index + 1 < prefix.length())
        {
            return prefix.substring(index + 1);
        }
        return "";
    }

    /**
     * Get username from message
     *
     * @return username or empty string is username could not be parsed.
     */
    public String getUserName()
    {
        int sindex = prefix.indexOf('!');
        int eindex = prefix.indexOf("@");
        if (eindex == -1)
        {
            eindex = prefix.length() - 1;
        }
        if (sindex != -1 && sindex + 1 < prefix.length())
        {
            return prefix.substring(sindex + 1, eindex);
        }
        return "";
    }

    /**
     * Get nick from message
     *
     * @return nick or empty string if could not be parsed
     */
    public String getNick()
    {
        if (prefix.contains("!"))
        {
            return prefix.substring(0, prefix.indexOf('!'));
        }
        return "";
    }

    public String tagsString()
    {
        return tagsString;
    }

    public Map<String, String> tags()
    {
        return tags;
    }

    /**
     * Gets message prefix if any
     *
     * @return returns prefix or empty string if no prefix
     */
    public String prefix()
    {
        return prefix;
    }

    /**
     * Gets the command. This will return the same result as numeric() if the
     * command is a numeric.
     *
     * @return the command
     */
    public String command()
    {
        return command;
    }

    /**
     * Gets list of arguments
     *
     * @return list of arguments
     */
    public List<String> args()
    {
        return arguments;
    }

    /**
     * Gets an argument
     *
     * @param index
     * @return the argument or null if no argument at that index
     */
    public String arg(int index)
    {
        if (index < arguments.size())
        {
            return arguments.get(index);
        }
        return null;
    }

    /**
     * Returns raw event data
     *
     * @return raw event data
     */
    public String getRawEventData()
    {
        return data;
    }

    /**
     * Get the numeric code of an event.
     *
     * @return numeric or -1 if command is not numeric
     */
    public int numeric()
    {
        int i = -1;
        try
        {
            i = Integer.parseInt(command);
        } catch (NumberFormatException e)
        {
        }
        return i;
    }

    /*
     * (non-Javadoc) @see java.lang.Object#toString()
     */
    @Override
    public String toString()
    {
        return data;
    }
}
