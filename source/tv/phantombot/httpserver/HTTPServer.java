/*
 * Copyright (C) 2016-2019 phantombot.tv
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

/*
 * HTTP Server
 * @author: illusionaryone
 */
package tv.phantombot.httpserver;

import com.sun.net.httpserver.BasicAuthenticator;
import com.sun.net.httpserver.HttpContext;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;
import com.sun.net.httpserver.HttpServer;

import java.io.IOException;
import java.io.File;
import java.net.InetSocketAddress;
import java.net.BindException;

import tv.phantombot.PhantomBot;


public class HTTPServer {
    private HttpServer server;
    private String     serverPassword;
    private String     serverWebAuth;
    private int        serverPort;

    public HTTPServer(String ip, int myPort, String myPassword, String myWebAuth, final String panelUser, final String panelPassword) throws Exception {
        serverPort = myPort;
        serverPassword = myPassword.replace("oauth:", "");
        serverWebAuth = myWebAuth;

        Thread.setDefaultUncaughtExceptionHandler(com.gmt2001.UncaughtExceptionHandler.instance());

        try {
            server = HttpServer.create((!ip.isEmpty() ? new InetSocketAddress(ip, serverPort) : new InetSocketAddress(serverPort)), 0);
            server.createContext("/", new HTTPServerHandler());

            HttpContext panelContext = server.createContext("/panel", new PanelHandler());
            HttpContext ytContext = server.createContext("/ytplayer", new YTPHandler());

            BasicAuthenticator auth = new BasicAuthenticator("PhantomBot Web Utilities") {
                @Override
                public boolean checkCredentials(String user, String pwd) {
                    return user.equals(panelUser) && pwd.equals(panelPassword);
                }
            };
            ytContext.setAuthenticator(auth);
            panelContext.setAuthenticator(auth);

            server.start();
        } catch (BindException ex) {
            com.gmt2001.Console.err.println("Failed to bind to port for HTTP Server on port " + myPort);
            com.gmt2001.Console.warn.println("Please make sure nothing is currently using port " + myPort + " on your system");
            com.gmt2001.Console.warn.println("You can also change the baseport in the botlogin.txt file to a different value, such as " + (myPort + 1000));
            throw new Exception("Failed to Create HTTPServer on Port " + myPort);
        } catch (IOException ex) {
            com.gmt2001.Console.err.println("Failed to create HTTP Server: " + ex.getMessage());
            com.gmt2001.Console.err.logStackTrace(ex);
            throw new Exception("Failed to Create HTTPServer on Port " + myPort);
        } catch (Exception ex) {
            com.gmt2001.Console.err.println("Failed to create HTTP Server: " + ex.getMessage());
            com.gmt2001.Console.err.logStackTrace(ex);
            throw new Exception("Failed to Create HTTPServer on Port " + myPort);
        }
    }

    public void close() {
        com.gmt2001.Console.out.println("HTTP server closing down on port " + serverPort + " with 5 second delay.");
        server.stop(5);
        com.gmt2001.Console.out.println("HTTP server stopped on port " + serverPort);
    }

    class YTPHandler implements HttpHandler {
        public void handle(HttpExchange exchange) throws IOException {
            HTTPServerCommon.handleYTP(exchange);
        }
    }

    class PanelHandler implements HttpHandler {
        public void handle(HttpExchange exchange) throws IOException {
            HTTPServerCommon.handlePanel(exchange);
        }
    }

    class HTTPServerHandler implements HttpHandler {
        public void handle(HttpExchange exchange) throws IOException {
            HTTPServerCommon.handle(exchange, serverPassword, serverWebAuth);
        }
    }
}
