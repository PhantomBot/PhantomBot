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

    $.bind('command', function (event) {
        var sender = event.getSender(), // Gets the person who used the command
                command = event.getCommand(), // Gets the command being used
                args = event.getArgs(), // Arguments used in the command

                action = args[0];


        // Put in Kentobot System file
        if (command.equalsIgnoreCase("startstream")) {

            // Clear Song History
            currentPlaylist.clearSongHistory();
            $.say($.lang.get('kentobot.startstream.clearhistory'));

            // Reset bump counts
            // TODO Needs hook to queueManagement/bump system where bumps will be managed
            bumpedUsers = [];
            $.clearBumpedUsers();

            // Open the queue - may need hook back to YouTube Player
            songRequestsEnabled = true;
            $.setIniDbBoolean('ytSettings', 'songRequestsEnabled', songRequestsEnabled);
            $.say($.lang.get('kentobot.startstream.requests.open'));

            // Set play mode to sequential
            shuffleQueue = true;
            $.setIniDbBoolean('ytSettings', 'shuffleQueue', shuffleQueue);
            $.say($.lang.get('kentobot.startstream.shuffle.on'));

            // Create and load new SOTN Contenders Playlist
            // TODO Needs a hook back to the YouTube player
            var currentDate = $.getCurLocalTimeString('yyyy.MM.dd');
            var playlistName = "Song of the Night Contenders " + currentDate;
            var requestedPlaylist = new BotPlayList(playlistName, true);
            currentPlaylist.loadNewPlaylist(playlistName);
            loadPanelPlaylist();

            $.say("Loading new Song of the Night contenders playlist");

            // Load Saved Bumps
            // TODO Remove because this should be obsolete once bumps are saved to the DB and checked when the sr is made
            var user = $.inidb.get("sotn", "winner");
            var streamsSinceSOTNRedeem = $.inidb.get("sotn", "streams-since-redeem");

            if (user != null && streamsSinceSOTNRedeem < 1) {
                currentPlaylist.setSOTNWinner(user);
                currentPlaylist.setSOTNBump(true);

                // Take this part out before release
                $.say("Loading Previous Song of the Night Winner (" + user + ")");
            }

            if (connectedPlayerClient) {
                connectedPlayerClient.pushPlayList();
            }
        }
        ;

        // TODO Add command or functionality to reset bump reward

        // TODO Add command to set reward levels for DB
    });

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


