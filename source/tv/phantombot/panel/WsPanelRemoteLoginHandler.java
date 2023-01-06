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
package tv.phantombot.panel;

import com.gmt2001.httpwsserver.WebSocketFrameHandler;
import com.gmt2001.httpwsserver.WsFrameHandler;
import com.gmt2001.httpwsserver.auth.WsAuthenticationHandler;
import com.gmt2001.httpwsserver.auth.WsNoAuthenticationHandler;
import io.netty.channel.ChannelHandlerContext;
import io.netty.handler.codec.http.websocketx.TextWebSocketFrame;
import io.netty.handler.codec.http.websocketx.WebSocketCloseStatus;
import io.netty.handler.codec.http.websocketx.WebSocketFrame;
import org.json.JSONException;
import org.json.JSONObject;
import org.json.JSONStringer;
import tv.phantombot.CaselessProperties;
import tv.phantombot.PhantomBot;
import tv.phantombot.RepoVersion;

/**
 *
 * @author gmt2001
 */
public class WsPanelRemoteLoginHandler implements WsFrameHandler {

    private final WsAuthenticationHandler authHandler = WsNoAuthenticationHandler.instance();

    public WsPanelRemoteLoginHandler() {
    }

    @Override
    public WsFrameHandler register() {
        WebSocketFrameHandler.registerWsHandler("/ws/panel/login", this);
        return this;
    }

    @Override
    public WsAuthenticationHandler getAuthHandler() {
        return this.authHandler;
    }

    @Override
    public void handleFrame(ChannelHandlerContext ctx, WebSocketFrame frame) {
        JSONStringer jsonObject = new JSONStringer();
        boolean isError = false;
        if (frame instanceof TextWebSocketFrame) {
            TextWebSocketFrame tframe = (TextWebSocketFrame) frame;

            JSONObject jso;

            try {
                jso = new JSONObject(tframe.text());
            } catch (JSONException ex) {
                jsonObject.object().key("errors").array().object()
                        .key("status").value("500")
                        .key("title").value("Internal Server Error")
                        .key("detail").value("Unable to parse frame as JSON object")
                        .endObject().endArray().endObject();

                WebSocketFrameHandler.sendWsFrame(ctx, frame, WebSocketFrameHandler.prepareTextWebSocketResponse(jsonObject.toString()));
                WebSocketFrameHandler.sendWsFrame(ctx, frame, WebSocketFrameHandler.prepareCloseWebSocketFrame(WebSocketCloseStatus.INTERNAL_SERVER_ERROR));
                ctx.close();
                com.gmt2001.Console.err.logStackTrace(ex);
                return;
            }

            if (jso.has("remote") && jso.getString("query").equals("login")) {
                jsonObject.object();
                if (jso.getJSONObject("params").getString("type").equalsIgnoreCase("AuthRO")) {
                    jsonObject.key("authtoken").value(CaselessProperties.instance().getProperty("webauthro")).key("authtype").value("read");
                } else if (jso.getJSONObject("params").getString("user").equals(CaselessProperties.instance().getProperty("paneluser", "panel")) && jso.getJSONObject("params").getString("pass").equals(CaselessProperties.instance().getProperty("panelpassword", "panel"))) {
                    jsonObject.key("authtoken").value(CaselessProperties.instance().getProperty("webauth")).key("authtype").value("read/write");
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
                    isError = true;
                }

                if (!isError) {
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
                isError = true;
            }
        } else {
            jsonObject.object().key("errors").array().object()
                    .key("status").value("406")
                    .key("title").value("Not Acceptable")
                    .key("detail").value("Only Text frames are allowed")
                    .endObject().endArray().endObject();
            isError = true;
        }

        WebSocketFrameHandler.sendWsFrame(ctx, frame, WebSocketFrameHandler.prepareTextWebSocketResponse(jsonObject.toString()));
        if (isError) {
            WebSocketFrameHandler.sendWsFrame(ctx, frame, WebSocketFrameHandler.prepareCloseWebSocketFrame(WebSocketCloseStatus.POLICY_VIOLATION));
        } else {
            WebSocketFrameHandler.sendWsFrame(ctx, frame, WebSocketFrameHandler.prepareCloseWebSocketFrame(WebSocketCloseStatus.NORMAL_CLOSURE));
        }
        ctx.close();
    }
}
