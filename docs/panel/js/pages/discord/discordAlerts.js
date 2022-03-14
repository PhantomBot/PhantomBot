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

// Main function that gets all of our data.
$(function () {
    // Get all module toggles.
    socket.getDBValues('alerts_get_modules', {
        tables: ['modules', 'modules', 'modules', 'modules', 'modules', 'modules', 'modules', 'modules', 'modules', 'modules', 'modules', 'modules'],
        keys: ['./discord/handlers/followHandler.js', './discord/handlers/subscribeHandler.js', './discord/handlers/hostHandler.js',
            './discord/handlers/bitsHandler.js', './discord/handlers/clipHandler.js', './discord/systems/greetingsSystem.js', './discord/handlers/streamlabsHandler.js',
            './discord/handlers/raidHandler.js', './discord/handlers/tipeeeStreamHandler.js', './discord/handlers/streamElementsHandler.js',
            './discord/handlers/twitterHandler.js', './discord/handlers/streamHandler.js']
    }, true, function (e) {
        // Handle the settings button.
        let keys = Object.keys(e),
                module = '',
                i;
        for (i = 0; i < keys.length; i++) {
            module = keys[i].substring(keys[i].lastIndexOf('/') + 1).replace('.js', '');
            // Handle the status of the buttons.
            if (e[keys[i]] === 'false') {
                // Handle the switch.
                $('#' + module + 'Toggle').prop('checked', false);
                // Handle the settings button.
                $('#discord' + (module.charAt(0).toUpperCase() + module.substring(1)) + 'Settings').prop('disabled', true);
            }
        }
    });
});

