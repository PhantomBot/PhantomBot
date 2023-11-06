/*
 * Copyright (C) 2016-2023 phantombot.github.io/PhantomBot
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

import java.io.IOException;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.Duration;
import java.util.ArrayList;
import java.util.Base64;
import java.util.List;
import java.util.Map;

import org.json.JSONException;
import org.json.JSONObject;
import org.json.JSONStringer;

import com.gmt2001.PathValidator;
import com.gmt2001.httpwsserver.HTTPWSServer;
import com.gmt2001.httpwsserver.HttpRequestHandler;
import com.gmt2001.httpwsserver.HttpServerPageHandler;
import com.gmt2001.httpwsserver.auth.HttpAuthenticationHandler;
import com.gmt2001.httpwsserver.auth.HttpNoAuthenticationHandler;
import com.gmt2001.util.Reflect;

import io.netty.channel.ChannelHandlerContext;
import io.netty.handler.codec.http.FullHttpRequest;
import io.netty.handler.codec.http.FullHttpResponse;
import io.netty.handler.codec.http.HttpHeaderNames;
import io.netty.handler.codec.http.HttpMethod;
import io.netty.handler.codec.http.HttpResponseStatus;
import io.netty.handler.codec.http.QueryStringDecoder;
import tv.phantombot.CaselessProperties;
import tv.phantombot.PhantomBot;
import tv.phantombot.RepoVersion;
import tv.phantombot.panel.PanelUser.PanelUserHandler;

/**
 *
 * @author gmt2001
 */
public class HTTPNoAuthHandler implements HttpRequestHandler {

    @Override
    public HttpRequestHandler registerHttp() {
        HttpServerPageHandler.registerHttpHandler("/", this);
        HttpServerPageHandler.registerHttpHandler("/panel/login", this);
        HttpServerPageHandler.registerHttpHandler("/panel/vendors", this);
        HttpServerPageHandler.registerHttpHandler("/panel/css", this);
        return this;
    }

    @Override
    public HttpAuthenticationHandler getHttpAuthHandler() {
        return HttpNoAuthenticationHandler.instance();
    }

