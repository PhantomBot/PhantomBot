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

import com.gmt2001.lanterna.gui2.InputTextBox;
import com.googlecode.lanterna.TerminalSize;
import com.googlecode.lanterna.TextColor;
import com.googlecode.lanterna.graphics.SimpleTheme;
import com.googlecode.lanterna.gui2.BasicWindow;
import com.googlecode.lanterna.gui2.DefaultWindowManager;
import com.googlecode.lanterna.gui2.Direction;
import com.googlecode.lanterna.gui2.EmptySpace;
import com.googlecode.lanterna.gui2.LinearLayout;
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
import org.apache.commons.lang3.StringUtils;

/**
 *
 * @author gmt2001
 */
public class Console implements Runnable
{

    private static final Console instance = new Console();
    private volatile boolean isRunning = false;
    private int maxlines = 50;
    private final ConcurrentLinkedQueue<String> consoleQueue = new ConcurrentLinkedQueue<>();

    public static Console instance() {
        if (!instance.isRunning) {
            new Thread(instance, "com.gmt2001.Console.Console").start();
        }

        return instance;
    }

    public static boolean isRunning() {
        return instance.isRunning;
    }

    private Console() {
    }

    public void stop() {
        this.isRunning = false;
    }

    @Override
    @SuppressWarnings("SleepWhileInLoop")
    public void run() {
        this.isRunning = true;

        TerminalFactory f = new DefaultTerminalFactory();
        try (Terminal t = f.createTerminal(); Screen s = new TerminalScreen(t)) {
            MultiWindowTextGUI g = new MultiWindowTextGUI(s, new DefaultWindowManager(), new EmptySpace());
            s.startScreen();

            TerminalSize tSize = t.getTerminalSize();
            Panel p = new Panel();
            p.setLayoutManager(new LinearLayout(Direction.VERTICAL));

            TextBox tbOut = new TextBox();
            tbOut.setPreferredSize(new TerminalSize(tSize.getColumns(), tSize.getRows() - 1));
            tbOut.setReadOnly(true);

            InputTextBox tbIn = new InputTextBox();
            tbIn.setPreferredSize(new TerminalSize(tSize.getColumns(), 1));
            tbIn.setVerticalFocusSwitching(false);
            tbIn.setTheme(SimpleTheme.makeTheme(false, TextColor.ANSI.CYAN, TextColor.ANSI.WHITE, TextColor.ANSI.CYAN, TextColor.ANSI.WHITE,
                    TextColor.ANSI.MAGENTA, TextColor.ANSI.RED, TextColor.ANSI.WHITE));

            p.addComponent(tbOut);
            p.addComponent(tbIn);
            BasicWindow w = new BasicWindow();
            w.setComponent(p);
            w.setFocusedInteractable(tbIn);
            g.addWindow(w);

            maxlines = tSize.getRows() - 1;

            while (this.isRunning) {
                if (!consoleQueue.isEmpty()) {
                    List<String> ls = new ArrayList<>(Arrays.asList(tbOut.getText().split("\n")));
                    
                    while (!consoleQueue.isEmpty()) {
                        ls.add(consoleQueue.poll());
                    }

                    while (ls.size() >= maxlines) {
                        ls.remove(0);
                    }

                    tbOut.setText(StringUtils.join(ls, "\n"));
                }
                
                Thread.sleep(100);
            }

            s.stopScreen();
        } catch (IOException | InterruptedException ex) {
            err.logStackTrace(ex);
        }
    }
}
