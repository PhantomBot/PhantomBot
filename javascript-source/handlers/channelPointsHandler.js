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
        emoteOnlyStart = $.systemTime(),
        emoteOnlyMode = $.getSetIniDbBoolean('channelPointsSettings', 'timeoutToggle', false),
        timeoutToggle = $.getSetIniDbBoolean('channelPointsSettings', 'timeoutToggle', false),
        timeoutDuration = $.getSetIniDbNumber('channelPointsSettings', 'timeoutDuration', 0),
        timeoutID = $.getSetIniDbString('channelPointsSettings', 'timeoutID', 'noIDSet'),
        timeoutConfig = $.getSetIniDbBoolean('channelPointsSettings', 'timeoutConfig', false),
        timeoutReward = $.getSetIniDbString('channelPointsSettings', 'timeoutReward', 'noNameSet'),
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
                if (transferToggle === false && giveAllToggle === false && emoteOnlyToggle === false && timeoutToggle === false) {
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
                $.say($.whisperPrefix(sender) + $.lang.get('channelPointsHandler.current', config));
                return;
            }

            /*
             * @commandpath usage
             */
            if (action.equalsIgnoreCase('usage')) {
                $.say($.whisperPrefix(sender) + $.lang.get('channelPointsHandler.usage'));
                return;
            }

            /*
             * @commandpath info
             */
            if (action.equalsIgnoreCase('info')) {
                $.say($.whisperPrefix(sender) + $.lang.get('channelPointsHandler.info'));
                return;
            }

            /*
             * @commandpath transfer
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
                 * @commandpath transfer usage
                 */
                if (args[1].equalsIgnoreCase('usage')) {
                    $.say($.whisperPrefix(sender) + $.lang.get('channelPointsHandler.transfer.usage'));
                    return;
                }

                /*
                 * @commandpath transfer config
                 */
                if (args[1].equalsIgnoreCase('config')) {
                    transferConfig = !transferConfig;
                    $.setIniDbBoolean('channelPointsSettings', 'transferConfig', transferConfig);
                    if (transferConfig === true){
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
                 * @commandpath transfer amount
                 */
                if (args[1].equalsIgnoreCase('amount')) {
                    if (args[2] === undefined) {
                        if (transferAmount === 0){
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
                 * @commandpath transfer toggle
                 */
                if (args[1].equalsIgnoreCase('toggle')) {
                    if (transferToggle === false){
                        if (transferID.equals('noIDSet')) {
                            $.say($.whisperPrefix(sender) + $.lang.get('channelPointsHandler.transfer.toggle.id'));
                            return;
                        }
                        if (transferAmount === 0){
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
             * @commandpath giveall
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
                 * @commandpath giveall usage
                 */
                if (args[1].equalsIgnoreCase('usage')) {
                    $.say($.whisperPrefix(sender) + $.lang.get('channelPointsHandler.giveall.usage'));
                    return;
                }

                /*
                 * @commandpath giveall config
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
                 * @commandpath giveall amount
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
                 * @commandpath giveall toggle
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
             * @commandpath emoteonly
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
                 * @commandpath emoteonly usage
                 */
                if (args[1].equalsIgnoreCase('usage')) {
                    $.say($.whisperPrefix(sender) + $.lang.get('channelPointsHandler.emoteonly.usage'));
                    return;
                }

                /*
                 * @commandpath emoteonly config
                 */
                if (args[1].equalsIgnoreCase('config')) {
                    emoteOnlyConfig = !emoteOnlyConfig;
                    $.setIniDbBoolean('channelPointsSettings', 'emoteOnlyConfig', emoteOnlyConfig);
                    if (emoteOnlyConfig === true){
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
                 * @commandpath emoteonly duration
                 */
                if (args[1].equalsIgnoreCase('duration')) {
                    if (args[2] === undefined) {
                        if (emoteOnlyDuration === 0){
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
                 * @commandpath emoteonly toggle
                 */
                if (args[1].equalsIgnoreCase('toggle')) {
                    if (emoteOnlyToggle === false){
                        if (emoteOnlyID.equals('noIDSet')) {
                            $.say($.whisperPrefix(sender) + $.lang.get('channelPointsHandler.emoteonly.toggle.id'));
                            return;
                        }
                        if (emoteOnlyDuration === 0){
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
             * @commandpath timeout
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
                 * @commandpath timeout usage
                 */
                if (args[1].equalsIgnoreCase('usage')) {
                    $.say($.whisperPrefix(sender) + $.lang.get('channelPointsHandler.timeout.usage'));
                    return;
                }

                /*
                 * @commandpath timeout config
                 */
                if (args[1].equalsIgnoreCase('config')) {
                    timeoutConfig = !timeoutConfig;
                    $.setIniDbBoolean('channelPointsSettings', 'timeoutConfig', timeoutConfig);
                    if (timeoutConfig === true){
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
                 * @commandpath timeout duration
                 */
                if (args[1].equalsIgnoreCase('duration')) {
                    if (args[2] === undefined) {
                        if (timeoutDuration === 0){
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
                 * @commandpath timeout toggle
                 */
                if (args[1].equalsIgnoreCase('toggle')) {
                    if (timeoutToggle === false){
                        if (timeoutID.equals('noIDSet')) {
                            $.say($.whisperPrefix(sender) + $.lang.get('channelPointsHandler.timeout.toggle.id'));
                            return;
                        }
                        if (timeoutDuration === 0){
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
    })

    /*
     * @event channelPointRedemptions
     */
    $.bind('pubSubChannelPoints', function (event) {
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
            if (userInput.equals('')){
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
                //TODO add check to ensure user is in chat
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