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

/*
 * This script is used to reload variables from scripts when you edit stuff on the panel. Only the bot can use these, and you can't disable them
 */

(function () {
    $.bind('command', function (event) {
        var sender = event.getSender(),
                command = event.getCommand(),
                args = event.getArgs(),
                action = args[0];


        /* reloads the betting vars */
        if (command.equalsIgnoreCase('reloadbet')) {
            if (!$.isBot(sender)) {
                return;
            }
            $.reloadBet();
        }

        /** Adds or removes a user from the moderator cache */
        if (command.equalsIgnoreCase('permissionsetuser')) {
            if (!$.isBot(sender)) {
                return;
            }
            if (parseInt(args[1]) <= 2) {
                $.addModeratorToCache(action.toLowerCase());
            } else {
                $.removeModeratorFromCache(action.toLowerCase());
            }
        }

        if (command.equalsIgnoreCase('reloadmisc')) {
            if (!$.isBot(sender)) {
                return;
            }

            $.reloadMisc();
            $.reloadWhispers();
        }

        /*
         * Reloads the tipeeestream vars.
         */
        if (command.equalsIgnoreCase('tipeeestreamreload')) {
            if (!$.isBot(sender)) {
                return;
            }
            $.reloadTipeeeStream();
        }

        /*
         * Reloads the streamelements vars.
         */
        if (command.equalsIgnoreCase('streamelementsreload')) {
            if (!$.isBot(sender)) {
                return;
            }
            $.reloadStreamElements();
        }

        /*
         * Sets permissions on a command.
         */
        if (command.equalsIgnoreCase('permcomsilent')) {
            if (!$.isBot(sender)) {
                return;
            }

            action = action.replace('!', '').toLowerCase();
            var group = 7;

            if (args.length === 2) {
                group = args[1];

                if (!$.commandExists(action)) {
                    return;
                }

                if (isNaN(parseInt(group))) {
                    group = $.getGroupIdByName(group);
                }

                $.logCustomCommand({
                    'set.perm.command': '!' + action,
                    'set.perm.group': $.getGroupNameById(group),
                    'sender': sender
                });

                var list = $.inidb.GetKeyList('aliases', ''),
                        i;

                for (i in list) {
                    if (list[i].equalsIgnoreCase(action)) {
                        $.inidb.set('permcom', $.inidb.get('aliases', list[i]), group);
                        $.updateCommandGroup($.inidb.get('aliases', list[i]), group);
                    }
                }

                $.inidb.set('permcom', action, group);
                $.updateCommandGroup(action, group);
            } else {
                var subAction = args[1];
                group = args[2];

                if (!$.subCommandExists(action, subAction)) {
                    return;
                }

                if (isNaN(parseInt(group))) {
                    group = $.getGroupIdByName(group);
                }

                $.logCustomCommand({
                    'set.perm.command': '!' + action + ' ' + subAction,
                    'set.perm.group': $.getGroupNameById(group),
                    'sender': sender
                });
                $.inidb.set('permcom', action + ' ' + subAction, group);
                $.updateSubcommandGroup(action, subAction, group);
            }
            return;
        }

        /*
         * Reloads the command variables.
         */
        if (command.equalsIgnoreCase('reloadcommand')) {
            if (!$.isBot(sender)) {
                return;
            }
            $.addComRegisterAliases();
            $.addComRegisterCommands();
            if (action) {
                $.unregisterChatCommand(action);
            }
            return;
        }

        /*
         * Registers a command
         */
        if (command.equalsIgnoreCase('registerpanel')) {
            if (!$.isBot(sender)) {
                return;
            }
            $.registerChatCommand(($.inidb.exists('tempDisabledCommandScript', args[0].toLowerCase()) ? $.inidb.get('tempDisabledCommandScript', args[0].toLowerCase()) : './commands/customCommands.js'), args[0].toLowerCase());
            $.inidb.del('tempDisabledCommandScript', args[0].toLowerCase());
            return;
        }

        /*
         * unregtisters a command
         */
        if (command.equalsIgnoreCase('unregisterpanel')) {
            if (!$.isBot(sender)) {
                return;
            }
            $.tempUnRegisterChatCommand(args[0].toLowerCase());
            return;
        }

        /*
         * Reloads the moderation variables.
         */
        if (command.equalsIgnoreCase('reloadmod')) {
            if (!$.isBot(sender)) {
                return;
            }
            $.reloadModeration();
        }

        if (command.equalsIgnoreCase('reloadkill')) {
            if (!$.isBot(sender)) {
                return;
            }
            $.reloadKill();
        }

        if (command.equalsIgnoreCase('reloadraid')) {
            if (!$.isBot(sender)) {
                return;
            }
            $.reloadRaid();
        }

        /* reloads the clip vars */
        if (command.equalsIgnoreCase('reloadclip')) {
            if (!$.isBot(sender)) {
                return;
            }
            $.reloadClips();
        }

        /*
         * Clears the highlight
         */
        if (command.equalsIgnoreCase("clearhighlightspanel")) {
            if (!$.isBot(sender)) {
                return;
            }
            $.inidb.RemoveFile("highlights");
            return;
        }

        /*
         * makes a highlight
         */
        if (command.equalsIgnoreCase('highlightpanel')) {
            if (!$.isBot(sender)) {
                return;
            }
            if (!$.isOnline($.channelName)) {
                return;
            }
            var streamUptimeMinutes = parseInt($.getStreamUptimeSeconds($.channelName) / 60);
            var hours = parseInt(streamUptimeMinutes / 60);
            var minutes = parseInt(streamUptimeMinutes % 60);
            if (minutes < 10) {
                minutes = "0" + minutes;
            }
            timestamp = hours + ":" + minutes;
            localDate = $.getCurLocalTimeString("'['dd-MM-yyyy']'");
            $.inidb.set('highlights', timestamp, localDate + ' ' + args.splice(0).join(' '));
        }

        /*
         * Sets the title on stream
         */
        if (command.equalsIgnoreCase('settitlesilent')) {
            if (!$.isBot(sender)) {
                return;
            }
            var argsString = args.splice(0).join(' ');
            $.updateStatus($.channelName, argsString, sender, true);
            return;
        }

        /*
         * Sets the game on stream
         */
        if (command.equalsIgnoreCase('setgamesilent')) {
            if (!$.isBot(sender)) {
                return;
            }
            var argsString = args.splice(0).join(' ');
            $.updateGame($.channelName, argsString, sender, true);
            return;
        }

        /*
         * Reloads the adventure variables.
         */
        if (command.equalsIgnoreCase('reloadadventure')) {
            if (!$.isBot(sender)) {
                return;
            }
            $.reloadAdventure();
            return;
        }

        /*
         * Reloads the gambling variables.
         */
        if (command.equalsIgnoreCase('reloadgamble')) {
            if (!$.isBot(sender)) {
                return;
            }
            $.reloadGamble();
            return;
        }

        /*
         * Reloads the roll variables.
         */
        if (command.equalsIgnoreCase('loadprizesroll')) {
            if (!$.isBot(sender)) {
                return;
            }
            $.loadPrizes();
            return;
        }

        /*
         * Reloads the roulette variables.
         */
        if (command.equalsIgnoreCase('reloadroulette')) {
            if (!$.isBot(sender)) {
                return;
            }
            $.reloadRoulette();
            return;
        }

        /*
         * Reloads the slot variables.
         */
        if (command.equalsIgnoreCase('loadprizes')) {
            if (!$.isBot(sender)) {
                return;
            }
            $.loadPrizesSlot();
            return;
        }

        /*
         * Reloads the bits variables.
         */
        if (command.equalsIgnoreCase('reloadbits')) {
            if (!$.isBot(sender)) {
                return;
            }
            $.reloadBits();
            return;
        }

        /*
         * Reloads the donation variables.
         */
        if (command.equalsIgnoreCase('donationpanelupdate')) {
            if (!$.isBot(sender)) {
                return;
            }
            $.donationpanelupdate();
            return;
        }

        /*
         * Reloads the follow variables.
         */
        if (command.equalsIgnoreCase('followerpanelupdate')) {
            if (!$.isBot(sender)) {
                return;
            }
            $.updateFollowConfig();
            return;
        }

        /*
         * Reloads the subscriber variables.
         */
        if (command.equalsIgnoreCase('subscriberpanelupdate')) {
            if (!$.isBot(sender)) {
                return;
            }
            $.updateSubscribeConfig();
            return;
        }

        /*
         * Reloads the greeting variables.
         */
        if (command.equalsIgnoreCase('greetingspanelupdate')) {
            if (!$.isBot(sender)) {
                return;
            }
            $.greetingspanelupdate();
            return;
        }

        /*
         * Reloads the welcome variables.
         */
        if (command.equalsIgnoreCase('welcomepanelupdate')) {
            if (!$.isBot(sender)) {
                return;
            }
            $.welcomepanelupdate();
            return;
        }

        /*
         * Reloads the notice variables.
         */
        if (command.equalsIgnoreCase('reloadnotice')) {
            if (!$.isBot(sender)) {
                return;
            }
            $.reloadNoticeTimers();
        }

        /*
         * Reloads the points variables.
         */
        if (command.equalsIgnoreCase('reloadpoints')) {
            if (!$.isBot(sender)) {
                return;
            }
            $.updateSettings();
            return;
        }

        /*
         * Sets a points bonus
         */
        if (command.equalsIgnoreCase('pointsbonuspanel')) {
            if (!$.isBot(sender)) {
                return;
            }
            $.setTempBonus(action, args[1]);
            return;
        }

        /*
         * Gives points to everyone in the channel
         */
        if (command.equalsIgnoreCase('pointsallpanel')) {
            if (!$.isBot(sender)) {
                return;
            }
            for (var i in $.users) {
                $.inidb.incr('points', $.users[i].toLowerCase(), parseInt(action));
            }
            return;
        }

        /*
         * Takes points from everyone in the channel
         */
        if (command.equalsIgnoreCase('pointstakeallpanel')) {
            if (!$.isBot(sender)) {
                return;
            }
            for (var i in $.users) {
                if ($.getUserPoints($.users[i].toLowerCase()) > parseInt(action)) {
                    $.inidb.decr('points', $.users[i].toLowerCase(), parseInt(action));
                }
            }
            return;
        }

        /*
         * Reloads the raffle variables.
         */
        if (command.equalsIgnoreCase('reloadraffle')) {
            if (!$.isBot(sender)) {
                return;
            }
            $.reloadRaffle();
            return;
        }

        /*
         * Reloads the rank variables.
         */
        if (command.equalsIgnoreCase('rankreloadtable')) {
            if (!$.isBot(sender)) {
                return;
            }
            $.loadRanksTimeTable();
            return;
        }

        /*
         * Reloads the ticket raffle variables.
         */
        if (command.equalsIgnoreCase('reloadtraffle')) {
            if (!$.isBot(sender)) {
                return;
            }
            $.reloadTRaffle();
            return;
        }

        /*
         * Reloads the time variables.
         */
        if (command.equalsIgnoreCase('updatetimesettings')) {
            if (!$.isBot(sender)) {
                return;
            }
            $.updateTimeSettings();
            return;
        }

        /*
         * Reloads the log variables.
         */
        if (command.equalsIgnoreCase('reloadlogs')) {
            if (!$.isBot(sender)) {
                return;
            }
            $.reloadLogs();
            return;
        }
    });

    $.bind('initReady', function () {
        /* 10 second delay here because I don't want these commands to be registered first. */
        setTimeout(function () {
            $.registerChatCommand('./core/panelCommands.js', 'permissionsetuser', $.PERMISSION.Panel);
            $.registerChatCommand('./core/panelCommands.js', 'reloadcommand', $.PERMISSION.Panel);
            $.registerChatCommand('./core/panelCommands.js', 'permcomsilent', $.PERMISSION.Panel);
            $.registerChatCommand('./core/panelCommands.js', 'registerpanel', $.PERMISSION.Panel);
            $.registerChatCommand('./core/panelCommands.js', 'unregisterpanel', $.PERMISSION.Panel);
            $.registerChatCommand('./core/panelCommands.js', 'reloadmod', $.PERMISSION.Panel);
            $.registerChatCommand('./core/panelCommands.js', 'clearhighlightspanel', $.PERMISSION.Panel);
            $.registerChatCommand('./core/panelCommands.js', 'highlightpanel', $.PERMISSION.Panel);
            $.registerChatCommand('./core/panelCommands.js', 'settitlesilent', $.PERMISSION.Panel);
            $.registerChatCommand('./core/panelCommands.js', 'setgamesilent', $.PERMISSION.Panel);
            $.registerChatCommand('./core/panelCommands.js', 'reloadadventure', $.PERMISSION.Panel);
            $.registerChatCommand('./core/panelCommands.js', 'reloadgamble', $.PERMISSION.Panel);
            $.registerChatCommand('./core/panelCommands.js', 'loadprizesroll', $.PERMISSION.Panel);
            $.registerChatCommand('./core/panelCommands.js', 'reloadroulette', $.PERMISSION.Panel);
            $.registerChatCommand('./core/panelCommands.js', 'loadprizes', $.PERMISSION.Panel);
            $.registerChatCommand('./core/panelCommands.js', 'reloadbits', $.PERMISSION.Panel);
            $.registerChatCommand('./core/panelCommands.js', 'donationpanelupdate', $.PERMISSION.Panel);
            $.registerChatCommand('./core/panelCommands.js', 'followerpanelupdate', $.PERMISSION.Panel);
            $.registerChatCommand('./core/panelCommands.js', 'subscriberpanelupdate', $.PERMISSION.Panel);
            $.registerChatCommand('./core/panelCommands.js', 'greetingspanelupdate', $.PERMISSION.Panel);
            $.registerChatCommand('./core/panelCommands.js', 'reloadnotice', $.PERMISSION.Panel);
            $.registerChatCommand('./core/panelCommands.js', 'reloadpoints', $.PERMISSION.Panel);
            $.registerChatCommand('./core/panelCommands.js', 'pointsallpanel', $.PERMISSION.Panel);
            $.registerChatCommand('./core/panelCommands.js', 'pointsbonuspanel', $.PERMISSION.Panel);
            $.registerChatCommand('./core/panelCommands.js', 'pointstakeallpanel', $.PERMISSION.Panel);
            $.registerChatCommand('./core/panelCommands.js', 'reloadraffle', $.PERMISSION.Panel);
            $.registerChatCommand('./core/panelCommands.js', 'rankreloadtable', $.PERMISSION.Panel);
            $.registerChatCommand('./core/panelCommands.js', 'reloadtraffle', $.PERMISSION.Panel);
            $.registerChatCommand('./core/panelCommands.js', 'updatetimesettings', $.PERMISSION.Panel);
            $.registerChatCommand('./core/panelCommands.js', 'reloadlogs', $.PERMISSION.Panel);
            $.registerChatCommand('./core/panelCommands.js', 'reloadbet', $.PERMISSION.Panel);
            $.registerChatCommand('./core/panelCommands.js', 'tipeeestreamreload', $.PERMISSION.Panel);
            $.registerChatCommand('./core/panelCommands.js', 'streamelementsreload', $.PERMISSION.Panel);
            $.registerChatCommand('./core/panelCommands.js', 'setcommunitysilent', $.PERMISSION.Panel);
            $.registerChatCommand('./core/panelCommands.js', 'reloadclip', $.PERMISSION.Panel);
            $.registerChatCommand('./core/panelCommands.js', 'reloadkill', $.PERMISSION.Panel);
            $.registerChatCommand('./core/panelCommands.js', 'reloadraid', $.PERMISSION.Panel);
            $.registerChatCommand('./core/panelCommands.js', 'reloadmisc', $.PERMISSION.Panel);
            $.registerChatCommand('./core/panelCommands.js', 'welcomepanelupdate', $.PERMISSION.Panel);
        }, 10000);
    });
})();
