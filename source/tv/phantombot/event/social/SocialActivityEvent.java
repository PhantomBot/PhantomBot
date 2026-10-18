/*
 * Copyright (C) 2016-2026 phantombot.github.io/PhantomBot
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
package tv.phantombot.event.social;

import com.mcawful.social.SocialItem;

/**
 * New activity on a social media platform that is to be announced, such as a mention or a repost
 *
 * @author mcawful
 */
public class SocialActivityEvent extends SocialEvent {

    private final String pollType;
    private final SocialItem item;

    /**
     * Constructor
     *
     * @param platform the id of the platform, such as {@code bluesky}
     * @param pollType the id of the poll type that found the item, such as {@code mentions}
     * @param item the activity
     */
    public SocialActivityEvent(String platform, String pollType, SocialItem item) {
        super(platform);
        this.pollType = pollType;
        this.item = item;
    }

    /**
     * Returns the poll type that found the item; chat and Discord each choose which poll types they announce
     *
     * @return the poll type id, such as {@code mentions}
     */
    public String getPollType() {
        return this.pollType;
    }

    /**
     * Returns the kind of activity
     *
     * @return {@code post}, {@code repost}, {@code mention}, {@code reply} or {@code quote}
     */
    public String getType() {
        return this.item.type();
    }

    /**
     * Returns the platform's id of the item
     *
     * @return the id
     */
    public String getId() {
        return this.item.id();
    }

    /**
     * Returns the permanent id of the account that made the item
     *
     * @return the account id
     */
    public String getAuthorId() {
        return this.item.authorId();
    }

    /**
     * Returns the account name of the author, such as a handle
     *
     * @return the account name
     */
    public String getAuthorName() {
        return this.item.authorName();
    }

    /**
     * Returns the display name of the author
     *
     * @return the display name; may be empty
     */
    public String getAuthorDisplayName() {
        return this.item.authorDisplayName();
    }

    /**
     * Returns the text of the item; for a repost, the text of the post that was reposted
     *
     * @return the text
     */
    public String getText() {
        return this.item.text();
    }

    /**
     * Returns the web address of the item; for a repost, the post that was reposted
     *
     * @return the URL
     */
    public String getUrl() {
        return this.item.url();
    }
}
