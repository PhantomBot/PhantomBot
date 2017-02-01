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
package me.mast3rplan.phantombot.event.emotes;

import me.mast3rplan.phantombot.twitchwsirc.Channel;
import org.json.JSONObject;

public class EmotesGetEvent extends EmotesEvent {

    private final JSONObject twitchEmotes;
    private final JSONObject bttvEmotes;
    private final JSONObject bttvLocalEmotes;
    private final JSONObject ffzEmotes;
    private final JSONObject ffzLocalEmotes;

    public EmotesGetEvent(JSONObject twitchEmotes, JSONObject bttvEmotes, JSONObject bttvLocalEmotes, JSONObject ffzEmotes, JSONObject ffzLocalEmotes) {
        this.twitchEmotes = twitchEmotes;
        this.bttvEmotes = bttvEmotes;
        this.bttvLocalEmotes = bttvLocalEmotes;
        this.ffzEmotes = ffzEmotes;
        this.ffzLocalEmotes = ffzLocalEmotes;
    }

    public EmotesGetEvent(JSONObject twitchEmotes, JSONObject bttvEmotes, JSONObject bttvLocalEmotes, JSONObject ffzEmotes, JSONObject ffzLocalEmotes, Channel channel) {
        super(channel);
        this.twitchEmotes = twitchEmotes;
        this.bttvEmotes = bttvEmotes;
        this.bttvLocalEmotes = bttvLocalEmotes;
        this.ffzEmotes = ffzEmotes;
        this.ffzLocalEmotes = ffzLocalEmotes;
    }

    public JSONObject getTwitchEmotes() {
        return twitchEmotes;
    }
    public JSONObject getBttvEmotes() {
        return bttvEmotes;
    }
    public JSONObject getBttvLocalEmotes() {
        return bttvLocalEmotes;
    }
    public JSONObject getFfzEmotes() {
        return ffzEmotes;
    }
    public JSONObject getFfzLocalEmotes() {
        return ffzLocalEmotes;
    }
}

