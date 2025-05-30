/*
 * Copyright (C) 2016-2024 phantombot.github.io/PhantomBot
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
 * Handles linking of a Discord account to a Twitch account.
 *
 */
(function () {
    let accounts = {};

    /**
     * @function resolveTwitchName
     *
     * @export $.discord
     * @param {string} userId (snowflake)
     * @return {string or null}
     */
    function resolveTwitchName(userId) {
        let id = $.optIniDbString('discordToTwitch', userId);

        if (id.isPresent()) {
            return $.viewer.lookupLoginById(id.get());
        }

        return null;
    }

    /**
     * @function twitchToDiscord
     *
     * @export $.discord
     * @param {string} name Twitch login name
     * @return {string or null} (snowflake)
     */
    function twitchToDiscord(username) {
        let id = $.viewer.lookupIdByLogin(username);

        if (id === null) {
            return null;
        }

        return $.getIniDbString('twitchToDiscord', id);
    }

    /**
     * @event discordChannelCommand
     */
    $.bind('discordChannelCommand', function (event) {
        let user = event.getDiscordUser(),
                channel = event.getDiscordChannel(),
                command = event.getCommand(),
                mention = event.getMention(),
                args = event.getArgs(),
                action = args[0];

        /**
         * @discordcommandpath account - Checks the current account linking status of the sender.
         */
        if ($.equalsIgnoreCase(command, 'account')) {
            let userId = event.getSenderId(),
                    id = $.optIniDbString('discordToTwitch', userId);

            if (action === undefined) {
                if (id.isPresent()) {
                    let name = $.viewer.lookupLoginById(id.get());
                    $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('discord.accountlink.usage.link', name));
                } else {
                    $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('discord.accountlink.usage.nolink'));
                }

                /**
                 * @discordcommandpath account link - Starts the process of linking an account. Completing this will overwrite existing links
                 */
            } else if ($.equalsIgnoreCase(action, 'link')) {
                let code = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_+',
                        text = '',
                        i;

                for (i = 0; i < 10; i++) {
                    text += code.charAt(Math.floor(Math.random() * code.length));
                }

                accounts[userId] = {
                    userObj: user,
                    time: $.systemTime(),
                    code: text
                };

                if (id.isPresent()) {
                    $.discordAPI.sendPrivateMessage(user, $.lang.get('discord.accountlink.link.relink', $.channelName, text));
                } else {
                    $.discordAPI.sendPrivateMessage(user, $.lang.get('discord.accountlink.link', $.channelName, text));
                }
                /**
                 * @discordcommandpath account remove - Removes account links from the sender.
                 */
            } else if ($.equalsIgnoreCase(action, 'remove')) {
                if (id.isPresent()) {
                    $.inidb.del('discordToTwitch', userId);
                    $.inidb.del('twitchToDiscord', id.get());
                    $.discordAPI.sendPrivateMessage(user, $.lang.get('discord.accountlink.link.remove'));
                } else {
                    $.discordAPI.sendPrivateMessage(user, $.lang.get('discord.accountlink.usage.nolink'));
                }
            }
        }
    });

    /**
     * @event command
     */
    $.bind('command', function (event) {
        let sender = event.getSender(),
                command = event.getCommand(),
                args = event.getArgs(),
                action = args[0];

        /**
         * @commandpath account link [code] - Completes an account link for Discord.
         */
        if ($.equalsIgnoreCase(command, 'account')) {
            if (action !== undefined && $.equalsIgnoreCase(action, 'link')) {
                if (args[1] === undefined || $.jsString(args[1]).length < 10) {
                    $.say($.whisperPrefix(sender) + $.lang.get('discord.accountlink.link.fail'));
                    return;
                }

                let keys = Object.keys(accounts),
                        i;

                for (i in keys) {
                    if (accounts[keys[i]].code === $.jsString(args[1]) && (accounts[keys[i]].time + 6e5) > $.systemTime()) {
                        let id = $.viewer.lookupIdByLogin(sender);
                        $.inidb.set('discordToTwitch', keys[i], id);
                        $.inidb.set('twitchToDiscord', id, keys[i]);

                        $.discordAPI.sendPrivateMessage(accounts[keys[i]].userObj, $.lang.get('discord.accountlink.link.success', sender.toLowerCase()));
                        delete accounts[keys[i]];
                        return;
                    }
                }

                $.say($.whisperPrefix(sender) + $.lang.get('discord.accountlink.link.fail'));
            }
        }
    });

    /**
     * @event initReady
     */
    $.bind('initReady', function () {
        $.discord.registerCommand('./discord/core/accountLink.js', 'account', 0);
        $.discord.registerSubCommand('accountlink', 'link', 0);
        $.discord.registerSubCommand('accountlink', 'remove', 0);
        // This is used to verify your account from Twitch. Do not remove it.
        $.registerChatCommand('./discord/core/accountLink.js', 'account', 7);


        // Interval to clear our old codes that have not yet been registered.
        setInterval(function () {
            let keys = Object.keys(accounts),
                    i;

            for (i in keys) {
                if ((accounts[keys[i]].time + 6e5) < $.systemTime()) {
                    delete accounts[keys[i]];
                }
            }
        }, 6e4, 'scripts::discord::core::accountLink.js');
    });

    /* Export the function to the $.discord api. */
    $.discord.resolveTwitchName = resolveTwitchName;
    $.discord.twitchToDiscord = twitchToDiscord;
})();
