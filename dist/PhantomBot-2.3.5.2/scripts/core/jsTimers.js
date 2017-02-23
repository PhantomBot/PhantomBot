/**
 * jsTimers.js
 *
 * A general javascript module to replace Rhino's crappy timer functions
 */

var setTimeout,
    clearTimeout,
    setInterval,
    clearInterval;

(function() {
    var counter = 1,
        registry = {};

    /**
     * @function setTimeout
     * @param {Function} fn
     * @param {Number} delay
     * @returns {Number}
    */
    setTimeout = function(fn, delay) {
        var timer = new java.util.Timer(),
            id = counter++;

        registry[id] = new JavaAdapter(java.util.TimerTask, { run: fn });
        timer.schedule(registry[id], delay);

        return id;
    };

    /**
     * @function setInterval
     * @param {Function} fn
     * @param {Number} interval
     * @returns {Number}
    */
    setInterval = function(fn, interval) {
        var timer = new java.util.Timer(),
            id = counter++;

        registry[id] = new JavaAdapter(java.util.TimerTask, { run: fn });
        timer.schedule(registry[id], interval, interval);

        return id;
    };

    /**
     * @function clearTimeout
     * @param {Number} id
     */
    clearTimeout = function(id) {
        if (id == undefined) {
            return;
        }

        if (registry[id] != undefined) {
            registry[id].cancel();
        }

        delete registry[id];
    };

    /**
     * @type {clearTimeout}
     */
    clearInterval = clearTimeout;
})();
