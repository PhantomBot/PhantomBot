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
import java.nio.ByteBuffer;
import java.nio.CharBuffer;
import java.nio.channels.SocketChannel;
import java.nio.charset.Charset;
import java.nio.charset.CharsetEncoder;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import me.mast3rplan.phantombot.jerklib.Session.State;
import me.mast3rplan.phantombot.jerklib.events.IRCEvent;
import me.mast3rplan.phantombot.jerklib.events.IRCEvent.Type;
import me.mast3rplan.phantombot.jerklib.listeners.WriteRequestListener;

/**
 * A class for reading and writing to an IRC connection. This class will also
 * handle PING/PONG.
 *
 * @author mohadib
 */
class Connection
{

    /*
     * ConnectionManager for this Connection
     */
    private final ConnectionManager manager;

    /*
     * SocketChannel this connection will use for reading/writing
     */
    private final SocketChannel socChannel;

    /*
     * A Buffer for write request
     */
    final List<WriteRequest> writeRequests = Collections.synchronizedList(new ArrayList<WriteRequest>());

    /*
     * ByteBuffer for readinging into
     */
    private final ByteBuffer readBuffer = ByteBuffer.allocate(2048);

    /*
     * indicates if an event fragment is waiting
     */
    private boolean gotFragment;

    /*
     * buffer for event fragments
     */
    private final StringBuffer stringBuff = new StringBuffer();

    /*
     * actual hostname connected to
     */
    private String actualHostName;

    /*
     * Session Connection belongs to
     */
    private final Session session;

    /**
     * @param manager
     * @param socChannel - socket channel to read from
     * @param session - Session this Connection belongs to
     */
    Connection(ConnectionManager manager, SocketChannel socChannel, Session session)
    {
        this.manager = manager;
        this.socChannel = socChannel;
        this.session = session;

        Thread.setDefaultUncaughtExceptionHandler(com.gmt2001.UncaughtExceptionHandler.instance());
    }

    /**
     * Get profile use for this Connection
     *
     * @return the Profile
     */
    Profile getProfile()
    {
        return session.getRequestedConnection().getProfile();
    }

    /**
     * Sets the actual host name of this Connection.
     *
     * @param name
     */
    void setHostName(String name)
    {
        actualHostName = name;
    }

    /**
     * Gets actual hostname for Connection.
     *
     * @return hostname
     */
    String getHostName()
    {
        return actualHostName;
    }

    /**
     * Adds a listener to be notified of all data written via this Connection
     *
     * @param request
     */
    void addWriteRequest(WriteRequest request)
    {
        writeRequests.add(request);
    }

    /**
     * Called to finish the Connection Process
     *
     * @return true if fincon is successfull
     * @throws java.io.IOException
     */
    boolean finishConnect() throws IOException
    {
        return socChannel.finishConnect();
    }

    /**
     * Reads from connection and creates default IRCEvents that are added to the
     * ConnectionManager for relaying
     *
     * @return bytes read
     */
    int read()
    {

        if (!socChannel.isConnected())
        {
            return -1;
        }

        readBuffer.clear();

        int numRead = 0;

        try
        {
            numRead = socChannel.read(readBuffer);
        } catch (Exception e)
        {
            com.gmt2001.Console.err.printStackTrace(e);
            session.disconnected(e);
        }

        if (numRead == -1)
        {
            session.disconnected(new Exception("Num read -1"));
        }

        if (session.getState() == State.DISCONNECTED || numRead <= 0)
        {
            return 0;
        }

        readBuffer.flip();

        String tmpStr = new String(readBuffer.array(), 0, numRead);

        // read did not contain a \r\n
        if (!tmpStr.contains("\r\n"))
        {
            // append whole thing to buffer and set fragment flag
            stringBuff.append(tmpStr);
            gotFragment = true;

            return numRead;
        }

        // this read had a \r\n in it
        if (gotFragment)
        {
            // prepend fragment to front of current message
            tmpStr = stringBuff.toString() + tmpStr;
            stringBuff.delete(0, stringBuff.length());
            gotFragment = false;
        }

        String[] strSplit = tmpStr.split("\r\n");

        for (int i = 0; i < (strSplit.length - 1); i++)
        {
            manager.addToEventQueue(new IRCEvent(strSplit[i], session, Type.DEFAULT));
        }

        String last = strSplit[strSplit.length - 1];

        if (!tmpStr.endsWith("\r\n"))
        {
            // since string did not end with \r\n we need to
            // append the last element in strSplit to a stringbuffer
            // for next read and set flag to indicate we have a fragment waiting
            stringBuff.append(last);
            gotFragment = true;
        } else
        {
            manager.addToEventQueue(new IRCEvent(last, session, Type.DEFAULT));
        }

        return numRead;
    }
    /**
     * Writes all requests in queue to server
     *
     * @return number bytes written
     */
    long lastWrite = System.currentTimeMillis();
    int bursts = 0;
    int maxBurst = 5;
    long nextWrite = -1;
    /*
     * if lastwrite was less than a second ago: if burst == limit return; else
     * burst++; write packet; recordtime; else burst = 0; write packet; record
     * time;
     *
     *
     */

