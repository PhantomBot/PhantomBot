/*
 * Copyright (C) 2016-2018 phantombot.tv
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
$(run = function() {
    socket.getDBValues('raffle_module_status_toggle', {
        tables: ['modules', 'raffleSettings'],
        keys: ['./systems/raffleSystem.js', 'isActive']
    }, true, function(e) {
        if (!helpers.getModuleStatus(['raffleListModule', 'raffleModal'], e['./systems/raffleSystem.js'], 'raffleModuleToggle')) {
            // Remove the chat.
            $('#raffle-chat').find('iframe').remove();
            return;
        }

        // Update the open button to close if the raffle is active.
        if (e['isActive'] === 'true') {
            $('#open-or-close-raffle').html($('<i/>', {
                'class': 'fa fa-lock'
            })).append('&nbsp; Close').removeClass('btn-success').addClass('btn-warning');
        }

        /**
         * @function Loads the raffle list.
         */
        helpers.temp.loadRaffleList = function() {
            socket.getDBTableValues('get_raffle_list', 'raffleList', function(results) {
                const table = $('#raffle-table');

                // Remove current data content.
                table.find('tr:gt(0)').remove();

                for (let i = 0; i < results.length; i++) {
                    const tr = $('<tr/>');

                    tr.append($('<td/>', {
                        'html': results[i].key
                    }));

                    table.append(tr);
                }
            });
        };

        // Add Twitch chat.
        $('#raffle-chat').html($('<iframe/>', {
            'frameborder': '0',
            'scrolling': 'no',
            'style': 'width: 100%; height: 610px;',
            'src': 'https://www.twitch.tv/embed/' + getChannelName() + '/chat' + (helpers.isDark ? '?darkpopout' : '')
        }));

        // Load the raffle list.
        helpers.temp.loadRaffleList();

        // Set a timer to auto load the raffle list.
        helpers.setInterval(function() {
            helpers.temp.loadRaffleList();
        }, 5e3);
    });
});

