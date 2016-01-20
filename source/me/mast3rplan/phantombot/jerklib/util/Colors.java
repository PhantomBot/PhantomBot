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
package me.mast3rplan.phantombot.jerklib.util;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

/**
 * To use: channel.say(Colors.BLUE + "HELLLLO"); <br> Will say hello in blue
 *
 * @author mohadib
 */
public final class Colors
{

    /**
     * Removes all applied color and formatting
     */
    public static final String NORMAL = "\u000f";
    /**
     * Bold text.
     */
    public static final String BOLD = "\u0002";
    /**
     * Underlined text
     */
    public static final String UNDERLINE = "\u001f";
    /**
     * Reversed text
     */
    public static final String REVERSE = "\u0016";
    /**
     * White colored text.
     */
    public static final String WHITE = "\u000300";
    /**
     * Black colored text.
     */
    public static final String BLACK = "\u000301";
    /**
     * Dark blue colored text.
     */
    public static final String DARK_BLUE = "\u000302";
    /**
     * Dark green colored text.
     */
    public static final String DARK_GREEN = "\u000303";
    /**
     * Red colored text.
     */
    public static final String RED = "\u000304";
    /**
     * Brown colored text.
     */
    public static final String BROWN = "\u000305";
    /**
     * Purple colored text.
     */
    public static final String PURPLE = "\u000306";
    /**
     * Olive colored text.
     */
    public static final String OLIVE = "\u000307";
    /**
     * Yellow colored text.
     */
    public static final String YELLOW = "\u000308";
    /**
     * Green colored text.
     */
    public static final String GREEN = "\u000309";
    /**
     * Teal colored text.
     */
    public static final String TEAL = "\u000310";
    /**
     * Cyan colored text.
     */
    public static final String CYAN = "\u000311";
    /**
     * Blue colored text.
     */
    public static final String BLUE = "\u000312";
    /**
     * Magenta colored text.
     */
    public static final String MAGENTA = "\u000313";
    /**
     * Dark gray colored text.
     */
    public static final String DARK_GRAY = "\u000314";
    /**
     * Light gray colored text.
     */
    public static final String LIGHT_GRAY = "\u000315";
    private static final List<String> colorList = new ArrayList<>();

    /*
     * Do not allow instantiation.
     */
    private Colors()
    {
    }

    static
    {
        colorList.add(Colors.BLACK);
        colorList.add(Colors.BLUE);
        colorList.add(Colors.BOLD);
        colorList.add(Colors.BROWN);
        colorList.add(Colors.CYAN);
        colorList.add(Colors.DARK_BLUE);
        colorList.add(Colors.DARK_GRAY);
        colorList.add(Colors.DARK_GREEN);
        colorList.add(Colors.GREEN);
        colorList.add(Colors.LIGHT_GRAY);
        colorList.add(Colors.MAGENTA);
        colorList.add(Colors.NORMAL);
        colorList.add(Colors.OLIVE);
        colorList.add(Colors.PURPLE);
        colorList.add(Colors.RED);
        colorList.add(Colors.TEAL);
        colorList.add(Colors.UNDERLINE);
        colorList.add(Colors.WHITE);
        colorList.add(Colors.YELLOW);
    }

    /**
     * Returns the list of all available colors.
     *
     * @return a list of all colors available
     */
    public static List<String> getColorsList()
    {
        return Collections.unmodifiableList(colorList);
    }
}
