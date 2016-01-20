/**
 * jsTimers.js
 *
 * A general javascript module to replace Rhino's crappy timer functions
 */

var setTimeout,
    clearTimeout,
    setInterval,
    clearInterval;

(function () {
  var executor = new java.util.concurrent.Executors.newScheduledThreadPool(1),
      counter = 1,
      registry = [];

  /**
   * @function setTimeout
   * @param {Function} fn
   * @param {Number} delay
   * @returns {Number}
   */
  setTimeout = function (fn, delay) {
    var id = ++counter,
        runnable = new JavaAdapter(java.lang.Runnable, {run: fn});
    registry[id] = executor.schedule(runnable, delay, java.util.concurrent.TimeUnit.MILLISECONDS);
    return id;
  };

  /**
   * @function setInterval
   * @param {Function} fn
   * @param {Number} delay
   * @returns {Number}
   */
  setInterval = function (fn, delay) {
    var id = ++counter,
        runnable = new JavaAdapter(java.lang.Runnable, {run: fn});
    registry[id] = executor.scheduleAtFixedRate(runnable, delay, delay, java.util.concurrent.TimeUnit.MILLISECONDS);
    return id;
  };

  /**
   * @function clearTimeout
   * @param {Number} id
   */
  clearTimeout = function (id) {
    registry[id].cancel(false);
    executor.purge();
    registry[id] = null;
    delete registry[id];
  };

  /**
   * @type {clearTimeout}
   */
  clearInterval = clearTimeout;
})();