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
package com.gmt2001;

import com.gmt2001.httpwsserver.WebSocketFrameHandler;
import java.io.IOException;
import java.util.concurrent.Executors;
import net.engio.mbassy.listener.Handler;
import org.json.JSONStringer;
import tv.phantombot.CaselessProperties;
import tv.phantombot.event.EventBus;
import tv.phantombot.event.Listener;
import tv.phantombot.event.webpanel.websocket.WebPanelSocketUpdateEvent;

/**
 * Restarts the bot, if configured appropriately
 *
 * @author gmt2001
 */
public final class RestartRunner implements Listener {

    private static final RestartRunner INSTANCE = new RestartRunner();
    private boolean registered = false;

    /**
     * Constructor
     */
    private RestartRunner() {
    }

    /**
     * Gets an instance
     *
     * @return
     */
    public static RestartRunner instance() {
        return INSTANCE;
    }

    public void register() {
        if (this.registered) {
            return;
        }

        EventBus.instance().register(this);
        this.registered = true;
    }

    /**
     * Handles WebSocketUpdateEvent
     *
     * @param event
     */
    @Handler
    public void onWebPanelSocketUpdateEvent(WebPanelSocketUpdateEvent event) {
        if (event.getScript().equals("RestartRunner")) {
            if (event.getId().equals("restart-bot-check")) {
                JSONStringer jsonObject = new JSONStringer();
                jsonObject.object().key("query_id").value("restart-bot-result").key("results").object()
                        .key("success").value(this.canRestart()).key("code").value(-3).endObject().endObject();
                WebSocketFrameHandler.broadcastWsFrame("/ws/panel", WebSocketFrameHandler.prepareTextWebSocketResponse(jsonObject.toString()));
            } else if (event.getId().equals("restart-bot")) {
                this.restartBot();
            }
        }
    }

    /**
     * Returns true if a command is present. Does not indicate if OS permissions will allow it to succeed
     *
     * @return
     */
    public boolean canRestart() {
        return CaselessProperties.instance().containsKey("restartcmd")
                && !CaselessProperties.instance().getProperty("restartcmd").isBlank();
    }

    /**
     * Attempts to restart the bot using the preferred OS Interpreter. The result is broadcast to all panel WebSockets
     *
     * The broadcast of the 0 exit code may not always work depending on timings of the bot shutdown and the method used to initiate the shutdown
     */
    public void restartBot() {
        if (this.canRestart()) {
            String cmd;
            String osname = System.getProperty("os.name").toLowerCase();
            if (osname.contains("win")) {
                cmd = "cmd.exe /c %s";
            } else if (osname.contains("mac") || osname.contains("bsd")) {
                cmd = "/bin/sh -c %s";
            } else if (osname.contains("nix") || osname.contains("nux") || osname.contains("aix")) {
                cmd = "/bin/bash -c %s";
            } else {
                JSONStringer jsonObject = new JSONStringer();
                jsonObject.object().key("query_id").value("restart-bot-result").key("results").object()
                        .key("success").value(false).key("code").value(-1).endObject().endObject();
                WebSocketFrameHandler.broadcastWsFrame("/ws/panel", WebSocketFrameHandler.prepareTextWebSocketResponse(jsonObject.toString()));
                return;
            }

            Executors.newSingleThreadExecutor().execute(() -> {
                try {
                    int exitCode = Runtime.getRuntime().exec(String.format(cmd, CaselessProperties.instance().getProperty("restartcmd"))).waitFor();
                    if (exitCode == 0 || exitCode == 143) {
                        JSONStringer jsonObject = new JSONStringer();
                        jsonObject.object().key("query_id").value("restart-bot-result").key("results").object()
                                .key("success").value(true).key("code").value(0).endObject().endObject();
                        WebSocketFrameHandler.broadcastWsFrame("/ws/panel", WebSocketFrameHandler.prepareTextWebSocketResponse(jsonObject.toString()));
                    } else {
                        JSONStringer jsonObject = new JSONStringer();
                        jsonObject.object().key("query_id").value("restart-bot-result").key("results").object()
                                .key("success").value(false).key("code").value(exitCode).endObject().endObject();
                        WebSocketFrameHandler.broadcastWsFrame("/ws/panel", WebSocketFrameHandler.prepareTextWebSocketResponse(jsonObject.toString()));
                    }
                } catch (IOException | InterruptedException ex) {
                    com.gmt2001.Console.err.printStackTrace(ex);
                    JSONStringer jsonObject = new JSONStringer();
                    jsonObject.object().key("query_id").value("restart-bot-result").key("results").object()
                            .key("success").value(false).key("code").value(-2).endObject().endObject();
                    WebSocketFrameHandler.broadcastWsFrame("/ws/panel", WebSocketFrameHandler.prepareTextWebSocketResponse(jsonObject.toString()));
                }
            });
        }
    }
}
