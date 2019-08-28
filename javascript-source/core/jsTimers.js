/*
 * Copyright (C) 2016-2018 phantombot.tv
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

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
     * @param {String} name

     * @returns {Number}
    */
    setTimeout = function(fn, delay, name) {
        var id = counter++,
            timer;

        if (name !== undefined) {
            timer = new java.util.Timer(name);
        } else {
            timer = new java.util.Timer();
        }

        registry[id] = new JavaAdapter(java.util.TimerTask, {
            run: fn
        });
        timer.schedule(registry[id], delay);

        return id;
    };

    /**
     * @function setInterval
     * @param {Function} fn
     * @param {Number} interval
     * @param {String} name
     *
     * @returns {Number}
     */
    setInterval = function(fn, interval, name) {
        var id = counter++,
            timer;

        if (name !== undefined) {
            timer = new java.util.Timer(name);
        } else {
            timer = new java.util.Timer();
        }

        registry[id] = new JavaAdapter(java.util.TimerTask, {
            run: fn
        });
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
            try {
                registry[id].cancel();
            } catch (ex) {
                // Cannot cancel since timer is already over.
                // Ignore this.
            }
        }

        delete registry[id];
    };

    /**
     * @type {clearTimeout}
     */
    clearInterval = clearTimeout;
})();