/*
 * Copyright (C) 2016-2024 phantombot.github.io/PhantomBot
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
package com.gmt2001.twitch.eventsub.subscriptions.channel;

import java.util.Map;

import com.gmt2001.twitch.eventsub.EventSub;
import com.gmt2001.twitch.eventsub.EventSubInternalNotificationEvent;
import com.gmt2001.twitch.eventsub.EventSubSubscription;
import com.gmt2001.twitch.eventsub.EventSubSubscriptionType;
import com.gmt2001.twitch.eventsub.subscriptions.channel.data.AutomodTermsData;
import com.gmt2001.twitch.eventsub.subscriptions.channel.data.BanData;
import com.gmt2001.twitch.eventsub.subscriptions.channel.data.DeleteData;
import com.gmt2001.twitch.eventsub.subscriptions.channel.data.FollowerModeData;
import com.gmt2001.twitch.eventsub.subscriptions.channel.data.RaidData;
import com.gmt2001.twitch.eventsub.subscriptions.channel.data.SlowModeData;
import com.gmt2001.twitch.eventsub.subscriptions.channel.data.TimeoutData;
import com.gmt2001.twitch.eventsub.subscriptions.channel.data.UnbanRequestData;
import com.gmt2001.twitch.eventsub.subscriptions.channel.data.UserData;

import tv.phantombot.event.EventBus;
import tv.phantombot.event.eventsub.channel.EventSubChannelModerateEvent;

/**
 * A moderator command has been executed.
 *
 * @author gmt2001
 */
public final class ChannelModerate extends EventSubSubscriptionType {

    public static final String TYPE = "channel.moderate";
    public static final String VERSION = "1";
    private String broadcaster_user_id;
    private String broadcaster_user_login;
    private String broadcaster_user_name;
    private String moderator_user_id;
    private String moderator_user_login;
    private String moderator_user_name;
    private String action;
    private FollowerModeData followers;
    private SlowModeData slow;
    private UserData vip;
    private UserData unvip;
    private UserData mod;
    private UserData unmod;
    private BanData ban;
    private UserData unban;
    private TimeoutData timeout;
    private UserData untimeout;
    private RaidData raid;
    private UserData unraid;
    private DeleteData delete;
    private AutomodTermsData automod_terms;
    private UnbanRequestData unban_request;

    /**
     * Only used by EventSub for handler registration
     */
    public ChannelModerate() {
        super();
        this.subscribe();
    }

