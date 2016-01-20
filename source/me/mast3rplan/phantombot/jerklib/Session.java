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

import java.util.*;
import java.util.concurrent.ConcurrentLinkedQueue;
import me.mast3rplan.phantombot.PhantomBot;
import me.mast3rplan.phantombot.jerklib.ModeAdjustment.Action;
import me.mast3rplan.phantombot.jerklib.events.ConnectionLostEvent;
import me.mast3rplan.phantombot.jerklib.events.IRCEvent.Type;
import me.mast3rplan.phantombot.jerklib.listeners.IRCEventListener;
import me.mast3rplan.phantombot.jerklib.parsers.InternalEventParser;
import me.mast3rplan.phantombot.jerklib.tasks.Task;

/**
 * Session contains methods to manage an IRC connection. Like
 * {@link me.mast3rplan.phantombot.jerklib.Session#changeNick(String)} , {@link me.mast3rplan.phantombot.jerklib.Session#setRejoinOnKick(boolean)} , {@link me.mast3rplan.phantombot.jerklib.Session#getUserModes()}
 * etc.
 * <p/>
 * Session is where Tasks and Listeners should be added to be notified of
 * IRCEvents coming from the connected server.
 * <p/>
 * You can override the default parsing and internal event handling of a Session
 * with
 * {@link me.mast3rplan.phantombot.jerklib.Session#setInternalEventHandler(me.mast3rplan.phantombot.jerklib.listeners.IRCEventListener)}
 * and
 * {@link me.mast3rplan.phantombot.jerklib.Session#setInternalParser(me.mast3rplan.phantombot.jerklib.parsers.InternalEventParser)}.
 * <p/>
 * New Session instances are obtained by requesting a connection with the
 * ConnectionManager
 *
 * @author mohadib
 * @see ConnectionManager#requestConnection(String)
 * @see ConnectionManager#requestConnection(String, int)
 * @see ConnectionManager#requestConnection(String, int,
 * me.mast3rplan.phantombot.jerklib.Profile)
 */
public class Session extends RequestGenerator
{

    private final List<IRCEventListener> listenerList = new ArrayList<>();
    private final Map<Type, List<Task>> taskMap = new HashMap<>();
    private final RequestedConnection rCon;
    private Connection con;
    private final ConnectionManager conman;
    private boolean rejoinOnKick = true, isAway, isLoggedIn, useAltNicks = true;
    private long lastRetry = -1, lastResponse = System.currentTimeMillis();
    private final ServerInformation serverInfo = new ServerInformation();
    private State state = State.DISCONNECTED;
    private InternalEventParser parser;
    private IRCEventListener internalEventHandler;
    private final List<ModeAdjustment> userModes = new ArrayList<>();
    private final Map<String, Channel> channelMap = new HashMap<>();
    private final ConcurrentLinkedQueue<Message> messages = new ConcurrentLinkedQueue<>();
    private int retries = 0;
    public boolean isClosing = false;
    private final Timer sayTimer = new Timer();

    public enum State
    {

        CONNECTED,
        CONNECTING,
        HALF_CONNECTED,
        DISCONNECTED,
        MARKED_FOR_REMOVAL,
        NEED_TO_PING,
        PING_SENT,
        NEED_TO_RECONNECT
    }

    class Message
    {

        public Channel channel;
        public String message;

        public Message(Channel channel, String message)
        {
            this.channel = channel;
            this.message = message;
        }
    }

    class MessageTask extends TimerTask
    {

        private final Session s;
        private long lastMessage = 0;

        public MessageTask(Session s)
        {
            super();

            this.s = s;

            Thread.setDefaultUncaughtExceptionHandler(com.gmt2001.UncaughtExceptionHandler.instance());
        }

        @Override
        public void run()
        {
            if (PhantomBot.instance().isExiting())
            {
                return;
            }

            long now = System.currentTimeMillis();
            if (now - lastMessage >= PhantomBot.instance().getMessageInterval())
            {
                Message msg = s.messages.poll();
                if (msg != null)
                {
                    if (msg.channel.getAllowSendMessages())
                    {
                        s.sayChannelReal(msg.channel, msg.message);
                    }

                    lastMessage = now;
                }
            }
        }
    }

