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
package me.mast3rplan.phantombot.jerklib.util;

import me.mast3rplan.phantombot.jerklib.ModeAdjustment;
import me.mast3rplan.phantombot.jerklib.ModeAdjustment.Action;
import me.mast3rplan.phantombot.jerklib.Session;
import me.mast3rplan.phantombot.jerklib.events.IRCEvent;
import me.mast3rplan.phantombot.jerklib.events.IRCEvent.Type;
import me.mast3rplan.phantombot.jerklib.events.ModeEvent;
import me.mast3rplan.phantombot.jerklib.tasks.TaskImpl;

import java.util.List;
import java.util.Timer;
import java.util.TimerTask;

/**
 * A Task to identify with NickServ and then join a list of channels names. Once
 * the Task has succsessfully identifed with NickServ TaskCompletion Listeners
 * will be notified with a true Boolean object.
 * <p/>
 * If 40 seconds passes and the mode event to indicate ident success has not
 * been received, TaskCompletion Listeners will be notified with a false Boolean
 * object.
 * <p/>
 * This plugin assumes Nickserv responds to the following syntax
 * <p/>
 * "identify password"
 * <p/>
 * To cancel this Task call cancel()
 * <p/>
 * Example Code:
 * <p/>
 * <
 * pre> final NickServAuthPlugin auth = new NickServAuthPlugin ( "letmein",
 * //password 'e', //mode char that indicates success session, //session
 * Arrays.asList("#me.mast3rplan.phantombot.jerklib" , "##swing") // list of
 * channels to join on success );
 *
 * // task listener is optional auth.addTaskListener(new
 * TaskCompletionListener() { public void taskComplete(Object result) {
 * if(result.equals(new Boolean(false))) { conman.quit(); } else {
 * com.gmt2001.Console.out.println("Authed!"); } } });
 * </pre>
 *
 * @author mohadib
 * @see Session#onEvent(me.mast3rplan.phantombot.jerklib.tasks.Task,
 * me.mast3rplan.phantombot.jerklib.events.IRCEvent.Type...)
 * @see Type
 */
public class NickServAuthPlugin extends TaskImpl
{

    private final Session session;
    private final String pass;
    private final char identMode;
    private final List<String> channels;
    private boolean authed;

    /**
     * @param pass - nickserv password
     * @param identMode - mode that indicates ident success
     * @param session - Session this Task is attatched to
     * @param channels - A list of channel names to join on ident success
     */
    @SuppressWarnings("LeakingThisInConstructor")
    public NickServAuthPlugin(
            String pass,
            char identMode,
            Session session,
            List<String> channels)
    {
        super("NickServAuth");
        this.pass = pass;
        this.identMode = identMode;
        this.session = session;
        this.channels = channels;

        session.onEvent(this, Type.CONNECT_COMPLETE, Type.MODE_EVENT);
    }

    /*
     * (non-Javadoc) @see
     * me.mast3rplan.phantombot.jerklib.listeners.IRCEventListener#receiveEvent(me.mast3rplan.phantombot.jerklib.events.IrcEvent)
     */
    @Override
    public void receiveEvent(IRCEvent e)
    {
        if (e.getType() == Type.CONNECT_COMPLETE)
        {
            connectionComplete(e);
        } else if (e.getType() == Type.MODE_EVENT)
        {
            mode(e);
        }
    }

    private void mode(IRCEvent e)
    {
        ModeEvent me = (ModeEvent) e;
        if (me.getModeType() == ModeEvent.ModeType.USER)
        {
            for (ModeAdjustment ma : me.getModeAdjustments())
            {
                if (ma.getMode() == identMode && ma.getAction() == Action.PLUS)
                {
                    authed = true;
                    joinChannels();
                    taskComplete(true);
                }
            }
        }
    }

    private void connectionComplete(IRCEvent e)
    {
        authed = false;
        e.getSession().sayPrivate("nickserv", "identify " + pass);
        final Timer t = new Timer();
        t.schedule(new TimerTask()
        {
            @Override
            public void run()
            {
                if (!authed)
                {
                    taskComplete(false);
                }
                this.cancel();
                t.cancel();
            }
        }, 40000);
    }

    private void joinChannels()
    {
        for (String name : channels)
        {
            session.join(name);
        }
    }
}
