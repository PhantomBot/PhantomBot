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

(function () {
    let shoutoutApi = $.getSetIniDbBoolean('settings', 'shoutoutapi', true);
    /*
     * @event command
     */
    $.bind('command', function (event) {
        var sender = event.getSender(),
                command = event.getCommand(),
                args = event.getArgs(),
                action = args[0];

        /*
         * @commandpath shoutout [streamer] - Give a shout out to a streamer.
         */
        if (command.equalsIgnoreCase('shoutout')) {
            if (action === undefined) {
                $.say($.whisperPrefix(sender) + $.lang.get('corecommands.shoutout.usage', command));
                return;
            }

            var streamer = $.user.sanitize(args[0]),
                    streamerDisplay = $.username.resolve(streamer),
                    streamerGame = $.javaString($.getGame(streamer)),
                    streamerURL = 'https://twitch.tv/' + streamer;

            if (streamerGame === null || streamerGame.isBlank()) {
                $.say($.lang.get('corecommands.shoutout.no.game', streamerDisplay, streamerURL));
                return;
            }

            if (!$.isOnline(streamer)) {
                $.say($.lang.get('corecommands.shoutout.offline', streamerDisplay, streamerURL, streamerGame));
            } else {
                $.say($.lang.get('corecommands.shoutout.online', streamerDisplay, streamerURL, streamerGame));
            }

            if (shoutoutApi) {
                $.say('/shoutout ' + streamer);
            }
            /*
             * @commandpath shoutoutapitoggle - Toggles if the /shoutout API is also sent along with the normal !shoutout response
             */
        } else if (command.equalsIgnoreCase('shoutoutapi')) {
            shoutoutApi = !shoutoutApi;
            $.setIniDbBoolean('settings', 'shoutoutapi', shoutoutApi);
            $.say($.whisperPrefix(sender) + $.lang.get('corecommands.shoutoutapi.' + (shoutoutApi ? 'enable' : 'disable')));
        } else if (command.equalsIgnoreCase('settimevar')) {
            if (action === undefined) {
                $.say($.whisperPrefix(sender) + $.lang.get('corecommands.settimevar.usage', command));
                return;
            }

            var time;
            if (args.length === 1) {
                time = $.getLocalTime();
                $.inidb.set('timevars', action, time);
            } else {
                time = Date.parse(args.slice(1).join(' '));

                if (isNaN(time)) {
                    $.say($.lang.get('customcommands.datetime.format.invalid', args.slice(1).join(' ')));
                    return;
                } else {
                    time = $.getLocalTimeString("yyyy-MM-dd'T'HH:mm:ss", time);
                    $.inidb.set('timevars', action, time);
                }
            }

            $.say($.lang.get('corecommands.settimevar.success', action, time));
        }
    });

    /*
     * @event webPanelSocketUpdate
     */
    $.bind('webPanelSocketUpdate', function (event) {
        if (event.getScript().equalsIgnoreCase('./core/coreCommands.js')) {
            shoutoutApi = $.getIniDbBoolean('settings', 'shoutoutapi');
        }
    });

    /*
     * @event initReady
     */
    $.bind('initReady', function () {
        $.registerChatCommand('./core/coreCommands.js', 'shoutout', $.PERMISSION.Mod);
        $.registerChatCommand('./core/coreCommands.js', 'shoutoutapitoggle', $.PERMISSION.Mod);
        $.registerChatCommand('./core/coreCommands.js', 'settimevar', $.PERMISSION.Mod);
    });
})();
