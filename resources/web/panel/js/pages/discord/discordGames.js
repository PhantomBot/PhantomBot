/*
 * Copyright (C) 2016-2020 phantom.bot
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
            toastr.success('Das Spielmodul wurde erfolgreich ' + (checked ? 'aktiviert' : 'deaktiviert') + '!');
        });
    });

    // Role settings.
    $('#discord_rollSettings').on('click', function() {
        socket.getDBValues('discord_get_roll_settings', {
            tables: ['discordRollReward', 'discordRollReward', 'discordRollReward',
                    'discordRollReward', 'discordRollReward', 'discordRollReward'],
            keys: ['rewards_0', 'rewards_1', 'rewards_2', 'rewards_3', 'rewards_4', 'rewards_5']
        }, true, function(e) {
            helpers.getModal('roll-settings', 'Würfelwurf Einstellungen', 'Speichern', $('<form/>', {
                'role': 'form'
            })
            // Add the reward 1.
            .append(helpers.getInputGroup('reward-1', 'number', 'Doppelte 1er Belohnung', '', e.rewards_0, 'Belohnung für den Wurf von doppelten 1er.'))
            // Add the reward 2.
            .append(helpers.getInputGroup('reward-2', 'number', 'Doppelte 2er Belohnung', '', e.rewards_1, 'Belohnung für den Wurf von doppelten 2er.'))
            // Add the reward 3.
            .append(helpers.getInputGroup('reward-3', 'number', 'Doppelte 3er Belohnung', '', e.rewards_2, 'Belohnung für den Wurf von doppelten 3er.'))
            // Add the reward 4.
            .append(helpers.getInputGroup('reward-4', 'number', 'Doppelte 4er Belohnung', '', e.rewards_3, 'Belohnung für den Wurf von doppelten 4er.'))
            // Add the reward 5.
            .append(helpers.getInputGroup('reward-5', 'number', 'Doppelte 5er Belohnung', '', e.rewards_4, 'Belohnung für den Wurf von doppelten 5er.'))
            // Add the reward 6.
            .append(helpers.getInputGroup('reward-6', 'number', 'Doppelte 6er Belohnung', '', e.rewards_5, 'Belohnung für den Wurf von doppelten 6er.')),
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
                    toastr.success('Würfelwurf-Einstellungen erfolgreich aktualisiert!');
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
            helpers.getModal('slotmachine-game', 'Slot Machine Einstellungen', 'Speichern', $('<form/>', {
                'role': 'form'
            })
            // Add the div for the col boxes.
            .append($('<div/>', {
                'class': 'panel-group',
                'id': 'accordion'
            })
            // Append first collapsible accordion.
            .append(helpers.getCollapsibleAccordion('main-1', 'Belohnungseinstellungen', $('<form/>', {
                    'role': 'form'
                })
                // Add the reward 1 slot.
                .append(helpers.getInputGroup('reward-1', 'number', 'Slot Eins Belohnung', '', e.reward_0, 'Belohnung für den ersten Slot.'))
                // Add the reward 2 slot.
                .append(helpers.getInputGroup('reward-2', 'number', 'Slot Zwei Belohnung', '', e.reward_1, 'Belohnung für den zweiten Slot.'))
                // Add the reward 3 slot.
                .append(helpers.getInputGroup('reward-3', 'number', 'Slot Drei Belohnung', '', e.reward_2, 'Belohnung für den dritten Slot.'))
                // Add the reward 4 slot.
                .append(helpers.getInputGroup('reward-4', 'number', 'Slot Vier Belohnung', '', e.reward_3, 'Belohnung für den vierten Slot.'))
                // Add the reward 5 slot.
                .append(helpers.getInputGroup('reward-5', 'number', 'Slot Fünf Belohnung', '', e.reward_4, 'Belohnung für den fünften Slot.'))))
            // Append second collapsible accordion.
            .append(helpers.getCollapsibleAccordion('main-2', 'Emoji-Einstellungen', $('<form/>', {
                    'role': 'form'
                })
                // Add the emoji 1 slot.
                .append(helpers.getInputGroup('emoji-1', 'text', 'Slot Eins Emoji', '', e.emoji_0, 'Emoji für den ersten Slot.'))
                // Add the emoji 2 slot.
                .append(helpers.getInputGroup('emoji-2', 'text', 'Slot Zwei Emoji', '', e.emoji_1, 'Emoji für den zweiten Slot.'))
                // Add the emoji 3 slot.
                .append(helpers.getInputGroup('emoji-3', 'text', 'Slot Drei Emoji', '', e.emoji_2, 'Emoji für den dritten Slot.'))
                // Add the emoji 4 slot.
                .append(helpers.getInputGroup('emoji-4', 'text', 'Slot Vier Emoji', '', e.emoji_3, 'Emoji für den vierten Slot.'))
                // Add the emoji 5 slot.
                .append(helpers.getInputGroup('emoji-5', 'text', 'Slot Fünf Emoji', '', e.emoji_4, 'Emoji für den fünften Slot.'))))),
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
                    toastr.success('Slot Machine Einstellungen erfolgreich aktualisiert!');
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
            helpers.getModal('gambling-settings', 'Glücksspieleinstellungen', 'Speichern', $('<form/>', {
                'role': 'form'
            })
            // Add the gambling gain percent.
            .append(helpers.getInputGroup('gambling-gain', 'number', 'Prozentsatz der Gewinnspanne', '', e.winGainPercent,
                'Wie viele Punkte werden vergeben, je nachdem, was der Benutzer gespielt hat. Der gespielte Betrag wird immer zurückgegeben.'))
            // Add the gambling win range.
            .append(helpers.getInputGroup('gambling-range', 'number', 'Gewinnspanne für Glücksspiele', '', e.winRange,
                'Die Gewinnspanne des Glücksspiels. Alles, was unter dieser Zahl gespielt wird, ist verloren. Das Maximum ist 100.'))
            // Add the gambling max.
            .append(helpers.getInputGroup('gambling-max', 'number', 'Glücksspielbetrag', '', e.max,
                'Die maximale Anzahl von Punkten, die auf einmal gespielt werden können.'))
            // Add the gambling min.
            .append(helpers.getInputGroup('gambling-min', 'number', 'Mindestbetrag für Glücksspiele', '', e.min,
                'Die Mindestpunktzahl, die auf einmal gespielt werden kann.')),
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
                                toastr.success('Glücksspiel-Einstellungen erfolgreich aktualisiert!');
                            });
                        });
                }
            }).modal('toggle');
        });
    });
});
