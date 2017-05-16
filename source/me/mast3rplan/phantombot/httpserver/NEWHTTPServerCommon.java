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

public class NEWHTTPServerCommon {

    public static void handleYTP(HttpExchange exchange) throws IOException {
        URI uriData = exchange.getRequestURI();
        String uriPath = uriData.getPath();

        // Get the Request Method (GET/PUT)
        String requestMethod = exchange.getRequestMethod();

        // Get any data from the body, although, we just discard it, this is required
        InputStream inputStream = exchange.getRequestBody();
        while (inputStream.read() != -1) {
            inputStream.skip(0x10000);
        }
        inputStream.close();

        if (requestMethod.equals("GET")) {
            if (uriPath.equals("/ytplayer")) {
                handleFile("/web/ytplayer/index.html", exchange, false, false);
            } else {
                handleFile("/web/" + uriPath, exchange, false, false);
            }
        }
    }

    public static void handlePanel(HttpExchange exchange) throws IOException {
        URI uriData = exchange.getRequestURI();
        String uriPath = uriData.getPath();

        // Get the Request Method (GET/PUT)
        String requestMethod = exchange.getRequestMethod();

        // Get any data from the body, although, we just discard it, this is required
        InputStream inputStream = exchange.getRequestBody();
        while (inputStream.read() != -1) {
            inputStream.skip(0x10000);
        }
        inputStream.close();

        if (requestMethod.equals("GET")) {
            if (uriPath.equals("/panel")) {
                NEWHTTPServerCommon.handleFile("/web/panel/index.html", exchange, false, false);
            } else {
                NEWHTTPServerCommon.handleFile("/web/" + uriPath, exchange, false, false);
            }
        }
    }

    public static void handle(HttpExchange exchange, String serverPassword, String serverWebAuth) throws IOException {
        Boolean hasPassword = false;
        Boolean doRefresh = false;
        Boolean doMarquee = false;
        String myPassword = "";
        String myHdrUser = "";
        String myHdrMessage = "";
        String[] uriQueryList = null;
        int marqueeWidth = 420;
        int msgLength = 40;

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
        while (inputStream.read() != -1) {
            inputStream.skip(0x10000);
        }
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

        // Check the uriQueryList for the webauth
        if (uriQuery != null) {
            for (String query : uriQueryList) {
                if (query.startsWith("webauth=")) {
                    String[] webAuthData = query.split("=");
                    myPassword = webAuthData[1];
                    if (myPassword.equals(serverWebAuth)) {
                        hasPassword = true;
                    }
                } else if (query.startsWith("refresh")) {
                    doRefresh = true;
                } else if (query.startsWith("marquee")) {
                    doMarquee = true;
                } else if (query.startsWith("width")) {
                    String[] splitData = query.split("=");
                    try {
                        marqueeWidth = Integer.parseInt(splitData[1]);
                    } catch (NumberFormatException ex) {
                        marqueeWidth = 420;
                    }
                } else if (query.startsWith("cutoff")) {
                    String[] splitData = query.split("=");
                    try {
                        msgLength = Integer.parseInt(splitData[1]);
                    } catch (NumberFormatException ex) {
                        msgLength = 40;
                    }
                }
            }
        }

        if (requestMethod.equals("GET")) {
            if (uriPath.startsWith("/inistore")) {
                handleIniStore(uriPath, exchange, hasPassword);
            } else if (uriPath.startsWith("/dbquery")) {
                handleDBQuery(uriPath, uriQueryList, exchange, hasPassword);
            } else if (uriPath.startsWith("/addons") && !doRefresh && !doMarquee) {
                handleFile(uriPath, exchange, hasPassword, true);
            } else if (uriPath.startsWith("/addons") && doMarquee) {
                handleRefresh(uriPath, exchange, true, hasPassword, true, marqueeWidth, msgLength);
            } else if (uriPath.startsWith("/addons") && doRefresh) {
                handleRefresh(uriPath, exchange, false, hasPassword, true, 0, 0);
            } else if (uriPath.startsWith("/logs")) {
                handleFile(uriPath, exchange, hasPassword, true);
            } else if (uriPath.equals("/playlist")) {
                handleFile("/web/playlist/index.html", exchange, hasPassword, false);
            } else if (uriPath.equals("/")) {
                handleFile("/web/index.html", exchange, hasPassword, false);
            } else if (uriPath.equals("/alerts")) {
                handleFile("/web/alerts/index.html", exchange, hasPassword, false);
            } else {
                handleFile("/web" + uriPath, exchange, hasPassword, false);
            }
        }

        if (requestMethod.equals("PUT")) {
            handlePutRequest(myHdrUser, myHdrMessage, exchange, hasPassword);
        }
    }

