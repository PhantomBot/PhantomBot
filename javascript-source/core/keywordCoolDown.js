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

/**
 * keywordCoolDown.js
 *
 * Manage cooldowns for keywords
 *
 * To use the cooldown in other scipts use the $.coolDownKeywords API
 */

(function() {
    var modCooldown = $.getIniDbBoolean('cooldownSettings', 'modCooldown', false),
        cooldown = [],
        _lock = new Packages.java.util.concurrent.locks.ReentrantLock();

    /**
     * @function permCheck
     * @param username
     * @return boolean
     */
    function permCheck(username) {
        return (!modCooldown && $.checkUserPermission(username, undefined, $.PERMISSION.Mod)) || $.checkUserPermission(username, undefined, $.PERMISSION.Admin);
    }

    /**
     * @function getCooldown
     * @param keyword
     * @return number
     */
    function getCooldown(keyword) {
        if ($.inidb.exists('coolkey', keyword)) {
            return parseInt($.inidb.get('coolkey', keyword));
        } else {
            return 0;
        }
    }

    /**
     * @function set
     * @export $.coolDownKeywords
     * @param keyword
     * @param time
     * @param username
     */
    function set(keyword, hasCooldown, time, username) {
        if (time === null || time === 0 || time === 1 || isNaN(time)) {
            return;
        }

        time = ((time * 1000) + $.systemTime());

        _lock.lock();
        try {
            cooldown.push({
                keyword: keyword,
                time: time
            });
        } finally {
            _lock.unlock();
        }

        $.consoleDebug('Pushed keyword ' + keyword + ' to cooldown.');
    }

    /**
     * @function get
     * @export $.coolDownKeywords
     * @param keyword
     * @param username
     * @return number
     */
    function get(keyword, username) {
        var hasCooldown = $.inidb.exists('coolkey', keyword),
            i;

        if (!hasCooldown)
            return 0;

        _lock.lock();
        try {
            for (i in cooldown) {
                if (cooldown[i].keyword.equalsIgnoreCase(keyword)) {
                    if ((cooldown[i].time - $.systemTime()) > 0) {
                        if (permCheck(username)) return 0;
                        return parseInt(cooldown[i].time - $.systemTime());
                    }
                }
            }
        } finally {
            _lock.unlock();
        }

        set(keyword, hasCooldown, getCooldown(keyword));
        return 0;
    }

    /**
     * @function clear
     * @export $.coolDownKeywords
     * @param keyword
     */
    function clear(keyword) {
        var i;

        _lock.lock();
        try {
            for (i in cooldown) {
                if (cooldown[i].keyword.equalsIgnoreCase(keyword)) {
                    cooldown.splice(i, 1);
                    return;
                }
            }
        } finally {
            _lock.unlock();
        }
    }

    /**
     * @function clearAll
     */
    function clearAll() {
        _lock.lock();
        try {
            cooldown = [];
        } finally {
            _lock.unlock();
        }
    }

    /** EXPORT TO $. API*/
    $.coolDownKeywords = {
        set: set,
        get: get,
        clear: clear,
        clearAll: clearAll
    };
})();
