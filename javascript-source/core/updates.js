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
(function () {
    if (!$.inidb.exists('updates', 'installedv2') || $.inidb.get('updates', 'installedv2') != 'true') {
    var tableNamesList = $.inidb.GetFileList(),
        commandsBackup,
        timeBackup,
        pointsBackup,
        i,
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
        ];
        
        if ($.inidb.FileExists('settings')) {
            $.consoleLn('Starting PhantomBot version 2.0 updates...');
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

        $.consoleLn('Done!');
        $.inidb.set('updates', 'installedv2', 'true');
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

    for (i in contents) {
      $.inidb.set(tableName, i, contents[i]);
    }
  }
})();
