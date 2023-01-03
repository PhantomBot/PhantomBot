/*
 * Copyright (C) 2016-2023 phantombot.github.io/PhantomBot
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
package com.gmt2001;

import java.time.Duration;
import java.time.temporal.ChronoUnit;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Converts duration strings into a {@link Duration}
 *
 * @author gmt2001
 */
public class DurationString {

    private DurationString() {
    }

    private static final Pattern DURATIONPATTERN = Pattern.compile("((?<Weeks>[0-9]+)[Ww])?((?<Days>[0-9]+)[Dd])?((?<Hours>[0-9]+)[Hh])?((?<Mins>[0-9]+)[Mm])?((?<Secs>[0-9]+)[Ss])?");

    /**
     * Converts the given input string into a {@link Duration}
     *
     * @param input A string to parse in the format {@code nWnDnHnMnS}
     * @return A {@link Duration} representing the amount of time in the string; if a {@link NumberFormatException} occurs, {@link Duration.ZERO}
     */
    public static Duration from(String input) {
        Matcher m = DURATIONPATTERN.matcher(input);
        if (m.find()) {
            try {
                Duration d = Duration.ZERO;
                String s;
                if ((s = m.group("Weeks")) != null) {
                    d = d.plus(Integer.parseInt(s), ChronoUnit.WEEKS);
                }
                if ((s = m.group("Days")) != null) {
                    d = d.plus(Integer.parseInt(s), ChronoUnit.DAYS);
                }
                if ((s = m.group("Hours")) != null) {
                    d = d.plus(Integer.parseInt(s), ChronoUnit.HOURS);
                }
                if ((s = m.group("Mins")) != null) {
                    d = d.plus(Integer.parseInt(s), ChronoUnit.MINUTES);
                }
                if ((s = m.group("Secs")) != null) {
                    d = d.plus(Integer.parseInt(s), ChronoUnit.SECONDS);
                }
                return d;
            } catch (NumberFormatException ex) {
                com.gmt2001.Console.err.printStackTrace(ex);
            }
        }

        return Duration.ZERO;
    }
}
