/*
 * Copyright (C) 2016-2018 phantombot.tv
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

            if (new File("./web/beta-panel").isDirectory()) {
                HttpContext betaPanelContext = server.createContext("/beta-panel", new BetaPanelHandler());
                betaPanelContext.setAuthenticator(auth);
            }

            server.start();
        } catch (BindException ex) {
            com.gmt2001.Console.err.println("Verbindung zum Port für HTTP-Server auf Port " + myPort + " konnte nicht hergestellt werden.");
            com.gmt2001.Console.warn.println("Bitte stellen Sie sicher, dass auf Ihrem System derzeit nicht der Port " + myPort + " verwendet wird.");
            com.gmt2001.Console.warn.println("Du kannst den Basis-Port in botlogin.txt auch auf einen anderen Wert ändern, z.B. " + (myPort + 1000));
            throw new Exception("HTTP-Server auf Port " + myPort+ " konnte nicht erstellt werden.");
        } catch (IOException ex) {
            com.gmt2001.Console.err.println("HTTP-Server konnte nicht erstellt werden: " + ex.getMessage());
            com.gmt2001.Console.err.logStackTrace(ex);
            throw new Exception("HTTP-Server auf Port " + myPort+ " konnte nicht erstellt werden.");
        } catch (Exception ex) {
            com.gmt2001.Console.err.println("HTTP-Server konnte nicht erstellt werden: " + ex.getMessage());
            com.gmt2001.Console.err.logStackTrace(ex);
            throw new Exception("HTTP-Server auf Port " + myPort+ " konnte nicht erstellt werden.");
        }
    }

    public void close() {
        com.gmt2001.Console.out.println("HTTP-Server schließt Port " + serverPort + " mit 5 Sekunden Verzögerung.");
        server.stop(5);
        com.gmt2001.Console.out.println("HTTP-Server auf Port "+ serverPort +" gestoppt");
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

    class BetaPanelHandler implements HttpHandler {
        public void handle(HttpExchange exchange) throws IOException {
            HTTPServerCommon.handleBetaPanel(exchange);
        }
    }

    class HTTPServerHandler implements HttpHandler {
        public void handle(HttpExchange exchange) throws IOException {
            HTTPServerCommon.handle(exchange, serverPassword, serverWebAuth);
        }
    }
}
