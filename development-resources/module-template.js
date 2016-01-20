/**
 * myNewModule.js TODO: SET THE NAME OF MY NEW MODULE ABOVE
 *
 * TODO: DESCRIBE MY NEW MODULE, WHAT DOES IT DO, HOW DOES IT WORK
 * My new module describe how code should be setup and implemented in this scriptset.
 *
 */
(function () {
  /** TODO: MODULE VARIABLES AT THE TOP, PREFERABLY IN ONE VAR CALL */
  var myStaticModuleVariable = 'yt_playlist_',
      myModuleVariableLoadedFromDb = ($.inidb.exists('my_module_table', 'myDbValue') ? $.getIniDbBoolean('my_module_table', 'myDbValue') : false),
      myModuleVariableLoadedFromDb2 = ($.inidb.exists('my_module_table', 'myDbValue2') ? $.inidb.get('my_module_table', 'myDbValue2') : 'Default Value');

  /**
   * @class
   * @description DESCRIBE MY NEW MyNewClass
   * @param {string} myNewParam
   * @return {boolean}
   */
  function MyNewClass(myNewParam) {
    /** TODO: PRIVATE VARIABLES AT THE TOP, PREFERABLY IN ONE VAR CALL */
    var some = null,
        local = true,
        variables = [];

    /** TODO: PUBLIC VARIABLES HERE */
    this.publicVar = variables;
    this.otherPublicVar = false;

    /** TODO: IMPLEMENT CLASS FUNCTIONS HERE */

    /**
     * @function myNewFunction
     * @param {string} firstParam
     * @param {Number} secondParam
     * @return {boolean}
     */
    this.myNewFunction = function (firstParam, secondParam) {
      return false;
    };

    /** START CONTRUCTOR MyNewClass() */

    /** TODO: IMPLEMENT CLASS CONSTRUCTOR CODE HERE */

    /** END CONTRUCTOR MyNewClass() */
  }

  /** TODO: IMPEMENT ANY OTHER FUNCTIONS HERE */

  /** TODO: BIND AND IMPEMENT EVENT LISTENERS HERE */

  $.bind('command', function (event) {
    var command = event.getCommand(),
        sender = event.getSender(),
        args = event.getArgs();

    if (command.equalsIgnoreCase('mynewcommand')) {
      /** TODO: IMPLEMENT YOU COMMAND HERE */
    }
  });

  /**
   * @event initReady
   */
  $.bind('initReady', function () {
    if ($.bot.isModuleEnabled('./commands/myNewModule.js')) {
      $.registerChatCommand('./commands/myNewModule.js', 'ytp', 1);

      /** TODO: IMPLEMENT ANY PRE-LOADING HERE */
    }
  });
})();