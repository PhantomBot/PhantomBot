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
    var raidToggle = $.getSetIniDbBoolean('raidSettings', 'raidToggle', false),
            newRaidIncMessage = $.getSetIniDbString('raidSettings', 'newRaidIncMessage', '(username) is raiding us with (viewers) viewers!'),
            raidIncMessage = $.getSetIniDbString('raidSettings', 'raidIncMessage', '(username) is raiding us with (viewers) viewers! This is the (times) time (username) has raided us!'),
            raidIncMinViewers = $.getSetIniDbNumber('raidSettings', 'raidMinViewers', 0),
            raidReward = $.getSetIniDbNumber('raidSettings', 'raidReward', 0),
            raidOutMessage = $.getSetIniDbString('raidSettings', 'raidOutMessage', 'We are going to raid (username)! Go to their channel (url) now!'),
            raidOutSpam = $.getSetIniDbNumber('raidSettings', 'raidOutSpam', 1),
            raidOutOfflineMessage = $.getSetIniDbString('raidSettings', 'raidOutOfflineMessage', null);

    /*
     * @function Reloads the raid variables from the panel.
     */
    function reloadRaid() {
        raidToggle = $.getIniDbBoolean('raidSettings', 'raidToggle');
        newRaidIncMessage = $.getIniDbString('raidSettings', 'newRaidIncMessage');
        raidIncMessage = $.getIniDbString('raidSettings', 'raidIncMessage');
        raidIncMinViewers = $.getSetIniDbNumber('raidSettings', 'raidMinViewers', 0);
        raidReward = $.getIniDbNumber('raidSettings', 'raidReward');
        raidOutMessage = $.getIniDbString('raidSettings', 'raidOutMessage');
        raidOutSpam = $.getIniDbNumber('raidSettings', 'raidOutSpam');
        raidOutOfflineMessage = $.getIniDbString('raidSettings', 'raidOutOfflineMessage');
    }

    /*
     * @function Saves the current raid from the user or adds it to the list if they raided in the past.
     *
     * @param {String} username
     * @param {String} viewers
     */
    function saveRaidFromUsername(username, viewers) {
        var raidObj = JSON.parse($.getIniDbString('incoming_raids', username, '{}'));

        if (raidObj.hasOwnProperty('totalRaids')) {
            // Increase total raids.
            raidObj.totalRaids = parseInt(raidObj.totalRaids) + 1;
            // Increase total viewers which the user has raided for in total (all time).
            raidObj.totalViewers = (parseInt(raidObj.totalViewers) + parseInt(viewers));
            // Update last raid time.
            raidObj.lastRaidTime = $.systemTime();
            // Last raid viewers.
            raidObj.lastRaidViewers = viewers;
            // Push this raid to the raids array.
            //raidObj.raids.push({
            //    time: $.systemTime(),
            //    viewers: viewers,
            //    username: username
            //});
        } else {
            // Increase total raids.
            raidObj.totalRaids = '1';
            // Increase total viewers.
            raidObj.totalViewers = viewers;
            // Update last raid time.
            raidObj.lastRaidTime = $.systemTime();
            // Last raid viewers.
            raidObj.lastRaidViewers = viewers;
            // Create new raid array.
            //raidObj.raids = [];
            // Push this raid to the raids array.
            //raidObj.raids.push({
            //    time: $.systemTime(),
            //    viewers: viewers,
            //    username: username
            //});
        }

        // Save the new object.
        $.setIniDbString('incoming_raids', username, JSON.stringify(raidObj));
    }

    /*
     * @function Saves the outgoing raid for the user or adds it to the list.
     *
     * @param {String} username
     * @param {String} viewers
     */
    function saveOutRaidForUsername(username, viewers) {
        var raidObj = JSON.parse($.getIniDbString('outgoing_raids', username, '{}'));

        if (raidObj.hasOwnProperty('totalRaids')) {
            // Increase total raids.
            raidObj.totalRaids = parseInt(raidObj.totalRaids) + 1;
            // Increase total viewers which the channel has raided the other channel for (all time).
            raidObj.totalViewers = (parseInt(raidObj.totalViewers) + parseInt(viewers));
            // Update last raid time.
            raidObj.lastRaidTime = $.systemTime();
            // Last raid viewers.
            raidObj.lastRaidViewers = viewers;
        } else {
            // Increase total raids.
            raidObj.totalRaids = '1';
            // Increase total viewers.
            raidObj.totalViewers = viewers;
            // Update last raid time.
            raidObj.lastRaidTime = $.systemTime();
            // Last raid viewers.
            raidObj.lastRaidViewers = viewers;
        }

        // Save the new object.
        $.setIniDbString('outgoing_raids', username, JSON.stringify(raidObj));
    }

    /*
     * @function Handles sending the messages in chat for outgoing raids.
     *
     * @param {String} username
     */
    function handleOutRaid(username) {
        var message = raidOutMessage;
        var offlinemsg = raidOutOfflineMessage;

        // Use the .raid command.
        $.say('.raid ' + username);

        // Replace tags.
        if (message.match(/\(username\)/)) {
            message = $.replace(message, '(username)', $.viewer.getByLogin(username).name());
        }

        if (message.match(/\(url\)/)) {
            message = $.replace(message, '(url)', 'https://twitch.tv/' + username);
        }

        // Spam the message, if needed.
        for (var i = 0; i < raidOutSpam; i++) {
            $.say(message);
        }

        if(!$.isOnline(username)){
            $.say(offlinemsg);
        }

        // Increment outgoing raids count for this target channel.
        saveOutRaidForUsername(username + '', $.getViewers($.channelName) + '');
    }

    /*
     * @event twitchRaid
     */
    $.bind('twitchRaid', function (event) {
        var username = event.getUsername(),
            viewers = event.getViewers(),
            hasRaided = false,
            raidObj,
            message;

        if (raidToggle === true && viewers >= raidIncMinViewers) {
            // If the user has raided before.
            let incRaids = $.optIniDbString('incoming_raids', username);
            if (incRaids.isPresent()) {
                hasRaided = true;
                // Set the message.
                message = raidIncMessage;
                // Get the raid object.
                raidObj = JSON.parse(incRaids.get());
            } else {
                message = newRaidIncMessage;
            }

            // Replace tags.
            if (message.match(/\(username\)/)) {
                message = $.replace(message, '(username)', username);
            }

            if (message.match(/\(viewers\)/)) {
                message = $.replace(message, '(viewers)', viewers);
            }

            if (message.match(/\(url\)/)) {
                message = $.replace(message, '(url)', 'https://twitch.tv/' + username);
            }

            if (message.match(/\(reward\)/)) {
                message = $.replace(message, '(reward)', raidReward);
            }

            if (message.match(/\(game\)/)) {
                message = $.replace(message, '(game)', $.getGame(username));
            }

            if (hasRaided && message.match(/\(times\)/)) {
                message = $.replace(message, '(times)', parseInt(raidObj.totalRaids) + 1);
            }

            if (message.match(/\(alert [,.\w\W]+\)/g)) {
                var filename = message.match(/\(alert ([,.\w\W]+)\)/)[1];
                $.alertspollssocket.alertImage(filename);
                message = (message + '').replace(/\(alert [,.\w\W]+\)/, '');
            }

            if (message.match(/\(playsound\s([a-zA-Z1-9_]+)\)/g)) {
                if (!$.audioHookExists(message.match(/\(playsound\s([a-zA-Z1-9_]+)\)/)[1])) {
                    $.log.error('Could not play audio hook: Audio hook does not exist.');
                } else {
                    $.alertspollssocket.triggerAudioPanel(message.match(/\(playsound\s([a-zA-Z1-9_]+)\)/)[1]);
                }
                message = $.replace(message, message.match(/\(playsound\s([a-zA-Z1-9_]+)\)/)[0], '');
            }

            if (message !== '') {
                $.say(message);
            }
        }

        // Add reward.
        if (raidReward > 0 && viewers >= raidIncMinViewers) {
            $.inidb.incr('points', username, raidReward);
        }

        // Save the raid to the database.
        saveRaidFromUsername(username + '', viewers + '');
    });

    /*
     * @event command
     */
    $.bind('command', function (event) {
        var sender = event.getSender(),
            command = event.getCommand(),
            args = event.getArgs(),
            action = args[0],
            subAction = args[1];

        if ($.equalsIgnoreCase(command, 'raid')) {
            if (action === undefined) {
                $.say($.whisperPrefix(sender) + $.lang.get('raidhandler.usage'));
                return;
            }

            /*
             * @commandpath raid toggle - Toggles if the bot should welcome raiders.
             */
            if ($.equalsIgnoreCase(action, 'toggle')) {
                raidToggle = !raidToggle;
                $.setIniDbBoolean('raidSettings', 'raidToggle', raidToggle);
                $.say($.whisperPrefix(sender) + (raidToggle ? $.lang.get('raidhandler.toggle.enabled') : $.lang.get('raidhandler.toggle.disabled')));
                return;
            }

            /*
             * @commandpath raid setreward [amount] - Sets the amount of points given to raiders.
             */
            if ($.equalsIgnoreCase(action, 'setreward')) {
                if (isNaN(subAction)) {
                    $.say($.whisperPrefix(sender) + $.lang.get('raidhandler.reward.usage'));
                    return;
                }

                raidReward = parseInt(subAction);
                $.setIniDbNumber('raidSettings', 'raidReward', raidReward);
                $.say($.whisperPrefix(sender) + $.lang.get('raidhandler.reward.set', $.getPointsString(raidReward)));
                return;
            }

            /*
             * @commandpath raid setincomingminviewers [amount] - Sets the minimum amount of viewers to trigger the raid message.
             */
            if ($.equalsIgnoreCase(action, 'setincomingminviewers')) {
                if (isNaN(subAction) || parseInt(subAction) < 0) {
                    $.say($.whisperPrefix(sender) + $.lang.get('raidhandler.minviewers.usage'));
                    return;
                }

                raidIncMinViewers = parseInt(subAction);
                $.setIniDbNumber('raidSettings', 'raidMinViewers', raidIncMinViewers);
                $.say($.whisperPrefix(sender) + $.lang.get('raidhandler.minviewers.set', raidIncMinViewers));
                return;
            }

            /*
             * @commandpath raid setincomingmessage [message] - Sets the incoming raid message - Tags: (username), (viewers), (url), (times), (reward) and (game)
             */
            if ($.equalsIgnoreCase(action, 'setincomingmessage')) {
                if (subAction === undefined) {
                    $.say($.whisperPrefix(sender) + $.lang.get('raidhandler.inc.message.usage'));
                    return;
                }

                raidIncMessage = args.slice(1).join(' ');
                $.setIniDbString('raidSettings', 'raidIncMessage', raidIncMessage);
                $.say($.whisperPrefix(sender) + $.lang.get('raidhandler.inc.message.set'));
                return;
            }

            /*
             * @commandpath raid setnewincomingmessage [message] - Sets the incoming raid message for first time raiders - Tags: (username), (viewers), (url), (reward) and (game)
             */
            if ($.equalsIgnoreCase(action, 'setnewincomingmessage')) {
                if (subAction === undefined) {
                    $.say($.whisperPrefix(sender) + $.lang.get('raidhandler.new.inc.message.usage'));
                    return;
                }

                newRaidIncMessage = args.slice(1).join(' ');
                $.setIniDbString('raidSettings', 'newRaidIncMessage', newRaidIncMessage);
                $.say($.whisperPrefix(sender) + $.lang.get('raidhandler.new.inc.message.set'));
                return;
            }

            /*
             * @commandpath raid setoutgoingmessage [message] - Sets the outgoing message for when you raid someone - Tags (username) and (url)
             */
            if ($.equalsIgnoreCase(action, 'setoutgoingmessage')) {
                if (subAction === undefined) {
                    $.say($.whisperPrefix(sender) + $.lang.get('raidhandler.out.message.usage'));
                    return;
                }

                raidOutMessage = args.slice(1).join(' ');
                $.setIniDbString('raidSettings', 'raidOutMessage', raidOutMessage);
                $.say($.whisperPrefix(sender) + $.lang.get('raidhandler.out.message.set'));
                return;
            }

            /*
             * @commandpath raid setoutgoingofflinemessage [message] - Sets a warning message which is added to chat when you use !raid on a channel that is offline.
             */
            if ($.equalsIgnoreCase(action, 'setoutgoingofflinemessage')) {
                if (subAction === undefined) {
                    $.say($.whisperPrefix(sender) + $.lang.get('raidhandler.out.messageoffline.usage'));
                    return;
                }

                raidOutOfflineMessage = args.slice(1).join(' ');
                $.setIniDbString('raidSettings', 'raidOutOfflineMessage', raidOutOfflineMessage);
                $.say($.whisperPrefix(sender) + $.lang.get('raidhandler.out.messageoffline.set'));
                return;
            }

            /*
             * @commandpath raid setoutgoingmessagespam [amount] - Sets the amount of times that the outgoing raid message is sent in chat. Maximum is 10 times.
             */
            if ($.equalsIgnoreCase(action, 'setoutgoingmessagespam')) {
                if (isNaN(subAction) || parseInt(subAction) > 10 || parseInt(subAction) < 1) {
                    $.say($.whisperPrefix(sender) + $.lang.get('raidhandler.spam.amount.usage'));
                    return;
                }

                raidOutSpam = parseInt(subAction);
                $.setIniDbNumber('raidSettings', 'raidOutSpam', raidOutSpam);
                $.say($.whisperPrefix(sender) + $.lang.get('raidhandler.spam.amount.set'));
                return;
            }

            /*
             * @commandpath raid lookup [username] - Shows the amount of times the username has raided the channel.
             */
            if ($.equalsIgnoreCase(action, 'lookup')) {
                if (subAction === undefined) {
                    $.say($.whisperPrefix(sender) + $.lang.get('raidhandler.lookup.usage'));
                    return;
                }

                let incRaids = $.optIniDbString('incoming_raids', subAction.toLowerCase());
                if (incRaids.isPresent()) {
                    var raidObj = JSON.parse(incRaids.get()),
                            displayName = $.viewer.getByLogin(subAction).name();

                    $.say($.whisperPrefix(sender) + $.lang.get('raidhandler.lookup.user', displayName, raidObj.totalRaids, new Date(raidObj.lastRaidTime).toLocaleString(), raidObj.lastRaidViewers));
                } else {
                    $.say($.whisperPrefix(sender) + $.lang.get('raidhandler.lookup.user.404', displayName));
                }
                return;
            }
            action = $.user.sanitize(action);
            // Make sure the user exists on Twitch.
            if ($.username.exists(action)) {
                handleOutRaid(action);
                return;
            }
            $.say($.whisperPrefix(sender) + $.lang.get('raidhandler.usage'));
        }
    });

    /*
     * @event initReady
     */
    $.bind('initReady', function () {
        $.registerChatCommand('./handlers/raidHandler.js', 'raid', $.PERMISSION.Admin);
        $.registerChatSubcommand('./handlers/raidHandler.js', 'raid', 'toggle', $.PERMISSION.Admin);
        $.registerChatSubcommand('./handlers/raidHandler.js', 'raid', 'setreward', $.PERMISSION.Admin);
        $.registerChatSubcommand('./handlers/raidHandler.js', 'raid', 'setincomingminviewers', $.PERMISSION.Admin);
        $.registerChatSubcommand('./handlers/raidHandler.js', 'raid', 'lookup', $.PERMISSION.Mod);
        $.registerChatSubcommand('./handlers/raidHandler.js', 'raid', 'setincomingmessage', $.PERMISSION.Admin);
        $.registerChatSubcommand('./handlers/raidHandler.js', 'raid', 'setnewincomingmessage', $.PERMISSION.Admin);
        $.registerChatSubcommand('./handlers/raidHandler.js', 'raid', 'setoutgoingmessage', $.PERMISSION.Admin);
        $.registerChatSubcommand('./handlers/raidHandler.js', 'raid', 'setoutgoingmessagespam', $.PERMISSION.Admin);
        $.registerChatSubcommand('./handlers/raidHandler.js', 'raid', 'setoutgoingofflinemessage', $.PERMISSION.Admin);
    });

    /* Export to API */
    $.reloadRaid = reloadRaid;
})();
