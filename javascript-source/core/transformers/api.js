/*
 * Copyright (C) 2016-2026 phantombot.github.io/PhantomBot
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
    // A reply arrow, optionally led by status codes, status classes, or ! for any other failure
    let reArrow = /\s((?:\d{3}|[1-5]xx|0)(?:,(?:\d{3}|[1-5]xx|0))*|!)?->(?=\s|$)/gi,
            reRequest = /^(?:(GET|POST|PUT|PATCH|DELETE)\s+)?(https?:\/\/\S+)\s*([\s\S]*)$/i,
            reHeader = /^\[([\w-]+):\s*([^\]]*)\]\s*/,
            // $1-$9, but not the start of a longer number such as $10, with its > and default if any
            reArg = /\$[1-9](?!\d)>?(?:\|[\w.-]+)?/g,
            // An optional part of the url: square brackets around at least one of $1-$9
            reSection = /\[([^\[\]]*\$[1-9](?!\d)[^\[\]]*)\]/g,
            // $1-$9 with an optional > for all argument text from that argument on, and an optional |default
            reFill = /\$secret\.(\w+)|\$([1-9])(?!\d)(>?)(?:\|([\w.-]+))?/g,
            reReply = /\{([\w.-]+)\}|\$status|\$([1-9])(?!\d)(>?)(?:\|([\w.-]+))?/g,
            reField = /\{[\w.-]+\}/;

    /*
     * @function parseTag
     *
     * @param {string} str the arguments of the tag
     * @returns {object} the parts of the request; null if str is not a request
     */
    function parseTag(str) {
        let parts = [],
                conditions = [],
                last = 0,
                match;

        reArrow.lastIndex = 0;
        while ((match = reArrow.exec(str)) !== null) {
            parts.push(str.substring(last, match.index));
            conditions.push(match[1] ? match[1].toLowerCase() : 'ok');
            last = reArrow.lastIndex;
        }
        parts.push(str.substring(last));

        match = parts[0].trim().match(reRequest);
        if (match === null) {
            return null;
        }

        let request = {
            method: match[1] ? match[1].toUpperCase() : 'GET',
            url: match[2],
            headers: [],
            body: '',
            replies: []
        },
                rest = match[3];

        while ((match = rest.match(reHeader)) !== null) {
            request.headers.push({name: match[1], value: match[2].trim()});
            rest = rest.substring(match[0].length);
        }
        request.body = rest.trim();

        for (let i = 0; i < conditions.length; i++) {
            request.replies.push({conditions: conditions[i].split(','), text: parts[i + 1].trim()});
        }

        return request;
    }

    /*
     * @function fill
     *
     * @param {string} str a part of the request
     * @param {array} cmdArgs the arguments of the command; null if there is no command
     * @param {function} encode encodes a value for the part of the request it is placed in
     * @returns {string} str with $1-$9 and $secret.name replaced
     */
    function fill(str, cmdArgs, encode) {
        return str.replace(reFill, function (match, secret, n, rest, def) {
            if (secret) {
                return encode(getSecret(secret));
            }

            if (cmdArgs === null) {
                return def ? encode(def) : match;
            }

            // Only an argument with a default or from an optional part of the url can be missing here
            let value = getArg(cmdArgs, parseInt(n), rest === '>') || def;
            return value ? encode(value) : '';
        });
    }

    /*
     * @function getSecret
     *
     * @param {string} name the name of a saved API secret
     * @returns {string} the value of the secret
     * @throws if there is no saved secret with that name
     */
    function getSecret(name) {
        let value = $.optIniDbString('apiSecrets', name.toLowerCase());
        if (!value.isPresent()) {
            throw 'no API secret named ' + name;
        }
        return $.jsString(value.get());
    }

    /*
     * @function getTie
     *
     * @param {object} event the event that ran the tag
     * @returns {object} {secret, header} for the API secret tied to the command with !secretcom; null if there is none
     */
    function getTie(event) {
        if (event === undefined || event === null || event.getCommand === undefined) {
            return null;
        }

        // Only Discord command events have a sender id
        let tie = $.optIniDbString(event.getSenderId !== undefined ? 'discordApiCommandSecrets' : 'apiCommandSecrets', $.jsString(event.getCommand()).toLowerCase());

        try {
            return tie.isPresent() ? JSON.parse(tie.get()) : null;
        } catch (ex) {
            return null;
        }
    }

    /*
     * @function getArg
     *
     * @param {array} cmdArgs the arguments of the command, with the argument text as cmdArgs.text
     * @param {number} n the number of the argument, 1-9
     * @param {boolean} rest true for all argument text from the n-th argument on, as (n>) gives it
     * @returns {string} the argument; undefined if it was not given
     */
    function getArg(cmdArgs, n, rest) {
        if (!rest) {
            return cmdArgs[n - 1];
        }

        let parts = $.parseArgs(cmdArgs.text, ' ', n, true);
        return parts !== null ? parts[n - 1] : undefined;
    }

    /*
     * @function fillSections
     *
     * @param {string} url the url of the request
     * @param {array} cmdArgs the arguments of the command; null if there is no command
     * @returns {string} url with each optional part kept if every argument in it was given, and replaced with its
     * fallback, or removed, if not
     */
    function fillSections(url, cmdArgs) {
        return url.replace(reSection, function (match, section) {
            // Inside the brackets, | is not a default: the text after the first one is sent when an argument is missing
            let split = section.indexOf('|'),
                    given = split < 0 ? section : section.substring(0, split),
                    used = given.match(reArg) || [];

            for (let i = 0; i < used.length; i++) {
                if (cmdArgs === null || !cmdArgs[parseInt(used[i].charAt(1)) - 1]) {
                    return split < 0 ? '' : section.substring(split + 1);
                }
            }

            return given;
        });
    }

    /*
     * @function encodeJson
     *
     * @param {string} str a value placed in a JSON body
     * @returns {string} str escaped for use inside a JSON string
     */
    function encodeJson(str) {
        return JSON.stringify(str).slice(1, -1);
    }

    /*
     * @function encodeHeader
     *
     * @param {string} str a value placed in a header
     * @returns {string} str without line breaks
     */
    function encodeHeader(str) {
        return str.replace(/[\r\n]/g, '');
    }

    /*
     * @function send
     *
     * @param {object} request the parts of the request from parseTag
     * @param {array} cmdArgs the arguments of the command; null if there is no command
     * @param {boolean} acceptJson true if a reply reads a field from the response
     * @param {object} tie the API secret tied to the command, from getTie; null if there is none
     * @returns {object} the status code and body of the response; status 0 if there was no response
     */
    function send(request, cmdArgs, acceptJson, tie) {
        // Headers typed in the tag come last, so they replace these defaults
        let headers = {},
                isJson = request.body.startsWith('{') || request.body.startsWith('['),
                body = null,
                response;

        try {
            if (request.body.length > 0) {
                headers['Content-Type'] = isJson ? 'application/json' : 'application/x-www-form-urlencoded';
                body = fill(request.body, cmdArgs, isJson ? encodeJson : encodeURIComponent);
            }
            if (acceptJson) {
                headers['Accept'] = 'application/json';
            }
            if (tie !== null) {
                headers[tie.header] = (tie.header.toLowerCase() === 'authorization' ? 'Bearer ' : '') + encodeHeader(getSecret(tie.secret));
            }
            for (let i = 0; i < request.headers.length; i++) {
                headers[request.headers[i].name] = fill(request.headers[i].value, cmdArgs, encodeHeader);
            }

            response = $.api.request(request.method, fill(request.url, cmdArgs, encodeURIComponent), headers, body);
        } catch (ex) {
            $.log.error('(api) ' + request.method + ' ' + request.url + ' could not be sent: ' + ex);
            return {status: 0, body: ''};
        }

        if (response.exception !== null) {
            $.log.error('(api) ' + request.method + ' ' + request.url + ' got no response: ' + response.exception);
            return {status: 0, body: ''};
        }

        return {status: response.status, body: response.body};
    }

    /*
     * @function findReply
     *
     * @param {array} replies the replies from parseTag
     * @param {array} conditions the conditions to look for, most specific first
     * @returns {object} the first reply with the most specific condition; null if there is none
     */
    function findReply(replies, conditions) {
        for (let i = 0; i < conditions.length; i++) {
            for (let j = 0; j < replies.length; j++) {
                if (replies[j].conditions.includes(conditions[i])) {
                    return replies[j];
                }
            }
        }

        return null;
    }

    /*
     * @function getField
     *
     * @param {object} json the parsed response
     * @param {string} path the keys leading to the field, separated by periods
     * @returns {string} the value of the field; empty if it is missing or null
     */
    function getField(json, path) {
        let keys = path.split('.'),
                value = json;

        for (let i = 0; i < keys.length; i++) {
            if (value === null || typeof value !== 'object' || !Object.prototype.hasOwnProperty.call(value, keys[i])) {
                return '';
            }
            value = value[keys[i]];
        }

        if (value === null) {
            return '';
        }

        return typeof value === 'object' ? JSON.stringify(value) : String(value);
    }

    /*
     * @transformer api
     * @formula (api url:str) send a GET request and output the response text
     * @formula (api method:str url:str) send a request with the method GET, POST, PUT, PATCH, or DELETE and output the response text
     * @formula (api method:str url:str body:str) send a request with a body and output the response text
     * @formula (api method:str url:str [header:str: value:str] body:str) send a request with one or more headers; the body is optional
     * @formula (api method:str url:str body:str -> reply:str) send a request and output the reply; the method and body are optional
     * @labels twitch discord noevent commandevent api
     * @notes the url must start with `http://` or `https://`; headers must directly follow the url; the body is sent exactly as typed
     * @notes a body starting with `{` or `[` is sent as `application/json`; any other body is sent as `application/x-www-form-urlencoded`
     * @notes in a reply, `{field}` is replaced with that field of the JSON response, such as `{location.name}` or `{items.0.name}`; a missing field is left blank. `$status` is replaced with the HTTP status code, or `0` if there was no response
     * @notes ` -> ` starts the reply for a success. A reply can also be given for a status code (` 404-> `), several (` 401,403-> `), a class (` 5xx-> `), no response (` 0-> `), or any other failure (` !-> `). The most specific one is used. An arrow with nothing after it outputs nothing
     * @notes without a matching reply, a success outputs the response text and a failure outputs an error message
     * @notes if a reply reads a field and a successful response is not JSON, the request counts as a failure
     * @notes `$1`-`$9` are replaced with the arguments of the command, encoded for the part of the request they are placed in. If the command was not given one of them, the tag outputs an error message and no request is sent. A `$` followed by a single digit is always an argument, so write a price such as `$5` as `5 dollars`
     * @notes `$1>`-`$9>` are replaced with all the argument text from that argument on, as typed, so a viewer does not need quotes for text with spaces. They are encoded and required in the same way as `$1`-`$9`
     * @notes `$1|default`-`$9|default` and `$1>|default`-`$9>|default` give the default when the argument was not given or is empty, encoded in the same way, so the argument is not required there. A default can contain letters, numbers, `_`, `.`, and `-`, and runs until the first other character: in `$1|all.json` the default is `all.json`, and a given argument replaces all of it
     * @notes arguments are split as for every command: double quotes group words into one argument and are removed. Type `\"` for a literal double quote
     * @notes adding or editing the command from chat with `!addcom` or `!editcom` also removes double quotes from the response, which breaks a JSON body. Type `\"` for each one, such as `{\"name\":\"$1\"}`, or add the command in the panel
     * @notes a part of the url in square brackets that contains `$1`-`$9`, such as `[/$2]`, is only sent if every argument inside it was given. Those arguments are optional in the rest of the tag as well, and are left blank when missing
     * @notes inside the square brackets, `|` is not a default: the text after the first `|` is sent instead when an argument is missing. `[/users/$1/lists|/lists]` sends `/users/5/lists`, or `/lists` without an argument
     * @notes `$secret.name` is replaced with an API secret saved in the panel. It can be used in the url, a header, or the body. For saving secrets and keeping them safe, see https://phantombot.dev/guides/#guide=content/commands/api-secrets
     * @notes a secret tied to the command with `!secretcom` or the panel is sent with every request of the command, in the `Authorization` header as `Bearer` and the secret, or as the secret in another header chosen when it was tied. A header typed in the tag replaces it
     * @notes a user name and password in the url are not sent; use an `Authorization` header. The request times out after the `httpclienttimeout` bot property, 10 seconds by default
     * @notes this tag can change data on the remote server. Anyone who can add or edit commands can use any saved API secret
     * @notes this tag does not run in greetings, because viewers can be allowed to set their own greeting (`!greeting toggleuserselfservice`)
     * @notes start the chat message with your own text, such as `-> Path: {path}`. A message that starts with `/` or `.` is treated as a Twitch command, which a field, an argument, or the response text could otherwise decide
     * @notes parentheses inside the tag must be escaped as `\(` and `\)`. Other tags inside the tag run before it does, whichever reply is used, and their text is read as part of the tag: a viewer's text from `(1)` could add `$secret.name` or a header, so use `$1`-`$9` or `$1>`-`$9>` for anything typed by a viewer
     * @example Caster: !addcom !joke (api https://not.real.com/joke)
     * User: !joke
     * Bot: These jokes are un-bear-able
     * @example Caster: !addcom !weather (api https://not.real.com/weather?q=$1 -> Weather in {location.name}: {current.temp_f} F 404-> I do not know where $1 is !-> The weather service is not answering)
     * User: !weather 80314
     * Bot: Weather in Boulder: 75 F
     * User: !weather nowhere
     * Bot: I do not know where nowhere is
     * @example Caster: !addcom !rename (api PATCH https://not.real.com/item/$1 [Authorization: Bearer $secret.shop] {"name":"$2>"} -> Renamed item $1 to {name})
     * User: !rename 5 big banana
     * Bot: Renamed item 5 to big banana
     * @example Caster: !addcom !song (api https://not.real.com/playlists/$1/songs[/$2] -> Now playing {title} by {artist})
     * User: !song chill
     * // requests https://not.real.com/playlists/chill/songs
     * User: !song chill 7
     * // requests https://not.real.com/playlists/chill/songs/7
     * @example Caster: !addcom !lists (api https://not.real.com[/users/$1/lists|/lists] -> Lists: {names})
     * User: !lists
     * // requests https://not.real.com/lists
     * User: !lists bob
     * // requests https://not.real.com/users/bob/lists
     * @example Caster: !addcom !scores (api https://not.real.com/scores?count=$1|5 -> Top scores: {names})
     * User: !scores
     * // requests https://not.real.com/scores?count=5
     * User: !scores 10
     * // requests https://not.real.com/scores?count=10
     */
    function api(args) {
        let request = parseTag(args.args);

        if (request === null) {
            return;
        }

        let cmdArgs = null,
                used = args.args.match(reArg),
                // Arguments in an optional part of the url are optional everywhere in the tag
                optional = ((request.url.match(reSection) || []).join('').match(reArg) || []).map((arg) => arg.charAt(1)),
                acceptJson = false;

        if (args.event !== undefined && args.event !== null && args.event.getArgs !== undefined) {
            cmdArgs = $.jsArgs(args.event.getArgs());
            cmdArgs.text = args.event.getArguments !== undefined ? $.jsString(args.event.getArguments()) : cmdArgs.join(' ');
            for (let i = 0; used !== null && i < used.length; i++) {
                // Each use counts on its own: an argument with a default is never missing
                if (!used[i].includes('|') && !cmdArgs[parseInt(used[i].charAt(1)) - 1] && !optional.includes(used[i].charAt(1))) {
                    return {result: $.lang.get('api.args.missing')};
                }
            }
        }

        request.url = fillSections(request.url, cmdArgs);

        for (let i = 0; i < request.replies.length; i++) {
            acceptJson = acceptJson || reField.test(request.replies[i].text);
        }

        let response = send(request, cmdArgs, acceptJson, getTie(args.event)),
                isSuccess = response.status > 0 && response.status < 400,
                reply = findReply(request.replies, [String(response.status), Math.floor(response.status / 100) + 'xx', isSuccess ? 'ok' : '!']),
                json = {};

        $.consoleDebug('(api) ' + request.method + ' ' + request.url + ' -> ' + response.status + ' ' + response.body);

        if (!isSuccess && response.status > 0) {
            $.log.error('(api) ' + request.method + ' ' + request.url + ' returned ' + response.status);
        }

        if (reply !== null && reField.test(reply.text) && response.body.trim().length > 0) {
            try {
                json = JSON.parse(response.body);
            } catch (ex) {
                // A success was expected to be JSON; a failure just leaves the fields blank
                if (isSuccess) {
                    $.log.error('(api) ' + request.method + ' ' + request.url + ' did not return JSON');
                    isSuccess = false;
                    reply = findReply(request.replies, ['!']);
                }
            }
        }

        if (reply === null) {
            return {
                result: isSuccess ? response.body : $.lang.get('api.error'),
                cache: false
            };
        }

        return {
            result: reply.text.replace(reReply, function (match, path, n, rest, def) {
                if (path) {
                    return getField(json, path);
                } else if (n) {
                    return (cmdArgs === null ? def || match : getArg(cmdArgs, parseInt(n), rest === '>') || def || '');
                }

                return response.status;
            }),
            cache: false
        };
    }

    $.transformers.addTransformers([
        new $.transformers.transformer('api', ['twitch', 'discord', 'noevent', 'commandevent', 'api'], api)
    ]);
})();
