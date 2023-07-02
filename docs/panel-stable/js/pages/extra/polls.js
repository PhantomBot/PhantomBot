/*
 * Copyright (C) 2016-2023 phantombot.github.io/PhantomBot
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
    let chartConfig = {"type": "pie", "data": {"datasets": [{"data": [], "backgroundColor": []}], "labels": []}, "options": {"responsive": false, "title": {"display": true}}},
            chartContext = $('#poll-chart').get(0).getContext('2d'),
            chart = new Chart(chartContext, chartConfig),
            isActive = false;

    /*
     * @function Inits the chart.
     */
    const initChart = function () {
        socket.getDBValues('get_poll_options', {
            tables: ['pollPanel', 'pollPanel'],
            keys: ['options', 'title']
        }, true, function (e) {
            if (e.options !== null) {
                socket.getDBTableValues('get_poll_votes', 'pollVotes', function (votes) {
                    // Set the chart title.
                    chartConfig.options.title.text = e.title;
                    // Set the labels.
                    chartConfig.data.labels = e.options.split(',');

                    // Get all the data.
                    let ops = e.options.split(',');

                    for (let i = 0; i < ops.length; i++) {
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

    // Init the chart here.
    initChart();

    /*
     * @function Updates the chart during a poll.
     */
    const updateChart = function () {
        socket.getDBValue('get_poll_active_update', 'pollPanel', 'isActive', function (e) {
            if (e.pollPanel === 'false' || e.pollPanel === null) {
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

            socket.getDBValue('get_poll_options_update', 'pollPanel', 'options', function (e) {
                socket.getDBTableValues('get_poll_votes_update', 'pollVotes', function (votes) {
                    // Get all the data.
                    let ops = e.pollPanel.split(',');

                    // Remove current data.
                    chartConfig.data.datasets[0].data = [];

                    for (let i = 0; i < ops.length; i++) {
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
     * @function Resets the poll.
     *
     * @param {Function} callback
     */
    const resetPoll = function (callback) {
        socket.removeDBValues('reset_poll_options', {
            tables: ['pollPanel', 'pollPanel'],
            keys: ['options', 'isActive']
        }, function () {
            // Reset the chart.
            resetChart();
            // Update the chart.
            chart.update();
            // Alert the user.
            toastr.success('Successfully reset the poll.');

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

    // Reset poll button.
    $('#reset-poll').on('click', function () {
        resetPoll();

        if (isActive) {
            socket.sendCommand('reset_end_poll_cmd', 'poll close', new Function());
            isActive = false;
        }
    });

    // Close poll button.
    $('#close-poll').on('click', function () {
        socket.sendCommand('end_poll_cmd', 'poll close', function () {
            // Mark as not acive.
            isActive = false;
            // Alert the user.
            toastr.success('Successfully ended the poll.');
        });
    });

    // Open poll button.
    $('#open-poll').on('click', function () {
        helpers.getModal('poll-open', 'Open Poll', 'Open', $('<form/>', {
            'role': 'form'
        })
                // Append poll title.
                .append(helpers.getTextAreaGroup('poll-title', 'text', 'Title', 'What is your favorite color?', '', 'Title of the poll.'))
                // Append options.
                .append(helpers.getInputGroup('poll-options', 'text', 'Options', 'Red, Green, Blue', '',
                        'Options to be voted on. Each option should be seperated with a comma and space.'))
                // Append timer.
                .append(helpers.getInputGroup('poll-timer', 'number', 'Timer (Seconds)', '', '0',
                        'How long in seconds the poll will be opened for. Default is until closed.'))
                // Append min votes.
                .append(helpers.getInputGroup('poll-votes', 'number', 'Minimum Votes', '', '1',
                        'How many votes it takes to choose a winning option. Default is one.')),
                function () { // callback function.
                    let title = $('#poll-title'),
                            options = $('#poll-options'),
                            timer = $('#poll-timer'),
                            votes = $('#poll-votes');

                    switch (false) {
                        case helpers.handleInputString(title):
                        case helpers.handleInputString(options):
                        case helpers.handleInputNumber(timer, 0):
                        case helpers.handleInputNumber(votes, 1):
                            break;
                        default:
                            // Reset the chart.
                            resetChart();
                            // Open the poll.
                            socket.sendCommand('open_poll_cmd',
                                    'poll open "' + title.val() + '" "' + options.val() + '" ' + timer.val() + ' ' + votes.val(), function () {
                                // Close the modal.
                                $('#poll-open').modal('toggle');
                                // Alert the user.
                                toastr.success('Successfully opened the poll!');
                            });
                    }
                }).modal('toggle');
    });

    // Module toggle.
    $('#pollSystemModuleToggle').on('change', function () {
        socket.sendCommandSync('poll_system_module_toggle_cmd',
                'module ' + ($(this).is(':checked') ? 'enablesilent' : 'disablesilent') + ' ./systems/pollSystem.js', run);
    });

    // Update the chart every 5 seconds.
    helpers.setInterval(updateChart, 5e3);
});

// Handles the module toggle.
$(run = function () {
    socket.getDBValue('poll_module_status', 'modules', './systems/pollSystem.js', function (e) {
        if (!helpers.handleModuleLoadUp('pollSystemModule', e.modules)) {
            // Remove the chat.
            $('#twitch-chat-poll').find('iframe').remove();
            return;
        }
        if (location.protocol.toLowerCase().startsWith('https') && !(location.port > 0 && location.port !== 443)) {
            // Add Twitch chat.
            $('#twitch-chat-poll').html($('<iframe/>', {
                'frameborder': '0',
                'scrolling': 'no',
                'style': 'width: 100%; height: 561px; margin-bottom: -5px;',
                'src': 'https://www.twitch.tv/embed/' + getChannelName() + '/chat' + (helpers.isDark ? '?darkpopout&' : '?') + 'parent=' + location.hostname
            }));
        } else {
            $('#twitch-chat-poll').html('Due to changes by Twitch, the chat panel can no longer be displayed unless you enable SSL on the PhantomBot Panel and change the baseport to 443. This may not work without root privileges.<br /><br />Alternatively, you can login using the GitHub version of the panel at <a href="https://phantombot.dev/">PhantomBot</a> which gets around this issue.<br /><br />For help setting up SSL, please see <a href="https://phantombot.dev/guides/#guide=content/integrations/twitchembeds&channel=' + helpers.getBranch() + '">this guide</a>.');
            $('#twitch-chat-poll').addClass('box-body');
        }
    });
});
