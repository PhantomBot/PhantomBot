/*
 * Copyright (C) 2016-2022 phantombot.github.io/PhantomBot
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
package tv.phantombot.twitch.irc.chat.utils;

public class SubscriberBulkGifter {

    private final String username;
    private final int totalSubscriptionsGifted;
    private final boolean isAnonymous;
    private int currentSubscriptionsGifted = 0;

    /**
     * Class constructor.
     *
     * @param username
     * @param totalSubscriptionsGifted
     */
    public SubscriberBulkGifter(String username, int totalSubscriptionsGifted, boolean isAnonymous) {
        this.username = username;
        this.totalSubscriptionsGifted = totalSubscriptionsGifted;
        this.isAnonymous = isAnonymous;
    }

    /**
     * Method that gets what user sent the subscription.
     *
     * @return
     */
    public String getUsername() {
        return username;
    }

    /**
     * Method that gets the subscription number of which the user bought.
     *
     * @return
     */
    public int getSubscritpionsGifted() {
        return totalSubscriptionsGifted;
    }

    /**
     * Method that gets how many subs has gone through twitch.
     *
     * @return
     */
    public int getCurrentSubscriptionGifted() {
        return currentSubscriptionsGifted;
    }

    /**
     * Method that increases the total subs that went through.
     */
    public void increaseCurrentSubscriptionGifted() {
        currentSubscriptionsGifted++;
    }

    /**
     * Method that returns if this was by anonymous.
     *
     * @return
     */
    public boolean isAnonymous() {
        return isAnonymous;
    }
}
