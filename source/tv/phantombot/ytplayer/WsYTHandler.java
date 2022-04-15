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
package tv.phantombot.ytplayer;

import com.gmt2001.httpwsserver.WebSocketFrameHandler;
import com.gmt2001.httpwsserver.WsFrameHandler;
import com.gmt2001.httpwsserver.auth.WsAuthenticationHandler;
import com.gmt2001.httpwsserver.auth.WsSharedRWTokenAuthenticationHandler;
import io.netty.channel.Channel;
import io.netty.channel.ChannelFuture;
import io.netty.channel.ChannelFutureListener;
import io.netty.channel.ChannelHandlerContext;
import io.netty.handler.codec.http.websocketx.TextWebSocketFrame;
import io.netty.handler.codec.http.websocketx.WebSocketCloseStatus;
import io.netty.handler.codec.http.websocketx.WebSocketFrame;
import io.netty.util.AttributeKey;
import java.util.Arrays;
import java.util.Calendar;
import java.util.Date;
import java.util.Queue;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;
import org.json.JSONException;
import org.json.JSONObject;
import org.json.JSONStringer;
import tv.phantombot.PhantomBot;
import tv.phantombot.event.EventBus;
import tv.phantombot.event.command.CommandEvent;
import tv.phantombot.event.ytplayer.YTPlayerConnectEvent;
import tv.phantombot.event.ytplayer.YTPlayerCurrentIdEvent;
import tv.phantombot.event.ytplayer.YTPlayerDeleteCurrentEvent;
import tv.phantombot.event.ytplayer.YTPlayerDeletePlaylistByIDEvent;
import tv.phantombot.event.ytplayer.YTPlayerDeleteSREvent;
import tv.phantombot.event.ytplayer.YTPlayerDisconnectEvent;
import tv.phantombot.event.ytplayer.YTPlayerLoadPlaylistEvent;
import tv.phantombot.event.ytplayer.YTPlayerRandomizeEvent;
import tv.phantombot.event.ytplayer.YTPlayerRequestCurrentSongEvent;
import tv.phantombot.event.ytplayer.YTPlayerRequestPlaylistEvent;
import tv.phantombot.event.ytplayer.YTPlayerRequestSonglistEvent;
import tv.phantombot.event.ytplayer.YTPlayerSkipSongEvent;
import tv.phantombot.event.ytplayer.YTPlayerSongRequestEvent;
import tv.phantombot.event.ytplayer.YTPlayerStateEvent;
import tv.phantombot.event.ytplayer.YTPlayerStealSongEvent;
import tv.phantombot.event.ytplayer.YTPlayerVolumeEvent;

/**
 *
 * @author gmt2001
 */
public class WsYTHandler implements WsFrameHandler {

    private static final AttributeKey<Boolean> ATTR_IS_PLAYER = AttributeKey.valueOf("isPlayer");
    private static final AttributeKey<Date> ATTR_LAST_PONG = AttributeKey.valueOf("lastPong");
    private static final String[] ALLOWED_DB_QUERY_TABLES = new String[]{"modules", "ytSettings", "yt_playlists_registry"};
    private static final String[] ALLOWED_DB_UPDATE_TABLES = new String[]{"ytSettings"};
    private final WsAuthenticationHandler authHandler;
    private int currentVolume;
    private int currentState = -10;
    private boolean clientConnected;
    private int bufferCounter;
    private final ScheduledExecutorService executor = Executors.newSingleThreadScheduledExecutor();

    public WsYTHandler(String ytAuthRO, String ytAuth) {
        authHandler = new WsSharedRWTokenAuthenticationHandler(ytAuthRO, ytAuth, 10);
        executor.scheduleAtFixedRate(() -> {
            Queue<Channel> channels = WebSocketFrameHandler.getWsSessions("/ws/ytplayer");
            Calendar cal = Calendar.getInstance();
            cal.add(Calendar.SECOND, -12);

            channels.forEach((c) -> {
                if (c.attr(ATTR_LAST_PONG).get().before(cal.getTime())) {
                    c.writeAndFlush(WebSocketFrameHandler.prepareCloseWebSocketFrame(WebSocketCloseStatus.POLICY_VIOLATION));
                    c.close();
                } else {
                    JSONStringer jsonObject = new JSONStringer();

                    jsonObject.object().key("ping").value("ping").endObject();
                    c.writeAndFlush(WebSocketFrameHandler.prepareTextWebSocketResponse(jsonObject.toString()));
                }
            });
        }, 3, 3, TimeUnit.SECONDS);
    }

