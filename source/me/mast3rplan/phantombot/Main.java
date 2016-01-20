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
package me.mast3rplan.phantombot;

import com.gmt2001.controlpanel.ControlPanel;
import java.io.IOException;

/**
 *
 * @author gmt2001
 */
public class Main
{

    public static void main(String[] args) throws IOException
    {
        for (String arg : args)
        {
            if (arg.startsWith("main="))
            {
                if (arg.substring(5).equalsIgnoreCase("controlpanel"))
                {
                    ControlPanel.main(args);
                    return;
                }

                if (arg.substring(5).equalsIgnoreCase("exit"))
                {
                    return;
                }
            }
        }

        PhantomBot.main(args);
    }
}
