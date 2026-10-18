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
 * A kind of activity a {@link SocialPlatform} can be polled for
 * <p>
 * The settings {@code poll_<id>} and {@code polldelay_<id>} in the platform's table turn the poll on and set its delay
 *
 * @param id the id, such as {@code mentions}
 * @param minDelaySeconds the shortest allowed delay between two polls, in seconds
 * @param defaultDelaySeconds the default delay between two polls, in seconds
 * @param feedsRewards if {@code true}, the authors of new items are sent for repost rewards
 *
 * @author mcawful
 */
public record SocialPollType(String id, int minDelaySeconds, int defaultDelaySeconds, boolean feedsRewards) {
}