    @Override
    public WsFrameHandler register() {
        WebSocketFrameHandler.registerWsHandler("/ws/ytplayer", this);
        return this;
    }

    @Override
    public WsAuthenticationHandler getAuthHandler() {
        return authHandler;
    }

    @Override
    public void handleFrame(ChannelHandlerContext ctx, WebSocketFrame frame) {
        ctx.channel().attr(ATTR_IS_PLAYER).setIfAbsent(Boolean.FALSE);
        ctx.channel().attr(ATTR_LAST_PONG).setIfAbsent(new Date());

        ctx.channel().closeFuture().addListener((ChannelFutureListener) (ChannelFuture f) -> {
            if (f.channel().attr(ATTR_IS_PLAYER).get()) {
                clientConnected = false;
                EventBus.instance().postAsync(new YTPlayerDisconnectEvent());
            }
        });

        if (frame instanceof TextWebSocketFrame) {
            if (clientConnected && !ctx.channel().attr(ATTR_IS_PLAYER).get() && !ctx.channel().attr(WsSharedRWTokenAuthenticationHandler.ATTR_IS_READ_ONLY).get()) {
                JSONStringer jso = new JSONStringer();
                WebSocketFrameHandler.sendWsFrame(ctx, frame, WebSocketFrameHandler.prepareTextWebSocketResponse(jso.object().key("secondconnection").value(true).endObject().toString()));
                ctx.close();
                return;
            } else if (!clientConnected && ctx.channel().attr(WsSharedRWTokenAuthenticationHandler.ATTR_IS_READ_ONLY).get()) {
                return;
            } else if (!clientConnected) {
                boolean hasYTKey = !PhantomBot.instance().isYouTubeKeyEmpty();
                JSONStringer jso = new JSONStringer();
                WebSocketFrameHandler.sendWsFrame(ctx, frame, WebSocketFrameHandler.prepareTextWebSocketResponse(jso.object().key("ytkeycheck").value(hasYTKey).endObject().toString()));

                if (!hasYTKey) {
                    com.gmt2001.Console.err.println("A YouTube API key has not been configured. Please review the instructions in the guides at "
                            + "https://phantombot.github.io/PhantomBot/");
                    return;
                }

                clientConnected = true;
                ctx.channel().attr(ATTR_IS_PLAYER).set(Boolean.TRUE);
                EventBus.instance().postAsync(new YTPlayerConnectEvent());
            }

            TextWebSocketFrame tframe = (TextWebSocketFrame) frame;

            JSONObject jso;

            try {
                jso = new JSONObject(tframe.text());
            } catch (JSONException ex) {
                com.gmt2001.Console.err.logStackTrace(ex);
                return;
            }

            if (ctx.channel().attr(ATTR_IS_PLAYER).get()) {
                handleRestrictedCommands(ctx, frame, jso);
            }

            handleUnrestrictedCommands(ctx, frame, jso);
        }
    }

    private void handleRestrictedCommands(ChannelHandlerContext ctx, WebSocketFrame frame, JSONObject jso) {
        String dataString;

        if (jso.has("status")) {
            handleStatus(jso);
        } else if (jso.has("dbupdate")) {
            try {
                handleDBUpdate(ctx, frame, jso.getString("query_id"), jso.getJSONObject("update").getString("table"),
                        jso.getJSONObject("update").getString("key"), jso.getJSONObject("update").getString("value"));
            } catch (JSONException ex) {
                com.gmt2001.Console.err.logStackTrace(ex);
            }
        } else if (jso.has("deletesr")) {
            try {
                dataString = jso.getString("deletesr");
                EventBus.instance().postAsync(new YTPlayerDeleteSREvent(dataString));
            } catch (JSONException ex) {
                com.gmt2001.Console.err.logStackTrace(ex);
            }
        } else if (jso.has("deletepl")) {
            try {
                dataString = jso.getString("deletepl");
                EventBus.instance().postAsync(new YTPlayerDeletePlaylistByIDEvent(dataString));
            } catch (JSONException ex) {
                com.gmt2001.Console.err.logStackTrace(ex);
            }
        } else if (jso.has("command")) {
            handleCommand(jso);
        }
    }

