/*
 * Copyright (C) 2016-2020 phantom.bot
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

import com.gmt2001.httpwsserver.HTTPWSServer;
import com.gmt2001.httpwsserver.HttpRequestHandler;
import com.gmt2001.httpwsserver.HttpServerPageHandler;
import com.gmt2001.httpwsserver.auth.HttpAuthenticationHandler;
import com.gmt2001.httpwsserver.auth.HttpNoAuthenticationHandler;
import io.netty.channel.ChannelHandlerContext;
import io.netty.handler.codec.http.FullHttpRequest;
import io.netty.handler.codec.http.FullHttpResponse;
import io.netty.handler.codec.http.HttpHeaderNames;
import io.netty.handler.codec.http.HttpMethod;
import io.netty.handler.codec.http.HttpResponseStatus;
import io.netty.handler.codec.http.QueryStringDecoder;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.LinkOption;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Base64;
import java.util.Map;
import tv.phantombot.PhantomBot;

/**
 *
 * @author gmt2001
 */
public class HTTPNoAuthHandler implements HttpRequestHandler {

    public HTTPNoAuthHandler() {
    }

    @Override
    public HttpRequestHandler register() {
        HttpServerPageHandler.registerHttpHandler("/", this);
        HttpServerPageHandler.registerHttpHandler("/panel/login", this);
        HttpServerPageHandler.registerHttpHandler("/panel/vendors", this);
        HttpServerPageHandler.registerHttpHandler("/panel/css", this);
        return this;
    }

    @Override
    public HttpAuthenticationHandler getAuthHandler() {
        return HttpNoAuthenticationHandler.instance();
    }

