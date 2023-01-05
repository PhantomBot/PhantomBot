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
package tv.phantombot.event.pubsub.channelpoints;

import tv.phantombot.event.pubsub.PubSubEvent;

public class PubSubChannelPointsEvent extends PubSubEvent {

    private final String redemptionID;
    private final String rewardID;
    private final String userID;
    private final String username;
    private final String displayName;
    private final String rewardTitle;
    private final int cost;
    private final String inputPrompt;
    private final String userInput;
    private final String fulfillmentStatus;

    public PubSubChannelPointsEvent(String redemptionID, String rewardID, String userID, String username, String displayName, String rewardTitle, int cost, String inputPrompt, String userInput, String fulfillmentStatus) {
        this.redemptionID = redemptionID;
        this.rewardID = rewardID;
        this.userID = userID;
        this.username = username;
        this.displayName = displayName;
        this.rewardTitle = rewardTitle;
        this.cost = cost;
        this.inputPrompt = inputPrompt;
        this.userInput = userInput;
        this.fulfillmentStatus = fulfillmentStatus;
    }

    public String getRedemptionID() {
        return this.redemptionID;
    }

    public String getRewardID() {
        return this.rewardID;
    }

    public String getUserID() {
        return this.userID;
    }

    public String getUsername() {
        return this.username;
    }

    public String getDisplayName() {
        return this.displayName;
    }

    public String getRewardTitle() {
        return this.rewardTitle;
    }

    public int getCost() {
        return this.cost;
    }

    public String getInputPrompt() {
        return this.inputPrompt;
    }

    public String getUserInput() {
        return this.userInput;
    }

    public String getFulfillmentStatus() {
        return this.fulfillmentStatus;
    }
}
