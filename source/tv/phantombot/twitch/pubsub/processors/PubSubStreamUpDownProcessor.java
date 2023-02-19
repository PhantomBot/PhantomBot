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
package tv.phantombot.twitch.pubsub.processors;

import java.time.Duration;
import org.json.JSONObject;
import reactor.core.publisher.Mono;
import reactor.core.publisher.SignalType;
import tv.phantombot.PhantomBot;
import tv.phantombot.cache.TwitchCache;
import tv.phantombot.event.EventBus;
import tv.phantombot.event.pubsub.videoplayback.PubSubStreamDownEvent;
import tv.phantombot.event.pubsub.videoplayback.PubSubStreamUpEvent;
import tv.phantombot.event.pubsub.videoplayback.PubSubViewCountEvent;

/**
 * A processor for stream up/down/viewer events from PubSub
 *
 * @author gmt2001
 */
public class PubSubStreamUpDownProcessor extends AbstractPubSubProcessor {

    private final int channelId;
    private final boolean isCaster;

    public PubSubStreamUpDownProcessor() {
        this(PhantomBot.instance().getPubSub().channelId());
    }

    public PubSubStreamUpDownProcessor(int channelId) {
        super("video-playback-by-id." + channelId);
        this.channelId = channelId;
        this.isCaster = this.channelId == PhantomBot.instance().getPubSub().channelId();
    }

    @Override
    protected void onOpen() {
        super.onOpen();
        com.gmt2001.Console.out.println("Requesting Twitch Stream Up/Down Data Feed for " + this.channelId);
    }

    @Override
    protected void onSubscribeSuccess() {
        com.gmt2001.Console.out.println("Connected to Twitch Stream Up/Down Data Feed for " + this.channelId);
        Mono.delay(Duration.ofSeconds(10)).doFinally((SignalType s) -> {
            TwitchCache.instance().syncStreamStatus(true);
        }).subscribe();
    }

    @Override
    protected void onSubscribeFailure(String error) {
        com.gmt2001.Console.out.println("PubSub Rejected Twitch Stream Up/Down Data Feed for " + this.channelId + " with Error: " + error);
    }

    @Override
    protected void onEvent(JSONObject body) {
        float srvtime = body.optFloat("server_time");
        switch (body.getString("type")) {
            case "stream-up":
                if (this.isCaster) {
                    TwitchCache.instance().syncOnline();
                }
                EventBus.instance().postAsync(new PubSubStreamUpEvent(this.channelId, srvtime, body.getInt("play_delay")));
                break;
            case "stream-down":
                if (this.isCaster) {
                    TwitchCache.instance().goOffline(true);
                }
                EventBus.instance().postAsync(new PubSubStreamDownEvent(this.channelId, srvtime));
                break;
            case "viewcount":
                if (this.isCaster) {
                    TwitchCache.instance().updateViewerCount(body.getInt("viewers"));
                }
                EventBus.instance().postAsync(new PubSubViewCountEvent(this.channelId, srvtime, body.getInt("viewers")));
                break;
        }
    }
}
