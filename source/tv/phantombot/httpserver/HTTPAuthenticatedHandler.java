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
package tv.phantombot.httpserver;

import com.gmt2001.httpwsserver.HttpRequestHandler;
import com.gmt2001.httpwsserver.HttpServerPageHandler;
import com.gmt2001.httpwsserver.auth.HttpAuthenticationHandler;
import com.gmt2001.httpwsserver.auth.HttpSharedTokenOrPasswordAuthenticationHandler;
import com.scaniatv.LangFileUpdater;
import io.netty.channel.ChannelHandlerContext;
import io.netty.handler.codec.http.FullHttpRequest;
import io.netty.handler.codec.http.HttpMethod;
import io.netty.handler.codec.http.HttpResponseStatus;
import io.netty.handler.codec.http.QueryStringDecoder;
import java.io.IOException;
import java.nio.charset.Charset;
import java.nio.file.Files;
import java.nio.file.LinkOption;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.List;
import org.json.JSONStringer;
import tv.phantombot.PhantomBot;

/**
 *
 * @author gmt2001
 */
public class HTTPAuthenticatedHandler implements HttpRequestHandler {

    private final HttpAuthenticationHandler authHandler;

    public HTTPAuthenticatedHandler(String webAuth, String myPassword) {
        authHandler = new HttpSharedTokenOrPasswordAuthenticationHandler(webAuth, myPassword);
    }

    @Override
    public HttpRequestHandler register() {
        HttpServerPageHandler.registerHttpHandler("/addons", this);
        HttpServerPageHandler.registerHttpHandler("/dbquery", this);
        HttpServerPageHandler.registerHttpHandler("/games", this);
        HttpServerPageHandler.registerHttpHandler("/get-lang", this);
        HttpServerPageHandler.registerHttpHandler("/inistore", this);
        HttpServerPageHandler.registerHttpHandler("/lang", this);
        HttpServerPageHandler.registerHttpHandler("/logs", this);
        return this;
    }

    @Override
    public HttpAuthenticationHandler getAuthHandler() {
        return authHandler;
    }

    @Override
    public void handleRequest(ChannelHandlerContext ctx, FullHttpRequest req) {

        if (req.method().equals(HttpMethod.PUT)) {
            if (req.headers().contains("lang-path")) {
                putLang(ctx, req);
            } else {
                putIrc(ctx, req);
            }
            return;
        } else if (!req.method().equals(HttpMethod.GET)) {
            com.gmt2001.Console.debug.println("403");
            HttpServerPageHandler.sendHttpResponse(ctx, req, HttpServerPageHandler.prepareHttpResponse(HttpResponseStatus.FORBIDDEN, null, null));
            return;
        }

        QueryStringDecoder qsd = new QueryStringDecoder(req.uri());
        String path = qsd.path();

        if (path.startsWith("/dbquery")) {
            handleDbQuery(ctx, req, qsd);
            return;
        } else if (path.startsWith("/games")) {
            handleGames(ctx, req, qsd);
            return;
        } else if (path.startsWith("/get-lang") || path.startsWith("/lang")) {
            handleLang(ctx, req);
            return;
        } else if (path.startsWith("/inistore")) {
            handleIniStore(ctx, req, qsd);
            return;
        }

        try {
            Path p = Paths.get(".", path);

            if (HttpServerPageHandler.checkFilePermissions(ctx, req, p, true)) {
                if (Files.isDirectory(p, LinkOption.NOFOLLOW_LINKS)) {
                    HttpServerPageHandler.listDirectory(ctx, req, p);
                } else if (path.startsWith("/addons") && (qsd.parameters().containsKey("marquee") || qsd.parameters().containsKey("refresh"))) {
                    handleAddons(ctx, req, p, qsd);
                } else {
                    com.gmt2001.Console.debug.println("200 " + req.method().asciiName() + ": " + p.toString() + " (" + p.getFileName().toString() + " = "
                            + HttpServerPageHandler.detectContentType(p.getFileName().toString()) + ")");
                    HttpServerPageHandler.sendHttpResponse(ctx, req, HttpServerPageHandler.prepareHttpResponse(HttpResponseStatus.OK,
                            req.method().equals(HttpMethod.HEAD) ? null : Files.readAllBytes(p), p.getFileName().toString()));
                }
            }
        } catch (IOException ex) {
            com.gmt2001.Console.debug.println("500");
            com.gmt2001.Console.debug.printStackTrace(ex);
            HttpServerPageHandler.sendHttpResponse(ctx, req, HttpServerPageHandler.prepareHttpResponse(HttpResponseStatus.INTERNAL_SERVER_ERROR, null, null));
        }
    }

