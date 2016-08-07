/*
 * Copyright (C) 2016 phantombot.tv
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
package de.simeonf;

import java.io.IOException;
import java.lang.reflect.Method;
import java.net.InetSocketAddress;
import java.util.Collection;
import org.java_websocket.WebSocket;
import org.java_websocket.handshake.ClientHandshake;
import org.java_websocket.server.WebSocketServer;

import com.google.common.eventbus.Subscribe;

import me.mast3rplan.phantombot.event.Event;
import me.mast3rplan.phantombot.event.Listener;


public class EventWebSocketServer extends WebSocketServer implements Listener {

    private static EventWebSocketServer instance;

    public static EventWebSocketServer instance() {
        return instance;
    }

    public EventWebSocketServer(int port) {
        super(new InetSocketAddress(port));

        Thread.setDefaultUncaughtExceptionHandler(com.gmt2001.UncaughtExceptionHandler.instance());
    }

    @Override
    public void onOpen(WebSocket webSocket, ClientHandshake clientHandshake) {
    }

    @Override
    public void onClose(WebSocket webSocket, int i, String s, boolean b) {
    }

    @Override
    public void onMessage(WebSocket webSocket, String s) {
    }

    @Override
    public void onError(WebSocket webSocket, Exception e) {
        com.gmt2001.Console.err.printStackTrace(e);
    }

    public void dispose() {
        try {
            this.stop(2000);
        } catch (InterruptedException ex) {
            com.gmt2001.Console.err.printStackTrace(ex);
        }
    }

    @Subscribe
    public void sendToAll(Event event) {
        Collection<WebSocket> con = connections();
        synchronized (con) {
            for (WebSocket c : con) {
                try {
                    Method output = event.getClass().getMethod("toEventSocket", (Class<?>[]) null);
                    c.send(event.getClass().getSimpleName() + ":" +output.invoke(event, (Object[]) null));
                } catch (Exception ex) {
                    return;
                }
            }

        }
    }
}