    /**
     * Used by {@link onEventSubInternalNotificationEvent} to construct an object from an incoming notification
     *
     * @param e The event
     */
    public ChannelModerate(EventSubInternalNotificationEvent e) {
        super(e.subscription(), e.messageId(), e.messageTimestamp());
        this.broadcaster_user_id = e.event().getString("broadcaster_user_id");
        this.broadcaster_user_login = e.event().getString("broadcaster_user_login");
        this.broadcaster_user_name = e.event().getString("broadcaster_user_name");
        this.moderator_user_id = e.event().getString("moderator_user_id");
        this.moderator_user_login = e.event().getString("moderator_user_login");
        this.moderator_user_name = e.event().getString("moderator_user_name");
        this.action = e.event().getString("action");

        if (e.event().has("followers") && !e.event().isNull("followers")) {
            this.followers = new FollowerModeData(e.event().getJSONObject("followers"));
        } else {
            this.followers = null;
        }

        if (e.event().has("slow") && !e.event().isNull("slow")) {
            this.slow = new SlowModeData(e.event().getJSONObject("slow"));
        } else {
            this.slow = null;
        }

        if (e.event().has("vip") && !e.event().isNull("vip")) {
            this.vip = new UserData(e.event().getJSONObject("vip"));
        } else {
            this.vip = null;
        }

        if (e.event().has("unvip") && !e.event().isNull("unvip")) {
            this.unvip = new UserData(e.event().getJSONObject("unvip"));
        } else {
            this.unvip = null;
        }

        if (e.event().has("mod") && !e.event().isNull("mod")) {
            this.mod = new UserData(e.event().getJSONObject("mod"));
        } else {
            this.mod = null;
        }

        if (e.event().has("unmod") && !e.event().isNull("unmod")) {
            this.unmod = new UserData(e.event().getJSONObject("unmod"));
        } else {
            this.unmod = null;
        }

        if (e.event().has("ban") && !e.event().isNull("ban")) {
            this.ban = new BanData(e.event().getJSONObject("ban"));
        } else {
            this.ban = null;
        }

        if (e.event().has("unban") && !e.event().isNull("unban")) {
            this.unban = new UserData(e.event().getJSONObject("unban"));
        } else {
            this.unban = null;
        }

        if (e.event().has("timeout") && !e.event().isNull("timeout")) {
            this.timeout = new TimeoutData(e.event().getJSONObject("timeout"));
        } else {
            this.timeout = null;
        }

        if (e.event().has("untimeout") && !e.event().isNull("untimeout")) {
            this.untimeout = new UserData(e.event().getJSONObject("untimeout"));
        } else {
            this.untimeout = null;
        }

        if (e.event().has("raid") && !e.event().isNull("raid")) {
            this.raid = new RaidData(e.event().getJSONObject("raid"));
        } else {
            this.raid = null;
        }

        if (e.event().has("unraid") && !e.event().isNull("unraid")) {
            this.unraid = new UserData(e.event().getJSONObject("unraid"));
        } else {
            this.unraid = null;
        }

        if (e.event().has("delete") && !e.event().isNull("delete")) {
            this.delete = new DeleteData(e.event().getJSONObject("delete"));
        } else {
            this.delete = null;
        }

        if (e.event().has("automod_terms") && !e.event().isNull("automod_terms")) {
            this.automod_terms = new AutomodTermsData(e.event().getJSONObject("automod_terms"));
        } else {
            this.automod_terms = null;
        }

        if (e.event().has("unban_request") && !e.event().isNull("unban_request")) {
            this.unban_request = new UnbanRequestData(e.event().getJSONObject("unban_request"));
        } else {
            this.unban_request = null;
        }
    }

    /**
     * Constructor
     *
     * @param broadcaster_user_id The user id of the broadcaster
     */
    public ChannelModerate(String broadcaster_user_id) {
        this(broadcaster_user_id, EventSub.moderatorUserId());
    }

    /**
     * Constructor
     *
     * @param broadcaster_user_id The user id of the broadcaster
     * @param moderator_user_id The ID of the moderator of the channel you want to get notifications for. If you have authorization from the broadcaster rather than a moderator, specify the broadcaster's user ID here
     */
    public ChannelModerate(String broadcaster_user_id, String moderator_user_id) {
        super();
        this.broadcaster_user_id = broadcaster_user_id;
        this.moderator_user_id = moderator_user_id;
    }

