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

/**
 * Script  : adsAnnounceHandler.js
 * Purpose : Presently interfaces with the ads eventsub events to announce when an ad is rolling.
 */
(function () {
    var toggle = $.getSetIniDbBoolean('adsAnnounceSettings', 'announceadstart', false)

    /*
     * @function reloadAds
     */
    function reloadAds() {
        toggle = $.getIniDbBoolean('adsAnnounceSettings', 'announceadstart', false);
    }

    /*
     * @function subscribeEventSub
     */
    function subscribeEventSub() {
        let subscriptions = [
            Packages.com.gmt2001.twitch.eventsub.subscriptions.channel.ad_break.AdBreakBegin
        ];

        for (let i in subscriptions) {
            let newSubscription = new subscriptions[i]($.viewer.broadcaster().id());
            try {
                newSubscription.create().block();
            } catch (ex) {
                $.log.error(ex);
            }
        }
    }


    /*
     * @event eventSubWelcome
     */
    $.bind('eventSubWelcome', function (event) {
        if (!event.isReconnect()) {
            subscribeEventSub();
        }
    }, true);


    /*
     * @event command
     */
    $.bind('command', function (event) {
        var sender = event.getSender(),
                command = event.getCommand(),
                args = event.getArgs(),
                argsString = event.getArguments(),
                action = args[0];

        /*
         * @commandpath adsannouncestarttoggle - Toggles the ads announcements.
         */
        if ($.equalsIgnoreCase(command, 'adsannouncestarttoggle')) {
            toggle = !toggle;
            $.setIniDbBoolean('adsAnnounceSettings', 'announceadstart', toggle);
            $.say($.whisperPrefix(sender) + (toggle ? $.lang.get('adsannouncehandler.toggle.on') : $.lang.get('adsannouncehandler.toggle.off')));
        }
    });


    /*
     * @event AdBreakBegin
     */
    $.bind('eventSubAdBreakBegin', function (event) {
        let durationSeconds = event.event().durationSeconds(),
            startTime = event.event().startedAtString();

        Packages.com.gmt2001.Console.debug.println("Ad Break Begin event. Start Time is: " + startTime + ". Duration (seconds) is: " + durationSeconds);

        if ($.getIniDbBoolean('adsAnnounceSettings', 'announceadstart')) {
            $.say($.lang.get('adsannouncehandler.announcestart', durationSeconds));
        }
    });

    /*
     * @event initReady
     */
    $.bind('initReady', function () {
        $.registerChatCommand('./handlers/adsAnnounceHandler.js', 'adsannouncestarttoggle', $.PERMISSION.Admin);
    });
})();
