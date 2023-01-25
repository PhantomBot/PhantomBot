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
package tv.phantombot.event.twitter;

import tv.phantombot.event.Event;

public class TwitterEvent extends Event {

    private final String tweet;
    private final String mention;
    private final String text;
    private final String url;
    private final boolean isRt;

    /**
     * Class constructor.
     *
     * @param tweet
     */
    public TwitterEvent(String tweet) {
        super();
        this.tweet = tweet;
        this.mention = null;
        this.text = null;
        this.url = null;
        this.isRt = false;
    }

    /**
     * Class constructor.
     *
     * @param tweet
     * @param mention
     */
    public TwitterEvent(String tweet, String mention) {
        super();
        this.tweet = tweet;
        this.mention = mention;
        this.text = null;
        this.url = null;
        this.isRt = false;
    }

    public TwitterEvent(String tweet, String text, String url, boolean isRt) {
        super();
        this.tweet = tweet;
        this.mention = null;
        this.text = text;
        this.url = url;
        this.isRt = isRt;
    }

    public TwitterEvent(String tweet, String text, String url, boolean isRt, String mention) {
        super();
        this.tweet = tweet;
        this.mention = mention;
        this.text = text;
        this.url = url;
        this.isRt = isRt;
    }

    /**
     * Method that returns the Tweet.
     *
     * @return tweet
     */
    public String getTweet() {
        return this.tweet;
    }

    /**
     * Method that returns the mention user.
     *
     * @return mention
     */
    public String getMentionUser() {
        return this.mention;
    }

    public String text() {
        return this.text;
    }

    public String url() {
        return this.url;
    }

    public boolean isRt() {
        return this.isRt;
    }
}
