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
 * HTTPS Server
 * @author: illusionaryone
 */
package tv.phantombot.httpserver;

import java.io.FileInputStream;
import java.io.IOException;
import java.net.BindException;
import java.net.InetSocketAddress;
import java.util.concurrent.Executors;

import tv.phantombot.PhantomBot;

import com.sun.net.httpserver.HttpsServer;
import java.security.KeyStore;
import java.security.KeyManagementException;

import javax.net.ssl.KeyManagerFactory;
import javax.net.ssl.TrustManagerFactory;
import javax.net.ssl.SSLEngine;
import javax.net.ssl.SSLParameters;
import javax.net.ssl.SSLContext;

import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;
import com.sun.net.httpserver.HttpContext;
import com.sun.net.httpserver.BasicAuthenticator;
import com.sun.net.httpserver.HttpsConfigurator;
import com.sun.net.httpserver.HttpsParameters;
import java.io.File;


public class HTTPSServer {
    private HttpsServer server;
    private String     serverPassword;
    private String     serverWebAuth;
    private String     httpsPassword;
    private String     httpsFileName;
    private int        serverPort;

    public HTTPSServer(String ip, int myPort, String myPassword, String myWebAuth, final String panelUser, final String panelPassword, final String fileName, final String password) throws Exception {
        serverPort = myPort;
        serverPassword = myPassword.replace("oauth:", "");
        serverWebAuth = myWebAuth;

        Thread.setDefaultUncaughtExceptionHandler(com.gmt2001.UncaughtExceptionHandler.instance());

        this.httpsFileName = fileName;
        this.httpsPassword = password;

        try {
            server = HttpsServer.create((!ip.isEmpty() ? new InetSocketAddress(ip, serverPort) : new InetSocketAddress(serverPort)), 0);
            SSLContext sslContext = SSLContext.getInstance("TLS");

            KeyStore ks = KeyStore.getInstance("JKS");
            FileInputStream inputStream = new FileInputStream(this.httpsFileName);
            ks.load(inputStream, password.toCharArray());

            KeyManagerFactory kmf = KeyManagerFactory.getInstance("SunX509");
            kmf.init(ks, password.toCharArray());

            TrustManagerFactory tmf = TrustManagerFactory.getInstance("SunX509");
            tmf.init(ks);

            sslContext.init(kmf.getKeyManagers(), tmf.getTrustManagers(), null);
            server.setHttpsConfigurator(new HttpsConfigurator(sslContext) {
                public void configure (HttpsParameters params) {
                    try {
                        // initialise the SSL context
                        SSLContext c = SSLContext.getDefault();
                        SSLEngine engine = c.createSSLEngine();
                        params.setNeedClientAuth(false);
                        params.setCipherSuites(engine.getEnabledCipherSuites());
                        params.setProtocols(engine.getEnabledProtocols());

                        // get the default parameters
                        SSLParameters defaultSSLParameters = c.getDefaultSSLParameters();
                        params.setSSLParameters(defaultSSLParameters);

                    } catch (Exception ex) {
                        System.out.println("Failed to create HTTPS port");
                    }
                }
            });

            server.createContext("/", new HTTPSServerHandler());

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

            server.setExecutor(Executors.newCachedThreadPool());
            server.start();
        } catch (KeyManagementException ex) {
            com.gmt2001.Console.err.logStackTrace(ex);
            throw new Exception("HTTPSServer Failed to Load SSL Certificate");
        } catch (BindException ex) {
            com.gmt2001.Console.err.println("Failed to bind to port for HTTPS Server on port " + myPort);
            com.gmt2001.Console.warn.println("Please make sure nothing is currently using port " + myPort + " on your system");
            com.gmt2001.Console.warn.println("You can also change the baseport in the botlogin.txt file to a different value, such as " + (myPort + 1000));
            throw new Exception("Failed to Create HTTPSServer on Port " + myPort);
        } catch (IOException ex) {
            com.gmt2001.Console.err.println("Failed to create HTTPS Server: " + ex.getMessage());
            com.gmt2001.Console.err.logStackTrace(ex);
            throw new Exception("Failed to Create HTTPSServer on Port " + myPort);
        } catch (Exception ex) {
            com.gmt2001.Console.err.println("Failed to create HTTPS Server: " + ex.getMessage());
            com.gmt2001.Console.err.logStackTrace(ex);
            throw new Exception("Failed to Create HTTPSServer on Port " + myPort);
        }
    }

    public void close() {
        com.gmt2001.Console.out.println("HTTPS Server closing down on port " + serverPort + " with 5 second delay.");
        server.stop(5);
        com.gmt2001.Console.out.println("HTTPS Server stopped on port " + serverPort);
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

    class HTTPSServerHandler implements HttpHandler {
        public void handle(HttpExchange exchange) throws IOException {
            HTTPServerCommon.handle(exchange, serverPassword, serverWebAuth);
        }
    }
}
