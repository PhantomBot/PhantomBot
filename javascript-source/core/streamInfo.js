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
    var count = 1;
    var gamesPlayed;

    $.bind('eventSubChannelUpdate', function (event) {
        if ($.jsString(event.event().broadcasterUserId()) === $.jsString($.username.getIDCaster())) {
            $.twitchcache.setStreamStatus(event.event().title());
            $.twitchcache.setGameTitle(event.event().categoryName());
        }
    });

    $.bind('eventSubStreamOnline', function (event) {
        if ($.jsString(event.event().broadcasterUserId()) === $.jsString($.username.getIDCaster())) {
            $.twitchcache.syncOnline();
        }
    });

    $.bind('eventSubStreamOffline', function (event) {
        if ($.jsString(event.event().broadcasterUserId()) === $.jsString($.username.getIDCaster())) {
            $.twitchcache.goOffline(true);
        }
    });

    $.bind('eventSubWelcome', function (event) {
        if (!event.isReconnect()) {
            let subscriptions = [
                Packages.com.gmt2001.twitch.eventsub.subscriptions.channel.ChannelUpdate,
                Packages.com.gmt2001.twitch.eventsub.subscriptions.stream.StreamOnline,
                Packages.com.gmt2001.twitch.eventsub.subscriptions.stream.StreamOffline
            ];

            for (let i in subscriptions) {
                let newSubscription = new subscriptions[i]($.username.getIDCaster());
                try {
                    newSubscription.create().block();
                } catch (ex) {
                    $.log.error(ex);
                }
            }
        }
    });

    /**
     * @event twitchOnline
     */
    $.bind('twitchOnline', function (event) {
        if (($.systemTime() - $.inidb.get('panelstats', 'playTimeReset')) >= (480 * 6e4)) {
            var uptime = getStreamUptimeSeconds($.channelName);
            $.inidb.set('panelstats', 'gameCount', 1);
            count = $.inidb.get('panelstats', 'gameCount');
            $.inidb.del('streamInfo', 'gamesPlayed');
            $.inidb.set('panelstats', 'playTimeStart', $.systemTime());
            $.inidb.set('panelstats', 'playTimeReset', $.systemTime());
            $.inidb.set('streamInfo', 'gamesPlayed', (count + ': ' + $.twitchcache.getGameTitle() + ' - ' + (uptime / 3600 < 10 ? '0' : '') + Math.floor(uptime / 3600) + ':' + ((uptime % 3600) / 60 < 10 ? '0' : '') + Math.floor((uptime % 3600) / 60) + '='));
        }
    });

    /**
     * @event twitchOffline
     */
    $.bind('twitchOffline', function (event) {
        if (($.systemTime() - $.inidb.get('panelstats', 'playTimeReset')) >= (480 * 6e4)) {
            $.inidb.set('panelstats', 'playTimeStart', 0);
            $.inidb.set('panelstats', 'playTimeReset', 0);
            $.inidb.set('panelstats', 'gameCount', 1);
            $.inidb.del('streamInfo', 'gamesPlayed');
        }
        $.inidb.set('streamInfo', 'downtime', String($.systemTime()));
    });

    /**
     * @event twitchGameChange
     */
    $.bind('twitchGameChange', function (event) {
        var uptime = getStreamUptimeSeconds($.channelName);

        if ($.isOnline($.channelName)) {
            $.inidb.set('panelstats', 'playTimeStart', $.systemTime());
            if ($.inidb.exists('streamInfo', 'gamesPlayed')) {
                $.inidb.incr('panelstats', 'gameCount', 1);
                count = $.inidb.get('panelstats', 'gameCount');
                gamesPlayed = $.inidb.get('streamInfo', 'gamesPlayed');
                gamesPlayed += (count + ': ' + $.twitchcache.getGameTitle() + ' - ' + (uptime / 3600 < 10 ? '0' : '') + Math.floor(uptime / 3600) + ':' + ((uptime % 3600) / 60 < 10 ? '0' : '') + Math.floor((uptime % 3600) / 60) + '=');
                $.inidb.set('streamInfo', 'gamesPlayed', gamesPlayed);
            } else {
                count = $.inidb.get('panelstats', 'gameCount');
                $.inidb.set('streamInfo', 'gamesPlayed', (count + ': ' + $.twitchcache.getGameTitle() + ' - ' + (uptime / 3600 < 10 ? '0' : '') + Math.floor(uptime / 3600) + ':' + ((uptime % 3600) / 60 < 10 ? '0' : '') + Math.floor((uptime % 3600) / 60) + '='));
            }
        }
    });

    /**
     * @function getGamesPlayed()
     * @export $
     * @return string
     */
    function getGamesPlayed() {
        if ($.inidb.exists('streamInfo', 'gamesPlayed')) {
            var games = $.inidb.get('streamInfo', 'gamesPlayed'),
                    string = games.split('=').join(', ');

            return string;
        }
        return '';
    }

    /**
     * @function getPlayTime()
     * @export $
     */
    function getPlayTime() {
        var playTime = parseInt($.inidb.get('panelstats', 'playTimeStart')),
                time;

        if (playTime) {
            time = ($.systemTime() - playTime);
            return $.getTimeStringMinutes(time / 1000);
        } else {
            return null;
        }
    }

    /**
     * @function isOnline
     * @export $
     * @param {string} channelName
     * @returns {boolean}
     */
    function isOnline(channelName) {
        if ($.twitchcache !== undefined && $.twitchcache !== null && $.twitchCacheReady && channelName.equalsIgnoreCase($.channelName)) {
            return $.twitchcache.isStreamOnline();
        } else {
            return !$.twitch.GetStream(channelName).isNull('stream');
        }
    }

    /**
     * @function getStatus
     * @export $
     * @param {string} channelName
     * @returns {string}
     */
    function getStatus(channelName) {
        if ($.twitchCacheReady && channelName.equalsIgnoreCase($.channelName)) {
            return ($.twitchcache.getStreamStatus() + '');
        } else {
            var channelData = $.twitch.GetChannel(channelName);

            if (!channelData.isNull('status') && channelData.getInt('_http') === 200) {
                return channelData.getString('status');
            } else if (channelData.isNull('status') && channelData.getInt('_http') === 200) {
                return $.lang.get('common.twitch.no.status');
            }
            $.log.error('Failed to get the current status: ' + channelData.optString('message', 'no message'));
            return '';
        }
    }

    /**
     * @function getGame
     * @export $
     * @param channelName
     * @returns {string}
     */
    function getGame(channelName) {
        if ($.twitchCacheReady && channelName.equalsIgnoreCase($.channelName)) {
            return ($.twitchcache.getGameTitle() + '');
        } else {
            var channelData = $.twitch.GetChannel(channelName);

            if (!channelData.isNull('game') && channelData.getInt('_http') === 200) {
                return channelData.getString("game");
            } else if (channelData.isNull('game') && channelData.getInt('_http') === 200) {
                return $.lang.get('common.twitch.no.game');
            }

            if (!channelData.isNull('message')) {
                $.log.error('Failed to get the current game: ' + channelData.getString('message'));
            }
            return '';
        }
    }

    /**
     * @function getLogo
     * @export $
     * @param channelName
     * @returns {Url}
     */
    function getLogo(channelName) {
        var channel = $.twitch.GetChannel(channelName);

        if (!channel.isNull('logo') && channel.getInt('_http') === 200) {
            return channel.getString('logo');
        } else {
            return 0;
        }
    }

    /**
     * @function getStreamUptimeSeconds
     * @export $
     * @param channelName
     * @returns {number}
     */
    function getStreamUptimeSeconds(channelName) {
        if ($.twitchCacheReady && channelName.equalsIgnoreCase($.channelName)) {
            return $.twitchcache.getStreamUptimeSeconds();
        } else {
            var stream = $.twitch.GetStream(channelName),
                    now = new Date(),
                    createdAtDate,
                    time;

            if (stream.isNull('stream')) {
                return 0;
            }

            createdAtDate = new Date(stream.getJSONObject('stream').getString('created_at'));
            if (createdAtDate) {
                time = (now - createdAtDate);
                return Math.floor(time / 1000);
            } else {
                return 0;
            }
        }
    }

    /**
     * @function getStreamUptime
     * @export $
     * @param channelName
     * @returns {string}
     */
    function getStreamUptime(channelName) {
        if ($.twitchCacheReady && channelName.equalsIgnoreCase($.channelName)) {
            var uptime = $.twitchcache.getStreamUptimeSeconds();

            if (uptime === 0) {
                $.consoleLn("Fallback uptime");
                var stream = $.twitch.GetStream(channelName),
                        now = new Date(),
                        createdAtDate,
                        time;

                if (stream.isNull('stream')) {
                    return '';
                }

                createdAtDate = new Date(stream.getJSONObject('stream').getString('created_at'));
                time = (now - createdAtDate);
                return $.getTimeString(time / 1000);
            }
            return $.getTimeString(uptime);
        } else {
            var stream = $.twitch.GetStream(channelName),
                    now = new Date(),
                    createdAtDate,
                    time;

            if (stream.isNull('stream')) {
                return '';
            }

            createdAtDate = new Date(stream.getJSONObject('stream').getString('created_at'));
            if (createdAtDate) {
                time = now - createdAtDate;
                return $.getTimeString(time / 1000);
            } else {
                return '';
            }
        }
    }

    /**
     * @function getStreamDownTime
     * @export $
     * @returns {string}
     */
    function getStreamDownTime() {
        var now = $.systemTime(),
                down = $.inidb.get('streamInfo', 'downtime'),
                time;

        if (down > 0) {
            time = (now - down);
            return $.getTimeString(time / 1000);
        }
        return 0;
    }

    /**
     * @function getStreamStartedAt
     * @export $
     * @param channelName
     * @returns {string}
     */
    function getStreamStartedAt(channelName) {
        if ($.twitchCacheReady && channelName.equalsIgnoreCase($.channelName)) {
            if ($.jsString($.twitchcache.isStreamOnlineString()) === 'false') {
                return 'Stream is offline';
            }
            createdAtDate = new Date($.twitchcache.getStreamCreatedAt() + '');
            return $.dateToString(createdAtDate);
        } else {
            var stream = $.twitch.GetStream(channelName),
                    createdAtDate;

            if (stream.isNull('stream')) {
                return 0;
            }

            createdAtDate = new Date(stream.getJSONObject('stream').getString('created_at'));
            return $.dateToString(createdAtDate);
        }
    }

    /**
     * @function getViewers
     * @export $
     * @param channelName
     * @returns {Number}
     */
    function getViewers(channelName) {
        if ($.twitchCacheReady && channelName.equalsIgnoreCase($.channelName)) {
            return $.twitchcache.getViewerCount();
        } else {
            var stream = $.twitch.GetStream(channelName);

            if (!stream.isNull('stream') && stream.getInt('_http') === 200) {
                return stream.getJSONObject('stream').getInt('viewers');
            } else {
                return 0;
            }
        }
    }

    /**
     * @function getFollows
     * @export $
     * @param channelName
     * @returns {Number}
     */
    function getFollows(channelName) {
        var channel = $.twitch.GetChannel(channelName);

        if (!channel.isNull('followers') && channel.getInt('_http') === 200) {
            return channel.getInt('followers');
        } else {
            return 0;
        }
    }

    /**
     * @function getFollowDate
     * @export $
     * @param username
     * @param channelName
     */
    function getFollowDate(sender, username, channelName) {
        username = $.user.sanitize(username);
        channelName = $.user.sanitize(channelName);

        var user = $.twitch.GetUserFollowsChannel(username, channelName);

        if (user.getInt('_http') === 404) {
            return $.lang.get('followhandler.follow.age.datefmt.404');
        }

        var date = Packages.java.time.ZonedDateTime.parse(user.getString('created_at'), Packages.java.time.format.DateTimeFormatter.ISO_OFFSET_DATE_TIME);
        return date.format(Packages.java.time.format.DateTimeFormatter.ofPattern($.lang.get('followhandler.follow.age.datefmt')));
    }

    /**
     * @function getFollowAge
     * @export $
     * @param username
     * @param channelName
     */
    function getFollowAge(sender, username, channelName) {
        username = $.user.sanitize(username);
        channelName = $.user.sanitize(channelName);

        var user = $.twitch.GetUserFollowsChannel(username, channelName);

        if (user.getInt('_http') === 404) {
            $.say($.lang.get('followhandler.follow.age.err.404', $.userPrefix(sender, true), username, channelName));
            return;
        }

        var date = Packages.java.time.ZonedDateTime.parse(user.getString('created_at'), Packages.java.time.format.DateTimeFormatter.ISO_OFFSET_DATE_TIME);
        var dateFinal = date.format(Packages.java.time.format.DateTimeFormatter.ofPattern("MMMM dd', 'yyyy"));
        var days = Packages.java.time.Duration.between(date, Packages.java.time.ZonedDateTime.now()).toDays();

        if (days > 0) {
            $.say($.lang.get('followhandler.follow.age.time.days', $.userPrefix(sender, true), username, channelName, dateFinal, days));
        } else {
            $.say($.lang.get('followhandler.follow.age.time', $.userPrefix(sender, true), username, channelName, dateFinal));
        }
    }

    /**
     * @function getChannelAge
     * @export $
     * @param event
     */
    function getChannelAge(event) {
        var channelData = $.twitch.GetChannel((!event.getArgs()[0] ? event.getSender() : $.user.sanitize(event.getArgs()[0])));

        if (channelData.getInt('_http') === 404 || !channelData.getBoolean('_success')) {
            $.say($.userPrefix(event.getSender(), true) + $.lang.get('channel.age.user.404'));
            return;
        }

        var date = Packages.java.time.ZonedDateTime.parse(channelData.getString('created_at'), Packages.java.time.format.DateTimeFormatter.ISO_OFFSET_DATE_TIME);
        var dateFinal = date.format(Packages.java.time.format.DateTimeFormatter.ofPattern("MMMM dd', 'yyyy"));
        var days = Packages.java.time.Duration.between(date, Packages.java.time.ZonedDateTime.now()).toDays();

        if (days > 0) {
            $.say($.lang.get('common.get.age.days', $.userPrefix(event.getSender(), true), (!event.getArgs()[0] ? event.getSender() : $.user.sanitize(event.getArgs()[0])), dateFinal, days));
        } else {
            $.say($.lang.get('common.get.age', $.userPrefix(event.getSender(), true), (!event.getArgs()[0] ? event.getSender() : $.user.sanitize(event.getArgs()[0])), dateFinal));
        }
    }

    /**
     * @function getChannelCreatedZonedDateTime
     * @export $
     * @param event
     */
    function getChannelCreatedZonedDateTime(channel) {
        var channelData = $.twitch.GetChannel($.user.sanitize(channel));

        if (channelData.getInt('_http') === 404 || !channelData.getBoolean('_success')) {
            return null;
        }

        return Packages.java.time.ZonedDateTime.parse(channelData.getString('created_at'), Packages.java.time.format.DateTimeFormatter.ISO_OFFSET_DATE_TIME);
    }

    /**
     * @function getSubscriberCount
     * @export $
     * @return {number} count
     */
    function getSubscriberCount() {
        var jsonObject = $.twitch.GetChannelSubscriptions($.channelName.toLowerCase(), 100, null);

        if (jsonObject.getInt('_http') !== 200) {
            return 0;
        }

        return jsonObject.getInt('_total');
    }

    /**
     * @function updateGame
     * @export $
     * @param {string} channelName
     * @param {string} game
     * @param {string} sender
     * @param {boolean} silent
     */
    function updateGame(channelName, game, sender, silent) {
        try {
            var http = $.twitch.UpdateChannel(channelName, '', game);
        } catch (e) {
            $.log.error('Failed to change the game. Twitch does not recognize it.');
        }

        if (http.getBoolean('_success')) {
            if (http.getInt('_http') === 200) {
                if (!silent) {
                    $.say($.lang.get('common.game.change', http.getString('game')));
                }

                $.twitchcache.setGameTitle(http.getString('game'));
                $.inidb.set('streamInfo', 'game', http.getString('game'));
                $.log.event($.username.resolve(sender) + ' changed the current game to ' + http.getString('game'));
                if ($.bot.isModuleEnabled('./commands/deathctrCommand.js')) {
                    $.deathUpdateFile(game);
                }
            } else {
                $.log.error('Failed to change the game. The Twitch API might be having issues.');
                $.log.error(http.getString('message'));
            }
        } else {
            $.log.error('Failed to change the game. Make sure you have your api oauth code set to the caster.');
            $.log.error(http.getString('_exception') + ' ' + http.getString('_exceptionMessage'));
        }
    }

    /**
     * @function updateStatus
     * @export $
     * @param {string} channelName
     * @param {string} status
     * @param {string} sender
     * @param {boolean} silent
     */
    function updateStatus(channelName, status, sender, silent) {
        var http = $.twitch.UpdateChannel(channelName, status, '');

        if (http.getBoolean('_success')) {
            if (http.getInt('_http') === 200) {
                if (!silent) {
                    $.say($.lang.get('common.title.change', http.getString('status')));
                }
                $.twitchcache.setStreamStatus(http.getString('status'));
                $.inidb.set('streamInfo', 'title', http.getString('status'));
                $.log.event(sender + ' changed the current status to ' + http.getString('status'));
            } else {
                $.log.error('Failed to change the status. The Twitch API might be having issues.');
                $.log.error(http.getString('message'));
            }
        } else {
            $.log.error('Failed to change the status. Make sure you have your api oauth code set to the caster.');
            $.log.error(http.getString('_exception') + ' ' + http.getString('_exceptionMessage'));
        }
    }

    /** Export functions to API */
    $.getPlayTime = getPlayTime;
    $.getFollows = getFollows;
    $.getGame = getGame;
    $.getLogo = getLogo;
    $.getStatus = getStatus;
    $.getStreamStartedAt = getStreamStartedAt;
    $.getStreamUptime = getStreamUptime;
    $.getStreamUptimeSeconds = getStreamUptimeSeconds;
    $.getViewers = getViewers;
    $.isOnline = isOnline;
    $.updateGame = updateGame;
    $.updateStatus = updateStatus;
    $.getFollowAge = getFollowAge;
    $.getFollowDate = getFollowDate;
    $.getChannelAge = getChannelAge;
    $.getChannelCreatedZonedDateTime = getChannelCreatedZonedDateTime;
    $.getStreamDownTime = getStreamDownTime;
    $.getGamesPlayed = getGamesPlayed;
    $.getSubscriberCount = getSubscriberCount;
})();