    @Override
    protected EventSubSubscription proposeSubscription() {
        return this.proposeSubscriptionInternal(ChannelModerate.TYPE, ChannelModerate.VERSION,
            Map.of("broadcaster_user_id", this.broadcaster_user_id, "moderator_user_id", this.moderator_user_id));
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

    @Override
    protected void onEventSubInternalNotificationEvent(EventSubInternalNotificationEvent e) {
        try {
            if (e.subscription().type().equals(ChannelModerate.TYPE)) {
                EventSub.debug(ChannelModerate.TYPE);
                EventBus.instance().postAsync(new EventSubChannelModerateEvent(new ChannelModerate(e)));
            }
        } catch (Exception ex) {
            com.gmt2001.Console.err.printStackTrace(ex);
        }
    }

    @Override
    protected boolean isMatch(EventSubSubscription subscription) {
        return subscription.type().equals(ChannelModerate.TYPE)
            && subscription.condition().get("broadcaster_user_id").equals(this.broadcaster_user_id)
            && subscription.condition().get("moderator_user_id").equals(this.moderator_user_id);
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
     * The executing moderator's user ID.
     *
     * @return
     */
    public String moderatorUserId() {
        return this.moderator_user_id;
    }

    /**
     * The executing moderator's user login.
     *
     * @return
     */
    public String moderatorUserLogin() {
        return this.moderator_user_login;
    }

    /**
     * The executing moderator's user display name.
     *
     * @return
     */
    public String moderatorUserName() {
        return this.moderator_user_name;
    }

    /**
     * The action that was executed.
     * 
     * <p>
     * Known actions:
     * <ul>
     * <li>ban</li>
     * <li>unban</li>
     * <li>timeout</li>
     * <li>untimeout</li>
     * <li>clear</li>
     * <li>delete</li>
     * <li>emoteonly</li>
     * <li>emoteonlyoff</li>
     * <li>followers</li>
     * <li>followersoff</li>
     * <li>uniquechat</li>
     * <li>uniquechatoff</li>
     * <li>slow</li>
     * <li>slowoff</li>
     * <li>subscribers</li>
     * <li>subscribersoff</li>
     * <li>raid</li>
     * <li>unraid</li>
     * <li>add_blocked_term</li>
     * <li>remove_blocked_term</li>
     * <li>add_permitted_term</li>
     * <li>remove_permitted_term</li>
     * <li>approve_unban_request</li>
     * <li>deny_unban_request</li>
     * <li>mod</li>
     * <li>unmod</li>
     * <li>vip</li>
     * <li>unvip</li>
     * </ul>
     * </p>
     * 
     * @return
     */
    public String action() {
        return this.action;
    }

    /**
     * The minimum follow time for followers mode. Available when {@link #action()} is {@code followers}
     * 
     * @return
     */
    public FollowerModeData followers() {
        return this.followers;
    }

    /**
     * The minimum time between messages for followers mode. Available when {@link #action()} is {@code slow}
     * 
     * @return
     */
    public SlowModeData slow() {
        return this.slow;
    }

    /**
     * The user who was added as VIP. Available when {@link #action()} is {@code vip}
     * 
     * @return
     */
    public UserData vip() {
        return this.vip;
    }

    /**
     * The user who was removed from VIP. Available when {@link #action()} is {@code unvip}
     * 
     * @return
     */
    public UserData unvip() {
        return this.unvip;
    }

    /**
     * The user who was added as mod. Available when {@link #action()} is {@code mod}
     * 
     * @return
     */
    public UserData mod() {
        return this.mod;
    }

    /**
     * The user who was removed from mod. Available when {@link #action()} is {@code unmod}
     * 
     * @return
     */
    public UserData unmod() {
        return this.unmod;
    }

    /**
     * The user who was banned. Available when {@link #action()} is {@code ban}
     * 
     * @return
     */
    public BanData ban() {
        return this.ban;
    }

    /**
     * The user who was unbanned. Available when {@link #action()} is {@code unban}
     * 
     * @return
     */
    public UserData unban() {
        return this.unban;
    }

    /**
     * The user who was timed out. Available when {@link #action()} is {@code timeout}
     * 
     * @return
     */
    public TimeoutData timeout() {
        return this.timeout;
    }

    /**
     * The user who was removed from timeout. Available when {@link #action()} is {@code untimeout}
     * 
     * @return
     */
    public UserData untimeout() {
        return this.untimeout;
    }

    /**
     * The user who was raided and initial raider count.  Available when {@link #action()} is {@code raid}
     * 
     * @return
     */
    public RaidData raid() {
        return this.raid;
    }

    /**
     * The user who is no longer being raided. Available when {@link #action()} is {@code unraid}
     * 
     * @return
     */
    public UserData unraid() {
        return this.unraid;
    }

    /**
     * The user and message being deleted. Available when {@link #action()} is {@code delete}
     * 
     * @return
     */
    public DeleteData deleteData() {
        return this.delete;
    }

    /**
     * The data about terms being added or removed from automod. Available when {@link #action()} is {@code add_blocked_term},
     * {@code remove_blocked_term}, {@code add_permitted_term}, or {@code remove_permitted_term}
     * 
     * @return
     */
    public AutomodTermsData automodTerms() {
        return this.automod_terms;
    }

    /**
     * The data about the updated unban request. Available when {@link #action()} is {@code approve_unban_request} or
     * {@code deny_unban_request}
     * 
     * @return
     */
    public UnbanRequestData unbanRequest() {
        return this.unban_request;
    }
}
