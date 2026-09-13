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

/* global Packages */

/**
 * tennisCommand.js
 *
 * Reports live professional tennis scores in chat, from the Live Tennis API
 * (https://livetennisapi.com). Read-only and strictly informational: it reports
 * scores and rankings and never takes or settles a wager.
 *
 * The channel's own API key is required and is stored per channel in the database.
 * It is sent in the X-API-Key request header rather than the ?token= query
 * parameter the vendor also accepts, so the key never lands in a URL, and it is
 * never written to chat, the console or the log.
 *
 * Cadence and the free-tier request budget
 * ----------------------------------------
 * A FREE key allows 30 requests/minute and 100 requests/DAY. The daily figure is
 * the binding constraint, and a chat command is triggered by viewers, so without
 * a cache one busy channel would spend a whole day of the broadcaster's allowance
 * in well under a minute. Three independent limits apply, cheapest first:
 *
 * 1. Cache. The live board is fetched at most once per BOARD_CACHE_MS (15 min) and
 *    every call in between is answered from memory, no matter how many viewers ask.
 *    24h / 15min = 96 refreshes is the worst case, for a channel running the command
 *    around the clock. Published ranking tables change weekly, so rankings are cached
 *    for RANKINGS_CACHE_MS (6h) = at most 4/day. A plan refusal (HTTP 403) is cached
 *    for the same 6h, because a refused request is still a counted request: without
 *    that, !tennis rankings on a free key would spend the entire allowance on 403s.
 *    Worst case total: 96 + 4 = 100 requests/day.
 * 2. Daily budget. 100 is the whole allowance and would leave the broadcaster none
 *    for their own use of the same key, so a hard counter stops this module at
 *    DAILY_BUDGET (90) requests per UTC day and keeps the remaining 10 in reserve.
 *    The counter is persisted, so restarting the bot cannot hand back requests the
 *    vendor has already counted.
 * 3. Chat throttle. USER_COOLDOWN_MS (60s) per viewer and CHANNEL_COOLDOWN_MS (15s)
 *    per channel. These protect chat and the bot's outgoing message queue rather than
 *    the quota - a throttled call is usually a cache hit and costs no request - and
 *    are a floor beneath the broadcaster-configurable !coolcom cooldown, not a
 *    replacement for it.
 *
 * The caches fill lazily and no timer polls the API, so a channel where nobody runs
 * the command issues no requests at all. Every reply is a single chat message.
 */
