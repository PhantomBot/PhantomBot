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

import java.io.IOException;
import java.net.InetSocketAddress;
import java.nio.channels.*;
import java.util.*;
import me.mast3rplan.phantombot.jerklib.Session.State;
import me.mast3rplan.phantombot.jerklib.events.ErrorEvent;
import me.mast3rplan.phantombot.jerklib.events.GenericErrorEvent;
import me.mast3rplan.phantombot.jerklib.events.IRCEvent;
import me.mast3rplan.phantombot.jerklib.events.IRCEvent.Type;
import me.mast3rplan.phantombot.jerklib.events.UnresolvedHostnameErrorEvent;
import me.mast3rplan.phantombot.jerklib.listeners.IRCEventListener;
import me.mast3rplan.phantombot.jerklib.listeners.WriteRequestListener;
import me.mast3rplan.phantombot.jerklib.parsers.DefaultInternalEventParser;
import me.mast3rplan.phantombot.jerklib.parsers.InternalEventParser;
import me.mast3rplan.phantombot.jerklib.tasks.Task;

/**
 * This class is used to control/store Sessions/Connections. Request new
 * connections with this class.
 *
 * @author mohadib
 */
public final class ConnectionManager {
    /*
     * maps to index sessions by name and socketchannel
     */

    final Map<String, Session> sessionMap = Collections.synchronizedMap(new HashMap<String, Session>());
    final Map<SocketChannel, Session> socChanMap = Collections.synchronizedMap(new HashMap<SocketChannel, Session>());

    /*
     * event listener lists
     */
    private final List<WriteRequestListener> writeListeners = Collections.synchronizedList(new ArrayList<WriteRequestListener>(1));

    /*
     * event queues
     */
    private final List<IRCEvent> eventQueue = new ArrayList<>();
    private final List<IRCEvent> relayQueue = new ArrayList<>();
    private final List<WriteRequest> requestForWriteListenerEventQueue = new ArrayList<>();

    /*
     * internal event parser
     */
    // private InternalEventParser parser = new InternalEventParserImpl(this);
    private IRCEventListener internalEventHandler = new DefaultInternalEventHandler(this);
    private InternalEventParser internalEventParser = new DefaultInternalEventParser();

    /*
     * main loop timer
     */
    private Timer loopTimer;

    /*
     * event dispatch timer
     */
    private Timer dispatchTimer;

    /*
     * default user profile to use for new connections
     */
    private Profile defaultProfile;

    /*
     * NIO Selector
     */
    private Selector selector;

    /**
     * Takes a profile to use as default profile for new Connections
     *
     * @param defaultProfile default user profile
     * @see me.mast3rplan.phantombot.jerklib.Profile
     */
    public ConnectionManager(Profile defaultProfile) {
        this.defaultProfile = defaultProfile;

        Thread.setDefaultUncaughtExceptionHandler(com.gmt2001.UncaughtExceptionHandler.instance());

        try {
            selector = Selector.open();
        } catch (IOException e) {
            com.gmt2001.Console.err.printStackTrace(e);
        }

        startMainLoop();
    }

    /**
     * This is for testing purposes only. Do not use unless testing.
     */
    ConnectionManager() {
    }
    private boolean autoReCon = true;
    private int reconTriesShort = 10 * 2;
    private long reconnectIntervalShort = 30 * 1000;
    private int reconTriesMed = 30 / 2;
    private long reconnectIntervalMed = 2 * 60 * 1000;
    private int reconTriesLong = ((3 * 60) + 20) / 5;
    private long reconnectIntervalLong = 5 * 60 * 1000;

    public void setAutoReconnect(boolean bool) {
        this.autoReCon = bool;
    }

    /**
     * get a list of Sessions
     *
     * @return Session list
     */
    public List<Session> getSessions() {
        return Collections.unmodifiableList(new ArrayList<>(sessionMap.values()));
    }