    @Override
    public void handleRequest(ChannelHandlerContext ctx, FullHttpRequest req) {
        QueryStringDecoder qsd = new QueryStringDecoder(req.uri());

        if (req.uri().startsWith("/presence")) {
            FullHttpResponse res = HttpServerPageHandler.prepareHttpResponse(HttpResponseStatus.OK, "PBok".getBytes(), null);
            String origin = req.headers().get(HttpHeaderNames.ORIGIN);
            if (origin != null && !origin.isBlank()) {
                res.headers().set(HttpHeaderNames.ACCESS_CONTROL_ALLOW_ORIGIN, origin);
            }
            com.gmt2001.Console.debug.println("200 " + req.method().asciiName() + ": " + qsd.path());
            HttpServerPageHandler.sendHttpResponse(ctx, req, res);
            return;
        }

        if (req.uri().startsWith("/sslcheck")) {
            boolean isSsl = HTTPWSServer.instance().isSsl();
            if (req.headers().contains(HTTPWSServer.HEADER_X_FORWARDED_HOST) || req.headers().contains(HTTPWSServer.HEADER_CF_RAY)) {
                isSsl = true;
            }

            FullHttpResponse res = HttpServerPageHandler.prepareHttpResponse(HttpResponseStatus.OK, (isSsl ? "true" : "false").getBytes(), null);
            String origin = req.headers().get(HttpHeaderNames.ORIGIN);
            if (origin != null && !origin.isBlank()) {
                res.headers().set(HttpHeaderNames.ACCESS_CONTROL_ALLOW_ORIGIN, origin);
            }
            com.gmt2001.Console.debug.println("200 " + req.method().asciiName() + ": " + qsd.path());
            HttpServerPageHandler.sendHttpResponse(ctx, req, res);
            return;
        }

        if (req.headers().contains("password") || req.headers().contains("webauth") || new QueryStringDecoder(req.uri()).parameters().containsKey("webauth")) {
            FullHttpResponse res = HttpServerPageHandler.prepareHttpResponse(HttpResponseStatus.SEE_OTHER);

            res.headers().set(HttpHeaderNames.LOCATION, "/dbquery");

            com.gmt2001.Console.debug.println("303 " + req.method().asciiName() + ": " + qsd.path());
            HttpServerPageHandler.sendHttpResponse(ctx, req, res);
            return;
        }

        if (req.uri().startsWith("/panel/login") && req.method().equals(HttpMethod.OPTIONS)) {
            HttpServerPageHandler.sendHttpResponse(ctx, req, HttpServerPageHandler.preparePreflightResponse(req,
                    List.of(HttpMethod.GET, HttpMethod.POST, HttpMethod.PUT),
                    List.of(HttpHeaderNames.AUTHORIZATION.toString(), HttpHeaderNames.CONTENT_TYPE.toString()),
                    Duration.ofMinutes(15)));
            return;
        }

        if (req.uri().startsWith("/panel/login") && (req.method().equals(HttpMethod.POST)
            || req.method().equals(HttpMethod.PUT) || req.uri().contains("logout=true"))) {
            if (req.method().equals(HttpMethod.PUT)) {
                JSONStringer jsonObject = new JSONStringer();
                HttpResponseStatus status = HttpResponseStatus.OK;
                JSONObject jso = null;

                try {
                    jso = new JSONObject(req.content().toString(StandardCharsets.UTF_8));
                } catch (JSONException ex) {
                    jsonObject.object().key("errors").array().object()
                            .key("status").value("500")
                            .key("title").value("Internal Server Error")
                            .key("detail").value("Unable to parse frame as JSON object")
                            .endObject().endArray().endObject();

                    status = HttpResponseStatus.INTERNAL_SERVER_ERROR;
                    com.gmt2001.Console.err.logStackTrace(ex);
                }

                if (jso != null) {
                    if (jso.has("remote") && jso.getString("query").equals("login")) {
                        jsonObject.object();
                        if (jso.getJSONObject("params").getString("type").equalsIgnoreCase("AuthRO")) {
                            jsonObject.key("authtoken").value(CaselessProperties.instance().getProperty("webauthro")).key("authtype").value("read");
                        } else if (PanelUserHandler.checkLogin(jso.getJSONObject("params").getString("user"), jso.getJSONObject("params").getString("pass"))) {
                            jsonObject.key("authtoken").value(PanelUserHandler.getUserAuthToken(jso.getJSONObject("params").getString("user")));
                        } else if (jso.getJSONObject("params").getString("user").equals("broadcaster") && PhantomBot.instance() != null
                                && PhantomBot.instance().getHTTPOAuthHandler().validateBroadcasterToken(jso.getJSONObject("params").getString("pass"))) {
                            jsonObject.key("authtoken").value(jso.getJSONObject("params").getString("pass")).key("authtype").value("oauth/broadcaster");
                        } else if (jso.getJSONObject("params").getString("user").equalsIgnoreCase("token") && PhantomBot.instance() != null
                                && PhantomBot.instance().getHTTPSetupHandler().checkTokenAuthorization(jso.getJSONObject("params").getString("user"), jso.getJSONObject("params").getString("pass"))) {
                            jsonObject.key("authtoken").value("").key("authtype").value("setup/token");
                        } else {
                            jsonObject.key("errors").array().object()
                                    .key("status").value("401")
                                    .key("title").value("Unauthorized")
                                    .key("detail").value("Invalid Credentials")
                                    .endObject().endArray();
                            status = HttpResponseStatus.UNAUTHORIZED;
                        }

                        if (status.equals(HttpResponseStatus.OK)) {
                            jsonObject.key("version-data").object().key("version").value(RepoVersion.getPhantomBotVersion()).key("commit").value(RepoVersion.getRepoVersion());
                            jsonObject.key("build-type").value(RepoVersion.getBuildType());
                            jsonObject.key("java-version").value(System.getProperty("java.runtime.version"));
                            jsonObject.key("os-version").value(System.getProperty("os.name"));
                            jsonObject.endObject();
                        }

                        jsonObject.endObject();
                    } else {
                        jsonObject.object().key("errors").array().object()
                                .key("status").value("406")
                                .key("title").value("Not Acceptable")
                                .key("detail").value("Query not acceptable")
                                .endObject().endArray().endObject();
                        status = HttpResponseStatus.NOT_ACCEPTABLE;
                    }
                }

                com.gmt2001.Console.debug.println(status.code() + " " + req.method().asciiName() + ": " + qsd.path());
                HttpServerPageHandler.sendHttpResponse(ctx, req, HttpServerPageHandler.prepareHttpResponse(status, jsonObject.toString(), "json"));
            } else {
                String sameSite = "";
                String user = "";
                String pass = "";
                String kickback = "";

                if (req.method().equals(HttpMethod.POST)) {
                    Map<String, String> post = HttpServerPageHandler.parsePost(req);

                    user = post.getOrDefault("user", "");
                    pass = post.getOrDefault("pass", "");
                    kickback = URLDecoder.decode(post.getOrDefault("kickback", ""), StandardCharsets.UTF_8);
                }

                FullHttpResponse res = HttpServerPageHandler.prepareHttpResponse(HttpResponseStatus.SEE_OTHER);

                if (req.uri().contains("logout=true")) {
                    res.headers().add(HttpHeaderNames.SET_COOKIE, "panellogin=" + (HTTPWSServer.instance().isSsl() ? "; Secure" + sameSite : "")
                            + "; HttpOnly; expires=Thu, 01 Jan 1970 00:00:00 GMT; Path=/");
                } else if (req.method().equals(HttpMethod.POST)) {
                    res.headers().add(HttpHeaderNames.SET_COOKIE, "panellogin=" + new String(Base64.getEncoder().encode((user + ":" + pass).getBytes()))
                            + (HTTPWSServer.instance().isSsl() ? "; Secure" + sameSite : "") + "; HttpOnly; Path=/");
                }

                if (kickback.isBlank()) {
                    kickback = "/panel";
                }

                res.headers().set(HttpHeaderNames.LOCATION, kickback);
                com.gmt2001.Console.debug.println("303 " + req.method().asciiName() + ": " + qsd.path());

                HttpServerPageHandler.sendHttpResponse(ctx, req, res);
            }
            return;
        }

        if (!req.method().equals(HttpMethod.GET) && !req.method().equals(HttpMethod.HEAD)) {
            com.gmt2001.Console.debug.println("405 " + req.method().asciiName() + ": " + qsd.path());
            HttpServerPageHandler.sendHttpResponse(ctx, req, HttpServerPageHandler.prepareHttpResponse(HttpResponseStatus.METHOD_NOT_ALLOWED));
            return;
        }

        try {
            String start = "./web/";
            String path = qsd.path();

            if (path.startsWith("/config/audio-hooks") || path.startsWith("/config/gif-alerts") || path.startsWith("/addons") || path.startsWith("/config/clips") || path.startsWith("/config/emotes")) {
                start = ".";
            }

            Path p = Paths.get(start, path);

            if (path.endsWith("/") || Files.isDirectory(p)) {
                path = path + "/index.html";
                p = Paths.get(start, path);
            }

            if (!PathValidator.isValidPathWeb(p.toString()) || (!p.toAbsolutePath().startsWith(Paths.get(Reflect.GetExecutionPath(), "./web"))
                    && !p.toAbsolutePath().startsWith(Paths.get(Reflect.GetExecutionPath(), "./addons"))
                    && !p.toAbsolutePath().startsWith(Paths.get(Reflect.GetExecutionPath(), "./config/audio-hooks"))
                    && !p.toAbsolutePath().startsWith(Paths.get(Reflect.GetExecutionPath(), "./config/clips"))
                    && !p.toAbsolutePath().startsWith(Paths.get(Reflect.GetExecutionPath(), "./config/emotes"))
                    && !p.toAbsolutePath().startsWith(Paths.get(Reflect.GetExecutionPath(), "./config/gif-alerts")))
                    || (p.toAbsolutePath().startsWith(Paths.get(Reflect.GetExecutionPath(), "./web/panel"))
                    && !p.toAbsolutePath().startsWith(Paths.get(Reflect.GetExecutionPath(), "./web/panel/vendors"))
                    && !p.toAbsolutePath().startsWith(Paths.get(Reflect.GetExecutionPath(), "./web/panel/css"))
                    && !p.toAbsolutePath().startsWith(Paths.get(Reflect.GetExecutionPath(), "./web/panel/login")))
                    || p.toAbsolutePath().startsWith(Paths.get(Reflect.GetExecutionPath(), "./web/ytplayer"))) {
                com.gmt2001.Console.debug.println("403 " + req.method().asciiName() + ": " + p.toString());
                HttpServerPageHandler.sendHttpResponse(ctx, req, HttpServerPageHandler.prepareHttpResponse(HttpResponseStatus.FORBIDDEN));
                return;
            }

            if (HttpServerPageHandler.checkFilePermissions(ctx, req, p, false)) {
                if (path.startsWith("/addons") && (qsd.parameters().containsKey("marquee") || qsd.parameters().containsKey("refresh"))) {
                    handleAddons(ctx, req, p, qsd);
                } else {
                    com.gmt2001.Console.debug.println("200 " + req.method().asciiName() + ": " + p.toString() + " (" + p.getFileName().toString() + " = "
                            + HttpServerPageHandler.detectContentType(p.getFileName().toString()) + ")");
                    HttpServerPageHandler.sendHttpResponse(ctx, req, HttpServerPageHandler.prepareHttpResponse(HttpResponseStatus.OK,
                            req.method().equals(HttpMethod.HEAD) ? null : Files.readAllBytes(p), p.getFileName().toString()));
                }
            }
        } catch (IOException ex) {
            com.gmt2001.Console.debug.println("500 " + req.method().asciiName() + ": " + qsd.path());
            com.gmt2001.Console.debug.printStackTrace(ex);
            HttpServerPageHandler.sendHttpResponse(ctx, req, HttpServerPageHandler.prepareHttpResponse(HttpResponseStatus.INTERNAL_SERVER_ERROR));
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
            HttpServerPageHandler.sendHttpResponse(ctx, req, HttpServerPageHandler.prepareHttpResponse(HttpResponseStatus.OK, ret.getBytes(StandardCharsets.UTF_8), "html"));
        } catch (NumberFormatException | IOException ex) {
            com.gmt2001.Console.debug.println("500");
            com.gmt2001.Console.debug.printStackTrace(ex);
            HttpServerPageHandler.sendHttpResponse(ctx, req, HttpServerPageHandler.prepareHttpResponse(HttpResponseStatus.INTERNAL_SERVER_ERROR));
        }
    }

}
