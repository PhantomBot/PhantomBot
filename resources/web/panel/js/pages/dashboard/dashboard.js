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

// If we can sroll the event log or not.
var canScroll = true;

// Function that querys all of the data we need.
$(function() {
    // Query our panel settings first.
    socket.getDBValues('panel_get_settings', {
        tables: ['panelData', 'panelData'],
        keys: ['isDark', 'isReverseSortEvents']
    }, true, function(e) {
        helpers.isDark = e.isDark === 'true';
        helpers.isReverseSortEvents = e.isReverseSortEvents === 'true';

        // Handle the dark mode skins.
        helpers.handleDarkMode(helpers.isDark, true);
        // Handle the dark mode toggle.
        $('#dark-mode-toggle').prop('checked', helpers.isDark);
        // Update event toggle.
        $('#toggle-reverse-events').prop('checked', helpers.isReverseSortEvents);

        // Query recent events.
        socket.getDBValue('dashboard_get_events', 'panelData', 'data', function(e) {
            if (e.panelData !== null && e.panelData.length > 0) {
                let events = JSON.parse(e.panelData);

                // This should never be null unless the user removes the DB table.
                if (events !== null) {

                    // Sort events if needed.
                    if (helpers.isReverseSortEvents) {
                        events.sort(function(a, b) {
                            return b.date - a.date;
                        });
                    } else {
                        events.sort(function(a, b) {
                            return a.date - b.date;
                        });
                    }

                    let htmlEvents = $('<ul/>', {
                        'class': 'recent-events'
                    });
                    for (let i = 0; i < events.length; i++) {
                        let p = $('<p/>');

                        // Append date.
                        p.append($('<span/>', {
                            'class': 'event-date',
                            'html': helpers.getPaddedDateString(new Date(events[i].date).toLocaleString()) + ' '
                        }));

                        // Append type.
                        p.append($('<span/>', {
                            'class': 'label',
                            'style': helpers.getEventColor(events[i].type),
                            'html': events[i].type
                        }))

                        // Append message.
                        p.append($('<span/>', {
                            'html': ' ' + helpers.getEventMessage(events[i])
                        }));

                        // Append to list.
                        htmlEvents.append(p);
                    }

                    // Append the information to the main div.
                    htmlEvents.appendTo($('.event-log'));
                }
            }

            // Query panel information.
            socket.getDBValue('dashboard_get_data', 'panelData', 'stream', function(e) {
                if (e.panelData === null) {
                    alert('Please allow the bot to generate the data needed to load this page. Try again in 60 seconds...');
                    return;
                }

                // Parse our object.
                e = JSON.parse(e.panelData);
                // Temp data.
                const tempData = e;
                // Set stream title.
                $('#stream-title').val(e.title);
                // Set stream game.
                $('#stream-game').val(e.game);
                // Set uptime.
                if (e.isLive) {
                    $('#dashboard-uptime').html(e.uptime);
                    $('#bg-uptime').removeClass('bg-red').addClass('bg-green');
                } else {
                    $('#dashboard-uptime').html('Offline');
                    $('#bg-uptime').removeClass('bg-green').addClass('bg-red');
                }

                // Query panel commands.
                socket.getDBTableValues('dashboard_get_commands', 'command', function(e) {
                    // Sort commands.
                    e.sort(function(a, b) {
                        return a.key.localeCompare(b.key);
                    });

                    // Generate command list.
                    for (let i = 0; i < e.length; i++) {
                        $('#custom-command-run').append($('<option/>', {
                            'text': '!' + e[i].key
                        }));
                    }

                    // Enable the select2 dropdown.
                    $('#custom-command-run').select2({
                        placeholder: 'Select a Command to Run'
                    }).tooltip('disable');

                    // Don't load chat or the player in debug mode.
                    // Twitch prints a bunch of errors in the iframe, so it gets confusing.
                    if (helpers.DEBUG_STATE === helpers.DEBUG_STATES.DEBUG) {
                        // This will be called once the css and everything is loaded.
                        $(document).ready(function() {
                            // Done loading, show main page.
                            $.showPage();
                            // Scroll to bottom of event log.
                            $('.event-log').scrollTop((helpers.isReverseSortEvents ? ($('.event-log').scrollTop() - $('.recent-events').height()) : $('.recent-events').height()));
                            // Disable chat and the player.
                            $('#twitch-chat-box').addClass('off');
                            $('#twitch-player-box').addClass('off');
                            // Set views if not hidden.
                            helpers.handlePanelSetInfo($('#dashboard-views').data('number', helpers.parseNumber(tempData.views)), 'dashboard-views', helpers.fixNumber(tempData.views));
                            // Set viewers.
                            helpers.handlePanelSetInfo($('#dashboard-viewers').data('number', helpers.parseNumber(tempData.viewers)), 'dashboard-viewers', helpers.fixNumber(tempData.viewers));
                            // Set followers.
                            helpers.handlePanelSetInfo($('#dashboard-followers').data('number', helpers.parseNumber(tempData.followers)), 'dashboard-followers', helpers.fixNumber(tempData.followers));
                        });
                    } else {
                        socket.getDBValues('dashboard_get_panel_toggles', {
                            tables: ['panelData', 'panelData'],
                            keys: ['hasChat', 'hasPlayer']
                        }, true, function(e) {
                            e.hasChat = (e.hasChat === 'true' || e.hasChat === null);
                            e.hasPlayer = (e.hasPlayer === 'true' || e.hasPlayer === null);

                            // Handle adding the chat.
                            if (e.hasChat) {
                                $('#twitch-chat-iframe').html($('<iframe/>', {
                                    'frameborder': '0',
                                    'scrolling': 'no',
                                    'style': 'width: 100%; height: 450px; margin-bottom: -5px;',
                                    'src': 'https://www.twitch.tv/embed/' + getChannelName() + '/chat' + (helpers.isDark ? '?darkpopout' : '')
                                }));
                            } else {
                                $('#twitch-chat-box').addClass('off');
                            }

                            // Handle adding the player.
                            if (e.hasPlayer) {
                                // Add the player.
                                $('#twitch-player-iframe').html($('<iframe/>', {
                                    'frameborder': '0',
                                    'scrolling': 'no',
                                    'style': 'width: 100%; height: 450px; margin-bottom: -5px;',
                                    'src': 'https://player.twitch.tv/?channel=' + getChannelName() + '&muted=true&autoplay=false'
                                }));
                            } else {
                                $('#twitch-player-box').addClass('off');
                            }

                            // Handle box sizes.
                            $('#twitch-chat-box').prop('class', (!e.hasPlayer ? 'col-md-12' : 'col-md-6'));
                            $('#twitch-player-box').prop('class', (!e.hasChat ? 'col-md-12' : 'col-md-6'));

                            // Handle toggles.
                            $('#toggle-chat').prop('checked', e.hasChat);
                            $('#toggle-player').prop('checked', e.hasPlayer);

                            // This will be called once the css and everything is loaded.
                            $(document).ready(function() {
                                // Done loading, show main page.
                                $.showPage();
                                // Scroll to bottom of event log.
                                $('.event-log').scrollTop((helpers.isReverseSortEvents ? ($('.event-log').scrollTop() - $('.recent-events').height()) : $('.recent-events').height()));
                                // Set views if not hidden.
                                helpers.handlePanelSetInfo($('#dashboard-views').data('number', helpers.parseNumber(tempData.views)), 'dashboard-views', helpers.fixNumber(tempData.views));
                                // Set viewers.
                                helpers.handlePanelSetInfo($('#dashboard-viewers').data('number', helpers.parseNumber(tempData.viewers)), 'dashboard-viewers', helpers.fixNumber(tempData.viewers));
                                // Set followers.
                                helpers.handlePanelSetInfo($('#dashboard-followers').data('number', helpers.parseNumber(tempData.followers)), 'dashboard-followers', helpers.fixNumber(tempData.followers));
                            });
                        });
                    }
                });
            });
        });
    });
});


