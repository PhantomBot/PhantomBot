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
        private SubscriptionTier subscriptionTier = SubscriptionTier.NotSubscribed;
        private boolean admin = false;
        private boolean botAdmin = false;
        private boolean bot = false;
        private boolean broadcaster = false;
        private boolean inChat = false;
        private boolean moderator = false;
        private boolean staff = false;
        private boolean turbo = false;
        private boolean vip = false;

        /**
         * A subscription tier
         *
         * @author gmt2001
         */
        public enum SubscriptionTier {
            /**
             * Not Subscribed
             */
            NotSubscribed(0, "", "Not Subscribed"),
            /**
             * Tier 1
             */
            Tier1(1000, "1000", "Tier 1"),
            /**
             * Tier 2
             */
            Tier2(2000, "2000", "Tier 2"),
            /**
             * Tier 3
             */
            Tier3(3000, "3000", "Tier 3"),
            /**
             * Prime
             */
            Prime(1001, "prime", "Prime");

            private final int level;
            private final String tierId;
            private final String tier;

            /**
             * Constructor
             *
             * @param level The numeric subscription tier level
             * @param tierId The Twitch id for this tier
             * @param tier The user-friendly name of the subscription tier
             */
            SubscriptionTier(int level, String tierId, String tier) {
                this.level = level;
                this.tierId = tierId;
                this.tier = tier;
            }

            /**
             * The numeric subscription tier level
             *
             * @return The tier level
             */
            public int level() {
                return this.level;
            }

            /**
             * The Twitch id of the subscription tier
             *
             * @return The Twitch id of the subscription tier
             */
            public String tierId() {
                return this.tierId;
            }

            /**
             * The user-friendly name of the subscription tier
             *
             * @return The tier name
             */
            public String tier() {
                return this.tier;
            }

            /**
             * Determines if two instances of SubscriptionTier are equivilent
             *
             * @param other The other instance to test against
             * @return {@code true} if both instances have the same value for {@link #level()}
             */
            public boolean equals(SubscriptionTier other) {
                return this.level() == other.level();
            }

            /**
             * Returns a SubscriptionTier, given a tier id
             *
             * @param tierId The tier id
             * @return The matching subscription tier, if found; {@link #NotSubscribed} otherwise
             */
            public static SubscriptionTier of(String tierId) {
                for (SubscriptionTier tier : SubscriptionTier.values()) {
                    if (tier.tierId.equalsIgnoreCase(tierId)) {
                        return tier;
                    }
                }

                return SubscriptionTier.NotSubscribed;
            }
        }

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
         * Updates the last time this user was seen
         * <br /><br />
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
         * <br /><br />
         * This is used for garbage collection
         *
         * @return The last time this user was seen
         */
        public Instant lastSeen() {
            return this.lastSeen;
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
         * Updates the Bot admin status of the viewer
         *
         * @param botAdmin {@code true} if the user is a Bot admin
         * @return {@code this}
         */
        public synchronized Viewer botAdmin(boolean botAdmin) {
            this.botAdmin = botAdmin;

            return this;
        }

        /**
         * Indicates if this user is a Bot admin
         *
         * @return {@code true} if the user is a Bot admin
         */
        public boolean botAdmin() {
            return this.botAdmin;
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
         * Updates the subscription tier of the viewer
         *
         * @param subscriptionTier The subscription tier of the viewer
         * @return {@code this}
         */
        public Viewer subscriber(String subscriptionTier) {
            return this.subscriber(SubscriptionTier.of(subscriptionTier));
        }

        /**
         * Updates the subscription tier of the viewer
         *
         * @param subscriptionTier The subscription tier of the viewer
         * @return {@code this}
         */
        public synchronized Viewer subscriber(SubscriptionTier subscriptionTier) {
            this.subscriptionTier = subscriptionTier;

            return this;
        }

        /**
         * The subscription tier of the viewer
         *
         * @return The subscription tier of the viewer
         */
        public SubscriptionTier subscriptionTier() {
            return this.subscriptionTier;
        }

        /**
         * Indicates if this user is a subscriber
         *
         * @return {@code true} if the user is a subscriber
         */
        public boolean subscriber() {
            return this.subscriptionTier != SubscriptionTier.NotSubscribed;
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