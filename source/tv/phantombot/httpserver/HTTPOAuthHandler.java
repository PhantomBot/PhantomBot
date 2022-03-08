/*
 * Copyright (C) 2016-2022 phantombot.github.io/PhantomBot
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
import com.gmt2001.TwitchAuthorizationCodeFlow;
import com.gmt2001.httpwsserver.HttpRequestHandler;
import com.gmt2001.httpwsserver.HttpServerPageHandler;
import com.gmt2001.httpwsserver.auth.HttpAuthenticationHandler;
import com.gmt2001.httpwsserver.auth.HttpBasicAuthenticationHandler;
import com.gmt2001.httpwsserver.auth.HttpNoAuthenticationHandler;
import io.netty.channel.ChannelHandlerContext;
import io.netty.handler.codec.http.FullHttpRequest;
import io.netty.handler.codec.http.HttpResponseStatus;
import io.netty.handler.codec.http.QueryStringDecoder;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.security.SecureRandom;
import tv.phantombot.PhantomBot;

/**
 *
 * @author gmt2001
 */
public class HTTPOAuthHandler implements HttpRequestHandler {

    private final HttpAuthenticationHandler authHandler;
    private static final String TOKENCHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz1234567890";
    private static final int TOKENLEN = 40;
    private HttpAuthenticationHandler authHandlerBroadcaster;
    private String token;

    public HTTPOAuthHandler(String panelUser, String panelPass) {
        authHandler = new HttpBasicAuthenticationHandler("PhantomBot Web OAuth", panelUser, panelPass, "/panel/login/");
        token = generateToken();
        authHandlerBroadcaster = new HttpBasicAuthenticationHandler("PhantomBot Web OAuth", "broadcaster", token, "/panel/login/");
    }

    @Override
    public HttpRequestHandler register() {
        HttpServerPageHandler.registerHttpHandler("/oauth", this);
        return this;
    }

    @Override
    public HttpAuthenticationHandler getAuthHandler() {
        return HttpNoAuthenticationHandler.instance();
    }

    @Override
    public void handleRequest(ChannelHandlerContext ctx, FullHttpRequest req) {
        if (req.uri().startsWith("/oauth/broadcaster")) {
            if (!authHandlerBroadcaster.checkAuthorization(ctx, req)) {
                return;
            }
        } else {
            if (!authHandler.checkAuthorization(ctx, req)) {
                return;
            }
        }

        QueryStringDecoder qsd = new QueryStringDecoder(req.uri());

        try {
            String path = qsd.path();

            if (path.startsWith("/oauth")) {
                path = "/oauth";
            }

            Path p = Paths.get("./web/", path);

            if (path.endsWith("/") || Files.isDirectory(p)) {
                path = path + "/index.html";
                p = Paths.get("./web/", path);
            }

            if (!PathValidator.isValidPathWebAuth(p.toString()) || !p.toAbsolutePath().startsWith(Paths.get(PhantomBot.GetExecutionPath(), "./web"))) {
                com.gmt2001.Console.debug.println("403 " + req.method().asciiName() + ": " + p.toString());
                HttpServerPageHandler.sendHttpResponse(ctx, req, HttpServerPageHandler.prepareHttpResponse(HttpResponseStatus.FORBIDDEN, null, null));
                return;
            }

            if (HttpServerPageHandler.checkFilePermissions(ctx, req, p, false)) {
                com.gmt2001.Console.debug.println("200 " + req.method().asciiName() + ": " + p.toString() + " (" + p.getFileName().toString() + " = "
                        + HttpServerPageHandler.detectContentType(p.getFileName().toString()) + ")");
                byte[] data = Files.readAllBytes(p);
                if (qsd.path().startsWith("/oauth")) {
                    data = TwitchAuthorizationCodeFlow.handleRequest(req, data, this);
                }
                HttpServerPageHandler.sendHttpResponse(ctx, req, HttpServerPageHandler.prepareHttpResponse(HttpResponseStatus.OK, data, p.getFileName().toString()));
            }
        } catch (IOException ex) {
            com.gmt2001.Console.debug.println("500");
            com.gmt2001.Console.debug.printStackTrace(ex);
            HttpServerPageHandler.sendHttpResponse(ctx, req, HttpServerPageHandler.prepareHttpResponse(HttpResponseStatus.INTERNAL_SERVER_ERROR, null, null));
        }
    }

    public String changeBroadcasterToken() {
        token = generateToken();
        authHandlerBroadcaster = new HttpBasicAuthenticationHandler("PhantomBot Web OAuth", "broadcaster", token, "/panel/login");
        return token;
    }

    private String generateToken() {
        String ret = "";

        SecureRandom r = new SecureRandom();

        while (ret.length() < TOKENLEN) {
            int val = r.nextInt(TOKENCHARS.length());
            ret += TOKENCHARS.charAt(val);
        }

        return ret;
    }

    public boolean validateBroadcasterToken(String token) {
        return this.token.equals(token);
    }

}
