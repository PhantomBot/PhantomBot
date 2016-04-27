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
    var timerObject = new java.util.Timer(),
        counter = 1,
        registry = {},
        timerTable = {};

    /**
     * @function setTimeout
     * @param {Function} fn
     * @param {Number} delay
     * @returns {Number}
     * 
     * NOTE: If using unique_id it will check to see if a timer already exists and destroy
     * that timer before creating the new one.
     */
    setTimeout = function(fn, delay, unique_id) {
        var id;

        if (unique_id !== undefined) {
            if ((id = lookupTimeoutID(unique_id)) !== -1) {
                $.consoleDebug('timers.js::auto-clear previous timer for: ' + unique_id);
                clearInterval(id);
            }
        }

        id = counter++;
        registry[id] = new JavaAdapter(java.util.TimerTask, { run: fn });
        timerObject.schedule(registry[id], delay);

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
     * 
     * NOTE: If using unique_id it will check to see if a timer already exists and destroy
     * that timer before creating the new one.
     */
    setInterval = function(fn, delay, unique_id) {
        var id;

        if (unique_id !== undefined) {
            $.consoleDebug('timers.js::setInterval::unique_id(' + unique_id + ')');
            if ((id = lookupTimeoutID(unique_id)) !== -1) {
                $.consoleDebug("timers.js::auto-clear previous timer for: " + unique_id);
                clearInterval(id);
            }
        }

        id = counter++;
        registry[id] = new JavaAdapter(java.util.TimerTask, { run: fn });
        timerObject.schedule(registry[id], delay, delay);

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
        // Java Timer may have already expired this timer and it would be undefined.
        if (registry[id] !== undefined) {
            registry[id].cancel();
            timerObject.purge();
        }
        delete registry[id];
        for (unique_id in timerTable) {
            if (timerTable[unique_id].id == id) {
                delete timerTable[unique_id];
            }
        }
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
