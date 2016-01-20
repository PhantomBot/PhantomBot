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
import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.TimeZone;
import me.mast3rplan.phantombot.PhantomBot;

/**
 *
 * @author Gary Tekulsky
 */
public class in
{

    private static final in instance = new in();
    private static final BufferedReader br = new BufferedReader(new InputStreamReader(System.in));

    public static in instance()
    {
        return instance;
    }

    private in()
    {
    }

    public static String readLine() throws Exception
    {
        String s = br.readLine();

        if (PhantomBot.enableDebugging)
        {
            SimpleDateFormat datefmt = new SimpleDateFormat("MM-dd-yyyy @ HH:mm:ss");
            datefmt.setTimeZone(TimeZone.getTimeZone("GMT"));

            String timestamp = datefmt.format(new Date());

            Logger.instance().log(Logger.LogType.Input, timestamp + "Z " + s);
            Logger.instance().log(Logger.LogType.Blank, "");
        }

        return s;
    }
}