    /**
     * gets a session by name
     *
     * @param name session name - the hostname of the server this session is for
     * @return Session or null if no Session with name exists
     */
    public Session getSession(String name) {
        return sessionMap.get(name);
    }

    public void reconnectSession(String hostname) {
        Session s = getSession(hostname);
        s.reconnect();
    }

    /**
     * Adds a listener to be notified of all writes
     *
     * @param listener to be notified
     */
    public void addWriteRequestListener(WriteRequestListener listener) {
        writeListeners.add(listener);
    }

    /**
     * gets an unmodifiable list of WriteListeners
     *
     * @return listeners
     */
    public List<WriteRequestListener> getWriteListeners() {
        return Collections.unmodifiableList(writeListeners);
    }

    /**
     * request a new connection to a host with the default port of 6667
     *
     * @param hostName DNS name or IP of host to connect to
     * @return the {@link me.mast3rplan.phantombot.jerklib.Session} for this
     * connection
     */
    public Session requestConnection(String hostName) {
        return requestConnection(hostName, 6667);
    }

    /**
     * request a new connection to a host
     *
     * @param hostName DNS name or IP of host to connect to
     * @param port port to use for connection
     * @return the {@link me.mast3rplan.phantombot.jerklib.Session} for this
     * connection
     */
    public Session requestConnection(String hostName, int port) {
        return requestConnection(hostName, port, defaultProfile.clone());
    }

    public Session requestConnection(String hostName, int port, String pass) {
        return requestConnection(hostName, port, pass, defaultProfile.clone());
    }

    /**
     * request a new connection to a host
     *
     * @param hostName DNS name or IP of host to connect to
     * @param port port to use for connection
     * @param profile profile to use for this connection
     * @return the {@link me.mast3rplan.phantombot.jerklib.Session} for this
     * connection
     */
    @SuppressWarnings("ResultOfObjectAllocationIgnored")
    public Session requestConnection(String hostName, int port, Profile profile) {
        RequestedConnection rCon = new RequestedConnection(hostName, port, profile);

        Session session = new Session(rCon, this);
        session.setInternalParser(internalEventParser);
        sessionMap.put(hostName, session);

        return session;
    }

    @SuppressWarnings("ResultOfObjectAllocationIgnored")
    public Session requestConnection(String hostName, int port, String pass, Profile profile) {
        RequestedConnection rCon = new RequestedConnection(hostName, port, pass, profile);

        Session session = new Session(rCon, this);
        session.setInternalParser(internalEventParser);
        sessionMap.put(hostName, session);

        return session;
    }

    /**
     * Closes all connections and shuts down manager
     *
     * @param quitMsg quit message
     */
    public synchronized void quit(String quitMsg) {

        runLoopTaskRunnable = false;
        runRelayEventsTaskRunnable = false;

        for (Session session : new ArrayList<>(sessionMap.values())) {
            session.close(quitMsg);
        }

        sessionMap.clear();

        socChanMap.clear();

        try {
            selector.close();
        } catch (IOException e) {
            com.gmt2001.Console.err.printStackTrace(e);
        }

    }

    /**
     * Closes all Sessions and exits library
     */
    public synchronized void quit() {
        quit("");
    }

    /**
     * gets the default profile used for new connections
     *
     * @return default profile
     */
    public Profile getDefaultProfile() {
        return defaultProfile;
    }

    /**
     * sets the default profile to use for new connections
     *
     * @param profile default profile to use for connections
     */
    public void setDefaultProfile(Profile profile) {
        this.defaultProfile = profile;
    }

    /**
     * Sets the InternalEventHandler to use for this Session. This
     * IRCEventListener is responsible for getting internal house keeping done -
     * like nick caches, channel caches. This Listener is also responsible for
     * redispatching events to other listeners if you choose to.
     *
     * @param handler
     * @see me.mast3rplan.phantombot.jerklib.listeners.IRCEventListener
     * @see DefaultInternalEventHandler
     */
    public void setDefaultInternalEventHandler(IRCEventListener handler) {
        internalEventHandler = handler;
    }

