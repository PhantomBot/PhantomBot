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

/**
 * The result of creating a post or linking an account on a {@link SocialPlatform}
 *
 * @param success {@code true} if it worked
 * @param url the web address of the new post, or of the profile after linking; {@code null} on failure
 * @param error on failure, the reason: {@link #NOT_LINKED}, {@link #EMPTY}, {@link #TOO_LONG} or {@link #FAILED}
 * @param detail on failure, more information, such as the length of a post that is too long ({@code 320/300}) or the message
 * from the platform
 *
 * @author mcawful
 */
public record SocialPostResult(boolean success, String url, String error, String detail) {

    /**
     * No account is linked, or signing in failed
     */
    public static final String NOT_LINKED = "notlinked";
    /**
     * The text is empty
     */
    public static final String EMPTY = "empty";
    /**
     * The text is too long; the detail is {@code length/maximum}, followed by {@code bytes} when a byte limit was exceeded
     */
    public static final String TOO_LONG = "toolong";
    /**
     * The platform refused the request or could not be reached
     */
    public static final String FAILED = "failed";

    /**
     * Creates a successful result
     *
     * @param url the web address of the post or profile
     * @return the result
     */
    public static SocialPostResult ok(String url) {
        return new SocialPostResult(true, url, null, null);
    }

    /**
     * Creates a failed result
     *
     * @param error the reason
     * @param detail more information; may be {@code null}
     * @return the result
     */
    public static SocialPostResult failed(String error, String detail) {
        return new SocialPostResult(false, null, error, detail);
    }
}
