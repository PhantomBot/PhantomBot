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

public class PubSubViewCountEvent extends PubSubVideoPlaybackEvent {

    private final int viewers;

    /**
     * Constructor.
     *
     * @param channelId
     * @param serverTime
     * @param viewers
     */
    public PubSubViewCountEvent(int channelId, float serverTime, int viewers) {
        super(channelId, serverTime);
        this.viewers = viewers;
    }

    /**
     * Method that returns the number of viewers in the channel at {@link getServerTime}.
     *
     * @return viewers
     */
    public int getViewers() {
        return this.viewers;
    }
}
