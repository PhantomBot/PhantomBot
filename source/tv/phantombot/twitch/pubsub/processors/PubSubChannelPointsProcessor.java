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

import org.json.JSONObject;
import tv.phantombot.PhantomBot;
import tv.phantombot.event.EventBus;
import tv.phantombot.event.pubsub.channelpoints.PubSubChannelPointsEvent;
import tv.phantombot.twitch.api.TwitchValidate;

/**
 * A processor for channel points events from PubSub
 *
 * @author gmt2001
 */
public class PubSubChannelPointsProcessor extends AbstractPubSubProcessor {

    private final int channelId;

    public PubSubChannelPointsProcessor() {
        this(PhantomBot.instance().getPubSub().channelId());
    }

    private PubSubChannelPointsProcessor(int channelId) {
        super("channel-points-channel-v1." + channelId);
        this.channelId = channelId;
    }

    @Override
    protected void onOpen() {
        if (TwitchValidate.instance().hasAPIScope("channel:read:redemptions")) {
            super.onOpen();
            com.gmt2001.Console.out.println("Requesting Twitch Channel Points Data Feed for " + this.channelId);
        }
    }

    @Override
    protected void onSubscribeSuccess() {
        com.gmt2001.Console.out.println("Connected to Twitch Channel Points Data Feed for " + this.channelId);
    }

    @Override
    protected void onSubscribeFailure(String error) {
        com.gmt2001.Console.out.println("PubSub Rejected Twitch Channel Points Data Feed for " + this.channelId + " with Error: " + error);
    }

    @Override
    protected void onEvent(JSONObject body) {
        JSONObject data = body.getJSONObject("data").getJSONObject("redemption");
        com.gmt2001.Console.out.println("Channel points redeemed by " + data.getJSONObject("user").getString("login") + " for reward "
                + data.getJSONObject("reward").getString("title"));

        EventBus.instance().postAsync(new PubSubChannelPointsEvent(
                data.getString("id"), data.getJSONObject("reward").getString("id"), data.getJSONObject("user").getString("id"),
                data.getJSONObject("user").getString("login"), data.getJSONObject("user").optString("display_name",
                data.getJSONObject("user").getString("login")), data.getJSONObject("reward").getString("title"),
                data.getJSONObject("reward").getInt("cost"), data.getJSONObject("reward").optString("prompt"), data.optString("user_input"),
                data.optString("status")
        ));
    }
}
