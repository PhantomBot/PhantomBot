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
 * db.js
 *
 * Extra DB functions
 */
(function () {
    function wrapOpt(opt, converterFunc) {
        return {
            backing: opt,
            converter: converterFunc,
            isPresent: function() {
                return this.backing !== undefined && this.backing !== null && this.backing.isPresent();
            },
            get: function() {
                if (this.backing === undefined || this.backing === null || !this.backing.isPresent()) {
                    return null;
                }

                let val = this.backing.get();

                if (this.converter !== undefined && this.converter !== null) {
                    val = this.converter(val);
                }

                return val;
            }
        }
    }

    /**
     * @function getIniDbBoolean
     * @export $
     * @param {string} fileName
     * @param {string|Number} key
     * @param {boolean} [defaultValue]
     * @returns {boolean}
     */
    function getIniDbBoolean(fileName, key, defaultValue) {
        if (defaultValue === undefined || defaultValue === null) {
            return $.inidb.GetBoolean(fileName, '', key);
        }

        if (typeof defaultValue !== 'boolean') {
            defaultValue = defaultValue === true || defaultValue === 1 || $.equalsIgnoreCase(defaultValue, 'true') || $.equalsIgnoreCase(defaultValue, '1') || $.equalsIgnoreCase(defaultValue, 'yes'); //Ensure compatibility
        }

        return $.inidb.GetBoolean(fileName, '', key, defaultValue);
    }

    function optIniDbBoolean(fileName, key) {
        return wrapOpt($.inidb.OptBoolean(fileName, '', key));
    }

    /**
     * @function getSetIniDbBoolean
     * @export $
     * @param {string} fileName
     * @param {string|Number} key
     * @param {boolean} [defaultValue]
     * @returns {boolean}
     */
    function getSetIniDbBoolean(fileName, key, defaultValue) {
        let res = $.inidb.OptBoolean(fileName, '', key);
        if (res.isPresent()) {
            return res.get().booleanValue();
        }

        if (typeof defaultValue !== 'boolean') {
            defaultValue = defaultValue === true || defaultValue === 1 || $.equalsIgnoreCase(defaultValue, 'true') || $.equalsIgnoreCase(defaultValue, '1') || $.equalsIgnoreCase(defaultValue, 'yes'); //Ensure compatibility
        }

        $.inidb.SetBoolean(fileName, '', key, defaultValue);
        return defaultValue;
    }


    /**
     * @function setIniDbBoolean
     * @export $
     * @param {string} fileName
     * @param {string|Number} key
     * @param {boolean} state
     */
    function setIniDbBoolean(fileName, key, state) {
        $.inidb.SetBoolean(fileName, '', key, state);
    }

    /**
     * @function getIniDbString
     * @export $
     * @param {string}
     * @param {string}
     * @param {string}
     */
    function getIniDbString(fileName, key, defaultValue) {
        if (defaultValue === undefined) { //Null could be a valid defaultValue
            return $.jsString($.inidb.GetString(fileName, '', key));
        }

        return $.jsString($.inidb.GetString(fileName, '', key, defaultValue));
    }

    function optIniDbString(fileName, key) {
        return wrapOpt($.inidb.OptString(fileName, '', key), $.jsString);
    }

    /**
     * @function getSetIniDbString
     * @export $
     * @param {string}
     * @param {string}
     * @param {string}
     */
    function getSetIniDbString(fileName, key, defaultValue) {
        let res = $.inidb.OptString(fileName, '', key);
        if (res.isPresent()) {
            return $.jsString(res.get());
        }

        $.inidb.SetString(fileName, '', key, defaultValue);
        return defaultValue;
    }

    /**
     * @function setIniDbString
     * @export $
     * @param {string}
     * @param {string}
     * @param {string}
     */
    function setIniDbString(fileName, key, value) {
        $.inidb.SetString(fileName, '', key, value);
    }

    /**
     * @function getIniDbNumber
     * @export $
     * @param {string}
     * @param {string}
     * @param {number}
     */
    function getIniDbNumber(fileName, key, defaultValue) {
        if (defaultValue === undefined || defaultValue === null) {
            return $.inidb.GetLong(fileName, '', key);
        }
        return $.inidb.GetLong(fileName, '', key, defaultValue);
    }

    function optIniDbNumber(fileName, key) {
        return wrapOpt($.inidb.OptLong(fileName, '', key));
    }

    /**
     * @function getSetIniDbNumber
     * @export $
     * @param {string}
     * @param {string}
     * @param {number}
     */
    function getSetIniDbNumber(fileName, key, defaultValue) {
        let res = $.inidb.OptLong(fileName, '', key);
        if (res.isPresent()) {
            return res.get();
        }

        $.inidb.SetLong(fileName, '', key, defaultValue);
        return defaultValue;
    }

    /**
     * @function setIniDbNumber
     * @export $
     * @param {string}
     * @param {string}
     * @param {number}
     */
    function setIniDbNumber(fileName, key, value) {
        $.inidb.SetLong(fileName, '', key, value);
    }

    /**
     * @function getIniDbFloat
     * @export $
     * @param {string}
     * @param {string}
     * @param {number}
     */
    function getIniDbFloat(fileName, key, defaultValue) {
        if (defaultValue === undefined || defaultValue === null) {
            return $.inidb.GetFloat(fileName, '', key);
        }

        return $.inidb.GetFloat(fileName, '', key, defaultValue);
    }

    function optIniDbFloat(fileName, key) {
        return wrapOpt($.inidb.OptFloats(fileName, '', key));
    }

    /**
     * @function getSetIniDbFloat
     * @export $
     * @param {string}
     * @param {string}
     * @param {number}
     */
    function getSetIniDbFloat(fileName, key, defaultValue) {
        let res = $.inidb.OptFloat(fileName, '', key);
        if (res.isPresent()) {
            return res.get();
        }

        $.inidb.SetFloat(fileName, '', key, defaultValue);
        return defaultValue;
    }

    /**
     * @function setIniDbFloat
     * @export $
     * @param {string}
     * @param {string}
     * @param {number}
     */
    function setIniDbFloat(fileName, key, value) {
        $.inidb.SetFloat(fileName, '', key, value);
    }

    /**
     * @function getIniDbArray
     * @export $
     * @param {string} fileName
     * @param {string} key
     * @param {[*]}
     * @returns empty array if non is present
     */
    function getIniDbArray(fileName, key, defaultValue) {
        let res = $.inidb.OptString(fileName, '', key);
        if (res.isPresent()) {
            return JSON.parse(res.get());
        }
        return defaultValue;
    }

    /**
     * @function setIniDbArray
     * @export $
     * @param {string} fileName
     * @param {string} key
     * @param {[*]} value
     */
    function setIniDbArray(fileName, key, value) {
        $.inidb.SetString(fileName, '', key, JSON.stringify(value));
    }

    /**
     * Executes an SQL query.
     *
     * The query is executed using a PreparedStatement with calls to `PreparedStatement#setString(int, String)`
     *
     * For example:
     * ```js
     * $.sql('SELECT * FROM foo WHERE bar = ?', ['baz'])
     * ```
     *
     * The value `'baz'` is escaped to prevent SQL injection, then inserted in place of the `?`
     *
     * This yields the final query of:
     * ```sql
     * SELECT * FROM foo WHERE bar = 'baz'
     * ```
     *
     * You can use `?` as many times as necessary, but must provide the same number of elements in the replacements array for the replacement to work
     *
     * Replacements are performed in order from left to right
     *
     * Exceptions from failed SQL queries are NOT returned or thrown, but are logged in the core-error log
     *
     * The returned array is of the form:
     * ```js
     * arr[row][column] = $.jsString(value);
     * ```
     *
     * NOTE: Only DQL statements have a return value; all other statements return an empty array `[]`
     *
     * @param {string} query The query to execute
     * @param {string[]} replacements Replacements for `PreparedStatement#setString(int, String)`
     * @returns {string[][]} An array of data as strings representing the result set, if the query was a DQL statement;
     * an empty array otherwise. The outer array represents rows; the inner array represents columns;
     * the values of the inner array represent the value of the row-column pair at that index as a js string
     */
    function sql(query, replacements) {
        let result = $.inidb.query(query, replacements);

        let ret = [];

        if (result.size() > 0) {
            for (let r = 0; r < result.size(); r++) {
                let jrow = result.get(r);
                let row = [];

                if (jrow.size() > 0) {
                    for (let c = 0; c < jrow.size(); c++) {
                        row.push($.jsString(jrow.get(c)));
                    }
                }

                ret.push(row);
            }
        }

        return ret;
    }

    $.getIniDbBoolean = getIniDbBoolean;
    $.getIniDbString = getIniDbString;
    $.getIniDbNumber = getIniDbNumber;
    $.getIniDbFloat = getIniDbFloat;
    $.optIniDbBoolean = optIniDbBoolean;
    $.optIniDbString = optIniDbString;
    $.optIniDbNumber = optIniDbNumber;
    $.optIniDbFloat = optIniDbFloat;
    $.getSetIniDbBoolean = getSetIniDbBoolean;
    $.getSetIniDbString = getSetIniDbString;
    $.getSetIniDbNumber = getSetIniDbNumber;
    $.getSetIniDbFloat = getSetIniDbFloat;
    $.setIniDbBoolean = setIniDbBoolean;
    $.setIniDbString = setIniDbString;
    $.setIniDbNumber = setIniDbNumber;
    $.setIniDbFloat = setIniDbFloat;
    $.getIniDbArray = getIniDbArray;
    $.setIniDbArray = setIniDbArray;
    $.sql = sql;
})();