    private void handleStatus(JSONObject jso) {
        JSONObject jsonStatus;
        int dataInt;

        try {
            jsonStatus = jso.getJSONObject("status");
            if (jsonStatus.has("state")) {
                dataInt = jsonStatus.getInt("state");
                /* If the current status is buffering and then we receive an unstarted event, then the player
                    * is stuck. This normally happens with videos that are not allowed to play in the region
                    * and are not returned as such by the API lookup. Skip the song.  But, only skip the song if
                    * we get back the buffering state a few times.
                 */
                if (getPlayerState() == 3 && dataInt == -1) {
                    setCurrentState(dataInt);

                    if (bufferCounter++ == 3) {
                        EventBus.instance().postAsync(new YTPlayerSkipSongEvent());
                        bufferCounter = 0;
                    }
                } else {
                    bufferCounter = 0;
                    int currentStateTmp = getPlayerState();
                    setCurrentState(dataInt == 200 ? currentStateTmp : dataInt);
                    YTPlayerState playerState = YTPlayerState.getStateFromId(dataInt);
                    EventBus.instance().postAsync(new YTPlayerStateEvent(playerState));
                }
            } else if (jsonStatus.has("ready")) {
                setCurrentState(-2);
                EventBus.instance().postAsync(new YTPlayerStateEvent(YTPlayerState.NEW));
            } else if (jsonStatus.has("readypause")) {
                setCurrentState(-3);
                EventBus.instance().postAsync(new YTPlayerStateEvent(YTPlayerState.NEWPAUSE));
            } else if (jsonStatus.has("currentid")) {
                String dataString = jsonStatus.getString("currentid");
                EventBus.instance().postAsync(new YTPlayerCurrentIdEvent(dataString));
            } else if (jsonStatus.has("volume")) {
                dataInt = jsonStatus.getInt("volume");
                setCurrentVolume(dataInt);
                EventBus.instance().postAsync(new YTPlayerVolumeEvent(dataInt));
            } else if (jsonStatus.has("errorcode")) {
                dataInt = jsonStatus.getInt("errorcode");
                com.gmt2001.Console.err.println("Skipping song, YouTube has thrown an error: " + dataInt);
                EventBus.instance().postAsync(new YTPlayerSkipSongEvent());
            }
        } catch (JSONException ex) {
            com.gmt2001.Console.err.logStackTrace(ex);
        }
    }

    private void handleCommand(JSONObject jso) {
        try {
            switch (jso.getString("command")) {
                case "togglerandom":
                    EventBus.instance().postAsync(new YTPlayerRandomizeEvent());
                    break;
                case "skipsong":
                    EventBus.instance().postAsync(new YTPlayerSkipSongEvent());
                    break;
                case "stealsong":
                    if (jso.has("youTubeID")) {
                        EventBus.instance().postAsync(new YTPlayerStealSongEvent(jso.getString("youTubeID"), jso.getString("requester")));
                    } else {
                        EventBus.instance().postAsync(new YTPlayerStealSongEvent());
                    }
                    break;
                case "songrequest":
                    if (jso.has("search")) {
                        String dataString = jso.getString("search");
                        EventBus.instance().postAsync(new YTPlayerSongRequestEvent(dataString));
                    }
                    break;
                case "loadpl":
                    EventBus.instance().postAsync(new YTPlayerLoadPlaylistEvent(jso.getString("playlist")));
                    break;
                case "deletecurrent":
                    EventBus.instance().postAsync(new YTPlayerDeleteCurrentEvent());
                    break;
                default:
                    break;
            }
        } catch (JSONException ex) {
            com.gmt2001.Console.err.logStackTrace(ex);
        }
    }

