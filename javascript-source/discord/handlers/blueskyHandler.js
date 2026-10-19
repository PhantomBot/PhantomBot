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

/*
 * blueskyHandler.js
 *
 * Bluesky announcements in Discord and the !blueskyhandler command.
 * The work is done by ./discord/core/social.js; this module turns it on for Bluesky.
 */
(function () {
    let spec = $.discordSocial.registerPlatform({
        id: 'bluesky',
        command: 'blueskyhandler',
        script: './discord/handlers/blueskyHandler.js',
        color: [17, 133, 254]
    });

    /*
     * @event socialActivity
     */
    $.bind('socialActivity', function (event) {
        $.discordSocial.announce(spec, event);
    });

    /*
     * @event discordChannelCommand
     */
    $.bind('discordChannelCommand', function (event) {
        $.discordSocial.handleCommand(spec, event);
    });

    /*
     * @discordcommandpath blueskyhandler toggle - Toggles Bluesky announcements in Discord.
     */

    /*
     * @discordcommandpath blueskyhandler channel [channel name] - Sets the default channel that Bluesky announcements are made in.
     */

    /*
     * @discordcommandpath blueskyhandler channel [mentions | reposts | posts] [channel name | default] - Sets the channel for one kind of announcement.
     */

    /*
     * @discordcommandpath blueskyhandler announce [mentions | reposts | posts] [on/off] - Chooses which kinds of Bluesky activity are announced in Discord.
     */
})();
