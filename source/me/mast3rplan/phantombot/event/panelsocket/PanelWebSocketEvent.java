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
package me.mast3rplan.phantombot.event.panelsocket;

import me.mast3rplan.phantombot.event.Event;

public class PanelWebSocketEvent extends Event {

	private final String id;
	private final String script;
	private final String arguments;
	private final String[] args;

	public PanelWebSocketEvent(String id, String script, String arguments, String[] args) {
		this.id = id;
		this.script = script;
		this.arguments = arguments;
		this.args = args;
	}

	public String getId() {
		return this.id;
	}

	public String getScript() {
		return this.script;
	}

	public String getArguments() {
		return this.arguments;
	}

	public String[] getArgs() {
		return this.args;
	}
}
