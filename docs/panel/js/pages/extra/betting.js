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
$(function () {
    // Chart configs. This should not be changed.
    let chartConfig = {"type": "doughnut", "data": {"datasets": [{"data": [], "backgroundColor": []}], "labels": []}, "options": {"responsive": false, "title": {"display": true}}},
            chartContext = $('#betting-chart').get(0).getContext('2d'),
            chart = new Chart(chartContext, chartConfig),
            isActive = false;

    /*
     * @function Inits the chart.
     */
    const initChart = function () {
        socket.getDBValues('get_betting_options', {
            tables: ['bettingPanel', 'bettingPanel'],
            keys: ['options', 'title']
        }, true, function (e) {
            if (e.options !== null) {
                socket.getDBTableValues('get_betting_votes', 'bettingVotes', function (votes) {
                    // Set the chart title.
                    chartConfig.options.title.text = e.title;
                    // Set the labels.
                    chartConfig.data.labels = e.options.split('%space_option%');

                    // Get all the data.
                    let ops = e.options.split('%space_option%');

                    for (let i = 0; i < ops.length; i++) {
                        if (ops[i].indexOf(' ') !== -1) {
                            ops[i] = ops[i].split(' ').join('%space_option%');
                        }

                        for (let j = 0; j < votes.length; j++) {
                            if (votes[j].key === ops[i]) {
                                chartConfig.data.datasets[0].data.push(parseInt(votes[j].value));
                                chartConfig.data.datasets[0].backgroundColor.push(helpers.getRandomRgbColor());
                            }
                        }
                    }

                    // Update the chart.
                    chart.update();
                    // Mark as active.
                    isActive = true;
                });
            }
        });
    };

    initChart();

    /*
     * @function Updates the chart during a bet.
     */
    const updateChart = function () {
        socket.getDBValue('get_betting_active_update', 'bettingPanel', 'isActive', function (e) {
            if (e.bettingPanel === 'false' || e.bettingPanel === null) {
                isActive = false;
                return;
            } else if (chartConfig.data.datasets[0].backgroundColor.length !== 0 && isActive === false) {
                resetChart();
            }

            // No current chart is done, start a new one.
            if (chartConfig.data.datasets[0].backgroundColor.length === 0) {
                initChart();
                return;
            }

            socket.getDBValue('get_betting_options_update', 'bettingPanel', 'options', function (e) {
                socket.getDBTableValues('get_betting_votes_update', 'bettingVotes', function (votes) {
                    // Get all the data.
                    let ops = e.bettingPanel.split('%space_option%');

                    // Remove current data.
                    chartConfig.data.datasets[0].data = [];

                    for (let i = 0; i < ops.length; i++) {
                        if (ops[i].indexOf(' ') !== -1) {
                            ops[i] = ops[i].split(' ').join('%space_option%');
                        }

                        for (let j = 0; j < votes.length; j++) {
                            if (votes[j].key === ops[i]) {
                                chartConfig.data.datasets[0].data.push(parseInt(votes[j].value));
                            }
                        }
                    }

                    // Update the chart.
                    chart.update();
                });
            });
        });
    };

    /*
     * @function Resets the bet.
     *
     * @param {Function} callback
     */
    const resetBet = function (callback) {
        socket.removeDBValues('reset_betting_options', {
            tables: ['bettingPanel', 'bettingPanel'],
            keys: ['options', 'isActive']
        }, function () {
            // Reset the chart.
            resetChart();
            // Update the chart.
            chart.update();
            // Alert the user.
            toastr.success('Successfully reset the bet.');

            // Callback if possible.
            if (typeof callback === 'function') {
                callback();
            }
        });
    };

    /*
     * @function Resets the chart.
     */
    const resetChart = function () {
        // Mark as not acive.
        isActive = false;
        // Reset the title.
        chartConfig.options.title.text = '';
        // Reset lables.
        chartConfig.data.labels = [];
        // Reset the data.
        chartConfig.data.datasets[0].data = [];
        // Reset the colors.
        chartConfig.data.datasets[0].backgroundColor = [];
    };

    // Reset bet button.
    $('#reset-betting').on('click', function () {
        helpers.getModal('betting-reset', 'Reset Bet', 'Reset', $('<form/>', {
            'role': 'form'
        })
                // Add refund option
                .append(helpers.getCheckBox('bet-refund', false, 'Refund all bets',
                        'if everyone who placed a bet should get their points back.')),
                function () {
                    resetBet();

                    if (isActive) {
                        socket.sendCommand('reset_end_bet_cmd', 'bet reset' + ($('#bet-refund').prop('checked') === true ? ' -refund' : ''), new Function());
                        isActive = false;
                    }
                    $('#betting-reset').modal('toggle');
                }).modal('toggle');
    });

    // Close bet button
    $('#close-betting').on('click', function () {
        helpers.getModal('betting-close', 'Close Bet', 'Close', $('<form/>', {
            'role': 'form'
        })
                // Append options.
                .append(helpers.getInputGroup('bet-winning', 'text', 'Winning Option', 'Option that won the bet. Leave this empty to just close the bet and pick a winning option later.', '',
                        'Option that won the bet. Leave this empty to just close the bet and pick a winning option later.')),
                function () {
                    socket.sendCommand('close_bet_cmd', 'bet close ' + $('#bet-winning').val(), function () {
                        toastr.success('Successfully closed the bet.');
                        $('#betting-close').modal('toggle');
                    });
                }).modal('toggle');
    });

    // Open bet button.
    $('#open-betting').on('click', function () {
        helpers.getModal('betting-open', 'Open Bet', 'Open', $('<form/>', {
            'role': 'form'
        })
                // Append bet title.
                .append(helpers.getTextAreaGroup('bet-title', 'text', 'Title', 'Which team is going to win?', '', 'Title of the bet.'))
                // Append options.
                .append(helpers.getInputGroup('bet-options', 'text', 'Options', 'Red, Blue', '',
                        'Options to be betted on. Each option should be seperated with a comma and space.'))
                // Append min bet.
                .append(helpers.getInputGroup('bet-min', 'number', 'Minimum Bet', '', '1',
                        'What is the minimum amount of points users can bet on an option.'))
                // Append max bet.
                .append(helpers.getInputGroup('bet-max', 'number', 'Maximum Bet', '', '0',
                        'What is the maximum amount of points users can bet on an option. 0 removes the limit.'))
                // Append min bet.
                .append(helpers.getInputGroup('bet-timer', 'number', 'Timer (Minutes)', '', '0',
                        'Timer in minutes of how long the bet will be opened for. 0 means until closed.')),
                function () {
                    let title = $('#bet-title'),
                            options = $('#bet-options'),
                            minBet = $('#bet-min'),
                            maxBet = $('#bet-max'),
                            timer = $('#bet-timer');

                    switch (false) {
                        case helpers.handleInputString(title):
                        case helpers.handleInputString(options):
                        case helpers.handleInputNumber(minBet, 1):
                        case helpers.handleInputNumber(maxBet, 0):
                        case helpers.handleInputNumber(timer, 0):
                            break;
                        default:
                            socket.sendCommandSync('bet_open_cmd', 'bet open "' + title.val() + '" "' + options.val() + '" ' +
                                    minBet.val() + ' ' + maxBet.val() + ' ' + timer.val(), function () {
                                // Alert the user.
                                toastr.success('Successfully opened the bet!');
                                // Close the modal.
                                $('#betting-open').modal('toggle');
                                // Update the chart.
                                updateChart();
                            });
                    }
                }).modal('toggle');
    });

    // Settings button.
    $('#settings-betting').on('click', function () {
        socket.getDBValues('get_bet_settings', {
            tables: ['bettingSettings', 'bettingSettings', 'bettingSettings', 'bettingSettings'],
            keys: ['gain', 'save', 'format', 'warningMessages']
        }, true, function (e) {
            helpers.getModal('betting-settings', 'Bet Settings', 'Save', $('<form/>', {
                'role': 'form'
            })
                    // Append a select option for the save option
                    .append(helpers.getDropdownGroup('save-bets', 'Save Bets', (e.save === 'true' ? 'Yes' : 'No'), ['Yes', 'No'],
                            'If past bets should be saved.'))
                    // Append a select option for the warning messages
                    .append(helpers.getDropdownGroup('warning-bets', 'Warning Messages', (e.warningMessages === 'true' ? 'Yes' : 'No'), ['Yes', 'No'],
                            'If warning messages should be said in chat when users bet.'))
                    // Save format
                    .append(helpers.getInputGroup('bet-format', 'text', 'Save Format', '', e.format,
                            'In which date format should bets be saved.'))
                    // Save format
                    .append(helpers.getInputGroup('bet-gain', 'text', 'Winning Gain (Percent)', '', e.gain,
                            'The percent of points the user gets from the entire amount of points betted on the winning option. The amount betted is always returned.')),
                    function () {
                        let saveBets = $('#save-bets').find(':selected').text() === 'Yes',
                                warningMessages = $('#warning-bets').find(':selected').text() === 'Yes',
                                gain = $('#bet-gain'),
                                format = $('#bet-format');

                        switch (false) {
                            case helpers.handleInputNumber(gain, 1, 100):
                            case helpers.handleInputString(format):
                                break;
                            default:
                                socket.updateDBValues('bet_settings_update', {
                                    tables: ['bettingSettings', 'bettingSettings', 'bettingSettings', 'bettingSettings'],
                                    keys: ['gain', 'save', 'format', 'warningMessages'],
                                    values: [gain.val(), saveBets, format.val(), warningMessages]
                                }, function () {
                                    socket.sendCommand('bet_settings_update_cmd', 'reloadbet', function () {
                                        // Alert user.
                                        toastr.success('Successfully updated bet settings!');
                                        // Close modal.
                                        $('#betting-settings').modal('toggle');
                                    })
                                });
                        }
                    }).modal('toggle');
        });
    });

    // Module toggle.
    $('#bettingSystemModuleToggle').on('change', function () {
        socket.sendCommandSync('betting_system_module_toggle_cmd',
                'module ' + ($(this).is(':checked') ? 'enablesilent' : 'disablesilent') + ' ./systems/bettingSystem.js', run);
    });

    // Update the chart every 5 seconds.
    helpers.setInterval(updateChart, 5e3);
});

