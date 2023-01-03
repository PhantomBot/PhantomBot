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

import com.gmt2001.PathValidator;
import com.gmt2001.Reflect;
import com.gmt2001.httpwsserver.HttpRequestHandler;
import com.gmt2001.httpwsserver.HttpServerPageHandler;
import com.gmt2001.httpwsserver.auth.HttpAuthenticationHandler;
import com.gmt2001.httpwsserver.auth.HttpBasicAuthenticationHandler;
import io.netty.channel.ChannelHandlerContext;
import io.netty.handler.codec.http.FullHttpRequest;
import io.netty.handler.codec.http.FullHttpResponse;
import io.netty.handler.codec.http.HttpHeaderNames;
import io.netty.handler.codec.http.HttpMethod;
import io.netty.handler.codec.http.HttpResponseStatus;
import io.netty.handler.codec.http.QueryStringDecoder;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import tv.phantombot.CaselessProperties;

/**
 *
 * @author gmt2001
 */
public class HTTPPanelAndYTHandler implements HttpRequestHandler {

    private HttpAuthenticationHandler authHandler;

    public HTTPPanelAndYTHandler() {
        this.authHandler = new HttpBasicAuthenticationHandler("PhantomBot Web Panel", CaselessProperties.instance().getProperty("paneluser", "panel"),
                CaselessProperties.instance().getProperty("panelpassword", "panel"), "/panel/login/");
    }

    @Override
    public HttpRequestHandler register() {
        HttpServerPageHandler.registerHttpHandler("/panel", this);
        HttpServerPageHandler.registerHttpHandler("/ytplayer", this);
        return this;
    }

    public void updateAuth() {
        this.authHandler = new HttpBasicAuthenticationHandler("PhantomBot Web Panel", CaselessProperties.instance().getProperty("paneluser", "panel"),
                CaselessProperties.instance().getProperty("panelpassword", "panel"), "/panel/login/");
    }

    @Override
    public HttpAuthenticationHandler getAuthHandler() {
        return authHandler;
    }

    @Override
    public void handleRequest(ChannelHandlerContext ctx, FullHttpRequest req) {
        if (!req.method().equals(HttpMethod.GET) && !req.uri().startsWith("/oauth")) {
            com.gmt2001.Console.debug.println("405");
            HttpServerPageHandler.sendHttpResponse(ctx, req, HttpServerPageHandler.prepareHttpResponse(HttpResponseStatus.METHOD_NOT_ALLOWED));
            return;
        }

        if (req.uri().startsWith("/panel/checklogin")) {
            FullHttpResponse res = HttpServerPageHandler.prepareHttpResponse(HttpResponseStatus.NO_CONTENT);
            String origin = req.headers().get(HttpHeaderNames.ORIGIN);
            res.headers().set(HttpHeaderNames.ACCESS_CONTROL_ALLOW_ORIGIN, origin);
            res.headers().set(HttpHeaderNames.ACCESS_CONTROL_ALLOW_CREDENTIALS, "true");

            com.gmt2001.Console.debug.println("204");
            HttpServerPageHandler.sendHttpResponse(ctx, req, res);
            return;
        }

        QueryStringDecoder qsd = new QueryStringDecoder(req.uri());

        try {
            String path = qsd.path();

            Path p = Paths.get("./web/", path);

            if (path.endsWith("/") || Files.isDirectory(p)) {
                path = path + "/index.html";
                p = Paths.get("./web/", path);
            }

            if (!PathValidator.isValidPathWebAuth(p.toString()) || !p.toAbsolutePath().startsWith(Paths.get(Reflect.GetExecutionPath(), "./web"))) {
                com.gmt2001.Console.debug.println("403 " + req.method().asciiName() + ": " + p.toString());
                HttpServerPageHandler.sendHttpResponse(ctx, req, HttpServerPageHandler.prepareHttpResponse(HttpResponseStatus.FORBIDDEN));
                return;
            }

            if (HttpServerPageHandler.checkFilePermissions(ctx, req, p, false)) {
                com.gmt2001.Console.debug.println("200 " + req.method().asciiName() + ": " + p.toString() + " (" + p.getFileName().toString() + " = "
                        + HttpServerPageHandler.detectContentType(p.getFileName().toString()) + ")");
                byte[] data = Files.readAllBytes(p);
                HttpServerPageHandler.sendHttpResponse(ctx, req, HttpServerPageHandler.prepareHttpResponse(HttpResponseStatus.OK, data, p.getFileName().toString()));
            }
        } catch (IOException ex) {
            com.gmt2001.Console.debug.println("500");
            com.gmt2001.Console.debug.printStackTrace(ex);
            HttpServerPageHandler.sendHttpResponse(ctx, req, HttpServerPageHandler.prepareHttpResponse(HttpResponseStatus.INTERNAL_SERVER_ERROR));
        }
    }

}