    private void handleAddons(ChannelHandlerContext ctx, FullHttpRequest req, Path p, QueryStringDecoder qsd) {
        try {
            String ret;

            if (qsd.parameters().containsKey("marquee")) {
                List<String> defWidth = new ArrayList<>();
                defWidth.add("420");
                List<String> defLen = new ArrayList<>();
                defLen.add("40");
                int width = Integer.parseInt(qsd.parameters().getOrDefault("width", defWidth).get(0));
                int len = Integer.parseInt(qsd.parameters().getOrDefault("cutoff", defLen).get(0));
                String data = Files.readString(p);

                ret = "<html><head><meta http-equiv=\"refresh\" content=\"5\" /><style>"
                        + "body { margin: 5px; }"
                        + ".marquee { "
                        + "    height: 25px;"
                        + "    width: " + width + "px;"
                        + "    overflow: hidden;"
                        + "    position: relative;"
                        + "}"
                        + ".marquee div {"
                        + "    display: block;"
                        + "    width: 200%;"
                        + "    height: 25px;"
                        + "    position: absolute;"
                        + "    overflow: hidden;"
                        + "    animation: marquee 5s linear infinite;"
                        + "}"
                        + ".marquee span {"
                        + "    float: left;"
                        + "    width: 50%;"
                        + "}"
                        + "@keyframes marquee {"
                        + "    0% { left: 0; }"
                        + "    100% { left: -100%; }"
                        + "}"
                        + "</style></head><body><div class=\"marquee\"><div>"
                        + "<span>" + data.substring(0, Math.min(data.length(), len)) + "&nbsp;</span>"
                        + "<span>" + data.substring(0, Math.min(data.length(), len)) + "&nbsp;</span>"
                        + "</div></div></body></html>";
            } else {
                ret = "<html><head><meta http-equiv=\"refresh\" content=\"5\" /></head><body>" + Files.readString(p) + "</body></html>";
            }

            com.gmt2001.Console.debug.println("200 " + req.method().asciiName() + ": " + p.toString() + " (" + p.getFileName().toString() + " = "
                    + HttpServerPageHandler.detectContentType("html") + ")");
            HttpServerPageHandler.sendHttpResponse(ctx, req, HttpServerPageHandler.prepareHttpResponse(HttpResponseStatus.OK, ret.getBytes(Charset.forName("UTF-8")), "html"));
        } catch (NumberFormatException | IOException ex) {
            com.gmt2001.Console.debug.println("500");
            com.gmt2001.Console.debug.printStackTrace(ex);
            HttpServerPageHandler.sendHttpResponse(ctx, req, HttpServerPageHandler.prepareHttpResponse(HttpResponseStatus.INTERNAL_SERVER_ERROR, null, null));
        }
    }

