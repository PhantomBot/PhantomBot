/*
 * Copyright (C) 2016-2020 phantombot.tv
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
 * This module is to handle channel point redemption actions
 * Author: MzLiv
 */
(function () {
    var transferToggle = $.getSetIniDbBoolean('settings', 'transferToggle', false),
        transferAmount = $.getSetIniDbNumber('settings', 'transferAmount', 0),
        transferID = $.getSetIniDbString('settings', 'transferID', 'noIDSet'),
        transferConfig = $.getSetIniDbBoolean('settings', 'transferConfig', false),
        transferReward = $.getSetIniDbString('settings', 'transferReward', 'noNameSet'),
        giveAllToggle = $.getSetIniDbBoolean('settings', 'giveAllToggle', false),
        giveAllAmount = $.getSetIniDbNumber('settings', 'giveAllAmount', 0),
        giveAllID = $.getSetIniDbString('settings', 'giveAllID', 'noIDSet'),
        giveAllConfig = $.getSetIniDbBoolean('settings', 'giveAllConfig', false),
        giveAllReward = $.getSetIniDbString('settings', 'giveAllReward', 'noNameSet'),
        emoteOnlyToggle = $.getSetIniDbBoolean('settings', 'emoteOnlyToggle', false),
        emoteOnlyDuration = $.getSetIniDbNumber('settings', 'emoteOnlyDuration', 0),
        emoteOnlyID = $.getSetIniDbString('settings', 'emoteOnlyID', 'noIDSet'),
        emoteOnlyConfig = $.getSetIniDbBoolean('settings', 'emoteOnlyConfig', false),
        emoteOnlyReward = $.getSetIniDbString('settings', 'emoteOnlyReward', 'noNameSet'),
        timeoutToggle = $.getSetIniDbBoolean('settings', 'timeoutToggle', false),
        timeoutDuration = $.getSetIniDbNumber('settings', 'timeoutDuration', 0),
        timeoutID = $.getSetIniDbString('settings', 'timeoutID', 'noIDSet'),
        timeoutConfig = $.getSetIniDbBoolean('settings', 'timeoutConfig', false),
        timeoutReward = $.getSetIniDbString('settings', 'timeoutReward', 'noNameSet'),
        botCommandToggle = $.getSetIniDbBoolean('settings', 'botCommandToggle', false),
        botCommandID = $.getSetIniDbString('settings', 'botCommandID', 'noIDSet'),
        botCommandConfig = $.getSetIniDbBoolean('settings', 'botCommandConfig', false),
        botCommandReward = $.getSetIniDbString('settings', 'botCommandReward', 'noNameSet');

    /*
     * @function updateChannelPointsConfig
     */
    function updateChannelPointsConfig() {
        transferToggle = $.getIniDbBoolean('settings', 'transferToggle', false);
        transferAmount = $.getIniDbNumber('settings', 'transferAmount', 0);
        transferID = $.getIniDbString('settings', 'transferID', 'noIDSet');
        transferConfig = $.getIniDbBoolean('settings', 'transferConfig', false);
        transferReward = $.getIniDbString('settings', 'transferReward', 'noNameSet');
        giveAllToggle = $.getIniDbBoolean('settings', 'giveAllToggle', false);
        giveAllAmount = $.getIniDbNumber('settings', 'giveAllAmount', 0);
        giveAllID = $.getIniDbString('settings', 'giveAllID', 'noIDSet');
        giveAllConfig = $.getIniDbBoolean('settings', 'giveAllConfig', false);
        giveAllReward = $.getIniDbString('settings', 'giveAllReward', 'noNameSet');
        emoteOnlyToggle = $.getIniDbBoolean('settings', 'emoteOnlyToggle', false);
        emoteOnlyDuration = $.getIniDbNumber('settings', 'emoteOnlyDuration', 0);
        emoteOnlyID = $.getIniDbString('settings', 'emoteOnlyID', 'noIDSet');
        emoteOnlyConfig = $.getIniDbBoolean('settings', 'emoteOnlyConfig', false);
        emoteOnlyReward = $.getIniDbString('settings', 'emoteOnlyReward', 'noNameSet');
        timeoutToggle = $.getIniDbBoolean('settings', 'timeoutToggle', false);
        timeoutDuration = $.getIniDbNumber('settings', 'timeoutDuration', 0);
        timeoutID = $.getIniDbString('settings', 'timeoutID', 'noIDSet');
        timeoutConfig = $.getIniDbBoolean('settings', 'timeoutConfig', false);
        timeoutReward = $.getIniDbString('settings', 'timeoutReward', 'noNameSet');
        botCommandToggle = $.getIniDbBoolean('settings', 'botCommandToggle', false);
        botCommandID = $.getIniDbString('settings', 'botCommandID', 'noIDSet');
        botCommandConfig = $.getIniDbBoolean('settings', 'botCommandConfig', false);
        botCommandReward = $.getIniDbString('settings', 'botCommandReward', 'noNameSet');
    }

    /*
     * @event command
     */
    $.bind('command', function (event) {
        var sender = event.getSender(),
            command = event.getCommand(),
            args = event.getArgs(),
            action = args[0];

        if (command.equalsIgnoreCase('channelpoints')) {
            if (action === undefined) {
                $.say($.whisperPrefix(sender) + $.lang.get('channelPointsHandler.usage'));
                return;
            }

            /*
             * @commandpath transfer
             */
            if (action.equalsIgnoreCase('transfer')) {
                if (args[1] === undefined) {
                    if (transferID.equals('noIDSet')) {
                        $.say($.whisperPrefix(sender) + $.lang.get('channelPointsHandler.transfer.setup'));
                        return;
                    }
                    $.say($.whisperPrefix(sender) + (transferToggle ? $.lang.get('channelPointsHandler.transfer.setup.enabled', transferReward, transferAmount) : $.lang.get('channelPointsHandler.transfer.setup.disabled')));
                    return;
                }

                /*
                 * @commandpath transfer help
                 */
                if (args[1].equalsIgnoreCase('help')) {
                    $.say($.whisperPrefix(sender) + $.lang.get('channelPointsHandler.transfer.usage'));
                    return;
                }

                /*
                 * @commandpath transfer toggle
                 */
                if (args[1].equalsIgnoreCase('toggle')) {
                    if (transferID.equals('noIDSet')) {
                        $.say($.whisperPrefix(sender) + $.lang.get('channelPointsHandler.transfer.id'));
                        return;
                    }
                    transferToggle = !transferToggle;
                    $.setIniDbBoolean('settings', 'transferToggle', transferToggle);
                    $.say($.whisperPrefix(sender) + (transferToggle ? $.lang.get('channelPointsHandler.transfer.enabled', transferReward) : $.lang.get('channelPointsHandler.transfer.disabled')));
                    return;
                }

                /*
                 * @commandpath transfer amount
                 */
                if (args[1].equalsIgnoreCase('amount')) {
                    if (args[2] === undefined) {
                        $.say($.whisperPrefix(sender) + $.lang.get('channelPointsHandler.transfer.amount.usage', transferAmount));
                        return;
                    }
                    transferAmount = $.getIniDbNumber('settings', 'transferAmount', args[2]);
                    $.say($.whisperPrefix(sender) + $.lang.get('channelPointsHandler.transfer.amount.message', transferAmount));
                }

                /*
                 * @commandpath transfer config
                 */
                if (args[1].equalsIgnoreCase('config')) {
                    transferConfig = !transferConfig;
                    $.setIniDbBoolean('settings', 'transferConfig', transferConfig);
                    $.say($.whisperPrefix(sender) + (transferConfig ? $.lang.get('channelPointsHandler.transfer.config.on') : $.lang.get('channelPointsHandler.transfer.config.off', transferReward)));
                    return;
                }
            }

            /*
             * @commandpath giveAll
             */
            if (action.equalsIgnoreCase('giveall')) {
                if (args[1] === undefined) {
                    if (giveAllID.equals('noIDSet')) {
                        $.say($.whisperPrefix(sender) + $.lang.get('channelPointsHandler.giveall.setup'));
                    }
                    $.say($.whisperPrefix(sender) + (giveAllToggle ? $.lang.get('channelPointsHandler.giveall.setup.enabled', giveAllReward, giveAllAmount) : $.lang.get('channelPointsHandler.giveall.setup.disabled')));
                    return;
                }

                /*
                 * @commandpath giveAll help
                 */
                if (args[1].equalsIgnoreCase('help')) {
                    $.say($.whisperPrefix(sender) + $.lang.get('channelPointsHandler.giveall.usage'));
                    return;
                }

                /*
                 * @commandpath giveAll toggle
                 */
                if (args[1].equalsIgnoreCase('toggle')) {
                    if (giveAllID.equals('noIDSet')) {
                        $.say($.whisperPrefix(sender) + $.lang.get('channelPointsHandler.giveall.id'));
                        return;
                    }
                    giveAllToggle = !giveAllToggle;
                    $.setIniDbBoolean('settings', 'giveAllToggle', giveAllToggle);
                    $.say($.whisperPrefix(sender) + (giveAllToggle ? $.lang.get('channelPointsHandler.giveall.enabled', giveAllReward) : $.lang.get('channelPointsHandler.giveall.disabled')));
                    return;
                }

                /*
                 * @commandpath giveAll amount
                 */
                if (args[1].equalsIgnoreCase('amount')) {
                    if (args[2] === undefined) {
                        $.say($.whisperPrefix(sender) + $.lang.get('channelPointsHandler.giveall.amount.usage', giveAllAmount));
                        return;
                    }
                    transferAmount = $.getIniDbNumber('settings', 'Amount', args[2]);
                    $.say($.whisperPrefix(sender) + $.lang.get('channelPointsHandler.giveall.amount.message', giveAllAmount));
                    return;
                }

                /*
                 * @commandpath giveAll config
                 */
                if (args[1].equalsIgnoreCase('config')) {
                    giveAllConfig = !giveAllConfig;
                    $.setIniDbBoolean('settings', 'giveAllConfig', giveAllConfig);
                    $.say($.whisperPrefix(sender) + (giveAllConfig ? $.lang.get('channelPointsHandler.giveall.config.on') : $.lang.get('channelPointsHandler.giveall.config.off', giveAllReward)));
                    return;
                }
            }

            /*
             * @commandpath emoteOnly
             */
            if (action.equalsIgnoreCase('emoteonly')) {
                if (args[1] === undefined) {
                    if (emoteOnlyID.equals('noIDSet')) {
                        $.say($.whisperPrefix(sender) + $.lang.get('channelPointsHandler.emoteOnly.setup'));
                        return;
                    }
                    $.say($.whisperPrefix(sender) + (emoteOnlyToggle ? $.lang.get('channelPointsHandler.emoteOnly.setup.enabled', emoteOnlyReward, emoteOnlyDuration) : $.lang.get('channelPointsHandler.emoteOnly.setup.disabled')));
                    return;
                }

                /*
                 * @commandpath emoteOnly help
                 */
                if (args[1].equalsIgnoreCase('help')) {
                    $.say($.whisperPrefix(sender) + $.lang.get('channelPointsHandler.emoteOnly.usage'));
                    return;
                }

                /*
                 * @commandpath emoteOnly toggle
                 */
                if (args[1].equalsIgnoreCase('toggle')) {
                    if (emoteOnlyID.equals('noIDSet')) {
                        $.say($.whisperPrefix(sender) + $.lang.get('channelPointsHandler.emoteOnly.id'));
                        return;
                    }
                    emoteOnlyToggle = !emoteOnlyToggle;
                    $.setIniDbBoolean('settings', 'emoteOnlyToggle', emoteOnlyToggle);
                    $.say($.whisperPrefix(sender) + (emoteOnlyToggle ? $.lang.get('channelPointsHandler.emoteOnly.enabled', emoteOnlyReward) : $.lang.get('channelPointsHandler.emoteOnly.disabled')));
                    return;
                }

                /*
                 * @commandpath emoteOnly duration
                 */
                if (args[1].equalsIgnoreCase('amount')) {
                    if (args[2] === undefined) {
                        $.say($.whisperPrefix(sender) + $.lang.get('channelPointsHandler.emoteOnly.duration.usage', emoteOnlyDuration));
                        return;
                    }
                    emoteOnlyDuration = $.getIniDbNumber('settings', 'emoteOnlyDuration', args[2]);
                    $.say($.whisperPrefix(sender) + $.lang.get('channelPointsHandler.emoteOnly.duration.message', emoteOnlyDuration));
                }

                /*
                 * @commandpath emoteOnly config
                 */
                if (args[1].equalsIgnoreCase('config')) {
                    emoteOnlyConfig = !emoteOnlyConfig;
                    $.setIniDbBoolean('settings', 'emoteOnlyConfig', emoteOnlyConfig);
                    $.say($.whisperPrefix(sender) + (emoteOnlyConfig ? $.lang.get('channelPointsHandler.emoteOnly.config.on') : $.lang.get('channelPointsHandler.emoteOnly.config.off', emoteOnlyReward)));
                    return
                }
            }

            /*
             * @commandpath timeout
             */
            if (action.equalsIgnoreCase('timeout')) {
                if (args[1] === undefined) {
                    if (timeoutID.equals('noIDSet')) {
                        $.say($.whisperPrefix(sender) + $.lang.get('channelPointsHandler.timeout.setup'));
                        return;
                    }
                    $.say($.whisperPrefix(sender) + (timeoutToggle ? $.lang.get('channelPointsHandler.timeout.setup.enabled', timeoutReward, timeoutDuration) : $.lang.get('channelPointsHandler.timeout.setup.disabled')));
                    return;
                }

                /*
                 * @commandpath timeout help
                 */
                if (args[1].equalsIgnoreCase('help')) {
                    $.say($.whisperPrefix(sender) + $.lang.get('channelPointsHandler.timeout.usage'));
                    return;
                }

                /*
                 * @commandpath timeout toggle
                 */
                if (args[1].equalsIgnoreCase('toggle')) {
                    if (timeoutID.equals('noIDSet')) {
                        $.say($.whisperPrefix(sender) + $.lang.get('channelPointsHandler.timeout.id'));
                        return;
                    }
                    timeoutToggle = !timeoutToggle;
                    $.setIniDbBoolean('settings', 'timeoutToggle', timeoutToggle);
                    $.say($.whisperPrefix(sender) + (timeoutToggle ? $.lang.get('channelPointsHandler.timeout.enabled', timeoutReward) : $.lang.get('channelPointsHandler.timeout.disabled')));
                    return;
                }

                /*
                 * @commandpath timeout duration
                 */
                if (args[1].equalsIgnoreCase('amount')) {
                    if (args[2] === undefined) {
                        $.say($.whisperPrefix(sender) + $.lang.get('channelPointsHandler.timeout.duration.usage', timeoutDuration));
                        return;
                    }
                    timeoutDuration = $.getIniDbNumber('settings', 'timeoutDuration', args[2]);
                    $.say($.whisperPrefix(sender) + $.lang.get('channelPointsHandler.timeout.duration.message', timeoutDuration));
                }

                /*
                 * @commandpath timeout config
                 */
                if (args[1].equalsIgnoreCase('config')) {
                    timeoutConfig = !timeoutConfig;
                    $.setIniDbBoolean('settings', 'timeoutConfig', timeoutConfig);
                    $.say($.whisperPrefix(sender) + (timeoutConfig ? $.lang.get('channelPointsHandler.timeout.config.on') : $.lang.get('channelPointsHandler.timeout.config.off', timeoutReward)));
                    return
                }
            }

            /*
             * @commandpath botCommand
             */
            if (action.equalsIgnoreCase('botCommand')) {
                if (args[1] === undefined) {
                    if (botCommandID.equals('noIDSet')) {
                        $.say($.whisperPrefix(sender) + $.lang.get('channelPointsHandler.botCommand.setup'));
                        return;
                    }
                    $.say($.whisperPrefix(sender) + (botCommandToggle ? $.lang.get('channelPointsHandler.botCommand.setup.enabled', botCommandReward) : $.lang.get('channelPointsHandler.botCommand.setup.disabled')));
                    return;
                }

                /*
                 * @commandpath botCommand help
                 */
                if (args[1].equalsIgnoreCase('help')) {
                    $.say($.whisperPrefix(sender) + $.lang.get('channelPointsHandler.botCommand.usage'));
                    return;
                }

                /*
                 * @commandpath botCommand toggle
                 */
                if (args[1].equalsIgnoreCase('toggle')) {
                    if (botCommandID.equals('noIDSet')) {
                        $.say($.whisperPrefix(sender) + $.lang.get('channelPointsHandler.botCommand.id'));
                        return;
                    }
                    botCommandToggle = !botCommandToggle;
                    $.setIniDbBoolean('settings', 'botCommandToggle', botCommandToggle);
                    $.say($.whisperPrefix(sender) + (botCommandToggle ? $.lang.get('channelPointsHandler.botCommand.enabled', botCommandReward) : $.lang.get('channelPointsHandler.botCommand.disabled')));
                    return;
                }

                /*
                 * @commandpath botCommand config
                 */
                if (args[1].equalsIgnoreCase('config')) {
                    botCommandConfig = !botCommandConfig;
                    $.setIniDbBoolean('settings', 'botCommandConfig', botCommandConfig);
                    $.say($.whisperPrefix(sender) + (botCommandConfig ? $.lang.get('channelPointsHandler.botCommand.config.on') : $.lang.get('channelPointsHandler.botCommand.config.off', botCommandReward)));
                    return;
                }
            }
        }
    })

    /*
     * @event channelPointRedemptions
     */
    $.bind('PubSubChannelPoints', function (event) {
        var redemptionID = event.getRedemptionID(),
            rewardID = event.getRewardID(),
            userID = event.getUserID(),
            username = event.getUsername(),
            displayName = event.getDisplayName(),
            rewardTitle = event.getRewardTitle(),
            cost = event.getCost(),
            inputPromt = event.getInputPrompt(),
            userInput = event.getUserInput(),
            fulfillmentStatus = event.getFulfillmentStatus();

        com.gmt2001.Console.debug.println("Channel point event " + rewardTitle + " parsed to javascript." + " ID is: " + rewardID);

        /*
         * reward ID config
         */
        if (transferConfig === true) {
            com.gmt2001.Console.debug.println("transferConfig");
            transferID = rewardID;
            transferReward = rewardTitle;
            return;
        }

        if (giveAllConfig === true) {
            com.gmt2001.Console.debug.println("giveAllConfig");
            giveAllID = rewardID;
            giveAllReward = rewardTitle;
            return;
        }

        if (emoteOnlyConfig === true) {
            com.gmt2001.Console.debug.println("emoteOnlyConfig");
            emoteOnlyID = rewardID;
            emoteOnlyReward = rewardTitle;
            return;
        }

        if (timeoutConfig === true) {
            com.gmt2001.Console.debug.println("timeoutConfig");
            timeoutID = rewardID;
            timeoutReward = rewardTitle;
            return;
        }

        if (botCommandConfig === true) {
            com.gmt2001.Console.debug.println("botCommandConfig");
            botCommandID = rewardID;
            botCommandReward = rewardTitle;
            return;
        }

        /*
         * transfer
         */
        if (rewardID.equals(transferID)){
            com.gmt2001.Console.debug.println("transfer");
            return;
        }

    })();


    $.bind('initReady', function () {
        $.registerChatCommand('./handlers/channelPointsHandler.js', 'channelpoints', 1);
    });

    /*
     * update API
     */
    $.updateChannelPointsConfig = updateChannelPointsConfig();

})();