    /**
     * Gets the InternalEventHandler to use for this Session.
     *
     * @return default Event Handler
     */
    public IRCEventListener getDefaultEventHandler() {
        return internalEventHandler;
    }

    /**
     * Set the InternalEventParser used for this Session.
     *
     * @param parser
     */
    public void setDefaultInternalEventParser(InternalEventParser parser) {
        internalEventParser = parser;
    }

    /**
     * Get the InternalEventParser used for this Session.
     *
     * @return InternalEventParser for Session
     */
    public InternalEventParser getDefaultInternalEventParser() {
        return internalEventParser;
    }

    /**
     * Remove a session
     *
     * @param session
     */
    void removeSession(Session session) {
        sessionMap.remove(session.getRequestedConnection().getHostName());
        for (Iterator<Session> it = socChanMap.values().iterator(); it.hasNext();) {
            if (it.next().equals(session)) {
                it.remove();
                return;
            }
        }
    }

    /**
     * Add an event to the EventQueue to be parsed and dispatched to Listeners
     *
     * @param event
     */
    void addToEventQueue(IRCEvent event) {
        eventQueue.add(event);
    }

    /**
     * Add an event to be dispatched to Listeners(will not be parsed)
     *
     * @param event
     */
    void addToRelayList(IRCEvent event) {
        if (event == null) {
            com.gmt2001.Console.err.printStackTrace(new Exception());
            quit("Null Pointers ?? In my Code??! :(");
            return;
        }

        synchronized (relayQueue) {
            relayQueue.add(event);
        }
    }

    /**
     * Thread for handling the loop tasks.
     */
    private boolean runLoopTaskRunnable = true;
    Runnable loopTaskRunnable = new Runnable() {
        public void run() {
            while (runLoopTaskRunnable) {
                makeConnections();
                doNetworkIO();
                parseEvents();
                checkServerConnections();

                try {
                    Thread.sleep(2);
                } catch (InterruptedException ex) {
                    com.gmt2001.Console.debug.println(ex.getMessage());
                }
            }
        }
    };

    /**
     * Thread for handling relayEvents.
     */
    private boolean runRelayEventsTaskRunnable = true;
    Runnable relayEventsTaskRunnable = new Runnable() {
        public void run() {
            while (runRelayEventsTaskRunnable) {
                relayEvents();
                notifyWriteListeners();

                try { 
                    Thread.sleep(2);
                } catch (InterruptedException ex) {
                    com.gmt2001.Console.debug.println(ex.getMessage());
                }
            }
        }
    };

    /**
     * Starts the IO threads.
     */
    void startMainLoop() {
        Thread loopTaskThread = new Thread(loopTaskRunnable);
        loopTaskThread.start();

        Thread relayEventsTaskThread = new Thread(relayEventsTaskRunnable);
        relayEventsTaskThread.start();
    }

    /**
     * Makes read and write request via Connections when they can be done
     * without blocking.
     */
    @SuppressWarnings("element-type-mismatch")
    void doNetworkIO() {
        try {
            if (selector.selectNow() > 0) {
                Iterator<SelectionKey> it = selector.selectedKeys().iterator();
                while (it.hasNext()) {
                    SelectionKey key = it.next();
                    Session session = socChanMap.get(key.channel());
                    it.remove();

                    try {
                        if (!key.isValid()) {
                            continue;
                        }

                        if (key.isReadable()) {
                            socChanMap.get(key.channel()).getConnection().read();
                        }
                        if (key.isWritable()) {
                            socChanMap.get(key.channel()).getConnection().doWrites();
                        }
                        if (key.isConnectable()) {
                            finishConnection(key);
                        }
                    } catch (CancelledKeyException ke) {
                        session.disconnected(ke);
                        com.gmt2001.Console.err.logStackTrace(ke);
                    }
                }
            }
        } catch (IOException e) {
            com.gmt2001.Console.err.printStackTrace(e);
        }
    }