    /* Query List:
     *
     * table=tableName&getKeys       - Get list of keys.
     * table=tableName&getData=key   - Get a specific row of data.
     * table=tableName&tableExists   - Return if the table exists or not.
     * table=tableName&keyExists=key - Return if a key exists in a table or not.
     */
    private static void handleDBQuery(String uriPath, String[] uriQueryList, HttpExchange exchange, Boolean hasPassword) {
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

            if (keyValue[0].equals("webauth")) {
                continue;
            }

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

    private static void handleFile(String uriPath, HttpExchange exchange, Boolean hasPassword, Boolean needsPassword) {
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

                // The Alerts module will always query an MP3; do not print out a file missing error for this.
                if (!uriPath.endsWith(".mp3")) {
                    com.gmt2001.Console.err.println("HTTP Server: handleFile(): " + ex.getMessage());
                    com.gmt2001.Console.err.logStackTrace(ex);
                }
            } catch (IOException ex) {
                sendHTMLError(500, "Server Error", exchange);
                com.gmt2001.Console.err.println("HTTP Server: handleFile(): " + ex.getMessage());
                com.gmt2001.Console.err.logStackTrace(ex);
            }
        }
    }

    private static void handleRefresh(String uriPath, HttpExchange exchange, Boolean doMarquee, Boolean hasPassword, Boolean needsPassword, int marqueeWidth, int msgLength) {
        if (needsPassword) {
            if (!hasPassword) {
                sendHTMLError(403, "Access Denied", exchange);
                return;
            }
        }

        File inputFile = new File("." + uriPath);

        if (inputFile.isDirectory()) {
            sendHTMLError(500, "Server Error: Refresh/Marquee does not support a directory, only a file", exchange);
            com.gmt2001.Console.err.println("HTTP Server: handleFile(): Refresh/Marquee does not support a directory, only a file.");
        } else {
            try {
                FileInputStream fileStream = new FileInputStream(inputFile);
                byte[] fileRawData  = new byte[fileStream.available()];
                fileStream.read(fileRawData);
                String fileStringData = new String(fileRawData, StandardCharsets.UTF_8);
                String refreshString = "";

                if (doMarquee) {
                    refreshString = "<html><head><meta http-equiv=\"refresh\" content=\"5\" /><style>" +
                                    "body { margin: 5px; }" + 
                                    ".marquee { "+
                                    "    height: 25px;" +
                                    "    width: " + marqueeWidth + "px;" +
                                    "    overflow: hidden;" +
                                    "    position: relative;" +
                                    "}" +
                                    ".marquee div {" +
                                    "    display: block;" +
                                    "    width: 200%;" +
                                    "    height: 25px;" +
                                    "    position: absolute;" +
                                    "    overflow: hidden;" +
                                    "    animation: marquee 5s linear infinite;" +
                                    "}" +
                                    ".marquee span {" +
                                    "    float: left;" +
                                    "    width: 50%;" +
                                    "}" +
                                    "@keyframes marquee {" +
                                    "    0% { left: 0; }" +
                                    "    100% { left: -100%; }" +
                                    "}" +
                                    "</style></head><body><div class=\"marquee\"><div>" +
                                    "<span>" + fileStringData.substring(0, Math.min(fileStringData.length(), msgLength)) + "&nbsp;</span>" +
                                    "<span>" + fileStringData.substring(0, Math.min(fileStringData.length(), msgLength)) + "&nbsp;</span>" +
                                    "</div></div></body></html>";
                } else {
                    refreshString = "<html><head><meta http-equiv=\"refresh\" content=\"5\" /></head>" +
                                    "<body>" + fileStringData + "</body></html>";
                }
                
                sendData("text/html", refreshString, exchange);
            } catch (FileNotFoundException ex) {
                sendHTMLError(404, "Not Found", exchange);
            } catch (IOException ex) {
                sendHTMLError(500, "Server Error", exchange);
                com.gmt2001.Console.err.println("HTTP Server: handleFile(): " + ex.getMessage());
                com.gmt2001.Console.err.logStackTrace(ex);
            }
        }
    }

    private static void handleIniStore(String uriPath, HttpExchange exchange, Boolean hasPassword) {
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

    private static void handlePutRequest(String user, String message, HttpExchange exchange, Boolean hasPassword) {
        if (!hasPassword) {
            sendHTMLError(403, "Access Denied", exchange);
            return;
        }

        if (user == "" || message == "") {
            sendHTMLError(400, "Missing Parameter", exchange);
            return;
        }

        if (message.startsWith("!")) {
            PhantomBot.instance().handleCommand(user, message.substring(1));
        } else {
            PhantomBot.instance().getSession().say(message);
        }
        sendData("text/text", "event posted", exchange);
    }

    private static void sendData(String contentType, String data, HttpExchange exchange) {
        sendData(contentType, data.getBytes(), exchange);
    }

    private static void sendData(String contentType, byte[] data, HttpExchange exchange) {
        Headers outHeaders = exchange.getResponseHeaders();
        outHeaders.set("Content-Type", contentType);
        try {
            exchange.sendResponseHeaders(200, data.length);
            OutputStream outputStream = exchange.getResponseBody();
            outputStream.write(data);
            outputStream.close();
        } catch (IOException ex) {
            sendHTMLErrorNoHeader(500, "Server Error", exchange);
            com.gmt2001.Console.err.println("HTTP Server: sendData(): " + ex.getMessage());
            com.gmt2001.Console.err.logStackTrace(ex);
        }
    }

    private static void sendHTMLError(int error, String message, HttpExchange exchange) {
        Headers outHeaders = exchange.getResponseHeaders();
        outHeaders.set("Context-Type", "text/text");
        try {
            exchange.sendResponseHeaders(error, message.length());
            OutputStream outputStream = exchange.getResponseBody();
            outputStream.write(message.getBytes());
            outputStream.close();
        } catch (IOException ex) {
            // Do not generate another HTML error, as we are already in sendHTMLError which failed.
            com.gmt2001.Console.err.println("HTTP Server: sendHTMLError(" + error + "): " + ex.getMessage());
            com.gmt2001.Console.err.logStackTrace(ex);
        }
    }

    private static void sendHTMLErrorNoHeader(int error, String message, HttpExchange exchange) {
        try {
            OutputStream outputStream = exchange.getResponseBody();
            outputStream.write(message.getBytes());
            outputStream.close();
        } catch (IOException ex) {
            // Do not generate another HTML error, as we are already in sendHTMLError which failed.
            com.gmt2001.Console.err.println("HTTP Server: sendHTMLError(" + error + "): " + ex.getMessage());
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
