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
package tv.phantombot.event.twitch;

/**
 * An update to the Twitch broadcaster type of the caster
 */
public class TwitchBroadcasterTypeEvent extends TwitchEvent {
    private final boolean wasAffiliate;
    private final boolean wasPartner;
    private final boolean isAffiliate;
    private final boolean isPartner;

    public TwitchBroadcasterTypeEvent(boolean wasAffiliate, boolean wasPartner, boolean isAffiliate, boolean isPartner) {
        super();
        this.wasAffiliate = wasAffiliate;
        this.wasPartner = wasPartner;
        this.isAffiliate = isAffiliate;
        this.isPartner = isPartner;
    }

    /**
     * Indicates if this channel was an affiliate before this update
     *
     * @return
     */
    public boolean wasAffiliate() {
        return this.wasAffiliate;
    }

    /**
     * Indicates if this channel was a partner before this update
     *
     * @return
     */
    public boolean wasPartner() {
        return this.wasPartner;
    }

    /**
     * Indicates if this channel was either an affiliate or a partner before this update
     *
     * @return
     */
    public boolean wasAffiliateOrPartner() {
        return this.wasAffiliate() || this.wasPartner();
    }

    /**
     * Indicates if this channel is an affiliate
     *
     * @return
     */
    public boolean isAffiliate() {
        return this.isAffiliate;
    }

    /**
     * Indicates if this channel is a partner
     *
     * @return
     */
    public boolean isPartner() {
        return this.isPartner;
    }

    /**
     * Indicates if this channel is either an affiliate or a partner
     *
     * @return
     */
    public boolean isAffiliateOrPartner() {
        return this.isAffiliate() || this.isPartner();
    }
}
