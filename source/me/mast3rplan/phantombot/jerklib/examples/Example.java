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

import me.mast3rplan.phantombot.jerklib.ConnectionManager;
import me.mast3rplan.phantombot.jerklib.Profile;
import me.mast3rplan.phantombot.jerklib.Session;
import me.mast3rplan.phantombot.jerklib.events.IRCEvent;
import me.mast3rplan.phantombot.jerklib.events.IRCEvent.Type;
import me.mast3rplan.phantombot.jerklib.events.JoinCompleteEvent;
import me.mast3rplan.phantombot.jerklib.events.MessageEvent;
import me.mast3rplan.phantombot.jerklib.listeners.IRCEventListener;

/**
 * A simple example that demonsrates how to use JerkLib
 *
 * @author mohadib
 */
public class Example implements IRCEventListener
{

    private final ConnectionManager manager;

    @SuppressWarnings("LeakingThisInConstructor")
    public Example()
    {
        /*
         * ConnectionManager takes a Profile to use for new connections.
         */
        manager = new ConnectionManager(new Profile("scripy"));

        /*
         * One instance of ConnectionManager can connect to many IRC networks.
         * ConnectionManager#requestConnection(String) will return a Session
         * object. The Session is the main way users will interact with this
         * library and IRC networks
         */
        Session session = manager.requestConnection("irc.freenode.net");

        /*
         * JerkLib fires IRCEvents to notify users of the lib of incoming events
         * from a connected IRC server.
         */
        session.addIRCEventListener(this);

    }

    /*
     * This method is for implementing an IRCEventListener. This method will be
     * called anytime Jerklib parses an event from the Session its attached to.
     * All events are sent as IRCEvents. You can check its actual type and cast
     * it to a more specific type.
     */
    @Override
    public void receiveEvent(IRCEvent e)
    {

        if (e.getType() == Type.CONNECT_COMPLETE)
        {
            e.getSession().join("#me.mast3rplan.phantombot.jerklib");
        } else if (e.getType() == Type.CHANNEL_MESSAGE)
        {
            MessageEvent me = (MessageEvent) e;
            com.gmt2001.Console.out.println(me.getNick() + ":" + me.getMessage());
            me.getChannel().say("Modes :" + me.getChannel().getUsersModes(me.getNick()).toString());
        } else if (e.getType() == Type.JOIN_COMPLETE)
        {
            JoinCompleteEvent jce = (JoinCompleteEvent) e;
            /*
             * say hello
             */
            jce.getChannel().say("Hello from Jerklib!");
        } else
        {
            com.gmt2001.Console.out.println(e.getType() + " " + e.getRawEventData());
        }
    }

    @SuppressWarnings("ResultOfObjectAllocationIgnored")
    public static void main(String[] args)
    {
        new Example();
    }
}
