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
package com.gmt2001.twitch.eventsub.subscriptions.channel.chat.data;

import org.json.JSONObject;

/**
 * A message fragment in {@link MessageData}.
 * 
 * @author gmt2001
 */
public final class MessageFragment {
    private String text;
    private String type;
    private MessageCheermote cheermote;
    private MessageEmote emote;
    private MessageMention mention;

    /**
     * Constructor
     * 
     * @param o The JSON data for the object
     */
    protected MessageFragment(JSONObject o) {
        this.text = o.getString("text");
        this.type = o.getString("type");

        if (!o.has("cheermote") || o.isNull("cheermote")) {
            this.cheermote = null;
        } else {
            this.cheermote = new MessageCheermote(o.getJSONObject("cheermote"));
        }

        if (!o.has("emote") || o.isNull("emote")) {
            this.emote = null;
        } else {
            this.emote = new MessageEmote(o.getJSONObject("emote"));
        }

        if (!o.has("mention") || o.isNull("mention")) {
            this.mention = null;
        } else {
            this.mention = new MessageMention(o.getJSONObject("mention"));
        }
    }

    /**
     * The raw message text of this fragment.
     * 
     * @return
     */
    public String text() {
        return this.text;
    }

    /**
     * The fragment type, such as text, cheermote, emote, or mention.
     * 
     * @return
     */
    public String type() {
        return this.type;
    }

    /**
     * The cheermote data if this is a cheermote fragment.
     * 
     * @return
     */
    public MessageCheermote cheermote() {
        return this.cheermote;
    }

    /**
     * The emote data if this is an emote fragment.
     * 
     * @return
     */
    public MessageEmote emote() {
        return this.emote;
    }

    /**
     * The mention data if this is a mention fragment.
     * 
     * @return
     */
    public MessageMention mention() {
        return this.mention;
    }
}