    private void handleDbQuery(ChannelHandlerContext ctx, FullHttpRequest req, QueryStringDecoder qsd) {
        JSONStringer jsonObject = new JSONStringer();

        if (!qsd.parameters().containsKey("table") || qsd.parameters().get("table").isEmpty() || qsd.parameters().get("table").get(0).isBlank()) {
            jsonObject.object().key("error").value("table not provided").endObject();
            HttpServerPageHandler.sendHttpResponse(ctx, req, HttpServerPageHandler.prepareHttpResponse(HttpResponseStatus.BAD_REQUEST, jsonObject.toString().getBytes(Charset.forName("UTF-8")), "json"));
            return;
        }

        String dbTable = qsd.parameters().get("table").get(0);
        String dbSection = "";

        if (qsd.parameters().containsKey("section") && !qsd.parameters().get("section").isEmpty() && !qsd.parameters().get("section").get(0).isBlank()) {
            dbSection = qsd.parameters().get("section").get(0);
        }

        if (qsd.parameters().containsKey("tableExists")) {
            jsonObject.object().key("table");
            jsonObject.object();
            jsonObject.key("table_name").value(dbTable);
            jsonObject.key("exists").value(PhantomBot.instance().getDataStore().FileExists(dbTable));
            jsonObject.endObject();
            jsonObject.endObject();

            HttpServerPageHandler.sendHttpResponse(ctx, req, HttpServerPageHandler.prepareHttpResponse(HttpResponseStatus.OK, jsonObject.toString().getBytes(Charset.forName("UTF-8")), "json"));
        } else if (!PhantomBot.instance().getDataStore().FileExists(dbTable)) {
            jsonObject.object().key("error").value("table does not exist").endObject();
            HttpServerPageHandler.sendHttpResponse(ctx, req, HttpServerPageHandler.prepareHttpResponse(HttpResponseStatus.BAD_REQUEST, jsonObject.toString().getBytes(Charset.forName("UTF-8")), "json"));
        } else if (qsd.parameters().containsKey("keyExists")) {
            if (qsd.parameters().get("keyExists").isEmpty() || qsd.parameters().get("keyExists").get(0).isBlank()) {
                jsonObject.object().key("error").value("key not provided").endObject();
                HttpServerPageHandler.sendHttpResponse(ctx, req, HttpServerPageHandler.prepareHttpResponse(HttpResponseStatus.BAD_REQUEST, jsonObject.toString().getBytes(Charset.forName("UTF-8")), "json"));
            } else {
                jsonObject.object().key("table");
                jsonObject.object();
                jsonObject.key("table_name").value(dbTable);
                jsonObject.key("key").value(qsd.parameters().get("keyExists").get(0));
                jsonObject.key("keyExists").value(PhantomBot.instance().getDataStore().HasKey(dbTable, dbSection, qsd.parameters().get("keyExists").get(0)));
                jsonObject.endObject();
                jsonObject.endObject();

                HttpServerPageHandler.sendHttpResponse(ctx, req, HttpServerPageHandler.prepareHttpResponse(HttpResponseStatus.OK, jsonObject.toString().getBytes(Charset.forName("UTF-8")), "json"));
            }
        } else if (qsd.parameters().containsKey("getData")) {
            if (qsd.parameters().get("getData").isEmpty() || qsd.parameters().get("getData").get(0).isBlank()) {
                jsonObject.object().key("error").value("key not provided").endObject();
                HttpServerPageHandler.sendHttpResponse(ctx, req, HttpServerPageHandler.prepareHttpResponse(HttpResponseStatus.BAD_REQUEST, jsonObject.toString().getBytes(Charset.forName("UTF-8")), "json"));
            } else {
                jsonObject.object().key("table");
                jsonObject.object();
                jsonObject.key("table_name").value(dbTable);
                jsonObject.key("key").value(qsd.parameters().get("getData").get(0));
                jsonObject.key("value").value(PhantomBot.instance().getDataStore().GetString(dbTable, dbSection, qsd.parameters().get("getData").get(0)));
                jsonObject.endObject();
                jsonObject.endObject();

                HttpServerPageHandler.sendHttpResponse(ctx, req, HttpServerPageHandler.prepareHttpResponse(HttpResponseStatus.OK, jsonObject.toString().getBytes(Charset.forName("UTF-8")), "json"));
            }
        } else if (qsd.parameters().containsKey("getKeys")) {
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

            HttpServerPageHandler.sendHttpResponse(ctx, req, HttpServerPageHandler.prepareHttpResponse(HttpResponseStatus.OK, jsonObject.toString().getBytes(Charset.forName("UTF-8")), "json"));
        } else if (qsd.parameters().containsKey("getAllRows")) {
            jsonObject.object();
            jsonObject.key("table");
            jsonObject.object();
            jsonObject.key("table_name").value(dbTable);
            jsonObject.key("results").array();

            String[] dbKeys = PhantomBot.instance().getDataStore().GetKeyList(dbTable, dbSection);

            for (String dbKey : dbKeys) {
                jsonObject.object();
                jsonObject.key("key").value(dbKey);
                jsonObject.key("value").value(PhantomBot.instance().getDataStore().GetString(dbTable, dbSection, dbKey));
                jsonObject.endObject();
            }
            jsonObject.endArray();
            jsonObject.endObject();
            jsonObject.endObject();

            HttpServerPageHandler.sendHttpResponse(ctx, req, HttpServerPageHandler.prepareHttpResponse(HttpResponseStatus.OK, jsonObject.toString().getBytes(Charset.forName("UTF-8")), "json"));
        } else if (qsd.parameters().containsKey("getSortedRows")) {
            jsonObject.object();
            jsonObject.key("table");
            jsonObject.object();
            jsonObject.key("table_name").value(dbTable);
            jsonObject.key("results").array();
            String sortOrder = "DESC";
            String sortLimit = String.valueOf(Integer.MAX_VALUE);
            String sortOffset = "0";

            if (qsd.parameters().containsKey("order") && !qsd.parameters().get("order").isEmpty() && !qsd.parameters().get("order").get(0).isBlank()
                    && qsd.parameters().get("order").get(0).equalsIgnoreCase("ASC")) {
                sortOrder = "ASC";
            }

            if (qsd.parameters().containsKey("limit") && !qsd.parameters().get("limit").isEmpty() && !qsd.parameters().get("limit").get(0).isBlank()) {
                sortLimit = qsd.parameters().get("limit").get(0);
            }

            if (qsd.parameters().containsKey("offset") && !qsd.parameters().get("offset").isEmpty() && !qsd.parameters().get("offset").get(0).isBlank()) {
                sortOffset = qsd.parameters().get("offset").get(0);
            }

            String[] dbKeys = PhantomBot.instance().getDataStore().GetKeysByOrder(dbTable, dbSection, sortOrder, sortLimit, sortOffset);

            for (String dbKey : dbKeys) {
                jsonObject.object();
                jsonObject.key("key").value(dbKey);
                jsonObject.key("value").value(PhantomBot.instance().getDataStore().GetString(dbTable, dbSection, dbKey));
                jsonObject.endObject();
            }
            jsonObject.endArray();
            jsonObject.endObject();
            jsonObject.endObject();

            HttpServerPageHandler.sendHttpResponse(ctx, req, HttpServerPageHandler.prepareHttpResponse(HttpResponseStatus.OK, jsonObject.toString().getBytes(Charset.forName("UTF-8")), "json"));
        } else if (qsd.parameters().containsKey("getSortedRowsByValue")) {
            jsonObject.object();
            jsonObject.key("table");
            jsonObject.object();
            jsonObject.key("table_name").value(dbTable);
            jsonObject.key("results").array();
            String sortOrder = "DESC";
            String sortLimit = String.valueOf(Integer.MAX_VALUE);
            String sortOffset = "0";

            if (qsd.parameters().containsKey("order") && !qsd.parameters().get("order").isEmpty() && !qsd.parameters().get("order").get(0).isBlank()
                    && qsd.parameters().get("order").get(0).equalsIgnoreCase("ASC")) {
                sortOrder = "ASC";
            }

            if (qsd.parameters().containsKey("limit") && !qsd.parameters().get("limit").isEmpty() && !qsd.parameters().get("limit").get(0).isBlank()) {
                sortLimit = qsd.parameters().get("limit").get(0);
            }

            if (qsd.parameters().containsKey("offset") && !qsd.parameters().get("offset").isEmpty() && !qsd.parameters().get("offset").get(0).isBlank()) {
                sortOffset = qsd.parameters().get("offset").get(0);
            }

            String[] dbKeys = PhantomBot.instance().getDataStore().GetKeysByOrderValue(dbTable, dbSection, sortOrder, sortLimit, sortOffset);

            for (String dbKey : dbKeys) {
                jsonObject.object();
                jsonObject.key("key").value(dbKey);
                jsonObject.key("value").value(PhantomBot.instance().getDataStore().GetString(dbTable, dbSection, dbKey));
                jsonObject.endObject();
            }
            jsonObject.endArray();
            jsonObject.endObject();
            jsonObject.endObject();

            HttpServerPageHandler.sendHttpResponse(ctx, req, HttpServerPageHandler.prepareHttpResponse(HttpResponseStatus.OK, jsonObject.toString().getBytes(Charset.forName("UTF-8")), "json"));
        } else {
            jsonObject.object().key("error").value("malformed request").endObject();
            HttpServerPageHandler.sendHttpResponse(ctx, req, HttpServerPageHandler.prepareHttpResponse(HttpResponseStatus.BAD_REQUEST, jsonObject.toString().getBytes(Charset.forName("UTF-8")), "json"));
        }
    }

