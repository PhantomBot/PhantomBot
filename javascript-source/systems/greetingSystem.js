/*
 * Copyright (C) 2016-2019 phantombot.tv
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
 * greetingSystem.js
 *
 * Tags in greetings:
 * - (name) The username corresponding to the target user
 */
(function() {
    var autoGreetEnabled = $.getSetIniDbBoolean('greeting', 'autoGreetEnabled', false),
        defaultJoinMessage = $.getSetIniDbString('greeting', 'defaultJoin', '(name) joined!'),
        greetingCooldown = $.getSetIniDbNumber('greeting', 'cooldown', (6 * 36e5)),
        /* 6 Hours */
        greetingQueue = new java.util.concurrent.ConcurrentLinkedQueue,
        lastAutoGreet = $.systemTime();

    /**
     * @event ircChannelJoin
     */
    $.bind('ircChannelJoin', function(event) {
        if ($.isOnline($.channelName) && autoGreetEnabled) {
            var sender = event.getUser().toLowerCase(),
                username = $.resolveRank(sender),
                message = $.getIniDbString('greeting', sender, ''),
                lastUserGreeting = $.getIniDbNumber('greetingCoolDown', sender, 0),
                now = $.systemTime();

            if (lastUserGreeting + greetingCooldown < now) {
                if (message) {
                    greetingQueue.add(message.replace('(name)', username));
                    $.inidb.set('greetingCoolDown', sender, now);
                }
            }
        }
    });

    /**
     * @function doUserGreetings
     * Provides timer function for sending greetings into chat. Will delete messages if the 
     * host disables autoGreetings in the middle of a loop.  The reason for a delay is to
     * ensure that the output queue does not become overwhelmed.
     */
    function doUserGreetings() {
        setInterval(function() {

            /* Send a greeting out into chat. */
            if (!greetingQueue.isEmpty() && autoGreetEnabled) {
                $.say(greetingQueue.poll());
            }

            /* There are greetings, however, autoGreet has been disabled, so destroy the queue. */
            if (!greetingQueue.isEmpty() && !autoGreetEnabled) {
                greetingQueue = new java.util.concurrent.ConcurrentLinkedQueue;
            }

        }, 15000, 'scripts::systems::greetingSystem.js');
    }

    /**
     * @function greetingspanelupdate
     */
    function greetingspanelupdate() {
        autoGreetEnabled = $.getIniDbBoolean('greeting', 'autoGreetEnabled');
        defaultJoinMessage = $.getIniDbString('greeting', 'defaultJoin');
        greetingCooldown = $.getIniDbNumber('greeting', 'cooldown');
    }

    /**
     * @event command
     */
    $.bind('command', function(event) {
        var sender = event.getSender().toLowerCase(),
            command = event.getCommand(),
            args = event.getArgs(),
            action = args[0],
            cooldown,
            message;

        /**
         * @commandpath greeting - Base command for controlling greetings.
         */
        if (command.equalsIgnoreCase('greeting')) {
            if (!action) {
                if ($.isAdmin(sender)) {
                    $.say($.whisperPrefix(sender) + $.lang.get('greetingsystem.generalusage.admin'));
                } else {
                    $.say($.whisperPrefix(sender) + $.lang.get('greetingsystem.generalusage.other'));
                }
                return;
            }

            /**
             * @commandpath greeting cooldown [hours] - Cooldown in hours before displaying a greeting for a person rejoining chat.
             */
            if (action.equalsIgnoreCase('cooldown')) {
                if (!args[1]) {
                    $.say($.whisperPrefix(sender) + $.lang.get('greetingsystem.cooldown.usage'));
                    return;
                }
                cooldown = parseInt(args[1]);
                if (isNaN(cooldown)) {
                    $.say($.whisperPrefix(sender) + $.lang.get('greetingsystem.cooldown.usage'));
                    return;
                }

                greetingCooldown = cooldown * 36e5; // Convert hours to ms
                $.inidb.set('greeting', 'cooldown', greetingCooldown);
                $.say($.whisperPrefix(sender) + $.lang.get('greetingsystem.cooldown.success', cooldown));
                return;
            }

            /**
             * @commandpath greeting toggle - Enable/disable the greeting system.
             */
            if (action.equalsIgnoreCase('toggle')) {
                autoGreetEnabled = !autoGreetEnabled;
                $.setIniDbBoolean('greeting', 'autoGreetEnabled', autoGreetEnabled);
                if (autoGreetEnabled) {
                    $.say($.whisperPrefix(sender) + $.lang.get('greetingsystem.set.autogreet.enabled', $.username.resolve($.botName)));
                } else {
                    $.say($.whisperPrefix(sender) + $.lang.get('greetingsystem.set.autogreet.disabled', $.username.resolve($.botName)));
                }
            }

            /**
             * @commandpath greeting setdefault - Set the default greeting message
             */
            if (action.equalsIgnoreCase('setdefault')) {
                message = args.splice(1, args.length - 1).join(' ');

                if (!message) {
                    $.say($.whisperPrefix(sender) + $.lang.get('greetingsystem.generalusage.admin'));
                    return;
                }

                $.inidb.set('greeting', 'defaultJoin', message);
                defaultJoinMessage = message;
                $.say($.whisperPrefix(sender) + $.lang.get('greetingsystem.set.default.success', defaultJoinMessage));
            }

            /**
             * @commandpath greeting enable [default | message] - Enable greetings and use the default or set a message.
             */
            if (action.equalsIgnoreCase('enable')) {
                message = args.splice(1, args.length - 1).join(' ');

                if (!message) {
                    $.say($.whisperPrefix(sender) + $.lang.get('greetingsystem.generalusage.other'));
                    return;
                }

                if (message.equalsIgnoreCase('default')) {
                    $.inidb.set('greeting', sender, defaultJoinMessage);
                } else {
                    $.inidb.set('greeting', sender, message);
                }
                $.say($.whisperPrefix(sender) + $.lang.get('greetingsystem.set.personal.success', $.inidb.get('greeting', sender)));
            }

            /**
             * @commandpath greeting disable - Delete personal greeting and automated greeting at join
             */
            if (action.equalsIgnoreCase('disable')) {
                if ($.inidb.exists('greeting', sender)) {
                    $.inidb.del('greeting', sender);
                    $.say($.whisperPrefix(sender) + $.lang.get('greetingsystem.remove.personal.success'));
                }
            }
        }
    });

    /**
     * @event initReady
     */
    $.bind('initReady', function() {
        $.registerChatCommand('./systems/greetingSystem.js', 'greeting', 6);
        $.registerChatSubcommand('greeting', 'cooldown', 1);
        $.registerChatSubcommand('greeting', 'toggle', 1);
        $.registerChatSubcommand('greeting', 'setdefault', 2);
        $.registerChatSubcommand('greeting', 'enable', 6);
        $.registerChatSubcommand('greeting', 'disable', 6);

        doUserGreetings();
    });

    $.greetingspanelupdate = greetingspanelupdate;
})();
