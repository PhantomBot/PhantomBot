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
package tv.phantombot.event.moderation;

import tv.phantombot.event.Event;

public class ModerationEvent extends Event {

	private final String username;
	private final String creator;
	private final String message;
	private final long timeMs;

	public ModerationEvent(String username, String creator, String message, long timeMs) {
		this.username = username;
		this.creator = creator;
		this.message = message;
		this.timeMs = timeMs;
	}

	public String getUsername() {
		return this.username;
	}

	public String getCreator() {
		return this.creator;
	}

	public String getMessage() {
		return this.message;
	}

	public Long getTimeMS() {
		return this.timeMs;
	}
}
