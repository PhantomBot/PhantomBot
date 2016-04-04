/**
 * jsTimers.js
 *
 * A general javascript module to replace Rhino's crappy timer functions
 */

var setTimeout,
    clearTimeout,
    setInterval,
    clearInterval,
    lookupTimeoutID,
    lookupTimeoutDelay;

(function() {
    var executor = new java.util.concurrent.Executors.newScheduledThreadPool(1),
        counter = 1,
        registry = [],
        timerTable = [];

    /**
     * @function setTimeout
     * @param {Function} fn
     * @param {Number} delay
     * @returns {Number}
     */
    setTimeout = function(fn, delay, unique_id) {
        var id = ++counter,
            runnable = new JavaAdapter(java.lang.Runnable, {
                run: fn
            });
        registry[id] = executor.schedule(runnable, delay, java.util.concurrent.TimeUnit.MILLISECONDS);

        if (unique_id !== undefined) {
            timerTable[unique_id] = {
                id: id,
                delay: delay
            };
        }
 
        return id;
    };

    /**
     * @function setInterval
     * @param {Function} fn
     * @param {Number} delay
     * @returns {Number}
     */
    setInterval = function(fn, delay, unique_id) {
        var id = ++counter,
            runnable = new JavaAdapter(java.lang.Runnable, {
                run: fn
            });
        registry[id] = executor.scheduleAtFixedRate(runnable, delay, delay, java.util.concurrent.TimeUnit.MILLISECONDS);

        if (unique_id !== undefined) {
            timerTable[unique_id] = {
                id: id,
                delay: delay
            };
        }

        return id;
    };

    /**
     * @function clearTimeout
     * @param {Number} id
     */
    clearTimeout = function(id) {
        registry[id].cancel(false);
        executor.purge();
        registry[id] = null;
        delete registry[id];
    };

    /**
     * @function lookupTimeoutID
     * @param {String} unique_id
     * @returns {Number} id (-1 if not found)
     */
    lookupTimeoutID = function(unique_id) {
        if (timerTable[unique_id] !== undefined) {
            return timerTable[unique_id].id;
        } else {
            return -1;
        }
    }

    /**
     * @function lookupTimeoutDelay
     * @param {String} unique_id
     * @returns {Number} delay (-1 if not found)
     */
    lookupTimeoutDelay = function(unique_id) {
        if (timerTable[unique_id] !== undefined) {
            return timerTable[unique_id].delay;
        } else {
            return -1;
        }
    }

    /**
     * @type {clearTimeout}
     */
    clearInterval = clearTimeout;
})();
