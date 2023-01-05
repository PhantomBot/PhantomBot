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

(function() {

    /*
     * @event twitchGameChange
     */
    $.bind('twitchGameChange', function(event) {
        if (!$.isOnline($.channelName)) {
            return;
        }

        var gamesObj = ($.inidb.exists('pastgames', 'gamesList') ? JSON.parse($.getIniDbString('pastgames', 'gamesList')) : {}),
            date = $.jsString($.logging.getLogDateString()).replace(/-/g, '.'),
            game = $.jsString(event.getGameTitle()).replace(/\s/g, '-').toLowerCase();

        if (gamesObj[game] !== undefined) {
            gamesObj[game].push(date);
        } else {
            gamesObj[game] = [date];
        }

        $.setIniDbString('pastgames', 'gamesList', JSON.stringify(gamesObj));
    });

    /*
     * @event twitchOnline
     */
    $.bind('twitchOnline', function(event) {
        var gamesObj = ($.inidb.exists('pastgames', 'gamesList') ? JSON.parse($.getIniDbString('pastgames', 'gamesList')) : {}),
            date = $.jsString($.logging.getLogDateString()).replace(/-/g, '.'),
            game = $.jsString($.getGame($.channelName)).replace(/\s/g, '-').toLowerCase();

        if (gamesObj[game] !== undefined) {
            gamesObj[game].push(date);
        } else {
            gamesObj[game] = [date];
        }

        $.setIniDbString('pastgames', 'gamesList', JSON.stringify(gamesObj));
    });

    /*
     * @function gameLookUp
     *
     * @param {String} gameName
     */
    function gameLookUp(gameName) {
        var gamesObj = ($.inidb.exists('pastgames', 'gamesList') ? JSON.parse($.getIniDbString('pastgames', 'gamesList')) : {}),
            game = $.jsString(gameName).replace(/\s/g, '-').toLowerCase();

        if (gamesObj[game] === undefined) {
            $.say($.lang.get('gamescanhandler.gamescan.notplayed', $.username.resolve($.channelName), gameName));
        } else {
            if (gamesObj[game].length > 10) {
                $.say($.lang.get('gamescanhandler.gamescan.hasplayeddates', $.username.resolve($.channelName), gameName, gamesObj[game].slice(10).join(', '), (gamesObj[game].length - 10)));
            } else {
                $.say($.lang.get('gamescanhandler.gamescan.hasplayed', $.username.resolve($.channelName), gameName, gamesObj[game].join(', ')));
            }
        }
    }

    $.bind('command', function(event) {
        var sender = event.getSender(),
            command = event.getCommand(),
            args = event.getArgs(),
            action = args[0];

        /**
         * @commandpath gamescan [game name] - Scan for a recently played game and list the date in which the broadcaster played it.
         */
        if (command.equalsIgnoreCase('gamescan')) {
            if (action === undefined) {
                $.say($.whisperPrefix(sender) + $.lang.get('gamescanhandler.gamescan.usage'));
                return;
            }

            gameLookUp(args.join(' '));
        }
    });

    /*
     * @event initReady
     */
    $.bind('initReady', function() {
        $.registerChatCommand('./handlers/gameScanHandler.js', 'gamescan', $.PERMISSION.Viewer);
    });
})();