    /**
     * Attempts to finish a connection
     *
     * @param key
     */
    void finishConnection(SelectionKey key) {
        SocketChannel chan = (SocketChannel) key.channel();
        Session session = socChanMap.get(chan);

        if (chan.isConnectionPending()) {
            try {
                if (session.getConnection() == null) {
                    session.markForRemoval();
                } else if (session.getConnection().finishConnect()) {
                    session.halfConnected();
                    session.login();
                } else {
                    session.connecting();
                }
            } catch (IOException e) {
                ErrorEvent error = new GenericErrorEvent(e.getMessage(), session, e);
                addToRelayList(error);
                session.markForRemoval();
                key.cancel();
                com.gmt2001.Console.err.printStackTrace(e);
            }
        }
    }

    /**
     * Check livelyness of server connections
     */
    void checkServerConnections() {
        synchronized (sessionMap) {
            for (Iterator<Session> it = sessionMap.values().iterator(); it.hasNext();) {
                Session session = it.next();
                State state = session.getState();

                if (state == State.MARKED_FOR_REMOVAL) {
                    it.remove();
                } else if (state == State.NEED_TO_PING) {
                    session.getConnection().ping();
                }
            }
        }
    }

    /**
     * Parse Events
     */
    void parseEvents() {
        synchronized (eventQueue) {
            if (eventQueue.isEmpty()) {
                return;
            }
            for (IRCEvent event : eventQueue) {
                IRCEvent newEvent = event.getSession().getInternalEventParser().receiveEvent(event);
                internalEventHandler.receiveEvent(newEvent);
            }
            eventQueue.clear();
        }
    }

    /**
     * Remove Cancelled Tasks for a Session
     *
     * @param session
     * @return remanding valid tasks
     */
    Map<Type, List<Task>> removeCanceled(Session session) {
        Map<Type, List<Task>> tasks = session.getTasks();
        synchronized (tasks) {
            for (List<Task> thisTasks : tasks.values()) {
                for (Iterator<Task> x = thisTasks.iterator(); x.hasNext();) {
                    Task rmTask = x.next();
                    if (rmTask.isCanceled()) {
                        x.remove();
                    }
                }
            }
        }
        return tasks;
    }

    /**
     * Thread for receiveEvent
     */
    public class ReceiveEventRunnable implements Runnable {
        private IRCEventListener listener;
        private IRCEvent event;

        public ReceiveEventRunnable(IRCEventListener listener, IRCEvent event) {
            this.listener = listener;
            this.event = event;
        }
        public void run() {
            listener.receiveEvent(event);
        }
    }

    /**
     * Relay events to Listeners/Tasks
     */
    void relayEvents() {
        List<IRCEvent> events = new ArrayList<>();
        List<IRCEventListener> templisteners = new ArrayList<>();
        Map<Type, List<Task>> tempTasks = new HashMap<>();

        synchronized (relayQueue) {
            events.addAll(relayQueue);
            relayQueue.clear();
        }

        for (IRCEvent event : events) {
            Session s = event.getSession();

            // if session is null , this means the session has been removed or
            // quit() in Session has been called , but not before a few
            // events could queue up for that session. So we should continue
            // to the next event
            if (s == null) {
                continue;
            }

            Collection<IRCEventListener> listeners = s.getIRCEventListeners();
            synchronized (listeners) {
                templisteners.addAll(listeners);
            }

            tempTasks.putAll(removeCanceled(s));

            List<Task> typeTasks = tempTasks.get(event.getType());
            if (typeTasks != null) {
                templisteners.addAll(typeTasks);
            }

            List<Task> nullTasks = tempTasks.get(null);
            if (nullTasks != null) {
                templisteners.addAll(nullTasks);
            }

            for (IRCEventListener listener : templisteners) {
                try {
                    //listener.receiveEvent(event);
                    ReceiveEventRunnable receiveEventRunnable = new ReceiveEventRunnable(listener, event);
                    new Thread(receiveEventRunnable).start();
                } catch (Exception e) {
                    com.gmt2001.Console.err.printStackTrace(e);
                }
            }

            templisteners.clear();
            tempTasks.clear();
        }
    }