(function() {
    var API_BASE = 'https://api.livetennisapi.com/api/public/v1',
        BOARD_CACHE_MS = 9e5,
        RANKINGS_CACHE_MS = 216e5,
        USER_COOLDOWN_MS = 6e4,
        CHANNEL_COOLDOWN_MS = 15e3,
        DAILY_BUDGET = 90,
        MAX_BOARD_MATCHES = 5,
        MAX_RANKING_ROWS = 5,
        MAX_MESSAGE_LENGTH = 440,
        RANKING_SYSTEMS = ['atp', 'wta'],
        // HTTP statuses worth telling chat apart, and the line each failure reports.
        STATUS_REASON = {
            401: 'auth',
            403: 'upgrade',
            429: 'ratelimited'
        },
        FAILURE_LANG = {
            nokey: 'tenniscommand.nokey',
            budget: 'tenniscommand.err.budget',
            auth: 'tenniscommand.err.auth',
            upgrade: 'tenniscommand.err.upgrade',
            ratelimited: 'tenniscommand.err.ratelimited',
            unavailable: 'tenniscommand.err.unavailable'
        },
        boardCache = null,
        boardCacheAt = 0,
        rankingsCache = {},
        rankingsCacheAt = {},
        userLastUsed = {},
        channelLastUsed = 0,
        _lock = new Packages.java.util.concurrent.locks.ReentrantLock();

    /**
     * @function fail
     * @param {string} reason one of the FAILURE_LANG keys
     * @returns {object}
     */
    function fail(reason) {
        return {
            ok: false,
            reason: reason
        };
    }

    /**
     * @function getApiKey
     * @returns {string} the stored key, or an empty string when none is set
     */
    function getApiKey() {
        return $.jsString($.getSetIniDbString('tennisCommand', 'apikey', ''), '').trim();
    }

    /**
     * Removes the characters that would be re-read as substitution placeholders by
     * $.lang.get, which replaces "$n" in a loop. A value containing "$1" would make
     * that loop spin forever, so no user input or vendor string reaches a language
     * string with a dollar sign still in it.
     *
     * @function sanitize
     * @param {string} text
     * @returns {string}
     */
    function sanitize(text) {
        return $.jsString(text, '').replace(/\$/g, '').replace(/\s+/g, ' ').trim();
    }

    /**
     * @function lastWord
     * @param {string} name
     * @returns {string}
     */
    function lastWord(name) {
        var parts = sanitize(name).split(' ');

        return parts[parts.length - 1];
    }

    /**
     * Reduces a player name to the surname chat needs. Vendor names are natural order
     * ("Chase Ferguson"), so the last word is the surname. A doubles team arrives as
     * one record naming both players, so each side is reduced separately.
     *
     * @function surname
     * @param {string} name
     * @returns {string}
     */
    function surname(name) {
        var clean = sanitize(name),
            parts,
            out = [],
            i;

        if (clean.length === 0) {
            return '?';
        }

        if (clean.indexOf('/') !== -1) {
            parts = clean.split('/');
            for (i = 0; i < parts.length; i++) {
                out.push(lastWord(parts[i]));
            }

            return out.join('/');
        }

        return lastWord(clean);
    }

    /**
     * Renders the set scores. Score.games is PLAYER-MAJOR: [[6, 3], [4, 4]] is p1's
     * games per set then p2's, and reads 6-4, 3-4. A completed match carries empty
     * games arrays, and either side may be missing entirely, so nothing is assumed.
     *
     * @function formatGames
     * @param {array} games
     * @returns {string}
     */
    function formatGames(games) {
        var p1,
            p2,
            out = [],
            count,
            i;

        if (games === null || games === undefined || games.length < 2) {
            return '';
        }

        p1 = games[0];
        p2 = games[1];

        if (p1 === null || p1 === undefined || p2 === null || p2 === undefined) {
            return '';
        }

        count = Math.min(p1.length, p2.length);

        for (i = 0; i < count; i++) {
            if (p1[i] === null || p1[i] === undefined || p2[i] === null || p2[i] === undefined) {
                continue;
            }

            out.push(p1[i] + '-' + p2[i]);
        }

        return out.join(' ');
    }

    /**
     * Renders the in-game points. These are "0", "15", "30", "40" or "AD", except in a
     * tiebreak where they are the running count as plain integer strings. Either entry
     * can be null - seen live on completed matches - so both are checked.
     *
     * @function formatPoints
     * @param {array} points
     * @returns {string}
     */
    function formatPoints(points) {
        if (points === null || points === undefined || points.length < 2) {
            return '';
        }

        if (points[0] === null || points[0] === undefined || points[1] === null || points[1] === undefined) {
            return '';
        }

        return sanitize(points[0]) + '-' + sanitize(points[1]);
    }

    /**
     * Derives break point from the score, which the API does not flag directly. The
     * receiver is one point from winning the server's game: receiver at AD, or receiver
     * at 40 while the server is at 0, 15 or 30. Receiver at 40 with the server also at
     * 40 is deuce, not break point, and a tiebreak has no break point at all because
     * there is no game being served for.
     *
     * @function isBreakPoint
     * @param {object} score
     * @returns {boolean}
     */
    function isBreakPoint(score) {
        var server,
            points,
            serverPoint,
            receiverPoint;

        if (score === null || score === undefined || score.is_tiebreak === true) {
            return false;
        }

        server = score.server;

        if (server !== 1 && server !== 2) {
            return false;
        }

        points = score.points;

        if (points === null || points === undefined || points.length < 2) {
            return false;
        }

        serverPoint = points[server - 1];
        receiverPoint = points[server === 1 ? 1 : 0];

        if (serverPoint === null || serverPoint === undefined || receiverPoint === null || receiverPoint === undefined) {
            return false;
        }

        serverPoint = $.jsString(serverPoint, '');
        receiverPoint = $.jsString(receiverPoint, '');

        if (receiverPoint === 'AD') {
            return true;
        }

        return receiverPoint === '40' && (serverPoint === '0' || serverPoint === '15' || serverPoint === '30');
    }

    /**
     * Builds the one-match summary: both surnames with an asterisk on whoever is
     * serving, the set scores, the current points and a break point marker.
     *
     * @function formatMatch
     * @param {object} match
     * @returns {string}
     */
    function formatMatch(match) {
        var players,
            score,
            serving,
            line,
            games,
            points;

        if (match === null || match === undefined) {
            return '';
        }

        players = match.players;

        if (players === null || players === undefined) {
            return '';
        }

        score = match.score === undefined ? null : match.score;
        serving = (score !== null && score !== undefined) ? score.server : null;

        line = surname(players.p1 === null || players.p1 === undefined ? '' : players.p1.name)
                + (serving === 1 ? $.lang.get('tenniscommand.serving') : '')
                + ' v '
                + surname(players.p2 === null || players.p2 === undefined ? '' : players.p2.name)
                + (serving === 2 ? $.lang.get('tenniscommand.serving') : '');

        if (score === null || score === undefined) {
            return line;
        }

        games = formatGames(score.games);

        if (games.length > 0) {
            line += ' ' + games;
        }

        points = formatPoints(score.points);

        if (points.length > 0) {
            line += ' ' + points;
        }

        if (isBreakPoint(score)) {
            line += ' ' + $.lang.get('tenniscommand.bp');
        }

        return line;
    }

    /**
     * Renders each match that can be rendered. A match carrying no usable player names
     * yields nothing and is dropped here rather than counted as hidden, so the "+n more"
     * figure only ever describes matches withheld by the display caps.
     *
     * @function buildLines
     * @param {array} matches
     * @returns {array} the non-empty summaries
     */
    function buildLines(matches) {
        var lines = [],
            line,
            i;

        if (matches === null || matches === undefined) {
            return lines;
        }

        for (i = 0; i < matches.length; i++) {
            line = formatMatch(matches[i]);

            if (line.length > 0) {
                lines.push(line);
            }
        }

        return lines;
    }

    /**
     * Joins summaries into one chat message, capped by both count and length so a busy
     * day on tour cannot produce an oversized line, or several lines.
     *
     * @function joinLines
     * @param {array} lines
     * @param {number} limit
     * @returns {string}
     */
    function joinLines(lines, limit) {
        var out = '',
            shown = 0,
            i;

        for (i = 0; i < lines.length && shown < limit; i++) {
            if (out.length > 0 && (out.length + lines[i].length + 3) > MAX_MESSAGE_LENGTH) {
                break;
            }

            out += (out.length > 0 ? ' | ' : '') + lines[i];
            shown++;
        }

        if (lines.length > shown) {
            out += $.lang.get('tenniscommand.board.more', lines.length - shown);
        }

        return out;
    }

    /**
     * The budget resets on the UTC day boundary, because that is the day the vendor
     * counts. Built from the UTC getters rather than a sliced ISO string so it cannot
     * pick up a local timezone offset.
     *
     * @function utcDay
     * @returns {string} today's UTC date as YYYY-MM-DD
     */
    function utcDay() {
        var now = new Date(),
            month = now.getUTCMonth() + 1,
            day = now.getUTCDate();

        return now.getUTCFullYear() + '-' + (month < 10 ? '0' + month : month)
                + '-' + (day < 10 ? '0' + day : day);
    }

    /**
     * Claims one request from today's budget. Persisted so that restarting the bot
     * cannot hand back requests the vendor has already counted, and reset when the
     * stored UTC day is no longer today.
     *
     * @function claimRequest
     * @returns {boolean} false when today's budget is spent
     */
    function claimRequest() {
        var today = utcDay(),
            storedDay = $.jsString($.getSetIniDbString('tennisCommand', 'budgetDay', ''), ''),
            used = $.getSetIniDbNumber('tennisCommand', 'budgetUsed', 0);

        if (storedDay !== today) {
            used = 0;
            $.setIniDbString('tennisCommand', 'budgetDay', today);
        }

        if (used >= DAILY_BUDGET) {
            return false;
        }

        $.setIniDbNumber('tennisCommand', 'budgetUsed', used + 1);

        return true;
    }

    /**
     * Performs one authenticated GET. Returns {ok: true, body: object} or
     * {ok: false, reason: string}. The key travels in a header and only the HTTP
     * status is ever logged, so neither the key nor a response body can leak.
     *
     * @function apiGet
     * @param {string} path
     * @returns {object}
     */
    function apiGet(path) {
        var key = getApiKey(),
            headers,
            response,
            code;

        if (key.length === 0) {
            return fail('nokey');
        }

        if (!claimRequest()) {
            return fail('budget');
        }

        try {
            headers = Packages.com.gmt2001.httpclient.HttpClient.createHeaders(false, true);
            headers.add('X-API-Key', key);

            response = Packages.com.gmt2001.httpclient.HttpClient.get(
                    Packages.com.gmt2001.httpclient.URIUtil.create(API_BASE + path), headers);

            if (response.hasException()) {
                $.log.error('tennisCommand: request to ' + path + ' failed');

                return fail('unavailable');
            }

            code = parseInt(response.responseCode().code());
            $.consoleDebug('tennisCommand: GET ' + path + ' -> ' + code);

            if (code === 200) {
                return {
                    ok: true,
                    body: JSON.parse($.jsString(response.responseBody(), '{}'))
                };
            }

            return fail(STATUS_REASON.hasOwnProperty(code) ? STATUS_REASON[code] : 'unavailable');
        } catch (e) {
            $.log.error('tennisCommand: request to ' + path + ' threw');

            return fail('unavailable');
        }
    }

    /**
     * Returns the live board, from cache when it is younger than BOARD_CACHE_MS.
     * The lock is held across the fetch so that simultaneous callers cannot each
     * spend a request on the same refresh.
     *
     * @function getBoard
     * @returns {object} {ok: true, matches: array} or {ok: false, reason: string}
     */
    function getBoard() {
        var result;

        _lock.lock();
        try {
            if (boardCache !== null && ($.systemTime() - boardCacheAt) < BOARD_CACHE_MS) {
                return {
                    ok: true,
                    matches: boardCache
                };
            }

            result = apiGet('/matches?status=live&limit=50');

            if (!result.ok) {
                return result;
            }

            boardCache = (result.body !== null && result.body !== undefined && result.body.data !== null
                    && result.body.data !== undefined) ? result.body.data : [];
            boardCacheAt = $.systemTime();

            return {
                ok: true,
                matches: boardCache
            };
        } finally {
            _lock.unlock();
        }
    }

    /**
     * Returns one published ranking table. The rank-ordered listing is a PRO feature,
     * so a free key is refused; that refusal is cached like a result, because the
     * refused request was still counted against the quota.
     *
     * @function getRankings
     * @param {string} system
     * @returns {object} {ok: true, rows: array} or {ok: false, reason: string}
     */
    function getRankings(system) {
        var result;

        _lock.lock();
        try {
            // `system` is already checked against RANKING_SYSTEMS by the caller, so it is
            // one of two literals and cannot reach an inherited property of the map.
            if (rankingsCache.hasOwnProperty(system)
                    && ($.systemTime() - rankingsCacheAt[system]) < RANKINGS_CACHE_MS) {
                return rankingsCache[system];
            }

            result = apiGet('/rankings?system=' + system + '&limit=' + MAX_RANKING_ROWS);

            if (result.ok) {
                result = {
                    ok: true,
                    rows: (result.body !== null && result.body !== undefined && result.body.data !== null
                            && result.body.data !== undefined) ? result.body.data : []
                };
            } else if (result.reason !== 'upgrade') {
                return result;
            }

            rankingsCache[system] = result;
            rankingsCacheAt[system] = $.systemTime();

            return result;
        } finally {
            _lock.unlock();
        }
    }

    /**
     * @function failureMessage
     * @param {string} reason
     * @returns {string}
     */
    function failureMessage(reason) {
        return $.lang.get(FAILURE_LANG.hasOwnProperty(reason) ? FAILURE_LANG[reason] : FAILURE_LANG.unavailable);
    }

    /**
     * Enforces the per-viewer and per-channel chat throttles, and drops per-user
     * entries that have aged out so the map cannot grow without bound.
     *
     * @function throttle
     * @param {string} sender
     * @returns {number} 0 when allowed, otherwise the whole seconds left to wait
     */
    function throttle(sender) {
        var now = $.systemTime(),
            // Prefixed so that a viewer named "constructor" or "toString" indexes an own
            // property of the map rather than an inherited one from Object.prototype.
            user = 'u:' + $.jsString(sender, '').toLowerCase(),
            wait = 0,
            key;

        _lock.lock();
        try {
            for (key in userLastUsed) {
                if ((now - userLastUsed[key]) >= USER_COOLDOWN_MS) {
                    delete userLastUsed[key];
                }
            }

            if (userLastUsed[user] !== undefined) {
                wait = Math.max(wait, USER_COOLDOWN_MS - (now - userLastUsed[user]));
            }

            if (channelLastUsed > 0) {
                wait = Math.max(wait, CHANNEL_COOLDOWN_MS - (now - channelLastUsed));
            }

            if (wait > 0) {
                return Math.ceil(wait / 1000);
            }

            userLastUsed[user] = now;
            channelLastUsed = now;

            return 0;
        } finally {
            _lock.unlock();
        }
    }

    /**
     * @function matchesPlayer
     * @param {object} match
     * @param {string} needle lower-cased search text
     * @returns {boolean}
     */
    function matchesPlayer(match, needle) {
        var players;

        if (match === null || match === undefined) {
            return false;
        }

        players = match.players;

        if (players === null || players === undefined) {
            return false;
        }

        return [players.p1, players.p2].some(function(player) {
            if (player === null || player === undefined) {
                return false;
            }

            return $.jsString(player.name, '').toLowerCase().indexOf(needle) !== -1;
        });
    }

    /**
     * @function formatRankingRow
     * @param {object} row
     * @returns {string}
     */
    function formatRankingRow(row) {
        if (row === null || row === undefined) {
            return '';
        }

        return (row.rank === null || row.rank === undefined ? '?' : sanitize(row.rank))
                + '. ' + surname(row.player_name);
    }

    /*
     * @event command
     */
    $.bind('command', function(event) {
        var sender = event.getSender(),
            command = event.getCommand(),
            args = event.getArgs(),
            action = args[0],
            wait,
            board,
            needle,
            found,
            system,
            rankings,
            rows,
            lines,
            i,
            line;

        if (!$.equalsIgnoreCase(command, 'tennis')) {
            return;
        }

        /*
         * @commandpath tennis apikey [key / clear] - Store or remove this channel's Live Tennis API key. WARNING: This should be done from the bot console or web panel, if you run this from chat, anyone watching chat can copy your info!
         */
        if (action !== undefined && $.equalsIgnoreCase(action, 'apikey')) {
            if (args[1] === undefined) {
                $.say($.whisperPrefix(sender) + $.lang.get('tenniscommand.apikey.usage'));

                return;
            }

            if ($.equalsIgnoreCase(args[1], 'clear')) {
                $.setIniDbString('tennisCommand', 'apikey', '');
                $.say($.whisperPrefix(sender) + $.lang.get('tenniscommand.apikey.cleared'));

                return;
            }

            $.setIniDbString('tennisCommand', 'apikey', $.jsString(args[1], '').trim());
            $.say($.whisperPrefix(sender) + $.lang.get('tenniscommand.apikey.set'));

            return;
        }

        if (getApiKey().length === 0) {
            $.say($.whisperPrefix(sender) + $.lang.get('tenniscommand.nokey'));

            return;
        }

        wait = throttle(sender);

        if (wait > 0) {
            $.say($.whisperPrefix(sender) + $.lang.get('tenniscommand.cooldown', wait));

            return;
        }

        /*
         * @commandpath tennis player [name] - Show the live match for a player, by any part of their name
         */
        if (action !== undefined && $.equalsIgnoreCase(action, 'player')) {
            if (args[1] === undefined) {
                $.say($.whisperPrefix(sender) + $.lang.get('tenniscommand.player.usage'));

                return;
            }

            needle = sanitize(args.slice(1).join(' ')).toLowerCase();

            if (needle.length === 0) {
                $.say($.whisperPrefix(sender) + $.lang.get('tenniscommand.player.usage'));

                return;
            }

            board = getBoard();

            if (!board.ok) {
                $.say($.whisperPrefix(sender) + failureMessage(board.reason));

                return;
            }

            /*
             * The cached board is filtered here rather than through the vendor's own
             * ?player= filter, which takes numeric player ids: resolving a name to an
             * id would cost a second request per lookup, and the board this answers
             * from has already been paid for.
             */
            found = buildLines(board.matches.filter(function(match) {
                return matchesPlayer(match, needle);
            }));

            if (found.length === 0) {
                $.say($.whisperPrefix(sender) + $.lang.get('tenniscommand.player.notfound', needle));

                return;
            }

            $.say($.lang.get('tenniscommand.board.header', joinLines(found, MAX_BOARD_MATCHES)));

            return;
        }

        /*
         * @commandpath tennis rankings [atp / wta] - Show the top of the published ATP or WTA ranking table (needs a PRO key)
         */
        if (action !== undefined && $.equalsIgnoreCase(action, 'rankings')) {
            system = args[1] === undefined ? 'atp' : $.jsString(args[1], '').toLowerCase();

            if (RANKING_SYSTEMS.indexOf(system) === -1) {
                $.say($.whisperPrefix(sender) + $.lang.get('tenniscommand.rankings.usage'));

                return;
            }

            rankings = getRankings(system);

            if (!rankings.ok) {
                $.say($.whisperPrefix(sender) + failureMessage(rankings.reason));

                return;
            }

            rows = [];

            for (i = 0; i < rankings.rows.length && rows.length < MAX_RANKING_ROWS; i++) {
                line = formatRankingRow(rankings.rows[i]);

                if (line.length > 0) {
                    rows.push(line);
                }
            }

            if (rows.length === 0) {
                $.say($.lang.get('tenniscommand.rankings.empty'));

                return;
            }

            $.say($.lang.get('tenniscommand.rankings.header', system.toUpperCase(), rows.join(', ')));

            return;
        }

        if (action !== undefined) {
            $.say($.whisperPrefix(sender) + $.lang.get('tenniscommand.usage'));

            return;
        }

        /*
         * @commandpath tennis - Show the live tennis scoreboard
         */
        board = getBoard();

        if (!board.ok) {
            $.say($.whisperPrefix(sender) + failureMessage(board.reason));

            return;
        }

        lines = buildLines(board.matches);

        if (lines.length === 0) {
            $.say($.lang.get('tenniscommand.board.empty'));

            return;
        }

        $.say($.lang.get('tenniscommand.board.header', joinLines(lines, MAX_BOARD_MATCHES)));
    });

    /*
     * @event initReady
     */
    $.bind('initReady', function() {
        $.registerChatCommand('./commands/tennisCommand.js', 'tennis', $.PERMISSION.Viewer);

        $.registerChatSubcommand('tennis', 'player', $.PERMISSION.Viewer);
        $.registerChatSubcommand('tennis', 'rankings', $.PERMISSION.Viewer);
        $.registerChatSubcommand('tennis', 'apikey', $.PERMISSION.Caster);
    });
})();
