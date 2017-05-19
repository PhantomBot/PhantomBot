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
 * HTTPS Server
 * @author: illusionaryone
 */
package me.mast3rplan.phantombot.httpserver;

import java.io.File;
import java.io.FileInputStream;
import java.io.InputStream;
import java.io.OutputStream;
import java.io.IOException;
import java.io.FileNotFoundException;
import java.net.URI;
import java.net.InetSocketAddress;
import java.util.concurrent.Executors;

import me.mast3rplan.phantombot.event.EventBus;
import me.mast3rplan.phantombot.PhantomBot;
import me.mast3rplan.phantombot.event.irc.message.IrcChannelMessageEvent;

import com.sun.net.httpserver.HttpsServer;
import java.security.KeyStore;
import java.security.PrivateKey;
import java.security.KeyManagementException;
import java.security.cert.X509Certificate;
import java.security.cert.Certificate;
import java.security.cert.CertificateFactory;
import javax.security.cert.CertificateExpiredException;
import javax.security.cert.CertificateNotYetValidException;

import javax.net.ssl.KeyManagerFactory;
import javax.net.ssl.TrustManagerFactory;
import javax.net.ssl.SSLEngine;
import javax.net.ssl.SSLParameters;
import javax.net.ssl.SSLContext;

import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpsExchange;
import com.sun.net.httpserver.HttpHandler;
import com.sun.net.httpserver.HttpContext;
import com.sun.net.httpserver.BasicAuthenticator;
import com.sun.net.httpserver.Headers;
import com.sun.net.httpserver.HttpsConfigurator;
import com.sun.net.httpserver.HttpsParameters;

import org.json.JSONStringer;

public class NEWHTTPSServer {
    private HttpsServer server;
    private String     serverPassword;
    private String     serverWebAuth;
    private String     httpsPassword;
    private String     httpsFileName;
    private int        serverPort;

    public NEWHTTPSServer(int myPort, String myPassword, String myWebAuth, final String panelUser, final String panelPassword, final String fileName, final String password) {
        serverPort = myPort;
        serverPassword = myPassword.replace("oauth:", "");
        serverWebAuth = myWebAuth;

        Thread.setDefaultUncaughtExceptionHandler(com.gmt2001.UncaughtExceptionHandler.instance());

        this.httpsFileName = fileName;
        this.httpsPassword = password;

        try {
            server = HttpsServer.create(new InetSocketAddress(serverPort), 0);
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
            com.gmt2001.Console.err.println("SSL certificate failed to load");
        } catch (IOException ex) {
            com.gmt2001.Console.err.println("Failed to create HTTPS Server: " + ex.getMessage());
            com.gmt2001.Console.warn.println("Failed to create a new HTTPS server on port: " + myPort + ".");
            com.gmt2001.Console.warn.println("Please make sure nothing is currently using port " + myPort + " on your system.");
            com.gmt2001.Console.warn.println("You can also change the baseport in the botlogin.txt file if you need port " + myPort + " for something else.");
            com.gmt2001.Console.err.logStackTrace(ex);
        } catch (Exception ex) {
            com.gmt2001.Console.err.println("Failed to create HTTPS Server: " + ex.getMessage());
            com.gmt2001.Console.err.logStackTrace(ex);
        }
    }

    public void close() {
        com.gmt2001.Console.out.println("HTTPS Server closing down on port " + serverPort + " with 2 second delay.");
        server.stop(2);
        com.gmt2001.Console.out.println("HTTPS Server stopped on port " + serverPort);
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

    class HTTPSServerHandler implements HttpHandler {
        public void handle(HttpExchange exchange) throws IOException {
            NEWHTTPServerCommon.handle(exchange, serverPassword, serverWebAuth);
        }
    }
}
