/*
 * Copyright (C) 2016-2021 phantombot.github.io/PhantomBot
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
import com.gmt2001.httpwsserver.auth.WsSharedRWTokenAuthenticationHandler;
import io.netty.channel.ChannelHandlerContext;
import io.netty.handler.codec.http.websocketx.WebSocketFrame;
import org.json.JSONException;
import org.json.JSONStringer;

/**
 *
 * @author gmt2001
 */
public class WsAlertsPollsHandler implements WsFrameHandler {

    private final WsAuthenticationHandler authHandler;

    public WsAlertsPollsHandler(String panelAuthRO, String panelAuth) {
        this.authHandler = new WsSharedRWTokenAuthenticationHandler(panelAuthRO, panelAuth, 10);
    }

    @Override
    public WsFrameHandler register() {
        WebSocketFrameHandler.registerWsHandler("/ws/alertspolls", this);
        return this;
    }

    @Override
    public WsAuthenticationHandler getAuthHandler() {
        return authHandler;
    }

    @Override
    public void handleFrame(ChannelHandlerContext ctx, WebSocketFrame frame) {
    }
    
    public void sendJSONToAll(String jsonString) {
        try {
            WebSocketFrameHandler.broadcastWsFrame("/ws/alertspolls", WebSocketFrameHandler.prepareTextWebSocketResponse(jsonString));
        } catch (Exception ex) {
            com.gmt2001.Console.err.printStackTrace(ex);
        }
    }

    public void triggerAudioPanel(String audioHook) {
        try {
            com.gmt2001.Console.debug.println("triggerAudioPanel: " + audioHook);
            JSONStringer jsonObject = new JSONStringer();
            jsonObject.object().key("audio_panel_hook").value(audioHook).endObject();
            sendJSONToAll(jsonObject.toString());
        } catch (JSONException ex) {
            com.gmt2001.Console.err.printStackTrace(ex);
        }
    }

    public void alertImage(String imageInfo) {
        try {
            com.gmt2001.Console.debug.println("alertImage: " + imageInfo);
            JSONStringer jsonObject = new JSONStringer();
            jsonObject.object().key("alert_image").value(imageInfo).endObject();
            sendJSONToAll(jsonObject.toString());
        } catch (JSONException ex) {
            com.gmt2001.Console.err.printStackTrace(ex);
        }
    }
}
