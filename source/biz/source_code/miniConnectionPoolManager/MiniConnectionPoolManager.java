// Copyright 2007-2011 Christian d'Heureuse, Inventec Informatik AG, Zurich, Switzerland
// www.source-code.biz, www.inventec.ch/chdh
//
// This module is multi-licensed and may be used under the terms
// of any of the following licenses:
//
//  EPL, Eclipse Public License, http://www.eclipse.org/legal
//  LGPL, GNU Lesser General Public License, http://www.gnu.org/licenses/lgpl.html
//  MPL, Mozilla Public License 1.1, http://www.mozilla.org/MPL
//
// Please contact the author if you need another license.
// This module is provided "as is", without warranties of any kind.
package biz.source_code.miniConnectionPoolManager;

import java.io.PrintWriter;
import java.sql.Connection;
import java.sql.SQLException;
import java.util.LinkedList;
import java.util.concurrent.Semaphore;
import java.util.concurrent.TimeUnit;
import javax.sql.ConnectionEvent;
import javax.sql.ConnectionEventListener;
import javax.sql.ConnectionPoolDataSource;
import javax.sql.PooledConnection;

/**
 * A lightweight standalone JDBC connection pool manager.
 *
 * <p>
 * The public methods of this class are thread-safe.
 *
 * <p>
 * Home page: <a href="http://www.source-code.biz/miniconnectionpoolmanager">www.source-code.biz/miniconnectionpoolmanager</a><br>
 * Author: Christian d'Heureuse, Inventec Informatik AG, Zurich, Switzerland<br>
 * Multi-licensed: EPL / LGPL / MPL.
 */
public class MiniConnectionPoolManager {

    private ConnectionPoolDataSource dataSource;
    private int maxConnections;
    private long timeoutMs;
    private PrintWriter logWriter;
    private Semaphore semaphore;
    private PoolConnectionEventListener poolConnectionEventListener;

// The following variables must only be accessed within synchronized blocks.
// @GuardedBy("this") could by used in the future.
    private LinkedList<PooledConnection> recycledConnections;          // list of inactive PooledConnections
    private int activeConnections;            // number of active (open) connections of this pool
    private boolean isDisposed;                   // true if this connection pool has been disposed
    private boolean doPurgeConnection;            // flag to purge the connection currently beeing closed instead of recycling it
    private PooledConnection connectionInTransition;       // a PooledConnection which is currently within a PooledConnection.getConnection() call, or null

    /**
     * Thrown in {@link #getConnection()} or {@link #getValidConnection()} when no free connection becomes available within <code>timeout</code>
     * seconds.
     */
    public static class TimeoutException extends RuntimeException {

        private static final long serialVersionUID = 1;

        public TimeoutException() {
            super("Timeout while waiting for a free database connection.");
        }

        public TimeoutException(String msg, Exception cause) {
            super(msg, cause);
        }
    }

    /**
     * Constructs a MiniConnectionPoolManager object with a timeout of 60 seconds.
     *
     * @param dataSource the data source for the connections.
     * @param maxConnections the maximum number of connections.
     */
    public MiniConnectionPoolManager(ConnectionPoolDataSource dataSource, int maxConnections) {
        this(dataSource, maxConnections, 60);
    }

    /**
     * Constructs a MiniConnectionPoolManager object.
     *
     * @param dataSource the data source for the connections.
     * @param maxConnections the maximum number of connections.
     * @param timeout the maximum time in seconds to wait for a free connection.
     */
    public MiniConnectionPoolManager(ConnectionPoolDataSource dataSource, int maxConnections, int timeout) {
        this.dataSource = dataSource;
        this.maxConnections = maxConnections;
        this.timeoutMs = timeout * 1000L;
        try {
            logWriter = dataSource.getLogWriter();
        } catch (SQLException e) {
        }
        if (maxConnections < 1) {
            throw new IllegalArgumentException("Invalid maxConnections value.");
        }
        semaphore = new Semaphore(maxConnections, true);
        recycledConnections = new LinkedList<>();
        poolConnectionEventListener = new PoolConnectionEventListener();
    }

    /**
     * Closes all unused pooled connections.
     *
     * @throws java.sql.SQLException
     */
    public synchronized void dispose() throws SQLException {
        if (isDisposed) {
            return;
        }
        isDisposed = true;
        SQLException e = null;
        while (!recycledConnections.isEmpty()) {
            PooledConnection pconn = recycledConnections.remove();
            try {
                pconn.close();
            } catch (SQLException e2) {
                if (e == null) {
                    e = e2;
                }
            }
        }
        if (e != null) {
            throw e;
        }
    }

