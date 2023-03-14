/*
 * Copyright (C) 2016-2023 phantombot.github.io/PhantomBot
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

/* global Packages */

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
    /**
     * @function setTimeout
     * @param {Function} fn
     * @param {Number} delay
     * @param {String} name
     *
     * @returns {Number}
     */
    setTimeout = function (fn, delay, name) {
        return Packages.com.gmt2001.JSTimers.instance().setTimeout(fn, delay, name);
    };

    /**
     * @function setInterval
     * @param {Function} fn
     * @param {Number} interval
     * @param {String} name
     *
     * @returns {Number}
     */
    setInterval = function (fn, interval, name) {
        return Packages.com.gmt2001.JSTimers.instance().setInterval(fn, interval, name);
    };

    /**
     * @function clearTimeout
     * @param {Number} id
     */
    clearTimeout = function (id) {
        if (id === undefined || id === null) {
            return;
        }

        Packages.com.gmt2001.JSTimers.instance().clearTimer(id);
    };

    /**
     * @type {clearTimeout}
     */
    clearInterval = clearTimeout;
})();
