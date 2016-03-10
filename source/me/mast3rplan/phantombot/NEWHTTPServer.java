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

/*
 * HTTP Server
 * @author: illusionaryone
 */
package me.mast3rplan.phantombot;

import java.io.File;
import java.io.FileInputStream;
import java.io.InputStream;
import java.io.OutputStream;
import java.io.IOException;
import java.io.FileNotFoundException;
import java.net.URI;
import java.net.InetSocketAddress;
import me.mast3rplan.phantombot.event.EventBus;
import me.mast3rplan.phantombot.event.irc.message.IrcChannelMessageEvent;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;
import com.sun.net.httpserver.HttpServer;
import com.sun.net.httpserver.Headers;

public class NEWHTTPServer {
  private HttpServer server;
  private String     serverPassword;
  private String     serverWebAuth;
  private int        serverPort;

  public NEWHTTPServer(int myPort, String myPassword, String myWebAuth) {
      serverPort = myPort;
      serverPassword = myPassword;
      serverWebAuth = myWebAuth;

      Thread.setDefaultUncaughtExceptionHandler(com.gmt2001.UncaughtExceptionHandler.instance());

      try {
          server = HttpServer.create(new InetSocketAddress(serverPort), 0);
          server.createContext("/", new HTTPServerHandler());
          server.start();
      } catch (IOException ex) {
          com.gmt2001.Console.err.println("Failed to create HTTP Server: " + ex.getMessage());
          com.gmt2001.Console.err.logStackTrace(ex);
      } catch (Exception ex) {
          com.gmt2001.Console.err.println("Failed to create HTTP Server: " + ex.getMessage());
          com.gmt2001.Console.err.logStackTrace(ex);
      }
  }

  public void close() {
      com.gmt2001.Console.out.println("HTTP server closing down on port " + serverPort + " with 2 second delay.");
      server.stop(2);
      com.gmt2001.Console.out.println("HTTP server stopped on port " + serverPort);
  }

  class HTTPServerHandler implements HttpHandler {
      public void handle(HttpExchange exchange) throws IOException {
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
              myPassword.replace("oauth:", "");
              if (myPassword.equals(serverPassword)) {
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
              } else if (uriPath.startsWith("/addons") || uriPath.startsWith("/logs")) {
                  handleFile(uriPath, exchange, hasPassword, true);
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
              com.gmt2001.Console.err.println("HTTP Server: handleFile()" + ex.getMessage());
              com.gmt2001.Console.err.logStackTrace(ex);
          } catch (IOException ex) {
              sendHTMLError(500, "Server Error", exchange);
              com.gmt2001.Console.err.println("HTTP Server: handleFile()" + ex.getMessage());
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

    EventBus.instance().post(new IrcChannelMessageEvent(PhantomBot.instance().getSession(),
                             user, message, PhantomBot.instance().getChannel())); 
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
          com.gmt2001.Console.err.println("HTTP Server: sendData()" + ex.getMessage());
          com.gmt2001.Console.err.logStackTrace(ex);
      }
  }

  private void sendHTMLError(int error, String message, HttpExchange exchange) {
      Headers outHeaders = exchange.getResponseHeaders();
      outHeaders.set("Context-Type", "text/text");
      String responseStr = "Access Denied";
      try { 
          exchange.sendResponseHeaders(403, responseStr.length());
          OutputStream outputStream = exchange.getResponseBody();
          outputStream.write(responseStr.getBytes());
          outputStream.close();
      } catch (IOException ex) {
          // Do not generate another HTML error, as we are already in sendHTMLError which failed.
          com.gmt2001.Console.err.println("HTTP Server: sendHTMLError()" + ex.getMessage());
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
