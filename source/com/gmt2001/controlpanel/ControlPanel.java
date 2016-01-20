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
package com.gmt2001.controlpanel;

import java.io.IOException;
import java.util.HashMap;
import jcurses.event.ActionEvent;
import jcurses.event.ActionListener;
import jcurses.system.CharColor;
import jcurses.widgets.Button;
import jcurses.widgets.DefaultLayoutManager;
import jcurses.widgets.Panel;
import jcurses.widgets.PopUpMenu;
import jcurses.widgets.TextField;
import jcurses.widgets.WidgetsConstants;
import jcurses.widgets.Window;

/**
 *
 * @author gmt2001
 */
public class ControlPanel extends Thread implements ActionListener
{

    private static ControlPanel instance;
    private final Window w;
    private final DefaultLayoutManager mgr;
    private final Thread t;
    private final HashMap<String, Panel> panels = new HashMap<>();

    public ControlPanel instance()
    {
        return instance;
    }

    @SuppressWarnings("LeakingThisInConstructor")
    private ControlPanel()
    {
        w = new Window(80, 25, true, "PhantomBot Control Panel");
        w.setShadow(false);
        mgr = new DefaultLayoutManager();
        mgr.bindToContainer(w.getRootPanel());
        w.show();

        Panel menuBar = new Panel(80, 1);
        menuBar.setPanelColors(new CharColor(CharColor.BLUE, CharColor.RED, CharColor.NORMAL));
        DefaultLayoutManager menuBarmgr = new DefaultLayoutManager();
        menuBarmgr.bindToContainer(menuBar);

        Button b = new Button("Test");
        b.addListener(this);
        b.setColors(new CharColor(CharColor.BLUE, CharColor.WHITE, CharColor.NORMAL));
        b.setFocusedButtonColors(new CharColor(CharColor.MAGENTA, CharColor.WHITE, CharColor.BOLD));
        menuBarmgr.addWidget(b, 0, 0, 8, 1, WidgetsConstants.ALIGNMENT_CENTER, WidgetsConstants.ALIGNMENT_LEFT);

        b = new Button("Test 2");
        b.setColors(new CharColor(CharColor.BLUE, CharColor.WHITE, CharColor.NORMAL));
        b.setFocusedButtonColors(new CharColor(CharColor.MAGENTA, CharColor.WHITE, CharColor.BOLD));
        menuBarmgr.addWidget(b, 8, 0, 10, 1, WidgetsConstants.ALIGNMENT_CENTER, WidgetsConstants.ALIGNMENT_LEFT);

        menuBar.setVisible(true);

        Panel inputBar = new Panel(80, 1);
        DefaultLayoutManager inputBarmgr = new DefaultLayoutManager();
        inputBarmgr.bindToContainer(inputBar);

        TextField inputText = new TextField(79);
        inputText.setColors(new CharColor(CharColor.WHITE, CharColor.BLACK, CharColor.NORMAL));
        inputText.setTextComponentColors(new CharColor(CharColor.MAGENTA, CharColor.WHITE, CharColor.BOLD));
        inputBarmgr.addWidget(inputText, 0, 0, 79, 1, WidgetsConstants.ALIGNMENT_CENTER, WidgetsConstants.ALIGNMENT_LEFT);

        inputBar.setVisible(true);

        mgr.addWidget(menuBar, 0, 0, 80, 1, WidgetsConstants.ALIGNMENT_TOP, WidgetsConstants.ALIGNMENT_CENTER);
        mgr.addWidget(inputBar, 0, 22, 80, 1, WidgetsConstants.ALIGNMENT_TOP, WidgetsConstants.ALIGNMENT_CENTER);

        w.show();

        t = new Thread(new Runnable()
        {
            @Override
            public void run()
            {
                onExit();
            }
        });

        Runtime.getRuntime().addShutdownHook(t);
    }

    private void onExit()
    {
        w.close();
    }

    public static void main(String[] args) throws IOException
    {
        ControlPanel.instance = new ControlPanel();
        ControlPanel.instance.start();
    }

    @Override
    public void actionPerformed(ActionEvent event)
    {
        PopUpMenu m = new PopUpMenu(1, 2, "");
        m.add("Test 1");
        m.add("Test 2");
        m.add("Test 3");
        m.addSeparator();
        m.add("Test 4");
        m.show();
    }
}
