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
package com.gmt2001;

import java.io.FileNotFoundException;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.PrintStream;
import java.util.ArrayList;

public class Logger implements Runnable
{

    private static final Logger instance = new Logger();
    private boolean isRunning = false;
    private boolean disposed = false;
    private final ArrayList<LogItem> queue;

    @Override
    @SuppressWarnings("SleepWhileInLoop")
    public void run()
    {
        this.isRunning = true;

        while (!disposed)
        {
            if (!queue.isEmpty())
            {
                try
                {
                    try (FileOutputStream fos = new FileOutputStream("stdio.txt", true))
                    {
                        PrintStream ps = new PrintStream(fos);

                        if (queue.size() > 0)
                        {
                            LogItem i = queue.remove(0);

                            switch (i.t)
                            {
                                case Output:
                                    ps.println(">>" + i.s);
                                    break;
                                case Input:
                                    ps.println("<<" + i.s);
                                    break;
                                case Error:
                                    ps.println("!!" + i.s);
                                    break;
                                default:
                                    ps.println();
                                    break;
                            }
                        }
                    }
                } catch (FileNotFoundException ex)
                {
                    ex.printStackTrace(System.err);
                } catch (IOException ex)
                {
                    ex.printStackTrace(System.err);
                }
            } else
            {
                try
                {
                    Thread.sleep(500);
                } catch (InterruptedException ex)
                {
                    ex.printStackTrace(System.err);
                }
            }
        }
    }

    @Override
    protected void finalize() throws Throwable
    {
        super.finalize();

        this.disposed = true;
    }

    private class LogItem
    {

        public LogType t;
        public String s;

        public LogItem(LogType t, String s)
        {
            this.t = t;
            this.s = s;
        }
    }

    public enum LogType
    {

        Output,
        Input,
        Error,
        Blank
    }

    public static Logger instance()
    {
        if (!instance.isRunning)
        {
            (new Thread(instance)).start();
        }

        return instance;
    }

    private Logger()
    {
        this.queue = new ArrayList<>();
    }

    public void log(LogType t, String s)
    {
        this.queue.add(new LogItem(t, s));
    }
}
