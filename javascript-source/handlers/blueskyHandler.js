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
 * Bluesky chat announcements, automatic posts, repost rewards and the !bluesky command.
 * The work is done by ./core/social.js; this module turns it on for Bluesky.
 */
(function () {
    let spec = $.social.registerPlatform({
        id: 'bluesky',
        command: 'bluesky',
        script: './handlers/blueskyHandler.js'
    });

    /*
     * @event command
     */
    $.bind('command', function (event) {
        $.social.handleCommand(spec, event);
    });

    /*
     * @commandpath bluesky - Shows the linked Bluesky account.
     */

    /*
     * @commandpath bluesky usage - Shows the usage of the command.
     */

    /*
     * @commandpath bluesky id - Shows the linked Bluesky account.
     */

    /*
     * @commandpath bluesky lastpost - Shows the last post seen from the linked account.
     */

    /*
     * @commandpath bluesky lastmention - Shows the last mention, reply or quote seen.
     */

    /*
     * @commandpath bluesky lastrepost - Shows the last repost seen.
     */

    /*
     * @commandpath bluesky register [handle] - Registers your Bluesky account for repost rewards.
     */

    /*
     * @commandpath bluesky unregister - Removes your registered Bluesky account.
     */

    /*
     * @commandpath bluesky post [message] - Posts a message to the linked Bluesky account.
     */

    /*
     * @commandpath bluesky set poll [mentions | reposts | posts] [on/off] - Announces that kind of activity in chat.
     */

    /*
     * @commandpath bluesky set polldelay [mentions | reposts | posts] [seconds] - Sets how often that kind of activity is checked.
     */

    /*
     * @commandpath bluesky set post [online | gamechange | update] [on/off] - Posts automatically when going live, when changing game, or periodically while live.
     */

    /*
     * @commandpath bluesky set message [online | gamechange | update] [message] - Sets the text of an automatic post.
     */

    /*
     * @commandpath bluesky set updatetimer [minutes] - Sets the minutes between periodic posts while live. Minimum 180.
     */

    /*
     * @commandpath bluesky set reward [toggle | announce] [on/off] - Turns repost rewards, or their chat announcement, on or off.
     */

    /*
     * @commandpath bluesky set reward points [points] - Sets the points given for a repost.
     */

    /*
     * @commandpath bluesky set reward cooldown [hours] - Sets the hours a viewer must wait between repost rewards.
     */
})();