// Handles the module toggle.
$(run = function () {
    socket.getDBValue('betting_module_status', 'modules', './systems/bettingSystem.js', function (e) {
        if (!helpers.handleModuleLoadUp('bettingSystemModule', e.modules)) {
            // Remove the chat.
            $('#twitch-chat-betting').find('iframe').remove();
            return;
        }

        if (location.protocol.toLowerCase().startsWith('https') && !(location.port > 0 && location.port !== 443)) {
            // Add Twitch chat.
            $('#twitch-chat-betting').html($('<iframe/>', {
                'frameborder': '0',
                'scrolling': 'no',
                'style': 'width: 100%; height: 561px; margin-bottom: -5px;',
                'src': 'https://www.twitch.tv/embed/' + getChannelName() + '/chat' + (helpers.isDark ? '?darkpopout&' : '?') + 'parent=' + location.hostname
            }));
        } else {
            $('#twitch-chat-betting').html('Due to changes by Twitch, the chat panel can no longer be displayed unless you enable SSL on the PhantomBot Panel and change the baseport to 443. This may not work without root privileges.<br /><br />Alternatively, you can login using the GitHub version of the panel at <a href="https://phantombot.github.io/PhantomBot/">PhantomBot - GitHub.io</a> which gets around this issue.<br /><br />For help setting up SSL, please see <a href="https://phantombot.github.io/PhantomBot/guides/#guide=content/integrations/twitchembeds">this guide</a>.');
            $('#twitch-chat-betting').addClass('box-body');
        }
    });
});
