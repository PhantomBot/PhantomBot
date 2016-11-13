/* 
 * This script is used to reload variables from scripts when you edit stuff on the panel. Only the bot can use these, and you can't disable them
 */

(function() {
    $.bind('command', function(event) {
        var sender = event.getSender(),
            command = event.getCommand(),
            args = event.getArgs(),
            action = args[0];

        /* Reloads the init vars */
        if (command.equalsIgnoreCase('reloadinit')) {
            if (!$.isBot(sender)) {
                return;
            }
            $.reloadInit();
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

        /*
         * Sets permissions on a command.
         */
        if (command.equalsIgnoreCase('permcomsilent')) {
            if (!$.isBot(sender)) {
                return;
            }

            if (args.length == 2) {
                var group = args[1];
    
                if (isNaN(parseInt(group))) {
                    group = $.getGroupIdByName(group);
                }
    
                var list = $.inidb.GetKeyList('aliases', ''), i;
                for (i in list) {
                    if (list[i].equalsIgnoreCase(action)) {
                        $.inidb.set('permcom', $.inidb.get('aliases', list[i]), group);
                        $.updateCommandGroup($.inidb.get('aliases', list[i]), group);
                    } 
                }
                $.inidb.set('permcom', action, group);
                $.updateCommandGroup(action, group);
                return;
            }
    
            var subcommand = args[1], group = args[2];
            if (isNaN(parseInt(group))) {
                group = $.getGroupIdByName(group);
            }
    
            $.inidb.set('permcom', action + ' ' + subcommand, group);
            $.updateSubcommandGroup(action, subcommand, group);
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
            if (action) { $.unregisterChatCommand(action); }
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

        /*
         * Clears the highlight
         */
        if (command.equalsIgnoreCase("clearhighlightspanel")) {
            if (!$.isBot(sender)) {
                return;
            }
            $.inidb.RemoveFile("highlights");
            $.inidb.ReloadFile("highlights");
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
         * Reloads the gameWisp variables.
         */
        if (command.equalsIgnoreCase('gamewisppanelupdate')) {
            if (!$.isBot(sender)) {
                return;
            }
            $.updateGameWispDB();
            return;
        }

        /*
         * Reloads the host variables.
         */
        if (command.equalsIgnoreCase('reloadhost')) {
            if (!$.isBot(sender)) {
                return;
            }
            $.updateHost();
            return;
        }

        /*
         * Reloads the streamtip variables.
         */
        if (command.equalsIgnoreCase('donationpanelupdatestreamtip')) {
            if (!$.isBot(sender)) {
                return;
            }
            $.donationpanelupdatestreamtip();
            return;
        }

        /*
         * Reloads the subscriber variables.
         */
        if (command.equalsIgnoreCase('subscribepanelupdate')) {
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
         * Reloads the notice variables.
         */
        if (command.equalsIgnoreCase('reloadnotice')) {
            if (!$.isBot(sender)) {
                return;
            }
            $.reloadNoticeSettings();
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
                $.inidb.incr('points', $.users[i][0].toLowerCase(), parseInt(action));
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
                if ($.getUserPoints($.users[i][0].toLowerCase()) > parseInt(action)) {
                    $.inidb.decr('points', $.users[i][0].toLowerCase(), parseInt(action));
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

    $.bind('initReady', function() {
        /* 10 second delay here because I don't want these commands to be registered first. */
        setTimeout(function() {
            $.registerChatCommand('./core/panelCommands.js', 'permissionsetuser', 30);
            $.registerChatCommand('./core/panelCommands.js', 'reloadcommand', 30);
            $.registerChatCommand('./core/panelCommands.js', 'permcomsilent', 30);
            $.registerChatCommand('./core/panelCommands.js', 'registerpanel', 30);
            $.registerChatCommand('./core/panelCommands.js', 'unregisterpanel', 30);
            $.registerChatCommand('./core/panelCommands.js', 'reloadmod', 30);
            $.registerChatCommand('./core/panelCommands.js', 'clearhighlightspanel', 30);
            $.registerChatCommand('./core/panelCommands.js', 'highlightpanel', 30);
            $.registerChatCommand('./core/panelCommands.js', 'settitlesilent', 30);
            $.registerChatCommand('./core/panelCommands.js', 'setgamesilent', 30);
            $.registerChatCommand('./core/panelCommands.js', 'reloadadventure', 30);
            $.registerChatCommand('./core/panelCommands.js', 'reloadgamble', 30);
            $.registerChatCommand('./core/panelCommands.js', 'loadprizesroll', 30);
            $.registerChatCommand('./core/panelCommands.js', 'reloadroulette', 30);
            $.registerChatCommand('./core/panelCommands.js', 'loadprizes', 30);
            $.registerChatCommand('./core/panelCommands.js', 'reloadbits', 30);
            $.registerChatCommand('./core/panelCommands.js', 'donationpanelupdate', 30);
            $.registerChatCommand('./core/panelCommands.js', 'followerpanelupdate', 30);
            $.registerChatCommand('./core/panelCommands.js', 'gamewisppanelupdate', 30);
            $.registerChatCommand('./core/panelCommands.js', 'reloadhost', 30);
            $.registerChatCommand('./core/panelCommands.js', 'donationpanelupdatestreamtip', 30);
            $.registerChatCommand('./core/panelCommands.js', 'subscribepanelupdate', 30);
            $.registerChatCommand('./core/panelCommands.js', 'greetingspanelupdate', 30);
            $.registerChatCommand('./core/panelCommands.js', 'reloadnotice', 30);
            $.registerChatCommand('./core/panelCommands.js', 'reloadpoints', 30);
            $.registerChatCommand('./core/panelCommands.js', 'pointsallpanel', 30);
            $.registerChatCommand('./core/panelCommands.js', 'pointsbonuspanel', 30);
            $.registerChatCommand('./core/panelCommands.js', 'pointstakeallpanel', 30);
            $.registerChatCommand('./core/panelCommands.js', 'reloadraffle', 30);
            $.registerChatCommand('./core/panelCommands.js', 'rankreloadtable', 30);
            $.registerChatCommand('./core/panelCommands.js', 'reloadtraffle', 30);
            $.registerChatCommand('./core/panelCommands.js', 'updatetimesettings', 30);
            $.registerChatCommand('./core/panelCommands.js', 'reloadlogs', 30);
            $.registerChatCommand('./core/panelCommands.js', 'reloadinit', 30);
        }, 10000);
    });
})();