    /**
     * @param rCon
     * @param conman
     */
    @SuppressWarnings("LeakingThisInConstructor")
    Session(RequestedConnection rCon, ConnectionManager conman)
    {
        this.rCon = rCon;
        this.conman = conman;
        setSession(this);

        Thread.setDefaultUncaughtExceptionHandler(com.gmt2001.UncaughtExceptionHandler.instance());

        sayTimer.schedule(new MessageTask(this), 300, 100);
    }

    /**
     * Gets the InternalEventParser this Session uses for event parsing
     *
     * @return InternalEventParser
     * @see me.mast3rplan.phantombot.jerklib.parsers.InternalEventParser
     * @see me.mast3rplan.phantombot.jerklib.parsers.DefaultInternalEventParser
     * @see me.mast3rplan.phantombot.jerklib.parsers.CommandParser
     */
    public InternalEventParser getInternalEventParser()
    {
        return parser;
    }

    /**
     * Sets the InternalEventParser this Session should use for event parsing
     *
     * @param parser
     * @see me.mast3rplan.phantombot.jerklib.parsers.InternalEventParser
     * @see me.mast3rplan.phantombot.jerklib.parsers.DefaultInternalEventParser
     * @see me.mast3rplan.phantombot.jerklib.parsers.CommandParser
     */
    public void setInternalParser(InternalEventParser parser)
    {
        this.parser = parser;
    }

    /**
     * Sets the internal event handler this Session should use
     *
     * @param handler
     * @see me.mast3rplan.phantombot.jerklib.listeners.IRCEventListener
     * @see DefaultInternalEventHandler
     */
    public void setInternalEventHandler(IRCEventListener handler)
    {
        internalEventHandler = handler;
    }

    /**
     * Returns the internal event handler this Session is using
     *
     * @return event handler
     * @see me.mast3rplan.phantombot.jerklib.listeners.IRCEventListener
     * @see DefaultInternalEventHandler
     */
    public IRCEventListener getInternalEventHandler()
    {
        return internalEventHandler;
    }

    /**
     * Called when UserMode events are received for this Session.
     *
     * @param modes
     */
    void updateUserModes(List<ModeAdjustment> modes)
    {
        for (ModeAdjustment ma : modes)
        {
            updateUserMode(ma);
        }
    }

    /**
     * If Action is MINUS and the same mode exists with a PLUS Action then just
     * remove the PLUS mode ModeAdjustment from the collection.
     * <p/>
     * If Action is MINUS and the same mode with PLUS does not exist then add
     * the MINUS mode to the ModeAdjustment collection
     * <p/>
     * if Action is PLUS and the same mode exists with a MINUS Action then
     * remove MINUS mode and add PLUS mode
     * <p/>
     * If Action is PLUS and the same mode with MINUS does not exist then just
     * add PLUS mode to collection
     *
     * @param mode
     */
    private void updateUserMode(ModeAdjustment mode)
    {
        int index = indexOfMode(mode.getMode(), userModes);

        if (mode.getAction() == Action.MINUS)
        {
            if (index != -1)
            {
                ModeAdjustment ma = userModes.remove(index);
                if (ma.getAction() == Action.MINUS)
                {
                    userModes.add(ma);
                }
            } else
            {
                userModes.add(mode);
            }
        } else
        {
            if (index != -1)
            {
                userModes.remove(index);
            }
            userModes.add(mode);
        }
    }

    /**
     * Finds the index of a mode in a list modes
     *
     * @param mode
     * @param modes
     * @return index of mode or -1 if mode if not found
     */
    private int indexOfMode(char mode, List<ModeAdjustment> modes)
    {
        for (int i = 0; i < modes.size(); i++)
        {
            ModeAdjustment ma = modes.get(i);
            if (ma.getMode() == mode)
            {
                return i;
            }
        }
        return -1;
    }

    /**
     * returns a List of UserModes for this Session
     *
     * @return UserModes
     */
    public List<ModeAdjustment> getUserModes()
    {
        return new ArrayList<>(userModes);
    }

