/* global Packages */

/**
 * promoteSystem.js
 *
 * TODO:
 * - Add controls to the Beta Panel once that is the formal release.
 *
 */
(function () {
    var showStats = $.getSetIniDbBoolean('promotesettings', 'showstats', true);
    var showBanner = $.getSetIniDbBoolean('promotesettings', 'showbanner', true);
    var promoteChannel = $.getSetIniDbString('promotesettings', 'channel', '');
    var streamChannel = $.getSetIniDbString('promotesettings', 'streamchannel', '');
    var allowSelfManage = $.getSetIniDbBoolean('promotesettings', 'allowselfmanage', true);
    var lastIdx = $.getSetIniDbNumber('promotesettings', 'lastidx', 0);
    var promoteInterval = $.getSetIniDbNumber('promotesettings', 'promoteinterval', 120);
    var promoteIntervalID = -1;
    var liveStreamers = {};

    /**
     * @event discordChannelCommand
     */
    $.bind('discordChannelCommand', function (event) {
        var channel = event.getDiscordChannel(),
                command = event.getCommand(),
                mention = event.getMention(),
                args = event.getArgs(),
                action = args[0];

        /*
         * @discordcommandpath promoteadm channel discord_channel - Channel to send promotion messages to.
         * @discordcommandpath promoteadm streamchannel discord_channel - Channel to send go-live messages to.
         * @discordcommandpath promoteadm toggleselfmanage - If you do not want people to add themselves.
         * @discordcommandpath promoteadm setinterval - Change the interval for promotion messages from 120 minutes to something else.
         * @discordcommandpath promoteadm togglestats - Show follow and view stats or not.
         * @discordcommandpath promoteadm togglebanner - Display the channel banner or not.
         * @discordcommandpath promoteadm so - Shout out a user.
         * @discordcommandpath promoteadm add - Add a user based on their Twitch channel.
         * @discordcommandpath promoteadm delete - Delete a user based on their Twitch channel.
         * @discordcommandpath promoteadm revoke - Revoke the privilege of a user to be able to promote themselves.
         * @discordcommandpath promoteadm allow - Allow a user to be able to promote themselves.
         * @discordcommandpath promoteadm list - List the users currently configured.
         * @discordcommandpath promote add - Add yourself if permitted to do so.
         * @discordcommandpath promote delete - Delete yourself if permitted to do so.
         */

        if (command.equalsIgnoreCase('promote')) {
            if (action === undefined) {
                $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('discord.promotesystem.cmd.promote.usage'));
                return;
            }

            if (action.equalsIgnoreCase('add') || action.equalsIgnoreCase('delete')) {
                if (!allowSelfManage) {
                    $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('discord.promotesystem.cmd.promote.noselfmanage'));
                    return;
                }
                if (promoteChannel.length === 0 && streamChannel.length === 0) {
                    $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('discord.promotesystem.cmd.promote.nochannels'));
                    return;
                }
                var twitchName = $.discord.resolveTwitchName(event.getSenderId());
                if (twitchName === null || twitchName === undefined) {
                    $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('discord.accountlink.usage.nolink'));
                    return;
                }
                var twitchID = $.username.getID(twitchName);
                if ($.inidb.exists('promoterevoke', twitchID)) {
                    $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('discord.promotesystem.cmd.promote.revoked'));
                    return;
                }
            }

            if (action.equalsIgnoreCase('add')) {
                if (args[1] === undefined) {
                    $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('discord.promotesystem.cmd.promote.add.nobio'));
                    return;
                }
                var biography = args.splice(1).join(' ');
                if (biography.equalsIgnoreCase('none')) {
                    biography = '';
                }
                $.inidb.set('promotebio', twitchID, biography);
                $.inidb.set('promoteids', twitchID, twitchName.toLowerCase());
                $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('discord.promotesystem.cmd.promote.add.success', twitchName.toLowerCase()));
                return;
            }

            if (action.equalsIgnoreCase('delete')) {
                $.inidb.del('promotebio', twitchID);
                $.inidb.del('promoteids', twitchID);
                $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('discord.promotesystem.cmd.promote.del.success', twitchName.toLowerCase()));
                return;
            }
        }

        if (command.equalsIgnoreCase('promoteadm')) {
            if (action === undefined) {
                $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('discord.promotesystem.cmd.promoteadm.usage'));
                return;
            }

            if ((action.equalsIgnoreCase('add') || action.equalsIgnoreCase('delete')) && (promoteChannel.length === 0 && streamChannel.length === 0)) {
                $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('discord.promotesystem.cmd.promoteadm.nochannels'));
                return;
            }

            if (action.equalsIgnoreCase('add')) {
                if (args[1] === undefined) {
                    $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('discord.promotesystem.cmd.promoteadm.add.nouser'));
                    return;
                }

                var twitchID;
                try {
                    twitchID = $.username.getID(args[1]);
                } catch (ex) {
                    if (ex.javaException === undefined || !ex.javaException.getMessage().contains("Illegal character in query")) {
                        throw ex;
                    }

                    twitchID = $.javaString('0');
                }
                if (twitchID.equals('0')) {
                    $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('discord.promotesystem.cmd.promoteadm.noacct', args[1]));
                    return;
                }
                if (args[2] === undefined) {
                    $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('discord.promotesystem.cmd.promoteadm.add.nobio'));
                    return;
                }
                var biography = args.splice(2).join(' ');
                if (biography.equalsIgnoreCase('none')) {
                    biography = '';
                }
                $.inidb.set('promotebio', twitchID, biography);
                $.inidb.set('promoteids', twitchID, args[1].toLowerCase());
                $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('discord.promotesystem.cmd.promoteadm.add.success', args[1].toLowerCase()));
                return;
            }

            if (action.equalsIgnoreCase('delete')) {
                if (args[1] === undefined) {
                    $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('discord.promotesystem.cmd.promoteadm.del.nouser'));
                    return;
                }

                var twitchID = $.username.getID(args[1]);
                if (twitchID.equals('0')) {
                    $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('discord.promotesystem.cmd.promoteadm.noacct'));
                    return;
                }

                $.inidb.del('promotebio', twitchID);
                $.inidb.del('promoteids', twitchID);
                $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('discord.promotesystem.cmd.promoteadm.del.success', args[1].toLowerCase()));
                return;
            }

            if (action.equalsIgnoreCase('channel')) {
                if (args[1] === undefined) {
                    $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('discord.promotesystem.cmd.promoteadm.channel.nochannel'));
                    return;
                }

                promoteChannel = $.discord.sanitizeChannelName(args[1]);
                if (promoteChannel.equals('clear')) {
                    $.inidb.set('promotesettings', 'channel', '');
                    $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('discord.promotesystem.cmd.promoteadm.channel.cleared'));
                } else {
                    $.inidb.set('promotesettings', 'channel', promoteChannel);
                    $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('discord.promotesystem.cmd.promoteadm.channel.success', args[1]));
                }
                return;
            }

            if (action.equalsIgnoreCase('streamchannel')) {
                if (args[1] === undefined) {
                    $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('discord.promotesystem.cmd.promoteadm.streamchannel.nochannel'));
                    return;
                }

                streamChannel = $.discord.sanitizeChannelName(args[1]);
                if (streamChannel.equals('clear')) {
                    streamChannel = '';
                    $.inidb.set('promotesettings', 'streamchannel', '');
                    $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('discord.promotesystem.cmd.promoteadm.streamchannel.cleared'));
                } else {
                    $.inidb.set('promotesettings', 'streamchannel', streamChannel);
                    $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('discord.promotesystem.cmd.promoteadm.streamchannel.success', args[1]));
                }
                return;
            }

            if (action.equalsIgnoreCase('revoke')) {
                if (args[1] === undefined) {
                    $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('discord.promotesystem.cmd.promoteadm.revoke.nouser'));
                    return;
                }

                var twitchID = $.username.getID(args[1]);
                if (twitchID.equals('0')) {
                    $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('discord.promotesystem.cmd.promoteadm.noacct', args[1]));
                    return;
                }

                $.inidb.del('promotebio', twitchID);
                $.inidb.del('promoteids', twitchID);
                $.inidb.set('promoterevoke', twitchID);
                $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('discord.promotesystem.cmd.promoteadm.revoke.success', args[1].toLowerCase()));
                return;
            }

            if (action.equalsIgnoreCase('allow')) {
                if (args[1] === undefined) {
                    $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('discord.promotesystem.cmd.promoteadm.allow.nouser'));
                    return;
                }

                var twitchID = $.username.getID(args[1]);
                if (twitchID.equals('0')) {
                    $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('discord.promotesystem.cmd.promoteadm.noacct', args[1]));
                    return;
                }

                $.inidb.del('promoterevoke', twitchID);
                $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('discord.promotesystem.cmd.promoteadm.allow.success', args[1].toLowerCase()));
                return;
            }

            if (action.equalsIgnoreCase('toggleselfmanage')) {
                if (allowSelfManage) {
                    $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('discord.promotesystem.cmd.promoteadm.toggleselfmanage.off'));
                } else {
                    $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('discord.promotesystem.cmd.promoteadm.toggleselfmanage.on'));
                }
                allowSelfManage = !allowSelfManage;
                $.setIniDbBoolean('promotesettings', 'allowselfmanage', allowSelfManage);
                return;
            }

            if (action.equalsIgnoreCase('togglestats')) {
                if (showStats) {
                    $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('discord.promotesystem.cmd.promoteadm.togglestats.off'));
                } else {
                    $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('discord.promotesystem.cmd.promoteadm.togglestats.on'));
                }
                showStats = !showStats;
                $.setIniDbBoolean('promotesettings', 'showstats', showStats);
                return;
            }

            if (action.equalsIgnoreCase('togglebanner')) {
                if (showBanner) {
                    $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('discord.promotesystem.cmd.promoteadm.togglebanner.off'));
                } else {
                    $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('discord.promotesystem.cmd.promoteadm.togglebanner.on'));
                }
                showBanner = !showBanner;
                $.setIniDbBoolean('promotesettings', 'showbanner', showBanner);
                return;
            }


            if (action.equalsIgnoreCase('list')) {
                var twitchIDs = $.inidb.GetKeyList('promoteids', '');
                if (twitchIDs.length === 0) {
                    $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('discord.promotesystem.cmd.promoteadm.list.empty'));
                    return;
                }

                var twitchNames = [];
                for (var i = 0; i < twitchIDs.length; i++) {
                    twitchNames.push($.inidb.get('promoteids', twitchIDs[i]));
                }

                $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('discord.promotesystem.cmd.promoteadm.list.success', twitchNames.join(', ')));
                return;
            }

            if (action.equalsIgnoreCase('setinterval')) {
                if (args[1] === undefined) {
                    $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('discord.promotesystem.cmd.promoteadm.setinterval.nominutes'));
                    return;
                }
                if (isNaN(args[1])) {
                    $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('discord.promotesystem.cmd.promoteadm.setinterval.nominutes'));
                    return;
                }
                var newPromoteInterval = parseInt(args[1]);
                if (newPromoteInterval < 15) {
                    $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('discord.promotesystem.cmd.promoteadm.setinterval.toolow'));
                    return;
                }
                $.setIniDbNumber('promotesettings', 'promoteinterval', newPromoteInterval);
                promoteInterval = newPromoteInterval;
                $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('discord.promotesystem.cmd.promoteadm.setinterval.success', promoteInterval));
                startPromote();
                return;
            }

            if (action.equalsIgnoreCase('so')) {
                if (args[1] === undefined) {
                    $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('discord.promotesystem.cmd.so.nouser'));
                    return;
                }
                var twitchID = $.inidb.GetKeyByValue('promoteids', '', args[1].toLowerCase());
                if (twitchID === null || twitchID === undefined) {
                    $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('discord.promotesystem.cmd.so.noexist'));
                    return;
                }

                var twitchName = $.inidb.get('promoteids', twitchID);
                var biography = $.inidb.get('promotebio', twitchID);
                if (biography.equals('')) {
                    biography = $.lang.get('discord.promotesystem.promotemsg.nobio');
                }
                $.discordAPI.sendMessageEmbed($.inidb.get('promotesettings', 'channel'), new Packages.tv.phantombot.discord.util.EmbedBuilder()
                        .withThumbnail('http://iotv.me/i/followontwitch.jpg')
                        .withTitle('https://twitch.tv/' + twitchName)
                        .withDesc($.lang.get('discord.promotesystem.promotemsg.description', $.username.resolve(twitchName)))
                        .withColor(31, 158, 242)
                        .appendField($.lang.get('discord.promotesystem.promotemsg.biography'), biography, true)
                        .withUrl('https://twitch.tv/' + twitchName).build());
            }
        }
    });

    /**
     * Check for online status of channels every minute.
     */
    setInterval(function () {
        if ($.inidb.get('promotesettings', 'streamchannel').equals('')) {
            return;
        }

        var twitchIDs = $.inidb.GetKeyList('promoteids', '');
        if (twitchIDs.length === 0) {
            return;
        }
        var start = 0;
        var end = 100;
        var total = twitchIDs.length;
        var seen = [];

        do {
            var queryString = twitchIDs.slice(start, end).join(',') + '&stream_type=live';
            var jsonObject = $.twitch.GetStreams(queryString);

            start += 100;
            end += 100;

            if (!jsonObject.has('streams')) {
                return;
            }

            var jsonStreams = jsonObject.getJSONArray('streams');
            var now = $.systemTime();
            for (var i = 0; i < jsonStreams.length(); i++) {
                var twitchID = $.jsString(jsonStreams.getJSONObject(i).getJSONObject('channel').getInt('_id').toString());
                var logoUrl = jsonStreams.getJSONObject(i).getJSONObject('channel').getString('logo');
                var game = jsonStreams.getJSONObject(i).getJSONObject('channel').getString('game');
                var title = jsonStreams.getJSONObject(i).getJSONObject('channel').getString('status');
                var twitchName = jsonStreams.getJSONObject(i).getJSONObject('channel').getString('display_name');
                var followers = jsonStreams.getJSONObject(i).getJSONObject('channel').getInt('followers');
                var views = jsonStreams.getJSONObject(i).getJSONObject('channel').getInt('views');
                var banner = null;
                if (jsonStreams.getJSONObject(i).getJSONObject('channel').has('profile_banner')) {
                    if (jsonStreams.getJSONObject(i).getJSONObject('channel').isNull('profile_banner')) {
                        banner = null;
                    } else {
                        banner = jsonStreams.getJSONObject(i).getJSONObject('channel').getString('profile_banner');
                    }
                }

                if (liveStreamers[twitchID] === undefined || liveStreamers[twitchID] === null) {
                    liveStreamers[twitchID] = {'lastseen': now, 'offline': 0, 'promoted': false};
                } else {
                    liveStreamers[twitchID]['lastseen'] = now;
                    liveStreamers[twitchID]['offline'] = 0;
                }

                seen.push(twitchID);

                if (title === null) {
                    title = $.lang.get('discord.promotesystem.livemsg.missingtitle');
                }

                if (game === null) {
                    game = $.lang.get('discord.promotesystem.livemsg.missinggame');
                }

                if (!liveStreamers[twitchID]['promoted']) {
                    if (now - $.getIniDbNumber('promoteonlinetime', twitchID, 0) >= (6e4 * 30)) {
                        liveStreamers[twitchID]['promoted'] = true;
                        $.inidb.set('promoteonlinetime', twitchID, now);
                        var embedBuilder = new Packages.tv.phantombot.discord.util.EmbedBuilder();
                        embedBuilder.withThumbnail(logoUrl)
                                .withTitle($.lang.get('discord.promotesystem.livemsg.title', $.username.resolve(twitchName), twitchName))
                                .withColor(100, 65, 164)
                                .withTimestamp(Date.now())
                                .appendField($.lang.get('discord.promotesystem.livemsg.nowplaying'), game, true)
                                .appendField($.lang.get('discord.promotesystem.livemsg.streamtitle'), title, true);

                        if (showStats) {
                            embedBuilder.appendField($.lang.get('discord.promotesystem.livemsg.followers'), followers, true)
                                    .appendField($.lang.get('discord.promotesystem.livemsg.views'), views, true);
                        }
                        if (banner !== null && showBanner) {
                            embedBuilder.withImage(banner);
                        }

                        embedBuilder.withFooterText($.inidb.get('promotebio', twitchID))
                                .withUrl('https://twitch.tv/' + twitchName);
                        $.discordAPI.sendMessageEmbed($.inidb.get('promotesettings', 'streamchannel'), embedBuilder.build());
                    }
                }
            }
        } while (start < total);

        for (var k in liveStreamers) {
            if (!seen.includes(k)) {
                liveStreamers[k]['offline']++;
            }
        }

        var temp = JSON.parse(JSON.stringify(liveStreamers));
        for (var k in temp) {
            if (temp[k]['offline'] > 5) {
                delete liveStreamers[k];
            }
        }
    }, 6e4, 'scripts::promote.js::checkstreams');

    /**
     * Send out biography information every so often.
     */
    function startPromote() {
        if (promoteIntervalID !== -1) {
            $.consoleLn('Restarting the Promotion Interval Handler');
            clearInterval(promoteIntervalID);
        }

        promoteIntervalID = setInterval(function () {
            if ($.inidb.get('promotesettings', 'channel').equals('')) {
                return;
            }

            var twitchIDs = $.inidb.GetKeyList('promoteids', '');
            if (twitchIDs.length === 0) {
                return;
            }

            if (++lastIdx >= twitchIDs.length) {
                lastIdx = 0;
            }
            $.setIniDbNumber('promotesettings', 'lastidx', lastIdx);

            var twitchName = $.inidb.get('promoteids', twitchIDs[lastIdx]);
            var biography = $.inidb.get('promotebio', twitchIDs[lastIdx]);
            if (biography.equals('')) {
                biography = $.lang.get('discord.promotesystem.promotemsg.nobio');
            }
            $.discordAPI.sendMessageEmbed($.inidb.get('promotesettings', 'channel'), new Packages.tv.phantombot.discord.util.EmbedBuilder()
                    .withThumbnail('https://raw.githubusercontent.com/PhantomBot/Miscellaneous/master/Discord-Embed-Icons/followontwitch.jpg')
                    .withTitle('https://twitch.tv/' + twitchName)
                    .withDesc($.lang.get('discord.promotesystem.promotemsg.description', $.username.resolve(twitchName)))
                    .withColor(31, 158, 242)
                    .appendField($.lang.get('discord.promotesystem.promotemsg.biography'), biography, true)
                    .withUrl('https://twitch.tv/' + twitchName).build());
        }, promoteInterval * 6e4, 'scripts::promote.js::biography');
    }

    /**
     * @event initReady
     */
    $.bind('initReady', function () {
        $.discord.registerCommand('./discord/systems/promoteSystem.js', 'promote', 0);
        $.discord.registerCommand('./discord/systems/promoteSystem.js', 'promoteadm', 1);
        $.discord.registerSubCommand('promote', 'add', 0);
        $.discord.registerSubCommand('promote', 'delete', 0);
        $.discord.registerSubCommand('promoteadm', 'add', 1);
        $.discord.registerSubCommand('promoteadm', 'delete', 1);
        $.discord.registerSubCommand('promoteadm', 'channel', 1);
        $.discord.registerSubCommand('promoteadm', 'streamchannel', 1);
        $.discord.registerSubCommand('promoteadm', 'revoke', 1);
        $.discord.registerSubCommand('promoteadm', 'allow', 1);
        $.discord.registerSubCommand('promoteadm', 'toggleselfmanage', 1);
        $.discord.registerSubCommand('promoteadm', 'list', 1);
        $.discord.registerSubCommand('promoteadm', 'setinterval', 1);
        $.discord.registerSubCommand('promoteadm', 'togglestats', 1);
        $.discord.registerSubCommand('promoteadm', 'togglebanner', 1);
        $.discord.registerSubCommand('promoteadm', 'so', 1);

        startPromote();
    });
})();
