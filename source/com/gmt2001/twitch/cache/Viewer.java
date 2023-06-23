/*
 * Copyright (C) 2016-2023 phantombot.github.io/PhantomBot
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

package com.gmt2001.twitch.cache;

import java.time.Instant;

/**
 * Contains information about a specific viewer in a {@link ViewerCache}
 *
 * @author gmt2001
 */
public final class Viewer {
    private final String id;
    private String login = "";
    private String name = "";
    private Instant lastSeen = Instant.now();
    private Instant lastActive = Instant.MIN;
    private boolean admin = false;
    private boolean bot = false;
    private boolean broadcaster = false;
    private boolean inChat = false;
    private boolean moderator = false;
    private boolean staff = false;
    private boolean subscriber = false;
    private boolean turbo = false;
    private boolean vip = false;
    private boolean hasAttributes = false;

    /**
     * Constructor
     *
     * @param id The Twitch user id
     */
    Viewer(String id) {
        this.id = id;
    }

    /**
     * The Twitch user id
     *
     * @return The Twitch user id
     */
    public String id() {
        return this.id;
    }

    /**
     * Updates the Twitch user login name
     *
     * @param login The Twitch user login name
     * @return {@code this}
     */
    public synchronized Viewer login(String login) {
        if (login != null && !login.isBlank()) {
            this.login = login;
        }

        return this;
    }

    /**
     * The Twitch user login name
     *
     * @return The Twitch user login name; Empty string {@code ""} if the login name has not been looked up yet
     */
    public String login() {
        return this.login;
    }

    /**
     * Updates the Twitch user display name
     *
     * @param name The Twitch user display name
     * @return {@code this}
     */
    public synchronized Viewer name(String name) {
        if (name != null && !name.isBlank()) {
            this.name = name;
        }

        return this;
    }

    /**
     * The Twitch user display name
     *
     * @return The Twitch user display name; Empty string {@code ""} if the display name has not been looked up yet
     */
    public String name() {
        return this.name;
    }

    /**
     * Updates the last time this user was active in chat
     *
     * @return {@code this}
     */
    public synchronized Viewer active() {
        this.lastActive = Instant.now();

        return this;
    }

    /**
     * The last time this user was active in chat
     *
     * @return The last time this user was active in chat; {@link Instant#MIN} if the user was never active
     */
    public Instant lastActive() {
        return this.lastActive;
    }

    /**
     * Updates the last time this user was seen
     * <p>
     * This is used for garbage collection
     *
     * @return {@code this}
     */
    public synchronized Viewer seen() {
        this.lastSeen = Instant.now();

        return this;
    }

    /**
     * The last time this user was seen
     * <p>
     * This is used for garbage collection
     *
     * @return The last time this user was seen
     */
    public Instant lastSeen() {
        return this.lastSeen;
    }

    /**
     * Marks that the attributes have been set on this viewer
     */
    public Viewer attributes() {
        this.hasAttributes = true;

        return this;
    }

    /**
     * Indicates if this user has had their attributes set from an IRC event, such as moderator status
     * <p>
     * It is possible for this to return {@code false} but for some attributes to be set if an API lookup was performed
     *
     * @return {@code true} if the user has had their attributes set
     */
    public boolean hasAttributes() {
        return this.hasAttributes;
    }

    /**
     * Updates the Twitch admin status of the viewer
     *
     * @param admin {@code true} if the user is a Twitch admin
     * @return {@code this}
     */
    public synchronized Viewer admin(boolean admin) {
        this.admin = admin;

        return this;
    }

    /**
     * Indicates if this user is a Twitch admin
     *
     * @return {@code true} if the user is a Twitch admin
     */
    public boolean admin() {
        return this.admin;
    }

    /**
     * Updates if this viewer is the bot
     *
     * @param bot {@code true} if the user is the bot
     * @return {@code this}
     */
    public synchronized Viewer bot(boolean bot) {
        this.bot = bot;

        return this;
    }

    /**
     * Indicates if this user is the bot
     *
     * @return {@code true} if the user is the bot
     */
    public boolean bot() {
        return this.bot;
    }

    /**
     * Updates the broadcaster status of the viewer
     *
     * @param broadcaster {@code true} if the user is the broadcaster
     * @return {@code this}
     */
    public synchronized Viewer broadcaster(boolean broadcaster) {
        this.broadcaster = broadcaster;

        return this;
    }

    /**
     * Indicates if this user is the broadcaster
     *
     * @return {@code true} if the user is the broadcaster
     */
    public boolean broadcaster() {
        return this.broadcaster;
    }

    /**
     * Updates if this viewer is in chat
     *
     * @param inChat {@code true} if the user is in chat
     * @return {@code this}
     */
    public synchronized Viewer inChat(boolean inChat) {
        this.inChat = inChat;

        return this;
    }

    /**
     * Indicates if this user is in chat
     *
     * @return {@code true} if the user is in chat
     */
    public boolean inChat() {
        return this.inChat;
    }

    /**
     * Updates the moderator status of the viewer
     *
     * @param moderator {@code true} if the user is a moderator
     * @return {@code this}
     */
    public synchronized Viewer moderator(boolean moderator) {
        this.moderator = moderator;

        return this;
    }

    /**
     * Indicates if this user is a moderator
     *
     * @return {@code true} if the user is a moderator
     */
    public boolean moderator() {
        return this.moderator;
    }

    /**
     * Updates the Twitch staff status of the viewer
     *
     * @param staff {@code true} if the user is a Twitch staff member
     * @return {@code this}
     */
    public synchronized Viewer staff(boolean staff) {
        this.staff = staff;

        return this;
    }

    /**
     * Indicates if this user is a Twitch staff member
     *
     * @return {@code true} if the user is a Twitch staff member
     */
    public boolean staff() {
        return this.staff;
    }

    /**
     * Updates the Twitch subscriber status of the viewer
     *
     * @param subscriber {@code true} if the user is a subscriber of the channel
     * @return {@code this}
     */
    public synchronized Viewer subscriber(boolean subscriber) {
        this.subscriber = subscriber;

        return this;
    }

    /**
     * Indicates if this user is a subscriber of the channel
     *
     * @return {@code true} if the user is a subscriber of the channel
     */
    public boolean subscriber() {
        return this.subscriber;
    }

    /**
     * Updates the Twitch turbo status of the viewer
     *
     * @param turbo {@code true} if the user is a Twitch turbo member
     * @return {@code this}
     */
    public synchronized Viewer turbo(boolean turbo) {
        this.turbo = turbo;

        return this;
    }

    /**
     * Indicates if this user is a Twitch turbo member
     *
     * @return {@code true} if the user is a Twitch turbo member
     */
    public boolean turbo() {
        return this.turbo;
    }

    /**
     * Updates the Twitch VIP status of the viewer
     *
     * @param vip {@code true} if the user is a VIP
     * @return {@code this}
     */
    public synchronized Viewer vip(boolean vip) {
        this.vip = vip;

        return this;
    }

    /**
     * Indicates if this user is a VIP
     *
     * @return {@code true} if the user is a VIP
     */
    public boolean vip() {
        return this.vip;
    }
}