    /**
     * Speak in a Channel
     *
     * @param channel
     * @param msg
     * @see me.mast3rplan.phantombot.jerklib.Channel#say(String)
     */
    public void sayChannel(Channel channel, String msg)
    {
        if (msg.startsWith(".timeout ") || msg.startsWith(".ban ")
                || msg.startsWith(".unban ") || msg.equals(".clear") || msg.equals(".mods"))
        {
            this.sayChannelReal(channel, msg);
        } else
        {
            if (msg.startsWith("/w "))
            {
                msg = msg.replace("/w ", "PRIVMSG #jtv :/w ");
                me.mast3rplan.phantombot.PhantomBot.tgcSession.sayRaw(msg);
                return;
            }
            if (msg.length() + 14 + channel.getName().length() < 512)
            {
                messages.add(new Message(channel, msg));
            } else
            {
                int maxlen = 512 - 14 - channel.getName().length();
                int pos = 0;

                while (pos < msg.length())
                {
                    if (pos + maxlen >= msg.length())
                    {
                        messages.add(new Message(channel, msg.substring(pos)));
                    } else
                    {
                        messages.add(new Message(channel, msg.substring(pos, pos + maxlen)));
                    }

                    pos += maxlen;
                }
            }
        }
    }

    public void sayChannelReal(Channel channel, String msg)
    {
        super.sayChannel(msg, channel);
    }

    /*
     * general methods
     */
    /**
     * Is this Session currently connected to an IRC server?
     *
     * @return true if connected else false
     */
    public boolean isConnected()
    {
        return state == State.CONNECTED;
    }

    /**
     * Should this Session rejoin channels it is Kicked from? Default is true.
     *
     * @return true if channels should be rejoined else false
     */
    public boolean isRejoinOnKick()
    {
        return rejoinOnKick;
    }

    /**
     * Sets that this Sessions should or should not rejoin Channels kiced from
     *
     * @param rejoin
     */
    public void setRejoinOnKick(boolean rejoin)
    {
        rejoinOnKick = rejoin;
    }

    /**
     * Called to alert the Session that login was a success
     */
    void loginSuccess()
    {
        isLoggedIn = true;
    }

    /**
     * Returns true if the Session has an active Connection and has successfully
     * logged on to the Connection.
     *
     * @return if logged in
     */
    public boolean isLoggedIn()
    {
        return isLoggedIn;
    }

    /**
     * Set Session to try alternate nicks on connection if a nick inuse event is
     * received , or not. True by default.
     *
     * @param use
     */
    public void setShouldUseAltNicks(boolean use)
    {
        useAltNicks = use;
    }

    /**
     * Returns if Session should try alternate nicks on connection if a nick in
     * use event is received. True by default.
     *
     * @return should use alt nicks
     */
    public boolean getShouldUseAltNicks()
    {
        return useAltNicks;
    }

    /**
     * Disconnect from server and destroy Session
     *
     * @param quitMessage
     */
    public void close(String quitMessage)
    {
        isClosing = true;

        if (con != null)
        {
            con.quit(quitMessage);
        }

        conman.removeSession(this);
        isLoggedIn = false;
    }

    /**
     * Nick used for Session
     *
     * @return nick
     */
    public String getNick()
    {
        return getRequestedConnection().getProfile().getActualNick();
    }

    /*
     * (non-Javadoc) @see
     * me.mast3rplan.phantombot.jerklib.RequestGenerator#changeNick(java.lang.String)
     */
    @Override
    public void changeNick(String newNick)
    {
        super.changeNick(newNick);
    }

    /**
     * Is this Session marked away?
     *
     * @return true if away else false
     */
    public boolean isAway()
    {
        return isAway;
    }

    /*
     * (non-Javadoc) @see
     * me.mast3rplan.phantombot.jerklib.RequestGenerator#setAway(java.lang.String)
     */
    @Override
    public void setAway(String message)
    {
        isAway = true;
        super.setAway(message);
    }

    /**
     * Unset away
     */
    public void unsetAway()
    {
        /*
         * if we're not away let's not bother even delegating
         */
        if (isAway)
        {
            super.unSetAway();
            isAway = false;
        }
    }

    /*
     * methods to get information about connection and server
     */
    /**
     * Get ServerInformation for Session
     *
     * @return ServerInformation for Session
     * @see ServerInformation
     */
    public ServerInformation getServerInformation()
    {
        return serverInfo;
    }

    /**
     * Get RequestedConnection for Session
     *
     * @return RequestedConnection for Session
     * @see RequestedConnection
     */
    public RequestedConnection getRequestedConnection()
    {
        return rCon;
    }

    /**
     * Returns host name this Session is connected to. If the session is
     * disconnected an empty string will be returned.
     *
     * @return hostname or an empty string if not connected
     * @see me.mast3rplan.phantombot.jerklib.Session#getRequestedConnection()
     * @see RequestedConnection#getHostName()
     */
    public String getConnectedHostName()
    {
        return con == null ? "" : con.getHostName();
    }

