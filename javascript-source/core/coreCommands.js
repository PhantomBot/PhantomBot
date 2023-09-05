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
        if ($.equalsIgnoreCase(command, 'shoutout')) {
            if (action === undefined) {
                $.say($.whisperPrefix(sender) + $.lang.get('corecommands.shoutout.usage', command));
                return;
            }

            var streamer = $.user.sanitize(args[0]),
                    streamerDisplay = $.viewer.getByLogin(streamer).name(),
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
        } else if ($.equalsIgnoreCase(command, 'shoutoutapi')) {
            shoutoutApi = !shoutoutApi;
            $.setIniDbBoolean('settings', 'shoutoutapi', shoutoutApi);
            $.say($.whisperPrefix(sender) + $.lang.get('corecommands.shoutoutapi.' + (shoutoutApi ? 'enable' : 'disable')));
        } else if ($.equalsIgnoreCase(command, 'settimevar')) {
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
        /*
        * @commandpath synconline (silent) - Synchronizes the stream status (online/offline); Specifying the silent parameter suppresses success and failure messages
        */
        else if ($.equalsIgnoreCase(command, 'synconline')) {
            let silent = false;
            if (action !== undefined && $.jsString(action) === 'silent') {
                silent = true;
            }

            if ($.twitchcache !== undefined && $.twitchcache !== null && $.twitchCacheReady) {
                $.twitchcache.syncOnline();

                if (!silent) {
                    $.say($.lang.get('corecommands.synconline.success'));
                }
            } else {
                if (!silent) {
                    $.say($.lang.get('corecommands.synconline.failure'));
                }
            }
        }
        /*
        * @commandpath setcommandrestriction [none/online/offline] [command] (subcommand) - Set online/offline only restriction for the specific; subcommand is an optional parameter
        */
        else if ($.equalsIgnoreCase(command, 'setcommandrestriction')) {
            if (action === undefined || args[1] === undefined) {
                $.say($.lang.get('corecommands.setcommandrestriction.usage'));
                return;
            }

            let restriction = $.jsString(action).toLowerCase(),
                com = $.jsString(args[1]).toLowerCase(),
                subCom = args.length >= 3 ? $.jsString(args[2]).toLowerCase() : null;

            if ($.getCommandRestrictionByName(restriction) === null) {
                $.say($.lang.get('corecommands.setcommandrestriction.usage'));
                return;
            }

            if (!$.commandExists(com)) {
                $.say($.lang.get('corecommands.setcommandrestriction.error', 'Command', action));
                return;
            }

            if (subCom !== null && !$.subCommandExists(com, subCom)) {
                $.say($.lang.get('corecommands.setcommandrestriction.error', 'Subcommand', com + " " + subCom));
                return;
            }

            $.setCommandRestriction(com, subCom, $.getCommandRestrictionByName(restriction));
            if (subCom !== null) {
                $.say($.lang.get('corecommands.setcommandrestriction.success', 'subcommand', com + ' ' + subCom, restriction));
            } else {
                $.say($.lang.get('corecommands.setcommandrestriction.success', 'command', com, restriction));
            }
        }
    });

    /*
     * @event webPanelSocketUpdate
     */
    $.bind('webPanelSocketUpdate', function (event) {
        if ($.equalsIgnoreCase(event.getScript(), './core/coreCommands.js')) {
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
        $.registerChatCommand('./core/coreCommands.js', 'synconline', $.PERMISSION.Mod);
        $.registerChatCommand('./core/coreCommands.js', 'setcommandrestriction', $.PERMISSION.Admin);
    });
})();
