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

(function () {
    var respond = $.getSetIniDbBoolean('settings', 'response_@chat', true),
            action = $.getSetIniDbBoolean('settings', 'response_action', false),
            secureRandom = new Packages.java.security.SecureRandom(),
            reg = new RegExp(/^@\w+,\s?$/),
            timeout = 0,
            _lock = new Packages.java.util.concurrent.locks.ReentrantLock();

    /*
     * @function reloadMisc
     */
    function reloadMisc() {
        respond = $.getIniDbBoolean('settings', 'response_@chat');
        action = $.getIniDbBoolean('settings', 'response_action');
    }

    /**
     ** This function sometimes does not work. So only use it for stuff that people dont use much
     * @function hasKey
     * @export $.list
     * @param {Array} list
     * @param {*} value
     * @param {Number} [subIndex]
     * @returns {boolean}
     */
    function hasKey(list, value, subIndex) {
        var i;

        if (subIndex > -1) {
            for (i in list) {
                if ($.equalsIgnoreCase(list[i][subIndex], value)) {
                    return true;
                }
            }
        } else {
            for (i in list) {
                if ($.equalsIgnoreCase(list[i], value)) {
                    return true;
                }
            }
        }
        return false;
    }

    /*
     * @function getMessageWrites
     */
    function getMessageWrites() {
        return parseInt(Packages.tv.phantombot.PhantomBot.instance().getSession().getWrites());
    }

    /**
     * @function isKnown
     * @export $.user
     * @param {string} username
     * @returns {boolean}
     */
    function isKnown(username) {
        return $.inidb.exists('visited', username.toLowerCase());
    }

    /**
     * @function sanitize
     * @export $.user
     * @param {string} username
     * @returns {string}
     */
    function sanitize(username) {
        return (username === null ? username : String(username).replace(/\W/g, '').toLowerCase());
    }

    /**
     * @function isFollower
     * @export $.user
     * @param {string} username
     * @returns {boolean}
     */
    function isFollower(username) {
        return $.followers.follows(username);
    }

    /**
     * @function say
     * @export $
     * @param {string} message
     */
    function say(message) {
        if (message === undefined || message === null) {
            return;
        }
        message = $.jsString(message);
        if (message.trim().length === 0 || reg.test(message)) {
            return;
        }

        if (respond && !action) {
            Packages.tv.phantombot.PhantomBot.instance().getSession().say(message);
        } else {
            if (respond && action) {
                // If the message is a Twitch command, remove the /me.
                if (message.startsWith('.') || message.startsWith('/')) {
                    Packages.tv.phantombot.PhantomBot.instance().getSession().say(message);
                } else {
                    Packages.tv.phantombot.PhantomBot.instance().getSession().say('/me ' + message);
                }
            }
            if (!respond) {
                $.consoleLn('[MUTED] ' + message);
                $.log.file('chat', '[MUTED] ' + $.botName.toLowerCase() + ': ' + message);
                return;
            }
        }
        $.log.file('chat', '' + $.botName.toLowerCase() + ': ' + message);
    }

    /**
     * @function sayWithTimeout
     * @export $
     * @param {string} message
     * @param {boolean} run
     */
    function sayWithTimeout(message, run) {
        _lock.lock();
        try {
            if (((timeout + 10000) > $.systemTime()) || !run) {
                return;
            }

            timeout = $.systemTime();
        } finally {
            _lock.unlock();
        }

        say(message);
    }

    /**
     * @function rand
     * @export $
     * @param {Number} max
     * @returns {Number}
     */
    function rand(max) {
        if (max === 0) {
            return max;
        }
        return (Math.abs(secureRandom.nextInt()) % max);
    }

    /**
     * @function randRange
     * @export $
     * @param {Number} min
     * @param {Number} max
     * @returns {Number}
     */
    function randRange(min, max) {
        if (min === max) {
            return min;
        }
        return parseInt(rand(max - min + 1) + min);
    }

    /**
     * @function randElement
     * @export $
     * @param {Array} array
     * @returns {*}
     */
    function randElement(array) {
        if (array === null) {
            return null;
        }
        return array[randRange(0, array.length - 1)];
    }

    /**
     * @function arrayShuffle
     * @param {Array} array
     * @returns {Array}
     */
    function arrayShuffle(array) {
        for (var i = array.length - 1; i > 0; i--) {
            var j = Math.floor(Math.random() * (i + 1));
            var temp = array[i];
            array[i] = array[j];
            array[j] = temp;
        }
        return array;
    }

    /**
     * @function randInterval
     * @export $
     * @param {Number} min
     * @param {Number} max
     * @returns {Number}
     */
    function randInterval(min, max) {
        return Math.floor(Math.random() * (max - min + 1) + min);
    }

    /**
     * @function trueRandRange
     * @export $
     * @param {Number} min
     * @param {Number} max
     * @returns {Number}
     */
    function trueRandRange(min, max) {
        if (min === max) {
            return min;
        }

        try {
            var HttpRequest = Packages.com.gmt2001.HttpRequest,
                    HashMap = Packages.java.util.HashMap,
                    JSONObject = Packages.org.json.JSONObject,
                    json = new JSONObject('{}'),
                    parameters = new JSONObject('{}'),
                    header = new HashMap(1),
                    id = rand(65535),
                    request;

            header.put('Content-Type', 'application/json-rpc');

            parameters
                    .put('apiKey', '0d710311-5840-45dd-be83-82904de87c5d')
                    .put('n', 1)
                    .put('min', min)
                    .put('max', max)
                    .put('replacement', true)
                    .put('base', 10);

            json
                    .put('jsonrpc', '2.0')
                    .put('method', 'generateIntegers')
                    .put('params', parameters)
                    .put('id', id);

            request = HttpRequest.getData(
                    HttpRequest.RequestType.GET,
                    'https://api.random.org/json-rpc/1/invoke',
                    json.toString(),
                    header
                    );

            if (request.success) {
                var data = new JSONObject(request.content)
                        .getJSONObject('result')
                        .getJSONObject('random')
                        .getJSONArray('data');

                if (data.length() > 0) {
                    return data.getInt(0);
                }
            } else {
                if (request.httpCode === 0) {
                    $.log.error('Failed to use random.org: ' + request.exception);
                } else {
                    $.log.error('Failed to use random.org: HTTP' + request.httpCode + ' ' + request.content);
                }
            }
        } catch (error) {
            $.log.error('Failed to use random.org: ' + error);
        }

        return randRange(min, max);
    }

    /**
     * @function trueRandElement
     * @exprtto $
     * @param {Array} array
     * @returns {*}
     */
    function trueRandElement(array) {
        if (array === null) {
            return null;
        }
        return array[trueRand(array.length - 1)];
    }

    /**
     * @function trueRand
     * @export $
     * @param {Number} max
     * @returns {Number}
     */
    function trueRand(max) {
        return trueRandRange(0, max);
    }

    /**
     * @function outOfRange
     * @export $
     * @param {Number} number
     * @param {Number} min
     * @param {Number} max
     * @returns {boolean}
     */
    function outOfRange(number, min, max) {
        return (number < min || number > max);
    }

    /**
     * @function getOrdinal
     * @export $
     * @param {Number} number
     * @returns {string}
     */
    function getOrdinal(number) {
        var s = ["th", "st", "nd", "rd"],
                v = number % 100;
        return (number + (s[(v - 20) % 10] || s[v] || s[0]));
    }

    /**
     * @function getPercentage
     * @export $
     * @param {Number} current
     * @param {Number} total
     * @returns {Number}
     */
    function getPercentage(current, total) {
        return Math.ceil((current / total) * 100);
    }

    /**
     * @function paginateArray
     * @export $
     * @param {Array}   Input array of data to paginate
     * @param {String}  Key in the $.lang system
     * @param {String}  Seperator to use between items
     * @param {boolean} Use $.whisperPrefix(sender) ?
     * @param {String}  Value of sender for $.whisperPrefix
     * @param {Number}  Page to display, 0 for ALL
     * @return {Number} Total number of pages.
     *
     */
    function paginateArray(array, langKey, sep, whisper, sender, display_page) {
        var idx,
                output = '',
                maxlen,
                hasNoLang = langKey.startsWith('NULL'),
                pageCount = 0;

        if (display_page === undefined) {
            display_page = 0;
        }

        maxlen = 440 - (hasNoLang ? langKey.length : $.lang.get(langKey).length);
        langKey = langKey.replace('NULL', '');
        for (idx in array) {
            output += array[idx];
            if (output.length >= maxlen) {
                pageCount++;
                if (display_page === 0 || display_page === pageCount) {
                    if (output.length > 0) {
                        if (whisper) {
                            $.say($.whisperPrefix(sender) + (hasNoLang ? (langKey + output) : $.lang.get(langKey, output)));
                        } else {
                            $.say((hasNoLang ? (langKey + output) : $.lang.get(langKey, output)));
                        }
                    }
                }
                output = '';
            } else {
                if (idx < array.length - 1) {
                    output += sep;
                }
            }
        }
        pageCount++;
        if (output.length > 0) {
            if (display_page === 0 || display_page === pageCount) {
                if (whisper) {
                    $.say($.whisperPrefix(sender) + (hasNoLang ? (langKey + output) : $.lang.get(langKey, output)));
                } else {
                    $.say((hasNoLang ? (langKey + output) : $.lang.get(langKey, output)));
                }
            }
        }
        return pageCount;
    }

    /**
     * @function userPrefix
     * @export $
     * @param {username}
     */
    function userPrefix(username, comma) {
        if (!comma) {
            return '@' + $.viewer.getByLogin(username).name() + ' ';
        }
        return '@' + $.viewer.getByLogin(username).name() + ', ';
    }

    function usernameResolveIgnoreEx(user) {
        try {
            return $.viewer.getByLogin(user).name();
        } catch (ex) {
            return user;
        }
    }

    /**
     * Returns a keys value from an arguments array which has a syntax of [key1=value1, key2=value2, key3=value3]
     * @param {String[]} array
     * @param {String} key
     * @param {*} defaultValue
     * @returns the value; the defaultValue if no array element with the key is not present; null if neither key is present nor a default value is provided
     */
    function getArgFromArray(array, key, defaultValue) {
        for (let i = 0; i < array.length; i++) {
            let pair = $.jsString(array[i]).split('=');
            if ($.equalsIgnoreCase(pair[0], key)) {
                return pair[1];
            }
        }

        return defaultValue === undefined ? null : defaultValue;
    }

    /**
     * Converts any possible boolean represented as a string ('1', '0', 'true', 'false') to a proper boolean
     * @param {String} string
     * @return the boolean; null if it's not a valid boolean represented as a string
     */
    function stringToBoolean(string) {
        if (string === undefined || string === null) {
            return null;
        }
        if ($.equalsIgnoreCase(string, 'true') || string === '1') {
            return true;
        }
        if ($.equalsIgnoreCase(string, 'false') || string === '0') {
            return false;
        }
        return null;
    }

    /** Export functions to API */
    $.user = {
        isKnown: isKnown,
        isFollower: isFollower,
        sanitize: sanitize
    };

    $.arrayShuffle = arrayShuffle;
    $.getOrdinal = getOrdinal;
    $.getPercentage = getPercentage;
    $.outOfRange = outOfRange;
    $.rand = rand;
    $.randElement = randElement;
    $.randInterval = randInterval;
    $.randRange = randRange;
    $.say = say;
    $.trueRand = trueRand;
    $.trueRandElement = trueRandElement;
    $.trueRandRange = trueRandRange;
    $.paginateArray = paginateArray;
    $.userPrefix = userPrefix;
    $.reloadMisc = reloadMisc;
    $.hasKey = hasKey;
    $.getMessageWrites = getMessageWrites;
    $.sayWithTimeout = sayWithTimeout;
    $.usernameResolveIgnoreEx = usernameResolveIgnoreEx;
    $.getArgFromArray = getArgFromArray;
    $.stringToBoolean = stringToBoolean;
})();
