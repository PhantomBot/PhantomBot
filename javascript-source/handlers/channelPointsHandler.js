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

/* global Packages */
/**
 * This module is to handle channel point redemption actions
 * Author: MzLiv
 */

(function () {
    var transferToggle = $.getSetIniDbBoolean('channelPointsSettings', 'transferToggle', false),
            transferAmount = $.getSetIniDbNumber('channelPointsSettings', 'transferAmount', 0),
            transferID = $.getSetIniDbString('channelPointsSettings', 'transferID', 'noIDSet'),
            transferConfig = $.getSetIniDbBoolean('channelPointsSettings', 'transferConfig', false),
            transferReward = $.getSetIniDbString('channelPointsSettings', 'transferReward', 'noNameSet'),
            giveAllToggle = $.getSetIniDbBoolean('channelPointsSettings', 'giveAllToggle', false),
            giveAllAmount = $.getSetIniDbNumber('channelPointsSettings', 'giveAllAmount', 0),
            giveAllID = $.getSetIniDbString('channelPointsSettings', 'giveAllID', 'noIDSet'),
            giveAllConfig = $.getSetIniDbBoolean('channelPointsSettings', 'giveAllConfig', false),
            giveAllReward = $.getSetIniDbString('channelPointsSettings', 'giveAllReward', 'noNameSet'),
            emoteOnlyToggle = $.getSetIniDbBoolean('channelPointsSettings', 'emoteOnlyToggle', false),
            emoteOnlyDuration = $.getSetIniDbNumber('channelPointsSettings', 'emoteOnlyDuration', 0),
            emoteOnlyID = $.getSetIniDbString('channelPointsSettings', 'emoteOnlyID', 'noIDSet'),
            emoteOnlyConfig = $.getSetIniDbBoolean('channelPointsSettings', 'emoteOnlyConfig', false),
            emoteOnlyReward = $.getSetIniDbString('channelPointsSettings', 'emoteOnlyReward', 'noNameSet'),
            timeoutToggle = $.getSetIniDbBoolean('channelPointsSettings', 'timeoutToggle', false),
            timeoutDuration = $.getSetIniDbNumber('channelPointsSettings', 'timeoutDuration', 0),
            timeoutID = $.getSetIniDbString('channelPointsSettings', 'timeoutID', 'noIDSet'),
            timeoutConfig = $.getSetIniDbBoolean('channelPointsSettings', 'timeoutConfig', false),
            timeoutReward = $.getSetIniDbString('channelPointsSettings', 'timeoutReward', 'noNameSet'),
            commands = JSON.parse($.getSetIniDbString('channelPointsSettings', 'commands', '[]')),
            commandConfig = $.getSetIniDbString('channelPointsSettings', 'commandConfig', ''),
            pointName = $.pointNameMultiple;

    /*
     * @function updateChannelPointsConfig
     */
    function updateChannelPointsConfig() {
        transferToggle = $.getIniDbBoolean('channelPointsSettings', 'transferToggle', false);
        transferAmount = $.getIniDbNumber('channelPointsSettings', 'transferAmount', 0);
        transferID = $.getIniDbString('channelPointsSettings', 'transferID', 'noIDSet');
        transferConfig = $.getIniDbBoolean('channelPointsSettings', 'transferConfig', false);
        transferReward = $.getIniDbString('channelPointsSettings', 'transferReward', 'noNameSet');
        giveAllToggle = $.getIniDbBoolean('channelPointsSettings', 'giveAllToggle', false);
        giveAllAmount = $.getIniDbNumber('channelPointsSettings', 'giveAllAmount', 0);
        giveAllID = $.getIniDbString('channelPointsSettings', 'giveAllID', 'noIDSet');
        giveAllConfig = $.getIniDbBoolean('channelPointsSettings', 'giveAllConfig', false);
        giveAllReward = $.getIniDbString('channelPointsSettings', 'giveAllReward', 'noNameSet');
        emoteOnlyToggle = $.getIniDbBoolean('channelPointsSettings', 'emoteOnlyToggle', false);
        emoteOnlyDuration = $.getIniDbNumber('channelPointsSettings', 'emoteOnlyDuration', 0);
        emoteOnlyID = $.getIniDbString('channelPointsSettings', 'emoteOnlyID', 'noIDSet');
        emoteOnlyConfig = $.getIniDbBoolean('channelPointsSettings', 'emoteOnlyConfig', false);
        emoteOnlyReward = $.getIniDbString('channelPointsSettings', 'emoteOnlyReward', 'noNameSet');
        timeoutToggle = $.getIniDbBoolean('channelPointsSettings', 'timeoutToggle', false);
        timeoutDuration = $.getIniDbNumber('channelPointsSettings', 'timeoutDuration', 0);
        timeoutID = $.getIniDbString('channelPointsSettings', 'timeoutID', 'noIDSet');
        timeoutConfig = $.getIniDbBoolean('channelPointsSettings', 'timeoutConfig', false);
        timeoutReward = $.getIniDbString('channelPointsSettings', 'timeoutReward', 'noNameSet');
        commands = JSON.parse($.getIniDbString('channelPointsSettings', 'commands', '[]'));
        commandConfig = $.getIniDbString('channelPointsSettings', 'commandConfig', '');
    }

    /*
     * @event command
     */
    $.bind('command', function (event) {
        var sender = event.getSender(),
                command = event.getCommand(),
                args = event.getArgs(),
                action = args[0];

        /*
         * @commandpath channelpoints - Main command for the Channel Points module. Indicates what actions are in use 
         */
        if (command.equalsIgnoreCase('channelpoints')) {
            if (action === undefined) {
                if (transferToggle === false && giveAllToggle === false && emoteOnlyToggle === false && timeoutToggle === false && commands.length === 0) {
                    $.say($.whisperPrefix(sender) + $.lang.get('channelPointsHandler.notenabled'));
                    return;
                }
                var config = '';
                if (transferToggle === true) {
                    config += ' transfer';
                }
                if (giveAllToggle === true) {
                    config += ' giveall';
                }
                if (emoteOnlyToggle === true) {
                    config += ' emoteonly';
                }
                if (timeoutToggle === true) {
                    config += ' timeout';
                }
                if (commands.length > 0) {
                    config += ' command';
                }
                $.say($.whisperPrefix(sender) + $.lang.get('channelPointsHandler.current', config));
                return;
            }

            /*
             * @commandpath channelpoints usage - Gives the main usage of the !channelpoints command
             */
            if (action.equalsIgnoreCase('usage')) {
                $.say($.whisperPrefix(sender) + $.lang.get('channelPointsHandler.usage'));
                return;
            }

            /*
             * @commandpath channelpoints info - Gives information on the various rewards that can be linked
             */
            if (action.equalsIgnoreCase('info')) {
                $.say($.whisperPrefix(sender) + $.lang.get('channelPointsHandler.info'));
                return;
            }

            /*
             * @commandpath channelpoints command - Allows setting channel points redemptions to convert into custom commands, then execute command tags
             */
            if (action.equalsIgnoreCase('command')) {
                if (args[1] === undefined) {
                    $.say($.whisperPrefix(sender) + $.lang.get('channelPointsHandler.command.info'));
                } else {
                    var subAction = $.jsString(args[1]).toLowerCase();
                    /*
                     * @commandpath channelpoints command example - Prints an example add subaction for the "command" rewards type
                     */
                    if (subAction === 'example') {
                        $.say($.whisperPrefix(sender) + $.lang.get('channelPointsHandler.command.example'));
                        /*
                         * @commandpath channelpoints command get - Given a channel point reward id, returns the custom command definition that will be parsed
                         */
                    } else if (subAction === 'list') {
                        var active = '';
                        for (var i = 0; i < commands.length; i++) {
                            if (active.length > 0) {
                                active += ' === ';
                            }

                            active += commands[i].id + ' - ' + commands[i].title;
                        }

                        $.say($.whisperPrefix(sender) + $.lang.get('channelPointsHandler.command.list', active));
                        /*
                         * @commandpath channelpoints command get - Given a channel point reward id, returns the custom command definition that will be parsed
                         */
                    } else if (subAction === 'get') {
                        if (args[2] === undefined || $.jsString(args[2]).length === 0) {
                            $.say($.whisperPrefix(sender) + $.lang.get('channelPointsHandler.command.get.usage'));
                        } else {
                            var selected = -1;
                            var target = $.jsString(args[2]);
                            for (var i = 0; i < commands.length; i++) {
                                if (commands[i].id === target) {
                                    selected = i;
                                    break;
                                }
                            }

                            if (selected === -1) {
                                $.say($.whisperPrefix(sender) + $.lang.get('channelPointsHandler.command.get.404', target));
                            } else {
                                $.say($.whisperPrefix(sender) + $.lang.get('channelPointsHandler.command.get', target, commands[selected].command));
                            }
                        }
                        /*
                         * @commandpath channelpoints command add - Starts the process of adding a "command" type redemption reward
                         */
                    } else if (subAction === 'add') {
                        if (args[2] === undefined || $.jsString(args[2]).length === 0) {
                            $.say($.whisperPrefix(sender) + $.lang.get('channelPointsHandler.command.add.usage1'));
                            $.say($.whisperPrefix(sender) + $.lang.get('channelPointsHandler.command.add.usage2', $.botName));
                            $.say($.whisperPrefix(sender) + $.lang.get('channelPointsHandler.command.add.usage3'));
                        } else {
                            if (commandConfig.length === 0) {
                                commandConfig = args.slice(2).join(' ');
                                $.setIniDbString('channelPointsSettings', 'commandConfig', commandConfig);

                                $.say($.whisperPrefix(sender) + $.lang.get('channelPointsHandler.command.add.start'));
                            } else {
                                $.say($.whisperPrefix(sender) + $.lang.get('channelPointsHandler.config.failed'));
                            }
                        }
                    } else {
                        $.say($.whisperPrefix(sender) + $.lang.get('channelPointsHandler.command.usage'));
                    }
                }
                return;
            }

            /*
             * @commandpath channelpoints transfer - Gives the redeeming user a number of !points
             */
            if (action.equalsIgnoreCase('transfer')) {
                if (args[1] === undefined) {

                    if (transferToggle === false) {
                        $.say($.whisperPrefix(sender) + $.lang.get('channelPointsHandler.transfer.info'));
                        return;
                    }
                    $.say($.whisperPrefix(sender) + $.lang.get('channelPointsHandler.transfer.current', transferReward, transferAmount));
                    return;
                }

                /*
                 * @commandpath channelpoints transfer usage - Gives usage information for the "transfer" reward type
                 */
                if (args[1].equalsIgnoreCase('usage')) {
                    $.say($.whisperPrefix(sender) + $.lang.get('channelPointsHandler.transfer.usage'));
                    return;
                }

                /*
                 * @commandpath channelpoints transfer config - Starts the process of linking a channel point redemption to the "transfer" reward type
                 */
                if (args[1].equalsIgnoreCase('config')) {
                    transferConfig = !transferConfig;
                    $.setIniDbBoolean('channelPointsSettings', 'transferConfig', transferConfig);
                    if (transferConfig === true) {
                        $.say($.whisperPrefix(sender) + $.lang.get('channelPointsHandler.transfer.config.start'));
                        transferID = 'noIDSet';
                        transferReward = 'noNameSet';
                        $.setIniDbBoolean('channelPointsSettings', 'transferID', transferID);
                        $.setIniDbBoolean('channelPointsSettings', 'transferReward', transferReward);
                        return;
                    }
                    $.say($.whisperPrefix(sender) + $.lang.get('channelPointsHandler.config.failed'));
                    // config is closed when reward is successfully redeemed please see reward ID config in channel point events below
                    return;
                }

                /*
                 * @commandpath channelpoints transfer amount - Indicates or sets the number of points given when redeemed
                 */
                if (args[1].equalsIgnoreCase('amount')) {
                    if (args[2] === undefined) {
                        if (transferAmount === 0) {
                            $.say($.whisperPrefix(sender) + $.lang.get('channelPointsHandler.transfer.amount.notset'));
                            return;
                        }
                        $.say($.whisperPrefix(sender) + $.lang.get('channelPointsHandler.transfer.amount.usage', transferAmount));
                        return;
                    }
                    if (isNaN(args[2])) {
                        $.say($.whisperPrefix(sender) + $.lang.get('channelPointsHandler.nan'));
                        return;
                    }
                    transferAmount = args[2];
                    $.setIniDbNumber('channelPointsSettings', 'transferAmount', transferAmount);
                    $.say($.whisperPrefix(sender) + $.lang.get('channelPointsHandler.transfer.amount.message', transferAmount));
                }

                /*
                 * @commandpath channelpoints transfer toggle - Toggles the "transfer" reward type without unlinking it
                 */
                if (args[1].equalsIgnoreCase('toggle')) {
                    if (transferToggle === false) {
                        if (transferID.equals('noIDSet')) {
                            $.say($.whisperPrefix(sender) + $.lang.get('channelPointsHandler.transfer.toggle.id'));
                            return;
                        }
                        if (transferAmount === 0) {
                            $.say($.whisperPrefix(sender) + $.lang.get('channelPointsHandler.transfer.toggle.amount'));
                            return;
                        }
                    }
                    transferToggle = !transferToggle;
                    $.setIniDbBoolean('channelPointsSettings', 'transferToggle', transferToggle);
                    $.say($.whisperPrefix(sender) + (transferToggle ? $.lang.get('channelPointsHandler.transfer.enabled', transferReward) : $.lang.get('channelPointsHandler.transfer.disabled')));
                    return;
                }
            }
            /*
             * @commandpath channelpoints giveall - When redeemed, all users currently recognized by the bot as being in chat receive !points
             */
            if (action.equalsIgnoreCase('giveall')) {
                if (args[1] === undefined) {

                    if (giveAllToggle === false) {
                        $.say($.whisperPrefix(sender) + $.lang.get('channelPointsHandler.giveall.info'));
                        return;
                    }
                    $.say($.whisperPrefix(sender) + $.lang.get('channelPointsHandler.giveall.current', giveAllReward, giveAllAmount));
                    return;
                }
                /*
                 * @commandpath channelpoints giveall usage - Gives usage information for the "giveall" reward type
                 */
                if (args[1].equalsIgnoreCase('usage')) {
                    $.say($.whisperPrefix(sender) + $.lang.get('channelPointsHandler.giveall.usage'));
                    return;
                }

                /*
                 * @commandpath channelpoints giveall config - Starts the process of linking a channel point redemption to the "giveall" reward type
                 */
                if (args[1].equalsIgnoreCase('config')) {
                    giveAllConfig = !giveAllConfig;
                    $.setIniDbBoolean('channelPointsSettings', 'giveAllConfig', giveAllConfig);
                    if (giveAllConfig === true) {
                        $.say($.whisperPrefix(sender) + $.lang.get('channelPointsHandler.giveall.config.start'));
                        giveAllID = 'noIDSet';
                        giveAllReward = 'noNameSet';
                        $.setIniDbBoolean('channelPointsSettings', 'giveAllID', giveAllID);
                        $.setIniDbBoolean('channelPointsSettings', 'giveAllReward', giveAllReward);
                        return;
                    }
                    $.say($.whisperPrefix(sender) + $.lang.get('channelPointsHandler.config.failed'));
                    // config is closed when reward is successfully redeemed please see reward ID config in channel point events below
                    return;
                }

                /*
                 * @commandpath channelpoints giveall amount - Indicates or sets the number of points given when redeemed
                 */
                if (args[1].equalsIgnoreCase('amount')) {
                    if (args[2] === undefined) {
                        if (giveAllAmount === 0) {
                            $.say($.whisperPrefix(sender) + $.lang.get('channelPointsHandler.giveall.amount.notset'));
                            return;
                        }
                        $.say($.whisperPrefix(sender) + $.lang.get('channelPointsHandler.giveall.amount.usage', giveAllAmount));
                        return;
                    }
                    if (isNaN(args[2])) {
                        $.say($.whisperPrefix(sender) + $.lang.get('channelPointsHandler.nan'));
                        return;
                    }
                    giveAllAmount = args[2];
                    $.setIniDbNumber('channelPointsSettings', 'giveallAmount', giveAllAmount);
                    $.say($.whisperPrefix(sender) + $.lang.get('channelPointsHandler.giveall.amount.message', giveAllAmount));
                }

                /*
                 * @commandpath channelpoints giveall toggle - Toggles the "giveall" reward type without unlinking it
                 */
                if (args[1].equalsIgnoreCase('toggle')) {
                    if (giveAllToggle === false) {
                        if (giveAllID.equals('noIDSet')) {
                            $.say($.whisperPrefix(sender) + $.lang.get('channelPointsHandler.giveall.toggle.id'));
                            return;
                        }
                        if (giveAllAmount === 0) {
                            $.say($.whisperPrefix(sender) + $.lang.get('channelPointsHandler.giveall.toggle.amount'));
                            return;
                        }
                    }
                    giveAllToggle = !giveAllToggle;
                    $.setIniDbBoolean('channelPointsSettings', 'giveallToggle', giveAllToggle);
                    $.say($.whisperPrefix(sender) + (giveAllToggle ? $.lang.get('channelPointsHandler.giveall.enabled', giveAllReward) : $.lang.get('channelPointsHandler.giveall.disabled')));
                    return;
                }
            }

            /*
             * @commandpath channelpoints emoteonly - When redeemed, chat is changed into emotes-only mode for a period of time
             */
            if (action.equalsIgnoreCase('emoteonly')) {
                if (args[1] === undefined) {

                    if (emoteOnlyToggle === false) {
                        $.say($.whisperPrefix(sender) + $.lang.get('channelPointsHandler.emoteonly.info'));
                        return;
                    }
                    $.say($.whisperPrefix(sender) + $.lang.get('channelPointsHandler.emoteonly.current', emoteOnlyReward, emoteOnlyDuration));
                    return;
                }

                /*
                 * @commandpath channelpoints emoteonly usage - Gives usage information for the "emoteonly" reward type
                 */
                if (args[1].equalsIgnoreCase('usage')) {
                    $.say($.whisperPrefix(sender) + $.lang.get('channelPointsHandler.emoteonly.usage'));
                    return;
                }

                /*
                 * @commandpath channelpoints emoteonly config - Starts the process of linking a channel point redemption to the "emoteonly" reward type
                 */
                if (args[1].equalsIgnoreCase('config')) {
                    emoteOnlyConfig = !emoteOnlyConfig;
                    $.setIniDbBoolean('channelPointsSettings', 'emoteOnlyConfig', emoteOnlyConfig);
                    if (emoteOnlyConfig === true) {
                        $.say($.whisperPrefix(sender) + $.lang.get('channelPointsHandler.emoteonly.config.start'));
                        emoteOnlyID = 'noIDSet';
                        emoteOnlyReward = 'noNameSet';
                        $.setIniDbBoolean('channelPointsSettings', 'emoteOnlyID', emoteOnlyID);
                        $.setIniDbBoolean('channelPointsSettings', 'emoteOnlyReward', emoteOnlyReward);
                        return;
                    }
                    $.say($.whisperPrefix(sender) + $.lang.get('channelPointsHandler.config.failed'));
                    // config is closed when reward is successfully redeemed please see reward ID config in channel point events below
                    return;
                }

                /*
                 * @commandpath channelpoints emoteonly duration - Indicates or sets the duration of emotes-only mode when redeemed
                 */
                if (args[1].equalsIgnoreCase('duration')) {
                    if (args[2] === undefined) {
                        if (emoteOnlyDuration === 0) {
                            $.say($.whisperPrefix(sender) + $.lang.get('channelPointsHandler.emoteonly.duration.notset'));
                            return;
                        }
                        $.say($.whisperPrefix(sender) + $.lang.get('channelPointsHandler.emoteonly.duration.usage', emoteOnlyDuration));
                        return;
                    }
                    if (isNaN(args[2])) {
                        $.say($.whisperPrefix(sender) + $.lang.get('channelPointsHandler.nan'));
                        return;
                    }
                    emoteOnlyDuration = args[2];
                    $.setIniDbNumber('channelPointsSettings', 'emoteOnlyDuration', emoteOnlyDuration);
                    $.say($.whisperPrefix(sender) + $.lang.get('channelPointsHandler.emoteonly.duration.message', emoteOnlyDuration));
                }

                /*
                 * @commandpath channelpoints emoteonly toggle - Toggles the "emoteonly" reward type without unlinking it
                 */
                if (args[1].equalsIgnoreCase('toggle')) {
                    if (emoteOnlyToggle === false) {
                        if (emoteOnlyID.equals('noIDSet')) {
                            $.say($.whisperPrefix(sender) + $.lang.get('channelPointsHandler.emoteonly.toggle.id'));
                            return;
                        }
                        if (emoteOnlyDuration === 0) {
                            $.say($.whisperPrefix(sender) + $.lang.get('channelPointsHandler.emoteonly.toggle.duration'));
                            return;
                        }
                    }
                    emoteOnlyToggle = !emoteOnlyToggle;
                    $.setIniDbBoolean('channelPointsSettings', 'emoteOnlyToggle', emoteOnlyToggle);
                    $.say($.whisperPrefix(sender) + (emoteOnlyToggle ? $.lang.get('channelPointsHandler.emoteonly.enabled', emoteOnlyReward) : $.lang.get('channelPointsHandler.emoteonly.disabled')));
                    return;
                }
            }

            /*
             * @commandpath channelpoints timeout - When redeemed, the redeeming user may timeout another user specified in the reward input box
             */
            if (action.equalsIgnoreCase('timeout')) {
                if (args[1] === undefined) {

                    if (timeoutToggle === false) {
                        $.say($.whisperPrefix(sender) + $.lang.get('channelPointsHandler.timeout.info'));
                        return;
                    }
                    $.say($.whisperPrefix(sender) + $.lang.get('channelPointsHandler.timeout.current', timeoutReward, timeoutDuration));
                    return;
                }

                /*
                 * @commandpath channelpoints timeout usage - Gives usage information for the "timeout" reward type
                 */
                if (args[1].equalsIgnoreCase('usage')) {
                    $.say($.whisperPrefix(sender) + $.lang.get('channelPointsHandler.timeout.usage'));
                    return;
                }

                /*
                 * @commandpath channelpoints timeout config - Starts the process of linking a channel point redemption to the "timeout" reward type
                 */
                if (args[1].equalsIgnoreCase('config')) {
                    timeoutConfig = !timeoutConfig;
                    $.setIniDbBoolean('channelPointsSettings', 'timeoutConfig', timeoutConfig);
                    if (timeoutConfig === true) {
                        $.say($.whisperPrefix(sender) + $.lang.get('channelPointsHandler.timeout.config.start'));
                        timeoutID = 'noIDSet';
                        timeoutReward = 'noNameSet';
                        $.setIniDbBoolean('channelPointsSettings', 'timeoutID', timeoutID);
                        $.setIniDbBoolean('channelPointsSettings', 'timeoutReward', timeoutReward);
                        return;
                    }
                    $.say($.whisperPrefix(sender) + $.lang.get('channelPointsHandler.config.failed'));
                    // config is closed when reward is successfully redeemed please see reward ID config in channel point events below
                    return;
                }

                /*
                 * @commandpath channelpoints timeout duration - Indicates or sets the duration of the timeout, in seconds, when redeemed
                 */
                if (args[1].equalsIgnoreCase('duration')) {
                    if (args[2] === undefined) {
                        if (timeoutDuration === 0) {
                            $.say($.whisperPrefix(sender) + $.lang.get('channelPointsHandler.timeout.duration.notset'));
                            return;
                        }
                        $.say($.whisperPrefix(sender) + $.lang.get('channelPointsHandler.timeout.duration.usage', timeoutDuration));
                        return;
                    }
                    if (isNaN(args[2])) {
                        $.say($.whisperPrefix(sender) + $.lang.get('channelPointsHandler.nan'));
                        return;
                    }
                    timeoutDuration = args[2];
                    $.setIniDbNumber('channelPointsSettings', 'timeoutDuration', timeoutDuration);
                    $.say($.whisperPrefix(sender) + $.lang.get('channelPointsHandler.timeout.duration.message', timeoutDuration));
                }

                /*
                 * @commandpath channelpoints timeout toggle - Toggles the "timeout" reward type without unlinking it
                 */
                if (args[1].equalsIgnoreCase('toggle')) {
                    if (timeoutToggle === false) {
                        if (timeoutID.equals('noIDSet')) {
                            $.say($.whisperPrefix(sender) + $.lang.get('channelPointsHandler.timeout.toggle.id'));
                            return;
                        }
                        if (timeoutDuration === 0) {
                            $.say($.whisperPrefix(sender) + $.lang.get('channelPointsHandler.timeout.toggle.duration'));
                            return;
                        }
                    }
                    timeoutToggle = !timeoutToggle;
                    $.setIniDbBoolean('channelPointsSettings', 'timeoutToggle', timeoutToggle);
                    $.say($.whisperPrefix(sender) + (timeoutToggle ? $.lang.get('channelPointsHandler.timeout.enabled', timeoutReward) : $.lang.get('channelPointsHandler.timeout.disabled')));
                    return;
                }
            }

        }
    });

    /*
     * @event channelPointRedemptions
     */
    $.bind('pubSubChannelPoints', function (event) {
        var rewardID = event.getRewardID(),
                username = event.getUsername(),
                displayName = event.getDisplayName(),
                rewardTitle = event.getRewardTitle(),
                userInput = event.getUserInput();

        Packages.com.gmt2001.Console.debug.println("Channel point event " + rewardTitle + " parsed to javascript." + " ID is: " + rewardID);

        /*
         * reward ID config
         */
        if (transferConfig === true) {
            transferID = rewardID;
            transferReward = rewardTitle;
            $.setIniDbBoolean('channelPointsSettings', 'transferID', transferID);
            $.setIniDbBoolean('channelPointsSettings', 'transferReward', transferReward);
            transferConfig = false;
            $.setIniDbBoolean('channelPointsSettings', 'transferConfig', transferConfig);
            $.say($.lang.get('channelPointsHandler.transfer.config.complete', transferReward));
            return;
        }

        if (giveAllConfig === true) {
            giveAllID = rewardID;
            giveAllReward = rewardTitle;
            $.setIniDbBoolean('channelPointsSettings', 'giveAllID', giveAllID);
            $.setIniDbBoolean('channelPointsSettings', 'giveAllReward', giveAllReward);
            giveAllConfig = false;
            $.setIniDbBoolean('channelPointsSettings', 'giveAllConfig', giveAllConfig);
            $.say($.lang.get('channelPointsHandler.giveAll.config.complete', giveAllReward));
            return;
        }

        if (emoteOnlyConfig === true) {
            emoteOnlyID = rewardID;
            emoteOnlyReward = rewardTitle;
            $.setIniDbBoolean('channelPointsSettings', 'emoteOnlyID', emoteOnlyID);
            $.setIniDbBoolean('channelPointsSettings', 'emoteOnlyReward', emoteOnlyReward);
            emoteOnlyConfig = false;
            $.setIniDbBoolean('channelPointsSettings', 'emoteOnlyConfig', emoteOnlyConfig);
            $.say($.lang.get('channelPointsHandler.emoteOnly.config.complete', emoteOnlyReward));
            return;
        }

        if (timeoutConfig === true) {
            if (userInput.equals('')) {
                $.say($.lang.get('channelPointsHandler.timeout.nouserinput'));
                timeoutConfig = false;
                $.setIniDbBoolean('channelPointsSettings', 'timeoutConfig', timeoutConfig);
                return;
            }
            timeoutID = rewardID;
            timeoutReward = rewardTitle;
            $.setIniDbBoolean('channelPointsSettings', 'timeoutID', timeoutID);
            $.setIniDbBoolean('channelPointsSettings', 'timeoutReward', timeoutReward);
            timeoutConfig = false;
            $.setIniDbBoolean('channelPointsSettings', 'timeoutConfig', timeoutConfig);
            $.say($.lang.get('channelPointsHandler.timeout.config.complete', timeoutReward));
            return;
        }

        if (commandConfig.length > 0) {
            if (findRewardCommandIndex(rewardID) !== -1) {
                $.say($.lang.get('channelPointsHandler.command.add.failed', rewardTitle));
            }

            var data = {
                'id': rewardID,
                'title': rewardTitle,
                'command': commandConfig
            };
            commands.push(data);
            $.setIniDbString('channelPointsSettings', 'commands', JSON.stringify(commands));
            commandConfig = '';
            $.setIniDbString('channelPointsSettings', 'commandConfig', commandConfig);
            $.say($.lang.get('channelPointsHandler.command.add.complete', data.title, data.command));
            return;
        }

        /*
         * transfer
         */
        if (rewardID.equals(transferID)) {
            if (transferToggle === true) {
                Packages.com.gmt2001.Console.debug.println("transferRunStart");
                if (transferAmount < 2) {
                    pointName = $.pointNameSingle;
                } else {
                    pointName = $.pointNameMultiple;
                }
                $.inidb.incr('points', username, transferAmount);
                $.say($.whisperPrefix(displayName) + ' you have been awarded ' + transferAmount + ' ' + pointName + ' by redeeming ' + rewardTitle);
                return;
            }
        }

        /*
         * give all
         */
        if (rewardID.equals(giveAllID)) {
            if (giveAllToggle === true) {
                Packages.com.gmt2001.Console.debug.println("giveAllRunStart");
                $.giveAll(giveAllAmount, displayName);
                return;
            }
        }

        /*
         * emote only
         */
        if (rewardID.equals(emoteOnlyID)) {
            if (emoteOnlyToggle === true) {
                Packages.com.gmt2001.Console.debug.println("emoteOnlyRunStart" + emoteOnlyDuration);
                $.say('/emoteonly');
                setTimeout(emoteOnlyOff, emoteOnlyDuration * 1e3);
                return;
            }
        }

        /*
         * timeout
         */
        if (rewardID.equals(timeoutID)) {
            if (timeoutToggle === true) {
                Packages.com.gmt2001.Console.debug.println("timeoutRunStart");
                userInput = $.user.sanitize(userInput);
                $.say('/timeout ' + userInput + ' ' + timeoutDuration);
                $.say(userInput + ' has been timed out for ' + timeoutDuration + ' seconds by ' + displayName);
                //TODO add check to ensure user is in chat
                return;
            }
        }

        var cmd = findRewardCommand(rewardID);

        if (cmd !== null) {
            var cmdEvent = new Packages.tv.phantombot.event.command.CommandEvent($.botName, "channelPoints_" + rewardTitle, username + ' ' + displayName + ' "' + $.javaString(userInput).replaceAll("\"", "\\\"") + '"');
            var tag = $.transformers.tags(cmdEvent, cmd.command, false, ['twitch', ['commandevent', 'noevent']]);
            if (tag !== null) {
                $.say(tag);
            }
        }
    });

    /*
     * exit emote only mode after required time
     */
    function emoteOnlyOff() {
        $.say('/emoteonlyoff');
    }

    function findRewardCommandIndex(rewardID) {
        rewardID = $.jsString(rewardID);
        for (var i = 0; i < commands.length; i++) {
            if (rewardID === commands[i].id) {
                return i;
            }
        }

        return -1;
    }

    function findRewardCommand(rewardID) {
        var idx = findRewardCommandIndex(rewardID);

        if (idx === -1) {
            return null;
        } else {
            return commands[idx];
        }
    }

    /*
     * add chat commands
     */
    $.bind('initReady', function () {
        $.registerChatCommand('./handlers/channelPointsHandler.js', 'channelpoints', $.PERMISSION.Admin);
        $.registerChatSubcommand('channelpoints', 'info', $.PERMISSION.Admin);
        $.registerChatSubcommand('channelpoints', 'usage', $.PERMISSION.Admin);
        $.registerChatSubcommand('channelpoints', 'transfer', $.PERMISSION.Admin);
        $.registerChatSubcommand('channelpoints', 'giveall', $.PERMISSION.Admin);
        $.registerChatSubcommand('channelpoints', 'emoteonly', $.PERMISSION.Admin);
        $.registerChatSubcommand('channelpoints', 'timeout', $.PERMISSION.Admin);
        $.registerChatSubcommand('channelpoints', 'command', $.PERMISSION.Admin);
    });

    /*
     * update API
     */
    $.updateChannelPointsConfig = updateChannelPointsConfig();
})();