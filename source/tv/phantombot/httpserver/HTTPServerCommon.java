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

import com.scaniatv.LangFileUpdater;
import com.sun.net.httpserver.Headers;
import com.sun.net.httpserver.HttpExchange;

import java.nio.charset.StandardCharsets;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileNotFoundException;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.URI;
import org.apache.commons.io.FileUtils;
import org.apache.commons.io.IOUtils;
import org.json.JSONException;

import tv.phantombot.PhantomBot;

import org.json.JSONStringer;

public class HTTPServerCommon {

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
                HTTPServerCommon.handleFile("/web/panel/index.html", exchange, false, false);
            } else {
                HTTPServerCommon.handleFile("/web/" + uriPath, exchange, false, false);
            }
        }
    }

    public static void handle(HttpExchange exchange, String serverPassword, String serverWebAuth) throws IOException, JSONException {
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
        if (!headers.containsKey("lang-path")) {
            InputStream inputStream = exchange.getRequestBody();
            while (inputStream.read() != -1) {
                inputStream.skip(0x10000);
            }
            inputStream.close();
        }

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
            byte[] myHdrMessageBytes = myHdrMessage.getBytes(StandardCharsets.ISO_8859_1);
            myHdrMessage = new String(myHdrMessageBytes, StandardCharsets.UTF_8);
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
            if (uriPath.contains("..")) {
                sendHTMLError(403, "Invalid URL", exchange);
            } else if (uriPath.startsWith("/inistore")) {
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
            } else if (uriPath.equals("/obs/poll-chart")) {
                handleFile("/web/obs/poll-chart/index.html", exchange, hasPassword, false);
            } else if (uriPath.startsWith("/config/audio-hooks")) {
                handleFile(uriPath, exchange, hasPassword, false);
            } else if (uriPath.startsWith("/config/gif-alerts")) {
                handleFile(uriPath, exchange, hasPassword, false);
            } else if (uriPath.startsWith("/get-lang")) {
                handleLangFiles("", exchange, hasPassword, true);
            } else if (uriPath.startsWith("/lang")) {
                handleLangFiles(headers.getFirst("lang-path"), exchange, hasPassword, true);
            } else if (uriPath.startsWith("/games")) {
                handleGamesList(exchange, hasPassword, true);
            } else {
                handleFile("/web" + uriPath, exchange, hasPassword, false);
            }
        }

        if (requestMethod.equals("PUT")) {
            if (myHdrUser.isEmpty() && headers.containsKey("lang-path")) {
                handlePutRequestLang(headers.getFirst("lang-path"), IOUtils.toString(exchange.getRequestBody(), "utf-8"), exchange, hasPassword);
            } else {
                handlePutRequest(myHdrUser, myHdrMessage, exchange, hasPassword);
            }
        }
    }

    /**
     * Query List:
     *
     * table=tableName&getKeys                             - Get list of keys.
     * table=tableName&getData=key                         - Get a specific row of data.
     * table=tableName&tableExists                         - Return if the table exists or not.
     * table=tableName&keyExists=key                       - Return if a key exists in a table or not.
     * table=tableName&getAllRows                          - Get all rows from a table.
     * table=tableName&getSortedRows                       - Get all rows sorted from a table.
     * table=tableName&getSortedRowsByValue                - Get all rows sorted from a table.
     * table=tableName&getSortedRows&order=DESC|ASC        - Options for getSortedRows, any combination may be used.
     * table=tableName&getSortedRows&limit=n
     * table=tableName&getSortedRows&offset=n
     * table=tableName&getSortedRowsByValue&order=DESC|ASC
     * table=tableName&getSortedRowsByValue&limit=n
     * table=tableName&getSortedRowsByValue&offset=n
     */
    private static void handleDBQuery(String uriPath, String[] uriQueryList, HttpExchange exchange, Boolean hasPassword) throws JSONException {
        JSONStringer jsonObject = new JSONStringer();
        String[] keyValue;
        String   dbTable = null;
        String   dbSection = null;
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
                if (keyValue.length == 1 || keyValue[1].length() == 0) {
                    sendHTMLError(400, "Bad Request", exchange);
                    return;
                }
                if (!PhantomBot.instance().getDataStore().FileExists(keyValue[1])) {
                    jsonObject.object().key("error").value("table does not exist").endObject();
                    sendHTMLError(400, jsonObject.toString(), exchange);
                    return;
                }
                dbTable = keyValue[1];
            } else if (keyValue[0].equals("section")) {
                if (keyValue.length > 1 && keyValue[1].length() > 0) {
                    dbSection = keyValue[1];
                } else {
                    dbSection = "";
                }
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
                    dbExists = PhantomBot.instance().getDataStore().HasKey(dbTable, dbSection, keyValue[1]);
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
                    String dbString = PhantomBot.instance().getDataStore().GetString(dbTable, dbSection, keyValue[1]);
                    jsonObject.object().key("table");
                    jsonObject.object();
                    jsonObject.key("table_name").value(dbTable);
                    jsonObject.key("key").value(keyValue[1]);
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

                String[] dbKeys = PhantomBot.instance().getDataStore().GetKeyList(dbTable, dbSection);

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

            // getAllRows and getSortedRows return data in the following format:
            // { "table" : { "table_name": "tableName", "results" : [ "key" : "keyString", "value" : "valueString" ] } }
            if (keyValue[0].equals("getAllRows") || keyValue[0].equals("getSortedRows") || keyValue[0].equals("getSortedRowsByValue")) {

                // Set the default values for the sort options.
                String sortOrder = "DESC";
                String sortLimit = String.valueOf(Integer.MAX_VALUE);
                String sortOffset = "0";

                String[] dbKeys = null;
                jsonObject.object();
                jsonObject.key("table");
                jsonObject.object();
                jsonObject.key("table_name").value(dbTable);
                jsonObject.key("results").array();

                if (keyValue[0].equals("getAllRows")) {
                    dbKeys = PhantomBot.instance().getDataStore().GetKeyList(dbTable, dbSection);
                } else {
                    for (String sortOptions : uriQueryList) {
                        String[] sortOption = sortOptions.split("=");

                        if (sortOption[0].equals("order")) {
                            if (sortOption[1].equalsIgnoreCase("asc")) {
                                sortOrder = "ASC";
                            } else if (sortOption[1].equalsIgnoreCase("desc")) {
                                sortOrder = "DESC";
                            }
                        }

                        if (sortOption[0].equals("limit")) {
                            if (sortOption[1] != null) {
                                sortLimit = sortOption[1];
                            }
                        }

                        if (sortOption[0].equals("offset")) {
                            if (sortOption[1] != null) {
                                sortOffset = sortOption[1];
                            }
                        }
                    }

                    if (keyValue[0].equals("getSortedRows")) {
                        dbKeys = PhantomBot.instance().getDataStore().GetKeysByOrder(dbTable, dbSection, sortOrder, sortLimit, sortOffset);
                    } else {
                        dbKeys = PhantomBot.instance().getDataStore().GetKeysByOrderValue(dbTable, dbSection, sortOrder, sortLimit, sortOffset);
                    }

                }

                for (String dbKey : dbKeys) {
                    jsonObject.object();
                    jsonObject.key("key").value(dbKey);
                    jsonObject.key("value").value(PhantomBot.instance().getDataStore().GetString(dbTable, dbSection, dbKey));
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

    /**
     * Method that handles getting the lang files list for the panel.
     * @param path
     * @param exchange
     * @param hasPassword
     * @param needsPassword
     */
    private static void handleLangFiles(String path, HttpExchange exchange, boolean hasPassword, boolean needsPassword) throws JSONException {
        if (needsPassword) {
            if (!hasPassword) {
                sendHTMLError(403, "Access Denied", exchange);
                return;
            }
        }

        if (path.isEmpty()) {
            // Get all lang files and their paths.
            String[] files = LangFileUpdater.getLangFiles();

            // Send the files.W
            sendData("text/text", String.join("\n", files), exchange);
        } else {
            sendData("text/text", LangFileUpdater.getCustomLang(path), exchange);
        }
    }

    /**
     * Method that handles searching for a game in our games list and sends it to the panel.
     * @param exchange
     * @param hasPassword
     * @param needsPassword
     */
    private static void handleGamesList(HttpExchange exchange, boolean hasPassword, boolean needsPassword) throws JSONException {
        if (needsPassword) {
            if (!hasPassword) {
                sendHTMLError(403, "Access Denied", exchange);
                return;
            }
        }

        String query= exchange.getRequestURI().getQuery();
        String[] queryData;
        String search = null;

        if (query != null) {
            queryData = query.split("&");

            if (queryData[1].contains("search")) {
                search = queryData[1].split("=")[1].toLowerCase();
            }
        }

        if (search != null) {
            try {
                String data = FileUtils.readFileToString(new File("./web/panel/js/utils/gamesList.txt"), "utf-8");
                JSONStringer stringer = new JSONStringer();
                String[] games = data.split("\n");

                // Create a new json array.
                stringer.array();
                for (String game : games) {
                    if (game.toLowerCase().startsWith(search)) {
                        stringer.object().key("game").value(game.replace("\r", "")).endObject();
                    }
                }
                // Empty the array.
                games = null;
                // Run the GC.
                System.gc();
                // Close the array.
                stringer.endArray();
                // Send the data.
                sendData("text/text", stringer.toString(), exchange);
            } catch (IOException ex) {
                com.gmt2001.Console.err.println("Failed to read game file: " + ex.getMessage());
            }
        } else {
            // Send empty json array.
            sendData("text/text", "[]", exchange);
        }
    }

    /**
     * Method that handles files.
     * @param uriPath
     * @param exchange
     * @param hasPassword
     * @param needsPassword
     */
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

    private static void handlePutRequestLang(String langFile, String langData, HttpExchange exchange, Boolean hasPassword) throws IOException, JSONException {
        if (!hasPassword) {
            sendHTMLError(403, "Access Denied.", exchange);
            return;
        }

        LangFileUpdater.updateCustomLang(langData, langFile);
        sendHTMLError(200, "File Updated.", exchange);
    }

    private static void sendData(String contentType, String data, HttpExchange exchange) {
        sendData(contentType, data.getBytes(), exchange);
    }

    private static void sendData(String contentType, byte[] data, HttpExchange exchange) {
        Headers outHeaders = exchange.getResponseHeaders();
        // Send as UTF-8 if the contentType is a text file.
        outHeaders.set("Content-Type", contentType + (contentType.indexOf("text") != -1 ? "; charset=UTF-8" : ""));

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
        } else if (path.endsWith(".js")) {
            return "application/javascript";
        } else if (path.endsWith(".css")) {
            return "text/css";
        } else if (path.endsWith(".png")) {
            return "image/png";
        } else if (path.endsWith(".mp3")) {
            return "audio/mpeg";
        } else if (path.endsWith(".aac")) {
            return "audio/aac";
        } else if (path.endsWith(".ogg")) {
            return "audio/ogg";
        }
        return "text/text";
    }
}
