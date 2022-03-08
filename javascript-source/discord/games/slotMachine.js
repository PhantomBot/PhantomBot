/*
 * Copyright (C) 2016-2022 phantombot.github.io/PhantomBot
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

(function() {
    var rewards = [],
        emojis = [];

    /**
     * @function loadRewards
     */
    function loadRewards() {
        rewards[0] = $.getSetIniDbNumber('discordSlotMachineReward', 'reward_0', 75);
        rewards[1] = $.getSetIniDbNumber('discordSlotMachineReward', 'reward_1', 150);
        rewards[2] = $.getSetIniDbNumber('discordSlotMachineReward', 'reward_2', 300);
        rewards[3] = $.getSetIniDbNumber('discordSlotMachineReward', 'reward_3', 450);
        rewards[4] = $.getSetIniDbNumber('discordSlotMachineReward', 'reward_4', 1000);
    }

    /**
     * @function loadEmojis
     */
    function loadEmojis() {
        emojis[0] = $.getSetIniDbString('discordSlotMachineEmojis', 'emoji_0', ':cherries:');
        emojis[1] = $.getSetIniDbString('discordSlotMachineEmojis', 'emoji_1', ':strawberry:');
        emojis[2] = $.getSetIniDbString('discordSlotMachineEmojis', 'emoji_2', ':tangerine:');
        emojis[3] = $.getSetIniDbString('discordSlotMachineEmojis', 'emoji_3', ':spades:');
        emojis[4] = $.getSetIniDbString('discordSlotMachineEmojis', 'emoji_4', ':hearts:');
    }

    /**
     * @function getEmoteKey
     *
     * @returns {Number}
     */
    function getEmoteKey() {
        var rand = $.randRange(1, 1000);

        if (rand <= 75) {
            return 4;
        } else if (rand > 75 && rand <= 200) {
            return 3;
        } else if (rand > 200 && rand <= 450) {
            return 2;
        } else if (rand > 450 && rand <= 700) {
            return 1;
        } else if (rand > 700) {
            return 0;
        }
    }

    /**
     * @function calculate
     *
     * @param {string} channel
     * @param {string} username
     * @param {string} mention
     * @param {string} twitchName
     */
    function calculate(channel, username, mention, twitchName) {
        var e1 = getEmoteKey(),
            e2 = getEmoteKey(),
            e3 = getEmoteKey(),
            message = $.lang.get('discord.slotmachine.result.start', $.discord.userPrefix(mention).replace(', ', ''), emojis[e1], emojis[e2], emojis[e3]);

        if (e1 == e2 && e2 == e3) {
            $.discord.say(channel, message + $.lang.get('discord.slotmachine.result.win', ($.getPointsString(rewards[e1]) + '.')) + $.gameMessages.getWin(username, 'slot'));
            $.inidb.incr('points', twitchName, rewards[e1]);
        } else if (e1 == e2 || (e2 == e3 && e3 == e1)) {
            $.discord.say(channel, message + $.lang.get('slotmachine.result.win', (e1 == e2 ? $.getPointsString(Math.floor(rewards[e1] * 0.3)) : $.getPointsString(Math.floor(rewards[e3] * 0.3))) + '.') + $.gameMessages.getWin(username, 'slot'));
            $.inidb.incr('points', twitchName, (e1 == e2 ? (Math.floor(rewards[e1] * 0.3)) : (Math.floor(rewards[e3] * 0.3))));
        } else {
            $.discord.say(channel, message + $.gameMessages.getLose(username, 'slot'));
        }
    }

    /**
     * @event discordChannelCommand
     */
    $.bind('discordChannelCommand', function(event) {
        var sender = event.getSender(),
            channel = event.getDiscordChannel(),
            command = event.getCommand(),
            mention = event.getMention(),
            args = event.getArgs(),
            action = args[0];

        /**
         * @discordcommandpath slot - Play the slot machines for some points.
         */
        if (command.equalsIgnoreCase('slot')) {
            if (action === undefined) {
                var twitchName = $.discord.resolveTwitchName(event.getSenderId());
                if (twitchName !== null) {
                    calculate(channel, sender, mention, twitchName);
                } else {
                    $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('discord.accountlink.usage.nolink'));
                }
            } else {
                /**
                 * @discordcommandpath slot rewards [rewards] - Sets the rewards for the slot machine
                 */
                if (action.equalsIgnoreCase('rewards')) {
                    if (args.length === 6 && !isNaN(parseInt(args[1])) && !isNaN(parseInt(args[2])) && !isNaN(parseInt(args[3])) && !isNaN(parseInt(args[4])) && !isNaN(parseInt(args[5]))) {
                        $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('discord.slotmachine.rewards.success'));
                        $.inidb.set('discordSlotMachineReward', 'reward_0', args[1]);
                        $.inidb.set('discordSlotMachineReward', 'reward_1', args[2]);
                        $.inidb.set('discordSlotMachineReward', 'reward_2', args[3]);
                        $.inidb.set('discordSlotMachineReward', 'reward_3', args[4]);
                        $.inidb.set('discordSlotMachineReward', 'reward_4', args[5]);
                        loadRewards();
                    } else {
                        $.discord.say(channel, $.discord.userPrefix(mention) + $.lang.get('discord.slotmachine.rewards.usage', rewards.join(' ')));
                    }
                }
            }
        }
    });

    /**
     * @event initReady
     */
    $.bind('initReady', function() {
        $.discord.registerCommand('./discord/games/slotMachine.js', 'slot', 0);
        $.discord.registerSubCommand('slot', 'rewards', 1);

        loadRewards();
        loadEmojis();
    });

    /**
     * @event webPanelSocketUpdate
     */
    $.bind('webPanelSocketUpdate', function(event) {
        if (event.getScript().equalsIgnoreCase('./discord/games/slotMachine.js')) {
            loadRewards();
            loadEmojis();
        }
    })
})();
