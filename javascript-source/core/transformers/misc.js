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
    /*
     * @transformer code
     * @formula (code length:int) random code of the given length composed of a-zA-Z0-9
     * @labels twitch discord noevent misc
     * @example Caster: !addcom !code (code 5)
     * User: !code
     * Bot: A1D4f
     */
    function code(args) {
        let i, match;
        let code,
                length,
                temp = '';
        if ((match = args.args.match(/^([1-9]\d*)$/))) {
            code = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
            length = parseInt(match[1]);
            for (i = 0; i < length; i++) {
                temp += code.charAt(Math.floor(Math.random() * code.length));
            }
            return {
                result: temp,
                cache: false
            };
        }
    }

    /*
     * @transformer encodeurl
     * @formula (encodeurl url:str) url encode the given url
     * @labels twitch discord noevent misc
     * @cached
     */
    function encodeurl(args) {
        return {
            result: encodeURI(args.args),
            cache: true
        };
    }

    /*
     * @transformer encodeurlparam
     * @formula (encodeurlparam paramter:str) like encodeurl but also ecapes "&", "=", "+", "/", etc.
     * @labels twitch discord noevent misc
     * @cached
     */
    function encodeurlparam(args) {
        return {
            result: encodeURIComponent(args.args),
            cache: true
        };
    }

    /*
     * @transformer escape
     * @formula (escape str:str) escape \( \) to \\\( \\\) respectively
     * @labels twitch discord noevent misc
     * @note may double-escape existing \\\( \\\) to \\\\\( \\\\\)
     * @cached
     */
    function escape(args) {
        return {
            result: args.args,
            cache: true
        };
    }

    /*
     * @transformer keywordcount
     * @formula (keywordcount keyword:str) increase the keyword count for the given keyword and return new count
     * @labels twitch keywordevent misc
     */
    function keywordcount(args) {
        let keyword,
                keywordInfo;
        if (args.args) {
            keyword = args.args;
            keywordInfo = $.optIniDbString('keywords', keyword);
            if (keywordInfo.isPresent()) {
                keywordInfo = JSON.parse(keywordInfo.get());
                if ('count' in keywordInfo) {
                    ++keywordInfo["count"];
                } else {
                    keywordInfo["count"] = 1;
                }
                $.inidb.set('keywords', keyword, JSON.stringify(keywordInfo));
                return {result: keywordInfo["count"]};
            } else {
                return {result: $.lang.get('customcommands.keyword.404', keyword)};
            }
        }
    }

    /*
     * @transformer nl
     * @formula (nl) inserts a LF (`\n`)
     * @labels twitch discord noevent misc
     */
    function nl() {
        return {
            result: '\n'
        };
    }

    /*
     * @transformer nl2br
     * @formula (nl2br str:str) replaces all LF (`\n`) with `<br>` and removes all CR (`\r`)
     * @labels twitch discord noevent misc
     * @cached
     */
    function nl2br(args) {
        return {
            result: $.replace($.replace(args.args, '\r', ''), '\n', '<br>'),
            cache: true
        };
    }

    /*
     * @transformer nl2x
     * @formula (nl2x repl:str str:str) replaces all LF (`\n`) with the value provided in **repl** and removes all CR (`\r`)
     * @labels twitch discord noevent misc
     * @cached
     */
    function nl2x(args) {
        let pargs = $.parseArgs(args.args, ' ', 2, true);
        return {
            result: $.replace($.replace(pargs[1], '\r', ''), '\n', pargs[0]),
            cache: true
        };
    }

    /*
     * @transformer token
     * @formula (token) replaced with the secret token that was set by !tokencom or the panel
     * @labels twitch commandevent misc
     * @example Caster: !addcom !weather (customapijson http://api.apixu.com/v1/current.json?key=(token)&q=$1 {Weather for} location.name {:} current.condition.text {Temps:} current.temp_f {F} current.temp_c {C})
     * Caster: !tokencom !weather mySecretApiKey
     * User: !weather 80314
     * // customapijson generates the below response using the url: http://api.apixu.com/v1/current.json?key=mySecretApiKey&q=80314
     * Bot: Weather for Boulder, CO : Sunny Temps: 75 F 24 C
     * @cached
     */
    function token(args) {
        return {
            result: $.getIniDbString('commandtoken', args.event.getCommand(), 'NOT_SET'),
            cache: true
        };
    }

    /*
     * @transformer unescape
     * @formula (unescape str:str) unescape \\\( \\\) to \( \) respectively, allowing tags returned after processing other tags to run
     * @labels twitch discord noevent misc
     * @example Caster: !addcom !getrandom (unescape (readfilerand randomcommands.txt))
     * // randomcommands.txt: (command shoutout (sender))
     * User: !getrandom
     * Bot: You should check out User! They were last playing Just Chatting! twitch.tv/User
     * @raw
     * @cached
     */
    function unescape(args) {
        return {
            result: args.args,
            raw: true,
            cache: true
        };
    }

    /*
     * @transformer url0a2nl
     * @formula (url0a2nl str:str) replaces all URL-Encoded LF (`%0A`) with LF (`\n`)
     * @labels twitch discord noevent misc
     * @cached
     */
    function url0a2nl(args) {
        return {
            result: $.replace($.replace(args.args, '%0A', '\n'), '%0a', '\n'),
            cache: true
        };
    }

    let transformers = [
        new $.transformers.transformer('code', ['twitch', 'discord', 'noevent', 'misc'], code),
        new $.transformers.transformer('encodeurl', ['twitch', 'discord', 'noevent', 'misc'], encodeurl),
        new $.transformers.transformer('encodeurlparam', ['twitch', 'discord', 'noevent', 'misc'], encodeurlparam),
        new $.transformers.transformer('escape', ['twitch', 'discord', 'noevent', 'misc'], escape),
        new $.transformers.transformer('keywordcount', ['twitch', 'keywordevent', 'misc'], keywordcount),
        new $.transformers.transformer('nl', ['twitch', 'discord', 'noevent', 'misc'], nl),
        new $.transformers.transformer('nl2br', ['twitch', 'discord', 'noevent', 'misc'], nl2br),
        new $.transformers.transformer('nl2x', ['twitch', 'discord', 'noevent', 'misc'], nl2x),
        new $.transformers.transformer('token', ['twitch', 'commandevent', 'misc'], token),
        new $.transformers.transformer('unescape', ['twitch', 'discord', 'noevent', 'misc'], unescape),
        new $.transformers.transformer('url0a2nl', ['twitch', 'discord', 'noevent', 'misc'], url0a2nl)
    ];

    $.transformers.addTransformers(transformers);
})();