    /**
     * Retrieves a connection from the connection pool.
     *
     * <p>
     * If <code>maxConnections</code> connections are already in use, the method waits until a connection becomes available or <code>timeout</code>
     * seconds elapsed. When the application is finished using the connection, it must close it in order to return it to the pool.
     *
     * @return a new <code>Connection</code> object.
     * @throws java.sql.SQLException
     * @throws TimeoutException when no connection becomes available within <code>timeout</code> seconds.
     */
    public Connection getConnection() throws SQLException {
        return getConnection2(timeoutMs);
    }

    private Connection getConnection2(long timeoutMs) throws SQLException {
        // This routine is unsynchronized, because semaphore.tryAcquire() may block.
        synchronized (this) {
            if (isDisposed) {
                throw new IllegalStateException("Connection pool has been disposed.");
            }
        }
        try {
            if (!semaphore.tryAcquire(timeoutMs, TimeUnit.MILLISECONDS)) {
                throw new TimeoutException();
            }
        } catch (InterruptedException e) {
            throw new RuntimeException("Interrupted while waiting for a database connection.", e);
        }
        boolean ok = false;
        try {
            Connection conn = getConnection3();
            ok = true;
            return conn;
        } finally {
            if (!ok) {
                semaphore.release();
            }
        }
    }

    private synchronized Connection getConnection3() throws SQLException {
        if (isDisposed) {                                       // test again within synchronized lock
            throw new IllegalStateException("Connection pool has been disposed.");
        }
        PooledConnection pconn;
        if (!recycledConnections.isEmpty()) {
            pconn = recycledConnections.remove();
        } else {
            pconn = dataSource.getPooledConnection();
            pconn.addConnectionEventListener(poolConnectionEventListener);
        }
        Connection conn;
        try {
            // The JDBC driver may call ConnectionEventListener.connectionErrorOccurred()
            // from within PooledConnection.getConnection(). To detect this within
            // disposeConnection(), we temporarily set connectionInTransition.
            connectionInTransition = pconn;
            conn = pconn.getConnection();
        } finally {
            connectionInTransition = null;
        }
        activeConnections++;
        assertInnerState();
        return conn;
    }

    /**
     * Retrieves a connection from the connection pool and ensures that it is valid by calling {@link Connection#isValid(int)}.
     *
     * <p>
     * If a connection is not valid, the method tries to get another connection until one is valid (or a timeout occurs).
     *
     * <p>
     * Pooled connections may become invalid when e.g. the database server is restarted.
     *
     * <p>
     * This method is slower than {@link #getConnection()} because the JDBC driver has to send an extra command to the database server to test the
     * connection.
     *
     * <p>
     * This method requires Java 1.6 or newer.
     *
     * @return
     * @throws TimeoutException when no valid connection becomes available within <code>timeout</code> seconds.
     */
    @SuppressWarnings({"UseSpecificCatch", "SleepWhileInLoop"})
    public Connection getValidConnection() {
        long timeoutTime = System.nanoTime() + timeoutMs * (long) 1E6;
        int triesWithoutDelay = getInactiveConnections() + 1;
        while (true) {
            Exception cause = null;
            try {
                Connection conn = getValidConnection2(timeoutTime);
                if (conn != null) {
                    return conn;
                }
            } catch (Exception e) {
                cause = e;
            }
            if (System.nanoTime() >= timeoutTime) {
                throw new TimeoutException("Timeout while waiting for a valid database connection.", cause);
            }
            triesWithoutDelay--;
            if (triesWithoutDelay <= 0) {
                triesWithoutDelay = 0;
                try {
                    Thread.sleep(250);
                } catch (InterruptedException e) {
                    throw new RuntimeException("Interrupted while waiting for a valid database connection.", cause);
                }
            }
        }
    }

