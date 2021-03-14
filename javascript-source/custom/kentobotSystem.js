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

    var mode = "";
    var startMessages = [
        "Flux capacitor, fluxing",
        "Hyperdrive engaged",
        "S-foils locked in attack position"
    ];

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

    function botMode() {
        return mode;
    }

    $.bind('command', function (event) {
        var sender = event.getSender(), // Gets the person who used the command
                command = event.getCommand(), // Gets the command being used
                args = event.getArgs(), // Arguments used in the command

                action = args[0];

        if (command.equalsIgnoreCase("mode")) {
            if (action == null) {
                $.say($.lang.get('kentobot.mode.usage'));
            }

            setMode(action);
        }

        if (command.equalsIgnoreCase("mode?")) {
            $.say($.lang.get('kentobot.mode.selection', mode));
        }

        if (command.equalsIgnoreCase("lurk")) {
            $.say($.whisperPrefix(sender) + $.lang.get('kentobot.lurk.' + mode));
        }

        if (command.equalsIgnoreCase("startstream")) {
            // Set stream mode
            if (action == null) {
                $.say($.lang.get('kentobot.mode.music'));
                mode = "music";
            } else {
                setMode(action);
            }

            if ("music".equalsIgnoreCase(mode)) {
                // Clear Song History
                $.clearSongHistory();
                $.say($.lang.get('kentobot.startstream.clearhistory'));

                $.resetBumps();
                $.resetChannelPointsBumps();
                $.resetBeanBumps();
                $.say($.lang.get('kentobot.startstream.resetbumps'));


                // Open the queue - may need hook back to YouTube Player
                $.enableSongRequests();
                $.say($.lang.get('kentobot.startstream.requests.open'));

                // Set play mode to shuffle
                $.toggleQueueShuffle();
                $.say($.lang.get('kentobot.startstream.shuffle.on'));

                // Enable auto-bumps
                $.enableAutobumps();
                $.say($.lang.get('kentobot.startstream.autobumps.on'));

                // Create and load new SOTN Contenders Playlist
                $.createNewSOTNPlaylist();
                $.say($.lang.get('kentobot.startstream.sotn.playlist'));

                // Load SOTN winner into pending bumps
                // TODO Load SOTN winner into the pending bumps table - do not increment counts
                $.loadSotnWinner();
                $.say($.lang.get('kentobot.startstream.sotn.load'));

                var connectedPlayerClient = $.getConnectedPlayerClient();
                if (connectedPlayerClient) {
                    connectedPlayerClient.pushPlayList();
                    connectedPlayerClient.pushQueueInformation();
                }
            }
            
            $.say(startMessages[Math.floor(Math.random() * startMessages.length)]);
            
            $.say($.lang.get('kentobot.startstream.shuffle.ready'));

        }
    });

    function setMode(modeSelection) {
        if (modeSelection.equalsIgnoreCase("music")) {
            mode = "music";
            $.say($.lang.get('kentobot.mode.music'));
        } else if (modeSelection.equalsIgnoreCase("game")) {
            mode = "game";
            $.say($.lang.get('kentobot.mode.game'));
        } else {
            $.say($.lang.get('kentobot.mode.invalid', modeSelection));
        }
    }

    $.secondsToTimestamp = secondsToTimestamp;
    $.trimZerosFromTime = trimZerosFromTime;
    $.botMode = botMode;

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
        $.registerChatCommand('./custom/kentobotSystem.js', 'mode', 2);
        $.registerChatCommand('./custom/kentobotSystem.js', 'mode?', 2);

        $.registerChatCommand('./custom/kentobotSystem.js', 'lurk');

        // Ensure the tables used by the UI pages are available, even if we haven't added data yet
        $.inidb.AddFile("sotn_winners");
    });
})();