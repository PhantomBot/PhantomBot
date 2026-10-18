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

/*
 * social.js
 *
 * Shared chat side of the social media integrations: announcements, automatic posts, repost rewards
 * and the chat command. A platform module registers itself with $.social.registerPlatform and
 * forwards its command to $.social.handleCommand; everything else is done here for every platform.
 *
 * Settings are kept in the table named after the platform id. Lang keys are looked up as
 * <platform id>.<key> first, then social.<key>, so a platform only adds keys where its wording differs.
 */
(function () {
    const MIN_UPDATE_MINUTES = 180,
        ONLINE_COOLDOWN = 8 * 60 * 60 * 1000,
        GAME_CHANGE_COOLDOWN = 60 * 60 * 1000,
        ONLINE_POST_DELAY = 90 * 1000,
        UPDATE_CHECK_INTERVAL = 80 * 1000,
        MAX_CHAT_TEXT = 250,
        LAST_TYPES = {lastpost: 'posts', lastmention: 'mentions', lastrepost: 'reposts'},
        POST_KINDS = ['online', 'gamechange', 'update'],
        DOLLAR_PLACEHOLDER = '\uE000',
        DOLLAR_PLACEHOLDER_PATTERN = /\uE000/g;
    let platforms = {};

    /*
     * @function registerPlatform
     * @export $.social
     * @param {Object} spec {id, command, script}: the platform id (as in $.socialPlatforms), its chat command and its module script
     * @return {Object} the spec, with the platform added as spec.api
     */
    function registerPlatform(spec) {
        let pollTypes = [];

        spec.api = $.socialPlatforms.get(spec.id);
        spec.name = $.jsString(spec.api.getDisplayName());

        for (let i = 0; i < spec.api.getPollTypes().size(); i++) {
            let type = spec.api.getPollTypes().get(i);
            pollTypes.push({id: $.jsString(type.id()), minDelay: type.minDelaySeconds()});
            $.getSetIniDbBoolean(spec.id, 'poll_' + type.id(), false);
            $.getSetIniDbNumber(spec.id, 'polldelay_' + type.id(), type.defaultDelaySeconds());
        }

        spec.pollTypes = pollTypes;
        $.getSetIniDbString(spec.id, 'message_online', $.lang.get('social.message.online.default'));
        $.getSetIniDbString(spec.id, 'message_gamechange', $.lang.get('social.message.gamechange.default'));
        $.getSetIniDbString(spec.id, 'message_update', $.lang.get('social.message.update.default'));
        $.getSetIniDbBoolean(spec.id, 'post_online', false);
        $.getSetIniDbBoolean(spec.id, 'post_gamechange', false);
        $.getSetIniDbBoolean(spec.id, 'post_update', false);
        $.getSetIniDbNumber(spec.id, 'postdelay_update', MIN_UPDATE_MINUTES);
        $.getSetIniDbBoolean(spec.id, 'reward_toggle', false);
        $.getSetIniDbBoolean(spec.id, 'reward_announce', false);
        $.getSetIniDbNumber(spec.id, 'reward_points', 100);
        $.getSetIniDbFloat(spec.id, 'reward_cooldown', 4);

        platforms[spec.id] = spec;
        return spec;
    }

    /*
     * @function getLang
     * @export $.social
     * @param {Object} spec
     * @param {String} key the key without the platform or social prefix
     * @return {String} the text, with (platform), (command), (account) and (profileurl) filled in
     */
    function getLang(spec, key) {
        let langKey = $.lang.exists(spec.id + '.' + key) ? spec.id + '.' + key : 'social.' + key,
            args = Array.prototype.slice.call(arguments, 2).map(function (arg) {
                // $.lang.get replaces $1, $2... until none is left, so a $ in a value (such as a post) would be filled again or never end
                return String(arg).replace(/\$/g, DOLLAR_PLACEHOLDER);
            }),
            text = $.jsString($.lang.get.apply(null, [langKey].concat(args))).replace(DOLLAR_PLACEHOLDER_PATTERN, '$');

        return text.replace(/\(platform\)/g, spec.name).replace(/\(command\)/g, spec.command)
            .replace(/\(account\)/g, $.jsString(spec.api.getAccountName())).replace(/\(profileurl\)/g, $.jsString(spec.api.getProfileUrl()));
    }

    /*
     * @function cleanText
     * @param {String} text text from the platform
     * @return {String} the text on one line, shortened to fit in a chat message
     */
    function cleanText(text) {
        let s = $.jsString(text).replace(/\s+/g, ' ').trim();

        return s.length > MAX_CHAT_TEXT ? s.substring(0, MAX_CHAT_TEXT - 3) + '...' : s;
    }

    /*
     * @function sayLine
     * @param {String} line
     */
    function sayLine(line) {
        // A message starting with / or . would be sent to Twitch as a command
        $.say(line.replace(/^[\/.\s]+/, ''));
    }

    /*
     * @function formatItem
     * @param {Object} spec
     * @param {String} key
     * @param {String} text
     * @param {String} author
     * @param {String} url
     * @return {String}
     */
    function formatItem(spec, key, text, author, url) {
        return getLang(spec, key, cleanText(text), $.jsString(author), $.jsString(url));
    }

    /*
     * @function isEnabled
     * @param {Object} spec
     * @return {Boolean}
     */
    function isEnabled(spec) {
        return $.bot.isModuleEnabled(spec.script);
    }

    /*
     * @function getPollType
     * @param {Object} spec
     * @param {String} id
     * @return {Object} the poll type; null if the platform has none with that id
     */
    function getPollType(spec, id) {
        for (let i = 0; i < spec.pollTypes.length; i++) {
            if ($.equalsIgnoreCase(spec.pollTypes[i].id, id)) {
                return spec.pollTypes[i];
            }
        }

        return null;
    }

    /*
     * @function getUptime
     * @return {String} the stream uptime as HH:MM
     */
    function getUptime() {
        let seconds = $.getStreamUptimeSeconds($.channelName),
            hours = Math.floor(seconds / 3600),
            minutes = Math.floor((seconds % 3600) / 60);

        return (hours < 10 ? '0' : '') + hours + ':' + (minutes < 10 ? '0' : '') + minutes;
    }

    /*
     * @function getTwitchUrl
     * @return {String}
     */
    function getTwitchUrl() {
        return 'https://www.twitch.tv/' + $.channelName;
    }

    function transformers() {
        /*
         * @localtransformer title
         * @formula (title) The stream title
         */
        function title() {
            return {result: $.jsString($.twitchcache.getStreamStatus())};
        }

        /*
         * @localtransformer game
         * @formula (game) The game being played
         */
        function game() {
            return {result: $.jsString($.twitchcache.getGameTitle())};
        }

        /*
         * @localtransformer uptime
         * @formula (uptime) How long the stream has been live, as HH:MM
         */
        function uptime() {
            return {result: getUptime()};
        }

        /*
         * @localtransformer twitchurl
         * @formula (twitchurl) The address of the Twitch channel
         */
        function twitchurl() {
            return {result: getTwitchUrl()};
        }

        /*
         * @localtransformer enter
         * @formula (enter) A line break
         */
        function enter() {
            return {result: '\n'};
        }

        return {title: title, game: game, uptime: uptime, twitchurl: twitchurl, enter: enter};
    }

    /*
     * @function createAutoPost
     * @param {Object} spec
     * @param {String} key the message_ key of the template
     */
    function createAutoPost(spec, key) {
        let text = $.transformers.tags(null, $.getIniDbString(spec.id, key, ''), ['twitch', 'noevent'], {
                platform: 'twitch',
                localTransformers: transformers()
            }),
            game = $.jsString($.twitchcache.getGameTitle()),
            title = $.jsString($.twitchcache.getStreamStatus()),
            card,
            result;

        if (text === null || text.trim() === '') {
            return;
        }

        card = new Packages.com.mcawful.social.SocialLinkCard(getTwitchUrl(),
                title !== '' ? title : getLang(spec, 'card.title', $.username.resolve($.channelName)),
                game !== '' ? getLang(spec, 'card.description', game) : '', $.twitchcache.getPreviewLink());
        result = spec.api.createPost(text, card, true);

        if (result.success()) {
            $.log.event('Posted to ' + spec.name + ': ' + result.url());
        } else {
            $.log.error('Failed to post to ' + spec.name + ': ' + result.error() + ' ' + result.detail());
        }
    }

    /*
     * @function scheduleAutoPost
     * @param {Object} spec
     * @param {String} key the message_ key of the template
     * @param {Number} delay milliseconds to wait; the post is made on a timer so the request does not hold up the event
     */
    function scheduleAutoPost(spec, key, delay) {
        setTimeout(function () {
            // Going live waits for Twitch to make the stream preview used on the link card; check the stream is still live
            if ($.isOnline($.channelName)) {
                createAutoPost(spec, key);
            }
        }, delay);
    }

    /*
     * @function checkAutoUpdates
     */
    function checkAutoUpdates() {
        let now = $.systemTime(),
            online = $.isOnline($.channelName);

        for (let id in platforms) {
            let spec = platforms[id];

            if (!isEnabled(spec) || !spec.api.isConfigured() || !$.getIniDbBoolean(spec.id, 'post_update', false)) {
                continue;
            }

            // Restart the timer while offline, so the first update comes a full delay after going live
            if (!online) {
                $.inidb.set(spec.id, 'last_autoupdate', now);
                continue;
            }

            let delay = Math.max(MIN_UPDATE_MINUTES, $.getIniDbNumber(spec.id, 'postdelay_update', MIN_UPDATE_MINUTES)) * 6e4;

            if (now - $.getIniDbNumber(spec.id, 'last_autoupdate', 0) >= delay) {
                $.inidb.set(spec.id, 'last_autoupdate', now);
                createAutoPost(spec, 'message_update');
            }
        }
    }

    /*
     * @function getRawText
     * @param {Object} event the command event
     * @param {Number} skip the number of words to leave out
     * @return {String} the rest of the command as typed; the parsed arguments lose double quotes and repeated spaces
     */
    function getRawText(event, skip) {
        let text = $.jsString(event.getArguments()).trim();

        for (let i = 0; i < skip; i++) {
            text = text.replace(/^\S+\s*/, '');
        }

        return text;
    }

    /*
     * @function getOnOff
     * @param {String} arg
     * @return {Boolean} true for on, false for off, null for anything else
     */
    function getOnOff(arg) {
        if ($.equalsIgnoreCase(arg, 'on')) {
            return true;
        } else if ($.equalsIgnoreCase(arg, 'off')) {
            return false;
        }

        return null;
    }

    /*
     * @function getOnOffText
     * @param {Boolean} value
     * @return {String}
     */
    function getOnOffText(value) {
        return $.lang.get(value ? 'common.enabled' : 'common.disabled');
    }

    /*
     * @function handleSetCommand
     * @param {Object} spec
     * @param {Array} args the arguments after "set"
     * @param {Object} event the command event
     * @return {String} the reply
     */
    function handleSetCommand(spec, args, event) {
        let action = args[0],
            subAction = args[1],
            kind = subAction === undefined ? '' : $.jsString(subAction).toLowerCase(),
            value = args[2],
            onOff = getOnOff(value),
            type;

        if ($.equalsIgnoreCase(action, 'reward')) {
            if (kind === 'toggle' || kind === 'announce') {
                let key = 'reward_' + kind;

                if (onOff === null) {
                    return getLang(spec, 'set.reward.' + key + '.usage', getOnOffText($.getIniDbBoolean(spec.id, key, false)));
                }

                $.setIniDbBoolean(spec.id, key, onOff);
                return getLang(spec, 'set.reward.' + key + '.success', getOnOffText(onOff));
            } else if (kind === 'points' || kind === 'cooldown') {
                let key = 'reward_' + kind,
                    number = parseFloat(value);

                if (isNaN(number) || number < 0 || (key === 'reward_points' && Math.floor(number) !== number)) {
                    return getLang(spec, 'set.reward.' + key + '.usage', $.getIniDbFloat(spec.id, key, 0));
                }

                $.inidb.set(spec.id, key, number);
                return getLang(spec, 'set.reward.' + key + '.success', number);
            }

            return getLang(spec, 'set.reward.usage');
        }

        if ($.equalsIgnoreCase(action, 'polldelay')) {
            type = getPollType(spec, subAction);

            if (type === null) {
                return getLang(spec, 'set.polldelay.usage', spec.pollTypes.map(function (t) { return t.id; }).join(' | '));
            }

            let seconds = parseInt(value);

            if (isNaN(seconds)) {
                return getLang(spec, 'set.polldelay.type.usage', type.id, type.minDelay, $.getIniDbNumber(spec.id, 'polldelay_' + type.id, type.minDelay));
            } else if (seconds < type.minDelay) {
                return getLang(spec, 'set.polldelay.minerror', type.minDelay);
            }

            $.inidb.set(spec.id, 'polldelay_' + type.id, seconds);
            return getLang(spec, 'set.polldelay.success', type.id, seconds);
        }

        if ($.equalsIgnoreCase(action, 'poll')) {
            type = getPollType(spec, subAction);

            if (type === null) {
                return getLang(spec, 'set.poll.usage', spec.pollTypes.map(function (t) { return t.id; }).join(' | '));
            } else if (onOff === null) {
                return getLang(spec, 'set.poll.type.usage', type.id, getOnOffText($.getIniDbBoolean(spec.id, 'poll_' + type.id, false)),
                        getLang(spec, 'polltype.' + type.id));
            }

            $.setIniDbBoolean(spec.id, 'poll_' + type.id, onOff);
            return getLang(spec, 'set.poll.success', type.id, getOnOffText(onOff));
        }

        if ($.equalsIgnoreCase(action, 'post')) {
            if (POST_KINDS.indexOf(kind) === -1) {
                return getLang(spec, 'set.post.usage');
            } else if (onOff === null) {
                return getLang(spec, 'set.post.type.usage', kind, getOnOffText($.getIniDbBoolean(spec.id, 'post_' + kind, false)));
            }

            $.setIniDbBoolean(spec.id, 'post_' + kind, onOff);
            return getLang(spec, 'set.post.success', kind, getOnOffText(onOff));
        }

        if ($.equalsIgnoreCase(action, 'updatetimer')) {
            let minutes = parseInt(subAction);

            if (isNaN(minutes)) {
                return getLang(spec, 'set.updatetimer.usage', MIN_UPDATE_MINUTES, $.getIniDbNumber(spec.id, 'postdelay_update', MIN_UPDATE_MINUTES));
            } else if (minutes < MIN_UPDATE_MINUTES) {
                return getLang(spec, 'set.updatetimer.toosmall', MIN_UPDATE_MINUTES);
            }

            $.inidb.set(spec.id, 'postdelay_update', minutes);
            return getLang(spec, 'set.updatetimer.success', minutes);
        }

        if ($.equalsIgnoreCase(action, 'message')) {
            let message = getRawText(event, 3);

            if (POST_KINDS.indexOf(kind) === -1) {
                return getLang(spec, 'set.message.usage');
            } else if (message.trim() === '') {
                return getLang(spec, 'set.message.type.usage', $.getIniDbString(spec.id, 'message_' + kind, ''), kind);
            }

            $.inidb.set(spec.id, 'message_' + kind, message);
            return getLang(spec, 'set.message.success', message, kind);
        }

        return getLang(spec, 'set.usage');
    }

    /*
     * @function findMappedUser
     * @param {Object} spec
     * @param {String} accountId
     * @return {String} the Twitch login the account id is registered to; null if none
     */
    function findMappedUser(spec, accountId) {
        let users = $.inidb.GetKeyList(spec.id + '_mapping', '');

        for (let i = 0; i < users.length; i++) {
            if (JSON.parse($.getIniDbString(spec.id + '_mapping', users[i], '{}')).id === accountId) {
                return $.jsString(users[i]);
            }
        }

        return null;
    }

    /*
     * @function handleCommand
     * @export $.social
     * @param {Object} spec the spec returned by registerPlatform
     * @param {Object} event the command event
     */
    function handleCommand(spec, event) {
        let sender = event.getSender(),
            args = event.getArgs(),
            action = args[0],
            reply = function (message) {
                $.say($.whisperPrefix(sender) + message);
            };

        if (!$.equalsIgnoreCase(event.getCommand(), spec.command)) {
            return;
        }

        if (action === undefined) {
            reply((spec.api.isConfigured() ? getLang(spec, 'id', $.username.resolve($.channelName)) : getLang(spec, 'id.notlinked'))
                    + ' ' + getLang(spec, 'usage.hint'));
        } else if ($.equalsIgnoreCase(action, 'usage')) {
            reply(getLang(spec, 'usage'));
        } else if ($.equalsIgnoreCase(action, 'id')) {
            reply(spec.api.isConfigured() ? getLang(spec, 'id', $.username.resolve($.channelName)) : getLang(spec, 'id.notlinked'));
        } else if ($.equalsIgnoreCase(action, 'set')) {
            reply(handleSetCommand(spec, args.slice(1), event));
        } else if ($.equalsIgnoreCase(action, 'post')) {
            let text = getRawText(event, 1).replace(/\(enter\)/g, '\n');

            if (text.trim() === '') {
                reply(getLang(spec, 'post.usage'));
                return;
            }

            setTimeout(function () {
                let result = spec.api.createPost(text, null, false);

                if (result.success()) {
                    reply(getLang(spec, 'post.sent', $.jsString(result.url())));
                } else if ($.equalsIgnoreCase(result.error(), 'toolong')) {
                    reply(getLang(spec, 'post.toolong', $.jsString(result.detail())));
                } else if ($.equalsIgnoreCase(result.error(), 'notlinked')) {
                    reply(getLang(spec, 'id.notlinked'));
                } else {
                    reply(getLang(spec, 'post.failed'));
                }
            }, 0);
        } else if (LAST_TYPES.hasOwnProperty($.jsString(action).toLowerCase())) {
            let typeId = LAST_TYPES[$.jsString(action).toLowerCase()],
                last = $.getIniDbString(spec.id, 'last_' + typeId, '');

            // The last item is also kept when only Discord announces the kind
            if (last !== '') {
                last = JSON.parse(last);
                reply(formatItem(spec, 'last.' + typeId, last.text, last.authorName, last.url));
            } else if (getPollType(spec, typeId) === null || !$.getIniDbBoolean(spec.id, 'poll_' + typeId, false)) {
                reply(getLang(spec, 'last.disabled', getLang(spec, 'polltype.' + typeId)));
            } else {
                reply(getLang(spec, 'last.none'));
            }
        } else if ($.equalsIgnoreCase(action, 'register')) {
            let account = args[1],
                current = JSON.parse($.getIniDbString(spec.id + '_mapping', sender, '{}'));

            if (account === undefined) {
                reply(getLang(spec, 'register.usage', current.name !== undefined ? '@' + current.name : getLang(spec, 'register.notregistered')));
                return;
            }

            setTimeout(function () {
                let name = $.jsString(account).replace(/^@/, '').toLowerCase(),
                    accountId = spec.api.resolveAccountId(name),
                    owner;

                if (accountId === null) {
                    reply(getLang(spec, 'register.notfound', name));
                    return;
                }

                accountId = $.jsString(accountId);
                owner = findMappedUser(spec, accountId);

                if (owner !== null && !$.equalsIgnoreCase(owner, sender)) {
                    reply(getLang(spec, 'register.inuse', name));
                    return;
                }

                $.setIniDbString(spec.id + '_mapping', sender, JSON.stringify({id: accountId, name: name}));
                reply(getLang(spec, 'register.success', name));
            }, 0);
        } else if ($.equalsIgnoreCase(action, 'unregister')) {
            $.inidb.del(spec.id + '_mapping', sender);
            reply(getLang(spec, 'unregister'));
        } else {
            reply(getLang(spec, 'usage'));
        }
    }

    /*
     * @event socialActivity
     */
    $.bind('socialActivity', function (event) {
        let spec = platforms[$.jsString(event.getPlatform())];

        // The item may have been polled only for Discord
        if (spec === undefined || !isEnabled(spec) || !$.getIniDbBoolean(spec.id, 'poll_' + $.jsString(event.getPollType()), false)) {
            return;
        }

        sayLine(formatItem(spec, 'announce.' + $.jsString(event.getType()), event.getText(), event.getAuthorName(), event.getUrl()));
    });

    /*
     * @event socialReposters
     */
    $.bind('socialReposters', function (event) {
        let spec = platforms[$.jsString(event.getPlatform())],
            accountIds = event.getAccountIds(),
            rewarded = [],
            now = $.systemTime();

        if (spec === undefined || !isEnabled(spec) || !$.getIniDbBoolean(spec.id, 'reward_toggle', false)) {
            return;
        }

        let points = $.getIniDbNumber(spec.id, 'reward_points', 0),
            cooldown = $.getIniDbFloat(spec.id, 'reward_cooldown', 0) * 36e5;

        if (points <= 0) {
            return;
        }

        for (let i = 0; i < accountIds.length; i++) {
            let user = findMappedUser(spec, $.jsString(accountIds[i]));

            if (user !== null && now - $.getIniDbNumber(spec.id + '_user_last_repost', user, 0) >= cooldown) {
                $.inidb.incr('points', user, points);
                $.inidb.set(spec.id + '_user_last_repost', user, now);
                rewarded.push($.username.resolve(user));
            }
        }

        if (rewarded.length > 0 && $.getIniDbBoolean(spec.id, 'reward_announce', false)) {
            $.say(getLang(spec, 'reward.announcement', rewarded.join(', '), $.getPointsString(points)));
        }
    });

    /*
     * @event twitchOnline
     * @usestransformers local global twitch noevent
     */
    $.bind('twitchOnline', function () {
        let now = $.systemTime();

        for (let id in platforms) {
            let spec = platforms[id];

            if (isEnabled(spec) && spec.api.isConfigured() && $.getIniDbBoolean(spec.id, 'post_online', false)
                    && now - $.getIniDbNumber(spec.id, 'last_onlinepost', 0) >= ONLINE_COOLDOWN) {
                $.inidb.set(spec.id, 'last_onlinepost', now);
                scheduleAutoPost(spec, 'message_online', ONLINE_POST_DELAY);
            }
        }
    });

    /*
     * @event twitchGameChange
     * @usestransformers local global twitch noevent
     */
    $.bind('twitchGameChange', function () {
        let now = $.systemTime();

        if (!$.isOnline($.channelName) || $.jsString($.twitchcache.getGameTitle()) === '') {
            return;
        }

        for (let id in platforms) {
            let spec = platforms[id];

            if (isEnabled(spec) && spec.api.isConfigured() && $.getIniDbBoolean(spec.id, 'post_gamechange', false)
                    && now - $.getIniDbNumber(spec.id, 'last_gamechange', 0) >= GAME_CHANGE_COOLDOWN) {
                $.inidb.set(spec.id, 'last_gamechange', now);
                scheduleAutoPost(spec, 'message_gamechange', 0);
            }
        }
    });

    /*
     * @event initReady
     */
    $.bind('initReady', function () {
        for (let id in platforms) {
            let spec = platforms[id];

            $.registerChatCommand(spec.script, spec.command, $.PERMISSION.Viewer);
            $.registerChatSubcommand(spec.command, 'set', $.PERMISSION.Admin);
            $.registerChatSubcommand(spec.command, 'post', $.PERMISSION.Admin);
            $.registerChatSubcommand(spec.command, 'usage', $.PERMISSION.Viewer);
            $.registerChatSubcommand(spec.command, 'id', $.PERMISSION.Viewer);
            $.registerChatSubcommand(spec.command, 'lastpost', $.PERMISSION.Viewer);
            $.registerChatSubcommand(spec.command, 'lastmention', $.PERMISSION.Viewer);
            $.registerChatSubcommand(spec.command, 'lastrepost', $.PERMISSION.Viewer);
            $.registerChatSubcommand(spec.command, 'register', $.PERMISSION.Viewer);
            $.registerChatSubcommand(spec.command, 'unregister', $.PERMISSION.Viewer);
        }

        setInterval(checkAutoUpdates, UPDATE_CHECK_INTERVAL, 'scripts::core::social.js::checkAutoUpdates');
    });

    $.social = {
        registerPlatform: registerPlatform,
        handleCommand: handleCommand,
        getLang: getLang
    };
})();
