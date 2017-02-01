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
package me.mast3rplan.phantombot.event.challonge;

public class TournamentEndedEvent extends ChallongeEvent {

	private final String champion;
	private final String name;
	private final String game;
	private final String url;

	public TournamentEndedEvent(String champion, String name, String game, String url) {
		this.champion = champion;
		this.name = name;
		this.game = game;
		this.url = url;
	}

	public TournamentEndedEvent(String name, String game, String url) {
		this.champion = null;
		this.name = name;
		this.game = game;
		this.url = url;
	}

	public String getName() {
		return this.name;
	}

	public String getChampion() {
		return this.champion;
	}

	public String getGame() {
		return this.game;
	}

	public String getUrl() {
		return this.url;
	}
}
