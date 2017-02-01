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
package me.mast3rplan.phantombot.event.twitter;

import me.mast3rplan.phantombot.event.Event;
import me.mast3rplan.phantombot.twitchwsirc.Channel;

public class TwitterEvent extends Event {

    private final String tweet;
    private final Channel channel;
    private final String mention;

    public TwitterEvent(String tweet) {
        this.tweet = tweet;
        this.channel = null;
        this.mention = null;
    }

    public TwitterEvent(String tweet, Channel channel) {
        this.tweet = tweet;
        this.channel = channel;
        this.mention = null;
    }

    public TwitterEvent(String tweet, Channel channel, String mention) {
        this.tweet = tweet;
        this.channel = channel;
        this.mention = mention;
    }

    public String getTweet() {
        return tweet;
    }

    public String getMentionUser() {
        return mention;
    }

    public Channel getChannel() {
        return channel;
    }
}
