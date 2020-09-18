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
    var userToBump = "",
            requireOverride = false,
            requestToBump,
            bumpPosition;

    /** END CONSTRUCTOR BumpedUser **/

    $.bind('ircChannelMessage', function (event) {
        if ($.isModv3(event.getSender()) && requireOverride === true && event.getMessage().equalsIgnoreCase("allow")) {
            performBump();
        }
    });

    // TODO Make this function work with move and bump, use an argument to indicate which messages to load?
    function performBump(bumpData) {
        var existingRequest = $.getUserRequest(userToBump);
        if (existingRequest != null) {
            existingRequest[0].setBumpFlag();
            $.currentPlaylist().addToQueue(existingRequest[0], bumpPosition);
            $.getConnectedPlayerClient().pushSongList();
            $.say($.whisperPrefix(userToBump) + $.lang.get('songqueuemgmt.command.bump.success', bumpPosition + 1));

            var bumpData = JSON.parse($.getIniDbString("bumps", userToBump, '{}'));

            bumpData.type = 'free';
            bumpData.fulfilled = 'true';

            $.log.file('queue-management', 'Saving new bump data');

            $.setIniDbString('bumps', userToBump, JSON.stringify(bumpData));
        } else {
            $.say($.whisperPrefix(userToBump) + $.lang.get('songqueuemgmt.command.move.none', userToBump));
        }

        resetBump();
    }

    function resetBump() {
        // Reset the bump variables
        userToBump = "";
        requireOverride = false;
        requestToBump = null;
        bumpPosition = 0;
    }

    function getBumpData(user) {
        $.log.file('queue-management', 'Looking for bump data for user [' + user + ']');

        var bumpData = JSON.parse($.getIniDbString("bumps", user, '{}'));

        if (!bumpData.hasOwnProperty('fulfilled')) {
            $.log.file('queue-management', 'Didn\'t find bump data for user, creating one');
            bumpData.type = "free";
            $.setIniDbString('bumps', userToBump, JSON.stringify(bumpData));
        }

        return bumpData;
    }

    function checkUserBumps(bumpData) {
        if (bumpData == null) {
            $.log.file('queue-management', 'No stored bump information for user');
            return false;
        }

        if (bumpData.hasOwnProperty('fulfilled')) {
            return bumpData.fulfilled;
        } else {
            return false;
        }
    }

    $.bind('command', function (event) {
        var sender = event.getSender(), // Gets the person who used the command
                command = event.getCommand(), // Gets the command being used
                args = event.getArgs(); // Arguments used in the command

        if (command.equalsIgnoreCase('bump')) {
            if (!args[0]) {
                $.say($.whisperPrefix(sender) + $.lang.get('ytplayer.command.bump.usage'));
                return;
            }

            if (!args[1]) {
                bumpPosition = $.getBumpPosition();
            } else {
                if (isNaN(parseInt(args[1]))) {
                    bumpPosition = $.getBumpPosition();
                } else {
                    bumpPosition = args[1] - 1;
                }
            }

            if (bumpPosition > $.currentPlaylist().getRequestsCount()) {
                $.say($.whisperPrefix(sender) + $.lang.get('songqueuemgmt.command.move.error.length', $.currentPlaylist.getRequestsCount()));
                return;
            }

            userToBump = args[0];
            var requestsList = $.currentPlaylist().getRequestList();

            if (userToBump.startsWith("@")) {
                userToBump = userToBump.substring(1, userToBump.length());
            }

            if (requestsList.length == 0) {
                $.say($.whisperPrefix(sender) + $.lang.get('ytplayer.queue.empty'));
                return;
            }

            /*
             *  TODO Check if the user has reached their max bumps
             */

            var bumpData = getBumpData(userToBump);
            var bumpLimitReached = checkUserBumps(bumpData);
            if (bumpLimitReached) {
                $.say($.whisperPrefix(sender) + $.lang.get('songqueuemgmt.command.bump.limit.reached', userToBump));
                requireOverride = true;

                // Close the bump window after 30 seconds
                setTimeout(function () {
                    resetBump();
                }, (1e4));
            } else {
                performBump(bumpData);
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
                $.say($.whisperPrefix(sender) + $.lang.get('songqueuemgmt.command.move.error.length', $.currentPlaylist.getRequestsCount()));
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

        if (command.equalsIgnoreCase('bumpcount')) {
            var count = $.getBumpPosition();

            if (count == 1) {
                $.say($.lang.get('songqueuemgmt.command.bump.count', 'is 1'));
            } else {
                $.say($.lang.get('songqueuemgmt.command.bump.count', 'are ' + count));
            }

            return;
        }

        if (command.equalsIgnoreCase('raidtest')) {
            saveRaidFromUsername("username", 50);
        }

        if (command.equalsIgnoreCase('position')) {
            var request = $.getUserRequest(sender);
            if (request == null) {
                $.say($.whisperPrefix(sender) + $.lang.get('ytplayer.command.position.none'));
            } else {
                var i = request[1];
                if (i == 0) {
                    playTime = "It's up next!";
                } else {
                    playTime = "There is " + $.secondsToTimestamp(request[2]) + " worth of music before your song";
                }

                if ($.isQueueShuffleEnabled() && !request[0].isBump()) {
                    $.say($.whisperPrefix(sender) + $.lang.get('ytplayer.command.position.shuffle'));
                    return;
                } else {
                    $.say($.whisperPrefix(sender) + $.lang.get('ytplayer.command.position.success', (i + 1), playTime));
                }
            }

            return;
        }

        if (command.equalsIgnoreCase('bumpxfer')) {
            /*
             * TODO
             * Check that user has a bump redeemed already
             * Check that recipient to has a song in the queue
             * Mark recipient song as a bump and move to top
             * Mark gifter bump as redeemed
             * If gifter has a bumped song, remove bump and move back into the main queue
             */

            if (!(args[0] && args[1])) {
                $.say($.whisperPrefix(sender) + $.lang.get('songqueuemgmt.autobump.xfer.usage'));
                return;
            }

            var bumpObj = JSON.parse($.getIniDbString('bumps', args[0], '{}'));
            var bumpFulfilled;
            if (bumpObj.hasOwnProperty('fulfilled')) {
                bumpFulfilled = (bumpObj.fulfilled == 'true');

                if (bumpFulfilled) {
                    $.say($.whisperPrefix(sender) + $.lang.get('songqueuemgmt.autobump.xfer.used', args[0]));
                    return;
                } else {
                    // Remove the gifter's bump
                    $.inidb.del('bumps', args[0]);
                    var request = $.getUserRequest(args[0]);
                    if (request != null) {
                        request[0].clearBumpFlag();
                        var newPosition = $.getBumpPosition();

                        if (newPosition != 0) {
                            newPosition++;
                        }

                        $.currentPlaylist().addToQueue(request[0], newPosition);
                        $.getConnectedPlayerClient().pushSongList();
                    }

                    // Create new bump for new user
                    autoBump(args[1], 'free', 'gift');

                    $.say($.whisperPrefix(sender) + $.lang.get('songqueuemgmt.autobump.xfer.success', args[0], args[1]));
                }
            } else {
                $.say($.whisperPrefix(sender) + $.lang.get('songqueuemgmt.autobump.remove.404', args[0]));
            }
        }

        if (command.equalsIgnoreCase('removebump')) {
            if (!args[0]) {
                $.say($.whisperPrefix(sender) + $.lang.get('songqueuemgmt.autobump.remove.usage'));
                return;
            }

            var bumpObj = JSON.parse($.getIniDbString('bumps', args[0], '{}'));
            var bumpFulfilled;
            if (bumpObj.hasOwnProperty('fulfilled')) {
                bumpFulfilled = (bumpObj.fulfilled == 'true');

                if (bumpFulfilled) {
                    $.say($.whisperPrefix(sender) + $.lang.get('songqueuemgmt.autobump.remove.used', args[0]));
                    return;
                } else {
                    $.inidb.del('bumps', args[0]);
                    var request = $.getUserRequest(args[0]);
                    if (request != null) {
                        request[0].clearBumpFlag();
                        var newPosition = $.getBumpPosition();

                        if (newPosition != 0) {
                            newPosition++;
                        }

                        $.currentPlaylist().addToQueue(request[0], newPosition);
                        $.getConnectedPlayerClient().pushSongList();
                    }
                    $.say($.whisperPrefix(sender) + $.lang.get('songqueuemgmt.autobump.remove.success', args[0]));
                }
            } else {
                $.say($.whisperPrefix(sender) + $.lang.get('songqueuemgmt.autobump.remove.404', args[0]));
            }
        }
    });

    function autoBump(user, type, method) {
        $.log.file('queue-management', '-------------------');
        $.log.file('queue-management', 'Running auto-bump for user [' + user + '], method [' + method + ']');

        $.log.file('queue-management', 'Checking database for existing bump data');
        var bumpObj = JSON.parse($.getIniDbString('bumps', user, '{}'));

        var bumpFulfilled;
        if (bumpObj.hasOwnProperty('fulfilled')) {
            bumpFulfilled = (bumpObj.fulfilled == 'true');
        } else {
            bumpFulfilled = false;

            bumpObj.bits = '0';
            bumpObj.donation = '0';
            bumpObj.fulfilled = 'false';
            bumpObj.type = type + '';
        }

        if (!bumpFulfilled) {
            $.log.file('queue-management', 'Bump has not been fulfilled, looking for user in the queue to bump');

            var userRequest = $.getUserRequest(user);

            if (userRequest != null) {
                $.log.file('queue-management', 'Found user request, bumping');

                userRequest[0].setBumpFlag();

                $.currentPlaylist().addToQueue(userRequest[0], $.getBumpPosition());
                $.getConnectedPlayerClient().pushSongList();

                $.say($.whisperPrefix(user) + $.lang.get('songqueuemgmt.command.bump.success', $.getBumpPosition() + 1));
            } else {
                $.log.file('queue-management', 'No request found for user, saving for their next request');

                $.say($.whisperPrefix(user) + $.lang.get('songqueuemgmt.autobump.nextsong'));

            }

            bumpObj.method = method + '';

            $.log.file('queue-management', 'Saving bump data to DB');
            $.setIniDbString('bumps', user, JSON.stringify(bumpObj));

            $.log.file('queue-management', 'Autobump complete');
        } else {
            $.log.file('queue-management', 'Bump has already been fulfilled');
        }
    }

    $.autoBump = autoBump;

    /**
     * @event initReady
     */
    $.bind('initReady', function () {
        // `script` is the script location.
        // `command` is the command name without the `!` prefix.
        // `permission` is the group number. 0, 1, 2, 3, 4, 5, 6 and 7.
        // These are also used for the permcom command.
        // $.registerChatCommand('script', 'command', 'permission');

        $.registerChatCommand('./custom/queueManagementSystem.js', 'bump', 2);
        $.registerChatCommand('./custom/queueManagementSystem.js', 'move', 2);
        $.registerChatCommand('./custom/queueManagementSystem.js', 'bumplimit', 2);
        $.registerChatCommand('./custom/queueManagementSystem.js', 'bumpcount', 2);
        $.registerChatCommand('./custom/queueManagementSystem.js', "position");

        $.registerChatCommand('./custom/queueManagementSystem.js', "bumpxfer", 2);
        $.registerChatCommand('./custom/queueManagementSystem.js', "removebump", 2);

        $.registerChatCommand('./custom/queueManagementSystem.js', "readd", 2);

        $.registerChatCommand('./custom/queueManagementSystem.js', "raidtest");
    });
})();