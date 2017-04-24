/*
 * Copyright (C) 2017 phantombot.tv
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

package me.mast3rplan.phantombot.event.subscribers;

import me.mast3rplan.phantombot.twitchwsirc.Channel;
import me.mast3rplan.phantombot.twitchwsirc.Session;

public class NewSubscriberEvent extends SubscriberEvent {

	private final String subscriber;
    private final Channel channel;
    private final Session session;
    private final String plan;

	public NewSubscriberEvent(String subscriber) {
        this.subscriber = subscriber;
        this.channel = null;
        this.session = null;
        this.plan = null;
    }

    public NewSubscriberEvent(Channel channel, String subscriber) {
        this.subscriber = subscriber;
        this.channel = channel;
        this.session = null;
        this.plan = null;
    }

    public NewSubscriberEvent(Session session, Channel channel, String subscriber) {
        super(channel, session);
        this.subscriber = subscriber;
        this.channel = channel;
        this.session = session;
        this.plan = null;
    }

    public NewSubscriberEvent(Session session, Channel channel, String subscriber, String plan) {
        super(channel, session);
        this.subscriber = subscriber;
        this.channel = channel;
        this.session = session;
        this.plan = plan;
    }

    public String getSubscriber() {
        return this.subscriber.toLowerCase();
    }

    public Channel getChannel() {
        return this.channel;
    }

    public Session getSession() {
        return this.session;
    }

    public String getPlan() {
        return this.plan;
    }
}
