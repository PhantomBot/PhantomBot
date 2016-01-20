/**
 * init.js
 *
 * Initialize the bot (loadscripts, register commands and modules etc.)
 * Use the $ API
 * Use the $.bot API
 *
 * use "$.bind('initReady', FUNCTION);" to execute code after loading all scripts (like registering commands)
 */
(function () {
  var initScript = $script,
      connected = false,
      modeO = false,
      modules = [],
      hooks = [];

  /**
   * @class
   * @param {string} scriptFile
   * @param {string} script
   * @param {string} enabled
   */
  function Module(scriptFile, script, enabled) {
    this.scriptFile = scriptFile;
    this.script = script;
    this.enabled = enabled;

    if (scriptFile.indexOf('./core/') > -1) {
      this.enabled = true;
    }

    this.getModuleName = function () {
      return this.scriptFile.replace(/([a-z]+)\.js$/i, '$1');
    }
  }

  /**
   * @class
   * @param {string} scriptFile
   * @param {string} hook
   * @param {Function} handler
   */
  function Hook(scriptFile, hook, handler) {
    this.scriptFile = scriptFile;
    this.hook = hook;
    this.handler = handler;
  }

  /**
   * @function consoleLn
   * @export $
   * @param {string} message
   */
  function consoleLn(message) {
    Packages.com.gmt2001.Console.out.println(java.util.Objects.toString(message));
  };

  /**
   * @function generateJavaTrampolines
   */
  function generateJavaTrampolines() {
    var name,
        isJavaProperty = function (name) {
          var blacklist = ['getClass', 'equals', 'notify', 'class', 'hashCode', 'toString', 'wait', 'notifyAll'], i;
          for (i in blacklist) {
            if (blacklist[i] == name) {
              return true;
            }
          }
          return false;
        },
        generateTrampoline = function (obj, name) {
          return function () {
            var args = [$script];
            for (var i = 0; i < arguments.length; i++) {
              args.push(arguments[i]);
            }
            obj[name].save(obj, args);
          };
        };

    for (name in $api) {
      if (isJavaProperty(name)) {
        continue;
      }
      if (typeof $api[name] == 'function') {
        $[name] = generateTrampoline($api, name);
      } else {
        $[name] = $api[name];
      }
    }
  }

  /**
   * @function loadScript
   * @export $.bot
   * @param {string} scriptFile
   * @param {boolean} [force]
   * @param {boolean} [silent]
   */
  function loadScript(scriptFile, force, silent) {
    if (!isModuleLoaded(scriptFile) || force) {
      try {
        var script = $api.loadScriptR($script, scriptFile),
            enabled;

        if (!$.inidb.exists('modules', scriptFile)) {
          enabled = true;
          $.setIniDbBoolean('modules', scriptFile, enabled);
        } else {
          enabled = $.getIniDbBoolean('modules', scriptFile);
        }

        modules.push(new Module(scriptFile, script, enabled));
        if (!silent) {
          consoleLn('Loaded module: ' + scriptFile.replace(/\.\//g, '') + ' (' + (enabled ? 'Enabled' : 'Disabled') + ')');
        }
      } catch (e) {
        consoleLn('Failed loading "' + scriptFile + '": ' + e);
        if (isModuleLoaded('./core/logging.js')) {
          $.logError('init.js', 70, '(loadScript, ' + scriptFile + ') ' + e);
        }
      }
    }
  };

  /**
   * @function loadScriptRecursive
   * @export $.bot
   * @param {string} path
   * @param {boolean} [silent]
   */
  function loadScriptRecursive(path, silent) {
    if (path.substring($.strlen(path) - 1).equalsIgnoreCase('/')) {
      path = path.substring(0, $.strlen(path) - 1);
    }
    var list = $.findFiles('./scripts/' + path, ''),
        i;
    for (i = 0; i < list.length; i++) {
      if (path.equalsIgnoreCase('.')) {
        if (list[i].equalsIgnoreCase('util') || list[i].equalsIgnoreCase('lang') || list[i].equalsIgnoreCase('init.js') || list[i].equalsIgnoreCase('dev')) {
          continue;
        }
      }
      if ($.isDirectory('./scripts/' + path + '/' + list[i])) {
        loadScriptRecursive(path + '/' + list[i], silent);
      } else {
        loadScript(path + '/' + list[i], false, silent);
      }
    }
  };

  /**
   * @function getModuleIndex
   * @param {string} scriptFile
   * @returns {Number}
   */
  function getModuleIndex(scriptFile) {
    var i;
    for (i in modules) {
      if (modules[i].scriptFile.equalsIgnoreCase(scriptFile)) {
        return i;
      }
    }
    return -1;
  };

  /**
   * @function isModuleEnabled
   * @export $.bot
   * @param {string} scriptFile
   * @returns {boolean}
   */
  function isModuleEnabled(scriptFile) {
    var i = getModuleIndex(scriptFile);
    if (i > -1) {
      return modules[i].enabled;
    }
    return false;
  };

  /**
   * @function isModuleLoaded
   * @export $.bot
   * @param {string} scriptFile
   * @returns {boolean}
   */
  function isModuleLoaded(scriptFile) {
    return (getModuleIndex(scriptFile) > -1);
  };

  /**
   * @function getModule
   * @param {string} scriptFile
   * @returns {Module}
   */
  function getModule(scriptFile) {
    var i = getModuleIndex(scriptFile);
    if (i > -1) {
      return modules[i];
    }
    return null;
  };

  /**
   * @function getHookIndex
   * @param {string} scriptFile
   * @param {string} hook
   * @returns {Number}
   */
  function getHookIndex(scriptFile, hook) {
    var i;
    for (i in hooks) {
      if (hooks[i].scriptFile.equalsIgnoreCase(scriptFile) && hooks[i].hook.equalsIgnoreCase(hook)) {
        return i;
      }
    }
    return -1;
  };

  /**
   * @function addHook
   * @export $ as bind
   * @param {string} hook
   * @param {Function} handler
   */
  function addHook(hook, handler) {
    var scriptFile = $script.getPath().replace('\\', '/').replace('./scripts/', ''),
        i = getHookIndex(scriptFile, hook);
    if (i > -1) {
      hooks[i].handler = handler;
    } else {
      hooks.push(new Hook(scriptFile, hook, handler));
    }
  };

  /**
   * @function removeHook
   * @export $ as unbind
   * @param {string} hook
   */
  function removeHook(hook) {
    var scriptFile = $script.getPath().replace('\\', '/').replace('./scripts/', ''),
        i = getHookIndex(scriptFile, hook);
    if (i > -1) {
      hooks.splice(i, 1);
    }
  };

  /**
   * @function callHook
   * @param {string} hook
   * @param {Object} event
   * @param {boolean} [alwaysRun]
   */
  function callHook(hook, event, alwaysRun) {
    var i;
    for (i in hooks) {
      if (hooks[i].hook.equalsIgnoreCase(hook) && (isModuleEnabled(hooks[i].scriptFile) || alwaysRun)) {
        try {
          hooks[i].handler(event);
        } catch (e) {
          $.logError('init.js', 173, '(hook.call, ' + hook + ', ' + hooks[i].scriptFile + ') ' + e);
        }
      }
    }
  };

  /**
   * Load her up!
   */

  function startInit() {
    // Generate JavaScript trampolines for Java functions
    generateJavaTrampolines();

    // Load core scripts
    loadScript('./core/misc.js');
    loadScript('./core/jsTimers.js');
    loadScript('./core/fileSystem.js');
    loadScript('./core/lang.js');
    loadScript('./core/logging.js');
    loadScript('./core/commandRegister.js');
    loadScript('./core/whisper.js');
    loadScript('./core/chatModerator.js');
    loadScript('./core/commandCoolDown.js');
    loadScript('./core/gameMessages.js');
    loadScript('./core/patternDetector.js');
    loadScript('./core/permissions.js');
    loadScript('./core/streamInfo.js');
    loadScript('./core/pointSystem.js');
    loadScript('./core/ranks.js');
    loadScript('./core/timeSystem.js');

    $.logEvent('init.js', 285, 'Core loaded, initializing bot...');

    // Load all other modules
    loadScriptRecursive('.');

    // Bind all $api events
    /**
     * @event api-ircChannelMessage
     */
    $api.on($script, 'ircChannelMessage', function (event) {
      consoleLn($.username.resolve(event.getSender().toLowerCase(), event.getTags()) + ': ' + event.getMessage());
    });

    /**
     * @event api-ircJoinComplete
     */
    $api.on($script, 'ircJoinComplete', function (event) {
      connected = true;
      $.channel = event.getChannel();
    });

    /**
     * @event api-ircChannelUserMode
     */
    $api.on($script, 'ircChannelUserMode', function (event) {
      if (!connected) {
        return;
      }
      if (event.getChannel().getName().equalsIgnoreCase($.channelName)) {
        if (event.getUser().equalsIgnoreCase($.botName) && event.getMode().equalsIgnoreCase('o')) {
          if (event.getAdd()) {
            if (!modeO) {
              consoleLn('Bot ready!');
            }
            modeO = true;
          }
        }
      }
    });

    /**
     * @event api-command
     */
    $api.on($script, 'command', function (event) {
      var sender = event.getSender().toLowerCase(),
          tags = event.getTags(),
          origCommand = event.getCommand().toLowerCase(),
          cooldown,
          command;

      if (!$.isModv3(sender, tags) && $.commandPause.isPaused()) {
        $.say($.whisperPrefix(sender) + $.lang.get('commandpause.isactive'));
        return;
      }

      if ($.inidb.exists('aliases', origCommand)) {
        event.setCommand($.inidb.get('aliases', origCommand));
      }

      command = event.getCommand().toLowerCase();
      if (command.indexOf('!!') > -1 && !$.commandExists(command)) {
        $.say($.whisperPrefix(sender) + $.lang.get('cmd.404', command));
        return;
      }

      if (!$.permCom(sender, command)) {
        $.say($.whisperPrefix(sender) + $.lang.get('cmd.noperm', $.getUserGroupName(sender), command));
        return;
      }

      if (!$.isAdmin(sender)) {
        cooldown = $.coolDown.get(command, sender);
        if (cooldown > 0) {
          $.say($.whisperPrefix(sender) + $.lang.get('cooldown.active', command, $.getTimeString(cooldown / 1e3)));
          return;
        }
      }

      if (isModuleEnabled('./core/pointsSystem.js') && !$.isModv3(sender, event.getTags()) && $.inidb.exists('pricecom', command)) {
        if ($.getUserPoints(sender) < $.getCommandPrice(command)) {
          $.say($.whisperPrefix(sender) + $.lang.get('cmd.needpoints', $.getPointsString($.inidb.get('pricecom', command))));
          return;
        }
        if (parseInt($.inidb.get('pricecom', command)) > 0) {
          $.inidb.decr('points', sender, $.inidb.get('pricecom', command));
        }
      }

      callHook('command', event, false);
    });

    /**
     * @event api-consoleInput
     */
    $api.on($script, 'consoleInput', function (event) {
      callHook('consoleInput', event, true);
    });

    /**
     * @event api-twitchFollow
     */
    $api.on($script, 'twitchFollow', function (event) {
      callHook('twitchFollow', event, true);
    });

    /**
     * @event api-twitchUnFollow
     */
    $api.on($script, 'twitchUnfollow', function (event) {
      callHook('twitchUnfollow', event, true);
    });

    /**
     * @event api-twitchFollowsInitialized
     */
    $api.on($script, 'twitchFollowsInitialized', function (event) {
      callHook('twitchFollowsInitialized', event, true);
    });

    /**
     * @event api-twitchHosted
     */
    $api.on($script, 'twitchHosted', function (event) {
      callHook('twitchHosted', event, true);
    });

    /**
     * @event api-twitchUnhosted
     */
    $api.on($script, 'twitchUnhosted', function (event) {
      callHook('twitchUnhosted', event, true);
    });

    /**
     * @event twitchHostsInitialized
     */
    $api.on($script, 'twitchHostsInitialized', function (event) {
      callHook('twitchHostsInitialized', event, true);
    });

    /**
     * @event api-twitchSubscribe
     */
    $api.on($script, 'twitchSubscribe', function (event) {
      callHook('twitchSubscribe', event, true);
    });

    /**
     * @event api-twitchUnsubscribe
     */
    $api.on($script, 'twitchUnsubscribe', function (event) {
      callHook('twitchUnsubscribe', event, true);
    });

    /**
     * @event api-twitchSubscribesInitialized
     */
    $api.on($script, 'twitchSubscribesInitialized', function (event) {
      callHook('twitchSubscribesInitialized', event, true);
    });

    /**
     * @event api-ircChannelJoin
     */
    $api.on($script, 'ircChannelJoin', function (event) {
      callHook('ircChannelJoin', event, true);
    });

    /**
     * @event api-ircChannelLeave
     */
    $api.on($script, 'ircChannelLeave', function (event) {
      callHook('ircChannelLeave', event, true);
    });

    /**
     * @event api-ircChannelUserMode
     */
    $api.on($script, 'ircChannelUserMode', function (event) {
      callHook('ircChannelUserMode', event, true);
    });

    /**
     * @event api-ircConnectComplete
     */
    $api.on($script, 'ircConnectComplete', function (event) {
      callHook('ircConnectComplete', event, true);
    });

    /**
     * @event api-ircJoinComplete
     */
    $api.on($script, 'ircJoinComplete', function (event) {
      callHook('ircJoinComplete', event, true);
    });

    /**
     * @event api-ircPrivateMessage
     */
    $api.on($script, 'ircPrivateMessage', function (event) {
      callHook('ircPrivateMessage', event, false);
    });

    /**
     * @event api-ircChannelMessage
     */
    $api.on($script, 'ircChannelMessage', function (event) {
      if (event.getSender().equalsIgnoreCase('jtv') || event.getSender().equalsIgnoreCase('twitchnotify')) {
        callHook('ircPrivateMessage', event, false);
      } else {
        callHook('ircChannelMessage', event, false);
      }
    });

    /**
     * @event api-musicPlayerConnect
     */
    $api.on($script, 'musicPlayerConnect', function (event) {
      callHook('musicPlayerConnect', event, false);
    });

    /**
     * @event api-musicPlayerCurrentId
     */
    $api.on($script, 'musicPlayerCurrentId', function (event) {
      callHook('musicPlayerCurrentId', event, false);
    });

    /**
     * @event api-musicPlayerCurrentVolume
     */
    $api.on($script, 'musicPlayerCurrentVolume', function (event) {
      callHook('musicPlayerCurrentVolume', event, false);
    });

    /**
     * @event api-musicPlayerDisconnect
     */
    $api.on($script, 'musicPlayerDisconnect', function (event) {
      callHook('musicPlayerDisconnect', event, false);
    });

    /**
     * @event api-musicPlayerState
     */
    $api.on($script, 'musicPlayerState', function (event) {
      callHook('musicPlayerState', event, false);
    });

    $.logEvent('init.js', 534, 'Bot locked & loaded!');

    addHook('initReady', function () {
      $.registerChatCommand('./init.js', 'reconnect', 2);
      $.registerChatCommand('./init.js', 'module', 1);
    });

    // Send out initReady event
    callHook('initReady', null, true);
  }

  /**
   * @event api-command
   */
  $api.on(initScript, 'command', function (event) {
    var sender = event.getSender().toLowerCase(),
        username = $.username.resolve(sender, event.getTags()),
        command = event.getCommand(),
        args = event.getArgs(),
        action = args[0],
        temp,
        index;

    /**
     * @commandpath reconnect - Tell the bot to reconnect to the twitch chat and API
     */
    if (command.equalsIgnoreCase('reconnect')) {
      if (!$.isModv3(sender, event.getTags())) {
        $.say($.whisperPrefix(sender) + $.modMsg);
        return;
      }

      $.logEvent('init.js', 354, username + ' requested a reconnect!');
      $.connmgr.reconnectSession($.hostname);
      $.say($.lang.get('init.reconnect'));
    }

    if (command.equalsIgnoreCase('module')) {
      if (!$.isAdmin(sender)) {
        $.say($.whisperPrefix(sender) + $.adminMsg);
        return;
      }

      if (!action) {
        $.say($.whisperPrefix(sender) + $.lang.get('init.module.usage'));
        return;
      }

      /**
       * @commandpath module list - List all known modules
       */
      if (action.equalsIgnoreCase('list')) {
        temp = [];
        for (index in modules) {
          if (modules[index].enabled) {
            temp.push(modules[index].getModuleName());
          }
        }

        $.say($.whisperPrefix(sender) + $.lang.get('init.module.list', temp.length, temp.join(', ')));
      }

      /**
       * @commandpath module enable [script file path] - Enable a module
       */
      if (action.equalsIgnoreCase('enable')) {
        temp = args[1];

        if (!temp) {
          $.say($.whisperPrefix(sender) + $.lang.get('init.module.usage'));
          return;
        }

        if (temp.indexOf('./core/') > -1 || temp.indexOf('./lang/') > -1) {
          return;
        }

        index = getModuleIndex(temp);

        if (index > -1) {
          $.logEvent('init.js', 393, username + ' enabled module "' + modules[index].scriptFile + '"');
          modules[index].enabled = true;
          $.setIniDbBoolean('modules', modules[index].scriptFile, true);
          $.say($.whisperPrefix(sender) + $.lang.get('init.module.enabled', modules[index].getModuleName()));
        } else {
          $.say($.whisperPrefix(sender) + $.lang.get('init.module.404'));
        }
      }

      /**
       * @commandpath module disable [script file path] - Disable a module
       */
      if (action.equalsIgnoreCase('disable')) {
        temp = args[1];

        if (!temp) {
          $.say($.whisperPrefix(sender) + $.lang.get('init.module.usage'));
          return;
        }

        if (temp.indexOf('./core/') > -1 || temp.indexOf('./lang/') > -1) {
          return;
        }

        index = getModuleIndex(temp);

        if (index > -1) {
          $.logEvent('init.js', 393, username + ' disabled module "' + modules[index].scriptFile + '"');
          modules[index].enabled = false;
          $.setIniDbBoolean('modules', modules[index].scriptFile, false);
          $.say($.whisperPrefix(sender) + $.lang.get('init.module.disabled', modules[index].getModuleName()));
        } else {
          $.say($.whisperPrefix(sender) + $.lang.get('init.module.404'));
        }
      }

      /**
       * @commandpath module status [script file path] - Get the current status of a module
       */
      if (action.equalsIgnoreCase('status')) {
        temp = args[1];

        if (!temp) {
          $.say($.whisperPrefix(sender) + $.lang.get('init.module.usage'));
          return;
        }

        index = getModuleIndex(temp);

        if (index > 1) {
          if (modules[index].enabled) {
            $.say($.whisperPrefix(sender) + $.lang.get('init.module.check.enabled', modules[index].getModuleName()))
          } else {
            $.say($.whisperPrefix(sender) + $.lang.get('init.module.check.disabled', modules[index].getModuleName()))
          }
        } else {
          $.say($.whisperPrefix(sender) + $.lang.get('init.module.404'));
        }
      }
    }
  });

  /** Export functions to API */
  $.consoleLn = consoleLn;
  $.bind = addHook;
  $.unbind = removeHook;

  $.bot = {
    loadScript: loadScript,
    loadScriptRecursive: loadScriptRecursive,
    isModuleLoaded: isModuleLoaded,
    isModuleEnabled: isModuleEnabled,
    getModule: getModule,
  };

  // Start init
  startInit();
})();