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

import java.util.Arrays;
import java.util.Map;
import java.util.stream.Collectors;

import org.json.JSONException;
import org.json.JSONObject;
import org.json.JSONStringer;

import com.gmt2001.httpwsserver.WebSocketFrameHandler;
import com.gmt2001.httpwsserver.WsFrameHandler;
import com.gmt2001.httpwsserver.auth.WsAuthenticationHandler;
import com.gmt2001.httpwsserver.auth.WsSharedRWTokenAuthenticationHandler;

import io.netty.channel.ChannelHandlerContext;
import io.netty.handler.codec.http.websocketx.TextWebSocketFrame;
import io.netty.handler.codec.http.websocketx.WebSocketFrame;
import tv.phantombot.CaselessProperties;
import tv.phantombot.event.EventBus;
import tv.phantombot.event.webpanel.websocket.WebPanelSocketUpdateEvent;

/**
 *
 * @author gmt2001
 */
public class WsAlertsPollsHandler implements WsFrameHandler {

    private static final String KEY_EVENT_TYPE = "type";

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

            if (CaselessProperties.instance().getPropertyAsBoolean("wsdebug", false)) {
                com.gmt2001.Console.debug.println(jso.toString());
            }

            if (jso.has("pollState")) {
                handlePollState(ctx, frame, jso);
            }
        }
    }

    private void handlePollState(ChannelHandlerContext ctx, WebSocketFrame frame, JSONObject jso) {
        EventBus.instance().postAsync(new WebPanelSocketUpdateEvent("pollState", "./systems/pollSystem.js", null, null));
    }

    public void sendJSONToAll(String jsonString) {
        try {
            WebSocketFrameHandler.broadcastWsFrame("/ws/alertspolls", WebSocketFrameHandler.prepareTextWebSocketResponse(jsonString));
        } catch (Exception ex) {
            com.gmt2001.Console.err.printStackTrace(ex);
        }
    }

    public void triggerAudioPanel(String audioHook) {
        this.triggerAudioPanel(audioHook, false);
    }

    public void triggerAudioPanel(String audioHook, boolean ignoreIsPlaying) {
        try {
            com.gmt2001.Console.debug.println("triggerAudioPanel: " + audioHook);
            JSONStringer jsonObject = new JSONStringer();
            jsonObject.object()
                    .key("audio_panel_hook").value(audioHook)
                    .key("ignoreIsPlaying").value(ignoreIsPlaying)
                    .endObject();
            sendJSONToAll(jsonObject.toString());
        } catch (JSONException ex) {
            com.gmt2001.Console.err.printStackTrace(ex);
        }
    }

    public void triggerAudioPanel(String audioHook, float volume) {
        this.triggerAudioPanel(audioHook, volume, false);
    }

    public void triggerAudioPanel(String audioHook, float volume, boolean ignoreIsPlaying) {
        try {
            com.gmt2001.Console.debug.println("triggerAudioPanel: " + audioHook);
            JSONStringer jsonObject = new JSONStringer();
            jsonObject.object()
                    .key("audio_panel_hook").value(audioHook)
                    .key("audio_panel_volume").value(volume)
                    .key("ignoreIsPlaying").value(ignoreIsPlaying)
                    .endObject();
            sendJSONToAll(jsonObject.toString());
        } catch (JSONException ex) {
            com.gmt2001.Console.err.printStackTrace(ex);
        }
    }

    public void stopMedia(){
        stopMedia("all");
    }
    public void stopMedia(String type) {
        try {
            JSONStringer jsonObject = new JSONStringer();
            jsonObject.object()
                    .key("stopMedia").value(type)
                    .endObject();
            sendJSONToAll(jsonObject.toString());
        } catch (JSONException ex) {
            com.gmt2001.Console.err.printStackTrace(ex);
        }
    }

    public void alertImage(String imageInfo) {
        this.alertImage(imageInfo, false);
    }

    public void alertImage(String imageInfo, boolean ignoreIsPlaying) {
        try {
            com.gmt2001.Console.debug.println("alertImage: " + imageInfo);
            JSONStringer jsonObject = new JSONStringer();
            jsonObject.object()
                    .key("alert_image").value(imageInfo)
                    .key("ignoreIsPlaying").value(ignoreIsPlaying)
                    .endObject();
            sendJSONToAll(jsonObject.toString());
        } catch (JSONException ex) {
            com.gmt2001.Console.err.printStackTrace(ex);
        }
    }

    public void playVideo(String filename){
        playVideo(filename, -1, false);
    }
    public void playVideo(String filename, int durationMs){
        playVideo(filename, durationMs, false);
    }

    public void playVideo(String filename, boolean fullscreen){
        playVideo(filename, -1, fullscreen);
    }

    public void playVideo(String filename, int durationMs, boolean fullscreen) {
        JSONStringer json = new JSONStringer();
        json.object()
                .key(KEY_EVENT_TYPE).value("playVideoClip")
                .key("filename").value(filename)
                .key("duration").value(durationMs)
                .key("fullscreen").value(fullscreen)
                .endObject();
        this.sendJSONToAll(json.toString());
    }

    /**
     * Takes a string to parse and trigger one or more emotes. Each emote entry is separated by a '/'. An emote describes its occurrences in the (here
     * not relevant) string in simple start-stop notation. Multiple occurrences are separated by a comma.
     * <p>
     * This is the default method that handles Twitch style emotes and uses the default emote provider Twitch
     *
     * @param emoteString a string in format of Twitch's emote format e.g. "425618:0-2,4-6,8-10/145315:12-24"
     */
    public void triggerEmotes(String emoteString) {
        Map<String, Integer> emotes = Arrays.stream(emoteString.split("/"))
                .map((singleEmotes -> singleEmotes.split(";")))
                .collect(Collectors.toMap(strings -> strings[0], strings -> strings[1].split(",").length));
        emotes.forEach(this::triggerEmote);
    }

    public void triggerEmotes(String[] emotes, String provider) {
        for (String emote : emotes) {
            this.triggerEmote(emote, provider);
        }
    }

    public void triggerEmote(String image) {
        this.triggerEmote(image, "twitch");
    }

    public void triggerEmote(String image, int amount) {
        this.triggerEmote(image, amount, "twitch");
    }

    public void triggerEmote(String image, String provider) {
        this.triggerEmote(image, 1, provider);
    }

    public void triggerEmote(String emoteId, int amount, String provider) {
        this.triggerEmote(emoteId, amount, provider, false);
    }

    public void triggerEmote(String emoteId, int amount, String provider, boolean ignoreSleep) {
        try {
            JSONStringer jsonObject = new JSONStringer();
            jsonObject.object()
                    .key("emoteId").value(emoteId)
                    .key("amount").value(amount)
                    .key("provider").value(provider)
                    .key("ignoreSleep").value(ignoreSleep)
                    .endObject();
            sendJSONToAll(jsonObject.toString());
        } catch (JSONException ex) {
            com.gmt2001.Console.err.printStackTrace(ex);
        }
    }

    public void triggerEmoteAnimation(String emoteId, int amount, String provider, String animationName, int duration, boolean ignoreSleep) {
        try {
            JSONStringer jsonObject = new JSONStringer();
            jsonObject.object()
                    .key("emoteId").value(emoteId)
                    .key("amount").value(amount)
                    .key("provider").value(provider)
                    .key("duration").value(duration)
                    .key("animationName").value(animationName)
                    .key("ignoreSleep").value(ignoreSleep)
                    .endObject();
            sendJSONToAll(jsonObject.toString());
        } catch (JSONException ex) {
            com.gmt2001.Console.err.printStackTrace(ex);
        }

    }

    /**
     * Sends a macro to be played by the alerts overlay
     *
     * @param macroJson A json string with commands
     */
    public void sendMacro(String macroJson) {
        sendJSONToAll(macroJson);
    }
}
