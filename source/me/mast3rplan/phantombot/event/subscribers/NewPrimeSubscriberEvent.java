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

public class NewPrimeSubscriberEvent extends SubscriberEvent {

	private final String subscriber;
    private final Channel channel;
    private final Session session;

	public NewPrimeSubscriberEvent(String subscriber) {
        this.subscriber = subscriber;
        this.channel = null;
        this.session = null;
    }

    public NewPrimeSubscriberEvent(Channel channel, String subscriber) {
        this.subscriber = subscriber;
        this.channel = channel;
        this.session = null;
    }

    public NewPrimeSubscriberEvent(Session session, Channel channel, String subscriber) {
        super(channel, session);
        this.subscriber = subscriber;
        this.channel = channel;
        this.session = session;
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
}
