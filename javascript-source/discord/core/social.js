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
 * Shared Discord side of the social media integrations: announcements as embeds, and the
 * toggle, channel and announce commands. A platform's Discord module registers itself with
 * $.discordSocial.registerPlatform and forwards its events to $.discordSocial.
 *
 * Discord chooses its own kinds of activity and channels, apart from Twitch chat. Settings in discordSettings,
 * for platform bluesky and poll type mentions:
 *   blueskyToggle            Discord announcements are on
 *   blueskyChannel           the default channel
 *   blueskyAnnounceMentions  announce that poll type
 *   blueskyChannelMentions   the channel for that poll type; empty for the default channel
 * Channels are saved as ids, as the panel's channel selector saves them.
 */
(function () {
    let platforms = {};

    /*
     * @function capitalize
     * @param {String} id a poll type id
     * @return {String} the id with its first letter in upper case, as used in setting names
     */
    function capitalize(id) {
        return id.substring(0, 1).toUpperCase() + id.substring(1);
    }

    /*
     * @function registerPlatform
     * @export $.discordSocial
     * @param {Object} spec {id, command, script, color}: the platform id (as in $.socialPlatforms), its Discord command,
     *                      its module script and the embed color as [red, green, blue]
     * @return {Object} the spec, with the platform added as spec.api
     */
    function registerPlatform(spec) {
        spec.api = $.socialPlatforms.get(spec.id);
        spec.name = $.jsString(spec.api.getDisplayName());
        spec.pollTypes = [];
        $.getSetIniDbBoolean('discordSettings', spec.id + 'Toggle', false);
        $.getSetIniDbString('discordSettings', spec.id + 'Channel', '');

        for (let i = 0; i < spec.api.getPollTypes().size(); i++) {
            let id = $.jsString(spec.api.getPollTypes().get(i).id());

            spec.pollTypes.push(id);
            $.getSetIniDbBoolean('discordSettings', spec.id + 'Announce' + capitalize(id), false);
            $.getSetIniDbString('discordSettings', spec.id + 'Channel' + capitalize(id), '');
        }

        platforms[spec.id] = spec;
        return spec;
    }

    /*
     * @function getPollType
     * @param {Object} spec
     * @param {String} id
     * @return {String} the poll type id as the platform spells it; null if the platform has none with that id
     */
    function getPollType(spec, id) {
        for (let i = 0; i < spec.pollTypes.length; i++) {
            if ($.equalsIgnoreCase(spec.pollTypes[i], id)) {
                return spec.pollTypes[i];
            }
        }

        return null;
    }

    /*
     * @function sanitize
     * @param {String} text
     * @return {String} the text without mentions that would ping a Discord server
     */
    function sanitize(text) {
        return $.jsString(text).replace(/(@everyone|@here|<@&\d+>|<@!?\d+>|<#\d+>)/ig, '');
    }

    /*
     * @function findChannelId
     * @param {String} channel a channel name, id or mention
     * @return {String} the channel id; null if there is no such channel
     */
    function findChannelId(channel) {
        let found = null;

        try {
            // A channel mention (<#id>) is reduced to its id first; the lookup matches a name or an id
            found = $.discordAPI.getChannel($.discord.sanitizeChannelName($.jsString(channel)));
        } catch (e) {
            found = null;
        }

        return found === null || found === undefined ? null : $.jsString(found.getId().asString());
    }

    /*
     * @function showChannel
     * @param {Object} spec
     * @param {String} channelId a saved channel id; empty for the default channel
     * @return {String} the channel as a Discord channel link
     */
    function showChannel(spec, channelId) {
        return channelId === '' ? $.social.getLang(spec, 'discord.channel.default') : '<#' + channelId + '>';
    }

    /*
     * @function announce
     * @export $.discordSocial
     * @param {Object} spec
     * @param {Object} event the socialActivity event
     */
    function announce(spec, event) {
        let pollType = $.jsString(event.getPollType()),
            channel = $.getIniDbString('discordSettings', spec.id + 'Channel' + capitalize(pollType), ''),
            type = $.jsString(event.getType()),
            text = sanitize(event.getText()),
            url = $.jsString(event.getUrl());

        if (channel === '') {
            channel = $.getIniDbString('discordSettings', spec.id + 'Channel', '');
        }

        if (!$.equalsIgnoreCase(event.getPlatform(), spec.id) || !$.getIniDbBoolean('discordSettings', spec.id + 'Toggle', false)
                || !$.getIniDbBoolean('discordSettings', spec.id + 'Announce' + capitalize(pollType), false) || channel === '') {
            return;
        }

        let embed = new Packages.tv.phantombot.discord.util.EmbedBuilder()
                .withColor(spec.color[0], spec.color[1], spec.color[2])
                .withAuthorName($.social.getLang(spec, 'discord.embed.' + type))
                .withTitle('@' + $.jsString(spec.api.getAccountName()))
                .withDescription(type === 'post' ? text + '\n' + url : '**@' + sanitize(event.getAuthorName()) + '**: ' + text + '\n' + url)
                .withTimestamp(Date.now())
                .withFooterText(spec.name);

        if (spec.api.isConfigured()) {
            embed.withUrl($.jsString(spec.api.getProfileUrl()));
        }

        $.discordAPI.sendMessageEmbed(channel, embed.build());
    }

    /*
     * @function handleChannelCommand
     * @param {Object} spec
     * @param {Array} args the arguments after "channel"
     * @return {String} the reply
     */
    function handleChannelCommand(spec, args) {
        let pollType = getPollType(spec, args[0]),
            channelId;

        if (args[0] === undefined) {
            return $.social.getLang(spec, 'discord.channel.usage', spec.pollTypes.join(' | '));
        }

        if (pollType === null) {
            channelId = findChannelId(args[0]);

            if (channelId === null) {
                return $.social.getLang(spec, 'discord.channel.notfound', $.discord.sanitizeChannelName($.jsString(args[0])));
            }

            $.setIniDbString('discordSettings', spec.id + 'Channel', channelId);
            return $.social.getLang(spec, 'discord.channel.set', showChannel(spec, channelId));
        }

        let key = spec.id + 'Channel' + capitalize(pollType);

        if (args[1] === undefined) {
            return $.social.getLang(spec, 'discord.channel.type.usage', pollType, showChannel(spec, $.getIniDbString('discordSettings', key, '')));
        } else if ($.equalsIgnoreCase(args[1], 'default')) {
            $.setIniDbString('discordSettings', key, '');
            return $.social.getLang(spec, 'discord.channel.type.set', pollType, showChannel(spec, ''));
        }

        channelId = findChannelId(args[1]);

        if (channelId === null) {
            return $.social.getLang(spec, 'discord.channel.notfound', $.discord.sanitizeChannelName($.jsString(args[1])));
        }

        $.setIniDbString('discordSettings', key, channelId);
        return $.social.getLang(spec, 'discord.channel.type.set', pollType, showChannel(spec, channelId));
    }

    /*
     * @function handleAnnounceCommand
     * @param {Object} spec
     * @param {Array} args the arguments after "announce"
     * @return {String} the reply
     */
    function handleAnnounceCommand(spec, args) {
        let pollType = getPollType(spec, args[0]);

        if (pollType === null) {
            return $.social.getLang(spec, 'discord.announce.usage', spec.pollTypes.join(' | '));
        }

        let key = spec.id + 'Announce' + capitalize(pollType),
            onOff = $.equalsIgnoreCase(args[1], 'on') ? true : ($.equalsIgnoreCase(args[1], 'off') ? false : null);

        if (onOff === null) {
            return $.social.getLang(spec, 'discord.announce.type.usage', pollType,
                    $.lang.get($.getIniDbBoolean('discordSettings', key, false) ? 'common.enabled' : 'common.disabled'),
                    $.social.getLang(spec, 'polltype.' + pollType));
        }

        $.setIniDbBoolean('discordSettings', key, onOff);
        return $.social.getLang(spec, 'discord.announce.success', pollType, $.lang.get(onOff ? 'common.enabled' : 'common.disabled'));
    }

    /*
     * @function handleCommand
     * @export $.discordSocial
     * @param {Object} spec
     * @param {Object} event the discordChannelCommand event
     */
    function handleCommand(spec, event) {
        let channel = event.getDiscordChannel(),
            args = event.getArgs(),
            action = args[0],
            reply = function (message) {
                $.discord.say(channel, $.discord.userPrefix(event.getMention()) + message);
            };

        if (!$.equalsIgnoreCase(event.getCommand(), spec.command)) {
            return;
        }

        if ($.equalsIgnoreCase(action, 'toggle')) {
            let toggle = !$.getIniDbBoolean('discordSettings', spec.id + 'Toggle', false);
            $.setIniDbBoolean('discordSettings', spec.id + 'Toggle', toggle);
            reply($.social.getLang(spec, 'discord.toggle', $.lang.get(toggle ? 'common.enabled' : 'common.disabled')));
        } else if ($.equalsIgnoreCase(action, 'channel')) {
            reply(handleChannelCommand(spec, args.slice(1)));
        } else if ($.equalsIgnoreCase(action, 'announce')) {
            reply(handleAnnounceCommand(spec, args.slice(1)));
        } else {
            reply($.social.getLang(spec, 'discord.usage'));
        }
    }

    /*
     * @event discordReady
     */
    $.bind('discordReady', function () {
        for (let id in platforms) {
            let spec = platforms[id];

            $.discord.registerCommand(spec.script, spec.command, 1);
            $.discord.registerSubCommand(spec.command, 'toggle', 1);
            $.discord.registerSubCommand(spec.command, 'channel', 1);
            $.discord.registerSubCommand(spec.command, 'announce', 1);
        }
    });

    $.discordSocial = {
        registerPlatform: registerPlatform,
        announce: announce,
        handleCommand: handleCommand
    };
})();
