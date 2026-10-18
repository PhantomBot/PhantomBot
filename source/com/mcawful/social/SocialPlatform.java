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

import java.util.List;

/**
 * A social media platform the bot can post to and read activity from
 * <p>
 * A platform is registered in {@link SocialPlatformRegistry}. {@link SocialPoller} calls {@link #fetch(SocialPollType, String)}
 * for each of its {@link #getPollTypes() poll types} and fires the social events, and {@code ./core/social.js} provides the
 * chat command, automatic posts and repost rewards for every platform. The settings of a platform are kept in the database
 * table named after its {@link #getId() id}.
 * <p>
 * Methods that send requests block, so scripts should call them from a timer rather than from an event hook
 *
 * @author mcawful
 */
public interface SocialPlatform {

    /**
     * Returns the id of the platform, used as its database table, its lang key prefix and its registry key
     *
     * @return the lowercase id, such as {@code bluesky}
     */
    String getId();

    /**
     * Returns the name of the platform as shown to users
     *
     * @return the display name, such as {@code Bluesky}
     */
    String getDisplayName();

    /**
     * Returns the script of the chat module for this platform
     *
     * @return the module script path, such as {@code ./handlers/blueskyHandler.js}
     */
    String getModuleScript();

    /**
     * Returns the script of the Discord module for this platform
     *
     * @return the module script path, such as {@code ./discord/handlers/blueskyHandler.js}
     */
    String getDiscordModuleScript();

    /**
     * Indicates if credentials for the platform are present
     *
     * @return {@code true} if an account is linked
     */
    boolean isConfigured();

    /**
     * Returns the name of the linked account
     *
     * @return the account name, such as a handle; an empty string if no account is linked
     */
    String getAccountName();

    /**
     * Returns the web address of the linked account's profile
     *
     * @return the profile URL; an empty string if no account is linked
     */
    String getProfileUrl();

    /**
     * Returns the kinds of activity the platform can be polled for
     *
     * @return the poll types
     */
    List<SocialPollType> getPollTypes();

    /**
     * Fetches the activity of one poll type that is newer than the watermark
     *
     * @param type the poll type
     * @param watermark the watermark returned by the previous fetch; {@code null} on the first fetch, which only needs to
     * return a watermark
     * @return the new items, newest first, and the new watermark
     * @throws Exception if the activity could not be fetched
     */
    SocialFetchResult fetch(SocialPollType type, String watermark) throws Exception;

    /**
     * Creates a post on the linked account
     *
     * @param text the text of the post
     * @param card a link card to attach; {@code null} for none
     * @param truncate if {@code true}, text that is too long is shortened; otherwise the post is refused
     * @return the result
     */
    SocialPostResult createPost(String text, SocialLinkCard card, boolean truncate);

    /**
     * Looks up the permanent id of an account
     *
     * @param accountName the account name, such as a handle
     * @return the account id; {@code null} if the account was not found
     */
    String resolveAccountId(String accountName);

    /**
     * Checks the credentials and, if they work, saves them to the bot properties
     *
     * @param account the account name
     * @param secret the password or token
     * @param service the address of the service to sign in to; empty for the default
     * @return the result; on success, {@link SocialPostResult#url()} is the profile URL
     */
    SocialPostResult link(String account, String secret, String service);

    /**
     * Removes the saved credentials and ends the session
     */
    void unlink();

    /**
     * Releases resources on shutdown
     */
    void shutdown();
}
