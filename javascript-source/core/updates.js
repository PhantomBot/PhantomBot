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
  if (!$.inidb.exists('settings', 'installedv2') || $.inidb.exists('settings', 'installedv2') != 'true') {
    Packages.com.gmt2001.Console.out.println('Starting PhantomBot version 2 updates...');
    // Delete tables from version 1.6.6.1
    // Except points and time
    var tableNamesList = $.inidb.GetFileList(),
        ignoredTables = [
            'points',
            'time'
        ],

        defaultDisabledModules = [
          './games/8ball.js',
          './games/adventureSystem.js',
          './games/killCommand.js',
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
        ],
        i;

    for (i in tableNamesList) {
      if (ignoredTables.indexOf(tableNamesList[i]) < 0) {
        $.inidb.RemoveFile(tableNamesList[i]);
      }
    }


    // Disable modules that are not needed by default
    for (i in defaultDisabledModules) {
      $.inidb.set('modules', defaultDisabledModules[i], 'false');
    }

    // DONE
    $.inidb.set('settings', 'installedv2', 'true');
    Packages.com.gmt2001.Console.out.println('PhantomBot version 2 updates completed...');
  }
})();
