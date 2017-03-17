/*
 * Copyright (C) 2017 phantombot.tv
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

import com.googlecode.lanterna.TerminalSize;
import com.googlecode.lanterna.gui2.DefaultWindowManager;
import com.googlecode.lanterna.gui2.EmptySpace;
import com.googlecode.lanterna.gui2.MultiWindowTextGUI;
import com.googlecode.lanterna.gui2.Panel;
import com.googlecode.lanterna.gui2.TextBox;
import com.googlecode.lanterna.screen.Screen;
import com.googlecode.lanterna.screen.TerminalScreen;
import com.googlecode.lanterna.terminal.DefaultTerminalFactory;
import com.googlecode.lanterna.terminal.Terminal;
import com.googlecode.lanterna.terminal.TerminalFactory;
import java.io.IOException;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.concurrent.ConcurrentLinkedQueue;
import java.util.logging.Level;
import java.util.logging.Logger;
import org.apache.commons.lang3.StringUtils;

/**
 *
 * @author gmt2001
 */
public class Console implements Runnable
{

    private static final Console INSTANCE = new Console();
    private static final int MAXLINES = 50;
    private volatile boolean isRunning = false;
    private final ConcurrentLinkedQueue<String> consoleQueue = new ConcurrentLinkedQueue<>();

    public static Console instance()
    {
        if (!INSTANCE.isRunning)
        {
            new Thread(INSTANCE, "com.gmt2001.Console.Console").start();
        }

        return INSTANCE;
    }

    private Console()
    {
    }

    public void stop()
    {
        this.isRunning = false;
    }

    @Override
    @SuppressWarnings("SleepWhileInLoop")
    public void run()
    {
        this.isRunning = true;

        TerminalFactory f = new DefaultTerminalFactory();
        try (Terminal t = f.createTerminal(); Screen s = new TerminalScreen(t))
        {
            MultiWindowTextGUI g = new MultiWindowTextGUI(s, new DefaultWindowManager(), new EmptySpace());
            s.startScreen();

            TerminalSize tSize = t.getTerminalSize();
            Panel pOut = new Panel();
            TextBox tbOut = new TextBox();
            tbOut.setPreferredSize(new TerminalSize(tSize.getColumns(), tSize.getRows() - 1));
            tbOut.setReadOnly(true);

            while (this.isRunning)
            {
                if (!consoleQueue.isEmpty())
                {
                    List<String> ls = new ArrayList<>(Arrays.asList(tbOut.getText().split("\n")));
                    while (!consoleQueue.isEmpty())
                    {
                        addLine(ls, consoleQueue.poll());
                    }
                    tbOut.setText(StringUtils.join(ls, "\n"));
                }
                
                Thread.sleep(100);
            }

            s.stopScreen();
        } catch (IOException | InterruptedException ex)
        {
            err.logStackTrace(ex);
        }
    }

    private List<String> addLine(List<String> existings, String news)
    {
        if (news == null)
        {
            return existings;
        }

        while (existings.size() >= MAXLINES)
        {
            existings.remove(0);
        }

        existings.add(news);

        return existings;
    }
}
