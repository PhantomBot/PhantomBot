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
package tv.phantombot.httpserver;

import com.gmt2001.httpwsserver.HttpRequestHandler;
import com.gmt2001.httpwsserver.HttpServerPageHandler;
import com.gmt2001.httpwsserver.auth.HttpAuthenticationHandler;
import com.gmt2001.httpwsserver.auth.HttpSharedTokenOrPasswordAuthenticationHandler;
import io.netty.channel.ChannelHandlerContext;
import io.netty.handler.codec.http.FullHttpRequest;

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
        throw new UnsupportedOperationException("Not supported yet."); //To change body of generated methods, choose Tools | Templates.
    }

}