    int doWrites()
    {
        if (writeRequests.isEmpty())
        {
            return 0;
        }

        WriteRequest req;
        if (nextWrite > System.currentTimeMillis())
        {
            return 0;
        }
        if (System.currentTimeMillis() - lastWrite < 3000)
        {
            if (bursts == maxBurst)
            {
                nextWrite = System.currentTimeMillis() + 8000;
                bursts = 0;
                return 0;
            }
            bursts++;
        } else
        {
            //bursts = Math.max(bursts-- , 0);
            bursts = 0;
            lastWrite = System.currentTimeMillis();
        }

        req = writeRequests.remove(0);

        String data;
        if (req.getType() == WriteRequest.Type.CHANNEL_MSG)
        {
            data = "PRIVMSG " + req.getChannel().getName() + " :" + req.getMessage() + "\r\n";
        } else if (req.getType() == WriteRequest.Type.PRIVATE_MSG)
        {
            if (req.getMessage().length() > 255)
            {
                writeRequests.add(0, new WriteRequest(req.getMessage().substring(100), req.getSession(), req.getNick()));
                data = "PRIVMSG " + req.getNick() + " :" + req.getMessage().substring(0, 100) + "\r\n";
            } else
            {
                data = "PRIVMSG " + req.getNick() + " :" + req.getMessage() + "\r\n";
            }
        } else
        {
            data = req.getMessage();
            if (!data.endsWith("\r\n"))
            {
                data += "\r\n";
            }
        }

        int amount = 0;
        try
        {
            Charset ch = Charset.forName("utf-8");
            CharsetEncoder cr = ch.newEncoder();
            ByteBuffer bf = cr.encode(CharBuffer.wrap(data));
            ByteBuffer buff = ByteBuffer.allocate(bf.capacity());

            buff.put(bf);
            buff.flip();

            amount = socChannel.write(buff);
        } catch (IOException e)
        {
            com.gmt2001.Console.err.printStackTrace(e);
            session.disconnected(e);
        }

        if (session.getState() == State.DISCONNECTED)
        {
            return amount;
        }

        fireWriteEvent(req);

        // com.gmt2001.Console.out.println("Wrote " + amount + " " + req.getType() + " " + req.getMessage() + " " + bursts);
        return amount;
    }

    /*
     * int doWrites() { int amount = 0;
     *
     * List<WriteRequest> tmpReqs = new ArrayList<WriteRequest>(); synchronized
     * (writeRequests) { tmpReqs.addAll(writeRequests); writeRequests.clear(); }
     *
     * for (WriteRequest request : tmpReqs) { String data;
     *
     * if (request.getType() == WriteRequest.Type.CHANNEL_MSG) { data = "PRIVMSG
     * " + request.getChannel().getName() + " :" + request.getMessage() +
     * "\r\n"; } else if (request.getType() == WriteRequest.Type.PRIVATE_MSG) {
     * data = "PRIVMSG " + request.getNick() + " :" + request.getMessage() +
     * "\r\n"; } else { data = request.getMessage(); if (!data.endsWith("\r\n"))
     * { data += "\r\n"; } }
     *
     * byte[] dataArray = data.getBytes(); ByteBuffer buff =
     * ByteBuffer.allocate(dataArray.length); buff.put(dataArray); buff.flip();
     *
     * try { amount += socChannel.write(buff); } catch (IOException e) {
     * com.gmt2001.Console.err.printStackTrace(e); session.disconnected(); }
     *
     * if (session.getState() == State.DISCONNECTED) { return amount; }
     *
     * fireWriteEvent(request); }
     *
     * return amount; }
     */
    /**
     * Send a ping
     */
    void ping()
    {
        writeRequests.add(new WriteRequest("PING " + actualHostName + "\r\n", session));
        session.pingSent();
    }

    /**
     * Send a pong
     *
     * @param event , the Ping event
     */
    void pong(IRCEvent event)
    {
        session.gotResponse();
        String data = event.getRawEventData().substring(event.getRawEventData().lastIndexOf(":") + 1);
        writeRequests.add(new WriteRequest("PONG " + data + "\r\n", session));
    }

    /**
     * Alert connection a pong was received
     */
    void gotPong()
    {
        session.gotResponse();
    }

    /**
     * Close connection
     *
     * @param quitMessage
     */
    void quit(String quitMessage)
    {
        try
        {
            if (quitMessage == null)
            {
                quitMessage = "";
            }
            WriteRequest request = new WriteRequest("QUIT :" + quitMessage + "\r\n", session);
            writeRequests.add(request);
            // clear out write queue
            doWrites();
            socChannel.close();
        } catch (IOException e)
        {
            com.gmt2001.Console.err.printStackTrace(e);
        }
    }

    /**
     * Fires a write request to all write listeners
     *
     * @param request
     */
    void fireWriteEvent(WriteRequest request)
    {
        for (WriteRequestListener listener : manager.getWriteListeners())
        {
            listener.receiveEvent(request);
        }
    }
}
