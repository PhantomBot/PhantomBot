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
    Packages.com.gmt2001.Console.out.println('');
    Packages.com.gmt2001.Console.out.println('Starting PhantomBot version 2.0 updates...');
    Packages.com.gmt2001.Console.out.println('This can take several minutes...');
    Packages.com.gmt2001.Console.out.println('');

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
          './systems/cleanupSystem.js',
          './systems/greetingSystem.js',
          './systems/noticeSystem.js',
          './systems/pollSystem.js',
          './systems/quoteSystem.js',
          './systems/raffleSystem.js',
          './systems/raidSystem.js',
          './systems/youtubePlayer.js',
        ];

    Packages.com.gmt2001.Console.out.println('Preparing to save commands, times and points...');

    Packages.com.gmt2001.Console.out.println('Saving custom commands...');
    commandsBackup = getTableContents('command');
    Packages.com.gmt2001.Console.out.println('Saving times...');
    timeBackup = getTableContents('time');
    Packages.com.gmt2001.Console.out.println('Saving points...');
    pointsBackup = getTableContents('points');

    Packages.com.gmt2001.Console.out.println('Removing old files...');
    for (i in tableNamesList) {
      $.inidb.RemoveFile(tableNamesList[i]);
    }

    Packages.com.gmt2001.Console.out.println('Restoring custom commands...');
    restoreTableContents('command', commandsBackup);
    Packages.com.gmt2001.Console.out.println('Restoring times...');
    restoreTableContents('time', timeBackup);
    Packages.com.gmt2001.Console.out.println('Restoring points...');
    restoreTableContents('points', pointsBackup);

    Packages.com.gmt2001.Console.out.println('Disabling some modules...');
    for (i in defaultDisabledModules) {
      $.inidb.set('modules', defaultDisabledModules[i], 'false');
    }

    $.inidb.set('updates', 'installedv2', 'true');
    Packages.com.gmt2001.Console.out.println('PhantomBot version 2.0 updates completed...');
    Packages.com.gmt2001.Console.out.println('Now proceeding with normal start up...');
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
            contents[keyList[i]] = $.inidb.get(tableName, temp);
          }
          break;

        // Ignore rows with less than 10 points
        case 'points':
          temp = parseInt($.inidb.get(tableName, keyList[i]));
          if (temp >= 10) {
            contents[keyList[i]] = $.inidb.get(tableName, temp);
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
