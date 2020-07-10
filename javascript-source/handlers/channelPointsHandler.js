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
    var pointName = $.pointNameMultiple
        transferToggle = $.getSetIniDbBoolean('channelPointsSettings', 'transferToggle', false),
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
        emoteOnlyStart = $.systemTime(),
        emoteOnlyMode = $.getSetIniDbBoolean('channelPointsSettings', 'timeoutToggle', false),
        timeoutToggle = $.getSetIniDbBoolean('channelPointsSettings', 'timeoutToggle', false),
        timeoutDuration = $.getSetIniDbNumber('channelPointsSettings', 'timeoutDuration', 0),
        timeoutID = $.getSetIniDbString('channelPointsSettings', 'timeoutID', 'noIDSet'),
        timeoutConfig = $.getSetIniDbBoolean('channelPointsSettings', 'timeoutConfig', false),
        timeoutReward = $.getSetIniDbString('channelPointsSettings', 'timeoutReward', 'noNameSet');

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
        emoteOnlyMode = $.getIniDbBoolean('channelPointsSettings', 'timeoutToggle', false),
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
                    $.setIniDbBoolean('channelPointsSettings', 'transferToggle', transferToggle);
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
                    if (isNaN(args[2])){
                        $.say($.whisperPrefix(sender) + $.lang.get('channelPointsHandler.nan'));
                        return;
                    }
                    transferAmount = args[2];
                    $.setIniDbNumber('channelPointsSettings', 'transferAmount', transferAmount);
                    $.say($.whisperPrefix(sender) + $.lang.get('channelPointsHandler.transfer.amount.message', transferAmount));
                }

                /*
                 * @commandpath transfer config
                 */
                if (args[1].equalsIgnoreCase('config')) {
                    transferConfig = !transferConfig;
                    $.setIniDbBoolean('channelPointsSettings', 'transferConfig', transferConfig);
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
                    $.setIniDbBoolean('channelPointsSettings', 'giveAllToggle', giveAllToggle);
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
                    if (isNaN(args[2])){
                        $.say($.whisperPrefix(sender) + $.lang.get('channelPointsHandler.nan'));
                        return;
                    }
                    giveAllAmount = args[2];
                    $.setIniDbNumber('channelPointsSettings', 'giveAllAmount', giveAllAmount);
                    $.say($.whisperPrefix(sender) + $.lang.get('channelPointsHandler.giveall.amount.message', giveAllAmount));
                    return;
                }

                /*
                 * @commandpath giveAll config
                 */
                if (args[1].equalsIgnoreCase('config')) {
                    giveAllConfig = !giveAllConfig;
                    $.setIniDbBoolean('channelPointsSettings', 'giveAllConfig', giveAllConfig);
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
                    $.setIniDbBoolean('channelPointsSettings', 'emoteOnlyToggle', emoteOnlyToggle);
                    $.say($.whisperPrefix(sender) + (emoteOnlyToggle ? $.lang.get('channelPointsHandler.emoteOnly.enabled', emoteOnlyReward) : $.lang.get('channelPointsHandler.emoteOnly.disabled')));
                    return;
                }

                /*
                 * @commandpath emoteOnly duration
                 */
                if (args[1].equalsIgnoreCase('duration')) {
                    if (args[2] === undefined) {
                        $.say($.whisperPrefix(sender) + $.lang.get('channelPointsHandler.emoteOnly.duration.usage', emoteOnlyDuration));
                        return;
                    }
                    if (isNaN(args[2])){
                        $.say($.whisperPrefix(sender) + $.lang.get('channelPointsHandler.nan'));
                        return;
                    }
                    emoteOnlyDuration = args[2];
                    $.setIniDbNumber('channelPointsSettings', 'emoteOnlyDuration', emoteOnlyDuration);
                    $.say($.whisperPrefix(sender) + $.lang.get('channelPointsHandler.emoteOnly.duration.message', emoteOnlyDuration));
                }

                /*
                 * @commandpath emoteOnly config
                 */
                if (args[1].equalsIgnoreCase('config')) {
                    emoteOnlyConfig = !emoteOnlyConfig;
                    $.setIniDbBoolean('channelPointsSettings', 'emoteOnlyConfig', emoteOnlyConfig);
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
                    $.setIniDbBoolean('channelPointsSettings', 'timeoutToggle', timeoutToggle);
                    $.say($.whisperPrefix(sender) + (timeoutToggle ? $.lang.get('channelPointsHandler.timeout.enabled', timeoutReward) : $.lang.get('channelPointsHandler.timeout.disabled')));
                    return;
                }

                /*
                 * @commandpath timeout duration
                 */
                if (args[1].equalsIgnoreCase('duration')) {
                    if (args[2] === undefined) {
                        $.say($.whisperPrefix(sender) + $.lang.get('channelPointsHandler.timeout.duration.usage', timeoutDuration));
                        return;
                    }
                    if (isNaN(args[2])){
                        $.say($.whisperPrefix(sender) + $.lang.get('channelPointsHandler.nan'));
                        return;
                    }
                    timeoutDuration = args[2];
                    $.setIniDbNumber('channelPointsSettings', 'timeoutDuration', timeoutDuration);
                    $.say($.whisperPrefix(sender) + $.lang.get('channelPointsHandler.timeout.duration.message', timeoutDuration));
                }

                /*
                 * @commandpath timeout config
                 */
                if (args[1].equalsIgnoreCase('config')) {
                    timeoutConfig = !timeoutConfig;
                    $.setIniDbBoolean('channelPointsSettings', 'timeoutConfig', timeoutConfig);
                    $.say($.whisperPrefix(sender) + (timeoutConfig ? $.lang.get('channelPointsHandler.timeout.config.on') : $.lang.get('channelPointsHandler.timeout.config.off', timeoutReward)));
                    return
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
            $.setIniDbBoolean('channelPointsSettings', 'transferID', transferID);
            $.setIniDbBoolean('channelPointsSettings', 'transferReward', transferReward);
            return;
        }

        if (giveAllConfig === true) {
            com.gmt2001.Console.debug.println("giveAllConfig");
            giveAllID = rewardID;
            giveAllReward = rewardTitle;
            $.setIniDbBoolean('channelPointsSettings', 'giveAllID', giveAllID);
            $.setIniDbBoolean('channelPointsSettings', 'giveAllReward', giveAllReward);
            return;
        }

        if (emoteOnlyConfig === true) {
            com.gmt2001.Console.debug.println("emoteOnlyConfig");
            emoteOnlyID = rewardID;
            emoteOnlyReward = rewardTitle;
            $.setIniDbBoolean('channelPointsSettings', 'emoteOnlyID', emoteOnlyID);
            $.setIniDbBoolean('channelPointsSettings', 'emoteOnlyReward', emoteOnlyReward);
            return;
        }

        if (timeoutConfig === true) {
            com.gmt2001.Console.debug.println("timeoutConfig");
            timeoutID = rewardID;
            timeoutReward = rewardTitle;
            $.setIniDbBoolean('channelPointsSettings', 'timeoutID', timeoutID);
            $.setIniDbBoolean('channelPointsSettings', 'timeoutReward', timeoutReward);
            return;
        }

        /*
         * transfer
         */
        if (rewardID.equals(transferID)){
            if (transferToggle === true){
                com.gmt2001.Console.debug.println("transferRunStart");
                if (transferAmount < 2){
                    pointName = $.pointNameSingle;
                }
                else{
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
        if (rewardID.equals(giveAllID)){
            if (giveAllToggle === true){
                com.gmt2001.Console.debug.println("giveAllRunStart");
                $.giveAll(giveAllAmount, displayName);
                return;
            }
        }

        /*
         * emote only
         */
        if (rewardID.equals(emoteOnlyID)){
            if (emoteOnlyToggle ===true){
                com.gmt2001.Console.debug.println("emoteOnlyRunStart" + emoteOnlyDuration);
                $.say('/emoteonly');
                setTimeout(emoteOnlyOff, emoteOnlyDuration * 1e3);
                return;
            }
        }

        /*
         * timeout
         */
        if (rewardID.equals(timeoutID)){
            if (timeoutToggle === true) {
                com.gmt2001.Console.debug.println("timeoutRunStart");
                userInput = $.user.sanitize(userInput);
                $.say('/timeout ' + userInput + ' ' + timeoutDuration);
                $.say(userInput + ' has been timed out for ' + timeoutDuration + ' seconds by ' + displayName);
                return;
            }
        }




    });

    /*
     * add chat commands
     */
    $.bind('initReady', function () {
        $.registerChatCommand('./handlers/channelPointsHandler.js', 'channelpoints', 1);
    });

    /*
     * update API
     */
    $.updateChannelPointsConfig = updateChannelPointsConfig();

})();


/*
 * exit emote only mode after required time
 */
function emoteOnlyOff(){
    $.say('/emoteonlyoff')
}