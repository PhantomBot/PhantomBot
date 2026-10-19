/*
 * Copyright (C) 2016-2026 phantombot.github.io/PhantomBot
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
package com.mcawful.social;

import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import com.gmt2001.util.concurrent.ExecutorService;
import com.mcawful.social.bluesky.BlueskyPlatform;

import net.engio.mbassy.listener.Handler;
import tv.phantombot.PhantomBot;
import tv.phantombot.event.EventBus;
import tv.phantombot.event.Listener;
import tv.phantombot.event.webpanel.websocket.WebPanelSocketUpdateEvent;

/**
 * The social media platforms known to the bot
 * <p>
 * Exposed to scripts as {@code $.socialPlatforms}. Also answers the panel's requests to link and unlink an account, sent with
 * {@code socket.wsEvent(id, 'SocialPlatforms.java', null, ['link', platformId, account, secret, service], callback, true)} or
 * {@code ['unlink', platformId]}. Only the panel's config users may send them (see {@code PanelUserHandler}).
 *
 * @author mcawful
 */
public final class SocialPlatformRegistry implements Listener {

    /**
     * The script name the panel sends link and unlink requests to
     */
    public static final String PANEL_SCRIPT = "SocialPlatforms.java";
    private static SocialPlatformRegistry instance;
    private final Map<String, SocialPlatform> platforms = new LinkedHashMap<>();

    /**
     * Returns the instance, creating it and its platforms on first use
     *
     * @return the instance
     */
    public static synchronized SocialPlatformRegistry instance() {
        if (instance == null) {
            instance = new SocialPlatformRegistry();
        }

        return instance;
    }

    private SocialPlatformRegistry() {
        this.register(BlueskyPlatform.instance());
        ExecutorService.execute(() -> EventBus.instance().register(this));
    }

    private void register(SocialPlatform platform) {
        this.platforms.put(platform.getId(), platform);
    }

    /**
     * Returns a platform by id
     *
     * @param id the platform id, such as {@code bluesky}
     * @return the platform; {@code null} if there is none with that id
     */
    public SocialPlatform get(String id) {
        return id == null ? null : this.platforms.get(id.toLowerCase());
    }

    /**
     * Returns every platform
     *
     * @return the platforms
     */
    public List<SocialPlatform> getPlatforms() {
        return List.copyOf(this.platforms.values());
    }

    /**
     * Handles the panel's link and unlink requests
     *
     * @param event the event
     */
    @Handler
    public void onWebPanelSocketUpdateEvent(WebPanelSocketUpdateEvent event) {
        if (!event.getScript().equalsIgnoreCase(PANEL_SCRIPT)) {
            return;
        }

        String[] args = event.getArgs();
        SocialPlatform platform = args.length > 1 ? this.get(args[1]) : null;
        Map<String, Object> reply = new HashMap<>();

        if (platform == null) {
            reply.put("success", false);
            reply.put("error", SocialPostResult.FAILED);
        } else if (args[0].equalsIgnoreCase("link") && args.length > 3) {
            SocialPostResult result = platform.link(args[2], args[3], args.length > 4 ? args[4] : "");
            reply.put("success", result.success());
            reply.put("error", result.error());
            reply.put("detail", result.detail());
            reply.put("account", platform.getAccountName());
            reply.put("url", result.url());
        } else if (args[0].equalsIgnoreCase("unlink")) {
            platform.unlink();
            reply.put("success", true);
        } else {
            reply.put("success", false);
            reply.put("error", SocialPostResult.FAILED);
        }

        PhantomBot.instance().panelhandler().sendObject(event.getId(), reply);
    }

    /**
     * Releases the resources of every platform
     */
    public void shutdown() {
        this.platforms.values().forEach(SocialPlatform::shutdown);
    }
}
