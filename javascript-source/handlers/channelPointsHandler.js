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
 * This module is to handle channel point redemption actions
 * Author: MzLiv
 */

(function () {
    let commands = JSON.parse($.getSetIniDbString('channelPointsSettings', 'commands', '[]')),
            commandConfig = $.getSetIniDbString('channelPointsSettings', 'commandConfig', ''),
            lock = new Packages.java.util.concurrent.locks.ReentrantLock,
            managed = [];

    /*
     * @function updateChannelPointsConfig
     */
    function updateChannelPointsConfig() {
        commands = JSON.parse($.getIniDbString('channelPointsSettings', 'commands', '[]'));
        commandConfig = $.getIniDbString('channelPointsSettings', 'commandConfig', '');
    }

    /*
     * @event command
     */
    $.bind('command', function (event) {
        let sender = event.getSender(),
                command = event.getCommand(),
                args = event.getArgs(),
                action = args[0];

        /*
         * @commandpath channelpoints - Allows setting channel points redemptions to convert into custom commands, then execute command tags
         */
        if (command.equalsIgnoreCase('channelpoints')) {
            if (action === undefined || action === null) {
                $.say($.whisperPrefix(sender) + $.lang.get('channelPointsHandler.command.info'));
            } else {
                action = $.jsString(action).toLowerCase();
                /*
                 * @commandpath channelpoints example - Prints an example add subaction for the "command" rewards type
                 */
                if (action === 'example') {
                    $.say($.whisperPrefix(sender) + $.lang.get('channelPointsHandler.command.example'));
                    /*
                     * @commandpath channelpoints list - Lists each Reward ID and Title that is currently linked to the "command" reward type
                     */
                } else if (action === 'list') {
                    let active = '';
                    for (let i = 0; i < commands.length; i++) {
                        if (active.length > 0) {
                            active += ' === ';
                        }

                        active += commands[i].id + ' - ' + commands[i].title;
                    }

                    $.say($.whisperPrefix(sender) + $.lang.get('channelPointsHandler.command.list', active));
                    /*
                     * @commandpath channelpoints get - Given a channel point reward id, returns the custom command definition that will be parsed
                     */
                } else if (action === 'get') {
                    if (args[2] === undefined || $.jsString(args[2]).length === 0) {
                        $.say($.whisperPrefix(sender) + $.lang.get('channelPointsHandler.command.get.usage'));
                    } else {
                        let target = $.jsString(args[2]);
                        let cmd = findRewardCommand(target);

                        if (cmd === null) {
                            $.say($.whisperPrefix(sender) + $.lang.get('channelPointsHandler.command.get.404', target));
                        } else {
                            $.say($.whisperPrefix(sender) + $.lang.get('channelPointsHandler.command.get', cmd.title, cmd.command));
                        }
                    }
                    /*
                     * @commandpath channelpoints add - Starts the process of adding a "command" type redemption reward
                     */
                } else if (action === 'add') {
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
                    /*
                     * @commandpath channelpoints edit - Changes the command definition for a "command" type reward
                     */
                } else if (action === 'edit') {
                    if (args[2] === undefined || $.jsString(args[2]).length === 0 || args[3] === undefined || $.jsString(args[3]).length === 0) {
                        $.say($.whisperPrefix(sender) + $.lang.get('channelPointsHandler.command.edit.usage1'));
                        $.say($.whisperPrefix(sender) + $.lang.get('channelPointsHandler.command.add.usage2', $.botName));
                        $.say($.whisperPrefix(sender) + $.lang.get('channelPointsHandler.command.add.usage3'));
                    } else {
                        let target = $.jsString(args[2]);
                        let cmdid = findRewardCommandIndex(target);

                        if (cmdid === null) {
                            $.say($.whisperPrefix(sender) + $.lang.get('channelPointsHandler.command.get.404', target));
                        } else {
                            let cmd;
                            lock.lock();
                            try {
                                cmd = commands[cmdid];
                                cmd.command = args.slice(3).join(' ');
                                commands[cmdid] = cmd;
                                $.setIniDbString('channelPointsSettings', 'commands', JSON.stringify(commands));
                            } finally {
                                lock.unlock();
                            }

                            $.say($.whisperPrefix(sender) + $.lang.get('channelPointsHandler.command.edit', cmd.title, cmd.command));
                        }
                    }
                    /*
                     * @commandpath channelpoints remove - Removes a "command" type reward
                     */
                } else if (action === 'remove') {
                    if (args[2] === undefined || $.jsString(args[2]).length === 0) {
                        $.say($.whisperPrefix(sender) + $.lang.get('channelPointsHandler.command.remove.usage'));
                    } else {
                        let target = $.jsString(args[2]);
                        let cmdid = findRewardCommandIndex(target);

                        if (cmdid === null) {
                            $.say($.whisperPrefix(sender) + $.lang.get('channelPointsHandler.command.get.404', target));
                        } else {
                            let title = commands[cmdid].title;
                            lock.lock();
                            try {
                                commands.splice(cmdid, 1);
                                $.setIniDbString('channelPointsSettings', 'commands', JSON.stringify(commands));
                            } finally {
                                lock.unlock();
                            }

                            $.say($.whisperPrefix(sender) + $.lang.get('channelPointsHandler.command.remove', title));
                        }
                    }
                } else {
                    $.say($.whisperPrefix(sender) + $.lang.get('channelPointsHandler.command.usage'));
                }
            }
        }
    });

    /*
     * @event channelPointRedemptions
     * @usestransformers global twitch commandevent noevent channelpointsevent
     */
    $.bind('pubSubChannelPoints', function (event) {
        let rewardID = event.getRewardID(),
                rewardTitle = event.getRewardTitle();

        Packages.com.gmt2001.Console.debug.println("Channel point event " + rewardTitle + " parsed to javascript." + " ID is: " + rewardID);

        if (commandConfig.length > 0) {
            if (findRewardCommandIndex(rewardID) !== -1) {
                commandConfig = '';
                $.setIniDbString('channelPointsSettings', 'commandConfig', commandConfig);
                $.say($.lang.get('channelPointsHandler.command.add.failed', rewardTitle));
                return;
            }

            lock.lock();
            try {
                let data = {
                    'id': rewardID,
                    'title': rewardTitle,
                    'command': commandConfig
                };
                commands.push(data);
                $.setIniDbString('channelPointsSettings', 'commands', JSON.stringify(commands));
            } finally {
                lock.unlock();
            }
            commandConfig = '';
            $.setIniDbString('channelPointsSettings', 'commandConfig', commandConfig);
            $.say($.lang.get('channelPointsHandler.command.add.complete', data.title, data.command));
            return;
        }

        let cmd = findRewardCommand(rewardID);

        if (cmd !== null) {
            let cmdEvent = new Packages.tv.phantombot.event.command.CommandEvent($.botName, 'channelPoints_' + rewardTitle, '');
            let tag = $.transformers.tags(cmdEvent, cmd.command, ['twitch', ['commandevent', 'noevent', 'channelpointsevent']],
                    {customArgs: {redemption: event}});
            if (tag !== null) {
                $.say(tag);
            }
        }
    });

    function findRewardCommandIndex(rewardID) {
        rewardID = $.jsString(rewardID);
        for (let i = 0; i < commands.length; i++) {
            if (rewardID === commands[i].id) {
                return i;
            }
        }

        return -1;
    }

    function findRewardCommand(rewardID) {
        let idx = findRewardCommandIndex(rewardID);

        if (idx === -1) {
            return null;
        } else {
            return commands[idx];
        }
    }

    function reloadManagedRedeemables() {
        if (!$.twitchcache.isAffiliateOrPartner()) {
            return;
        }

        let jso = $.helix.getCustomReward(null, true);

        if (jso.getInt('_http') === 200 && jso.has('data')) {
            let jsa = jso.getJSONArray('data');

            lock.lock();
            try {
                if (jsa.length() === 0) {
                    managed = [];
                } else {
                    for (let i = 0; i < jsa.length(); i++) {
                        managed.push(jsa.getJSONObject(i).getString('id'));
                    }
                }
            } finally {
                lock.unlock();
            }
        }
    }

    /**
     * Marks a managed redemption as fulfilled
     *
     * @param {string} redeemableId The id of the redeemable that the user redeemed
     * @param {string} redemptionId The id of the redemption event
     */
    function updateRedemptionStatusFulfilled(redeemableId, redemptionId) {
        if (!$.twitchcache.isAffiliateOrPartner()) {
            return;
        }

        let rsp = $.helix.updateRedemptionStatus(Packages.java.util.Collections.singletonList(redemptionId), redeemableId,
                Packages.tv.phantombot.twitch.api.Helix.CustomRewardRedemptionStatus.FULFILLED);

        if (rsp.getInt('_http') !== 200 || !rsp.has('data')) {
            let error = 'Unknown Error';

            if (rsp.getInt('_http') === 200) {
                error = 'Got HTTP 200 but invalid response body';
            } else if (rsp.getInt('_http') > 0) {
                error = 'HTTP ' + rsp.getInt('_http') + ': ' + $.jsString(rsp.getString('message'));
            } else if (!rsp.getString('_exception').isBlank()) {
                error = $.jsString(rsp.getString('_exception')) + ' ' + $.jsString(rsp.getString('_exceptionMessage'));
            }

            $.log.error('Failed to set Redemption Fulfilled (' + redeemableId + ', ' + redemptionId + '): ' + error);
            $.consoleDebug(rsp.toString());
        }
    }

    /**
     * Marks a managed redemption as cancelled, refunding the users channel points
     *
     * @param {string} redeemableId The id of the redeemable that the user redeemed
     * @param {string} redemptionId The id of the redemption event
     */
    function updateRedemptionStatusCancelled(redeemableId, redemptionId) {
        if (!$.twitchcache.isAffiliateOrPartner()) {
            return;
        }

        let rsp = $.helix.updateRedemptionStatus(Packages.java.util.Collections.singletonList(redemptionId), redeemableId,
                Packages.tv.phantombot.twitch.api.Helix.CustomRewardRedemptionStatus.CANCELED);



        if (rsp.getInt('_http') !== 200 || !rsp.has('data')) {
            let error = 'Unknown Error';

            if (rsp.getInt('_http') === 200) {
                error = 'Got HTTP 200 but invalid response body';
            } else if (rsp.getInt('_http') > 0) {
                error = 'HTTP ' + rsp.getInt('_http') + ': ' + $.jsString(rsp.getString('message'));
            } else if (!rsp.getString('_exception').isBlank()) {
                error = $.jsString(rsp.getString('_exception')) + ' ' + $.jsString(rsp.getString('_exceptionMessage'));
            }

            $.log.error('Failed to set Redemption Cancelled (' + redeemableId + ', ' + redemptionId + '): ' + error);
            $.consoleDebug(rsp.toString());
        }
    }

    /**
     * Sets the enabled state of the redeemable
     *
     * @param {string} redeemableId The id of the redeemable that is being updated
     * @param {boolean} isEnabled The new enabled state
     */
    function setRedeemableEnabled(redeemableId, isEnabled) {
        if (!$.twitchcache.isAffiliateOrPartner()) {
            return;
        }

        let rsp = $.helix.updateCustomReward(redeemableId, null, null, isEnabled, null, null,
                null, null, null, null, null, null, null, null, null);

        if (rsp.getInt('_http') !== 200 || !rsp.has('data')) {
            let error = 'Unknown Error';

            if (rsp.getInt('_http') === 200) {
                error = 'Got HTTP 200 but invalid response body';
            } else if (rsp.getInt('_http') > 0) {
                error = 'HTTP ' + rsp.getInt('_http') + ': ' + $.jsString(rsp.getString('message'));
            } else if (!rsp.getString('_exception').isBlank()) {
                error = $.jsString(rsp.getString('_exception')) + ' ' + $.jsString(rsp.getString('_exceptionMessage'));
            }

            $.log.error('Failed to set Redeemable Enabled (' + redeemableId + ', ' + (isEnabled ? 'true' : 'false') + '): ' + error);
            $.consoleDebug(rsp.toString());
        }
    }

    /**
     * Sets the paused state of the redeemable
     *
     * @param {string} redeemableId The id of the redeemable that is being updated
     * @param {boolean} isPaused The new paused state
     */
    function setRedeemablePaused(redeemableId, isPaused) {
        if (!$.twitchcache.isAffiliateOrPartner()) {
            return;
        }

        let rsp = $.helix.updateCustomReward(redeemableId, null, null, null, isPaused, null,
                null, null, null, null, null, null, null, null, null);

        if (rsp.getInt('_http') !== 200 || !rsp.has('data')) {
            let error = 'Unknown Error';

            if (rsp.getInt('_http') === 200) {
                error = 'Got HTTP 200 but invalid response body';
            } else if (rsp.getInt('_http') > 0) {
                error = 'HTTP ' + rsp.getInt('_http') + ': ' + $.jsString(rsp.getString('message'));
            } else if (!rsp.getString('_exception').isBlank()) {
                error = $.jsString(rsp.getString('_exception')) + ' ' + $.jsString(rsp.getString('_exceptionMessage'));
            }

            $.log.error('Failed to set Redeemable Paused (' + redeemableId + ', ' + (isPaused ? 'true' : 'false') + '): ' + error);
            $.consoleDebug(rsp.toString());
        }
    }

    $.bind('webPanelSocketUpdate', function (event) {
        if (event.getScript().equalsIgnoreCase('./handlers/ChannelPointsHandler.js')) {
            let args = event.getArgs();
            if (args.length > 0) {
                switch ($.jsString(args[0])) {
                    case 'reward-reload':
                        updateChannelPointsConfig();
                        $.panel.sendAck(event.getId());
                        break;
                    case 'redeemable-reload-managed':
                        reloadManagedRedeemables();
                        $.panel.sendAck(event.getId());
                        break;
                    case 'redeemable-get-managed':
                        $.panel.sendArray(event.getId(), managed);
                        break;
                    case 'redeemable-delete-managed':
                        if (!$.twitchcache.isAffiliateOrPartner()) {
                            $.panel.sendObject(event.getId(), {'success': false, 'error': 'Not an affiliate or partner'});
                            return;
                        }

                        let rmid = $.jsString(args[1]);
                        let rsp = $.helix.deleteCustomReward(args[1]);
                        if (rsp.getInt('_http') === 204) {
                            lock.lock();
                            try {
                                let rmidx = managed.indexOf(rmid);
                                managed.splice(rmidx, 1);
                            } finally {
                                lock.unlock();
                            }
                            $.panel.sendObject(event.getId(), {'success': true});
                        } else {
                            let error = 'Unknown Error';

                            if (rsp.getInt('_http') > 0) {
                                error = 'HTTP ' + rsp.getInt('_http') + ': ' + $.jsString(rsp.getString('message'));
                            } else if (!rsp.getString('_exception').isBlank()) {
                                error = $.jsString(rsp.getString('_exception')) + ' ' + $.jsString(rsp.getString('_exceptionMessage'));
                            }

                            $.log.error('Failed to Redeemable Delete (' + rmid + '): ' + error);
                            $.consoleDebug(rsp.toString());
                            $.panel.sendObject(event.getId(), {'success': false, 'error': error});
                        }
                        break;
                    case 'redeemable-add-managed':
                        if (!$.twitchcache.isAffiliateOrPartner()) {
                            $.panel.sendObject(event.getId(), {'success': false, 'error': 'Not an affiliate or partner'});
                            return;
                        }

                        //                                      title    cost
                        let addrsp = $.helix.createCustomReward(args[1], parseInt(args[2]),
                                //is_enabled                              background_color  is_user_input_required
                                args[3].equals('true'), args[4].isBlank() ? null : args[4], args[5].equals('true'),
                                //                         prompt
                                args[6].isBlank() ? null : args[6],
                                //is_max_per_stream_enabled                      max_per_stream
                                args[7].equals('true'), args[7].equals('true') ? parseInt(args[8]) : null,
                                //is_max_per_user_per_stream_enabled             max_per_user_per_stream
                                args[9].equals('true'), args[9].equals('true') ? parseInt(args[10]) : null,
                                //is_global_cooldown_enabled                       global_cooldown_seconds
                                args[11].equals('true'), args[11].equals('true') ? parseInt(args[12]) : null,
                                //should_redemptions_skip_request_queue
                                args[13].equals('true'));

                        if (addrsp.getInt('_http') === 200 && addrsp.has('data')) {
                            let newid = $.jsString(addrsp.getJSONArray('data').getJSONObject(0).getString('id'));
                            lock.lock();
                            try {
                                managed.push(newid);
                            } finally {
                                lock.unlock();
                            }
                            $.panel.sendObject(event.getId(), {'success': true, 'id': newid});
                        } else {
                            let error = 'Unknown Error';

                            if (addrsp.getInt('_http') === 200) {
                                error = 'Got HTTP 200 but invalid response body';
                            } else if (addrsp.getInt('_http') > 0) {
                                error = 'HTTP ' + addrsp.getInt('_http') + ': ' + $.jsString(addrsp.getString('message'));
                            } else if (!addrsp.getString('_exception').isBlank()) {
                                error = $.jsString(addrsp.getString('_exception')) + ' ' + $.jsString(addrsp.getString('_exceptionMessage'));
                            }

                            $.log.error('Failed to Redeemable Add: ' + error);
                            $.consoleDebug(addrsp.toString());

                            $.panel.sendObject(event.getId(), {'success': false, 'error': error});
                        }
                        break;
                    case 'redeemable-update-managed':
                        if (!$.twitchcache.isAffiliateOrPartner()) {
                            $.panel.sendObject(event.getId(), {'success': false, 'error': 'Not an affiliate or partner'});
                            return;
                        }

                        //                                         id                                 title
                        let updatersp = $.helix.updateCustomReward(args[1], args[2] === null ? null : args[2],
                                //                        cost                                         is_enabled
                                args[3] === null ? null : parseInt(args[3]), args[4] === null ? null : args[4].equals('true'),
                                //                        is_paused                                                              background_color
                                args[5] === null ? null : args[5].equals('true'), args[6] === null || args[6].isBlank() ? null : args[6],
                                //                        is_user_input_required                            prompt
                                args[7] === null ? null : args[7].equals('true'), args[8] === null ? null : args[8],
                                //                        is_max_per_stream_enabled                                            max_per_stream
                                args[9] === null ? null : args[9].equals('true'), args[9] !== null && args[9].equals('true') ? parseInt(args[10]) : null,
                                //                         is_max_per_user_per_stream_enabled                                      max_per_user_per_stream
                                args[11] === null ? null : args[11].equals('true'), args[11] !== null && args[11].equals('true') ? parseInt(args[12]) : null,
                                //                         is_global_cooldown_enabled                                              global_cooldown_seconds
                                args[13] === null ? null : args[13].equals('true'), args[13] !== null && args[13].equals('true') ? parseInt(args[14]) : null,
                                //                         should_redemptions_skip_request_queue
                                args[15] === null ? null : args[15].equals('true'));

                        if (updatersp.getInt('_http') === 200 && updatersp.has('data')) {
                            $.panel.sendObject(event.getId(), {'success': true});
                        } else {
                            let error = 'Unknown Error';

                            if (updatersp.getInt('_http') === 200) {
                                error = 'Got HTTP 200 but invalid response body';
                            } else if (updatersp.getInt('_http') > 0) {
                                error = 'HTTP ' + updatersp.getInt('_http') + ': ' + $.jsString(updatersp.getString('message'));
                            } else if (!updatersp.getString('_exception').isBlank()) {
                                error = $.jsString(updatersp.getString('_exception')) + ' ' + $.jsString(updatersp.getString('_exceptionMessage'));
                            }

                            $.log.error('Failed to Redeemable Update: ' + error);
                            $.consoleDebug(addrsp.toString());

                            $.panel.sendObject(event.getId(), {'success': false, 'error': error});
                        }
                        break;
                }
            }
        }
    });

    /*
     * add chat commands
     */
    $.bind('initReady', function () {
        $.registerChatCommand('./handlers/channelPointsHandler.js', 'channelpoints', $.PERMISSION.Admin);
        $.registerChatSubcommand('channelpoints', 'usage', $.PERMISSION.Admin);
        $.registerChatSubcommand('channelpoints', 'example', $.PERMISSION.Admin);
        $.registerChatSubcommand('channelpoints', 'list', $.PERMISSION.Admin);
        $.registerChatSubcommand('channelpoints', 'get', $.PERMISSION.Admin);
        $.registerChatSubcommand('channelpoints', 'add', $.PERMISSION.Admin);
        $.registerChatSubcommand('channelpoints', 'edit', $.PERMISSION.Admin);
        $.registerChatSubcommand('channelpoints', 'remove', $.PERMISSION.Admin);

        reloadManagedRedeemables();
    });

    $.bind('twitchBroadcasterType', function(event) {
        if (!event.wasAffiliateOrPartner() && event.isAffiliateOrPartner()) {
            reloadManagedRedeemables();
        }
    });

    $.channelpoints = {
        /**
         * Marks a managed redemption as fulfilled
         *
         * @param {string} redeemableId The id of the redeemable that the user redeemed
         * @param {string} redemptionId The id of the redemption event
         */
        updateRedemptionStatusFulfilled: updateRedemptionStatusFulfilled,
        /**
         * Marks a managed redemption as cancelled, refunding the users channel points
         *
         * @param {string} redeemableId The id of the redeemable that the user redeemed
         * @param {string} redemptionId The id of the redemption event
         */
        updateRedemptionStatusCancelled: updateRedemptionStatusCancelled,
        /**
         * Sets the enabled state of the redeemable
         *
         * @param {string} redeemableId The id of the redeemable that is being updated
         * @param {boolean} isEnabled The new enabled state
         */
        setRedeemableEnabled: setRedeemableEnabled,
        /**
         * Sets the paused state of the redeemable
         *
         * @param {string} redeemableId The id of the redeemable that is being updated
         * @param {boolean} isPaused The new paused state
         */
        setRedeemablePaused: setRedeemablePaused
    };
})();