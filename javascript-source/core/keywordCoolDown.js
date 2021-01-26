/*
 * Copyright (C) 2016-2021 phantombot.github.io/PhantomBot
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
        cooldown = [];

    /**
     * @function permCheck
     * @param username
     * @return boolean
     */
    function permCheck(username) {
        return (!modCooldown && $.isMod(username)) || $.isAdmin(username);
    };

    /**
     * @function getCooldown
     * @param keyword
     * @return number
     */
    function getCooldown(keyword) {
        if ($.inidb.exists('coolkey', keyword.toLowerCase())) {
            return parseInt($.inidb.get('coolkey', keyword.toLowerCase()));
        } else if ($.inidb.exists('coolkey', keyword)) { // ignore case
            return parseInt($.inidb.get('coolkey', keyword));
        } else {
            return 0;
        }
    };

    /**
     * @function set
     * @export $.coolDownKeywords
     * @param keyword
     * @param time
     * @param username
     */
    function set(keyword, hasCooldown, time, username) {
        if (time == null || time == 0 || time == 1 || isNaN(time)) {
            return;
        }

        time = ((time * 1000) + $.systemTime());
        keyword = keyword.toLowerCase();

        cooldown.push({
            keyword: keyword,
            time: time
        });
        $.consoleDebug('Pushed keyword ' + keyword + ' to cooldown.');
    };

    /**
     * @function get
     * @export $.coolDownKeywords
     * @param keyword
     * @param username
     * @return number
     */
    function get(keyword, username) {
        var hasCooldown = $.inidb.exists('coolkey', keyword.toLowerCase()) || $.inidb.exists('coolkey', keyword), // ignore case.
            i;

        if (!hasCooldown)
            return 0;

        for (i in cooldown) {
            if (cooldown[i].keyword.equalsIgnoreCase(keyword)) {
                if ((cooldown[i].time - $.systemTime()) > 0) {
                    if (permCheck(username)) return 0;
                    return parseInt(cooldown[i].time - $.systemTime());
                }
            }
        }

        set(keyword, hasCooldown, getCooldown(keyword));
        return 0;
    };

    /**
     * @function clear
     * @export $.coolDownKeywords
     * @param keyword
     */
    function clear(keyword) {
        var i;
        for (i in cooldown) {
            if (cooldown[i].keyword.equalsIgnoreCase(keyword)) {
                cooldown.splice(i, 1);
                return;
            }
        }
    };

    /**
     * @function clearAll
     */
    function clearAll() {
        var i;
        for (i in cooldown) {
            cooldown.splice(i, 1);
        }
    };

    /** EXPORT TO $. API*/
    $.coolDownKeywords = {
        set: set,
        get: get,
        clear: clear,
    };
})();
