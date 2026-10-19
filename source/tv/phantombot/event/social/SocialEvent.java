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

import tv.phantombot.event.Event;

/**
 * An event from a social media platform
 *
 * @author mcawful
 */
public abstract class SocialEvent extends Event {

    private final String platform;

    /**
     * Constructor
     *
     * @param platform the id of the platform, such as {@code bluesky}
     */
    protected SocialEvent(String platform) {
        this.platform = platform;
    }

    /**
     * Returns the id of the platform the event came from
     *
     * @return the platform id, such as {@code bluesky}
     */
    public String getPlatform() {
        return this.platform;
    }
}