// Function that handles events
$(function () {
    let discordChannels = null;
    let allowedChannelTypes = ['GUILD_NEWS', 'GUILD_TEXT'];
    let callback = null;

    function refreshChannels(oncomplete) {
        callback = oncomplete;
        socket.getDiscordChannelList('discord_alerts_getchannels', function (d) {
            discordChannels = d.data;
            if (callback !== undefined && callback !== null) {
                callback();
            }
        });
    }

    function getChannelSelector(id, title, placeholder, value, tooltip, allowedChannelTypes) {
        if (discordChannels === null) {
            return helpers.getInputGroup(id, 'text', title, placeholder, value, tooltip);
        } else {
            let data = [];

            for (const [category, channels] of Object.entries(discordChannels)) {
                let entry = {};
                entry.title = channels.name;
                entry.options = [];

                for (const [channel, info] of Object.entries(channels)) {
                    if (channel === 'name') {
                        continue;
                    }

                    entry.options.push({
                        'name': info.name,
                        'value': channel,
                        'selected': channel === value,
                        'disabled': !allowedChannelTypes.includes(info.type)
                    });
                }

                data.push(entry);
            }

            return helpers.getDropdownGroupWithGrouping(id, title, data, tooltip);
        }
    }

    function discordChannelTemplate(fchannel) {
        if (discordChannels === undefined || discordChannels === null) {
            return $('<span><i class="fa fa-triangle-exclamation fa-lg" style="margin-right: 5px;" /> Unable retrieve channel list</span>');
        }
        if (fchannel.id) {
            for (const [category, channels] of Object.entries(discordChannels)) {
                for (const [channel, info] of Object.entries(channels)) {
                    if (fchannel.id === channel) {
                        switch (info.type) {
                            case 'GUILD_NEWS':
                                return $('<span><i class="fa fa-bullhorn fa-lg" style="margin-right: 5px;" /> ' + info.name + '</span>');
                            case 'GUILD_STAGE_VOICE':
                                return $('<span><i class="fa fa-users fa-lg" style="margin-right: 5px;" /> ' + info.name + '</span>');
                            case 'GUILD_STORE':
                                return $('<span><i class="fa fa-shopping-cart fa-lg" style="margin-right: 5px;" /> ' + info.name + '</span>');
                            case 'GUILD_TEXT':
                                return $('<span><i class="fa fa-hashtag fa-lg" style="margin-right: 5px;" /> ' + info.name + '</span>');
                            case 'GUILD_VOICE':
                                return $('<span><i class="fa fa-volume-up fa-lg" style="margin-right: 5px;" /> ' + info.name + '</span>');
                        }
                    }
                }
            }
        }

        return fchannel.text;
    }

    // Toggle for the alert modules.
    $('[data-alert-toggle]').on('change', function () {
        let name = $(this).attr('id'),
                checked = $(this).is(':checked');

        // Handle the module.
        socket.sendCommandSync('discord_alerts_module_toggle', 'module '
                + (checked ? 'enablesilent' : 'disablesilent') + ' ' + $(this).data('alert-toggle'), function () {
            name = name.replace('Toggle', 'Settings');
            // Toggle the settings button.
            $('#discord' + name.charAt(0).toUpperCase() + name.substring(1)).prop('disabled', !checked);
            // Alert the user.
            toastr.success('Successfully ' + (checked ? 'enabled' : 'disabled') + ' the alert module!');
        });
    });

    // Follower alert.
    $('#discordFollowHandlerSettings').on('click', function () {
        socket.getDBValues('discord_alerts_follow_get_settings', {
            tables: ['discordSettings', 'discordSettings', 'discordSettings'],
            keys: ['followToggle', 'followMessage', 'followChannel']
        }, true, function (e) {
            helpers.getModal('follow-alert', 'Follower Alert Settings', 'Save', $('<form/>', {
                'role': 'form'
            })
                    // Add the toggle for follow alerts.
                    .append(helpers.getDropdownGroup('follow-toggle', 'Enable Follow Alerts', (e.followToggle === 'true' ? 'Yes' : 'No'), ['Yes', 'No'],
                            'If a message should be said in the channel when someone follows.'))
                    // Add the the text area for the follow message.
                    .append(helpers.getTextAreaGroup('follow-message', 'text', 'Follow Message', '', e.followMessage,
                            'Message said when someone follows the channel. Tag: (name)', false))
                    // Add the the box for the reward.
                    .append(getChannelSelector('follow-channel', 'Alert Channel', '#alerts', e.followChannel,
                            'Channel where all alerts should go to.', allowedChannelTypes)),
                    function () { // Callback once the user clicks save.
                        let followToggle = $('#follow-toggle').find(':selected').text() === 'Yes',
                                followMessage = $('#follow-message'),
                                followChannel = $('#follow-channel');

                        // Make sure everything has been filled it correctly.
                        switch (false) {
                            case helpers.handleInputString(followMessage):
                            case helpers.handleInputString(followChannel):
                                break;
                            default:
                                // Update settings.
                                socket.updateDBValues('discord_alerts_follow_update_settings', {
                                    tables: ['discordSettings', 'discordSettings', 'discordSettings'],
                                    keys: ['followToggle', 'followMessage', 'followChannel'],
                                    values: [followToggle, followMessage.val(), followChannel.val()]
                                }, function () {
                                    socket.wsEvent('discord', './discord/handlers/followHandler.js', '', [], function () {
                                        // Close the modal.
                                        $('#follow-alert').modal('toggle');
                                        // Alert the user.
                                        toastr.success('Successfully updated the follower alert settings!');
                                    });
                                });
                        }
                    }).on('shown.bs.modal', function (e) {
                refreshChannels(function () {
                    if (discordChannels !== null) {
                        $('#follow-channel').select2({templateResult: discordChannelTemplate});
                    }
                });
            }).modal('toggle');
        });
    });

    // Subscriber alerts.
    $('#discordSubscribeHandlerSettings').on('click', function () {
        socket.getDBValues('discord_alerts_subscribe_get_settings', {
            tables: ['discordSettings', 'discordSettings', 'discordSettings', 'discordSettings', 'discordSettings', 'discordSettings', 'discordSettings', 'discordSettings', 'discordSettings'],
            keys: ['subMessage', 'primeMessage', 'resubToggle', 'giftsubMessage', 'subToggle', 'primeToggle', 'resubMessage', 'giftsubToggle', 'subChannel']
        }, true, function (e) {
            helpers.getModal('subscribe-alert', 'Subscriber Alert Settings', 'Save', $('<form/>', {
                'role': 'form'
            })
                    // Add the div for the col boxes.
                    .append($('<div/>', {
                        'class': 'panel-group',
                        'id': 'accordion'
                    })
                            // Append first collapsible accordion.
                            .append(helpers.getCollapsibleAccordion('main-1', 'Subscription Settings', $('<form/>', {
                                'role': 'form'
                            })
                                    // Add toggle for normal subscriptions.
                                    .append(helpers.getDropdownGroup('sub-toggle', 'Enable Subscription Alerts', (e.subToggle === 'true' ? 'Yes' : 'No'), ['Yes', 'No'],
                                            'If a message should be said in a channel when someone subscribes.'))
                                    // Append message box for the message
                                    .append(helpers.getTextAreaGroup('sub-msg', 'text', 'Subscription Message', '', e.subMessage,
                                            'Message said when someone subscribes to the channel. Tags: (name) and (plan)', false))))
                            // Append second collapsible accordion.
                            .append(helpers.getCollapsibleAccordion('main-2', 'Prime Subscription Settings', $('<form/>', {
                                'role': 'form'
                            })
                                    // Add toggle for prime subscriptions.
                                    .append(helpers.getDropdownGroup('primesub-toggle', 'Enable Prime Subscription Alerts', (e.primeToggle === 'true' ? 'Yes' : 'No'), ['Yes', 'No'],
                                            'If a message should be said in the channel when someone subscribes with Twitch Prime.'))
                                    // Append message box for the message
                                    .append(helpers.getTextAreaGroup('primesub-msg', 'text', 'Prime Subscription Message', '', e.primeMessage,
                                            'Message said when someone subscribes to the channel with Twitch Prime. Tags: (name) and (plan)', false))))
                            // Append third collapsible accordion.
                            .append(helpers.getCollapsibleAccordion('main-3', 'Re-subscription Settings', $('<form/>', {
                                'role': 'form'
                            })
                                    // Add toggle for resubscriptions.
                                    .append(helpers.getDropdownGroup('resub-toggle', 'Enable Re-subscription Alerts', (e.resubToggle === 'true' ? 'Yes' : 'No'), ['Yes', 'No'],
                                            'If a message should be said in the channel when someone resubscribes.'))
                                    // Append message box for the message
                                    .append(helpers.getTextAreaGroup('resub-msg', 'text', 'Re-subscription Message', '', e.resubMessage,
                                            'Message said when someone resubscribes to the channel. Tags: (name), (plan), and (months)', false))))
                            // Append forth collapsible accordion.
                            .append(helpers.getCollapsibleAccordion('main-4', 'Gifted Subscription Settings', $('<form/>', {
                                'role': 'form'
                            })
                                    // Add toggle for gifted subscriptions.
                                    .append(helpers.getDropdownGroup('gifsub-toggle', 'Enable Gifted Subscription Alerts', (e.giftsubToggle === 'true' ? 'Yes' : 'No'), ['Yes', 'No'],
                                            'If a message should be said in the channel when someone gifts a subscription. This also toggles the reward.'))
                                    // Append message box for the message
                                    .append(helpers.getTextAreaGroup('gifsub-msg', 'text', 'Gifted Subscription Message', '', e.giftsubMessage,
                                            'Message said when someone resubscribes to the channel. Tags: (name), (recipient), (plan), and (months)', false))))
                            // Append fifth collapsible accordion.
                            .append(helpers.getCollapsibleAccordion('main-5', 'Alert Channel Settings', $('<form/>', {
                                'role': 'form'
                            })
                                    // Add channel box.
                                    .append(getChannelSelector('channel-alert', 'Alert Channel', '#alerts', e.subChannel,
                                            'Channel where all alerts should go to.', allowedChannelTypes))))),
                    function () { // Callback once the user clicks save.
                        let subToggle = $('#sub-toggle').find(':selected').text() === 'Yes',
                                subMsg = $('#sub-msg'),
                                primeSubToggle = $('#primesub-toggle').find(':selected').text() === 'Yes',
                                primeSubMsg = $('#primesub-msg'),
                                reSubToggle = $('#resub-toggle').find(':selected').text() === 'Yes',
                                reSubMsg = $('#resub-msg'),
                                gifSubToggle = $('#gifsub-toggle').find(':selected').text() === 'Yes',
                                gifSubMsg = $('#gifsub-msg'),
                                subChannel = $('#channel-alert'),
                                gifSubReward = $('#gifsub-reward');

                        // Make sure the user has someone in each box.
                        switch (false) {
                            case helpers.handleInputString(subMsg):
                            case helpers.handleInputString(primeSubMsg):
                            case helpers.handleInputString(reSubMsg):
                            case helpers.handleInputString(gifSubMsg):
                                break;
                            default:
                                socket.updateDBValues('discord_alerts_subscribe_update_settings', {
                                    tables: ['discordSettings', 'discordSettings', 'discordSettings', 'discordSettings', 'discordSettings', 'discordSettings', 'discordSettings', 'discordSettings', 'discordSettings'],
                                    keys: ['subMessage', 'primeMessage', 'resubMessage', 'giftsubMessage', 'subToggle', 'primeToggle', 'resubToggle', 'giftsubToggle', 'subChannel'],
                                    values: [subMsg.val(), primeSubMsg.val(), reSubMsg.val(), gifSubMsg.val(), subToggle, primeSubToggle, reSubToggle, gifSubToggle, subChannel.val()]
                                }, function () {
                                    socket.wsEvent('discord', './discord/handlers/subscribeHandler.js', '', [], function () {
                                        // Close the modal.
                                        $('#subscribe-alert').modal('toggle');
                                        // Alert the user.
                                        toastr.success('Successfully updated subscription alert settings!');
                                    });
                                });
                        }
                    }).on('shown.bs.modal', function (e) {
                refreshChannels(function () {
                    if (discordChannels !== null) {
                        $('#channel-alert').select2({templateResult: discordChannelTemplate});
                    }
                });
            }).modal('toggle');
        });
    });

    // Host settings button.
    $('#discordHostHandlerSettings').on('click', function () {
        socket.getDBValues('alerts_get_host_settings', {
            tables: ['discordSettings', 'discordSettings', 'discordSettings'],
            keys: ['hostToggle', 'hostMessage', 'hostChannel']
        }, true, function (e) {
            helpers.getModal('host-alert', 'Host Alert Settings', 'Save', $('<form/>', {
                'role': 'form'
            })
                    // Add the div for the col boxes.
                    .append($('<div/>', {
                        'class': 'panel-group',
                        'id': 'accordion'
                    })
                            // Add the toggle for host alerts.
                            .append(helpers.getDropdownGroup('host-toggle', 'Enable Host Alerts', (e.hostToggle === 'true' ? 'Yes' : 'No'), ['Yes', 'No'],
                                    'If a message should be said in the channel when someone follows.'))
                            // Add the the text area for the host message.
                            .append(helpers.getTextAreaGroup('host-message', 'text', 'Host Message', '', e.hostMessage,
                                    'Message said when someone hosts the channel. Tag: (name) and (viewers)', false))
                            // Add the the box for the reward.
                            .append(getChannelSelector('host-channel', 'Alert Channel', '#alerts', e.hostChannel,
                                    'Channel where all alerts should go to.', allowedChannelTypes))),
                    function () { // Callback once the user clicks save.
                        let hostToggle = $('#host-toggle').find(':selected').text() === 'Yes',
                                hostMsg = $('#host-message'),
                                hostChannel = $('#host-channel');

                        // Make sure the user has someone in each box.
                        switch (false) {
                            case helpers.handleInputString(hostMsg):
                                break;
                            default:
                                socket.updateDBValues('alerts_update_host_settings', {
                                    tables: ['discordSettings', 'discordSettings', 'discordSettings'],
                                    keys: ['hostToggle', 'hostMessage', 'hostChannel'],
                                    values: [hostToggle, hostMsg.val(), hostChannel.val()]
                                }, function () {
                                    socket.wsEvent('discord', './discord/handlers/hostHandler.js', '', [], function () {
                                        // Close the modal.
                                        $('#host-alert').modal('toggle');
                                        // Alert the user.
                                        toastr.success('Successfully updated host alert settings!');
                                    });
                                });
                        }

                    }).on('shown.bs.modal', function (e) {
                refreshChannels(function () {
                    if (discordChannels !== null) {
                        $('#host-channel').select2({templateResult: discordChannelTemplate});
                    }
                });
            }).modal('toggle');
        });
    });

    // Bits settings.
    $('#discordBitsHandlerSettings').on('click', function () {
        socket.getDBValues('discord_alerts_get_bits_settings', {
            tables: ['discordSettings', 'discordSettings', 'discordSettings'],
            keys: ['bitsToggle', 'bitsMessage', 'bitsChannel']
        }, true, function (e) {
            helpers.getModal('bits-alert', 'Bits Alert Settings', 'Save', $('<form/>', {
                'role': 'form'
            })
                    // Add the toggle for bits alerts.
                    .append(helpers.getDropdownGroup('bits-toggle', 'Enable Bits Alerts', (e.bitsToggle === 'true' ? 'Yes' : 'No'), ['Yes', 'No'],
                            'If a message should be said in the channel when someone cheers.'))
                    // Add the the text area for the bits message.
                    .append(helpers.getTextAreaGroup('bits-message', 'text', 'Bits Message', '', e.bitsMessage,
                            'Message said when someone cheers in the the channel. Tags: (name), (message), and (amount)', false))
                    // Add the box for the reward.
                    .append(getChannelSelector('bits-channel', 'Alert Channel', '#alerts', e.bitsChannel,
                            'The channel the bits message is sent in.', allowedChannelTypes)),
                    function () { // Callback once the user clicks save.
                        let bitsToggle = $('#bits-toggle').find(':selected').text() === 'Yes',
                                bitsMsg = $('#bits-message'),
                                bitsChan = $('#bits-channel');

                        // Make sure the user has someone in each box.
                        switch (false) {
                            case helpers.handleInputString(bitsMsg):
                                break;
                            default:
                                socket.updateDBValues('alerts_update_bits_settings', {
                                    tables: ['discordSettings', 'discordSettings', 'discordSettings'],
                                    keys: ['bitsToggle', 'bitsMessage', 'bitsChannel'],
                                    values: [bitsToggle, bitsMsg.val(), bitsChan.val()]
                                }, function () {
                                    socket.wsEvent('discord', './discord/handlers/bitsHandler.js', '', [], function () {
                                        // Close the modal.
                                        $('#bits-alert').modal('toggle');
                                        // Alert the user.
                                        toastr.success('Successfully updated Bits alert settings!');
                                    });
                                });
                        }
                    }).on('shown.bs.modal', function (e) {
                refreshChannels(function () {
                    if (discordChannels !== null) {
                        $('#bits-channel').select2({templateResult: discordChannelTemplate});
                    }
                });
            }).modal('toggle');
        });
    });

    // Clips handler.
    $('#discordClipHandlerSettings').on('click', function () {
        socket.getDBValues('alerts_get_clip_settings', {
            tables: ['discordSettings', 'discordSettings', 'discordSettings'],
            keys: ['clipsToggle', 'clipsMessage', 'clipsChannel']
        }, true, function (e) {
            helpers.getModal('clip-alert', 'Clip Alert Settings', 'Save', $('<form/>', {
                'role': 'form'
            })
                    // Add the toggle for clip alerts.
                    .append(helpers.getDropdownGroup('clip-toggle', 'Enable Clip Alerts', (e.clipsToggle === 'true' ? 'Yes' : 'No'), ['Yes', 'No'],
                            'If a message should be said in the channel when someone creates a clip.'))
                    // Add the text area for the clips message.
                    .append(helpers.getTextAreaGroup('clip-message', 'text', 'Clip Message', '', e.clipsMessage,
                            'Message said when someone creates a clip. Tags: (name), (embedurl) - to be used as the entire message, and (url)', false))
                    // Add the text area for the clips channel.
                    .append(getChannelSelector('clip-channel', 'Alert Channel', '#alerts', e.clipsChannel,
                            'The channel where clips will be posted.', allowedChannelTypes)),
                    function () { // Callback once the user clicks save.
                        let clipToggle = $('#clip-toggle').find(':selected').text() === 'Yes',
                                clipMsg = $('#clip-message'),
                                clipsChan = $('#clip-channel');

                        // Make sure the user has someone in each box.
                        switch (false) {
                            case helpers.handleInputString(clipMsg):
                                break;
                            default:
                                socket.updateDBValues('alerts_update_clip_settings', {
                                    tables: ['discordSettings', 'discordSettings', 'discordSettings'],
                                    keys: ['clipsToggle', 'clipsMessage', 'clipsChannel'],
                                    values: [clipToggle, clipMsg.val(), clipsChan.val()]
                                }, function () {
                                    socket.wsEvent('discord', './discord/handlers/clipHandler.js', '', [], function () {
                                        // Close the modal.
                                        $('#clip-alert').modal('toggle');
                                        // Alert the user.
                                        toastr.success('Successfully updated Clip alert settings!');
                                    });
                                });
                        }
                    }).on('shown.bs.modal', function (e) {
                refreshChannels(function () {
                    if (discordChannels !== null) {
                        $('#clip-channel').select2({templateResult: discordChannelTemplate});
                    }
                });
            }).modal('toggle');
        });
    });

    // Stream Alert settings.
    $('#discordStreamHandlerSettings').on('click', function () {
        socket.getDBValues('alerts_get_stream_settings', {
            tables: ['discordSettings', 'discordSettings', 'discordSettings', 'discordSettings',
                'discordSettings', 'discordSettings', 'discordSettings', 'discordSettings',
                'discordSettings'],
            keys: ['onlineToggle', 'onlineMessage', 'offlineToggle', 'offlineMessage',
                'gameToggle', 'gameMessage', 'botGameToggle', 'onlineChannel', 'deleteMessageToggle']
        }, true, function (e) {
            helpers.getModal('stream-alert', 'Stream Alert Settings', 'Save', $('<form/>', {
                'role': 'form'
            })
                    // Add the div for the col boxes.
                    .append($('<div/>', {
                        'class': 'panel-group',
                        'id': 'accordion'
                    })
                            // Append first collapsible accordion.
                            .append(helpers.getCollapsibleAccordion('main-1', 'Online Settings', $('<form/>', {
                                'role': 'form'
                            })
                                    // Add the toggle for online alerts.
                                    .append(helpers.getDropdownGroup('online-toggle', 'Enable Online Alerts', (e.onlineToggle === 'true' ? 'Yes' : 'No'), ['Yes', 'No'],
                                            'If a message should be said in the channel when you go live on Twitch.'))
                                    // Add the toggle for auto bot streaming status
                                    .append(helpers.getDropdownGroup('online-status', 'Enable Bot Status', (e.botGameToggle === 'true' ? 'Yes' : 'No'), ['Yes', 'No'],
                                            'Show your bot as streaming when you go live.'))
                                    // Add the text area for the online message.
                                    .append(helpers.getTextAreaGroup('online-message', 'text', 'Online Message', '', e.onlineMessage,
                                            'Message said when you go live. This message is in an embed style. Tags: (name)', false))))
                            // Append second collapsible accordion.
                            .append(helpers.getCollapsibleAccordion('main-2', 'Offline Settings', $('<form/>', {
                                'role': 'form'
                            })
                                    // Add the toggle for offline alerts.
                                    .append(helpers.getDropdownGroup('offline-toggle', 'Enable Offline Alerts', (e.offlineToggle === 'true' ? 'Yes' : 'No'), ['Yes', 'No'],
                                            'If a message should be said in the channel when you go offline on Twitch.'))
                                    // Add the text area for the offline message.
                                    .append(helpers.getTextAreaGroup('offline-message', 'text', 'Offline Message', '', e.offlineMessage,
                                            'Message said when you go offline. This message is in an embed style. Tags: (name)', false))))
                            // Append third collapsible accordion.
                            .append(helpers.getCollapsibleAccordion('main-3', 'Game Change Settings', $('<form/>', {
                                'role': 'form'
                            })
                                    // Add the toggle for offline alerts.
                                    .append(helpers.getDropdownGroup('game-toggle', 'Enable Game Change Alerts', (e.gameToggle === 'true' ? 'Yes' : 'No'), ['Yes', 'No'],
                                            'If a message should be said in the channel when you switch games on Twitch.'))
                                    // Add the text area for the offline message.
                                    .append(helpers.getTextAreaGroup('game-message', 'text', 'Game Change Message', '', e.gameMessage,
                                            'Message said when you change games on Twitch. Tags: (name)', false))))
                            // Append forth collapsible accordion.
                            .append(helpers.getCollapsibleAccordion('main-4', 'Alert Channel Settings', $('<form/>', {
                                'role': 'form'
                            })
                                    // Add channel box.
                                    .append(getChannelSelector('channel-alert', 'Alert Channel', '#alerts', e.onlineChannel,
                                            'Channel where all alerts should go to.', allowedChannelTypes))
                                    // Add the toggle for auto bot streaming status
                                    .append(helpers.getDropdownGroup('delete-message', 'Delete alerts automatically', (e.deleteMessageToggle === 'true' ? 'Yes' : 'No'), ['Yes', 'No'],
                                            'Automatically delete the online message after the stream ends and the offline message when a new stream starts.'))))),
                    function () {
                        let onlineToggle = $('#online-toggle').find(':selected').text() === 'Yes',
                                statusToggle = $('#online-status').find(':selected').text() === 'Yes',
                                onlineMessage = $('#online-message'),
                                offlineToggle = $('#offline-toggle').find(':selected').text() === 'Yes',
                                offlineMessage = $('#offline-message'),
                                gameToggle = $('#game-toggle').find(':selected').text() === 'Yes',
                                gameMessage = $('#game-message'),
                                channel = $('#channel-alert'),
                                deleteMessageToggle = $('#delete-message').find(':selected').text() === 'Yes';

                        switch (false) {
                            case helpers.handleInputString(onlineMessage):
                            case helpers.handleInputString(offlineMessage):
                            case helpers.handleInputString(gameMessage):
                                break;
                            default:
                                socket.updateDBValues('discord_stream_alerts_updater', {
                                    tables: ['discordSettings', 'discordSettings', 'discordSettings', 'discordSettings',
                                        'discordSettings', 'discordSettings', 'discordSettings', 'discordSettings',
                                        'discordSettings', ],
                                    keys: ['onlineToggle', 'onlineMessage', 'offlineToggle', 'offlineMessage',
                                        'gameToggle', 'gameMessage', 'botGameToggle', 'onlineChannel', 'deleteMessageToggle'],
                                    values: [onlineToggle, onlineMessage.val(), offlineToggle, offlineMessage.val(),
                                        gameToggle, gameMessage.val(), statusToggle, channel.val(), deleteMessageToggle]
                                }, function () {
                                    socket.wsEvent('discord', './discord/handlers/streamHandler.js', '', [], function () {
                                        // Close the modal.
                                        $('#stream-alert').modal('toggle');
                                        // Alert the user.
                                        toastr.success('Successfully updated stream alert settings!');
                                    });
                                });
                        }
                    }).on('shown.bs.modal', function (e) {
                refreshChannels(function () {
                    if (discordChannels !== null) {
                        $('#channel-alert').select2({templateResult: discordChannelTemplate});
                    }
                });
            }).modal('toggle');
        });
    });

    // Greetings alerts.
    $('#discordGreetingsSystemSettings').on('click', function () {
        socket.getDBValues('alerts_get_greetings_settings', {
            tables: ['discordSettings', 'discordSettings', 'discordSettings', 'discordSettings',
                'discordSettings', 'discordSettings'],
            keys: ['joinToggle', 'partToggle', 'joinMessage', 'partMessage', 'greetingsChannel',
                'greetingsDefaultGroup']
        }, true, function (e) {
            helpers.getModal('greeting-alert', 'Greetings Settings', 'Save', $('<form/>', {
                'role': 'form'
            })
                    // Add the div for the col boxes.
                    .append($('<div/>', {
                        'class': 'panel-group',
                        'id': 'accordion'
                    })
                            // Append first collapsible accordion.
                            .append(helpers.getCollapsibleAccordion('main-1', 'Join Settings', $('<form/>', {
                                'role': 'form'
                            })
                                    // Add the toggle for alert
                                    .append(helpers.getDropdownGroup('join-toggle', 'Enable Join Messages', (e.joinToggle === 'true' ? 'Yes' : 'No'), ['Yes', 'No'],
                                            'If a message should be said in the channel when someone joins your Discord.'))
                                    // Add a box for the join role.
                                    .append(helpers.getInputGroup('join-role', 'text', 'Join Role', 'Newbie', e.greetingsDefaultGroup,
                                            'Default role applied to new users who join your Discord.'))
                                    // Add the text area for the message.
                                    .append(helpers.getTextAreaGroup('join-message', 'text', 'Join Message', '', e.joinMessage,
                                            'Message said when someone joins your Discord. Tags: (name) and (@name)', false))))
                            // Append second collapsible accordion.
                            .append(helpers.getCollapsibleAccordion('main-2', 'Part Settings', $('<form/>', {
                                'role': 'form'
                            })
                                    // Add the toggle for part alerts.
                                    .append(helpers.getDropdownGroup('part-toggle', 'Enable Part Messages', (e.partToggle === 'true' ? 'Yes' : 'No'), ['Yes', 'No'],
                                            'If a message should be said in the channel when someone leaves your Discord.'))
                                    // Add the text area for the part message.
                                    .append(helpers.getTextAreaGroup('part-message', 'text', 'Part Message', '', e.partMessage,
                                            'Message said when someone leaves your Discord. Tags: (name) and (@name)', false))))
                            // Append third collapsible accordion.
                            .append(helpers.getCollapsibleAccordion('main-3', 'Alert Channel Settings', $('<form/>', {
                                'role': 'form'
                            })
                                    // Add channel box.
                                    .append(getChannelSelector('channel-alert', 'Alert Channel', '#alerts', e.greetingsChannel,
                                            'Channel where all alerts should go to.', allowedChannelTypes))))),
                    function () {
                        let joinToggle = $('#join-toggle').find(':selected').text() === 'Yes',
                                partToggle = $('#part-toggle').find(':selected').text() === 'Yes',
                                partMessage = $('#part-message'),
                                joinMessage = $('#join-message'),
                                joinRole = $('#join-role'),
                                channel = $('#channel-alert');

                        switch (false) {
                            case helpers.handleInputString(joinMessage):
                            case helpers.handleInputString(partMessage):
                            case helpers.handleInputString(channel):
                                break;
                            default:
                                socket.updateDBValues('discord_greetings_alerts_updater', {
                                    tables: ['discordSettings', 'discordSettings', 'discordSettings', 'discordSettings',
                                        'discordSettings', 'discordSettings'],
                                    keys: ['joinToggle', 'partToggle', 'joinMessage', 'partMessage', 'greetingsChannel',
                                        'greetingsDefaultGroup'],
                                    values: [joinToggle, partToggle, joinMessage.val(), partMessage.val(),
                                        channel.val(), joinRole.val()]
                                }, function () {
                                    socket.wsEvent('discord', './discord/systems/greetingsSystem.js', '', [], function () {
                                        // Close the modal.
                                        $('#greeting-alert').modal('toggle');
                                        // Alert the user.
                                        toastr.success('Successfully updated greetings alert settings!');
                                    });
                                });
                        }
                    }).on('shown.bs.modal', function (e) {
                refreshChannels(function () {
                    if (discordChannels !== null) {
                        $('#channel-alert').select2({templateResult: discordChannelTemplate});
                    }
                });
            }).modal('toggle');
        });
    });

    // StreamLabs settings.
    $('#discordStreamlabsHandlerSettings').on('click', function () {
        socket.getDBValues('discord_alerts_streamlabs_get_settings', {
            tables: ['discordSettings', 'discordSettings', 'discordSettings'],
            keys: ['streamlabsToggle', 'streamlabsMessage', 'streamlabsChannel']
        }, true, function (e) {
            helpers.getModal('streamlabs-alert', 'StreamLabs Alert Settings', 'Save', $('<form/>', {
                'role': 'form'
            })
                    // Add the toggle for follow alerts.
                    .append(helpers.getDropdownGroup('streamlabs-toggle', 'Enable StreamLabs Alerts', (e.streamlabsToggle === 'true' ? 'Yes' : 'No'), ['Yes', 'No'],
                            'If a message should be said in the channel when someone tips.'))
                    // Add the the text area for the follow message.
                    .append(helpers.getTextAreaGroup('streamlabs-message', 'text', 'Tip Message', '', e.streamlabsMessage,
                            'Message said when someone tips the channel. Tag: (name), (amount), (currency), and (message)', false))
                    // Add the the box for the reward.
                    .append(getChannelSelector('streamlabs-channel', 'Alert Channel', '#alerts', e.streamlabsChannel,
                            'Channel where all alerts should go to.', allowedChannelTypes)),
                    function () { // Callback once the user clicks save.
                        let streamLabsToggle = $('#streamlabs-toggle').find(':selected').text() === 'Yes',
                                streamLabsMessage = $('#streamlabs-message'),
                                streamLabsChannel = $('#streamlabs-channel');

                        // Make sure everything has been filled it correctly.
                        switch (false) {
                            case helpers.handleInputString(streamLabsMessage):
                            case helpers.handleInputString(streamLabsChannel):
                                break;
                            default:
                                // Update settings.
                                socket.updateDBValues('discord_alerts_streamlabs_update_settings', {
                                    tables: ['discordSettings', 'discordSettings', 'discordSettings'],
                                    keys: ['streamlabsToggle', 'streamlabsMessage', 'streamlabsChannel'],
                                    values: [streamLabsToggle, streamLabsMessage.val(), streamLabsChannel.val()]
                                }, function () {
                                    socket.wsEvent('discord', './discord/handlers/streamlabsHandler.js', '', [], function () {
                                        // Close the modal.
                                        $('#streamlabs-alert').modal('toggle');
                                        // Alert the user.
                                        toastr.success('Successfully updated the StreamLabs alert settings!');
                                    });
                                });
                        }
                    }).on('shown.bs.modal', function (e) {
                refreshChannels(function () {
                    if (discordChannels !== null) {
                        $('#streamlabs-channel').select2({templateResult: discordChannelTemplate});
                    }
                });
            }).modal('toggle');
        });
    });

    // TipeeeStream settings.
    $('#discordTipeeeStreamHandlerSettings').on('click', function () {
        socket.getDBValues('discord_alerts_tipeeestream_get_settings', {
            tables: ['discordSettings', 'discordSettings', 'discordSettings'],
            keys: ['tipeeestreamToggle', 'tipeeestreamMessage', 'tipeeestreamChannel']
        }, true, function (e) {
            helpers.getModal('tipeeestream-alert', 'TipeeeStream Alert Settings', 'Save', $('<form/>', {
                'role': 'form'
            })
                    // Add the toggle for follow alerts.
                    .append(helpers.getDropdownGroup('tipeeestream-toggle', 'Enable TipeeeStream Alerts', (e.tipeeestreamToggle === 'true' ? 'Yes' : 'No'), ['Yes', 'No'],
                            'If a message should be said in the channel when someone tips.'))
                    // Add the the text area for the follow message.
                    .append(helpers.getTextAreaGroup('tipeeestream-message', 'text', 'Tip Message', '', e.tipeeestreamMessage,
                            'Message said when someone tips the channel. Tag: (name), (amount), (currency), and (message)', false))
                    // Add the the box for the reward.
                    .append(getChannelSelector('tipeeestream-channel', 'Alert Channel', '#alerts', e.tipeeestreamChannel,
                            'Channel where all alerts should go to.', allowedChannelTypes)),
                    function () { // Callback once the user clicks save.
                        let tipeeeStreamToggle = $('#tipeeestream-toggle').find(':selected').text() === 'Yes',
                                tipeeeStreamMessage = $('#tipeeestream-message'),
                                tipeeeStreamChannel = $('#tipeeestream-channel');

                        // Make sure everything has been filled it correctly.
                        switch (false) {
                            case helpers.handleInputString(tipeeeStreamMessage):
                            case helpers.handleInputString(tipeeeStreamChannel):
                                break;
                            default:
                                // Update settings.
                                socket.updateDBValues('discord_alerts_tipeeestream_update_settings', {
                                    tables: ['discordSettings', 'discordSettings', 'discordSettings'],
                                    keys: ['tipeeestreamToggle', 'tipeeestreamMessage', 'tipeeestreamChannel'],
                                    values: [tipeeeStreamToggle, tipeeeStreamMessage.val(), tipeeeStreamChannel.val()]
                                }, function () {
                                    socket.wsEvent('discord', './discord/handlers/tipeeeStreamHandler.js', '', [], function () {
                                        // Close the modal.
                                        $('#tipeeestream-alert').modal('toggle');
                                        // Alert the user.
                                        toastr.success('Successfully updated the TipeeeStream alert settings!');
                                    });
                                });
                        }
                    }).on('shown.bs.modal', function (e) {
                refreshChannels(function () {
                    if (discordChannels !== null) {
                        $('#tipeeestream-channel').select2({templateResult: discordChannelTemplate});
                    }
                });
            }).modal('toggle');
        });
    });

    // StreamElements settings.
    $('#discordStreamElementsHandlerSettings').on('click', function () {
        socket.getDBValues('discord_alerts_streamelements_get_settings', {
            tables: ['discordSettings', 'discordSettings', 'discordSettings'],
            keys: ['streamelementsToggle', 'streamelementsMessage', 'streamelementsChannel']
        }, true, function (e) {
            helpers.getModal('streamelements-alert', 'StreamElements Alert Settings', 'Save', $('<form/>', {
                'role': 'form'
            })
                    // Add the toggle for follow alerts.
                    .append(helpers.getDropdownGroup('streamelements-toggle', 'Enable StreamElements Alerts', (e.streamelementsToggle === 'true' ? 'Yes' : 'No'), ['Yes', 'No'],
                            'If a message should be said in the channel when someone tips.'))
                    // Add the the text area for the follow message.
                    .append(helpers.getTextAreaGroup('streamelements-message', 'text', 'Tip Message', '', e.streamelementsMessage,
                            'Message said when someone tips the channel. Tag: (name), (amount), (currency), and (message)', false))
                    // Add the the box for the reward.
                    .append(getChannelSelector('streamelements-channel', 'Alert Channel', '#alerts', e.streamelementsChannel,
                            'Channel where all alerts should go to.', allowedChannelTypes)),
                    function () { // Callback once the user clicks save.
                        let streamElementsToggle = $('#streamelements-toggle').find(':selected').text() === 'Yes',
                                streamElementsMessage = $('#streamelements-message'),
                                streamElementsChannel = $('#streamelements-channel');

                        // Make sure everything has been filled it correctly.
                        switch (false) {
                            case helpers.handleInputString(streamElementsMessage):
                            case helpers.handleInputString(streamElementsChannel):
                                break;
                            default:
                                // Update settings.
                                socket.updateDBValues('discord_alerts_streamelements_update_settings', {
                                    tables: ['discordSettings', 'discordSettings', 'discordSettings'],
                                    keys: ['streamelementsToggle', 'streamelementsMessage', 'streamelementsChannel'],
                                    values: [streamElementsToggle, streamElementsMessage.val(), streamElementsChannel.val()]
                                }, function () {
                                    socket.wsEvent('discord', './discord/handlers/streamElementsHandler.js', '', [], function () {
                                        // Close the modal.
                                        $('#streamelements-alert').modal('toggle');
                                        // Alert the user.
                                        toastr.success('Successfully updated the StreamElements alert settings!');
                                    });
                                });
                        }
                    }).on('shown.bs.modal', function (e) {
                refreshChannels(function () {
                    if (discordChannels !== null) {
                        $('#streamelements-channel').select2({templateResult: discordChannelTemplate});
                    }
                });
            }).modal('toggle');
        });
    });

    // Twitter settings.
    $('#discordTwitterHandlerSettings').on('click', function () {
        socket.getDBValues('discord_alerts_twitter_get_settings', {
            tables: ['discordSettings', 'discordSettings'],
            keys: ['twitterToggle', 'twitterChannel']
        }, true, function (e) {
            helpers.getModal('twitter-alert', 'Twitter Alert Settings', 'Save', $('<form/>', {
                'role': 'form'
            })
                    // Add the toggle for follow alerts.
                    .append(helpers.getDropdownGroup('twitter-toggle', 'Enable Twitter Alerts', (e.twitterToggle === 'true' ? 'Yes' : 'No'), ['Yes', 'No'],
                            'If your Tweets should be posted in Discord. Please note that the Twitch Twitter module needs to be setup for this to work.'))
                    // Add the the box for the reward.
                    .append(getChannelSelector('twitter-channel', 'Alert Channel', '#alerts', e.twitterChannel,
                            'Channel where all alerts should go to.', allowedChannelTypes)),
                    function () { // Callback once the user clicks save.
                        let twitterToggle = $('#twitter-toggle').find(':selected').text() === 'Yes',
                                twitterChannel = $('#twitter-channel');

                        // Make sure everything has been filled it correctly.
                        switch (false) {
                            case helpers.handleInputString(twitterChannel):
                                break;
                            default:
                                // Update settings.
                                socket.updateDBValues('discord_alerts_twitter_update_settings', {
                                    tables: ['discordSettings', 'discordSettings'],
                                    keys: ['twitterToggle', 'twitterChannel'],
                                    values: [twitterToggle, twitterChannel.val()]
                                }, function () {
                                    socket.wsEvent('discord', './discord/handlers/twitterHandler.js', '', [], function () {
                                        // Close the modal.
                                        $('#twitter-alert').modal('toggle');
                                        // Alert the user.
                                        toastr.success('Successfully updated the Twitter alert settings!');
                                    });
                                });
                        }
                    }).on('shown.bs.modal', function (e) {
                refreshChannels(function () {
                    if (discordChannels !== null) {
                        $('#twitter-channel').select2({templateResult: discordChannelTemplate});
                    }
                });
            }).modal('toggle');
        });
    });

    refreshChannels();
});
