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
import com.gmt2001.httpwsserver.auth.HttpBasicAuthenticationHandler;
import io.netty.channel.ChannelHandlerContext;
import io.netty.handler.codec.http.FullHttpRequest;
import io.netty.handler.codec.http.HttpMethod;
import io.netty.handler.codec.http.HttpResponseStatus;
import io.netty.handler.codec.http.QueryStringDecoder;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

/**
 *
 * @author gmt2001
 */
public class HTTPPanelAndYTHandler implements HttpRequestHandler {

    private final HttpAuthenticationHandler authHandler;

    public HTTPPanelAndYTHandler(String panelUser, String panelPass) {
        authHandler = new HttpBasicAuthenticationHandler("PhantomBot Web Panel", panelUser, panelPass);
    }

    @Override
    public HttpRequestHandler register() {
        HttpServerPageHandler.registerHttpHandler("/panel", this);
        HttpServerPageHandler.registerHttpHandler("/ytplayer", this);
        return this;
    }

    @Override
    public HttpAuthenticationHandler getAuthHandler() {
        return authHandler;
    }

    @Override
    public void handleRequest(ChannelHandlerContext ctx, FullHttpRequest req) {
        if (!req.method().equals(HttpMethod.GET)) {
            HttpServerPageHandler.sendHttpResponse(ctx, req, HttpServerPageHandler.prepareHttpResponse(HttpResponseStatus.FORBIDDEN, null, null));
            return;
        }

        QueryStringDecoder qsd = new QueryStringDecoder(req.uri());

        try {
            Path p = Paths.get("./web/", qsd.path());

            if (HttpServerPageHandler.checkFilePermissions(ctx, req, p, false)) {
                HttpServerPageHandler.sendHttpResponse(ctx, req, HttpServerPageHandler.prepareHttpResponse(HttpResponseStatus.OK, Files.readString(p), p.getFileName().toString()));
            }
        } catch (IOException ex) {
            com.gmt2001.Console.debug.printStackTrace(ex);
            HttpServerPageHandler.sendHttpResponse(ctx, req, HttpServerPageHandler.prepareHttpResponse(HttpResponseStatus.INTERNAL_SERVER_ERROR, null, null));
        }
    }

}
