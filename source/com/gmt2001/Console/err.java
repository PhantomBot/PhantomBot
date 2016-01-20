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
package com.gmt2001.Console;

import com.gmt2001.Logger;
import java.io.PrintWriter;
import java.io.StringWriter;
import java.io.Writer;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.TimeZone;

/**
 *
 * @author Gary Tekulsky
 */
public class err
{

    private static final err instance = new err();

    public static err instance()
    {
        return instance;
    }

    private err()
    {
    }

    public static void print(Object o)
    {
        System.err.print(o);

        SimpleDateFormat datefmt = new SimpleDateFormat("MM-dd-yyyy @ HH:mm:ss");
        datefmt.setTimeZone(TimeZone.getTimeZone("GMT"));

        String timestamp = datefmt.format(new Date());

        Logger.instance().log(Logger.LogType.Error, timestamp + "Z " + o.toString());
    }

    public static void println()
    {
        System.err.println();
    }

    public static void println(Object o)
    {
        System.err.println(o);

        SimpleDateFormat datefmt = new SimpleDateFormat("MM-dd-yyyy @ HH:mm:ss");
        datefmt.setTimeZone(TimeZone.getTimeZone("GMT"));

        String timestamp = datefmt.format(new Date());

        Logger.instance().log(Logger.LogType.Error, timestamp + "Z " + o.toString());
        Logger.instance().log(Logger.LogType.Blank, "");
    }

    public static void printStackTrace(Throwable e)
    {
        e.printStackTrace(System.err);

        logStackTrace(e);
    }

    public static void logStackTrace(Throwable e)
    {
        Writer trace = new StringWriter();
        PrintWriter ptrace = new PrintWriter(trace);

        e.printStackTrace(ptrace);

        SimpleDateFormat datefmt = new SimpleDateFormat("MM-dd-yyyy @ HH:mm:ss");
        datefmt.setTimeZone(TimeZone.getTimeZone("GMT"));

        String timestamp = datefmt.format(new Date());

        Logger.instance().log(Logger.LogType.Error, timestamp + "Z " + trace.toString());
        Logger.instance().log(Logger.LogType.Blank, "");
    }
}