    /**
     * Adds an IRCEventListener to the Session. This listener will be notified
     * of all IRCEvents coming from the connected sever.
     *
     * @param listener
     */
    public void addIRCEventListener(IRCEventListener listener)
    {
        listenerList.add(listener);
    }

    /**
     * Remove IRCEventListner from Session
     *
     * @param listener
     * @return true if listener was removed else false
     */
    public boolean removeIRCEventListener(IRCEventListener listener)
    {
        return listenerList.remove(listener);
    }

    /**
     * Get a collection of all IRCEventListeners attached to Session
     *
     * @return listeners
     */
    public Collection<IRCEventListener> getIRCEventListeners()
    {
        return Collections.unmodifiableCollection(listenerList);
    }

    /**
     * Add a task to be ran when any IrcEvent is received
     *
     * @param task
     * @see me.mast3rplan.phantombot.jerklib.tasks.Task
     * @see me.mast3rplan.phantombot.jerklib.tasks.TaskImpl
     */
    public void onEvent(Task task)
    {
        // null means task should be notified of all Events
        onEvent(task, (Type) null);
    }

    /**
     * Add a task to be ran when any of the given Types of IRCEvents are
     * received
     *
     * @param task - task to run
     * @param types - types of events task should run on
     * @see me.mast3rplan.phantombot.jerklib.tasks.Task
     * @see me.mast3rplan.phantombot.jerklib.tasks.TaskImpl
     */
    public void onEvent(Task task, Type... types)
    {
        synchronized (taskMap)
        {
            for (Type type : types)
            {
                if (!taskMap.containsKey(type))
                {
                    List<Task> tasks = new ArrayList<>();
                    tasks.add(task);
                    taskMap.put(type, tasks);
                } else
                {
                    taskMap.get(type).add(task);
                }
            }
        }
    }

    /**
     * Gets All Tasks attacthed to Session Indexed by the Type the task is
     * receving events for. Task type of null are default tasks that receive all
     * events. Some Tasks can possibly be the value for many Types.
     *
     * @return tasks
     */
    Map<Type, List<Task>> getTasks()
    {
        return Collections.unmodifiableMap(new HashMap<>(taskMap));
    }

    /**
     * Removes a Task from the Session. Some Tasks can possibly be the value for
     * many Types.
     *
     * @param t
     */
    public void removeTask(Task t)
    {
        synchronized (taskMap)
        {
            for (Iterator<Type> it = taskMap.keySet().iterator(); it.hasNext();)
            {
                List<Task> tasks = taskMap.get(it.next());
                if (tasks != null)
                {
                    tasks.remove(t);
                }
            }
        }
    }

    /**
     * Get a List of Channels Session is currently in
     *
     * @return channels
     * @see me.mast3rplan.phantombot.jerklib.Channel
     */
    public List<Channel> getChannels()
    {
        return Collections.unmodifiableList(new ArrayList<>(channelMap.values()));
    }

    /**
     * Gets a Channel by name
     *
     * @param channelName
     * @return Channel or null if no such Channel is joined.
     */
    public Channel getChannel(String channelName)
    {
        return channelMap.get(channelName.toLowerCase());
    }

    /**
     * Add a Channel to the session
     *
     * @param channel
     * @see me.mast3rplan.phantombot.jerklib.Channel
     */
    void addChannel(Channel channel)
    {
        channelMap.put(channel.getName().toLowerCase(), channel);
    }

    /**
     * Remove a channel from the Session
     *
     * @param channel
     * @return true if channel was removed else false
     */
    boolean removeChannel(Channel channel)
    {
        return channelMap.remove(channel.getName().toLowerCase()) == null;
    }

    /**
     * Updates a nick in all channels currently joined
     *
     * @param oldNick
     * @param newNick
     */
    void nickChanged(String oldNick, String newNick)
    {
        synchronized (channelMap)
        {
            for (Channel chan : channelMap.values())
            {
                if (chan.getNicks().contains(oldNick))
                {
                    chan.nickChanged(oldNick, newNick);
                }
            }
        }
    }

    /**
     * Removes a nick from all channels
     *
     * @param nick
     * @return list of Channels nick was found in
     */
    public List<Channel> removeNickFromAllChannels(String nick)
    {
        List<Channel> returnList = new ArrayList<>();
        for (Channel chan : channelMap.values())
        {
            if (chan.removeNick(nick))
            {
                returnList.add(chan);
            }
        }
        return Collections.unmodifiableList(returnList);
    }

