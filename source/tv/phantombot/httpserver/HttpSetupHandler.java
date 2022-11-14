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
import com.gmt2001.Reflect;
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
import tv.phantombot.CaselessProperties;
import tv.phantombot.PhantomBot;

/**
 *
 * @author gmt2001
 */
public class HttpSetupHandler implements HttpRequestHandler {

    private final HttpAuthenticationHandler authHandler;
    private static final int TOKENLEN = 20;
    private HttpAuthenticationHandler authHandlerToken;
    private String token;

    public HttpSetupHandler() {
        this.authHandler = new HttpBasicAuthenticationHandler("PhantomBot Web OAuth", CaselessProperties.instance().getProperty("paneluser", "panel"),
                CaselessProperties.instance().getProperty("panelpassword", "panel"), "/panel/login/");
        this.token = PhantomBot.generateRandomString(TOKENLEN);
        this.authHandlerToken = new HttpBasicAuthenticationHandler("PhantomBot Web OAuth", "Token", this.token, "/panel/login/?message=A+login+for+the+Setup+page+is+available+in+the+console");
    }

    @Override
    public HttpRequestHandler register() {
        HttpServerPageHandler.registerHttpHandler("/setup", this);
        return this;
    }

    @Override
    public HttpAuthenticationHandler getAuthHandler() {
        return HttpNoAuthenticationHandler.instance();
    }

    /**
     * @botproperty allowpanelusertosetup - If `true`, the panel login can access the setup page; else only the random token. Default `true`
     * @botpropertycatsort allowpanelusertosetup 20 10 Admin
     */
    @Override
    public void handleRequest(ChannelHandlerContext ctx, FullHttpRequest req) {
        if ((!CaselessProperties.instance().getPropertyAsBoolean("allowpanelusertosetup", true) || !this.authHandler.isAuthorized(ctx, req))
                && !this.authHandlerToken.checkAuthorization(ctx, req)) {
            this.token = PhantomBot.generateRandomString(TOKENLEN);
            this.authHandlerToken = new HttpBasicAuthenticationHandler("PhantomBot Web OAuth", "Token", this.token, "/panel/login/?message=A+login+for+the+Setup+page+is+available+in+the+console");

            com.gmt2001.Console.out.println();
            com.gmt2001.Console.out.println("User for Setup Login: Token");
            com.gmt2001.Console.out.println("Password for Setup Login: " + this.token);
            com.gmt2001.Console.out.println();
            return;
        }

        QueryStringDecoder qsd = new QueryStringDecoder(req.uri());

        try {
            String path = qsd.path();

            if (path.startsWith("/setup")) {
                path = "/setup";
            }

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
                if (qsd.path().startsWith("/setup")) {

                }
                HttpServerPageHandler.sendHttpResponse(ctx, req, HttpServerPageHandler.prepareHttpResponse(HttpResponseStatus.OK, data, p.getFileName().toString()));
            }
        } catch (IOException ex) {
            com.gmt2001.Console.debug.println("500");
            com.gmt2001.Console.debug.printStackTrace(ex);
            HttpServerPageHandler.sendHttpResponse(ctx, req, HttpServerPageHandler.prepareHttpResponse(HttpResponseStatus.INTERNAL_SERVER_ERROR));
        }
    }
}
