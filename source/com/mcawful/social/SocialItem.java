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
package com.mcawful.social;

import org.json.JSONObject;

/**
 * One piece of activity on a {@link SocialPlatform}
 *
 * @param type the kind of activity: {@code post}, {@code repost}, {@code mention}, {@code reply} or {@code quote}
 * @param id the platform's id of the item
 * @param authorId the permanent id of the account that made it
 * @param authorName the account name of its author, such as a handle
 * @param authorDisplayName the display name of its author; may be empty
 * @param text the text of the item; for a repost, the text of the post that was reposted
 * @param url the web address of the item; for a repost, the post that was reposted
 * @param createdAt when the item was seen by the platform, as an ISO-8601 instant
 *
 * @author mcawful
 */
public record SocialItem(String type, String id, String authorId, String authorName, String authorDisplayName,
        String text, String url, String createdAt) {

    /**
     * Returns the item as JSON, as stored in the {@code last_<poll type>} setting
     *
     * @return the JSON text
     */
    public String toJSON() {
        return new JSONObject().put("type", this.type).put("id", this.id).put("authorId", this.authorId)
                .put("authorName", this.authorName).put("authorDisplayName", this.authorDisplayName)
                .put("text", this.text).put("url", this.url).put("createdAt", this.createdAt).toString();
    }
}