    private void handleGames(ChannelHandlerContext ctx, FullHttpRequest req, QueryStringDecoder qsd) {
        if (!qsd.parameters().containsKey("search") || qsd.parameters().get("search").isEmpty() || qsd.parameters().get("search").get(0).isBlank()) {
            HttpServerPageHandler.sendHttpResponse(ctx, req, HttpServerPageHandler.prepareHttpResponse(HttpResponseStatus.OK, "[]".getBytes(Charset.forName("UTF-8")), "json"));
            return;
        }

        try {
            String data = Files.readString(Paths.get("./web/panel/js/utils/gamesList.txt"));
            String search = qsd.parameters().get("search").get(0).toLowerCase();

            JSONStringer stringer = new JSONStringer();
            stringer.array();

            for (String g : data.split("\n")) {
                if (g.toLowerCase().startsWith(search)) {
                    stringer.object().key("game").value(g.replace("\r", "")).endObject();
                }
            }

            stringer.endArray();
            HttpServerPageHandler.sendHttpResponse(ctx, req, HttpServerPageHandler.prepareHttpResponse(HttpResponseStatus.OK, stringer.toString().getBytes(Charset.forName("UTF-8")), "json"));
        } catch (IOException ex) {
            com.gmt2001.Console.debug.println("500");
            com.gmt2001.Console.debug.printStackTrace(ex);
            HttpServerPageHandler.sendHttpResponse(ctx, req, HttpServerPageHandler.prepareHttpResponse(HttpResponseStatus.INTERNAL_SERVER_ERROR, null, null));
        }
    }

