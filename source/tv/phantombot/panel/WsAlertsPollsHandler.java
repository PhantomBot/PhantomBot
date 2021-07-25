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
import io.netty.handler.codec.http.websocketx.TextWebSocketFrame;
import io.netty.handler.codec.http.websocketx.WebSocketFrame;
import java.util.LinkedList;
import java.util.List;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;
import org.json.JSONStringer;
import tv.phantombot.PhantomBot;
import tv.phantombot.event.EventBus;
import tv.phantombot.event.webpanel.websocket.WebPanelSocketUpdateEvent;

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
        if (frame instanceof TextWebSocketFrame) {
            TextWebSocketFrame tframe = (TextWebSocketFrame) frame;

            JSONObject jso;

            try {
                jso = new JSONObject(tframe.text());
            } catch (JSONException ex) {
                com.gmt2001.Console.err.logStackTrace(ex);
                return;
            }

            if (PhantomBot.instance().getProperties().getPropertyAsBoolean("wsdebug", false)) {
                com.gmt2001.Console.debug.println(jso.toString());
            }

            if (jso.has("socket_event")) {
                handleSocketEvent(ctx, frame, jso);
            }
        }
    }

    private void handleSocketEvent(ChannelHandlerContext ctx, WebSocketFrame frame, JSONObject jso) {
        String script = jso.getString("script");
        String arguments = jso.getJSONObject("args").getString("arguments");
        JSONArray jsonArray = jso.getJSONObject("args").getJSONArray("args");
        String uniqueID = jso.has("socket_event") ? jso.getString("socket_event") : "";

        JSONStringer jsonObject = new JSONStringer();
        List<String> tempArgs = new LinkedList<>();
        String[] args = null;

        for (int i = 0; i < jsonArray.length(); i++) {
            tempArgs.add(jsonArray.getString(i));
        }

        if (!tempArgs.isEmpty()) {
            int i = 0;
            args = new String[tempArgs.size()];

            for (String str : tempArgs) {
                args[i] = str;
                ++i;
            }
        }

        EventBus.instance().post(new WebPanelSocketUpdateEvent(uniqueID, script, arguments, args));
        jsonObject.object().key("query_id").value(uniqueID).endObject();
        WebSocketFrameHandler.sendWsFrame(ctx, frame, WebSocketFrameHandler.prepareTextWebSocketResponse(jsonObject.toString()));
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
