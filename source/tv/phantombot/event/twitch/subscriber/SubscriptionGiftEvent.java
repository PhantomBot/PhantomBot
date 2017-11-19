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

public class SubscriptionGiftEvent extends TwitchEvent {

	private final String username;
    private final String recipient;
    private final String months;
    private final String plan;

    public SubscriptionGiftEvent(String username, String recipient, String plan) {
        this.username = username;
        this.recipient = recipient;
        this.months = null;
        this.plan = plan;
    }

	public SubscriptionGiftEvent(String username, String recipient, String months, String plan) {
        this.username = username;
        this.recipient = recipient;
        this.months = months;
        this.plan = plan;
    }

    public SubscriptionGiftEvent(Channel channel, String username, String recipient, String months, String plan) {
        super(channel);

        this.username = username;
        this.recipient = recipient;
        this.months = months;
        this.plan = plan;
    }

    public String getUsername() {
        return this.username;
    }

    public String getRecipient() {
        return this.recipient;
    }

    public String getMonths() {
        return this.months;
    }

    public String getPlan() {
        return this.plan;
    }
}