    private void handleUnrestrictedCommands(ChannelHandlerContext ctx, WebSocketFrame frame, JSONObject jso) {
        if (jso.has("query")) {
            try {
                switch (jso.getString("query")) {
                    case "songlist":
                        EventBus.instance().postAsync(new YTPlayerRequestSonglistEvent());
                        break;
                    case "playlist":
                        EventBus.instance().postAsync(new YTPlayerRequestPlaylistEvent());
                        break;
                    case "currentsong":
                        EventBus.instance().postAsync(new YTPlayerRequestCurrentSongEvent());
                        break;
                    default:
                        break;
                }
            } catch (JSONException ex) {
                com.gmt2001.Console.err.logStackTrace(ex);
            }
        } else if (jso.has("dbquery")) {
            try {
                handleDBQuery(ctx, frame, jso.getString("query_id"), jso.getString("table"));
            } catch (JSONException ex) {
                com.gmt2001.Console.err.logStackTrace(ex);
            }
        } else if (jso.has("pong")) {
            ctx.channel().attr(ATTR_LAST_PONG).set(new Date());
        }
    }

    public void handleDBQuery(ChannelHandlerContext ctx, WebSocketFrame frame, String id, String table) throws JSONException {
        if (!Arrays.stream(ALLOWED_DB_QUERY_TABLES).anyMatch(t -> t.equals(table))) {
            return;
        }

        JSONStringer jsonObject = new JSONStringer();

        jsonObject.object().key("query_id").value(id);

        String[] dbKeys = PhantomBot.instance().getDataStore().GetKeyList(table, "");
        for (String dbKey : dbKeys) {
            String value = PhantomBot.instance().getDataStore().GetString(table, "", dbKey);
            jsonObject.key(dbKey).value(value);
        }

        jsonObject.endObject();
        WebSocketFrameHandler.sendWsFrame(ctx, frame, WebSocketFrameHandler.prepareTextWebSocketResponse(jsonObject.toString()));
    }

    public void handleDBUpdate(ChannelHandlerContext ctx, WebSocketFrame frame, String id, String table, String key, String value) throws JSONException {
        if (!Arrays.stream(ALLOWED_DB_UPDATE_TABLES).anyMatch(t -> t.equals(table))) {
            return;
        }

        JSONStringer jsonObject = new JSONStringer();
        PhantomBot.instance().getDataStore().set(table, key, value);

        EventBus.instance().postAsync(new CommandEvent(PhantomBot.instance().getBotName(), "reloadyt", ""));
        jsonObject.object().key("query_id").value(id).endObject();
        WebSocketFrameHandler.sendWsFrame(ctx, frame, WebSocketFrameHandler.prepareTextWebSocketResponse(jsonObject.toString()));
    }

    private synchronized void setCurrentVolume(int currentVolume) {
        this.currentVolume = currentVolume;
    }

    private synchronized void setCurrentState(int currentState) {
        this.currentState = currentState;
    }

    public void play(String youtubeID, String songTitle, String duration, String requester) throws JSONException {
        JSONStringer jso = new JSONStringer();

        jso.object();
        jso.key("command");
        jso.object();
        jso.key("play").value(youtubeID);
        jso.key("duration").value(duration);
        jso.key("title").value(songTitle);
        jso.key("requester").value(requester);
        jso.endObject();
        jso.endObject();
        sendJSONToAll(jso.toString());
    }

    public void pause() throws JSONException {
        JSONStringer jso = new JSONStringer();
        sendJSONToAll(jso.object().key("command").value("pause").endObject().toString());
    }

    public void currentId() throws JSONException {
        JSONStringer jso = new JSONStringer();
        sendJSONToAll(jso.object().key("command").value("querysong").toString());
    }

    public void setVolume(int volume) throws JSONException {
        JSONStringer jso = new JSONStringer();
        if (!(volume > 100 || volume < 0)) {
            setCurrentVolume(volume);
            sendJSONToAll(jso.object().key("command").object().key("setvolume").value(volume).endObject().endObject().toString());
        }
    }

    public synchronized int getVolume() {
        return currentVolume;
    }

    public synchronized int getPlayerState() {
        return currentState;
    }

    public void sendJSONToAll(String jsonString) {
        WebSocketFrameHandler.broadcastWsFrame("/ws/ytplayer", WebSocketFrameHandler.prepareTextWebSocketResponse(jsonString));
    }
}
