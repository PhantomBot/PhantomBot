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
package com.gmt2001.Console;

import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.TimeZone;
import tv.phantombot.PhantomBot;

public final class logTimestamp {

    private logTimestamp() {
    }

    public static String log() {
        SimpleDateFormat datefmt = new SimpleDateFormat("MM-dd-yyyy @ HH:mm:ss.SSS z");
        datefmt.setTimeZone(TimeZone.getTimeZone(PhantomBot.getTimeZone()));
        return datefmt.format(new Date());
    }
}
