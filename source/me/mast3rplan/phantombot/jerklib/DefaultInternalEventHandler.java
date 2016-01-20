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
package me.mast3rplan.phantombot.jerklib;

import java.util.HashMap;
import java.util.Map;
import me.mast3rplan.phantombot.jerklib.events.*;
import me.mast3rplan.phantombot.jerklib.events.IRCEvent.Type;
import static me.mast3rplan.phantombot.jerklib.events.IRCEvent.Type.*;
import me.mast3rplan.phantombot.jerklib.listeners.IRCEventListener;

/**
 * Class that will only handle events that effect internal states/caches. Like
 * channel nick lists. All events will be added to the ConnectionManager for
 * relaying. You can change the internal behavior of Jerklib by overriding
 * methods in this class or by adding/removing event handlers.
 *
 * @author mohadib
 * @see
 * me.mast3rplan.phantombot.jerklib.DefaultInternalEventHandler#addEventHandler(me.mast3rplan.phantombot.jerklib.events.IRCEvent.Type,
 * me.mast3rplan.phantombot.jerklib.listeners.IRCEventListener)
 * @see
 * me.mast3rplan.phantombot.jerklib.DefaultInternalEventHandler#removeEventHandler(me.mast3rplan.phantombot.jerklib.events.IRCEvent.Type)
 * @see me.mast3rplan.phantombot.jerklib.listeners.IRCEventListener
 */
public class DefaultInternalEventHandler implements IRCEventListener
{

    private final ConnectionManager manager;
    private final Map<Type, IRCEventListener> stratMap = new HashMap<>();

    /**
     * Creates a new DefaultInternalEventHandler associated with the given
     * ConnectionManager
     *
     * @param manager
     */
    public DefaultInternalEventHandler(ConnectionManager manager)
    {
        this.manager = manager;
        initStratMap();
    }

    /**
     * Adds an IRCEventListener to handle a given event Type. This should only
     * be used if you want to effect the internal behavior of Jerklib.
     *
     * @param type
     * @param listener
     */
    public void addEventHandler(Type type, IRCEventListener listener)
    {
        stratMap.put(type, listener);
    }

    /**
     * Removes any internal IRCEventListeners registered to handle the Type
     * passed in. This effects the internal behavior of Jerklib.
     *
     * @param type
     * @return true if a listener was removed , else false.
     */
    public boolean removeEventHandler(Type type)
    {
        return stratMap.remove(type) != null;
    }

    /**
     * Returns the event handler registerd to the Type given.
     *
     * @param type
     * @return The handler or null if no handler for Type
     */
    public IRCEventListener getEventHandler(Type type)
    {
        return stratMap.get(type);
    }


    /*
     * (non-Javadoc) @see
     * me.mast3rplan.phantombot.jerklib.listeners.IRCEventListener#receiveEvent(me.mast3rplan.phantombot.jerklib.events.IrcEvent)
     */
    @Override
    public void receiveEvent(IRCEvent event)
    {
        IRCEventListener l = stratMap.get(event.getType());

        if (l != null)
        {
            l.receiveEvent(event);
        } else
        {
            String command = event.command();
            switch (command)
            {
                case "PING":
                    event.getSession().getConnection().pong(event);
                    break;
                case "PONG":
                    event.getSession().getConnection().gotPong();
                    break;
            }
        }

        manager.addToRelayList(event);
    }

    /**
     * Called when a IrcJoinCompleteEvent is received
     *
     * @param e the event
     */
    public void joinComplete(IRCEvent e)
    {
        JoinCompleteEvent jce = (JoinCompleteEvent) e;
        if (e.getSession().getChannel(jce.getChannel().getName()) == null)
        {
            e.getSession().addChannel(jce.getChannel());
            jce.getSession().sayRaw("MODE " + jce.getChannel().getName());
        }
    }

    /**
     * Called when a JoinEvent is received.
     *
     * @param e the event
     */
    public void join(IRCEvent e)
    {
        JoinEvent je = (JoinEvent) e;
        je.getChannel().addNick(je.getNick());
    }

    /**
     * Called when a QuitEvent is received.
     *
     * @param e the event
     */
    public void quit(IRCEvent e)
    {
        QuitEvent qe = (QuitEvent) e;
        e.getSession().removeNickFromAllChannels(qe.getNick());
    }

    /**
     * Called when a PartEvent is received.
     *
     * @param e the event
     */
    public void part(IRCEvent e)
    {
        PartEvent pe = (PartEvent) e;
        if (pe.getNick().equalsIgnoreCase(e.getSession().getNick()))
        {
            pe.getSession().removeChannel(pe.getChannel());
        }
    }

