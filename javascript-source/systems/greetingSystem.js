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

/* global Packages */

/**
 * greetingSystem.js
 *
 * Tags in greetings:
 * - (name) The username corresponding to the target user
 */
(function () {
    var autoGreetEnabled = $.getSetIniDbBoolean('greetingSettings', 'autoGreetEnabled', false),
            defaultJoinMessage = $.getSetIniDbString('greetingSettings', 'defaultJoin', '(name) joined!'),
            greetingCooldown = $.getSetIniDbNumber('greetingSettings', 'cooldown', (6 * 36e5)),
            /* 6 Hours */
            greetingQueue = new Packages.java.util.concurrent.ConcurrentLinkedQueue,
            onJoin = $.getSetIniDbBoolean('greetingSettings', 'onJoin', true),
            userSelfService = $.getSetIniDbBoolean('greetingSettings', 'userSelfService', false);

    /**
     * @event ircChannelJoin
     */
    $.bind('ircChannelJoin', function (event) {
        if ($.isOnline($.channelName) && autoGreetEnabled && onJoin) {
            addToQueue(event.getUser().toLowerCase());
        }
    });

    /**
     * @event ircChannelJoin
     */
    $.bind('ircChannelMessage', function (event) {
        if ($.isOnline($.channelName) && autoGreetEnabled && !onJoin) {
            addToQueue(event.getSender().toLowerCase());
        }
    });

    function addToQueue(sender) {
        var rankStr = $.resolveRank(sender),
                message = $.optIniDbString('greeting', sender),
                lastUserGreeting = $.getIniDbNumber('greetingCoolDown', sender, 0),
                now = $.systemTime();
        if (lastUserGreeting + greetingCooldown < now) {
            if (message.isPresent()) {
                greetingQueue.add(message.get().replace('(name)', rankStr));
                $.inidb.set('greetingCoolDown', sender, now);
            }
        }
    }

    /**
     * @function doUserGreetings
     * Provides timer function for sending greetings into chat. Will delete messages if the
     * host disables autoGreetings in the middle of a loop.  The reason for a delay is to
     * ensure that the output queue does not become overwhelmed.
     */
    function doUserGreetings() {
        setInterval(function () {

            /* Send a greeting out into chat. */
            if (!greetingQueue.isEmpty() && autoGreetEnabled) {
                $.say(greetingQueue.poll());
            }

            /* There are greetings, however, autoGreet has been disabled, so destroy the queue. */
            if (!greetingQueue.isEmpty() && !autoGreetEnabled) {
                greetingQueue = new Packages.java.util.concurrent.ConcurrentLinkedQueue;
            }

        }, 15000, 'scripts::systems::greetingSystem.js');
    }

    /**
     * @function greetingspanelupdate
     */
    function greetingspanelupdate() {
        autoGreetEnabled = $.getIniDbBoolean('greetingSettings', 'autoGreetEnabled');
        defaultJoinMessage = $.getIniDbString('greetingSettings', 'defaultJoin');
        greetingCooldown = $.getIniDbNumber('greetingSettings', 'cooldown');
    }

    /**
     * @event command
     */
    $.bind('command', function (event) {
        var sender = event.getSender().toLowerCase(),
                command = event.getCommand(),
                args = event.getArgs(),
                action = args[0],
                cooldown,
                message,
                username,
                isSilent;

        /**
         * @commandpath greeting - Base command for controlling greetings.
         */
        if ($.equalsIgnoreCase(command, 'greeting')) {
            if (!action) {
                if ($.checkUserPermission(sender, event.getTags(), $.PERMISSION.Admin)) {
                    $.say($.whisperPrefix(sender) + $.lang.get('greetingsystem.generalusage.admin'));
                } else if (userSelfService) {
                    $.say($.whisperPrefix(sender) + $.lang.get('greetingsystem.generalusage.other'));
                }
                return;
            }

            /**
             * @commandpath greeting cooldown [hours] - Cooldown in hours before displaying a greeting for a person rejoining chat.
             */
            if ($.equalsIgnoreCase(action, 'cooldown')) {
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
                $.inidb.set('greetingSettings', 'cooldown', greetingCooldown);
                $.say($.whisperPrefix(sender) + $.lang.get('greetingsystem.cooldown.success', cooldown));
                return;
            }

            /**
             * @commandpath greeting toggle - Enable/disable the greeting system.
             */
            if ($.equalsIgnoreCase(action, 'toggle')) {
                autoGreetEnabled = !autoGreetEnabled;
                $.setIniDbBoolean('greetingSettings', 'autoGreetEnabled', autoGreetEnabled);
                if (autoGreetEnabled) {
                    $.say($.whisperPrefix(sender) + $.lang.get('greetingsystem.set.autogreet.enabled', $.viewer.getByLogin($.botName).name()));
                } else {
                    $.say($.whisperPrefix(sender) + $.lang.get('greetingsystem.set.autogreet.disabled', $.viewer.getByLogin($.botName).name()));
                }
                return;
            }

            /**
             * @commandpath greeting setdefault - Set the default greeting message
             */
            if ($.equalsIgnoreCase(action, 'setdefault')) {
                message = args.splice(1, args.length - 1).join(' ');

                if (!message) {
                    $.say($.whisperPrefix(sender) + $.lang.get('greetingsystem.generalusage.admin'));
                    return;
                }

                $.inidb.set('greetingSettings', 'defaultJoin', message);
                defaultJoinMessage = message;
                $.say($.whisperPrefix(sender) + $.lang.get('greetingsystem.set.default.success', defaultJoinMessage));
                return;
            }

            /**
             * @commandpath greeting enable [default | message] - Enable greetings and use the default or set a message.
             */
            if ($.equalsIgnoreCase(action, 'enable') && userSelfService) {
                message = args.splice(1, args.length - 1).join(' ');

                if (!message) {
                    $.say($.whisperPrefix(sender) + $.lang.get('greetingsystem.generalusage.other'));
                    return;
                }

                if ($.equalsIgnoreCase(message, 'default')) {
                    $.inidb.set('greeting', sender, defaultJoinMessage);
                } else {
                    $.inidb.set('greeting', sender, message);
                }

                $.say($.whisperPrefix(sender) + $.lang.get('greetingsystem.set.personal.success', $.getIniDbString('greeting', sender)));
                return;
            }

            /**
             * @commandpath greeting set [username] [default | message] - Set greetings for a user and use the default or set a message.
             */
            if ($.equalsIgnoreCase(action, 'set') || $.equalsIgnoreCase(action, 'setsilent')) {
                isSilent = $.equalsIgnoreCase(action, 'setsilent');
                username = args[1].toLowerCase();
                message = args.splice(2, args.length - 1).join(' ');

                if (!message || !username) {
                    if (!isSilent) {
                        $.say($.whisperPrefix(sender) + $.lang.get('greetingsystem.generalusage.other'));
                    }
                    return;
                }

                if ($.equalsIgnoreCase(message, 'default')) {
                    $.inidb.set('greeting', username, defaultJoinMessage);
                } else {
                    $.inidb.set('greeting', username, message);
                }
                if (!isSilent) {
                    $.say($.whisperPrefix(sender) + $.lang.get('greetingsystem.set.success', username, $.getIniDbString('greeting', username)));
                }
                return;
            }

            /**
             * @commandpath greeting remove [username] - Delete a users greeting and automated greeting at join
             */
            if ($.equalsIgnoreCase(action, 'remove') || $.equalsIgnoreCase(action, 'removesilent')) {
                isSilent = $.equalsIgnoreCase(action, 'removesilent');
                username = args[1].toLowerCase();

                if (args[1] === undefined) {
                    if (!isSilent) {
                        $.say($.whisperPrefix(sender) + $.lang.get('greetingsystem.remove.error'));
                    }
                    return;
                }
                if ($.inidb.exists('greeting', args[1])) {
                    $.inidb.del('greeting', args[1]);
                    if (!isSilent) {
                        $.say($.whisperPrefix(sender) + $.lang.get('greetingsystem.remove.success', args[1]));
                    }
                }
                return;
            }

            /**
             * @commandpath greeting disable - Delete personal greeting and automated greeting at join
             */
            if ($.equalsIgnoreCase(action, 'disable') && userSelfService) {
                if ($.inidb.exists('greeting', sender)) {
                    $.inidb.del('greeting', sender);
                    $.say($.whisperPrefix(sender) + $.lang.get('greetingsystem.remove.personal.success'));
                }
                return;
            }

            /**
             * @commandpath greeting toggleblockselfservice - Toggles between users being allowed or prevented to set their own greeting message
             */
            if ($.equalsIgnoreCase(action, 'toggleuserselfservice')) {
                userSelfService = !userSelfService;
                $.inidb.SetBoolean('greetingSettings', '', 'userSelfService', userSelfService);
                if (userSelfService) {
                    $.say($.whisperPrefix(sender) + $.lang.get('greetingsystem.set.userselfservice.on'));
                } else {
                    $.say($.whisperPrefix(sender) + $.lang.get('greetingsystem.set.userselfservice.off'));
                }
                return;
            }

            /**
             * @commandpath greeting toggleonjoin - Toggles if greetings are sent when a users joins the chat or when a user first sends a message
             */
            if ($.equalsIgnoreCase(action, 'toggleonjoin')) {
                onJoin = !onJoin;
                $.inidb.SetBoolean('greetingSettings', '', 'onJoin', onJoin);
                if (onJoin) {
                    $.say($.whisperPrefix(sender) + $.lang.get('greetingsystem.set.onJoin.on'));
                } else {
                    $.say($.whisperPrefix(sender) + $.lang.get('greetingsystem.set.onJoin.off'));
                }
                return;
            }
        }
    });

    /**
     * @event initReady
     */
    $.bind('initReady', function () {
        $.registerChatCommand('./systems/greetingSystem.js', 'greeting', $.PERMISSION.Regular);
        $.registerChatSubcommand('greeting', 'cooldown', $.PERMISSION.Admin);
        $.registerChatSubcommand('greeting', 'toggle', $.PERMISSION.Admin);
        $.registerChatSubcommand('greeting', 'set', $.PERMISSION.Mod);
        $.registerChatSubcommand('greeting', 'setsilent', $.PERMISSION.Admin);
        $.registerChatSubcommand('greeting', 'setdefault', $.PERMISSION.Mod);
        $.registerChatSubcommand('greeting', 'enable', $.PERMISSION.Regular);
        $.registerChatSubcommand('greeting', 'remove', $.PERMISSION.Mod);
        $.registerChatSubcommand('greeting', 'removesilent', $.PERMISSION.Admin);
        $.registerChatSubcommand('greeting', 'disable', $.PERMISSION.Regular);
        $.registerChatSubcommand('greeting', 'toggleuserselfservice', $.PERMISSION.Admin);
        $.registerChatSubcommand('greeting', 'toggleonjoin', $.PERMISSION.Admin);

        doUserGreetings();
    });

    $.greetingspanelupdate = greetingspanelupdate;
})();
