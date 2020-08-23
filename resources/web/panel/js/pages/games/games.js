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
    socket.getDBValues('games_get_modules', {
        tables: ['modules', 'modules', 'modules', 'modules', 'modules', 'modules', 'modules', 'modules'],
        keys: ['./games/adventureSystem.js', './games/gambling.js', './games/killCommand.js', './games/random.js', './games/roll.js',
                './games/roulette.js', './games/slotMachine.js', './games/8ball.js']
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
                $('#' + module + 'Toggle').prop('checked', false);
                // Handle the settings button.
                $('#' + module + 'Settings').prop('disabled', true);
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
        socket.sendCommandSync('game_module_toggle', 'module ' + (checked ? 'enablesilent' : 'disablesilent') + ' ' + $(this).data('game-toggle'), function() {
            // Toggle the settings button.
            $('#' + name.replace('Toggle', 'Settings')).prop('disabled', !checked);
            // Alert the user.
            toastr.success('Das Spielmodul wurde erfolgreich ' + (checked ? 'aktiviert' : 'deaktiviert') + '!');
        });
    });

    // Adventure settings.
    $('#adventureSystemSettings').on('click', function() {
        socket.getDBValues('get_adventure_settings', {
            tables: ['adventureSettings', 'adventureSettings', 'adventureSettings', 'adventureSettings', 'adventureSettings', 'adventureSettings',
                    'adventureSettings', 'adventureSettings'],
            keys: ['joinTime', 'coolDown', 'gainPercent', 'minBet', 'maxBet', 'enterMessage', 'warningMessage', 'coolDownAnnounce']
        }, true, function(e) {
            helpers.getModal('adventure-settings', 'Abenteuer-Einstellungen', 'Speichern', $('<form/>', {
                'role': 'form'
            })
            // Add the toggle the entry messages.
            .append(helpers.getDropdownGroup('entry-messages', 'Abenteuer-Eintrittsnachrichten aktivieren', (e.enterMessage === 'true' ? 'Ja' : 'Nein'), ['Ja', 'Nein'],
                'Soll eine Nachricht gesendet werden, wenn ein Benutzer dem Abenteuer beitritt?'))
            // Add the toggle the entry messages.
            .append(helpers.getDropdownGroup('user-messages', 'Abenteuer-Warnmeldungen aktivieren', (e.warningMessage === 'true' ? 'Ja' : 'Nein'), ['Ja', 'Nein'],
                'Soll eine Nachricht gesendet werden, wenn ein Benutzer bereits eingetragen ist?'))
            // Add the toggle the cooldown message.
            .append(helpers.getDropdownGroup('cooldown-message', 'Abklingnachricht für Abenteuer aktivieren', (e.coolDownAnnounce === 'true' ? 'Ja' : 'Nein'), ['Ja', 'Nein'],
                'Wenn eine Nachricht gesendet werden soll, wenn das Abenteuer nicht mehr abklingt.'))
            // Add the the box for the join time.
            .append(helpers.getInputGroup('join-time', 'number', 'Abenteuer Teilnahmezeit (Sekunden)', '', e.joinTime, 'Wie lange, in Sekunden, können Benutzer an dem Abenteuer teilnehmen.'))
            // Add the the box for the cooldown.
            .append(helpers.getInputGroup('cooldown-time', 'number', 'Abenteuer Abklingzeit (Sekunden)', '', e.coolDown,
                'Wie lange Benutzer in Sekunden warten müssen, bevor sie ein neues Abenteuer beginnen, nachdem eines vorbei ist.'))
            // Add the the box for gain.
            .append(helpers.getInputGroup('gain', 'number', 'Abenteuer Gewinnprozentsatz', '', e.gainPercent,
                'Wie viele Punkte ein Benutzer erhält, basierend auf dem Betrag, mit dem er sich registriert hat. Der Beitrittsbetrag wird immer zurückgezahlt.'))
            // Add the the box for min bet.
            .append(helpers.getInputGroup('min-bet', 'number', 'Abenteuer-Mindest Einsatz', '', e.minBet, 'Die Mindestpunktzahl, mit der ein Benutzer einem Abenteuer beitreten kann.'))
            // Add the the box for max bet.
            .append(helpers.getInputGroup('max-bet', 'number', 'Maximaler Abenteuer-Einsatz', '', e.maxBet, 'Die maximale Anzahl von Punkten, mit denen ein Benutzer einem Abenteuer beitreten kann.')),
            function() { // Callback once the user clicks save.
                let entryMessages = $('#entry-messages').find(':selected').text() === 'Ja',
                    userMessages = $('#user-messages').find(':selected').text() === 'Ja',
                    cooldownMessage = $('#cooldown-message').find(':selected').text() === 'Ja',
                    joinTime = $('#join-time'),
                    cooldownTime = $('#cooldown-time'),
                    gainPercent = $('#gain'),
                    minBet = $('#min-bet'),
                    maxBet = $('#max-bet');

                // Make sure everything has been filled in.
                switch (false) {
                    case helpers.handleInputNumber(joinTime, 30):
                    case helpers.handleInputNumber(cooldownTime, 10):
                    case helpers.handleInputNumber(gainPercent, 1):
                    case helpers.handleInputNumber(joinTime, 30):
                    case helpers.handleInputNumber(minBet, 1):
                    case helpers.handleInputNumber(maxBet, 1):
                        break;
                    default:
                        socket.updateDBValues('adventure_update_settings', {
                            tables: ['adventureSettings', 'adventureSettings', 'adventureSettings', 'adventureSettings', 'adventureSettings', 'adventureSettings',
                                    'adventureSettings', 'adventureSettings'],
                            keys: ['joinTime', 'coolDown', 'gainPercent', 'minBet', 'maxBet', 'enterMessage', 'warningMessage', 'coolDownAnnounce'],
                            values: [joinTime.val(), cooldownTime.val(), gainPercent.val(), minBet.val(), maxBet.val(), entryMessages, userMessages, cooldownMessage]
                        }, function() {
                            socket.sendCommand('adventure_update_settings_cmd', 'reloadadventure', function() {
                                // Close the modal.
                                $('#adventure-settings').modal('toggle');
                                // Alert the user.
                                toastr.success('Abenteuer-Einstellungen erfolgreich aktualisiert!');
                            });
                        });
                }
            }).modal('toggle');
        });
    });

    // Roulette settings.
    $('#rouletteSettings').on('click', function() {
        socket.getDBValue('get_roulette_settings', 'roulette', 'timeoutTime', function(e) {
            helpers.getModal('roulette-settings', 'Roulette-Einstellungen', 'Speichern', $('<form/>', {
                'role': 'form'
            })
            // Add the box timeout time
            .append(helpers.getInputGroup('timeout-time', 'number', 'Roulette Timeout Zeit (Sekunden)', '', e.roulette, 'Wie lange in Sekunden ein Benutzer beim Verlieren ein Timeout erhält.')),
            function() { // Callback once the user clicks save.
                let timeoutTime = $('#timeout-time');

                switch (false) {
                    case helpers.handleInputNumber(timeoutTime, 1):
                        break;
                    default:
                        socket.updateDBValue('update_roulette_settings', 'roulette', 'timeoutTime', timeoutTime.val(), function() {
                            socket.sendCommand('update_roulette_settings_cmd', 'reloadroulette', function() {
                                // Close the modal.
                                $('#roulette-settings').modal('toggle');
                                // Alert the user.
                                toastr.success('Roulette-Einstellungen erfolgreich aktualisiert!');
                            });
                        });
                }
            }).modal('toggle');
        });
    });

    // Slot machine settings.
    $('#slotMachineSettings').on('click', function() {
        socket.getDBValues('get_slot_machine_settings', {
            tables: ['slotmachine', 'slotmachine', 'slotmachine', 'slotmachine', 'slotmachine', 'slotmachineemotes', 'slotmachineemotes', 'slotmachineemotes',
                    'slotmachineemotes', 'slotmachineemotes'],
            keys: ['prizes_0', 'prizes_1', 'prizes_2', 'prizes_3', 'prizes_4', 'emote_0', 'emote_1', 'emote_2', 'emote_3', 'emote_4']
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
                .append(helpers.getInputGroup('reward-1', 'number', 'Slot Eins Belohnung', '', e.prizes_0, 'Belohnung für den ersten Slot.'))
                // Add the reward 2 slot.
                .append(helpers.getInputGroup('reward-2', 'number', 'Slot Zwei Belohnung', '', e.prizes_1, 'Belohnung für den zweiten Slot.'))
                // Add the reward 3 slot.
                .append(helpers.getInputGroup('reward-3', 'number', 'Slot Drei Belohnung', '', e.prizes_2, 'Belohnung für den dritten Slot.'))
                // Add the reward 4 slot.
                .append(helpers.getInputGroup('reward-4', 'number', 'Slot Vier Belohnung', '', e.prizes_3, 'Belohnung für den vierten Slot.'))
                // Add the reward 5 slot.
                .append(helpers.getInputGroup('reward-5', 'number', 'Slot Fünf Belohnung', '', e.prizes_4, 'Belohnung für den fünften Slot.'))))
            // Append second collapsible accordion.
            .append(helpers.getCollapsibleAccordion('main-2', 'Emote-Einstellungen', $('<form/>', {
                    'role': 'form'
                })
                // Add the emote 1 slot.
                .append(helpers.getInputGroup('emote-1', 'text', 'Slot Eins Emote', '', e.emote_0, 'Emote für den ersten Slot.'))
                // Add the emote 2 slot.
                .append(helpers.getInputGroup('emote-2', 'text', 'Slot Zwei Emote', '', e.emote_1, 'Emote für den zweiten Slot.'))
                // Add the emote 3 slot.
                .append(helpers.getInputGroup('emote-3', 'text', 'Slot Drei Emote', '', e.emote_2, 'Emote für den dritten Slot.'))
                // Add the emote 4 slot.
                .append(helpers.getInputGroup('emote-4', 'text', 'Slot Vier Emote', '', e.emote_3, 'Emote für den vierten Slot.'))
                // Add the emote 5 slot.
                .append(helpers.getInputGroup('emote-5', 'text', 'Slot Fünf Emote', '', e.emote_4, 'Emote für den fünften Slot.'))))),
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

                // Get all emotes.
                for (let i = 1; i <= 5; i++) {
                    let valObj = $('#emote-' + i);

                    if (!helpers.handleInputString(valObj)) {
                        return;
                    }
                    values.push(valObj.val());
                }

                // Update settings.
                socket.updateDBValues('update_slot_settings', {
                    tables: ['slotmachine', 'slotmachine', 'slotmachine', 'slotmachine', 'slotmachine', 'slotmachineemotes', 'slotmachineemotes',
                            'slotmachineemotes', 'slotmachineemotes', 'slotmachineemotes'],
                    keys: ['prizes_0', 'prizes_1', 'prizes_2', 'prizes_3', 'prizes_4', 'emote_0', 'emote_1', 'emote_2', 'emote_3', 'emote_4'],
                    values: values
                }, function() {
                    // Close the modal.
                    $('#slotmachine-game').modal('toggle');
                    // Alert the user.
                    toastr.success('Slot-Maschinen-Einstellungen erfolgreich aktualisiert!');
                });
            }).modal('toggle');
        });
    });

    // Role settings.
    $('#rollSettings').on('click', function() {
        socket.getDBValues('get_roll_settings', {
            tables: ['rollprizes', 'rollprizes', 'rollprizes', 'rollprizes', 'rollprizes', 'rollprizes'],
            keys: ['prizes_0', 'prizes_1', 'prizes_2', 'prizes_3', 'prizes_4', 'prizes_5']
        }, true, function(e) {
            helpers.getModal('roll-settings', 'Würfelwurf Einstellungen', 'Speichern', $('<form/>', {
                'role': 'form'
            })
            // Add the reward 1.
            .append(helpers.getInputGroup('reward-1', 'number', 'Doppelte 1er-Belohnung', '', e.prizes_0, 'Belohnung für den Wurf von doppelten 1ern.'))
            // Add the reward 2.
            .append(helpers.getInputGroup('reward-2', 'number', 'Doppelte 2er-Belohnung', '', e.prizes_1, 'Belohnung für den Wurf von doppelten 2ern.'))
            // Add the reward 3.
            .append(helpers.getInputGroup('reward-3', 'number', 'Doppelte 3er-Belohnung', '', e.prizes_2, 'Belohnung für den Wurf von doppelten 3ern.'))
            // Add the reward 4.
            .append(helpers.getInputGroup('reward-4', 'number', 'Doppelte 4er-Belohnung', '', e.prizes_3, 'Belohnung für den Wurf von doppelten 4ern.'))
            // Add the reward 5.
            .append(helpers.getInputGroup('reward-5', 'number', 'Doppelte 5er-Belohnung', '', e.prizes_4, 'Belohnung für den Wurf von doppelten 5ern.'))
            // Add the reward 6.
            .append(helpers.getInputGroup('reward-6', 'number', 'Doppelte 6er-Belohnung', '', e.prizes_5, 'Belohnung für den Wurf von doppelten 6ern.')),
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
                    tables: ['rollprizes', 'rollprizes', 'rollprizes', 'rollprizes', 'rollprizes', 'rollprizes'],
                    keys: ['prizes_0', 'prizes_1', 'prizes_2', 'prizes_3', 'prizes_4', 'prizes_5'],
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

    // Gambling settings.
    $('#gamblingSettings').on('click', function() {
        socket.getDBValues('get_gambling_settings', {
            tables: ['gambling', 'gambling', 'gambling', 'gambling'],
            keys: ['winGainPercent', 'winRange', 'max', 'min']
        }, true, function(e) {
            helpers.getModal('gambling-settings', 'Glücksspieleinstellungen', 'Speichern', $('<form/>', {
                'role': 'form'
            })
            // Add the gambling gain percent.
            .append(helpers.getInputGroup('gambling-gain', 'number', 'Prozentsatz der Gewinnspanne', '', e.winGainPercent,
                'Wie viele Punkte werden vergeben, je nachdem, was der Benutzer gesetzt hat. Der gesetzte Betrag wird immer zurückgegeben.'))
            // Add the gambling win range.
            .append(helpers.getInputGroup('gambling-range', 'number', 'Gewinnspanne für Glücksspiele', '', e.winRange,
                'Die Gewinnspanne des Glücksspiels. Alles, was unter dieser Zahl gespielt wird, ist verloren. Das Maximum ist 100.'))
            // Add the gambling max.
            .append(helpers.getInputGroup('gambling-max', 'number', 'Maximaler Glücksspieleinsatz', '', e.max,
                'The maximum amount of points that can be gambled at once.'))
            // Add the gambling min.
            .append(helpers.getInputGroup('gambling-min', 'number', 'Mindesteinsatz von Glücksspielen', '', e.min,
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
                            tables: ['gambling', 'gambling', 'gambling', 'gambling'],
                            keys: ['winGainPercent', 'winRange', 'max', 'min'],
                            values: [winGain.val(), winRange.val(), max.val(), min.val()]
                        }, function() {
                            socket.sendCommand('update_gambling_settings_cmd', 'reloadgamble', function() {
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

    // Kill settings.
    $('#killCommandSettings').on('click', function() {
        socket.getDBValue('get_kill_settings', 'settings', 'killTimeoutTime', function(e) {
            helpers.getModal('killcmd-settings', 'Einstellungen des Kill-Befehls', 'Speichern', $('<form/>', {
                'role': 'form'
            })
            // Add the kill timeout.
            .append(helpers.getInputGroup('kill-timeout', 'number', 'Kill Timeout-Zeit (Sekunden)', '', e.settings,
                'Wie lange der Benutzer einen Timeout bekommt, wenn er von der Polizei erwischt wird.')),
            function() { // Callback once the user clicks save.
                let killTimeout = $('#kill-timeout');

                switch (false) {
                    case helpers.handleInputNumber(killTimeout, 1):
                        break;
                    default:
                        socket.updateDBValue('update_kill_settings', 'settings', 'killTimeoutTime', killTimeout.val(), function() {
                            socket.sendCommand('update_kill_settings_cmd', 'reloadkill', function() {
                                // Close the modal.
                                $('#killcmd-settings').modal('toggle');
                                // Alert the user.
                                toastr.success('Kill-Befehlseinstellungen erfolgreich aktualisiert!');
                            });
                        });
                }
            }).modal('toggle');
        });
    });

    // Random command settings.
    $('#randomSettings').on('click', function() {
        socket.getDBValue('get_random_settings', 'randomSettings', 'pg13toggle', function(e) {
            helpers.getModal('random-settings', 'Random Befehlseinstellungen', 'Speichern', $('<form/>', {
                'role': 'form'
            })
            // Add the toggle the entry messages.
            .append(helpers.getDropdownGroup('pg-mode', 'FSK12-Modus aktivieren', (e.randomSettings === 'true' ? 'Ja' : 'Nein'), ['Ja', 'Nein'],
                'Wenn der Random-Befehl FSK12-Sätze haben soll.')),
            function() { // Callback once the user clicks save.
                let toggle = $('#pg-mode').find(':selected').text() === 'Ja';

                socket.updateDBValue('update_random_settings', 'randomSettings', 'pg13toggle', toggle, function() {
                    socket.wsEvent('update_random_settings_ws', './games/random.js', null, [], function() {
                        // Close the modal.
                        $('#random-settings').modal('toggle');
                        // Alert the user.
                        toastr.success('Random Befehlseinstellungen erfolgreich aktualisiert!');
                    });
                });
            }).modal('toggle');
        });
    });
});