    /*
     * methods to track connection attempts
     */
    /**
     * return time of last reconnect attempt
     *
     * @return
     */
    long getLastRetry()
    {
        return lastRetry;
    }

    /**
     * sets time of last reconnect event
     */
    void retried()
    {
        if (retries > 0)
        {
            com.gmt2001.Console.out.println("Failed to connect to '" + rCon.getHostName() + "', retrying connection.");
        }
        retries++;
        // com.gmt2001.Console.err.println("Retry :" + retries);
        lastRetry = System.currentTimeMillis();
    }

    /**
     * Sets the connection for this Session
     *
     * @param con
     */
    void setConnection(Connection con)
    {
        this.con = con;
    }

    /**
     * Gets Connection used for this Session. Can return null if Session is
     * disconnected.
     *
     * @return Connection
     */
    Connection getConnection()
    {
        return con;
    }

    /**
     * Got ping response
     */
    void gotResponse()
    {
        lastResponse = System.currentTimeMillis();
        state = State.CONNECTED;
    }

    /**
     * Ping has been sent but no response yet
     */
    void pingSent()
    {
        state = State.PING_SENT;
    }

    /**
     * Session has been disconnected
     */
    void disconnected(Exception e)
    {
        if (state == State.DISCONNECTED)
        {
            return;
        }

        state = State.DISCONNECTED;

        if (con != null)
        {
            con.quit("");
            con = null;
        }

        isLoggedIn = false;
        conman.addToRelayList(new ConnectionLostEvent("", this, e));
    }

    /**
     * Session is now connected
     */
    void connected()
    {
        retries = 0;
        gotResponse();
    }

    /**
     * Session is connecting
     */
    void connecting()
    {
        state = State.CONNECTING;
    }

    /**
     * Session is half connected
     */
    void halfConnected()
    {
        state = State.HALF_CONNECTED;
    }

    /**
     * Session has been marked for removal
     */
    void markForRemoval()
    {
        state = State.MARKED_FOR_REMOVAL;
    }

    /**
     * Get the State of the Session
     *
     * @return Session state
     * @see me.mast3rplan.phantombot.jerklib.Session.State
     */
    State getState()
    {
        long current = System.currentTimeMillis();

        if (state == State.DISCONNECTED)
        {
            return state;
        }

        if (current - lastResponse > 300000 && state == State.NEED_TO_PING)
        {
            state = State.NEED_TO_RECONNECT;
        } else if (current - lastResponse > 200000 && state != State.PING_SENT)
        {
            state = State.NEED_TO_PING;
        }

        return state;
    }

    public int getRetries()
    {
        return retries;
    }

    /**
     * Test if a String starts with a known channel prefix
     *
     * @param token
     * @return true if starts with a channel prefix else false
     */
    public boolean isChannelToken(String token)
    {
        ServerInformation lserverInfo = getServerInformation();
        String[] chanPrefixes = lserverInfo.getChannelPrefixes();
        for (String prefix : chanPrefixes)
        {
            if (token.startsWith(prefix))
            {
                return true;
            }
        }
        return false;
    }

    /**
     * Send login messages to server
     */
    void login()
    {
        // test :irc.inter.net.il CAP * LS :multi-prefix
        // writeRequests.add(new WriteRequest("CAP LS", this));
        if (rCon.getPass() != null)
        {
            sayRaw("PASS " + rCon.getPass());
        }
        sayRaw("NICK " + getNick());
        sayRaw("USER " + rCon.getProfile().getName() + " 0 0 :" + rCon.getProfile().getRealName());
    }

    /*
     * (non-Javadoc) @see java.lang.Object#hashCode()
     */
    @Override
    public int hashCode()
    {
        return rCon.getHostName().hashCode();
    }

    /*
     * (non-Javadoc) @see java.lang.Object#equals(java.lang.Object)
     */
    @Override
    public boolean equals(Object o)
    {
        if (o instanceof Session && o.hashCode() == hashCode())
        {
            return ((Session) o).getRequestedConnection().getHostName().matches(getRequestedConnection().getHostName())
                    && ((Session) o).getNick().matches(getNick());
        }
        return false;
    }

    public void reconnect()
    {
        state = State.NEED_TO_RECONNECT;
    }
}
