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
    var bumpedUsers = [],
            bumpLimit = $.getSetIniDbNumber('songqueuemgmt', 'bumpLimit', 1);

    /**
     @class
     @description This class holds a user and the number of times they have been bumped
     @param {string} user
     */
    function BumpedUser(username) {
        var bumpCount = 0;

        this.getBumpCount = function () {
            return bumpCount;
        };

        this.getUser = function () {
            return username;
        };

        this.incrementBumpCount = function () {
            bumpCount++;
        };
    }

    /** END CONSTRUCTOR BumpedUser **/

    $.bind('command', function (event) {
        var sender = event.getSender(), // Gets the person who used the command
                command = event.getCommand(), // Gets the command being used
                args = event.getArgs(), // Arguments used in the command

                action = args[0];

        if (command.equalsIgnoreCase('bumplimit')) {
            if (!args[0]) {
                $.say($.whisperPrefix(sender) + $.lang.get('songqueuemgmt.command.bumplimit.usage'));
                return;
            }

            if (isNaN(parseInt(args[0])) && !args[0].equalsIgnoreCase('off')) {
                $.say($.whisperPrefix(sender) + $.lang.get('songqueuemgmt.command.bumplimit.usage'));
                return;
            }

            var message;
            if (args[0].equalsIgnoreCase('off')) {
                bumpLimit = 999;
                message = $.lang.get('songqueuemgmt.command.bumplimit.success.off');
            } else {
                bumpLimit = parseInt(args[0]);
                message = $.lang.get('songqueuemgmt.command.bumplimit.success', bumpLimit);
            }

            $.inidb.set('songqueuemgmt', 'bumplimit', bumpLimit);
            $.say(message);
            return;
        }

        if (command.equalsIgnoreCase('bump')) {
            if (!args[0]) {
                $.say($.whisperPrefix(sender) + $.lang.get('ytplayer.command.bump.usage'));
                return;
            }

            var bumper = args[0];
            var requestsList = $.currentPlaylist().getRequestList();

            if (bumper.startsWith("@")) {
                bumper = bumper.substring(1, bumper.length());
            }

            if (requestsList.length == 0) {
                $.say($.whisperPrefix(sender) + $.lang.get('ytplayer.queue.empty'));
                return;
            }

            var position, override = false;
            if (!args[1]) {
                position = 0;
            } else {
                if (isNaN(parseInt(args[1])) && args[1].equalsIgnoreCase("allow")) {
                    override = true;
                    position = 0;
                } else {
                    position = args[1] - 1;
                }
            }

            if (position > $.currentPlaylist().getRequestsCount()) {
                $.say($.whisperPrefix(sender) + $.lang.get('songqueuemgmt.command.move.error.length', currentPlaylist.getRequestsCount()));
                return;
            }

            if (args[2]) {
                if (args[2].equalsIgnoreCase("allow")) {
                    override = true;
                }
            }

            var i, requestFound = false;
            var existingRequest;
            for (i = 0; i < requestsList.length; i++) {
                existingRequest = requestsList[i];

                if (existingRequest.getOwner().equalsIgnoreCase(bumper)) {
                    requestFound = true;
                    break;
                }
            }

            // Look for bumped user in list
            var bumpedUser, bumpedUserFound = false;
            for (i = 0; i < bumpedUsers.length; i++) {
                bumpedUser = bumpedUsers[i];
                if (bumpedUser.getUser().equalsIgnoreCase(bumper)) {
                    bumpedUserFound = true;
                    break;
                }
            }

            if (bumpedUserFound) {
                if (bumpedUser.getBumpCount() >= bumpLimit && !override) {
                    $.say($.whisperPrefix(sender) + $.lang.get('songqueuemgmt.command.bump.limit.reached', bumper));
                    return;
                }
            } else {
                bumpedUser = new BumpedUser(bumper);
            }

            if (requestFound) {
                existingRequest.setBumpFlag();
                $.currentPlaylist().addToQueue(existingRequest, position);
                $.getConnectedPlayerClient().pushSongList();
                $.say($.whisperPrefix(bumper) + $.lang.get('songqueuemgmt.command.bump.success'));

                bumpedUser.incrementBumpCount();
                bumpedUsers.push(bumpedUser);
            } else {
                $.say($.whisperPrefix(sender) + $.lang.get('songqueuemgmt.command.move.none', bumper));
            }
        }

        if (command.equalsIgnoreCase('move')) {
            if (!args[1]) {
                $.say($.whisperPrefix(sender) + $.lang.get('songqueuemgmt.command.move.usage'));
                return;
            }

            var requester = args[0];
            var newPosition = args[1];

            if (requester.startsWith("@")) {
                requester = requester.substring(1, requester.length);
            }

            if (newPosition > $.currentPlaylist().getRequestsCount()) {
                $.say($.whisperPrefix(sender) + $.lang.get('songqueuemgmt.command.move.error.length', currentPlaylist.getRequestsCount()));
                return;
            }

            var newQueuePosition = newPosition - 1;

            var requestsList = $.currentPlaylist().getRequestList();

            if (requestsList.length == 0) {
                $.say($.whisperPrefix(sender) + $.lang.get('ytplayer.queue.empty'));
                return;
            }

            var i, requestFound = false;
            var existingRequest;
            for (i = 0; i < requestsList.length; i++) {
                existingRequest = requestsList[i];

                if (existingRequest.getOwner().equalsIgnoreCase(requester)) {
                    requestFound = true;
                    break;
                }
            }

            if (requestFound) {
                $.currentPlaylist().addToQueue(existingRequest, newQueuePosition);
                $.getConnectedPlayerClient().pushSongList();

                $.say($.whisperPrefix(sender) + $.lang.get('songqueuemgmt.command.move.success', requester, newPosition));
            } else {
                $.say($.whisperPrefix(sender) + $.lang.get('songqueuemgmt.command.move.none', requester));
                return;
            }
        }

    });

    function clearBumpedUsers() {
        bumpedUsers = [];
        $.say($.lang.get('songqueuemgmt.startstream.clearbumps'));
    }

    $.clearBumpedUsers = clearBumpedUsers;

    /**
     * @event initReady
     */
    $.bind('initReady', function () {
        // `script` is the script location.
        // `command` is the command name without the `!` prefix.
        // `permission` is the group number. 0, 1, 2, 3, 4, 5, 6 and 7.
        // These are also used for the permcom command.
        // $.registerChatCommand('script', 'command', 'permission');

        $.registerChatCommand('./systems/custom/queueManagementSystem.js', 'bump', 2);
        $.registerChatCommand('./systems/custom/queueManagementSystem.js', 'move', 2);
        $.registerChatCommand('./systems/custom/queueManagementSystem.js', 'bumplimit', 2);
    });
})();