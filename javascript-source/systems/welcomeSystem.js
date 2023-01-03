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
 * welcomeSystem.js
 *
 * Tags in welcomes:
 * - (name) The username corresponding to the target user
 */
(function () {
    var welcomeEnabled = $.getSetIniDbBoolean('welcome', 'welcomeEnabled', false),
            welcomeMessage = $.getSetIniDbString('welcome', 'welcomeMessage', 'Welcome back, (names)!'),
            welcomeMessageFirst = $.getSetIniDbString('welcome', 'welcomeMessageFirst', '(names) (1 is)(2 are) new here. Give them a warm welcome!'),
            welcomeCooldown = $.getSetIniDbNumber('welcome', 'cooldown', (6 * 36e5)), // 6 Hours
            welcomeQueue = new Packages.java.util.concurrent.ConcurrentLinkedQueue,
            welcomeQueueFirst = new Packages.java.util.concurrent.ConcurrentLinkedQueue,
            welcomeTimer = null,
            // used to synchronize access to welcomeQueue, welcomeQueueFirst, and welcomeTimer
            welcomeLock = new Packages.java.util.concurrent.locks.ReentrantLock();

    /*
     * @event ircChannelMessage
     */
    $.bind('ircChannelMessage', function (event) {
        var sender = event.getSender().toLowerCase(),
                now = $.systemTime();
        if ($.equalsIgnoreCase(sender, $.channelName)) {
            return;
        }
        if ($.equalsIgnoreCase(sender, $.botName)) {
            return;
        }
        if ($.isTwitchBot(sender)) {
            return;
        }
        if ($.isOnline($.channelName) && welcomeEnabled && (welcomeMessage || welcomeMessageFirst)) {
            if ($.inidb.exists('greeting', sender) && $.inidb.GetBoolean('greetingSettings', '', 'autoGreetEnabled') && $.bot.isModuleEnabled('./systems/greetingSystem.js')) {
                return;
            }

            var lastUserMessage = $.getIniDbNumber('greetingCoolDown', sender),
                    firstTimeChatter = lastUserMessage === undefined,
                    queue = firstTimeChatter ? welcomeQueueFirst : welcomeQueue;

            lastUserMessage = firstTimeChatter ? 0 : lastUserMessage;

            if (!$.inidb.exists('welcome_disabled_users', sender)) {
                if (lastUserMessage + welcomeCooldown < now) {
                    welcomeLock.lock();
                    try {
                        queue.add($.username.resolve(sender));
                    } finally {
                        welcomeLock.unlock();
                    }
                    sendUserWelcomes();
                }
                $.inidb.set('greetingCoolDown', sender, now);
            }
        }
    });

    /*
     * @function buildMessage
     * build a welcome message from `message` (potentially containing tags).
     * Supported tags:
     *   * (names) - replaced with the name(s) in `names`
     *   * (1 some text) - show 'some text' if and only if names has 1 entry
     *   * (2 some text) - show 'some text' if and only if names has 2 entries
     *   * (3 some text) - show 'some text' if and only if names has 3 or more entry
     *
     * @param {string} message: raw message with tags to replace message
     * @param {array} names: array of user names to be welcomed
     * @returns {string}: `message` with replaced tags or null if `message` or `names` is empty.
     * @usestransformers local
     * @bind ircChannelMessage
     */
    function buildMessage(message, names) {
        var match,
                namesString;
        if (!names.length || !message) {
            return null;
        }
        return $.tags(null, message, false, {
            /*
             * @localtransformer names
             * @formula (names) The names of the users being welcomed
             * @example Caster: !welcome setmessage Welcome (names)!
             * Bot: Welcome coolperson1, user2, and viewer3!
             * @cached
             */
            'names': function command() {
                switch (names.length) {
                    case 1:
                        namesString = names[0];
                        break;
                    case 2:
                        namesString = names.join($.lang.get('welcomesystem.names.join3'));
                        break;
                    default:
                        namesString = names.slice(0, -1).join($.lang.get('welcomesystem.names.join1')) +
                                $.lang.get('welcomesystem.names.join2') + names[names.length - 1];

                }
                return {
                    result: String(namesString),
                    cache: true
                };
            },
            /*
             * @localtransformer 1
             * @formula (1 str:str) The text parameter inside this tag is only printed if there is 1 user being welcomed
             * @example Caster: !welcome setmessage (names) (1 is)(2 are)(3 are all) new here. Give them a warm welcome!
             * Bot: coolperson1 is new here. Give them a warm welcome!
             * @cached
             */
            '1': function (args) {
                if (names.length !== 1) {
                    return {result: '', cache: true};
                }
                if ((match = args.args.match(/^\s?(.*)$/))) {
                    return {result: String(match[1]), cache: true};
                }
            },
            /*
             * @localtransformer 2
             * @formula (2 str:str) The text parameter inside this tag is only printed if there are 2 users being welcomed
             * @example Caster: !welcome setmessage (names) (1 is)(2 are)(3 are all) new here. Give them a warm welcome!
             * Bot: coolperson1 and user2 are new here. Give them a warm welcome!
             * @cached
             */
            '2': function (args) {
                if (names.length !== 2) {
                    return {result: '', cache: true};
                }
                if ((match = args.args.match(/^\s?(.*)$/))) {
                    return {result: String(match[1]), cache: true};
                }
            },
            /*
             * @localtransformer 3
             * @formula (3 str:str) The text parameter inside this tag is only printed if there are 3 or more users being welcomed
             * @example Caster: !welcome setmessage (names) (1 is)(2 are)(3 are all) new here. Give them a warm welcome!
             * Bot: coolperson1, user2, and viewer3 are all new here. Give them a warm welcome!
             * @cached
             */
            '3': function (args) {
                if (names.length < 3) {
                    return {result: '', cache: true};
                }
                if ((match = args.args.match(/^\s?(.*)$/))) {
                    return {result: String(match[1]), cache: true};
                }
            }
        }, true);
    }

    /*
     * @function processQueue
     * Function to send welcome messages to the users in the queues.
     * The function will start a timer to be called again if there are too many
     * users in the queue to all be greeted at the same time.
     */
    function processQueue() {
        welcomeLock.lock();
        try {
            if (welcomeQueue.isEmpty() && welcomeQueueFirst.isEmpty()) {
                // No welcomes within the last 15 seconds and none are waiting.
                welcomeTimer = null;
            } else {
                if (welcomeEnabled) {
                    var names = [],
                            message = welcomeMessageFirst ? welcomeMessageFirst : welcomeMessage;
                    while (names.length < 15 && !welcomeQueueFirst.isEmpty()) {
                        names.push(welcomeQueueFirst.poll());
                    }
                    if (!names.length) {
                        message = welcomeMessage;
                        while (names.length < 15 && !welcomeQueue.isEmpty()) {
                            names.push(welcomeQueue.poll());
                        }
                    }
                    message = buildMessage(message, names);
                    if (message) {
                        $.say(message);
                    }
                    // Check back later to see if more people are waiting to be welcomed.
                    welcomeTimer = setTimeout(processQueue, 15000, 'scripts::systems::welcomeSystem.js');
                } else {
                    // There are welcomes, however, welcome has been disabled, so destroy the queues.
                    welcomeQueue = new Packages.java.util.concurrent.ConcurrentLinkedQueue;
                    welcomeQueueFirst = new Packages.java.util.concurrent.ConcurrentLinkedQueue;
                    welcomeTimer = null;
                }
            }
        } finally {
            welcomeLock.unlock();
        }
    }

    /**
     * @function sendUserWelcomes
     * Function to handle sending welcome message. Call this function anytime
     * a new user got placed in `welcomeQueue` or `welcomeQueueFirst`.
     */
    function sendUserWelcomes() {
        welcomeLock.lock();
        try {
            if (welcomeTimer === null) {
                // no timer is running (implying that no welcome message was sent within
                // the last 15 seconds. => send the message right away
                processQueue();
            }
        } finally {
            welcomeLock.unlock();
        }
    }

    /*
     * @function welcomepanelupdate
     */
    function welcomepanelupdate() {
        welcomeEnabled = $.getIniDbBoolean('welcome', 'welcomeEnabled');
        welcomeMessage = $.getIniDbString('welcome', 'welcomeMessage');
        welcomeMessageFirst = $.getIniDbString('welcome', 'welcomeMessageFirst');
        welcomeCooldown = $.getIniDbNumber('welcome', 'cooldown');
    }

    /*
     * @event command
     */
    $.bind('command', function (event) {
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
    $.bind('initReady', function () {
        $.registerChatCommand('./systems/welcomeSystem.js', 'welcome', $.PERMISSION.Mod);
        $.registerChatSubcommand('welcome', 'cooldown', $.PERMISSION.Admin);
        $.registerChatSubcommand('welcome', 'toggle', $.PERMISSION.Admin);
        $.registerChatSubcommand('welcome', 'setmessage', $.PERMISSION.Mod);
        $.registerChatSubcommand('welcome', 'setfirstmessage', $.PERMISSION.Mod);
        $.registerChatSubcommand('welcome', 'disable', $.PERMISSION.Mod);
        $.registerChatSubcommand('welcome', 'enable', $.PERMISSION.Mod);

        sendUserWelcomes();
    });

    $.welcomepanelupdate = welcomepanelupdate;
})();
