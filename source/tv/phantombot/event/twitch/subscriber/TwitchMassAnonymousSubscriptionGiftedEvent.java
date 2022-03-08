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

package tv.phantombot.event.twitch.subscriber;

import tv.phantombot.event.twitch.TwitchEvent;

/**
 *
 * @author Branden
 */
public class TwitchMassAnonymousSubscriptionGiftedEvent extends TwitchEvent {
    private final String amount;
    private final String plan;
    
    /**
     * Class constructor.
     * 
     * @param amount
     * @param plan 
     */
    public TwitchMassAnonymousSubscriptionGiftedEvent(String amount, String plan) {
        this.amount = amount;
        this.plan = plan;
    }
    
    /**
     * Get the user, which is always anonymous.
     * 
     * @return 
     */
    public String getUsername() {
        return "anonymous";
    }
    
    /**
     * Gets the amount of subs gifted.
     * 
     * @return 
     */
    public String getAmount() {
        return amount;
    }
    
    /**
     * Gets the sub plan.
     * 
     * @return 
     */
    public String getPlan() {
        return plan;
    }
}
