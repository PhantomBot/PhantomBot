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
    // Chart configs. This should not be changed.
    let chartConfig = {"type": "doughnut", "data": {"datasets": [{"data": [], "backgroundColor": []}], "labels": [] }, "options": {"responsive": false, "title": {"display": true}}},
        chartContext = $('#betting-chart').get(0).getContext('2d'),
        chart = new Chart(chartContext, chartConfig),
        isActive = false;

    /*
     * @function Inits the chart.
     */
    const initChart = function() {
        socket.getDBValues('get_betting_options', {
            tables: ['bettingPanel', 'bettingPanel'],
            keys: ['options', 'title']
        }, true, function(e) {
            if (e.options !== null) {
                socket.getDBTableValues('get_betting_votes', 'bettingVotes', function(votes) {
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
    const updateChart = function() {
        socket.getDBValue('get_betting_active_update', 'bettingPanel', 'isActive', function(e) {
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

            socket.getDBValue('get_betting_options_update', 'bettingPanel', 'options', function(e) {
                socket.getDBTableValues('get_betting_votes_update', 'bettingVotes', function(votes) {
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
    const resetBet = function(callback) {
        socket.removeDBValues('reset_betting_options', {
            tables: ['bettingPanel', 'bettingPanel'],
            keys: ['options', 'isActive']
        }, function() {
            // Reset the chart.
            resetChart();
            // Update the chart.
            chart.update();
            // Alert the user.
            toastr.success('Die Wette wurde erfolgreich zurückgesetzt.');

            // Callback if possible.
            if (typeof callback === 'function') {
                callback();
            }
        });
    };

    /*
     * @function Resets the chart.
     */
    const resetChart = function() {
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
    $('#reset-betting').on('click', function() {
        helpers.getModal('betting-reset', 'Wette zurücksetzen', 'Zurücksetzen', $('<form/>', {
            'role': 'form'
        })
        // Add refund option
        .append(helpers.getCheckBox('bet-refund', false, 'Alle Wetten erstatten',
            'wenn jeder, der eine Wette platziert hat, seine Punkte zurückbekommen sollte.')),
        function() {
            resetBet();

            if (isActive) {
                socket.sendCommand('reset_end_bet_cmd', 'bet reset' + ($('#bet-refund').prop('checked') === true ? ' -refund' : ''), new Function());
                isActive = false;
            }
            $('#betting-reset').modal('toggle');
        }).modal('toggle');
    });

    // Close bet button
    $('#close-betting').on('click', function() {
        helpers.getModal('betting-close', 'Wette schließen', 'Schließen', $('<form/>', {
            'role': 'form'
        })
        // Append options.
        .append(helpers.getInputGroup('bet-winning', 'text', 'Gewinnoption', 'Option, die die Wette gewonnen hat. Lassen Sie dieses Feld leer, um den Einsatz einfach zu schließen und später eine Gewinnoption auszuwählen.', '',
            'Option, die die Wette gewonnen hat. Lassen Sie dieses Feld leer, um den Einsatz einfach zu schließen und später eine Gewinnoption auszuwählen.')),
        function() {
            socket.sendCommand('close_bet_cmd', 'bet close ' + $('#bet-winning').val(), function() {
                toastr.success('Die Wette wurde erfolgreich beendet.');
                $('#betting-close').modal('toggle');
            });
        }).modal('toggle');
    });

    // Open bet button.
    $('#open-betting').on('click', function() {
        helpers.getModal('betting-open', 'Wette eröffnen', 'Öffnen', $('<form/>', {
            'role': 'form'
        })
        // Append bet title.
        .append(helpers.getTextAreaGroup('bet-title', 'text', 'Titel', 'Welches Team wird gewinnen?', '', 'Titel der Wette.'))
        // Append options.
        .append(helpers.getInputGroup('bet-options', 'text', 'Optionen', 'Rot, Blau', '',
            'Optionen, auf die gesetzt werden soll. Jede Option sollte durch ein Komma und ein Leerzeichen getrennt werden.'))
        // Append min bet.
        .append(helpers.getInputGroup('bet-min', 'number', 'Mindesteinsatz', '', '1',
            'Wie hoch ist der Mindesteinsatz an Punkten, den Benutzer auf eine Option setzen können?'))
        // Append max bet.
        .append(helpers.getInputGroup('bet-max', 'number', 'Maximaleinsatz', '', '0',
            'Wie hoch ist der Maximaleinsatz von Punkten, die Benutzer auf eine Option setzen können? 0 entfernt das Limit.'))
        // Append min bet.
        .append(helpers.getInputGroup('bet-timer', 'number', 'Timer (Minuten)', '', '0',
            'Timer in Minuten, wie lange die Wette geöffnet sein soll. 0 bedeutet bis zum Schließen.')),
        function() {
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
                        minBet.val() + ' ' + maxBet.val() + ' ' + timer.val(), function() {
                            // Alert the user.
                            toastr.success('Die Wette wurde erfolgreich eröffnet!');
                            // Close the modal.
                            $('#betting-open').modal('toggle');
                            // Update the chart.
                            updateChart();
                    });
            }
        }).modal('toggle');
    });

    // Settings button.
    $('#settings-betting').on('click', function() {
        socket.getDBValues('get_bet_settings', {
            tables: ['bettingSettings', 'bettingSettings', 'bettingSettings', 'bettingSettings'],
            keys: ['gain', 'save', 'format', 'warningMessages']
        }, true, function(e) {
            helpers.getModal('betting-settings', 'Wetteinstellungen', 'Speichern', $('<form/>', {
                'role': 'form'
            })
            // Append a select option for the save option
            .append(helpers.getDropdownGroup('save-bets', 'Wetten speichern', (e.save === 'true' ? 'Ja' : 'Nein'), ['Ja', 'Nein'],
                'Wenn frühere Wetten gespeichert werden sollen.'))
            // Append a select option for the warning messages
            .append(helpers.getDropdownGroup('warning-bets', 'Warnmeldungen', (e.warningMessages === 'true' ? 'Ja' : 'Nein'), ['Ja', 'Nein'],
                'Wenn Warnmeldungen in den Chat gesendet werden sollen, wenn Benutzer wetten.'))
            // Save format
            .append(helpers.getInputGroup('bet-format', 'text', 'Format speichern', '', e.format,
                'In welchem Datumsformat sollen die Wetten gespeichert werden.'))
            // Save format
            .append(helpers.getInputGroup('bet-gain', 'text', 'Gewinnsteigerung (Prozent)', '', e.gain,
                'Der Prozentsatz der Punkte, den der Benutzer von der gesamten Anzahl der Punkte erhält, die auf die Gewinnoption gesetzt wurden. Der eingesetzte Betrag wird immer zurückgegeben.')),
            function() {
                let saveBets = $('#save-bets').find(':selected').text() === 'Ja',
                    warningMessages = $('#warning-bets').find(':selected').text() === 'Ja',
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
                        }, function() {
                            socket.sendCommand('bet_settings_update_cmd', 'reloadbet', function() {
                                // Alert user.
                                toastr.success('Wetteinstellungen erfolgreich aktualisiert!');
                                // Close modal.
                                $('#betting-settings').modal('toggle');
                            })
                        });
                }
            }).modal('toggle');
        });
    });

    // Module toggle.
    $('#bettingSystemModuleToggle').on('change', function() {
        socket.sendCommandSync('betting_system_module_toggle_cmd',
            'module ' + ($(this).is(':checked') ? 'enablesilent' : 'disablesilent') + ' ./systems/bettingSystem.js', run);
    });

    // Update the chart every 5 seconds.
    helpers.setInterval(updateChart, 5e3);
});

// Handles the module toggle.
$(run = function() {
    socket.getDBValue('betting_module_status', 'modules', './systems/bettingSystem.js', function(e) {
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
            $('#twitch-chat-betting').html('Aufgrund von Änderungen durch Twitch kann das Chat-Panel nicht mehr angezeigt werden, es sei denn, du aktivierst SSL im PhantomBot-Panel und änderst den Baseport auf 443. Dies funktioniert möglicherweise nicht ohne Root-Privilegien.<br /><br />Alternativ können Sie sich mit der GitHub-Version des Panels bei <a href="https://phantombot.github.io/PhantomBot/">PhantomBot - GitHub.io</a> anmelden, die dieses Problem umgeht.<br /><br />Hilfe beim Einrichten von SSL finden Sie in <a href="https://phantombot.github.io/PhantomBot/guides/#guide=content/twitchembeds">diesem Handbuch</a>.');
            $('#twitch-chat-betting').addClass('box-body');
        }
    });
});
