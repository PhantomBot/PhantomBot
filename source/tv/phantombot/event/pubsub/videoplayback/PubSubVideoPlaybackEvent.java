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
package tv.phantombot.event.pubsub.videoplayback;

import tv.phantombot.event.pubsub.PubSubEvent;

public abstract class PubSubVideoPlaybackEvent extends PubSubEvent {

    private final int channelId;
    private final float serverTime;

    /**
     * Abstract constructor.
     *
     * @param channelId
     * @param serverTime
     */
    protected PubSubVideoPlaybackEvent(int channelId, float serverTime) {
        this.channelId = channelId;
        this.serverTime = serverTime;
    }

    /**
     * Method that returns the channel ID that the event was triggered for.
     *
     * @return channelId
     */
    public int getChannelId() {
        return this.channelId;
    }

    /**
     * Method that returns the timestamp of the event actually happening
     *
     * @return serverTime
     */
    public float getServerTime() {
        return this.serverTime;
    }
}
