/*
 * Copyright (C) 2016-2017 phantombot.tv
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

package tv.phantombot.event.twitch.subscriber;

import tv.phantombot.event.twitch.TwitchEvent;
import tv.phantombot.twitchwsirc.Channel;

public class SubscriberEvent extends TwitchEvent {

	private final String subscriber;
    private final String plan;

	public SubscriberEvent(String subscriber) {
        this.subscriber = subscriber;
        this.plan = null;
    }

    public SubscriberEvent(String subscriber, String plan) {
        this.subscriber = subscriber;
        this.plan = plan;
    }

    public SubscriberEvent(Channel channel, String subscriber) {
        super(channel);

        this.subscriber = subscriber;
        this.plan = null;
    }

    public SubscriberEvent(Channel channel, String subscriber, String plan) {
        super(channel);

        this.subscriber = subscriber;
        this.plan = plan;
    }

    public String getSubscriber() {
        return this.subscriber;
    }

    public String getPlan() {
        return this.plan;
    }
}
