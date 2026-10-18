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
package tv.phantombot.event.social;

/**
 * Accounts that reposted the linked account's posts since the last poll, used for repost rewards
 *
 * @author mcawful
 */
public class SocialRepostersEvent extends SocialEvent {

    private final String[] accountIds;
    private final String[] accountNames;

    /**
     * Constructor
     *
     * @param platform the id of the platform, such as {@code bluesky}
     * @param accountIds the permanent ids of the accounts
     * @param accountNames the account names, in the same order as the ids
     */
    public SocialRepostersEvent(String platform, String[] accountIds, String[] accountNames) {
        super(platform);
        this.accountIds = accountIds.clone();
        this.accountNames = accountNames.clone();
    }

    /**
     * Returns the permanent ids of the accounts
     *
     * @return the account ids
     */
    public String[] getAccountIds() {
        return this.accountIds.clone();
    }

    /**
     * Returns the account names, in the same order as {@link #getAccountIds()}
     *
     * @return the account names
     */
    public String[] getAccountNames() {
        return this.accountNames.clone();
    }
}