// Function that handlers the loading of events.
$(function() {
    // handle auto complete.
    $('#stream-game').easyAutocomplete({
        'url': function (game) {
            return '/games?webauth=' + getAuth() + '&search=' + game;
        },
        'getValue': 'game',
        'requestDelay': 300,
        'list': {
            'match': {
                'enabled': true
            }
        }
    });

    // Input check for strings.
    $('input[data-str="text"]').on('input', function() {
        helpers.handleInputString($(this));
    });

    // Handle the hidding of the dashboard panels.
    $('#dashboard-views, #dashboard-followers, #dashboard-viewers').on('click', function(e) {
        helpers.handlePanelToggleInfo($(this), e.target.id);
    });

    $(window).resize(function() {
        let isSmall = $('.small-box').width() < 230;

        $('.small-box').each(function() {
            const h3 = $(this).find('h3');

            if (h3.attr('id') != 'dashboard-uptime') {
            	helpers.handlePanelSetInfo(h3, h3.attr('id'), h3.data('parsed'));
            }
        });
    });

    // Handle updating the title, game.
    $('#dashboard-btn-update').on('click', function() {
        // Update title.
        socket.sendCommand('update_title', 'settitlesilent ' + $('#stream-title').val(), function() {
            // Update game.
            socket.sendCommand('update_game', 'setgamesilent ' + $('#stream-game').val(), function() {
                toastr.success('Successfully updated stream information!');
            });
        });
    });

    // Handle user action button.
    $('.user-action').on('click', function() {
        let action = $(this).find('a').html().toLowerCase(),
            username = $('#user-action-user').val(),
            command;

        if (username.length < 1) {
            return;
        }

        switch (action) {
            case 'permit':
                command = 'permit ' + username;
                break;
            case 'shoutout':
                command = 'shoutout ' + username;
                break;
            case 'raid':
                command = 'raid ' + username;
                break;
            case 'host':
                command = 'host ' + username;
                break;
        }

        // Run the command.
        socket.sendCommand('user_action_cmd', command, function() {
            // Clear the input.
            $('#user-action-user').val('');
            // Let the user know.
            toastr.success('Successfully ran action on ' + username + '!');
        });
    });

    // Handle custom command run.
    $('#custom-command-run').on('select2:select', function(e) {
        socket.sendCommand('send_command', e.params.data.text.substr(1), function() {
            // Alert user.
            toastr.success('Successfully ran command ' + e.params.data.text);
            // Clear input.
            $('#custom-command-run').val('').trigger('change');
        });
    });

    // Mouse hover/leave event log.
    $('.event-log').on('mouseenter mouseleave', function(event) {
        canScroll = event.type === 'mouseleave';
    });

    // Handle player toggle
    $('#toggle-player').off().on('click', function() {
        let checked = $(this).is(':checked');

        // Update the toggle.
        socket.updateDBValue('panel_chat_toggle', 'panelData', 'hasPlayer', checked, function() {
            if (checked) {
                $('#twitch-player-iframe').html($('<iframe/>', {
                    'frameborder': '0',
                    'scrolling': 'no',
                    'style': 'width: 100%; height: 450px; margin-bottom: -5px;',
                    'src': 'https://player.twitch.tv/?channel=' + getChannelName() + '&muted=true&autoplay=false'
                }));
                // Handle the box size.
                if ($('#twitch-chat-iframe').html().length > 0) {
                    $('#twitch-player-box').prop('class', 'col-md-6').removeClass('off');
                    $('#twitch-chat-box').prop('class', 'col-md-6');
                } else {
                    $('#twitch-player-box').prop('class', 'col-md-12');
                }
            } else {
                $('#twitch-player-iframe').html('');
                $('#twitch-player-box').addClass('off');
                $('#twitch-chat-box').prop('class', 'col-md-12');
            }
        });
    });

    // Handle chat toggle.
    $('#toggle-chat').off().on('click', function() {
        let checked = $(this).is(':checked');

        // Update the toggle.
        socket.updateDBValue('panel_chat_toggle', 'panelData', 'hasChat', checked, function() {
            if (checked) {
                $('#twitch-chat-iframe').html($('<iframe/>', {
                    'frameborder': '0',
                    'scrolling': 'no',
                    'style': 'width: 100%; height: 450px; margin-bottom: -5px;',
                    'src': 'https://www.twitch.tv/embed/' + getChannelName() + '/chat' + (helpers.isDark ? '?darkpopout' : '')
                }));

                // Handle the box size.
                if ($('#twitch-player-iframe').html().length > 0) {
                    $('#twitch-chat-box').prop('class', 'col-md-6').removeClass('off');
                    $('#twitch-player-box').prop('class', 'col-md-6');
                } else {
                    $('#twitch-chat-box').prop('class', 'col-md-12');
                }
            } else {
                $('#twitch-chat-iframe').html('');
                $('#twitch-chat-box').addClass('off');
                $('#twitch-player-box').prop('class', 'col-md-12');
            }
        });
    });

    // Event sorting toggle.
    $('#toggle-reverse-events').off().on('click', function() {
        socket.updateDBValue('event_sort_update', 'panelData', 'isReverseSortEvents', $(this).is(':checked'), function() {
            window.location.reload();
        });
    });

    // Set an interval that updates basic panel info every 10 seconds.
    helpers.setInterval(function() {
        helpers.log('Refreshing dashboard data.', helpers.LOG_TYPE.INFO);
        // Query stream data.
        socket.getDBValue('dashboard_get_data_refresh', 'panelData', 'stream', function(e) {
            // Parse our object.
            e = JSON.parse(e.panelData);
            // Set views if not hidden.
            helpers.handlePanelSetInfo($('#dashboard-views').data('number', helpers.parseNumber(e.views)), 'dashboard-views', helpers.fixNumber(e.views));
            // Set viewers.
            helpers.handlePanelSetInfo($('#dashboard-viewers').data('number', helpers.parseNumber(e.viewers)), 'dashboard-viewers', helpers.fixNumber(e.viewers));
            // Set followers.
            helpers.handlePanelSetInfo($('#dashboard-followers').data('number', helpers.parseNumber(e.followers)), 'dashboard-followers', helpers.fixNumber(e.followers));
            // Set uptime.
            if (e.isLive) {
                $('#dashboard-uptime').html(e.uptime);
                $('#bg-uptime').removeClass('bg-red').addClass('bg-green');
            } else {
                $('#dashboard-uptime').html('Offline');
                $('#bg-uptime').removeClass('bg-green').addClass('bg-red');
            }
        });

        // Query event log.
        socket.getDBValue('dashboard_get_events_refresh', 'panelData', 'data', function(e) {
            if (e.panelData !== null && e.panelData.length > 0) {
                let events = JSON.parse(e.panelData);

                // This should never be null unless the user removes the DB table.
                if (events !== null) {

                    // Sort events if needed.
                    if (helpers.isReverseSortEvents) {
                        events.sort(function(a, b) {
                            return b.date - a.date;
                        });
                    } else {
                        events.sort(function(a, b) {
                            return a.date - b.date;
                        });
                    }

                    let htmlEvents = $('<ul/>', {
                        'class': 'recent-events'
                    });
                    for (let i = 0; i < events.length; i++) {
                        let p = $('<p/>');

                        // Append date.
                        p.append($('<span/>', {
                            'class': 'event-date',
                            'html': helpers.getPaddedDateString(new Date(events[i].date).toLocaleString()) + ' '
                        }));

                        // Append type.
                        p.append($('<span/>', {
                            'class': 'label',
                            'style': helpers.getEventColor(events[i].type),
                            'html': events[i].type
                        }))

                        // Append message.
                        p.append($('<span/>', {
                            'html': ' ' + helpers.getEventMessage(events[i])
                        }));

                        // Append to list.
                        htmlEvents.append(p);
                    }

                    // Append the information to the main div.
                    $('.event-log').html(htmlEvents);
                    // Scroll to bottom of event log if the user isn't checking it.
                    if (canScroll) {
                        $('.event-log').scrollTop((helpers.isReverseSortEvents ? ($('.event-log').scrollTop() - $('.recent-events').height()) : $('.recent-events').height()));
                    }
                }
            }
        });
    }, 1e4);
});
