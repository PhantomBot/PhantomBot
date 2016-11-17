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
import me.mast3rplan.phantombot.event.EventBus;
import me.mast3rplan.phantombot.PhantomBot;
import me.mast3rplan.phantombot.event.irc.message.IrcChannelMessageEvent;

import com.sun.net.httpserver.HttpsServer;
import java.security.KeyStore;
import javax.net.ssl.KeyManagerFactory;
import javax.net.ssl.TrustManagerFactory;
import javax.net.ssl.SSLEngine;
import javax.net.ssl.SSLParameters;
import javax.net.ssl.HostnameVerifier;
import javax.net.ssl.HttpsURLConnection;
import javax.net.ssl.SSLContext;
import javax.net.ssl.SSLSession;
import javax.net.ssl.TrustManager;
import javax.net.ssl.X509TrustManager;
import java.security.cert.X509Certificate;

import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpsExchange;
import com.sun.net.httpserver.HttpHandler;
import com.sun.net.httpserver.HttpServer;
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

        try {
            this.httpsFileName = fileName;
            this.httpsPassword = password;

            if (!this.httpsFileName.endsWith(".jks")) {
                this.httpsFileName = this.httpsFileName + ".jks";
            }

            com.gmt2001.Console.debug.println("httpsPassword::" + this.httpsPassword);
            com.gmt2001.Console.debug.println("httpsFileName::" + this.httpsFileName);
        } catch (Exception ex) {
            com.gmt2001.Console.err.println("Failed to set the HTTPS fileName and password: " + ex.getMessage());
            com.gmt2001.Console.err.logStackTrace(ex);
        }

        try {
            server = HttpsServer.create(new InetSocketAddress(serverPort), 0);
            SSLContext sslContext = SSLContext.getInstance("TLSv1.2");
  
            char ksPassword[] = this.httpsPassword.toCharArray();
            KeyStore ks = KeyStore.getInstance("JKS");
            FileInputStream inputStream = new FileInputStream(this.httpsFileName);
            ks.load(inputStream, ksPassword);
  
            KeyManagerFactory kmf = KeyManagerFactory.getInstance("SunX509");
            kmf.init(ks, ksPassword);
  
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
  
            server.start();
        } catch (IOException ex) {
            com.gmt2001.Console.err.println("Failed to create HTTPS Server: " + ex.getMessage());
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
        public void handle(HttpExchange httpExchange) throws IOException {
            HttpsExchange exchange = (HttpsExchange) httpExchange;
            URI uriData = exchange.getRequestURI();
            String uriPath = uriData.getPath();
  
            // Get the Request Method (GET/PUT)
            String requestMethod = exchange.getRequestMethod();
  
            // Get any data from the body, although, we just discard it, this is required
            InputStream inputStream = exchange.getRequestBody();
            while (inputStream.read() != -1) { inputStream.skip(0x10000); }
            inputStream.close();
  
            if (requestMethod.equals("GET")) {
                if (uriPath.equals("/ytplayer")) {
                    handleFile("/web/ytplayer/index.html", exchange, false, false);
                } else {
                    handleFile("/web/" + uriPath, exchange, false, false);
                }
             }
        }
    }
  
    class PanelHandler implements HttpHandler {
        public void handle(HttpExchange httpExchange) throws IOException {
            HttpsExchange exchange = (HttpsExchange) httpExchange;
            URI uriData = exchange.getRequestURI();
            String uriPath = uriData.getPath();
  
            // Get the Request Method (GET/PUT)
            String requestMethod = exchange.getRequestMethod();
  
            // Get any data from the body, although, we just discard it, this is required
            InputStream inputStream = exchange.getRequestBody();
            while (inputStream.read() != -1) { inputStream.skip(0x10000); }
            inputStream.close();
  
            if (requestMethod.equals("GET")) {
                if (uriPath.equals("/panel")) {
                    handleFile("/web/panel/index.html", exchange, false, false);
                } else {
                    handleFile("/web/" + uriPath, exchange, false, false);
                }
             }
        }
    }
  
  
    class HTTPSServerHandler implements HttpHandler {
        public void handle(HttpExchange httpExchange) throws IOException {
            HttpsExchange exchange = (HttpsExchange) httpExchange;
            Boolean hasPassword = false;
            String myPassword = "";
            String myHdrUser = "";
            String myHdrMessage = "";
            String[] uriQueryList = null;
  
            // Get the path and query string from the URI
            URI uriData = exchange.getRequestURI();
            String uriPath = uriData.getPath();
            String uriQuery = uriData.getQuery();
  
            if (uriQuery != null) {
                uriQueryList = uriQuery.split("&");
            } 
  
            // Get the headers
            Headers headers = exchange.getRequestHeaders();
  
            // Get the Request Method (GET/PUT)
            String requestMethod = exchange.getRequestMethod();
  
            // Get any data from the body, although, we just discard it, this is required
            InputStream inputStream = exchange.getRequestBody();
            while (inputStream.read() != -1) { inputStream.skip(0x10000); }
            inputStream.close();
  
            if (headers.containsKey("password")) {
                myPassword = headers.getFirst("password");
                if (myPassword.equals(serverPassword) || myPassword.equals("oauth:" + serverPassword)) {
                    hasPassword = true;
                }
            }
            if (headers.containsKey("webauth")) {
                myPassword = headers.getFirst("webauth");
                if (myPassword.equals(serverWebAuth)) {
                    hasPassword = true;
                }
            }
            if (headers.containsKey("user")) {
                myHdrUser = headers.getFirst("user");
            }
            if (headers.containsKey("message")) {
                myHdrMessage = headers.getFirst("message");
            }
  
            if (requestMethod.equals("GET")) {
                if (uriPath.startsWith("/inistore")) {
                    handleIniStore(uriPath, exchange, hasPassword);
                } else if (uriPath.startsWith("/dbquery")) {
                    handleDBQuery(uriPath, uriQueryList, exchange, hasPassword);
                } else if (uriPath.startsWith("/addons") || uriPath.startsWith("/logs")) {
                    handleFile(uriPath, exchange, hasPassword, true);
                } else if (uriPath.equals("/playlist")) {
                    handleFile("/web/playlist/index.html", exchange, hasPassword, false);
                } else if (uriPath.equals("/")) {
                    handleFile("/web/index.html", exchange, hasPassword, false);
                } else {
                    handleFile("/web" + uriPath, exchange, hasPassword, false);
                }
            }
  
            if (requestMethod.equals("PUT")) {
                handlePutRequest(myHdrUser, myHdrMessage, exchange, hasPassword);
            }
  
        }  
    }
  
    /* Query List:
     *
     * table=tableName&getKeys       - Get list of keys.
     * table=tableName&getData=key   - Get a specific row of data.
     * table=tableName&tableExists   - Return if the table exists or not.
     * table=tableName&keyExists=key - Return if a key exists in a table or not.
     */
    private void handleDBQuery(String uriPath, String[] uriQueryList, HttpExchange exchange, Boolean hasPassword) {
        JSONStringer jsonObject = new JSONStringer();
        String[] keyValue;
        String   dbTable = null;
        Boolean  dbExists;
  
        if (!hasPassword) {
            jsonObject.object().key("error").value("access denied").endObject();
            sendHTMLError(403, jsonObject.toString(), exchange);
            return;
        } 
  
        if (uriQueryList == null) {
            jsonObject.object().key("error").value("bad request").endObject();
            sendHTMLError(400, jsonObject.toString(), exchange);
            return;
        }
  
        for (String uriQuery : uriQueryList) {
            keyValue = uriQuery.split("=");
            
            if (keyValue[0].equals("table")) {
                if (keyValue[1] == null) {
                    sendHTMLError(400, "Bad Request", exchange);
                    return;
                }
                if (!PhantomBot.instance().getDataStore().FileExists(keyValue[1])) {
                    jsonObject.object().key("error").value("table does not exist").endObject();
                    sendHTMLError(400, jsonObject.toString(), exchange);
                    return;
                }
                dbTable = keyValue[1];
            } else {
                // All other commands need the table.
                if (dbTable == null) {
                    jsonObject.object().key("error").value("table not provided").endObject();
                    sendHTMLError(400, jsonObject.toString(), exchange);
                    return;
                }
            }
  
            // { "table" : { "table_name": "tableName", "exists" : true } }
            if (keyValue[0].equals("tableExists")) {
                dbExists = PhantomBot.instance().getDataStore().FileExists(dbTable);
                jsonObject.object().key("table");
                jsonObject.object();
                jsonObject.key("table_name").value(dbTable);
                jsonObject.key("exists").value(dbExists);
                jsonObject.endObject();
                jsonObject.endObject();
  
                sendData("text/text", jsonObject.toString(), exchange);
                return;
            }
  
            // { "table" : { "table_name": "tableName", "key" : "keyString", "keyExists": true } } 
            if (keyValue[0].equals("keyExists")) {
                if (keyValue.length > 1) {
                    dbExists = PhantomBot.instance().getDataStore().exists(dbTable, keyValue[1]);
                    jsonObject.object().key("table");
                    jsonObject.object();
                    jsonObject.key("table_name").value(dbTable);
                    jsonObject.key("key").value(keyValue[1]);
                    jsonObject.key("keyExists").value(dbExists);
                    jsonObject.endObject();
                    jsonObject.endObject();
  
                    sendData("text/text", jsonObject.toString(), exchange);
                    return;
                } else {
                    jsonObject.object().key("error").value("key not provided").endObject();
                    sendHTMLError(400, jsonObject.toString(), exchange);
                    return;
                }
            }
  
            // { "table" : { "table_name": "tableName", "key" : "keyString", "value": "valueString" } }
            if (keyValue[0].equals("getData")) {
                if (keyValue.length > 1) {
                    String dbString = PhantomBot.instance().getDataStore().GetString(dbTable, "", keyValue[1]);
                    jsonObject.object().key("table");
                    jsonObject.object();
                    jsonObject.key("table_name").value(dbTable);
                    jsonObject.key("key").value(keyValue[0]);
                    jsonObject.key("value").value(dbString);
                    jsonObject.endObject();
                    jsonObject.endObject();
                    sendData("text/text", jsonObject.toString(), exchange);
                    return;
                } else {
                    jsonObject.object().key("error").value("key not provided").endObject();
                    sendHTMLError(400, jsonObject.toString(), exchange);
                    return;
                }
            }
  
            // { "table" : { "table_name": "tableName", "keylist" : [ { "key" : "keyString" } ] } }
            if (keyValue[0].equals("getKeys")) {
                jsonObject.object();
                jsonObject.key("table");
                jsonObject.object();
                jsonObject.key("table_name").value(dbTable);
                jsonObject.key("keylist").array();
        
                String[] dbKeys = PhantomBot.instance().getDataStore().GetKeyList(dbTable, "");
  
                for (String dbKey : dbKeys) {
                    jsonObject.object();
                    jsonObject.key("key").value(dbKey);
                    jsonObject.endObject();
                }
                jsonObject.endArray();
                jsonObject.endObject();
                jsonObject.endObject();
                sendData("text/text", jsonObject.toString(), exchange);
                return;
            }
        }
        jsonObject.object().key("error").value("malformed request").endObject();
        sendHTMLError(400, jsonObject.toString(), exchange);
        return;
    }
  
    private void handleFile(String uriPath, HttpExchange exchange, Boolean hasPassword, Boolean needsPassword) {
        if (needsPassword) {
            if (!hasPassword) {
                sendHTMLError(403, "Access Denied", exchange);
                return;
            }
        }
  
        File inputFile = new File("." + uriPath);
  
        if (inputFile.isDirectory()) {
            File[] fileList = inputFile.listFiles();
            java.util.Arrays.sort(fileList);
            String outputString = "";
  
            for (File file : fileList) {
                outputString += file.getName() + "\n";
            }
            sendData("text/text", outputString, exchange);
        } else {
            try {
                FileInputStream fileStream = new FileInputStream(inputFile);
                byte[] outputBytes = new byte[fileStream.available()];
                fileStream.read(outputBytes);
                sendData(inferContentType(uriPath), outputBytes, exchange);
            } catch (FileNotFoundException ex) {
                sendHTMLError(404, "Not Found", exchange);
                com.gmt2001.Console.err.println("HTTPS Server: handleFile()" + ex.getMessage());
                com.gmt2001.Console.err.logStackTrace(ex);
            } catch (IOException ex) {
                sendHTMLError(500, "Server Error", exchange);
                com.gmt2001.Console.err.println("HTTPS Server: handleFile()" + ex.getMessage());
                com.gmt2001.Console.err.logStackTrace(ex);
            }
        }
    }
  
    private void handleIniStore(String uriPath, HttpExchange exchange, Boolean hasPassword) {
        if (!hasPassword) {
            sendHTMLError(403, "Access Denied", exchange);
            return;
        }
    
        String iniStore = uriPath.substring(10);
        iniStore = iniStore.replace(".ini", "");
    
        String[] sections = PhantomBot.instance().getDataStore().GetCategoryList(iniStore);
        String outputString = "";
  
        for (String section : sections) {
            if (section != null && !section.equals("")) {
                outputString += "\r\n\r\n[" + section + "]";
            }
    
            String[] keys = PhantomBot.instance().getDataStore().GetKeyList(iniStore, section);
    
            for (String key : keys) {
                String value = PhantomBot.instance().getDataStore().GetString(iniStore, section, key);
                outputString += "\r\n" + key + "=" + value;
            }
        }
  
      sendData("text/text", outputString, exchange);
    }
  
    private void handlePutRequest(String user, String message, HttpExchange exchange, Boolean hasPassword) {
        if (!hasPassword) {
            sendHTMLError(403, "Access Denied", exchange);
            return;
        }
  
        if (user == "" || message == "") {
            sendHTMLError(400, "Missing Parameter", exchange);
            return;
        }
  
        EventBus.instance().post(new IrcChannelMessageEvent(PhantomBot.instance().getSession(), user, message, PhantomBot.instance().getChannel())); 
        sendData("text/text", "event posted", exchange);
    }
  
    private void sendData(String contentType, String data, HttpExchange exchange) {
        sendData(contentType, data.getBytes(), exchange);
    }
  
    private void sendData(String contentType, byte[] data, HttpExchange exchange) {
        Headers outHeaders = exchange.getResponseHeaders();
        outHeaders.set("Content-Type", contentType);
        try {
            exchange.sendResponseHeaders(200, data.length);
            OutputStream outputStream = exchange.getResponseBody();
            outputStream.write(data);
            outputStream.close();
        } catch (IOException ex) {
            sendHTMLError(500, "Server Error", exchange);
            com.gmt2001.Console.err.println("HTTPS Server: sendData()" + ex.getMessage());
            com.gmt2001.Console.err.logStackTrace(ex);
        }
    }
  
    private void sendHTMLError(int error, String message, HttpExchange exchange) {
        Headers outHeaders = exchange.getResponseHeaders();
        outHeaders.set("Context-Type", "text/text");
        try { 
            exchange.sendResponseHeaders(error, message.length());
            OutputStream outputStream = exchange.getResponseBody();
            outputStream.write(message.getBytes());
            outputStream.close();
        } catch (IOException ex) {
            // Do not generate another HTML error, as we are already in sendHTMLError which failed.
            com.gmt2001.Console.err.println("HTTPS Server: sendHTMLError()" + ex.getMessage());
            com.gmt2001.Console.err.logStackTrace(ex);
        }
    }
  
    private static String inferContentType(String path) {
        if (path.endsWith(".html") || path.endsWith(".htm")) {
            return "text/html";
        } else if (path.endsWith(".css")) {
            return "text/css";
        } else if (path.endsWith(".png")) {
            return "image/png";
        }
        return "text/text";
    }
}
