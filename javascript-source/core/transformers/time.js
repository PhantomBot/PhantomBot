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

(function () {
    var match, temp;

    /*
     * @transformer countdown
     * @formula (countdown datetime:str) shows the time remaining until the given datetime
     * @labels twitch discord noevent time
     * @notes for information about accepted datetime formats, see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/parse
     * @example Caster: !addcom !count Time Left: (countdown December 23 2017 23:59:59 GMT+0200)
     * User: !count
     * Bot: Time Left: 20 hours, 30 minutes and 55 seconds.
     * @cached
     */
    function countdown(args) {
        if ((match = args.args.match(/^(?:=|\s)(.*)$/))) {
            temp = Date.parse(match[1]);
            if (isNaN(temp)) {
                return {result: $.lang.get('customcommands.datetime.format.invalid', match[1])};
            }
            temp -= Date.parse($.getLocalTime());
            return {
                result: $.getCountString(temp / 1000, false),
                cache: true
            };
        }
    }

    /*
     * @transformer countup
     * @formula (countup datetime:str) shows the time elapsed since the given datetime
     * @labels twitch discord noevent time
     * @notes for information about accepted datetime formats, see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/parse
     * @example Caster: !addcom !ago You missed it by (countup December 23 2017 23:59:59 GMT+0200)
     * User: !ago
     * Bot: You missed it by 20 hours, 30 minutes and 55 seconds.
     * @cached
     */
    function countup(args) {
        if ((match = args.args.match(/^(?:=|\s)(.*)$/))) {
            temp = Date.parse(match[1]);
            if (isNaN(temp)) {
                return {result: $.lang.get('customcommands.datetime.format.invalid', match[1])};
            }
            temp = Date.parse($.getLocalTime()) - temp;
            return {
                result: $.getCountString(temp / 1000, true),
                cache: true
            };
        }
    }

    /*
     * @transformer currenttime
     * @formula (currenttime timezone:str, format:str) shows the current date/time in given timezone, using the provided output format
     * @labels twitch discord noevent time
     * @notes for information about crafting a format string, see https://docs.oracle.com/en/java/javase/11/docs/api/java.base/java/text/SimpleDateFormat.html
     * @notes for information about accepted timezone strings, see https://docs.oracle.com/en/java/javase/11/docs/api/java.base/java/util/TimeZone.html
     * @cached
     */
    function currenttime(args) {
        if ((match = args.args.match(/^ (.+), (.*)$/))) {
            return {
                result: $.getCurrentLocalTimeString(match[2], match[1]),
                cache: true
            };
        }
    }

    /*
     * @transformer gettimevar
     * @formula (gettimevar name:str) retrieves the specified timevar, set using !settimevar on Twitch, for use in a (countdown) or (countup) transformer
     * @labels twitch discord noevent time
     * @example Caster: !settimevar christmas December 25 2017 00:00:00 GMT-0500
     * Caster: !addcom !count Time Left until Christmas: (countdown (gettimevar christmas))
     * User: !count
     * Bot: Time Left until Christmas: 20 hours, 30 minutes and 55 seconds.
     * @cached
     */
    function gettimevar(args) {
        if (!args.args) {
            return {
                result: $.getLocalTime(),
                cache: true
            };
        } else {
            return {
                result: $.inidb.get('timevars', args.args),
                cache: true
            };
        }
    }

    var transformers = [
        new $.transformers.transformer('countdown', ['twitch', 'discord', 'noevent', 'time'], countdown),
        new $.transformers.transformer('countup', ['twitch', 'discord', 'noevent', 'time'], countup),
        new $.transformers.transformer('currenttime', ['twitch', 'discord', 'noevent', 'time'], currenttime),
        new $.transformers.transformer('gettimevar', ['twitch', 'discord', 'noevent', 'time'], gettimevar)
    ];

    $.transformers.addTransformers(transformers);
})();
