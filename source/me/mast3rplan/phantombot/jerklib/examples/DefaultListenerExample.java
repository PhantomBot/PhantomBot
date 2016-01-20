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
package me.mast3rplan.phantombot.jerklib.examples;

import java.util.logging.Level;
import me.mast3rplan.phantombot.jerklib.Channel;
import me.mast3rplan.phantombot.jerklib.ConnectionManager;
import me.mast3rplan.phantombot.jerklib.Profile;
import me.mast3rplan.phantombot.jerklib.Session;
import me.mast3rplan.phantombot.jerklib.events.ConnectionCompleteEvent;
import me.mast3rplan.phantombot.jerklib.events.JoinCompleteEvent;
import me.mast3rplan.phantombot.jerklib.events.MessageEvent;
import me.mast3rplan.phantombot.jerklib.listeners.DefaultIRCEventListener;

public class DefaultListenerExample extends DefaultIRCEventListener implements Runnable
{

    public DefaultListenerExample()
    {
    }
    Session session;
    static final String CHANNEL_TO_JOIN = "#me.mast3rplan.phantombot.jerklib";

    @Override
    public void run()
    {
        ConnectionManager manager = new ConnectionManager(new Profile("ble", "bleh bleh", "ble", "ble_", "ble__"));

        session = manager.requestConnection("irc.freenode.net");

        session.addIRCEventListener(this);
    }

    @Override
    protected void handleJoinCompleteEvent(JoinCompleteEvent event)
    {
        event.getChannel().say("Hello from BaseListenerExample");
    }

    @Override
    protected void handleConnectComplete(ConnectionCompleteEvent event)
    {
        event.getSession().join(CHANNEL_TO_JOIN);
    }

    @Override
    protected void handleChannelMessage(MessageEvent event)
    {
        log.log(Level.INFO, "{0}:{1}:{2}", new Object[]
        {
            event.getChannel().getName(), event.getNick(), event.getMessage()
        });
        if ("now die".equalsIgnoreCase(event.getMessage()))
        {
            event.getChannel().say("Okay, fine, I'll die");
            try
            {
                Thread.sleep(2000);
            } catch (InterruptedException e)
            {
                com.gmt2001.Console.err.printStackTrace(e);
            }
            System.exit(0);
        }
    }

    public static void main(String[] args)
    {
        DefaultListenerExample ble = new DefaultListenerExample();
        Thread t = new Thread(ble);
        t.start();
        try
        {
            Thread.sleep(30000L); // give it the axe in 30!
        } catch (InterruptedException e)
        {
            com.gmt2001.Console.err.printStackTrace(e);
        }
        ble.sayGoodbye();
        try
        {
            Thread.sleep(5000); // let the message be written!
        } catch (InterruptedException e)
        {
            com.gmt2001.Console.err.printStackTrace(e);
        }
        System.exit(0);
    }

    private void sayGoodbye()
    {
        for (Channel chan : session.getChannels())
        {
            chan.say("I'm melting! (built-in sword of Damocles... or bucket of water, whatever)");
        }
    }
}