    /**
     * Relay write requests to listeners
     */
    void notifyWriteListeners() {
        List<WriteRequestListener> list = new ArrayList<>();
        List<WriteRequest> wRequests = new ArrayList<>();

        synchronized (requestForWriteListenerEventQueue) {
            if (requestForWriteListenerEventQueue.isEmpty()) {
                return;
            }
            wRequests.addAll(requestForWriteListenerEventQueue);
            requestForWriteListenerEventQueue.clear();
        }

        synchronized (writeListeners) {
            list.addAll(writeListeners);
        }

        for (WriteRequestListener listener : list) {
            for (WriteRequest request : wRequests) {
                listener.receiveEvent(request);
            }
        }
    }

    /**
     * Make COnnections
     */
    void makeConnections() {
        synchronized (sessionMap) {
            for (Session session : sessionMap.values()) {
                State state = session.getState();

                if (state == State.NEED_TO_RECONNECT) {
                    session.disconnected(new Exception("Connection Timeout Possibly"));
                }

                if (state == State.DISCONNECTED && !session.isClosing) {
                    long last = session.getLastRetry();
                    long current = System.currentTimeMillis();

                    long reconnectIntervalCur = reconnectIntervalShort;
                    int reconTriesCur = reconTriesShort;

                    if (session.getRetries() >= reconTriesShort) {
                        if (session.getRetries() < (reconTriesShort + reconTriesMed)) {
                            reconnectIntervalCur = reconnectIntervalMed;
                            reconTriesCur = reconTriesMed;
                        } else {
                            reconnectIntervalCur = reconnectIntervalLong;
                            reconTriesCur = reconTriesLong;
                        }
                    }

                    if (last > 0 && current - last < reconnectIntervalCur) {
                        continue;
                    }

                    try {
                        if (!autoReCon || session.getRetries() >= reconTriesCur) {
                            session.markForRemoval();
                            com.gmt2001.Console.err.println("Retries up, marked for removal");
                        } else {
                            session.retried();
                            connect(session);
                        }
                    } catch (UnresolvedAddressException e) {
                        String msg = e.getMessage() == null ? e.toString() : e.getMessage();
                        ErrorEvent error = new UnresolvedHostnameErrorEvent(session, msg, session.getRequestedConnection().getHostName(), e);
                        addToRelayList(error);
                        session.disconnected(e);
                        com.gmt2001.Console.err.logStackTrace(e);
                    } catch (IOException e) {
                        String msg = e.getMessage() == null ? e.toString() : e.getMessage();
                        ErrorEvent error = new GenericErrorEvent(msg, session, e);
                        addToRelayList(error);
                        session.disconnected(e);
                        com.gmt2001.Console.err.logStackTrace(e);
                    }
                }
            }
        }
    }

    /**
     * Connect a Session to a server
     *
     * @param session
     * @throws java.io.IOException
     */
    void connect(Session session) throws IOException {
        SocketChannel sChannel = SocketChannel.open();

        sChannel.configureBlocking(false);

        com.gmt2001.Console.out.println("Connecting to " + session.getRequestedConnection().getHostName() + ":" + session.getRequestedConnection().getPort());
        sChannel.connect(new InetSocketAddress(session.getRequestedConnection().getHostName(), session.getRequestedConnection().getPort()));

        sChannel.register(selector, sChannel.validOps());

        Connection con = new Connection(this, sChannel, session);
        session.setConnection(con);

        socChanMap.put(sChannel, session);
    }
}