    @Override
    public void handleRequest(ChannelHandlerContext ctx, FullHttpRequest req) {
        if (req.uri().startsWith("/sslcheck")) {
            FullHttpResponse res = HttpServerPageHandler.prepareHttpResponse(HttpResponseStatus.OK, (HTTPWSServer.instance().sslEnabled ? "true" : "false").getBytes(), null);
            String origin = req.headers().get(HttpHeaderNames.ORIGIN);
            res.headers().set(HttpHeaderNames.ACCESS_CONTROL_ALLOW_ORIGIN, origin);
            com.gmt2001.Console.debug.println("200");
            HttpServerPageHandler.sendHttpResponse(ctx, req, res);
            return;
        }

        if (req.headers().contains("password") || req.headers().contains("webauth") || new QueryStringDecoder(req.uri()).parameters().containsKey("webauth")) {
            FullHttpResponse res = HttpServerPageHandler.prepareHttpResponse(HttpResponseStatus.SEE_OTHER, null, null);

            String host = req.headers().get(HttpHeaderNames.HOST);

            if (host == null) {
                host = "";
            } else if (HTTPWSServer.instance().sslEnabled) {
                host = "https://" + host;
            } else {
                host = "http://" + host;
            }

            res.headers().set(HttpHeaderNames.LOCATION, host + "/dbquery");

            com.gmt2001.Console.debug.println("303");
            HttpServerPageHandler.sendHttpResponse(ctx, req, res);
            return;
        }

        if (req.uri().startsWith("/panel/login") && (req.method().equals(HttpMethod.POST) || req.uri().contains("logout=true"))) {
            HttpResponseStatus status;
            String sameSite = "";
            boolean validCredentials = true;
            String user = "";
            String pass = "";

            if (req.method().equals(HttpMethod.POST)) {
                Map<String, String> post = HttpServerPageHandler.parsePost(req);

                user = post.getOrDefault("user", "");
                pass = post.getOrDefault("pass", "");

                validCredentials = user.equals(PhantomBot.instance().getProperties().getProperty("paneluser", "panel")) && pass.equals(PhantomBot.instance().getProperties().getProperty("panelpassword", "panel"));
            }

            if (!validCredentials) {
                status = HttpResponseStatus.UNAUTHORIZED;
            } else {
                status = HttpResponseStatus.SEE_OTHER;
            }

            FullHttpResponse res = HttpServerPageHandler.prepareHttpResponse(status, null, null);

            if (req.uri().contains("logout=true")) {
                res.headers().add(HttpHeaderNames.SET_COOKIE, "panellogin=" + (HTTPWSServer.instance().sslEnabled ? "; Secure" + sameSite : "") + "; HttpOnly; expires=Thu, 01 Jan 1970 00:00:00 GMT; Path=/");
            } else if (req.method().equals(HttpMethod.POST) && validCredentials) {
                res.headers().add(HttpHeaderNames.SET_COOKIE, "panellogin=" + new String(Base64.getEncoder().encode((user + ":" + pass).getBytes())) + (HTTPWSServer.instance().sslEnabled ? "; Secure" + sameSite : "") + "; HttpOnly; Path=/");
            }

            String host = req.headers().get(HttpHeaderNames.HOST);

            if (host == null) {
                host = "";
            } else if (HTTPWSServer.instance().sslEnabled) {
                host = "https://" + host;
            } else {
                host = "http://" + host;
            }

            String kickback;

            if (req.uri().contains("kickback=")) {
                kickback = req.uri().substring(req.uri().indexOf("kickback=") + 9);
            } else {
                kickback = "/panel";
            }

            if (validCredentials) {
                res.headers().set(HttpHeaderNames.LOCATION, host + kickback);

                com.gmt2001.Console.debug.println("303");
            } else {
                com.gmt2001.Console.debug.println("401");
            }

            HttpServerPageHandler.sendHttpResponse(ctx, req, res);
            return;
        }

        if (!req.method().equals(HttpMethod.GET) && !req.method().equals(HttpMethod.HEAD)) {
            com.gmt2001.Console.debug.println("403");
            HttpServerPageHandler.sendHttpResponse(ctx, req, HttpServerPageHandler.prepareHttpResponse(HttpResponseStatus.FORBIDDEN, null, null));
            return;
        }

        QueryStringDecoder qsd = new QueryStringDecoder(req.uri());

        try {
            String start = "./web/";
            String path = qsd.path();

            if (path.startsWith("/config/audio-hooks") || path.startsWith("/config/gif-alerts")) {
                start = ".";
            }

            Path p = Paths.get(start, path);

            if (path.endsWith("/") || Files.isDirectory(p, LinkOption.NOFOLLOW_LINKS)) {
                path = path + "/index.html";
                p = Paths.get(start, path);
            }

            if ((!p.toAbsolutePath().startsWith(Paths.get(PhantomBot.GetExecutionPath(), "./web"))
                        && !p.toAbsolutePath().startsWith(Paths.get(PhantomBot.GetExecutionPath(), "./config/audio-hooks"))
                        && !p.toAbsolutePath().startsWith(Paths.get(PhantomBot.GetExecutionPath(), "./config/gif-alerts")))
                    || (p.toAbsolutePath().startsWith(Paths.get(PhantomBot.GetExecutionPath(), "./web/panel"))
                        && !p.toAbsolutePath().startsWith(Paths.get(PhantomBot.GetExecutionPath(), "./web/panel/vendors"))
                        && !p.toAbsolutePath().startsWith(Paths.get(PhantomBot.GetExecutionPath(), "./web/panel/css"))
                        && !p.toAbsolutePath().startsWith(Paths.get(PhantomBot.GetExecutionPath(), "./web/panel/login")))
                    || p.toAbsolutePath().startsWith(Paths.get(PhantomBot.GetExecutionPath(), "./web/ytplayer"))) {
                com.gmt2001.Console.debug.println("403 " + req.method().asciiName() + ": " + p.toString());
                HttpServerPageHandler.sendHttpResponse(ctx, req, HttpServerPageHandler.prepareHttpResponse(HttpResponseStatus.FORBIDDEN, null, null));
                return;
            }

            if (HttpServerPageHandler.checkFilePermissions(ctx, req, p, false)) {
                com.gmt2001.Console.debug.println("200 " + req.method().asciiName() + ": " + p.toString() + " (" + p.getFileName().toString() + " = "
                        + HttpServerPageHandler.detectContentType(p.getFileName().toString()) + ")");
                HttpServerPageHandler.sendHttpResponse(ctx, req, HttpServerPageHandler.prepareHttpResponse(HttpResponseStatus.OK,
                        req.method().equals(HttpMethod.HEAD) ? null : Files.readAllBytes(p), p.getFileName().toString()));
            }
        } catch (IOException ex) {
            com.gmt2001.Console.debug.println("500");
            com.gmt2001.Console.debug.printStackTrace(ex);
            HttpServerPageHandler.sendHttpResponse(ctx, req, HttpServerPageHandler.prepareHttpResponse(HttpResponseStatus.INTERNAL_SERVER_ERROR, null, null));
        }
    }

}