    private Connection getValidConnection2(long timeoutTime) throws SQLException {
        long rtimeMs = Math.max(1, (timeoutTime - System.nanoTime()) / (int) 1E6);
        Connection conn = getConnection2(rtimeMs);
        int rtimeSecs = (int) Math.min(3600, Math.max(1, ((timeoutTime - System.nanoTime() + (long) 1E9 - 1) / (long) 1E9)));
        try {
            if (conn.isValid(rtimeSecs)) {
                return conn;
            }
        } catch (SQLException e) {
        }
        // This Exception should never occur. If it nevertheless occurs, it's because of an error in the
        // JDBC driver which we ignore and assume that the connection is not valid.
        // When isValid() returns false, the JDBC driver should have already called connectionErrorOccurred()
        // and the PooledConnection has been removed from the pool, i.e. the PooledConnection will
        // not be added to recycledConnections when Connection.close() is called.
        // But to be sure that this works even with a faulty JDBC driver, we call purgeConnection().
        purgeConnection(conn);
        return null;
    }

// Purges the PooledConnection associated with the passed Connection from the connection pool.
    @SuppressWarnings("ConvertToTryWithResources")
    private synchronized void purgeConnection(Connection conn) {
        try {
            doPurgeConnection = true;
            // (A potential problem of this program logic is that setting the doPurgeConnection flag
            // has an effect only if the JDBC driver calls connectionClosed() synchronously within
            // Connection.close().)
            conn.close();
        } catch (SQLException e) {
        } // ignore exception from close()
        finally {
            doPurgeConnection = false;
        }
    }

    private synchronized void recycleConnection(PooledConnection pconn) {
        if (isDisposed || doPurgeConnection) {
            disposeConnection(pconn);
            return;
        }
        if (pconn == connectionInTransition) {
            // This happens when a faulty JDBC driver calls ConnectionEventListener.connectionClosed()
            // a second time within PooledConnection.getConnection().
            return;
        }
        if (activeConnections <= 0) {
            throw new AssertionError();
        }
        activeConnections--;
        semaphore.release();
        recycledConnections.add(pconn);
        assertInnerState();
    }

    private synchronized void disposeConnection(PooledConnection pconn) {
        pconn.removeConnectionEventListener(poolConnectionEventListener);
        if (!recycledConnections.remove(pconn) && pconn != connectionInTransition) {
            // If the PooledConnection is not in the recycledConnections list
            // and is not currently within a PooledConnection.getConnection() call,
            // we assume that the connection was active.
            if (activeConnections <= 0) {
                throw new AssertionError();
            }
            activeConnections--;
            semaphore.release();
        }
        closeConnectionAndIgnoreException(pconn);
        assertInnerState();
    }

    private void closeConnectionAndIgnoreException(PooledConnection pconn) {
        try {
            pconn.close();
        } catch (SQLException e) {
            log("Error while closing database connection: " + e.toString());
        }
    }

    private void log(String msg) {
        String s = "MiniConnectionPoolManager: " + msg;
        try {
            if (logWriter == null) {
                System.err.println(s);
            } else {
                logWriter.println(s);
            }
        } catch (Exception e) {
        }
    }

    private synchronized void assertInnerState() {
        if (activeConnections < 0) {
            throw new AssertionError();
        }
        if (activeConnections + recycledConnections.size() > maxConnections) {
            throw new AssertionError();
        }
        if (activeConnections + semaphore.availablePermits() > maxConnections) {
            throw new AssertionError();
        }
    }

    private class PoolConnectionEventListener implements ConnectionEventListener {

        @Override
        public void connectionClosed(ConnectionEvent event) {
            PooledConnection pconn = (PooledConnection) event.getSource();
            recycleConnection(pconn);
        }

        @Override
        public void connectionErrorOccurred(ConnectionEvent event) {
            PooledConnection pconn = (PooledConnection) event.getSource();
            disposeConnection(pconn);
        }
    }

    /**
     * Returns the number of active (open) connections of this pool.
     *
     * <p>
     * This is the number of <code>Connection</code> objects that have been issued by {@link #getConnection()}, for which
     * <code>Connection.close()</code> has not yet been called.
     *
     * @return the number of active connections.
     *
     */
    public synchronized int getActiveConnections() {
        return activeConnections;
    }

    /**
     * Returns the number of inactive (unused) connections in this pool.
     *
     * <p>
     * This is the number of internally kept recycled connections, for which <code>Connection.close()</code> has been called and which have not yet
     * been reused.
     *
     * @return the number of inactive connections.
     *
     */
    public synchronized int getInactiveConnections() {
        return recycledConnections.size();
    }

} // end class MiniConnectionPoolManager