// Function that handlers the loading of events.
$(function() {
    // Module toggle.
    $('#raffleModuleToggle').on('change', function() {
        socket.sendCommandSync('raffle_system_module_toggle_cmd',
            'module ' + ($(this).is(':checked') ? 'enablesilent' : 'disablesilent') + ' ./systems/raffleSystem.js', run);
    });

    // Title update
    $('#raffle-req').on('change', function() {
        if ($(this).val() === '-usetime') {
            $('#raffle-cost-title').html('Minimum Time (Minutes)');
        } else {
            $('#raffle-cost-title').html('Cost');
        }
    })

    // Open/close raffle button.
    $('#open-or-close-raffle').on('click', function() {
        if ($(this)[0].innerText.trim() === 'Open') {
            const keyword = $('#raffle-keyword'),
                cost = $('#raffle-cost'),
                costType = $('#raffle-req').val(),
                elegibility = $('#raffle-perm').val(),
                timer = $('#raffle-timer'),
                regLuck = $('#raffle-reg'),
                subLuck = $('#raffle-sub');

            // Make sure the user entered everything right.
            switch (false) {
                case helpers.handleInputString(keyword):
                case helpers.handleInputNumber(cost, 0):
                case helpers.handleInputNumber(timer, 0):
                case helpers.handleInputNumber(regLuck, 1, 10):
                case helpers.handleInputNumber(subLuck, 1, 10):
                    break;
                default:
                    socket.updateDBValues('update_raffle_settings', {
                        tables: ['raffleSettings', 'raffleSettings'],
                        keys: ['subscriberBonusRaffle', 'regularBonusRaffle'],
                        values: [subLuck.val(), regLuck.val()]
                    }, function() {
                        socket.sendCommandSync('raffle_reload', 'reloadraffle', function() {
                            socket.sendCommand('open_raffle_cmd', 'raffle open ' + cost.val() + ' ' + keyword.val() +
                                ' ' + timer.val() + ' ' +  costType + ' ' + elegibility, function() {
                                // Alert the user.
                                toastr.success('Successfully opened the raffle!');
                                // Update the button.
                                $('#open-or-close-raffle').html($('<i/>', {
                                    'class': 'fa fa-lock'
                                })).append('&nbsp; Close').removeClass('btn-success').addClass('btn-warning');
                            });
                        })
                    });
            }
        } else {
            socket.sendCommandSync('close_raffle_cmd', 'raffle close', function() {
                // Alert the user.
                toastr.success('Successfully closed the raffle!');
                // Reload to remove the winner.
                helpers.temp.loadRaffleList();
                // Update the button.
                $('#open-or-close-raffle').html($('<i/>', {
                    'class': 'fa fa-unlock-alt'
                })).append('&nbsp; Open').removeClass('btn-warning').addClass('btn-success');
            });
        }
    });

    // Draw raffle button.
    $('#draw-raffle').on('click', function() {
        socket.sendCommandSync('draw_raffle_cmd', 'raffle draw', function() {
            // Alert the user.
            toastr.success('Successfully drew a winner!');
            // Reload to remove the winner.
            helpers.temp.loadRaffleList();
        });
    });

    // Reset raffle button.
    $('#reset-raffle').on('click', function() {
        // Reset values.
        $('#raffle-keyword').val('');
        $('#raffle-cost, #raffle-timer').val('0');
        $('#raffle-cost-title').html('Cost');
        $('#raffle-req').val('-usepoints');
        $('#raffle-reg, #raffle-sub').val('1');
        $('#raffle-table').find('tr:gt(0)').remove();

        $('#open-or-close-raffle').html($('<i/>', {
            'class': 'fa fa-unlock-alt'
        })).append('&nbsp; Open').removeClass('btn-warning').addClass('btn-success');

        // Close raffle but don't pick a winner.
        socket.sendCommand('reset_raffle_cmd', 'raffle reset', function() {
            toastr.success('Successfully reset the raffle!');
        });
    });

    // Raffle settings button.
    $('#raffle-settings').on('click', function() {
        socket.getDBValues('get_raffle_settings', {
            tables: ['raffleSettings', 'raffleSettings', 'raffleSettings', 'raffleSettings', 'raffleSettings'],
            keys: ['raffleMSGToggle', 'raffleWhisperWinner', 'noRepickSame', 'raffleMessage', 'raffleMessageInterval']
        }, true, function(e) {
            helpers.getModal('raffle-settings-modal', 'Raffle Settings', 'Save', $('<form/>', {
                'role': 'form'
            })
            // Add the div for the col boxes.
            .append($('<div/>', {
                'class': 'panel-group',
                'id': 'accordion'
            })
            // Append first collapsible accordion.
            .append(helpers.getCollapsibleAccordion('main-1', 'Timed Message Settings', $('<form/>', {
                    'role': 'form'
                })
                // Append interval box for the message
                .append(helpers.getInputGroup('msg-timer', 'number', 'Message Interval (Minutes)', '', e['raffleMessageInterval'],
                    'How often the raffle message is said in chat while a raffle is active.'))
                // Append message box for the message
                .append(helpers.getTextAreaGroup('msg-msg', 'text', 'Raffle Message', '', e['raffleMessage'],
                    'What message is said at every interval while the raffle is active. Tags: (keyword) and (entries)'))))
            // Append second collapsible accordion.
            .append(helpers.getCollapsibleAccordion('main-2', 'Extra Settings',  $('<form/>', {
                    'role': 'form'
                })
                // Add toggle for warning messages.
                .append(helpers.getDropdownGroup('warning-msg', 'Enable Warning Messages', (e['raffleMSGToggle'] === 'true' ? 'Yes' : 'No'), ['Yes', 'No'],
                    'If warning messages should be said in chat when a user already entered, or doesn\'t have enough points.'))
                // Add toggle for repicks
                .append(helpers.getDropdownGroup('draw-toggle', 'Allow Multiple Draws', (e['noRepickSame'] === 'false' ? 'Yes' : 'No'), ['Yes', 'No'],
                    'If a user can be drawn multiple times for one raffle.'))
                // Add toggle for repicks
                .append(helpers.getDropdownGroup('whisper-toggle', 'Whisper The Winner', (e['raffleWhisperWinner'] === 'true' ? 'Yes' : 'No'), ['Yes', 'No'],
                    'If the winner of the raffle should get a whisper saying they won.'))))),
            function() {
                let raffleTimer = $('#msg-timer'),
                    raffleMessage = $('#msg-msg'),
                    warningMsg = $('#warning-msg').find(':selected').text() === 'Yes',
                    drawToggle = $('#draw-toggle').find(':selected').text() !== 'Yes',
                    whisperWinner = $('#whisper-toggle').find(':selected').text() === 'Yes';

                switch (false) {
                    case helpers.handleInputNumber(raffleTimer):
                    case helpers.handleInputString(raffleMessage):
                        break;
                    default:
                        socket.updateDBValues('update_raffle_settings_2', {
                            tables: ['raffleSettings', 'raffleSettings', 'raffleSettings', 'raffleSettings', 'raffleSettings'],
                            keys: ['raffleMSGToggle', 'raffleWhisperWinner', 'noRepickSame', 'raffleMessage', 'raffleMessageInterval'],
                            values: [warningMsg, whisperWinner, drawToggle, raffleMessage.val(), raffleTimer.val()]
                        }, function() {
                            socket.sendCommand('raffle_reload_cmd', 'reloadraffle', function() {
                                // Close the modal.
                                $('#raffle-settings-modal').modal('toggle');
                                // Warn the user.
                                toastr.success('Successfully updated raffle settings!');
                            });
                        });
                }
            }).modal('toggle');
        });
    });
});
