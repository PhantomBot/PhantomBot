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
        if ($.equalsIgnoreCase(command, 'reloadbet')) {
            $.reloadBet();
        }

        /** Adds or removes a user from the moderator cache */
        if ($.equalsIgnoreCase(command, 'permissionsetuser')) {
            if (parseInt(args[1]) <= 2) {
                $.addModeratorToCache(action.toLowerCase());
            } else {
                $.removeModeratorFromCache(action.toLowerCase());
            }
        }

        if ($.equalsIgnoreCase(command, 'reloadmisc')) {
            $.reloadMisc();
            $.reloadWhispers();
        }

        /*
         * Reloads the tipeeestream vars.
         */
        if ($.equalsIgnoreCase(command, 'tipeeestreamreload')) {
            $.reloadTipeeeStream();
        }

        /*
         * Reloads the streamelements vars.
         */
        if ($.equalsIgnoreCase(command, 'streamelementsreload')) {
            $.reloadStreamElements();
        }

        /*
         * Sets permissions on a command.
         */
        if ($.equalsIgnoreCase(command, 'permcomsilent')) {
            action = action.replace('!', '').toLowerCase();
            let group = $.PERMISSION.Viewer;

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

                let list = $.inidb.GetKeyList('aliases', '');

                for (let i in list) {
                    if ($.equalsIgnoreCase(list[i], action)) {
                        $.inidb.set('permcom', $.getIniDbString('aliases', list[i]), group);
                        $.updateCommandGroup($.getIniDbString('aliases', list[i]), group);
                    }
                }

                $.inidb.set('permcom', action, group);
                $.updateCommandGroup(action, group);
            } else {
                let subAction = args[1];
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
        if ($.equalsIgnoreCase(command, 'reloadcommand')) {
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
        if ($.equalsIgnoreCase(command, 'registerpanel')) {
            $.registerChatCommand($.getIniDbString('tempDisabledCommandScript', args[0].toLowerCase(), './commands/customCommands.js'), args[0].toLowerCase());
            $.inidb.del('tempDisabledCommandScript', args[0].toLowerCase());
            return;
        }

        /*
         * unregtisters a command
         */
        if ($.equalsIgnoreCase(command, 'unregisterpanel')) {
            $.tempUnRegisterChatCommand(args[0].toLowerCase());
            return;
        }

        /*
         * Reloads the moderation variables.
         */
        if ($.equalsIgnoreCase(command, 'reloadmod')) {
            $.reloadModeration();
        }

        if ($.equalsIgnoreCase(command, 'reloadkill')) {
            $.reloadKill();
        }

        if ($.equalsIgnoreCase(command, 'reloadraid')) {
            $.reloadRaid();
        }

        /* reloads the clip vars */
        if ($.equalsIgnoreCase(command, 'reloadclip')) {
            $.reloadClips();
        }

        /*
         * Clears the highlight
         */
        if ($.equalsIgnoreCase(command, "clearhighlightspanel")) {
            $.inidb.RemoveFile("highlights");
            return;
        }

        /*
         * makes a highlight
         */
        if ($.equalsIgnoreCase(command, 'highlightpanel')) {
            if (!$.isOnline($.channelName)) {
                return;
            }

            let streamUptimeMinutes = parseInt($.getStreamUptimeSeconds($.channelName) / 60);
            let hours = parseInt(streamUptimeMinutes / 60);
            let minutes = parseInt(streamUptimeMinutes % 60);

            if (minutes < 10) {
                minutes = "0" + minutes;
            }

            let timestamp = hours + ":" + minutes;
            let localDate = $.getCurLocalTimeString("'['dd-MM-yyyy']'");
            $.inidb.set('highlights', timestamp, localDate + ' ' + args.splice(0).join(' '));
        }

        /*
         * Sets the title on stream
         */
        if ($.equalsIgnoreCase(command, 'settitlesilent')) {
            let argsString = args.splice(0).join(' ');
            $.updateStatus($.channelName, argsString, sender, true);
            return;
        }

        /*
         * Sets the game on stream
         */
        if ($.equalsIgnoreCase(command, 'setgamesilent')) {
            let argsString = args.splice(0).join(' ');
            $.updateGame($.channelName, argsString, sender, true);
            return;
        }

        /*
         * Reloads the adventure variables.
         */
        if ($.equalsIgnoreCase(command, 'reloadadventure')) {
            $.reloadAdventure();
            return;
        }

        /*
         * Reloads the gambling variables.
         */
        if ($.equalsIgnoreCase(command, 'reloadgamble')) {
            $.reloadGamble();
            return;
        }

        /*
         * Reloads the roll variables.
         */
        if ($.equalsIgnoreCase(command, 'loadprizesroll')) {
            $.loadPrizes();
            return;
        }

        /*
         * Reloads the roulette variables.
         */
        if ($.equalsIgnoreCase(command, 'reloadroulette')) {
            $.reloadRoulette();
            return;
        }

        /*
         * Reloads the slot variables.
         */
        if ($.equalsIgnoreCase(command, 'loadprizes')) {
            $.loadPrizesSlot();
            return;
        }

        /*
         * Reloads the bits variables.
         */
        if ($.equalsIgnoreCase(command, 'reloadbits')) {
            $.reloadBits();
            return;
        }

        /*
         * Reloads the donation variables.
         */
        if ($.equalsIgnoreCase(command, 'donationpanelupdate')) {
            $.donationpanelupdate();
            return;
        }

        /*
         * Reloads the follow variables.
         */
        if ($.equalsIgnoreCase(command, 'followerpanelupdate')) {
            $.updateFollowConfig();
            return;
        }

        /*
         * Reloads the subscriber variables.
         */
        if ($.equalsIgnoreCase(command, 'subscriberpanelupdate')) {
            $.updateSubscribeConfig();
            return;
        }

        /*
         * Reloads the greeting variables.
         */
        if ($.equalsIgnoreCase(command, 'greetingspanelupdate')) {
            $.greetingspanelupdate();
            return;
        }

        /*
         * Reloads the welcome variables.
         */
        if ($.equalsIgnoreCase(command, 'welcomepanelupdate')) {
            $.welcomepanelupdate();
            return;
        }

        /*
         * Reloads the notice variables.
         */
        if ($.equalsIgnoreCase(command, 'reloadnotice')) {
            $.reloadNoticeTimers();
        }

        /*
         * Reloads the points variables.
         */
        if ($.equalsIgnoreCase(command, 'reloadpoints')) {
            $.updateSettings();
            return;
        }

        /*
         * Sets a points bonus
         */
        if ($.equalsIgnoreCase(command, 'pointsbonuspanel')) {
            $.setTempBonus(action, args[1]);
            return;
        }

        /*
         * Gives points to everyone in the channel
         */
        if ($.equalsIgnoreCase(command, 'pointsallpanel')) {
            for (let i in $.users) {
                $.inidb.incr('points', $.users[i].toLowerCase(), parseInt(action));
            }

            return;
        }

        /*
         * Takes points from everyone in the channel
         */
        if ($.equalsIgnoreCase(command, 'pointstakeallpanel')) {
            for (let i in $.users) {
                if ($.getUserPoints($.users[i].toLowerCase()) > parseInt(action)) {
                    $.inidb.decr('points', $.users[i].toLowerCase(), parseInt(action));
                }
            }

            return;
        }

        /*
         * Reloads the raffle variables.
         */
        if ($.equalsIgnoreCase(command, 'reloadraffle')) {
            $.reloadRaffle();
            return;
        }

        /*
         * Reloads the rank variables.
         */
        if ($.equalsIgnoreCase(command, 'rankreloadtable')) {
            $.loadRanksTimeTable();
            return;
        }

        /*
         * Reloads the ticket raffle variables.
         */
        if ($.equalsIgnoreCase(command, 'reloadtraffle')) {
            $.reloadTRaffle();
            return;
        }

        /*
         * Reloads the time variables.
         */
        if ($.equalsIgnoreCase(command, 'updatetimesettings')) {
            $.updateTimeSettings();
            return;
        }

        /*
         * Reloads the log variables.
         */
        if ($.equalsIgnoreCase(command, 'reloadlogs')) {
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