    private void handleIniStore(ChannelHandlerContext ctx, FullHttpRequest req, QueryStringDecoder qsd) {
        String iniStore = qsd.path().substring(10);
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

        HttpServerPageHandler.sendHttpResponse(ctx, req, HttpServerPageHandler.prepareHttpResponse(HttpResponseStatus.OK, outputString.getBytes(Charset.forName("UTF-8")), "plain"));
    }

    private void handleLang(ChannelHandlerContext ctx, FullHttpRequest req) {
        if (req.headers().contains("lang-path")) {
            HttpServerPageHandler.sendHttpResponse(ctx, req, HttpServerPageHandler.prepareHttpResponse(HttpResponseStatus.OK, LangFileUpdater.getCustomLang(req.headers().get("lang-path")).getBytes(Charset.forName("UTF-8")), "plain"));
        } else {
            HttpServerPageHandler.sendHttpResponse(ctx, req, HttpServerPageHandler.prepareHttpResponse(HttpResponseStatus.OK, String.join("\n", LangFileUpdater.getLangFiles()).getBytes(Charset.forName("UTF-8")), "plain"));
        }
    }

    private void putIrc(ChannelHandlerContext ctx, FullHttpRequest req) {
        String user = req.headers().get("user");
        String msg = req.headers().get("message");

        if (user == null || msg == null || user.isBlank() || msg.isBlank()) {
            HttpServerPageHandler.sendHttpResponse(ctx, req, HttpServerPageHandler.prepareHttpResponse(HttpResponseStatus.BAD_REQUEST, null, null));
            return;
        }

        if (msg.charAt(0) == '!') {
            PhantomBot.instance().handleCommand(user, msg.substring(1));
        } else {
            PhantomBot.instance().getSession().say(msg);
        }

        HttpServerPageHandler.sendHttpResponse(ctx, req, HttpServerPageHandler.prepareHttpResponse(HttpResponseStatus.OK, "event posted".getBytes(Charset.forName("UTF-8")), "plain"));
    }

    private void putLang(ChannelHandlerContext ctx, FullHttpRequest req) {
        LangFileUpdater.updateCustomLang(req.content().toString(Charset.forName("UTF-8")), req.headers().get("lang-path"));

        HttpServerPageHandler.sendHttpResponse(ctx, req, HttpServerPageHandler.prepareHttpResponse(HttpResponseStatus.OK, "File Updated.".getBytes(Charset.forName("UTF-8")), "plain"));
    }

}
