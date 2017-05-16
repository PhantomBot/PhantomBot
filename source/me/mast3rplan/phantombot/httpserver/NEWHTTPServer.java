/*
 * Copyright (C) 2017 phantombot.tv
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
package me.mast3rplan.phantombot.httpserver;

import com.sun.net.httpserver.BasicAuthenticator;
import com.sun.net.httpserver.Headers;
import com.sun.net.httpserver.HttpContext;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;
import com.sun.net.httpserver.HttpServer;

import java.nio.charset.StandardCharsets;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileNotFoundException;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.InetSocketAddress;
import java.net.URI;

import me.mast3rplan.phantombot.PhantomBot;

import org.json.JSONStringer;

public class NEWHTTPServer {
    private HttpServer server;
    private String     serverPassword;
    private String     serverWebAuth;
    private int        serverPort;

    public NEWHTTPServer(int myPort, String myPassword, String myWebAuth, final String panelUser, final String panelPassword) {
        serverPort = myPort;
        serverPassword = myPassword.replace("oauth:", "");
        serverWebAuth = myWebAuth;

        Thread.setDefaultUncaughtExceptionHandler(com.gmt2001.UncaughtExceptionHandler.instance());

        try {
            server = HttpServer.create(new InetSocketAddress(serverPort), 0);
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
        } catch (IOException ex) {
            com.gmt2001.Console.err.println("Failed to create HTTP Server: " + ex.getMessage());
            com.gmt2001.Console.warn.println("Failed to create a new HTTP server on port: " + myPort + ".");
            com.gmt2001.Console.warn.println("Please make sure nothing is currently using port " + myPort + " on your system.");
            com.gmt2001.Console.warn.println("You can also change the baseport in the botlogin.txt file if you need port " + myPort + " for something else.");
            com.gmt2001.Console.err.logStackTrace(ex);
            System.exit(0);
        } catch (Exception ex) {
            com.gmt2001.Console.err.println("Failed to create HTTP Server: " + ex.getMessage());
            com.gmt2001.Console.err.logStackTrace(ex);
        }
    }

    public void close() {
        com.gmt2001.Console.out.println("NEW HTTP server closing down on port " + serverPort + " with 5 second delay.");
        server.stop(5);
        com.gmt2001.Console.out.println("NEW HTTP server stopped on port " + serverPort);
    }

    class YTPHandler implements HttpHandler {
        public void handle(HttpExchange exchange) throws IOException {
            NEWHTTPServerCommon.handleYTP(exchange);
        }
    }

    class PanelHandler implements HttpHandler {
        public void handle(HttpExchange exchange) throws IOException {
            NEWHTTPServerCommon.handlePanel(exchange);
        }
    }

    class HTTPServerHandler implements HttpHandler {
        public void handle(HttpExchange exchange) throws IOException {
            NEWHTTPServerCommon.handle(exchange, serverPassword, serverWebAuth);
        }
    }
}
