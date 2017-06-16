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

package tv.phantombot.event.subscribers;

import tv.phantombot.twitchwsirc.Channel;
import tv.phantombot.twitchwsirc.Session;

public class NewReSubscriberEvent extends SubscriberEvent {

	private final String resubscriber;
    private final String months;
    private final Channel channel;
    private final Session session;

	public NewReSubscriberEvent(String resubscriber, String months) {
        this.resubscriber = resubscriber;
        this.months = months;
        this.channel = null;
        this.session = null;
    }

    public NewReSubscriberEvent(Channel channel, String resubscriber, String months) {
        this.resubscriber = resubscriber;
        this.months = months;
        this.channel = channel;
        this.session = null;
    }

    public NewReSubscriberEvent(Session session, Channel channel, String resubscriber, String months) {
        super(channel, session);
        this.resubscriber = resubscriber;
        this.months = months;
        this.channel = channel;
        this.session = session;
    }

    public String getReSubscriber() {
        return this.resubscriber.toLowerCase();
    }

    public String getMonths() {
        return this.months;
    }

    public Channel getChannel() {
        return this.channel;
    }

    public Session getSession() {
        return this.session;
    }
}
