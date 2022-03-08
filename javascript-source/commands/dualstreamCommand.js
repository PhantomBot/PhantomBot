/*
 * Copyright (C) 2016-2022 phantombot.github.io/PhantomBot
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
    var otherChannels = $.getSetIniDbString('dualStreamCommand', 'otherChannels', 'Channel-1 Channel-2'),
        timerToggle = $.getSetIniDbBoolean('dualStreamCommand', 'timerToggle', false),
        timerInterval = $.getSetIniDbNumber('dualStreamCommand', 'timerInterval', 20),
        reqMessages = $.getSetIniDbNumber('dualStreamCommand', 'reqMessages', 10),
        messageCount = 0,
        lastSent = 0;

    /*
     * @function reloadMulti
     */
    function reloadMulti() {
        otherChannels = $.getIniDbString('dualStreamCommand', 'otherChannels');
        timerToggle = $.getIniDbBoolean('dualStreamCommand', 'timerToggle');
        timerInterval = $.getIniDbNumber('dualStreamCommand', 'timerInterval');
        reqMessages = $.getIniDbNumber('dualStreamCommand', 'reqMessages');
    }

    /*
     * @event ircChannelMessage
     */
    $.bind('ircChannelMessage', function(event) {
        messageCount++;
    });

    /*
     * @event command
     */
    $.bind('command', function(event) {
        var sender = event.getSender(),
            command = event.getCommand(),
            args = event.getArgs(),
            argsString = event.getArguments(),
            action = args[0],
            subAction = args[1];

        /*
         * @commandpath multi - Displays the current multi-link information of the usage
         */
        if (command.equalsIgnoreCase('multi')) {
            if (action === undefined) {
                if (!otherChannels.equals('Channel-1 Channel-2')) {
                    $.say($.lang.get('dualstreamcommand.link') + $.channelName + '/' + otherChannels.split(' ').join('/'));
                } else {
                    if ($.isModv3(sender, event.getTags())) {
                        $.say($.whisperPrefix(sender) + $.lang.get('dualstreamcommand.usage'));
                    }
                }
                return;
            }

            /*
             * @commandpath multi set [channels] - Adds a space-delimited list of channels to the multi-link (local channel already added)
             */
            if (action.equalsIgnoreCase('set')) {
                if (subAction === undefined) {
                    $.say($.whisperPrefix(sender) + $.lang.get('dualstreamcommand.set.usage'));
                    return;
                }

                otherChannels = args.slice(1).join('/').replace(/\/\//g, '/');

                $.say($.lang.get('dualstreamcommand.link.set', $.channelName + '/' + otherChannels));
                $.inidb.set('dualStreamCommand', 'otherChannels', otherChannels);
                return;
            }

            /*
             * @commandpath multi clear - Clears the multi-links and disables the timer
             */
            if (action.equalsIgnoreCase('clear')) {
                otherChannels = 'Channel-1 Channel-2';
                timerToggle = false;

                $.say($.whisperPrefix(sender) + $.lang.get('dualstreamcommand.clear'));
                $.inidb.set('dualStreamCommand', 'timerToggle', timerToggle);
                $.inidb.del('dualStreamCommand', 'otherChannels');
                return;
            }

            /*
             * @commandpath multi timer [on / off] - Enable or disabled the multi-links timer
             */
            if (action.equalsIgnoreCase('timer')) {
                if (subAction === undefined) {
                    $.say($.whisperPrefix(sender) + $.lang.get('dualstreamcommand.timer.usage'));
                    return;
                }

                timerToggle = subAction.equalsIgnoreCase('on');
                $.say($.whisperPrefix(sender) + (timerToggle ? $.lang.get('dualstreamcommand.timer.enabled') : $.lang.get('dualstreamcommand.timer.disabled')));
                $.inidb.set('dualStreamCommand', 'timerToggle', timerToggle);
                return;
            }

            /*
             * @commandpath multi timerinterval [time in minutes] - Set the interval for the multi-links timer
             */
            if (action.equalsIgnoreCase('timerinterval')) {
                if (subAction === undefined) {
                    $.say($.whisperPrefix(sender) + $.lang.get('dualstreamcommand.timerinterval.usage'));
                    return;
                } else if (parseInt(subAction) < 5) {
                    $.say($.whisperPrefix(sender) + $.lang.get('dualstreamcommand.timerinterval.err'));
                    return;
                }

                timerInterval = parseInt(subAction);

                $.say($.whisperPrefix(sender) + $.lang.get('dualstreamcommand.timerinterval.set', timerInterval));
                $.inidb.set('dualStreamCommand', 'timerInterval', timerInterval);
                reloadMulti();
            }

            /*
             * @commandpath multi reqmessage [amount of messages] - Set the amount of message required before triggering the dual stream link
             */
            if (action.equalsIgnoreCase('reqmessage')) {
                if (subAction === undefined) {
                    $.say($.whisperPrefix(sender) + $.lang.get('dualstreamcommand.req.usage'));
                    return;
                }

                reqMessages = parseInt(subAction);

                $.say($.whisperPrefix(sender) + $.lang.get('dualstreamcommand.reqmessages.set', reqMessages));
                $.inidb.set('dualStreamCommand', 'reqMessages', reqMessages);
            }
        }

        /*
         * Panel command, no command path needed here.
         */
        if (command.equalsIgnoreCase('reloadmulti')) {
            reloadMulti();
        }
    });

    /*
     * @event initReady
     */
    $.bind('initReady', function() {
        $.registerChatCommand('./commands/dualstreamCommand.js', 'multi', 7);
        $.registerChatCommand('./commands/dualstreamCommand.js', 'reloadmulti', 1);

        $.registerChatSubcommand('multi', 'set', 2);
        $.registerChatSubcommand('multi', 'clear', 2);
        $.registerChatSubcommand('multi', 'timer', 2);
        $.registerChatSubcommand('multi', 'timerinterval', 1);
        $.registerChatSubcommand('multi', 'reqmessage', 1);

        /*
         * interval timer.
         */
        var interval = setInterval(function() {
            if (timerToggle && !otherChannels.equals('Channel-1 Channel-2')) {
                if ($.isOnline($.channelName) && messageCount >= reqMessages && $.systemTime() >= lastSent) {
                    $.say($.lang.get('dualstreamcommand.link') + $.channelName + '/' + otherChannels.split(' ').join('/'));
                    lastSent = ($.systemTime() + (timerInterval * 6e4));
                    messageCount = 0;
                }
            }
        }, 10e3);
    });
})();
