/*
 * Copyright (C) 2016-2018 phantombot.tv
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
 * kentobotSystem.js
 *
 * General bot maintenance and control
 */
(function () {

    function secondsToTimestamp(timeInSeconds) {
        // multiply by 1000 because Date() requires miliseconds
        var date = new Date(timeInSeconds * 1000);

        var hh = 0;
        if (timeInSeconds > 3600) {
            hh = date.getUTCHours();
        }
        var mm = date.getUTCMinutes();
        var ss = date.getSeconds();

        // If you were building a timestamp instead of a duration, you would uncomment the following line to get 12-hour (not 24) time
        // if (hh > 12) {hh = hh % 12;}
        // These lines ensure you have two-digits
        if (hh < 10) {
            hh = "0" + hh;
        }
        if (mm < 10) {
            mm = "0" + mm;
        }
        if (ss < 10) {
            ss = "0" + ss;
        }
        // This formats your string to HH:MM:SS
        return trimZerosFromTime(hh + ":" + mm + ":" + ss);
    }

    function trimZerosFromTime(time) {
        if (time.startsWith('0') || time.startsWith(':')) {
            return trimZerosFromTime(time.substring(1, time.length));
        }

        return time;
    }

    $.bind('command', function (event) {
        var sender = event.getSender(), // Gets the person who used the command
                command = event.getCommand(), // Gets the command being used
                args = event.getArgs(), // Arguments used in the command

                action = args[0];


        // Put in Kentobot System file
        if (command.equalsIgnoreCase("startstream")) {

            // Clear Song History
            $.clearSongHistory();
            $.say($.lang.get('kentobot.startstream.clearhistory'));

            // Reset bump counts
            // Remove fulfilled free bumps
            var bumps = $.inidb.GetKeyList('bumps', '');
            $.log.file('kentobotSystem', 'Saved bumps - ' + bumps);

            for (var i = 0; i < bumps.length; i++) {
                $.log.file('kentobotSystem', 'Bump found for ' + bumps[i]);

                var bumpObj = JSON.parse($.inidb.get("bumps", bumps[i]));
                if (bumpObj.hasOwnProperty('fulfilled')) {
                    var bumpFulfilled = bumpObj.fulfilled;
                    var method = bumpObj.method;
                    var type = bumpObj.type;
                    if (bumpFulfilled.equalsIgnoreCase("true") || method.equalsIgnoreCase("raid") || type.equalsIgnoreCase("free")) {
                        $.log.file('kentobotSystem', 'Deleting bump data for ' + bumps[i]);
                        $.inidb.del('bumps', bumps[i]);
                    }
                }

                if (bumpObj.hasOwnProperty("method") && "sotn".equalsIgnoreCase(bumpObj.method)) {
                    if (!bumpObj.hasOwnProperty("clearOnNext")) {
                        bumpObj.clearOnNext = 'true';
                        $.setIniDbString('bumps', bumps[i], JSON.stringify(bumpObj));
                    } else {
                        $.inidb.del('bumps', bumps[i]);
                    }
                }
            }
            $.say($.lang.get('kentobot.startstream.resetbumps'));

            // Open the queue - may need hook back to YouTube Player
            $.enableSongRequests();
            $.say($.lang.get('kentobot.startstream.requests.open'));

            // Set play mode to shuffle
            $.toggleQueueShuffle();
            $.say($.lang.get('kentobot.startstream.shuffle.on'));

            // Create and load new SOTN Contenders Playlist
            $.createNewSOTNPlaylist();
            $.say($.lang.get('kentobot.startstream.sotn.playlist'));

            var connectedPlayerClient = $.getConnectedPlayerClient();
            if (connectedPlayerClient) {
                connectedPlayerClient.pushPlayList();
            }

            $.say($.lang.get('kentobot.startstream.shuffle.ready'));

        }
    });

    $.secondsToTimestamp = secondsToTimestamp;
    $.trimZerosFromTime = trimZerosFromTime;

    /**
     * @event initReady
     */
    $.bind('initReady', function () {
        // `script` is the script location.
        // `command` is the command name without the `!` prefix.
        // `permission` is the group number. 0, 1, 2, 3, 4, 5, 6 and 7.
        // These are also used for the permcom command.
        // $.registerChatCommand('script', 'command', 'permission');

        $.registerChatCommand('./custom/kentobotSystem.js', 'startstream', 0);
    });
})();


