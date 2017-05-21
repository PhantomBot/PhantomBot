/**
 * updater.js
 *
 * Update PhantomBot database
 *
 * This module will be executed before loading any of the other scripts even the core!
 * Add a new wrapped function if you want to apply updates for a new version
 */

/**
 * PhantomBot v2.0
 */
(function() {
    var modules,
        versions,
        sounds,
        i;

    /** New setup */
    if ($.changed == true && $.changed != null && $.changed != undefined && !$.inidb.exists('updates', 'installedNewBot') && $.inidb.get('updates', 'installedNewBot') != 'true') {
        $.consoleLn('Initializing PhantomBot Version ' + $.version + ' For The First Time...');

        modules = [
        './commands/topCommand.js',
        './commands/highlightCommand.js',
        './commands/deathctrCommand.js',
        './commands/dualstreamCommand.js',
        './games/8ball.js',
        './games/adventureSystem.js',
        './games/killCommand.js',
        './games/random.js',
        './games/roll.js',
        './games/roulette.js',
        './games/slotMachine.js',
        './games/gambling.js',
        './handlers/followHandler.js',
        './handlers/hostHandler.js',
        './handlers/subscribeHandler.js',
        './handlers/donationHandler.js',
        './handlers/wordCounter.js',
        './handlers/gameWispHandler.js',
        './handlers/keywordHandler.js',
        './handlers/twitterHandler.js',
        './handlers/streamTipHandler.js',
        './handlers/discordHandler.js',
        './handlers/tipeeeStreamHandler.js',
        './systems/cleanupSystem.js',
        './systems/greetingSystem.js',
        './systems/pointSystem.js',
        './systems/noticeSystem.js',
        './systems/pollSystem.js',
        './systems/quoteSystem.js',
        './systems/raffleSystem.js',
        './systems/ticketraffleSystem.js',
        './systems/raidSystem.js',
        './systems/youtubePlayer.js',
        './systems/ranksSystem.js',
        './systems/auctionSystem.js',
        './systems/audioPanelSystem.js',
        './systems/queueSystem.js',
        './systems/bettingSystem.js',
        './discord/handlers/bitsHandler.js',
        './discord/handlers/followHandler.js',
        './discord/handlers/subscribeHandler.js',
        './discord/handlers/tipeeeStreamHandler.js',
        './discord/handlers/streamtipHandler.js',
        './discord/handlers/streamlabsHandler.js',
        './discord/handlers/hostHandler.js',
        './discord/handlers/twitterHandler.js',
        './discord/handlers/keywordHandler.js',
        './discord/handlers/streamHandler.js',
        './discord/handlers/gamewispHandler.js',
        './discord/systems/greetingsSystem.js',
        './discord/commands/customCommands.js',
        './discord/games/8ball.js',
        './discord/games/kill.js',
        './discord/games/random.js',
        './discord/games/roulette.js',
        './discord/games/gambling.js',
        './discord/games/roll.js',
        './discord/games/slotMachine.js',
        './discord/systems/pointSystem.js'
        ];

        $.consoleLn('Disabling default modules...');
        for (i in modules) {
            $.inidb.set('modules', modules[i], 'false');
        }

        $.consoleLn('Adding new default custom commands...');
        $.inidb.set('command', 'uptime', '(pointtouser) (channelname) has been online for (uptime)');
        $.inidb.set('command', 'followage', '(followage)');
        $.inidb.set('command', 'playtime', '(pointtouser) (channelname) has been playing (game) for (playtime)');
        $.inidb.set('command', 'title', '(pointtouser) (titleinfo)');
        $.inidb.set('command', 'game', '(pointtouser) (gameinfo)');
        $.inidb.set('command', 'age', '(age)');

        $.consoleLn('Installing old updates...');
        versions = ['installedv2', 'installedv2.0.5', 'installedv2.0.6', 'installedv2.0.7', 'installedv2.0.7.2', 
        'installedv2.0.8', 'installedv2.0.9', 'installedv2.1.0', 'installedv2.1.1', 'installedv2.2.1', 'installedv2.3s', 
        'installedv2.3.3ss', 'installedv2.3.5ss', 'installedv2.3.5.1', 'installedv2.3.5.2', 'installedv2.3.5.3', 'installed2.3.6', 
        'installed2.3.6ss', 'installed2.3.6b', 'installedv2.3.7'];
        for (i in versions) {
            $.inidb.set('updates', versions[i], 'true');
        }

        $.consoleLn('Initializing complete!');
        sounds = "";
        modules = "";
        versions = "";
        $.changed = false;
        $.inidb.set('updates', 'installedNewBot', 'true');
    }

    /** Version 2.0 updates */
    if (!$.inidb.exists('updates', 'installedv2') || $.inidb.get('updates', 'installedv2') != 'true') {
        $.consoleLn('Starting PhantomBot version 2.0 updates...');
        var tableNamesList = $.inidb.GetFileList(),
            commandsBackup,
            timeBackup,
            pointsBackup,
            defaultDisabledModules = [
                './games/8ball.js',
                './games/adventureSystem.js',
                './games/killCommand.js',
                './commands/topCommand.js',
                './games/random.js',
                './games/roll.js',
                './games/roulette.js',
                './games/slotMachine.js',
                './handlers/followHandler.js',
                './handlers/hostHandler.js',
                './handlers/subscribeHandler.js',
                './handlers/donationHandler.js',
                './systems/cleanupSystem.js',
                './systems/greetingSystem.js',
                './systems/pointSystem.js',
                './systems/noticeSystem.js',
                './systems/pollSystem.js',
                './systems/quoteSystem.js',
                './systems/raffleSystem.js',
                './systems/ticketraffleSystem.js',
                './systems/raidSystem.js',
                './systems/youtubePlayer.js',
                './systems/audioPanelSystem.js'
            ];

        if ($.inidb.FileExists('points') || $.inidb.FileExists('command') || $.inidb.FileExists('time')) {
            $.consoleLn('Backing up commands...');
            commandsBackup = getTableContents('command');

            $.consoleLn('Backing up times...');
            timeBackup = getTableContents('time');

            $.consoleLn('Backing up points...');
            pointsBackup = getTableContents('points');

            $.consoleLn('Backup completed.');
            $.consoleLn('Deleting old files...');
            for (i in tableNamesList) {
                $.inidb.RemoveFile(tableNamesList[i]);
            }

            $.consoleLn('Restoring commands...');
            restoreTableContents('command', commandsBackup);

            $.consoleLn('Restoring times...');
            restoreTableContents('time', timeBackup);

            $.consoleLn('Restoring points...');
            restoreTableContents('points', pointsBackup);
        }

        $.consoleLn('Disabling default modules...');
        for (i in defaultDisabledModules) {
            $.inidb.set('modules', defaultDisabledModules[i], 'false');
        }

        $.consoleLn('PhantomBot v2.0 updates completed!');
        $.inidb.set('updates', 'installedv2', 'true');
    }

    /** Version 2.0.5 updates */
    if (!$.inidb.exists('updates', 'installedv2.0.5') || $.inidb.get('updates', 'installedv2.0.5') != 'true') {
        var newDefaultDisabledModules = [
            './systems/betSystem.js',
            './handlers/wordCounter.js',
            './systems/ranksSystem.js',
            './systems/auctionSystem.js',
            './commands/highlightCommand.js'
        ]; //ADD NEW MODULES IN 2.0.5 TO BE DISABLED PLEASE.

        $.consoleLn('Starting PhantomBot version 2.0.5 updates...');

        $.consoleLn('Disabling new default modules...');
        for (i in newDefaultDisabledModules) {
            $.inidb.set('modules', newDefaultDisabledModules[i], 'false');
        }

        $.consoleLn('Removing commandCooldown table...');
        $.inidb.RemoveFile('commandCooldown');

        $.consoleLn('PhantomBot v2.0.5 updates completed!');
        $.inidb.set('updates', 'installedv2.0.5', 'true');
    }

    if (!$.inidb.exists('updates', 'installedv2.0.6') || $.inidb.get('updates', 'installedv2.0.6') != 'true') {
        $.consoleLn('Starting PhantomBot version 2.0.6 updates...');


        if ($.inidb.exists('chatModerator', 'capsLimit')) {
            $.inidb.del('chatModerator', 'capsLimit');
        }

        $.consoleLn('PhantomBot v2.0.6 updates completed!');
        $.inidb.set('updates', 'installedv2.0.6', 'true');
    }

    /** Version 2.0.7 updates */
    if (!$.inidb.exists('updates', 'installedv2.0.7') || $.inidb.get('updates', 'installedv2.0.7') != 'true') {
        $.consoleLn('Starting PhantomBot version 2.0.7 updates...');

        var newDefaultDisabledModules = [
            './handlers/gameWispHandler.js',
            './commands/deathctrCommand.js',
        ]; //ADD NEW MODULES IN 2.0.7 TO BE DISABLED PLEASE.

        $.consoleLn('Disabling new default modules...');
        for (i in newDefaultDisabledModules) {
            $.inidb.set('modules', newDefaultDisabledModules[i], 'false');
        }

        if ($.inidb.exists('chatModerator', 'regularsToggle')) {
            if ($.inidb.get('chatModerator', 'regularsToggle').equalsIgnoreCase('true')) {
                $.inidb.set('chatModerator', 'regularsModerateLinks', false);
                $.inidb.del('chatModerator', 'regularsToggle');
            } else if ($.inidb.get('chatModerator', 'regularsToggle').equalsIgnoreCase('false')) {
                $.inidb.set('chatModerator', 'regularsModerateLinks', true);
                $.inidb.del('chatModerator', 'regularsToggle');
            }
        }

        if ($.inidb.exists('chatModerator', 'subscribersToggle')) {
            if ($.inidb.get('chatModerator', 'subscribersToggle').equalsIgnoreCase('true')) {
                $.inidb.set('chatModerator', 'subscribersModerateLinks', false);
                $.inidb.del('chatModerator', 'subscribersToggle');
            } else if ($.inidb.get('chatModerator', 'subscribersToggle').equalsIgnoreCase('false')) {
                $.inidb.set('chatModerator', 'subscribersModerateLinks', true);
                $.inidb.del('chatModerator', 'subscribersToggle');
            }
        }

        /**
        * delete uptime command if it exits because I added this as a default command.
        */
        if ($.inidb.exists('command', 'uptime')) {
            $.inidb.del('command', 'uptime');
        }

        $.consoleLn('PhantomBot v2.0.7 updates completed!');
        $.inidb.set('updates', 'installedv2.0.7', 'true');
    }

    /** Version 2.0.7.2 updates */
    if (!$.inidb.exists('updates', 'installedv2.0.7.2') || $.inidb.get('updates', 'installedv2.0.7.2') != 'true') {
        $.consoleLn('Starting PhantomBot version 2.0.7.2 updates...');

        if ($.inidb.exists('chatModerator', 'longMessageMessage')) {
            if ($.inidb.get('chatModerator', 'longMessageMessage').equalsIgnoreCase('false')) {
                $.inidb.del('chatModerator', 'longMessageMessage');
            }
        }

        $.consoleLn('PhantomBot v2.0.7.2 updates completed!');
        $.inidb.set('updates', 'installedv2.0.7.2', 'true');
    }

    /** Version 2.0.8 updates */
    if (!$.inidb.exists('updates', 'installedv2.0.8') || $.inidb.get('updates', 'installedv2.0.8') != 'true') {
        $.consoleLn('Starting PhantomBot version 2.0.8 updates...');

        var newDefaultDisabledModules = [
            './handlers/twitterHandler.js',
            './systems/audioPanelSystem.js',
            './systems/queueSystem.js'
        ]; //ADD NEW MODULES IN 2.0.8 TO BE DISABLED PLEASE.

        $.consoleLn('Disabling new default modules...');
        for (i in newDefaultDisabledModules) {
            $.inidb.set('modules', newDefaultDisabledModules[i], 'false');
        }

        $.consoleLn('PhantomBot v2.0.8 updates completed!');
        $.inidb.set('updates', 'installedv2.0.8', 'true');
    }

    /** Version 2.0.9 updates */
    if (!$.inidb.exists('updates', 'installedv2.0.9') || $.inidb.get('updates', 'installedv2.0.9') != 'true') {
        $.consoleLn('Starting PhantomBot version 2.0.9 updates...');

        $.consoleLn('Deleting old emotes cache...');
        $.inidb.del('emotescache', 'emotes');

        $.consoleLn('PhantomBot v2.0.9 updates completed!');
        $.inidb.set('updates', 'installedv2.0.9', 'true');
    }

    /** Version 2.1/2.0.10 updates */
    if (!$.inidb.exists('updates', 'installedv2.1.0') || $.inidb.get('updates', 'installedv2.1.0') != 'true') {
        $.consoleLn('Starting PhantomBot version 2.1 updates...');

        $.consoleLn('Aliasing !permission to !group...');
        $.inidb.set('aliases', 'group', 'permission');

        $.consoleLn('Aliasing !permissionpoints to !grouppoints...');
        $.inidb.set('aliases', 'grouppoints', 'permissionpoints');

        $.consoleLn('Aliasing !permissions to !groups...');
        $.inidb.set('aliases', 'groups', 'permissions');

        $.consoleLn('Disabling new modules...');
        $.inidb.set('modules', './games/gambling.js', 'false');

        $.consoleLn('Setting up the new Twitter post delay...');
        $.inidb.set('twitter', 'postdelay_update', 180);

        $.consoleLn('PhantomBot v2.1 updates completed!');
        $.inidb.set('updates', 'installedv2.1.0', 'true');
        $.inidb.set('updates', 'installedNewBot', 'true');//If bot login is deleted after updates were installed we don't want to reset the modules.
    }

    /** Version 2.2 updates */
    if (!$.inidb.exists('updates', 'installedv2.1.1') || $.inidb.get('updates', 'installedv2.1.1') != 'true') {
        $.consoleLn('Starting PhantomBot v2.2 updates...');

        $.consoleLn('Disabling new modules...');
        $.inidb.set('modules', './handlers/streamTipHandler.js', 'false');

        $.consoleLn('PhantomBot v2.2 updates completed!');
        $.inidb.set('updates', 'installedv2.1.1', 'true');
    }

    /** Version 2.3 updates */
    if (!$.inidb.exists('updates', 'installedv2.3s') || $.inidb.get('updates', 'installedv2.3s') != 'true') {
        $.consoleLn('Starting PhantomBot v2.3 updates...');

        $.consoleLn('Disabling new modules...');
        $.inidb.set('modules', './handlers/bitsHandler.js', 'false');

        $.consoleLn('Setting up new default custom commands...');
        if (!$.inidb.exists('command', 'uptime')) {
            $.inidb.set('command', 'uptime', '(pointtouser) (channelname) has been online for (uptime)');
        }
        if (!$.inidb.exists('command', 'followage')) {
            $.inidb.set('command', 'followage', '(followage)');
        }
        if (!$.inidb.exists('command', 'playtime')) {
            $.inidb.set('command', 'playtime', '(pointtouser) (channelname) has been playing (game) for (playtime)');
        }
        if (!$.inidb.exists('command', 'title')) {
            $.inidb.set('command', 'title', '(pointtouser) (titleinfo)');
        }
        if (!$.inidb.exists('command', 'game')) {
            $.inidb.set('command', 'game', '(pointtouser) (gameinfo)');
        }
        if (!$.inidb.exists('command', 'age')) {
            $.inidb.set('command', 'age', '(age)');
        }
        if ($.inidb.exists('permcom', 'game set')) {
            $.inidb.set('permcom', 'setgame', $.inidb.get('permcom', 'game set'));
        }
        if ($.inidb.exists('permcom', 'title set')) {
            $.inidb.set('permcom', 'settitle', $.inidb.get('permcom', 'title set'));
        }

        $.inidb.del('permcom', 'game set');
        $.inidb.del('permcom', 'title set');

        $.consoleLn('Setting up new toggles...');
        $.inidb.set('adventureSettings', 'warningMessage', true);
        $.inidb.set('adventureSettings', 'enterMessage', true);

        $.consoleLn('PhantomBot v2.3 updates completed!');
        $.inidb.set('updates', 'installedv2.3s', 'true');
    }

    /* version 2.3.3s updates */
    if (!$.inidb.exists('updates', 'installedv2.3.3ss') || $.inidb.get('updates', 'installedv2.3.3ss') != 'true') {
        $.consoleLn('Starting PhantomBot update 2.3.3 updates...');

        $.consoleLn('Deleting the old emotes cache.');
        $.inidb.RemoveFile('emotecache');

        $.consoleLn('Updating raffle settings...');
        if ($.inidb.exists('settings', 'raffleMSGToggle')) {
            $.inidb.set('raffleSettings', 'raffleMSGToggle', $.inidb.get('settings', 'raffleMSGToggle'));
            $.inidb.del('settings', 'raffleMSGToggle');
        }

        if ($.inidb.exists('settings', 'noRepickSame')) {
            $.inidb.set('raffleSettings', 'noRepickSame', $.inidb.get('settings', 'noRepickSame'));
            $.inidb.del('settings', 'noRepickSame');
        }

        if ($.inidb.exists('settings', 'raffleMessage')) {
            $.inidb.set('raffleSettings', 'raffleMessage', $.inidb.get('settings', 'raffleMessage'));
            $.inidb.del('settings', 'raffleMessage');
        }

        if ($.inidb.exists('settings', 'raffleMessageInterval')) {
            $.inidb.set('raffleSettings', 'raffleMessageInterval', $.inidb.get('settings', 'raffleMessageInterval'));
            $.inidb.del('settings', 'raffleMessageInterval');
        }

        if ($.inidb.exists('command', 'uptime') && $.inidb.get('command', 'uptime').equalsIgnoreCase('(@sender) (channelname) has been online for (uptime)')) {
            $.inidb.set('command', 'uptime', '(pointtouser) (channelname) has been online for (uptime)');
        }

        if ($.inidb.exists('command', 'playtime') && $.inidb.get('command', 'playtime').equalsIgnoreCase('(@sender) (channelname) has been playing (game) for (playtime)')) {
            $.inidb.set('command', 'playtime', '(pointtouser) (channelname) has been playing (game) for (playtime)');
        }

        if ($.inidb.exists('command', 'title') && $.inidb.get('command', 'title').equalsIgnoreCase('(@sender) (titleinfo)')) {
            $.inidb.set('command', 'title', '(pointtouser) (titleinfo)');
        }

        if ($.inidb.exists('command', 'game') && $.inidb.get('command', 'game').equalsIgnoreCase('(@sender) (gameinfo)')) {
            $.inidb.set('command', 'game', '(pointtouser) (gameinfo)');
        }

        // Disable the Discord Module by default. //
        $.inidb.set('modules', './handlers/discordHandler.js', 'false');

        $.consoleLn('PhantomBot update 2.3.3 completed!');
        $.inidb.set('updates', 'installedv2.3.3ss', 'true');
    }

    /* version 2.3.5 updates */
    if (!$.inidb.exists('updates', 'installedv2.3.5ss') || $.inidb.get('updates', 'installedv2.3.5ss') != 'true') {
        $.consoleLn('Starting PhantomBot update 2.3.5 updates...');

        $.inidb.set('chatModerator', 'moderationLogs', 'false');
        $.inidb.set('modules', './systems/bettingSystem.js', 'false');
        $.inidb.del('modules', './systems/betSystem.js');

        $.consoleLn('Removing old discord settings...');
        $.inidb.RemoveFile('discordSettings');
        $.inidb.RemoveFile('discordKeywords');
        $.inidb.RemoveFile('discordCommands');
        $.inidb.RemoveFile('discordCooldown');
        $.inidb.del('modules', './handlers/discordHandler.js');

        $.consoleLn('Disabling new modules.');
        $.inidb.set('modules', './handlers/tipeeeStreamHandler.js', 'false');

        $.consoleLn('Reloading blacklist and whitelist...');
        var keys = $.inidb.GetKeyList('blackList', ''),
            i;

        for (i = 0; i < keys.length; i++) {
            $.inidb.set('blackList', $.inidb.get('blackList', keys[i]), 'true');
            $.inidb.del('blackList', keys[i]);
        }

        keys = $.inidb.GetKeyList('whiteList', '');

        for (i = 0; i < keys.length; i++) {
            $.inidb.set('whiteList', $.inidb.get('whiteList', keys[i]), 'true');
            $.inidb.del('whiteList', keys[i]);
        }

        $.consoleLn('Updating host settings...');
        $.inidb.set('settings', 'hostToggle', true);

        $.consoleLn('Disabling default discord modules.');
        modules = [
            './discord/handlers/bitsHandler.js',
            './discord/handlers/followHandler.js',
            './discord/handlers/subscribeHandler.js',
            './discord/handlers/streamtipHandler.js',
            './discord/handlers/streamlabsHandler.js',
            './discord/handlers/tipeeeStreamHandler.js',
            './discord/handlers/hostHandler.js',
            './discord/handlers/twitterHandler.js',
            './discord/handlers/keywordHandler.js',
            './discord/handlers/streamHandler.js',
            './discord/handlers/gamewispHandler.js',
            './discord/systems/greetingsSystem.js',
            './discord/commands/customCommands.js',
            './discord/games/8ball.js',
            './discord/games/kill.js',
            './discord/games/random.js',
            './discord/games/roulette.js'
        ];
        for (i in modules) {
            $.inidb.set('modules', modules[i], 'false');
        }

        $.inidb.set('permcom', 'permission', '1');
        if ($.inidb.exists('permcom', 'group')) {
            $.inidb.set('permcom', 'group', '1');
        }

        $.consoleLn('PhantomBot update 2.3.5 completed!');
        $.inidb.set('updates', 'installedv2.3.5ss', 'true');
    }

    /* version 2.3.5.1 updates */
    if (!$.inidb.exists('updates', 'installedv2.3.5.1') || $.inidb.get('updates', 'installedv2.3.5.1') != 'true') {
        $.consoleLn('Starting PhantomBot update 2.3.5.1 updates...');

        if ($.inidb.exists('aliases', 'points')) {
            $.inidb.del('aliases', 'points');
        }

        if ($.inidb.exists('aliases', 'point')) {
            $.inidb.del('aliases', 'point');
        }

        $.consoleLn('PhantomBot update 2.3.5.1 completed!');
        $.inidb.set('updates', 'installedv2.3.5.1', 'true');
    }

    /* version 2.3.5.2 updates */
    if (!$.inidb.exists('updates', 'installedv2.3.5.2') || $.inidb.get('updates', 'installedv2.3.5.2') != 'true') {
        $.consoleLn('Starting PhantomBot update 2.3.5.2 updates...');

        $.consoleLn('Reloading quotes... Please do not turn off your bot.');
        var keys = $.inidb.GetKeyList('quotes', ''),
            temp = [],
            i;

        for (i in keys) {
            var quote = $.inidb.get('quotes', keys[i]);
            if (quote != null) {
                temp.push(quote);
            }
        }

        $.inidb.RemoveFile('quotes');

        $.inidb.setAutoCommit(false);
        for (i in temp) {
            $.inidb.set('quotes', i, temp[i]);
        }
        $.inidb.setAutoCommit(true);
        $.inidb.SaveAll(true);

        $.inidb.del('modules', './handlers/discordHandler.js');

        $.consoleLn('PhantomBot update 2.3.5.2 completed!');
        $.inidb.set('updates', 'installedv2.3.5.2', 'true');
    }

    /* version 2.3.5.3 updates */
    if (!$.inidb.exists('updates', 'installedv2.3.5.3') || $.inidb.get('updates', 'installedv2.3.5.3') != 'true') {
        $.consoleLn('Starting PhantomBot update 2.3.5.3 updates...');

        if (!$.inidb.exists('settings', 'followDelay') || ($.inidb.exists('settings', 'followDelay') && parseInt($.inidb.get('settings', 'followDelay')) < 5)) {
            $.inidb.set('settings', 'followDelay', 5);
        }

        $.consoleLn('PhantomBot update 2.3.5.3 completed!');
        $.inidb.set('updates', 'installedv2.3.5.3', 'true');
    }

    /* version 2.3.6 updates */
    if (!$.inidb.exists('updates', 'installedv2.3.6') || $.inidb.get('updates', 'installedv2.3.6') != 'true') {
        $.consoleLn('Starting PhantomBot update 2.3.6 updates...');

        $.consoleLn('Disabling default discord modules.');
        $.inidb.set('modules', './discord/games/roll.js', 'false');
        $.inidb.set('modules', './discord/games/slotMachine.js', 'false');
        $.inidb.set('modules', './discord/games/gambling.js', 'false');
        $.inidb.set('modules', './discord/systems/pointSystem.js', 'false');

        $.inidb.set('permcom', $.botName.toLowerCase(), '2');
        
        $.consoleLn('PhantomBot update 2.3.6 completed!');
        $.inidb.set('updates', 'installedv2.3.6', 'true');
    }

    /* version 2.3.6s updates */
    if (!$.inidb.exists('updates', 'installedv2.3.6ss') || $.inidb.get('updates', 'installedv2.3.6ss') != 'true') {
        $.consoleLn('Starting PhantomBot update 2.3.6s updates...');

        $.inidb.del('cooldown', 'globalCooldownTime');
        $.inidb.del('cooldown', 'modCooldown');
        $.inidb.del('cooldown', 'perUserCooldown');
        $.inidb.del('cooldown', 'globalCooldown');
        $.inidb.del('discordCooldown', 'globalCooldown');
        $.inidb.del('discordCooldown', 'globalCooldownTime');

        var keys = $.inidb.GetKeyList('cooldown', ''),
            seconds,
            i;

        $.consoleLn('Updating cooldowns...');
        for (i in keys) {
            seconds = $.inidb.get('cooldown', keys[i]);
            $.inidb.set('cooldown', keys[i], JSON.stringify({command: String(keys[i]), seconds: String(seconds), isGlobal: 'true'}));
        }

        $.consoleLn('Updating Discord cooldowns...');
        for (i in keys) {
            seconds = $.inidb.get('discordCooldown', keys[i]);
            $.inidb.set('discordCooldown', keys[i], JSON.stringify({command: String(keys[i]), seconds: String(seconds), isGlobal: 'true'}));
        }

        $.consoleLn('PhantomBot update 2.3.6s completed!');
        $.inidb.set('updates', 'installedv2.3.6ss', 'true');
    }

    /* version 2.3.6b updates */
    if (!$.inidb.exists('updates', 'installedv2.3.6b') || $.inidb.get('updates', 'installedv2.3.6b') != 'true') {
        $.consoleLn('Starting PhantomBot update 2.3.6b updates...');

        $.consoleLn('Fixing uppercase usernames in tables.');

        var keys = $.inidb.GetKeyList('points', ''),
            i;

        $.inidb.setAutoCommit(false);
        for (i in keys) {
            if (keys[i].match(/[A-Z]/)) {
                $.inidb.incr('points', keys[i].toLowerCase(), $.inidb.get('points', keys[i]));
                $.inidb.del('points', keys[i]);
                $.consoleLn('[points] ' + keys[i] + ' -> ' + keys[i].toLowerCase() + '::' + $.inidb.get('points', keys[i].toLowerCase()));
            } else if (keys[i].match(/[^a-zA-Z0-9_]/)) {
                $.inidb.del('points', keys[i]);
                $.consoleLn('[points] [remove] ' + keys[i]);
            }
        }

        keys = $.inidb.GetKeyList('group', '');

        for (i in keys) {
            if (keys[i].match(/[A-Z]/)) {
                $.inidb.set('group', keys[i].toLowerCase(), $.inidb.get('group', keys[i]));
                $.inidb.del('group', keys[i]);
                $.consoleLn('[permission] ' + keys[i] + ' -> ' + keys[i].toLowerCase() + '::' + $.inidb.get('group', keys[i].toLowerCase()));
            } else if (keys[i].match(/[^a-zA-Z0-9_]/)) {
                $.inidb.del('group', keys[i]);
                $.consoleLn('[permission] [remove] ' + keys[i]);
            }
        }
        $.inidb.setAutoCommit(true);
        $.inidb.SaveAll(true);

        $.consoleLn('PhantomBot update 2.3.6b completed!');
        $.inidb.set('updates', 'installedv2.3.6b', 'true');
    }

    /* version 2.3.7 updates */
    if (!$.inidb.exists('updates', 'installedv2.3.7') || $.inidb.get('updates', 'installedv2.3.7') != 'true') {
        $.consoleLn('Starting PhantomBot update 2.3.7 updates...');

        var keys = $.inidb.GetKeyList('blackList', ''),
            timeout = $.getIniDbNumber('chatModerator', 'blacklistTimeoutTime', 600),
            message = $.getIniDbString('chatModerator', 'blacklistMessage', 'you were timed out for using a blacklisted phrase.'),
            messageB = $.getIniDbString('chatModerator', 'silentBlacklistMessage', 'Fake purge. (Automated by ' + $.botName + ')'),
            obj = {},
            i;

        if ($.getIniDbNumber('chatModerator', 'msgCooldownSecs', 45) == 45) {
            $.inidb.set('chatModerator', 'msgCooldownSecs', 30);
        }

        $.consoleLn('Updating blacklist...');
        $.inidb.setAutoCommit(false);
        for (i in keys) {
            obj = {
                id: String(i),
                timeout: String(timeout),
                isRegex: keys[i].startsWith('regex:'),
                phrase: String(keys[i]),
                isSilent: false,
                excludeRegulars: false,
                excludeSubscribers: false,
                message: String(message),
                banReason: String(messageB)
            };
            $.inidb.set('blackList', keys[i], JSON.stringify(obj));
        }
        $.inidb.setAutoCommit(true);
        $.inidb.SaveAll(true);

        $.consoleLn('PhantomBot update 2.3.7 completed!');
        $.inidb.set('updates', 'installedv2.3.7', 'true');
    }

    /**
     * @function getTableContents
     * @param {string} tableName
     * @returns {Array}
     */
    function getTableContents(tableName) {
        var contents = [],
            keyList = $.inidb.GetKeyList(tableName, ''),
            temp,
            i;

        for (i in keyList) {

            // Handle Exceptions per table
            switch (tableName) {
                // Ignore rows with less than 600 seconds (10 minutes)
                case 'time':
                    temp = parseInt($.inidb.get(tableName, keyList[i]));
                    if (temp >= 600) {
                        contents[keyList[i]] = $.inidb.get(tableName, keyList[i]);
                    }
                    break;

                    // Ignore rows with less than 10 points
                case 'points':
                    temp = parseInt($.inidb.get(tableName, keyList[i]));
                    if (temp >= 10) {
                        contents[keyList[i]] = $.inidb.get(tableName, keyList[i]);
                    }
                    break;

                    // Put the rows in by default
                default:
                    contents[keyList[i]] = $.inidb.get(tableName, keyList[i]);
                    break;
            }
        }

        return contents;
    }

    /**
     * @function setTableContents
     * @param {string} tableName
     * @param {Array} contents
     */
    function restoreTableContents(tableName, contents) {
        var i;

        $.inidb.setAutoCommit(false);
        for (i in contents) {
            $.inidb.set(tableName, i, contents[i]);
        }
        $.inidb.setAutoCommit(true);
        $.inidb.SaveAll(true);
    }
})();
