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

// Function that querys all of the data we need.
$(function() {
    // Get all module toggles.
    socket.getDBValues('discord_games_get_modules', {
        tables: ['modules', 'modules', 'modules', 'modules', 'modules', 'modules', 'modules'],
        keys: ['./discord/games/gambling.js', './discord/games/kill.js', './discord/games/random.js',
               './discord/games/roll.js', './discord/games/roulette.js', './discord/games/slotMachine.js',
               './discord/games/8ball.js']
    }, true, function(results) {
        // Handle the settings button.
        let keys = Object.keys(results),
            module = '',
            i;

        for (i = 0; i < keys.length; i++) {
            // Handle the status of the buttons.
            if (results[keys[i]] === 'false') {
                module = keys[i].substring(keys[i].lastIndexOf('/') + 1).replace('.js', '');

                // Handle the switch.
                $('#discord_' + module + 'Toggle').prop('checked', false);
                // Handle the settings button.
                $('#discord_' + module + 'Settings').prop('disabled', true);
            }
        }
    });
});

// Function that handlers the loading of events.
$(function() {
    // Module toggle for games.
    $('[data-game-toggle]').on('change', function() {
        let name = $(this).attr('id'),
            checked = $(this).is(':checked');

        // Handle the module.
        socket.sendCommandSync('discord_game_module_toggle', 'module ' + (checked ? 'enablesilent' : 'disablesilent') + ' ' + $(this).data('game-toggle'), function() {
            // Toggle the settings button.
            $('#' + name.replace('Toggle', 'Settings')).prop('disabled', !checked);
            // Alert the user.
            toastr.success('Successfully ' + (checked ? 'enabled' : 'disabled') + ' the game module!');
        });
    });

    // Role settings.
    $('#discord_rollSettings').on('click', function() {
        socket.getDBValues('discord_get_roll_settings', {
            tables: ['discordRollReward', 'discordRollReward', 'discordRollReward',
                    'discordRollReward', 'discordRollReward', 'discordRollReward'],
            keys: ['rewards_0', 'rewards_1', 'rewards_2', 'rewards_3', 'rewards_4', 'rewards_5']
        }, true, function(e) {
            helpers.getModal('roll-settings', 'Dice Roll Settings', 'Save', $('<form/>', {
                'role': 'form'
            })
            // Add the reward 1.
            .append(helpers.getInputGroup('reward-1', 'number', 'Double 1s Reward', '', e.rewards_0, 'Reward for rolling double 1s.'))
            // Add the reward 2.
            .append(helpers.getInputGroup('reward-2', 'number', 'Double 2s Reward', '', e.rewards_1, 'Reward for rolling double 2s.'))
            // Add the reward 3.
            .append(helpers.getInputGroup('reward-3', 'number', 'Double 3s Reward', '', e.rewards_2, 'Reward for rolling double 3s.'))
            // Add the reward 4.
            .append(helpers.getInputGroup('reward-4', 'number', 'Double 4s Reward', '', e.rewards_3, 'Reward for rolling double 4s.'))
            // Add the reward 5.
            .append(helpers.getInputGroup('reward-5', 'number', 'Double 5s Reward', '', e.rewards_4, 'Reward for rolling double 5s.'))
            // Add the reward 6.
            .append(helpers.getInputGroup('reward-6', 'number', 'Double 6s Reward', '', e.rewards_5, 'Reward for rolling double 6s.')),
            function() { // Callback for when the user clicks save.
                let values = [];

                // Get all rewards
                for (let i = 1; i <= 6; i++) {
                    let valObj = $('#reward-' + i);

                    if (!helpers.handleInputNumber(valObj, 0)) {
                        return;
                    }
                    values.push(valObj.val());
                }

                // Update the rewards.
                socket.updateDBValues('roll_update_settings', {
                    tables: ['discordRollReward', 'discordRollReward', 'discordRollReward', 'discordRollReward',
                            'discordRollReward', 'discordRollReward'],
                    keys: ['rewards_0', 'rewards_1', 'rewards_2', 'rewards_3', 'rewards_4', 'rewards_5'],
                    values: values
                }, function() {
                    // Close the modal.
                    $('#roll-settings').modal('toggle');
                    // Alert the user.
                    toastr.success('Successfully updated the dice roll settings!');
                });
            }).modal('toggle');
        });
    });

    // Slot machine settings.
    $('#discord_slotMachineSettings').on('click', function() {
        socket.getDBValues('get_slot_machine_settings', {
            tables: ['discordSlotMachineReward', 'discordSlotMachineReward', 'discordSlotMachineReward', 'discordSlotMachineReward',
                    'discordSlotMachineReward', 'discordSlotMachineEmojis', 'discordSlotMachineEmojis', 'discordSlotMachineEmojis',
                    'discordSlotMachineEmojis', 'discordSlotMachineEmojis'],
            keys: ['reward_0', 'reward_1', 'reward_2', 'reward_3', 'reward_4', 'emoji_0', 'emoji_1', 'emoji_2', 'emoji_3', 'emoji_4']
        }, true, function(e) {
            helpers.getModal('slotmachine-game', 'Slot Machine Settings', 'Save', $('<form/>', {
                'role': 'form'
            })
            // Add the div for the col boxes.
            .append($('<div/>', {
                'class': 'panel-group',
                'id': 'accordion'
            })
            // Append first collapsible accordion.
            .append(helpers.getCollapsibleAccordion('main-1', 'Reward Settings', $('<form/>', {
                    'role': 'form'
                })
                // Add the reward 1 slot.
                .append(helpers.getInputGroup('reward-1', 'number', 'Slot Reward One', '', e.reward_0, 'Reward for the first slot.'))
                // Add the reward 2 slot.
                .append(helpers.getInputGroup('reward-2', 'number', 'Slot Reward Two', '', e.reward_1, 'Reward for the second slot.'))
                // Add the reward 3 slot.
                .append(helpers.getInputGroup('reward-3', 'number', 'Slot Reward Three', '', e.reward_2, 'Reward for the third slot.'))
                // Add the reward 4 slot.
                .append(helpers.getInputGroup('reward-4', 'number', 'Slot Reward Four', '', e.reward_3, 'Reward for the forth slot.'))
                // Add the reward 5 slot.
                .append(helpers.getInputGroup('reward-5', 'number', 'Slot Reward Five', '', e.reward_4, 'Reward for the fifth slot.'))))
            // Append second collapsible accordion.
            .append(helpers.getCollapsibleAccordion('main-2', 'Emoji Settings', $('<form/>', {
                    'role': 'form'
                })
                // Add the emoji 1 slot.
                .append(helpers.getInputGroup('emoji-1', 'text', 'Slot emoji One', '', e.emoji_0, 'emoji for the first slot.'))
                // Add the emoji 2 slot.
                .append(helpers.getInputGroup('emoji-2', 'text', 'Slot emoji Two', '', e.emoji_1, 'emoji for the second slot.'))
                // Add the emoji 3 slot.
                .append(helpers.getInputGroup('emoji-3', 'text', 'Slot emoji Three', '', e.emoji_2, 'emoji for the third slot.'))
                // Add the emoji 4 slot.
                .append(helpers.getInputGroup('emoji-4', 'text', 'Slot emoji Four', '', e.emoji_3, 'emoji for the forth slot.'))
                // Add the emoji 5 slot.
                .append(helpers.getInputGroup('emoji-5', 'text', 'Slot emoji Five', '', e.emoji_4, 'emoji for the fifth slot.'))))),
            function() { // Callback for when the user clicks save.
                let values = [];

                // Get all prices.
                for (let i = 1; i <= 5; i++) {
                    let valObj = $('#reward-' + i);

                    if (!helpers.handleInputNumber(valObj, 0)) {
                        return;
                    }
                    values.push(valObj.val());
                }

                // Get all emojis.
                for (let i = 1; i <= 5; i++) {
                    let valObj = $('#emoji-' + i);

                    if (!helpers.handleInputString(valObj)) {
                        return;
                    }
                    values.push(valObj.val());
                }

                // Update settings.
                socket.updateDBValues('update_slot_settings', {
                    tables: ['discordSlotMachineReward', 'discordSlotMachineReward', 'discordSlotMachineReward', 'discordSlotMachineReward',
                            'discordSlotMachineReward', 'discordSlotMachineEmojis', 'discordSlotMachineEmojis',
                            'discordSlotMachineEmojis', 'discordSlotMachineEmojis', 'discordSlotMachineEmojis'],
                    keys: ['reward_0', 'reward_1', 'reward_2', 'reward_3', 'reward_4', 'emoji_0', 'emoji_1', 'emoji_2', 'emoji_3', 'emoji_4'],
                    values: values
                }, function() {
                    // Close the modal.
                    $('#slotmachine-game').modal('toggle');
                    // Alert the user.
                    toastr.success('Successfully updated the slot machine settings!');
                });
            }).modal('toggle');
        });
    });

    // Gambling settings.
    $('#discord_gamblingSettings').on('click', function() {
        socket.getDBValues('get_gambling_settings', {
            tables: ['discordGambling', 'discordGambling', 'discordGambling', 'discordGambling'],
            keys: ['winGainPercent', 'winRange', 'max', 'min']
        }, true, function(e) {
            helpers.getModal('gambling-settings', 'Gambling Settings', 'Save', $('<form/>', {
                'role': 'form'
            })
            // Add the gambling gain percent.
            .append(helpers.getInputGroup('gambling-gain', 'number', 'Gambling Gain Percent', '', e.winGainPercent,
                'How many points are given based on what the user gambled. The gambled amount is always given back.'))
            // Add the gambling win range.
            .append(helpers.getInputGroup('gambling-range', 'number', 'Gambling Winning Range', '', e.winRange,
                'The winning range of the gambling game. Anything gambled below this number will be a lost. Maximum is 100.'))
            // Add the gambling max.
            .append(helpers.getInputGroup('gambling-max', 'number', 'Gambling Maximum Amount', '', e.max,
                'The maximum amount of points that can be gambled at once.'))
            // Add the gambling min.
            .append(helpers.getInputGroup('gambling-min', 'number', 'Gambling Minimum Amount', '', e.min,
                'The minimum amount of points that can be gambled at once.')),
            function() { // Callback once the user clicks save.
                let winGain = $('#gambling-gain'),
                    winRange = $('#gambling-range'),
                    max = $('#gambling-max'),
                    min = $('#gambling-min');

                switch (false) {
                    case helpers.handleInputNumber(winGain, 1, 100):
                    case helpers.handleInputNumber(winRange, 1, 100):
                    case helpers.handleInputNumber(max, 1):
                    case helpers.handleInputNumber(min, 1):
                        break;
                    default:
                        socket.updateDBValues('update_gambling_settings', {
                            tables: ['discordGambling', 'discordGambling', 'discordGambling', 'discordGambling'],
                            keys: ['winGainPercent', 'winRange', 'max', 'min'],
                            values: [winGain.val(), winRange.val(), max.val(), min.val()]
                        }, function() {
                            socket.wsEvent('update_gambling_settings_cmd', './discord/games/gambling.js', '', [], function() {
                                // Close the modal.
                                $('#gambling-settings').modal('toggle');
                                // Alert the user.
                                toastr.success('Successfully updated gambling settings!');
                            });
                        });
                }
            }).modal('toggle');
        });
    });
});
