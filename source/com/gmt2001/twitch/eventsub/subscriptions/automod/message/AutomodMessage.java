/*
 * Copyright (C) 2016-2025 phantombot.github.io/PhantomBot
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
package com.gmt2001.twitch.eventsub.subscriptions.automod.message;

import java.time.ZonedDateTime;

import com.gmt2001.twitch.eventsub.EventSub;
import com.gmt2001.twitch.eventsub.EventSubInternalNotificationEvent;
import com.gmt2001.twitch.eventsub.EventSubSubscriptionType;
import com.gmt2001.twitch.eventsub.subscriptions.channel.chat.data.MessageData;

/**
 * Common message data for {@link AutomodMessageHold} and {@link AutomodMessageUpdate}.
 *
 * @author gmt2001
 */
public abstract sealed class AutomodMessage extends EventSubSubscriptionType permits AutomodMessageHold, AutomodMessageUpdate {

    private String broadcaster_user_id;
    private String broadcaster_user_login;
    private String broadcaster_user_name;
    private String user_id;
    private String user_login;
    private String user_name;
    private String moderator_user_id;
    private String message_id;
    private MessageData message;
    private String category;
    private int level;
    private String sHeld_at;
    private ZonedDateTime held_at;

    /**
     * Only used by EventSub for handler registration
     */
    public AutomodMessage() {
        super();
        this.subscribe();
    }

    /**
     * Used by {@link onEventSubInternalNotificationEvent} to construct an object from an incoming notification
     *
     * @param e The event
     */
    public AutomodMessage(EventSubInternalNotificationEvent e) {
        super(e.subscription(), e.messageId(), e.messageTimestamp());
        this.broadcaster_user_id = e.event().getString("broadcaster_user_id");
        this.broadcaster_user_login = e.event().getString("broadcaster_user_login");
        this.broadcaster_user_name = e.event().getString("broadcaster_user_name");
        this.user_id = e.event().getString("user_id");
        this.user_login = e.event().getString("user_login");
        this.user_name = e.event().getString("user_name");
        this.moderator_user_id = e.event().optString("moderator_user_id", null);
        this.message_id = e.event().getString("message_id");
        this.message = new MessageData(e.event().getJSONObject("message"));
        this.category = e.event().getString("category");
        this.level = e.event().getInt("level");
        this.sHeld_at = e.event().getString("held_at");
        this.held_at = EventSub.parseDate(this.sHeld_at);
    }

    /**
     * Constructor
     *
     * @param broadcaster_user_id The user id of the broadcaster
     * @param moderator_user_id The ID of the moderator of the channel you want to get notifications for. If you have authorization from the broadcaster rather than a moderator, specify the broadcaster's user ID here
     */
    public AutomodMessage(String broadcaster_user_id, String moderator_user_id) {
        super();
        this.broadcaster_user_id = broadcaster_user_id;
        this.moderator_user_id = moderator_user_id;
    }

    @Override
    protected void validateParameters() throws IllegalArgumentException {
        if (this.broadcaster_user_id == null || this.broadcaster_user_id.isBlank() || !this.broadcaster_user_id.matches("[0-9]+")
                || this.broadcaster_user_id.startsWith("-") || this.broadcaster_user_id.startsWith("0")) {
            throw new IllegalArgumentException("broadcaster_user_id must be a valid id");
        }
        if (this.moderator_user_id == null || this.moderator_user_id.isBlank() || !this.moderator_user_id.matches("[0-9]+")
                || this.moderator_user_id.startsWith("-") || this.moderator_user_id.startsWith("0")) {
            throw new IllegalArgumentException("moderator_user_id must be a valid id");
        }
    }

    /**
     * The broadcaster's user ID.
     *
     * @return
     */
    public String broadcasterUserId() {
        return this.broadcaster_user_id;
    }

    /**
     * The broadcaster's user login.
     *
     * @return
     */
    public String broadcasterUserLogin() {
        return this.broadcaster_user_login;
    }

    /**
     * The broadcaster's user display name.
     *
     * @return
     */
    public String broadcasterUserName() {
        return this.broadcaster_user_name;
    }

    /**
     * The message sender's user ID.
     *
     * @return
     */
    public String userId() {
        return this.user_id;
    }

    /**
     * The message sender's user login.
     *
     * @return
     */
    public String userLogin() {
        return this.user_login;
    }

    /**
     * The message sender's user display name.
     *
     * @return
     */
    public String userName() {
        return this.user_name;
    }

    /**
     * The moderator's user ID.
     *
     * @return
     */
    public String moderatorUserId() {
        return this.moderator_user_id;
    }

    /**
     * The ID of the message that was flagged by automod.
     *
     * @return
     */
    public String messageId() {
        return this.message_id;
    }

    /**
     * The body of the flagged message.
     * 
     * @return
     */
    public MessageData message() {
        return this.message;
    }

    /**
     * The automod category that triggered the message to be held.
     * 
     * @return
     */
    public String category() {
        return this.category;
    }

    /**
     * The automod severity rating of the message, according to the {@link #category()} trigger.
     * 
     * @return
     */
    public int level() {
        return this.level;
    }

    /**
     * The timestamp of when the message was held as a string.
     * 
     * @return
     */
    public String heldAtString() {
        return this.sHeld_at;
    }

    /**
     * The timestamp of when the message was held.
     * 
     * @return
     */
    public ZonedDateTime heldAt() {
        return this.held_at;
    }
}
