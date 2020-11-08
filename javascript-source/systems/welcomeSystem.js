/*
 * Copyright (C) 2016-2020 phantombot.github.io/PhantomBot
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
 * welcomeSystem.js
 *
 * Tags in welcomes:
 * - (name) The username corresponding to the target user
 */
(function() {
    var welcomeEnabled = $.getSetIniDbBoolean('welcome', 'welcomeEnabled', false),
        welcomeMessage = $.getSetIniDbString('welcome', 'welcomeMessage', 'Welcome back, (name)!'),
        welcomeMessageFirst = $.getSetIniDbString('welcome', 'welcomeMessageFirst', '(name) is new here. Give them a warm welcome!'),
        welcomeCooldown = $.getSetIniDbNumber('welcome', 'cooldown', (6 * 36e5)),
        /* 6 Hours */
        welcomeQueue = new java.util.concurrent.ConcurrentLinkedQueue;

    /**
     * @event ircChannelMessage
     */
    $.bind('ircChannelMessage', function(event) {
        var sender = event.getSender();
        if ($.equalsIgnoreCase(sender, $.channelName)) {
            return;
        }
        if ($.isOnline($.channelName) && welcomeEnabled && (welcomeMessage || welcomeMessageFirst)) {
            var lastUserGreeting = $.getIniDbNumber('welcomeCoolDown', sender),
                firstTimeChatter = lastUserGreeting === undefined,
                message = (firstTimeChatter && welcomeMessageFirst) ? welcomeMessageFirst : welcomeMessage,
                now = $.systemTime();
            lastUserGreeting = firstTimeChatter ? 0 : lastUserGreeting;

            if (message && !$.inidb.exists('welcome_disabled_users', username)  && lastUserGreeting + welcomeCooldown < now) {
                welcomeQueue.add(
                    $.tags(event, message, false, {
                        'user': function command(args, event) {
                            if (!args) {
                                return {
                                    result: String($.username.resolve(sender)),
                                    cache: true
                                };
                            }
                        }
                    }, false)
                );
            }
            $.inidb.set('welcomeCoolDown', sender, now);
        }
    });

    /**
     * @function sendUserWelcomes
     * Provides timer function for sending welcomes into chat. Will delete messages if the
     * host disables welcomes in the middle of a loop. The reason for a delay is to
     * ensure that the output queue does not become overwhelmed.
     */
    function sendUserWelcomes() {
        setInterval(function() {

            /* Send a welcome out into chat. */
            if (!welcomeQueue.isEmpty() && welcomeEnabled) {
                $.say(welcomeQueue.poll());
            }

            /* There are welcomes, however, welcome has been disabled, so destroy the queue. */
            if (!welcomeQueue.isEmpty() && !welcomeEnabled) {
                welcomeQueue = new java.util.concurrent.ConcurrentLinkedQueue;
            }

        }, 15000, 'scripts::systems::welcomeSystem.js');
    }

    /**
     * @function welcomepanelupdate
     */
    function welcomepanelupdate() {
        welcomeEnabled = $.getIniDbBoolean('welcome', 'welcomeEnabled');
        welcomeMessage = $.getIniDbString('welcome', 'welcomeMessage');
        welcomeMessageFirst = $.getIniDbString('welcome', 'welcomeMessageFirst');
        welcomeCooldown = $.getIniDbNumber('welcome', 'cooldown');
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
            username,
            message;

        /**
         * @commandpath welcome - Base command for controlling welcomes.
         */
        if (command.equalsIgnoreCase('welcome')) {
            if (!action) {
                $.say($.whisperPrefix(sender) + $.lang.get('welcomesystem.generalusage'));
                return;
            }

            /**
             * @commandpath welcome toggle - Enable/disable the welcome system.
             */
            if (action.equalsIgnoreCase('toggle')) {
                welcomeEnabled = !welcomeEnabled;
                $.setIniDbBoolean('welcome', 'welcomeEnabled', welcomeEnabled);
                if (welcomeEnabled) {
                    $.say($.whisperPrefix(sender) + $.lang.get('welcomesystem.set.autowelcome.enabled', $.username.resolve($.botName)));
                } else {
                    $.say($.whisperPrefix(sender) + $.lang.get('welcomesystem.set.autowelcome.disabled', $.username.resolve($.botName)));
                }
            }

            /**
             * @commandpath welcome setmessage - Set the welcome message
             */
            if (action.equalsIgnoreCase('setmessage')) {
                message = args.splice(1, args.length - 1).join(' ');

                $.inidb.set('welcome', 'welcomeMessage', message);
                welcomeMessageFirst = message;
                if (!message) {
                    $.say($.whisperPrefix(sender) + $.lang.get('welcomesystem.set.message.empty', $.username.resolve($.botName)));

                } else {
                    $.say($.whisperPrefix(sender) + $.lang.get('welcomesystem.set.message.success', $.username.resolve($.botName), message));
                }
                return;
            }

            /**
             * @commandpath welcome setfirstmessage - Set the welcome message
             */
            if (action.equalsIgnoreCase('setfirstmessage')) {
                message = args.splice(1, args.length - 1).join(' ');

                $.inidb.set('welcome', 'welcomeMessageFirst', message);
                welcomeMessage = message;
                if (!message) {
                    $.say($.whisperPrefix(sender) + $.lang.get('welcomesystem.set.firstmessage.empty', $.username.resolve($.botName)));
                } else {
                    $.say($.whisperPrefix(sender) + $.lang.get('welcomesystem.set.firstmessage.success', $.username.resolve($.botName), message));
                }
                return;
            }

            /**
             * @commandpath welcome cooldown [hours] - Cooldown in hours before displaying a welcome for a person chatting.
             */
            if (action.equalsIgnoreCase('cooldown')) {
                if (!args[1]) {
                    $.say($.whisperPrefix(sender) + $.lang.get('welcomesystem.set.cooldown.show', $.getIniDbNumber('welcome', 'cooldown')));
                    return;
                }
                cooldown = parseInt(args[1]);
                if (isNaN(cooldown)) {
                    $.say($.whisperPrefix(sender) + $.lang.get('welcomesystem.set.cooldown.usage'));
                    return;
                }

                welcomeCooldown = cooldown * 36e5; // Convert hours to ms
                $.inidb.set('welcome', 'cooldown', welcomeCooldown);
                $.say($.whisperPrefix(sender) + $.lang.get('welcomesystem.set.cooldown.success', cooldown));
                return;
            }

            /**
             * @commandpath welcome disable [user] - Disable welcoming of the given user.
             */
            if (action.equalsIgnoreCase('disable')) {
                username = !args[1] ? args[1] : $.jsString(args[1]).replace(/[^a-zA-Z0-9_]/g, '').toLowerCase();
                if (!username) {
                    $.say($.whisperPrefix(sender) + $.lang.get('welcomesystem.set.disableuser.usage'));
                    return;
                }
                if ($.inidb.exists('welcome_disabled_users', username)) {
                    $.say($.whisperPrefix(sender) + $.lang.get('welcomesystem.set.disableuser.fail', username));
                    return;
                }

                $.inidb.set('welcome_disabled_users', username, true);
                $.say($.whisperPrefix(sender) + $.lang.get('welcomesystem.set.disableuser.success', $.botName, username));
                return;
            }

            /**
             * @commandpath welcome enable [user] - Disable welcoming of the given user.
             */
            if (action.equalsIgnoreCase('enable')) {
                username = !args[1] ? args[1] : $.jsString(args[1]).replace(/[^a-zA-Z0-9_]/g, '').toLowerCase();
                if (!username) {
                    $.say($.whisperPrefix(sender) + $.lang.get('welcomesystem.set.enableuser.usage'));
                    return;
                }
                if (!$.inidb.exists('', username)) {
                    $.say($.whisperPrefix(sender) + $.lang.get('welcomesystem.set.enableuser.fail', username));
                    return;
                }

                $.inidb.del('welcome_disabled_users', username);
                $.say($.whisperPrefix(sender) + $.lang.get('welcomesystem.set.enableuser.success', $.botName, username));
                return;
            }
        }
    });

    /**
     * @event initReady
     */
    $.bind('initReady', function() {
        $.registerChatCommand('./systems/welcomeSystem.js', 'welcome', 2);
        $.registerChatSubcommand('welcome', 'cooldown', 1);
        $.registerChatSubcommand('welcome', 'toggle', 1);
        $.registerChatSubcommand('welcome', 'setmessage', 2);
        $.registerChatSubcommand('welcome', 'setfirstmessage', 2);
        $.registerChatSubcommand('welcome', 'disable', 2);
        $.registerChatSubcommand('welcome', 'enable', 2);

        sendUserWelcomes();
    });

    $.welcomepanelupdate = welcomepanelupdate;
})();