    /**
     * Called when a NickChangeEvent is received
     *
     * @param e the event
     */
    public void nick(IRCEvent e)
    {
        NickChangeEvent nce = (NickChangeEvent) e;
        e.getSession().nickChanged(nce.getOldNick(), nce.getNewNick());
        if (nce.getOldNick().equals(e.getSession().getNick()))
        {
            Profile p = e.getSession().getRequestedConnection().getProfile();
            p.setActualNick(nce.getNewNick());
            p.setFirstNick(nce.getNewNick());
        }
    }

    /**
     * Called when a NickInUseEvent is received
     *
     * @param e the event
     */
    public void nickInUse(IRCEvent e)
    {
        Session session = e.getSession();
        if (!session.isLoggedIn() && session.getShouldUseAltNicks())
        {
            Profile p = session.getRequestedConnection().getProfile();
            NickInUseEvent niu = (NickInUseEvent) e;
            String usedNick = niu.getInUseNick();
            String newNick = "";
            if (usedNick.equals(p.getFirstNick()))
            {
                /*
                 * if first nick same as second will cause a loop
                 */
                if (p.getFirstNick().equals(p.getSecondNick()))
                {
                    return;
                }
                newNick = p.getSecondNick();
            } else if (usedNick.equals(p.getSecondNick()))
            {
                /*
                 * if second nick same as third will cause a loop
                 */
                if (p.getSecondNick().equals(p.getThirdNick()))
                {
                    return;
                }
                newNick = p.getThirdNick();
            }
            if (newNick.length() > 0)
            {
                session.changeNick(newNick);
            }
        }
    }

    /**
     * Called when a KickEvent is received
     *
     * @param e the event
     */
    public void kick(IRCEvent e)
    {
        KickEvent ke = (KickEvent) e;
        Session session = e.getSession();
        if (ke.getWho().equals(session.getNick()))
        {
            session.removeChannel(ke.getChannel());
            if (session.isRejoinOnKick())
            {
                session.join(ke.getChannel().getName());
            }
        }
    }

    /**
     * Called when ConnectionComplete event is received.
     *
     * @param e the event
     */
    public void connectionComplete(IRCEvent e)
    {
        /*
         * sometimes the server will change the nick when connecting for
         * instance , if the nick is too long it will be trunckated need to
         * check if this happend and send a nick update event
         */
        Session session = e.getSession();
        String nick = e.arg(0);
        String profileNick = session.getNick();
        if (!nick.equalsIgnoreCase(profileNick))
        {
            Profile pi = session.getRequestedConnection().getProfile();
            pi.setActualNick(nick);
            NickChangeEvent nce = new NickChangeEvent(
                    e.getRawEventData(),
                    session,
                    profileNick,
                    nick);
            manager.addToRelayList(nce);
        }

        ConnectionCompleteEvent ccEvent = (ConnectionCompleteEvent) e;
        session.getConnection().setHostName(ccEvent.getActualHostName());
        session.loginSuccess();
        session.connected();
    }

    /**
     * Called when a ModeEvent is received
     *
     * @param event
     */
    public void mode(IRCEvent event)
    {

        ModeEvent me = (ModeEvent) event;
        if (me.getModeType() == ModeEvent.ModeType.CHANNEL)
        {
            // update channel modes
            me.getChannel().updateModes(me.getModeAdjustments());
        } else
        {
            //user mode
            me.getSession().updateUserModes(me.getModeAdjustments());
        }
    }

    private void initStratMap()
    {
        stratMap.put(CONNECT_COMPLETE, new IRCEventListener()
        {
            @Override
            public void receiveEvent(IRCEvent e)
            {
                connectionComplete(e);
            }
        });

        stratMap.put(JOIN_COMPLETE, new IRCEventListener()
        {
            @Override
            public void receiveEvent(IRCEvent e)
            {
                joinComplete(e);
            }
        });

        stratMap.put(JOIN, new IRCEventListener()
        {
            @Override
            public void receiveEvent(IRCEvent e)
            {
                join(e);
            }
        });

        stratMap.put(QUIT, new IRCEventListener()
        {
            @Override
            public void receiveEvent(IRCEvent e)
            {
                quit(e);
            }
        });

        stratMap.put(PART, new IRCEventListener()
        {
            @Override
            public void receiveEvent(IRCEvent e)
            {
                part(e);
            }
        });

        stratMap.put(NICK_CHANGE, new IRCEventListener()
        {
            @Override
            public void receiveEvent(IRCEvent e)
            {
                nick(e);
            }
        });

        stratMap.put(NICK_IN_USE, new IRCEventListener()
        {
            @Override
            public void receiveEvent(IRCEvent e)
            {
                nickInUse(e);
            }
        });

        stratMap.put(KICK_EVENT, new IRCEventListener()
        {
            @Override
            public void receiveEvent(IRCEvent e)
            {
                kick(e);
            }
        });

        stratMap.put(MODE_EVENT, new IRCEventListener()
        {
            @Override
            public void receiveEvent(IRCEvent e)
            {
                mode(e);
            }
        });

    }
}
