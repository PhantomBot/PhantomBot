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
    socket.getDBValues('alerts_get_modules', {
        tables: ['modules', 'modules', 'modules', 'modules', 'modules', 'modules', 'modules', 'modules', 'modules', 'modules', 'modules', 'modules'],
        keys: ['./handlers/followHandler.js', './handlers/subscribeHandler.js', './handlers/hostHandler.js', './handlers/bitsHandler.js', './handlers/clipHandler.js',
               './systems/greetingSystem.js', './systems/welcomeSystem.js', './handlers/donationHandler.js', './handlers/raidHandler.js', './handlers/tipeeeStreamHandler.js',
               './handlers/streamElementsHandler.js', './handlers/twitterHandler.js']
    }, true, function(e) {
        // Handle the settings button.
        let keys = Object.keys(e),
            module = '',
            i;

        for (i = 0; i < keys.length; i++) {
            // Handle the status of the buttons.
            if (e[keys[i]] === 'false') {
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
    // Toggle for the alert modules.
    $('[data-alert-toggle]').on('change', function() {
        let name = $(this).attr('id'),
            checked = $(this).is(':checked');

        // Handle the module.
        socket.sendCommandSync('alerts_module_toggle', 'module ' + (checked ? 'enablesilent' : 'disablesilent') + ' ' + $(this).data('alert-toggle'), function() {
            // Toggle the settings button.
            $('#' + name.replace('Toggle', 'Settings')).prop('disabled', !checked);
            // Alert the user.
            toastr.success('Successfully ' + (checked ? 'enabled' : 'disabled') + ' the alert module!');
        });
    });

    // Follow handler settings.
    $('#followHandlerSettings').on('click', function() {
        socket.getDBValues('alerts_follow_get_settings', {
            tables: ['settings', 'settings', 'settings', 'settings'],
            keys: ['followToggle', 'followReward', 'followMessage', 'followDelay']
        }, true, function(e) {
            helpers.getModal('follow-alert', 'Follower Alert Settings', 'Save', $('<form/>', {
                'role': 'form'
            })
            // Add the toggle for follow alerts.
            .append(helpers.getDropdownGroup('follow-toggle', 'Enable Follow Alerts', (e.followToggle === 'true' ? 'Yes' : 'No'), ['Yes', 'No'],
                'If a message should be said in the channel when someone follows. This also toggles the reward.'))
            // Add the the text area for the follow message.
            .append(helpers.getTextAreaGroup('follow-message', 'text', 'Follow Message', '', e.followMessage,
                'Message said when someone follows the channel. Tags: (name), (alert), (playsound), and (reward)', false))
            // Add the the box for the reward.
            .append(helpers.getInputGroup('follow-reward', 'number', 'Follow Reward', '', e.followReward,
                'Reward given to users who follow the channel.'))
            // Add the the box for the reward
            .append(helpers.getInputGroup('follow-delay', 'number', 'Follow Delay (Seconds)', '', e.followDelay,
                'Delay between the follow messages posted in the channel. Minimum is 5 seconds.')),
            function() { // Callback once the user clicks save.
                let followToggle = $('#follow-toggle').find(':selected').text() === 'Yes',
                    followMessage = $('#follow-message'),
                    followReward = $('#follow-reward'),
                    followDelay = $('#follow-delay');

                // Make sure everything has been filled it correctly.
                switch (false) {
                    case helpers.handleInputString(followMessage):
                    case helpers.handleInputNumber(followReward, 0):
                    case helpers.handleInputNumber(followDelay, 5):
                        break;
                    default:
                        // Update settings.
                        socket.updateDBValues('alerts_follow_update_settings', {
                            tables: ['settings', 'settings', 'settings', 'settings',],
                            keys: ['followToggle', 'followReward', 'followMessage', 'followDelay'],
                            values: [followToggle, followReward.val(), followMessage.val(), followDelay.val()]
                        }, function() {
                            socket.sendCommand('alerts_follow_update_settings_cmd', 'followerpanelupdate', function() {
                                // Close the modal.
                                $('#follow-alert').modal('toggle');
                                // Alert the user.
                                toastr.success('Successfully updated the follower alert settings!');
                            });
                        });
                }
            }).modal('toggle');
        });
    });

    // Subscribe handler settings.
    $('#subscribeHandlerSettings').on('click', function() {
        socket.getDBValues('alerts_subscribe_get_settings', {
            tables: ['subscribeHandler', 'subscribeHandler', 'subscribeHandler', 'subscribeHandler', 'subscribeHandler', 'subscribeHandler', 'subscribeHandler', 'subscribeHandler',
                    'subscribeHandler', 'subscribeHandler', 'subscribeHandler', 'subscribeHandler', 'subscribeHandler', 'subscribeHandler', 'subscribeHandler', 'subscribeHandler',
                    'subscribeHandler', 'subscribeHandler', 'subscribeHandler', 'subscribeHandler', 'subscribeHandler', 'subscribeHandler', 'subscribeHandler'],
            keys: ['subscribeMessage', 'primeSubscribeMessage', 'reSubscribeMessage', 'giftSubMessage', 'subscriberWelcomeToggle', 'primeSubscriberWelcomeToggle',
                    'reSubscriberWelcomeToggle', 'giftSubWelcomeToggle', 'subscribeReward', 'reSubscribeReward', 'giftSubReward', 'resubEmote', 'subPlan1000', 'subPlan2000', 'subPlan3000', 'subPlanPrime',
                    'massGiftSubWelcomeToggle', 'massGiftSubMessage', 'massGiftSubReward', 'giftAnonSubMessage', 'massAnonGiftSubMessage', 'giftAnonSubWelcomeToggle', 'massAnonGiftSubWelcomeToggle']
        }, true, function(e) {
            helpers.getModal('subscribe-alert', 'Subscribe Alert Settings', 'Save', $('<form/>', {
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
                .append(helpers.getDropdownGroup('sub-toggle', 'Enable Subscription Alerts', (e.subscriberWelcomeToggle === 'true' ? 'Yes' : 'No'), ['Yes', 'No'],
                    'If a message should be said in the channel when someone subscribes. This also toggles the reward.'))
                // Append message box for the message
                .append(helpers.getTextAreaGroup('sub-msg', 'text', 'Subscription Message', '', e.subscribeMessage,
                    'Message said when someone subscribes to the channel. Tags: (name), (alert), (playsound), (plan), and (reward)', false))
                // Appen the reward box
                .append(helpers.getInputGroup('sub-reward', 'number', 'Subscription Reward', '', e.subscribeReward,
                    'Reward given to the user when they subscribe to the channel or get a gifted subscription, subscribe with Twitch Prime.'))))
            // Append second collapsible accordion.
            .append(helpers.getCollapsibleAccordion('main-2', 'Prime Subscription Settings',  $('<form/>', {
                    'role': 'form'
                })
                // Add toggle for prime subscriptions.
                .append(helpers.getDropdownGroup('primesub-toggle', 'Enable Prime Subscription Alerts', (e.primeSubscriberWelcomeToggle === 'true' ? 'Yes' : 'No'), ['Yes', 'No'],
                    'If a message should be said in the channel when someone subscribes with Twitch Prime. This also toggles the reward.'))
                // Append message box for the message
                .append(helpers.getTextAreaGroup('primesub-msg', 'text', 'Prime Subscription Message', '', e.primeSubscribeMessage,
                    'Message said when someone subscribes to the channel with Twitch Prime. Tags: (name), (alert), (playsound), (plan), and (reward)', false))))
            // Append third collapsible accordion.
            .append(helpers.getCollapsibleAccordion('main-3', 'Re-subscription Settings', $('<form/>', {
                    'role': 'form'
                })
                // Add toggle for resubscriptions.
                .append(helpers.getDropdownGroup('resub-toggle', 'Enable Re-subscription Alerts', (e.reSubscriberWelcomeToggle === 'true' ? 'Yes' : 'No'), ['Yes', 'No'],
                    'If a message should be said in the channel when someone resubscribes. This also toggles the reward.'))
                // Append message box for the message
                .append(helpers.getTextAreaGroup('resub-msg', 'text', 'Re-subscription Message', '', e.reSubscribeMessage,
                    'Message said when someone resubscribes to the channel. Tags: (name), (alert), (playsound), (plan), (months), (customemote), and (reward)', false))
                // Appen the reward box
                .append(helpers.getInputGroup('resub-reward', 'number', 'Re-subscription Reward', '', e.reSubscribeReward,
                    'Reward given to the user when they resubscribe to the channel.'))
                // Appen the emotes box
                .append(helpers.getInputGroup('resub-emote', 'text', 'Re-subscription Emote', '', e.resubEmote,
                    'Emote that will replace (customemote) for the number of months the user has subscribed for.'))))
            // Append forth collapsible accordion.
            .append(helpers.getCollapsibleAccordion('main-4', 'Gifted Subscription Settings', $('<form/>', {
                    'role': 'form'
                })
                // Add toggle for gifted subscriptions.
                .append(helpers.getDropdownGroup('gifsub-toggle', 'Enable Gift Subscription Alerts', (e.giftSubWelcomeToggle === 'true' ? 'Yes' : 'No'), ['Yes', 'No'],
                    'If a message should be said in the channel when someone gifts a subscription. This also toggles the reward.'))
                // Append message box for the message
                .append(helpers.getTextAreaGroup('gifsub-msg', 'text', 'Gift Subscription Message', '', e.giftSubMessage,
                    'Message said when someone gifts a subscription to the channel. Tags: (name), (alert), (playsound), (recipient), (plan), (months), and (reward)', false))
                // Appen the reward box
                .append(helpers.getInputGroup('gifsub-reward', 'number', 'Gift Subscription Reward', '', e.giftSubReward,
                    'Reward given to the user who bought the subscription.'))))
            // Append forth collapsible accordion.
            .append(helpers.getCollapsibleAccordion('main-5', 'Mystery Gift Subscription Settings', $('<form/>', {
                    'role': 'form'
                })
                // Add toggle for gifted subscriptions.
                .append(helpers.getDropdownGroup('mass-gifsub-toggle', 'Enable Mystery Gift Subscription Alerts', (e.massGiftSubWelcomeToggle === 'true' ? 'Yes' : 'No'), ['Yes', 'No'],
                    'If a message should be said in the channel when someone gifts multiple subscriptions. This also toggles the reward.'))
                // Append message box for the message
                .append(helpers.getTextAreaGroup('mass-gifsub-msg', 'text', 'Mystery Gift Subscription Message', '', e.massGiftSubMessage,
                    'Message said when someone gifts multiple subscriptions to the channel. Tags: (name), (alert), (playsound), (amount), and (reward)', false))
                // Appen the reward box
                .append(helpers.getInputGroup('mass-gifsub-reward', 'number', 'Mystery Gift Subscription Reward', '', e.massGiftSubReward,
                    'Reward given to the user who bought the subscription. This is a multiplier. (reward * amount gifted)'))))
            // Append sixth collapsible accordion.
            .append(helpers.getCollapsibleAccordion('main-6', 'Anonymous Gift Subscription Settings', $('<form/>', {
                    'role': 'form'
                })
                // Add toggle for gifted subscriptions.
                .append(helpers.getDropdownGroup('anon-gifsub-toggle', 'Enable Anonymous Gift Subscription Alerts', (e.giftAnonSubWelcomeToggle === 'true' ? 'Yes' : 'No'), ['Yes', 'No'],
                    'If a message should be said in the channel when someone gifts an anonymous subscription. This also toggles the reward.'))
                // Append message box for the message
                .append(helpers.getTextAreaGroup('anon-gifsub-msg', 'text', 'Anonymous Gift Subscription Message', '', e.giftAnonSubMessage,
                    'Message said when someone anonymously gifts a subscription to the channel. Tags: (name), (alert), (playsound), (plan), (amount), and (reward)', false))
                // Appen the reward box
                .append(helpers.getInputGroup('anon-gifsub-reward', 'number', 'Anonymous Gift Subscription Reward', '', e.subscribeReward,
                    'Reward given to the user who the subscription was gifted to. This is the same as the normal subscriptions reward', true))))
            // Append sixth collapsible accordion.
            .append(helpers.getCollapsibleAccordion('main-7', 'Anonymous Mystery Gift Subscription Settings', $('<form/>', {
                    'role': 'form'
                })
                // Add toggle for gifted subscriptions.
                .append(helpers.getDropdownGroup('anon-mass-gifsub-toggle', 'Enable Anonymous Mystery Gift Subscription Alerts', (e.massAnonGiftSubWelcomeToggle === 'true' ? 'Yes' : 'No'), ['Yes', 'No'],
                    'If a message should be said in the channel when an anonymous user gifts multiple subscriptions. This also toggles the reward.'))
                // Append message box for the message
                .append(helpers.getTextAreaGroup('anon-mass-gifsub-msg', 'text', 'Anonymous Gift Mystery Subscription Message', '', e.massAnonGiftSubMessage,
                    'Message said when someone anonymously mass gifts subscriptions to the channel. Tags: (name), and (amount)', false))))
            // Tier settings
            .append(helpers.getCollapsibleAccordion('main-8', 'Tier Settings', $('<form/>', {
                    'role': 'form'
                })
                // Append first sub plan name
                .append(helpers.getInputGroup('sub-1000', 'text', 'Subscription Plan Name 1', '', e.subPlan1000, 'Name given to the tier one plan.'))
                // Append first sub plan name
                .append(helpers.getInputGroup('sub-2000', 'text', 'Subscription Plan Name 2', '', e.subPlan2000, 'Name given to the tier two plan.'))
                // Append first sub plan name
                .append(helpers.getInputGroup('sub-3000', 'text', 'Subscription Plan Name 3', '', e.subPlan3000, 'Name given to the tier three plan.'))
                // Append first sub plan name
                .append(helpers.getInputGroup('sub-prime', 'text', 'Subscription Plan Name Prime', '', e.subPlanPrime, 'Name given to the Prime plan.'))
                ))),
            function() { // Callback once the user clicks save.
                let subToggle = $('#sub-toggle').find(':selected').text() === 'Yes',
                    subMsg = $('#sub-msg'),
                    subReward = $('#sub-reward'),
                    primeSubToggle = $('#primesub-toggle').find(':selected').text() === 'Yes',
                    primeSubMsg = $('#primesub-msg'),
                    reSubToggle = $('#resub-toggle').find(':selected').text() === 'Yes',
                    reSubMsg = $('#resub-msg'),
                    reSubReward = $('#resub-reward'),
                    reSubEmote = $('#resub-emote'),
                    gifSubToggle = $('#gifsub-toggle').find(':selected').text() === 'Yes',
                    gifSubMsg = $('#gifsub-msg'),
                    anonGifSubToggle = $('#anon-gifsub-toggle').find(':selected').text() === 'Yes',
                    anonGifSubMsg = $('#anon-gifsub-msg'),
                    gifSubReward = $('#gifsub-reward'),
                    massGiftSubToggle = $('#mass-gifsub-toggle').find(':selected').text() === 'Yes',
                    massGiftSubMsg = $('#mass-gifsub-msg'),
                    anonMassGiftSubToggle = $('#anon-mass-gifsub-toggle').find(':selected').text() === 'Yes',
                    anonMassGiftSubMsg = $('#anon-mass-gifsub-msg'),
                    massGiftSubReward = $('#mass-gifsub-reward'),
                    tierOne = $('#sub-1000'),
                    tierTwo = $('#sub-2000'),
                    tierThree = $('#sub-3000'),
                    tierPrime = $('#sub-prime');

                // Make sure the user has someone in each box.
                switch (false) {
                    case helpers.handleInputString(subMsg):
                    case helpers.handleInputNumber(subReward, 0):
                    case helpers.handleInputString(primeSubMsg):
                    case helpers.handleInputString(reSubMsg):
                    case helpers.handleInputNumber(reSubReward, 0):
                    case helpers.handleInputString(gifSubMsg):
                    case helpers.handleInputString(anonGifSubMsg):
                    case helpers.handleInputNumber(gifSubReward, 0):
                    case helpers.handleInputString(massGiftSubMsg):
                    case helpers.handleInputString(anonMassGiftSubMsg):
                    case helpers.handleInputNumber(massGiftSubReward, 0):
                    case helpers.handleInputString(tierOne):
                    case helpers.handleInputString(tierTwo):
                    case helpers.handleInputString(tierThree):
                    case helpers.handleInputString(tierPrime):
                        break;
                    default:
                        socket.updateDBValues('alerts_subscribe_update_settings', {
                            tables: ['subscribeHandler', 'subscribeHandler', 'subscribeHandler', 'subscribeHandler', 'subscribeHandler', 'subscribeHandler', 'subscribeHandler', 'subscribeHandler',
                                    'subscribeHandler', 'subscribeHandler', 'subscribeHandler', 'subscribeHandler', 'subscribeHandler', 'subscribeHandler', 'subscribeHandler', 'subscribeHandler',
                                    'subscribeHandler', 'subscribeHandler', 'subscribeHandler', 'subscribeHandler', 'subscribeHandler', 'subscribeHandler', 'subscribeHandler'],
                            keys: ['subscribeMessage', 'primeSubscribeMessage', 'reSubscribeMessage', 'giftSubMessage', 'subscriberWelcomeToggle', 'primeSubscriberWelcomeToggle',
                                    'reSubscriberWelcomeToggle', 'giftSubWelcomeToggle', 'subscribeReward', 'reSubscribeReward', 'giftSubReward', 'resubEmote', 'subPlan1000', 'subPlan2000', 'subPlan3000', 'subPlanPrime',
                                    'massGiftSubWelcomeToggle', 'massGiftSubMessage', 'massGiftSubReward', 'giftAnonSubMessage', 'massAnonGiftSubMessage', 'giftAnonSubWelcomeToggle', 'massAnonGiftSubWelcomeToggle'],
                            values: [subMsg.val(), primeSubMsg.val(), reSubMsg.val(), gifSubMsg.val(), subToggle, primeSubToggle, reSubToggle, gifSubToggle, subReward.val(), reSubReward.val(),
                                gifSubReward.val(), reSubEmote.val(), tierOne.val(), tierTwo.val(), tierThree.val(), tierPrime.val(), massGiftSubToggle, massGiftSubMsg.val(), massGiftSubReward.val(),
                                anonGifSubMsg.val(), anonMassGiftSubMsg.val(), anonGifSubToggle, anonMassGiftSubToggle]
                        }, function() {
                            socket.sendCommand('alerts_subscribe_update_settings_cmd', 'subscriberpanelupdate', function() {
                                // Close the modal.
                                $('#subscribe-alert').modal('toggle');
                                // Alert the user.
                                toastr.success('Successfully updated subscription alert settings!');
                            });
                        });
                }
            }).modal('toggle');
        });
    });

    // Host settings button.
    $('#hostHandlerSettings').on('click', function() {
        socket.getDBValues('alerts_get_host_settings', {
            tables: ['settings', 'settings', 'settings', 'settings', 'settings', 'settings'],
            keys: ['hostReward', 'hostMinViewerCount', 'hostMinCount', 'hostMessage', 'hostHistory', 'hostToggle']
        }, true, function(e) {
            helpers.getModal('host-alert', 'Host Alert Settings', 'Save', $('<form/>', {
                'role': 'form'
            })
            // Add the div for the col boxes.
            .append($('<div/>', {
                'class': 'panel-group',
                'id': 'accordion'
            })
            // Append first collapsible accordion.
            .append(helpers.getCollapsibleAccordion('main-1', 'Host Settings', $('<form/>', {
                    'role': 'form'
                })
                // Add toggle for normal hosts
                .append(helpers.getDropdownGroup('host-toggle', 'Enable Host Alerts', (e.hostToggle === 'true' ? 'Yes' : 'No'), ['Yes', 'No'],
                    'If a message should be said in the channel when someone hosts the channel.'))
                // Append message box for the message
                .append(helpers.getTextAreaGroup('host-msg', 'text', 'Host Message', '', e.hostMessage,
                    'Message said when someone Hosts the channel. Tags: (name), (alert), (playsound), (reward), and (viewers)', false))
                // Appen the reward box
                .append(helpers.getInputGroup('host-reward', 'number', 'Host Reward', '', e.hostReward,
                    'Reward given to the user when they hosts to the channel.'))))
            // Append third collapsible accordion.
            .append(helpers.getCollapsibleAccordion('main-3', 'Extra Settings', $('<form/>', {
                    'role': 'form'
                })
                // Add toggle for host history.
                .append(helpers.getDropdownGroup('host-history', 'Enable Host History', (e.hostHistory === 'true' ? 'Yes' : 'No'), ['Yes', 'No'],
                    'If all hosts should be logged for future viewing.'))
                // Min host box reward.
                .append(helpers.getInputGroup('host-minpoint', 'number', 'Minimum Viewers for Host Reward', '', e.hostMinViewerCount,
                    'Minimum amount of viewers the users has to host with to get a reward.'))
                // Min host box alert.
                .append(helpers.getInputGroup('host-minalert', 'number', 'Minimum Viewers for Host Alert', '', e.hostMinCount,
                    'Minimum amount of viewers the users has to host with to trigger the alert.'))))),
            function() { // Callback once the user clicks save.
                let hostToggle = $('#host-toggle').find(':selected').text() === 'Yes',
                    hostMsg = $('#host-msg'),
                    hostReward = $('#host-reward'),
                    hostHistory = $('#host-history').find(':selected').text() === 'Yes',
                    hostMinPoints = $('#host-minpoint'),
                    hostMinAlert = $('#host-minalert');

                // Make sure the user has someone in each box.
                switch (false) {
                    case helpers.handleInputString(hostMsg):
                    case helpers.handleInputNumber(hostReward, 0):
                    case helpers.handleInputNumber(hostMinPoints, 0):
                    case helpers.handleInputNumber(hostMinAlert, 0):
                        break;
                    default:
                        socket.updateDBValues('alerts_update_host_settings', {
                            tables: ['settings', 'settings', 'settings', 'settings', 'settings', 'settings'],
                            keys: ['hostReward', 'hostMinViewerCount', 'hostMinCount', 'hostMessage',
                                'hostHistory', 'hostToggle'],
                            values: [hostReward.val(), hostMinPoints.val(), hostMinAlert.val(),
                                hostMsg.val(), hostHistory, hostToggle]
                        }, function() {
                            socket.sendCommand('alerts_update_host_settings_cmd', 'reloadhost', function() {
                                // Close the modal.
                                $('#host-alert').modal('toggle');
                                // Alert the user.
                                toastr.success('Successfully updated host alert settings!');
                            });
                        });
                }

            }).modal('toggle');
        });
    });

    // Bits alert settings.
    $('#bitsHandlerSettings').on('click', function() {
        socket.getDBValues('alerts_get_bits_settings', {
            tables: ['bitsSettings', 'bitsSettings', 'bitsSettings'],
            keys: ['toggle', 'message', 'minimum']
        }, true, function(e) {
            helpers.getModal('bits-alert', 'Bits Alert Settings', 'Save', $('<form/>', {
                'role': 'form'
            })
            // Add the toggle for bits alerts.
            .append(helpers.getDropdownGroup('bits-toggle', 'Enable Bits Alerts', (e.toggle === 'true' ? 'Yes' : 'No'), ['Yes', 'No'],
                'If a message should be said in the channel when someone cheers.'))
            // Add the the text area for the bits message.
            .append(helpers.getTextAreaGroup('bits-message', 'text', 'Bits Message', '', e.message,
                'Message said when someone cheers in the the channel. Tags: (name), (alert), (playsound), (message), and (amount)', false))
            // Add the box for the reward.
            .append(helpers.getInputGroup('bits-minimum', 'number', 'Bits Minimum', '', e.minimum, 'Amount of bits needed to trigger the alert.')),
            function() { // Callback once the user clicks save.
                let bitsToggle = $('#bits-toggle').find(':selected').text() === 'Yes',
                    bitsMsg = $('#bits-message'),
                    bitsMin = $('#bits-minimum');

                // Make sure the user has someone in each box.
                switch (false) {
                    case helpers.handleInputString(bitsMsg):
                    case helpers.handleInputNumber(bitsMin):
                        break;
                    default:
                        socket.updateDBValues('alerts_update_bits_settings', {
                            tables: ['bitsSettings', 'bitsSettings', 'bitsSettings'],
                            keys: ['toggle', 'message', 'minimum'],
                            values: [bitsToggle, bitsMsg.val(), bitsMin.val()]
                        }, function() {
                            socket.sendCommand('alerts_update_bits_settings_cmd', 'reloadbits', function() {
                                // Close the modal.
                                $('#bits-alert').modal('toggle');
                                // Alert the user.
                                toastr.success('Successfully updated Bits alert settings!');
                            });
                        });
                }

            }).modal('toggle');
        });
    });

    // Clip alert settings.
    $('#clipHandlerSettings').on('click', function() {
        socket.getDBValues('alerts_get_clip_settings', {
            tables: ['clipsSettings', 'clipsSettings'],
            keys: ['toggle', 'message']
        }, true, function(e) {
            helpers.getModal('clip-alert', 'Clip Alert Settings', 'Save', $('<form/>', {
                'role': 'form'
            })
            // Add the toggle for clip alerts.
            .append(helpers.getDropdownGroup('clip-toggle', 'Enable Clip Alerts', (e.toggle === 'true' ? 'Yes' : 'No'), ['Yes', 'No'],
                'If a message should be said in the channel when someone creates a clip.'))
            // Add the text area for the clips message.
            .append(helpers.getTextAreaGroup('clip-message', 'text', 'Clip Message', '', e.message,
                'Message said when someone creates a clip. Tags: (name), (alert), (playsound), (title), and (url)', false)),
            function() { // Callback once the user clicks save.
                let clipToggle = $('#clip-toggle').find(':selected').text() === 'Yes',
                    clipMsg = $('#clip-message');

                // Make sure the user has someone in each box.
                switch (false) {
                    case helpers.handleInputString(clipMsg):
                        break;
                    default:
                        socket.updateDBValues('alerts_update_clip_settings', {
                            tables: ['clipsSettings', 'clipsSettings'],
                            keys: ['toggle', 'message'],
                            values: [clipToggle, clipMsg.val()]
                        }, function() {
                            socket.sendCommand('alerts_update_clip_settings_cmd', 'reloadclip', function() {
                                // Close the modal.
                                $('#clip-alert').modal('toggle');
                                // Alert the user.
                                toastr.success('Successfully updated Clip alert settings!');
                            });
                        });
                }
            }).modal('toggle');
        });
    });

    // Raid settings.
    $('#raidHandlerSettings').on('click', function() {
        socket.getDBValues('alerts_get_raid_settings', {
            tables: ['raidSettings', 'raidSettings', 'raidSettings', 'raidSettings', 'raidSettings', 'raidSettings'],
            keys: ['raidToggle', 'newRaidIncMessage', 'raidIncMessage', 'raidReward', 'raidOutMessage', 'raidOutSpam']
        }, true, function(e) {
            helpers.getModal('raid-alert', 'Raid Alert Settings', 'Save', $('<form/>', {
                'role': 'form'
            })
            // Add the div for the col boxes.
            .append($('<div/>', {
                'class': 'panel-group',
                'id': 'accordion'
            })
            // Append first collapsible accordion.
            .append(helpers.getCollapsibleAccordion('main-1', 'Incoming Raid Settings', $('<form/>', {
                    'role': 'form'
                })
                 // Add the toggle for raid alerts.
                .append(helpers.getDropdownGroup('raid-toggle', 'Enable Raid Alerts', (e.raidToggle === 'true' ? 'Yes' : 'No'), ['Yes', 'No'],
                    'If people who raid your channel should be noticed by the bot with a message.'))
                // Add the text area for the new raid message.
                .append(helpers.getTextAreaGroup('new-raid-message', 'text', 'New Raider Message', '', e.newRaidIncMessage,
                    'Message said when someone raids your channel for the first time. Tags: (username), (alert), (playsound), (viewers), (url), (reward) and (game)', false))
                // Add the text area for the raid message.
                .append(helpers.getTextAreaGroup('raid-message', 'text', 'Raider Message', '', e.raidIncMessage,
                    'Message said when someone raids your channel. Tags: (username), (alert), (playsound), (viewers), (url), (times), (reward) and (game)', false))
                // Appen the reward box
                .append(helpers.getInputGroup('raid-reward', 'number', 'Raid Reward', '', e.raidReward,
                    'Reward given to the users who raid your channel.'))))
            // Append second collapsible accordion.
            .append(helpers.getCollapsibleAccordion('main-2', 'Outgoing Raid Settings', $('<form/>', {
                    'role': 'form'
                })
                // Add the text area for the new raid message.
                .append(helpers.getTextAreaGroup('out-raid-message', 'text', 'Raiding Message', '', e.raidOutMessage,
                    'Message said in chat when you use the !raid command to raid a channel. Tags: (username) and (url)', false))
                 // Appen the spam box
                .append(helpers.getInputGroup('raid-spam', 'number', 'Raiding Message Spam', '', e.raidOutSpam,
                    'How many times the message when using the !raid command will be said in the chat. Maximum is 10 times.'))))),
            function() {
                let raidToggle = $('#raid-toggle').find(':selected').text() === 'Yes',
                    raidNewMsg = $('#new-raid-message'),
                    raidMsg = $('#raid-message'),
                    raidReward = $('#raid-reward'),
                    raidOutMsg = $('#out-raid-message'),
                    raidMsgSpam = $('#raid-spam');

                switch (false) {
                    case helpers.handleInputString(raidNewMsg):
                    case helpers.handleInputString(raidMsg):
                    case helpers.handleInputNumber(raidReward, 0):
                    case helpers.handleInputString(raidOutMsg):
                    case helpers.handleInputNumber(raidMsgSpam, 1, 10):
                        break;
                    default:
                        socket.updateDBValues('raid_setting_update', {
                            tables: ['raidSettings', 'raidSettings', 'raidSettings', 'raidSettings', 'raidSettings', 'raidSettings'],
                            keys: ['raidToggle', 'newRaidIncMessage', 'raidIncMessage', 'raidReward', 'raidOutMessage', 'raidOutSpam'],
                            values: [raidToggle, raidNewMsg.val(), raidMsg.val(), raidReward.val(), raidOutMsg.val(), raidMsgSpam.val()]
                        }, function() {
                            socket.sendCommand('raid_setting_update_cmd', 'reloadraid', function() {
                                // Alert the user.
                                toastr.success('Successfully updated the raid settings!');
                                // Close the modal.
                                $('#raid-alert').modal('toggle');
                            });
                        });
                }
            }).modal('toggle');
        });
    });

    // Welcome esettings.
    $('#welcomeSystemSettings').on('click', function() {
        const updateDisabled = function(disabledUsers, welcomeDisabled, callback) {
            let addTables = [],
                addKeys = [],
                addVals = [],
                delTables = [],
                delKeys = [];

            let previouslyDisabled = {};
            for (let row of disabledUsers) {
                previouslyDisabled[row.key] = true;
            }
            let newDisabledUsers = welcomeDisabled.map(function (name) {
                return name.replace(/[^a-zA-Z0-9_\n]/g, '').toLowerCase()
            });
            for (let newDisabledUser of newDisabledUsers) {
                if (!newDisabledUser) {
                    continue;
                }
                if (previouslyDisabled.hasOwnProperty(newDisabledUser)) {
                    delete previouslyDisabled[newDisabledUser];
                } else {
                    addTables.push('welcome_disabled_users');
                    addKeys.push(newDisabledUser);
                    addVals.push('true');
                }
            }
            for (let disabledUser in previouslyDisabled) {
                if (previouslyDisabled.hasOwnProperty(disabledUser)) {
                    delTables.push('welcome_disabled_users');
                    delKeys.push(disabledUser)
                }
            }

            const add = function (cb) {
                if (addKeys.length) {
                    socket.updateDBValues('alerts_add_welcome_disabled', {
                        tables: addTables,
                        keys: addKeys,
                        values: addVals
                    }, cb);
                } else {
                    cb();
                }
            };

            const remove = function (cb) {
                if (delKeys.length) {
                    socket.removeDBValues('alerts_del_welcome_disabled', {
                        tables: delTables,
                        keys: delKeys,
                    }, cb);
                } else {
                    cb();
                }
            };

            add(function () { remove(callback) });
        };

        socket.getDBValues('alerts_get_welcome_settings', {
            tables: ['welcome', 'welcome', 'welcome', 'welcome'],
            keys: ['welcomeEnabled', 'welcomeMessage', 'welcomeMessageFirst', 'cooldown']
        }, true, function(e) {
            socket.getDBTableValues('alerts_get_welcome_disabled_users', 'welcome_disabled_users', function (disabledUsers) {
                let disabledUserOptions = [];
                for (let row of disabledUsers) {
                    disabledUserOptions.push({
                        'name': row.key,
                        'selected': 'true'
                    })
                }
                const modal = helpers.getModal('welcome-alert', 'Welcome Alert Settings', 'Save', $('<form/>', {
                    'role': 'form'
                })
                // Add the toggle for welcome alerts.
                .append(helpers.getDropdownGroup('welcome-toggle', 'Enable Welcome Messages', (e.welcomeEnabled === 'true' ? 'Yes' : 'No'), ['Yes', 'No'],
                    'If users should be welcomed by the bot when the start chatting.'))
                // Add the input for welcome message.
                .append(helpers.getInputGroup('welcome-message', 'text', 'Welcome Message', '', e.welcomeMessage, 'Welcome message for new chatters. Leave blank to not greet returning chatters. Tags: (names), (1 text for one name), (2 for two), (3 for three or more names)'))
                // Add the input for first time welcome message.
                .append(helpers.getInputGroup('welcome-message-first', 'text', 'First Chatter Welcome Message', '', e.welcomeMessageFirst, 'Welcome message for first time chatters. Leave blank to use the default welcome message. Tags: (names), (1 text for one name), (2 for two), (3 for three or more names)'))
                // Add the input for the welcome cooldown.
                .append(helpers.getInputGroup('welcome-cooldown', 'number', 'Welcome Cooldown (Hours)', '', (parseInt(e.cooldown) / 36e5),
                    'How many hours a user has to not chat to be welcomed again. Minimum is 1 hour.'))
                // Add the input for excluded users.
                .append(helpers.getFlatMultiDropdownGroup('welcome-disabled', 'Excluded Users', disabledUserOptions,
                    'Users that the bot will not welcome. Channel owner and this bot are always excluded.')),
                function() { // Callback once the user clicks save.
                    let welcomeToggle = $('#welcome-toggle').find(':selected').text() === 'Yes',
                        welcomeMessage = $('#welcome-message').val(),
                        welcomeMessageFirst = $('#welcome-message-first').val(),
                        $welcomeCooldown = $('#welcome-cooldown'),
                        welcomeDisabled = $('#welcome-disabled').val();

                    // Make sure the user has someone in each box.
                    switch (false) {
                        case helpers.handleInputNumber($welcomeCooldown, 1):
                            break;
                        default:
                            socket.updateDBValues('alerts_update_welcome_settings', {
                                tables: ['welcome', 'welcome', 'welcome', 'welcome'],
                                keys: ['welcomeEnabled', 'welcomeMessage', 'welcomeMessageFirst', 'cooldown'],
                                values: [welcomeToggle, welcomeMessage, welcomeMessageFirst, (parseInt($welcomeCooldown.val()) * 36e5)]
                            }, function() {
                                updateDisabled(disabledUsers, welcomeDisabled, function () {
                                    socket.sendCommand('alerts_update_welcome_settings_cmd', 'welcomepanelupdate', function() {
                                        // Close the modal.
                                        $('#welcome-alert').modal('toggle');
                                        // Alert the user.
                                        toastr.success('Successfully updated welcome alert settings!');
                                    });
                                });
                            });
                    }
                }).modal('toggle');
                modal.find('#welcome-disabled').select2({
                    tags: true,
                    tokenSeparators: [',', ' '],
                    selectOnClose: true,
                    createTag: function (params) {
                        const term = params.term.replace(/[^a-zA-Z0-9_\n]/g, '').toLowerCase();
                        // Don't offset to create a tag if there is no @ symbol
                        if (!term) {
                            // Return null to disable tag creation
                            return null;
                        }

                        return {
                            id: term,
                            text: term
                        }
                    }
                });
            });
        });
    });

    // StreamLabs settings.
    $('#donationHandlerSettings').on('click', function() {
        socket.getDBValues('alerts_get_streamlabs_settings', {
            tables: ['donations', 'donations', 'donations'],
            keys: ['announce', 'reward', 'message']
        }, true, function(e) {
            helpers.getModal('streamlabs-alert', 'StreamLabs Alert Settings', 'Save', $('<form/>', {
                'role': 'form'
            })
            /// Add the toggle for streamlabs alerts.
            .append(helpers.getDropdownGroup('streamlabs-toggle', 'Enable StreamLabs Alerts', (e.announce === 'true' ? 'Yes' : 'No'), ['Yes', 'No'],
                'If StreamLabs tips should be posted in the chat.'))
            // Add the the text area for the tip message.
            .append(helpers.getTextAreaGroup('streamlabs-message', 'text', 'Tip Message', '', e.message,
                'Message posted in the channel when someone tips with StreamLabs. Tags: (name), (amount), (amount.toFixed(0)), (points), (pointname), (currency), and (message)'))
            // Add the the box for the tip reward
            .append(helpers.getInputGroup('streamlabs-reward', 'number', 'Tip Reward Multiplier', '', e.reward, 'Reward multiplier for the reward.')),
            function() { // Callback once the user clicks save.
                let tipToggle = $('#streamlabs-toggle').find(':selected').text() === 'Yes',
                    tipMessage = $('#streamlabs-message'),
                    tipReward = $('#streamlabs-reward');

                // Make sure the user has someone in each box.
                switch (false) {
                    case helpers.handleInputString(tipMessage):
                    case helpers.handleInputNumber(tipReward, 0):
                        break;
                    default:
                        socket.updateDBValues('alerts_update_streamlabs_settings', {
                            tables: ['donations', 'donations', 'donations'],
                            keys: ['announce', 'reward', 'message'],
                            values: [tipToggle, tipReward.val(), tipMessage.val()]
                        }, function() {
                            socket.sendCommand('alerts_update_streamlabs_settings_cmd', 'donationpanelupdate', function() {
                                // Close the modal.
                                $('#streamlabs-alert').modal('toggle');
                                // Alert the user.
                                toastr.success('Successfully updated StreamLabs alert settings!');
                            });
                        });
                }
            }).modal('toggle');
        });
    });

    // TipeeeStream settings.
    $('#tipeeeStreamHandlerSettings').on('click', function() {
        socket.getDBValues('alerts_get_tipeeestream_settings', {
            tables: ['tipeeeStreamHandler', 'tipeeeStreamHandler', 'tipeeeStreamHandler'],
            keys: ['toggle', 'reward', 'message']
        }, true, function(e) {
            helpers.getModal('tipeeestream-alert', 'TipeeeStream Alert Settings', 'Save', $('<form/>', {
                'role': 'form'
            })
            /// Add the toggle for streamlabs alerts.
            .append(helpers.getDropdownGroup('tipeeestream-toggle', 'Enable TipeeeStream Alerts', (e.toggle === 'true' ? 'Yes' : 'No'), ['Yes', 'No'],
                'If TipeeeStream tips should be posted in the chat.'))
            // Add the the text area for the tip message.
            .append(helpers.getTextAreaGroup('tipeeestream-message', 'text', 'Tip Message', '', e.message,
                'Message posted in the channel when someone tips with TipeeeStream. Tags: (name), (amount), (reward), (formattedamount), and (message)'))
            // Add the the box for the tip reward
            .append(helpers.getInputGroup('tipeeestream-reward', 'number', 'Tip Reward Multiplier', '', e.reward, 'Reward multiplier for the reward.')),
            function() { // Callback once the user clicks save.
                let tipToggle = $('#tipeeestream-toggle').find(':selected').text() === 'Yes',
                    tipMessage = $('#tipeeestream-message'),
                    tipReward = $('#tipeeestream-reward');

                // Make sure the user has someone in each box.
                switch (false) {
                    case helpers.handleInputString(tipMessage):
                    case helpers.handleInputNumber(tipReward, 0):
                        break;
                    default:
                        socket.updateDBValues('alerts_update_tipeeestream_settings', {
                            tables: ['tipeeeStreamHandler', 'tipeeeStreamHandler', 'tipeeeStreamHandler'],
                            keys: ['toggle', 'reward', 'message'],
                            values: [tipToggle, tipReward.val(), tipMessage.val()]
                        }, function() {
                            socket.sendCommand('alerts_update_tipeeestream_settings_cmd', 'tipeeestreamreload', function() {
                                // Close the modal.
                                $('#tipeeestream-alert').modal('toggle');
                                // Alert the user.
                                toastr.success('Successfully updated TipeeeStream alert settings!');
                            });
                        });
                }
            }).modal('toggle');
        });
    });

    // StreamElements settings.
    $('#streamElementsHandlerSettings').on('click', function() {
        socket.getDBValues('alerts_get_streamelements_settings', {
            tables: ['streamElementsHandler', 'streamElementsHandler', 'streamElementsHandler'],
            keys: ['toggle', 'reward', 'message']
        }, true, function(e) {
            helpers.getModal('streamelements-alert', 'StreamElements Alert Settings', 'Save', $('<form/>', {
                'role': 'form'
            })
            /// Add the toggle for streamelements alerts.
            .append(helpers.getDropdownGroup('streamelements-toggle', 'Enable StreamElements Alerts', (e.toggle === 'true' ? 'Yes' : 'No'), ['Yes', 'No'],
                'If StreamElements tips should be posted in the chat.'))
            // Add the the text area for the tip message.
            .append(helpers.getTextAreaGroup('streamelements-message', 'text', 'Tip Message', '', e.message,
                'Message posted in the channel when someone tips with StreamElements. Tags: (name), (amount), (reward), (currency), and (message)'))
            // Add the the box for the tip reward
            .append(helpers.getInputGroup('streamelements-reward', 'number', 'Tip Reward Multiplier', '', e.reward, 'Reward multiplier for the reward.')),
            function() { // Callback once the user clicks save.
                let tipToggle = $('#streamelements-toggle').find(':selected').text() === 'Yes',
                    tipMessage = $('#streamelements-message'),
                    tipReward = $('#streamelements-reward');

                // Make sure the user has someone in each box.
                switch (false) {
                    case helpers.handleInputString(tipMessage):
                    case helpers.handleInputNumber(tipReward, 0):
                        break;
                    default:
                        socket.updateDBValues('alerts_update_streamelements_settings', {
                            tables: ['streamElementsHandler', 'streamElementsHandler', 'streamElementsHandler'],
                            keys: ['toggle', 'reward', 'message'],
                            values: [tipToggle, tipReward.val(), tipMessage.val()]
                        }, function() {
                            socket.sendCommand('alerts_update_streamelements_settings_cmd', 'streamelementsreload', function() {
                                // Close the modal.
                                $('#streamelements-alert').modal('toggle');
                                // Alert the user.
                                toastr.success('Successfully updated StreamElements alert settings!');
                            });
                        });
                }
            }).modal('toggle');
        });
    });

    // Twitter settings.
    $('#twitterHandlerSettings').on('click', function() {
        socket.getDBValues('alerts_get_twitter_settings', {
            tables: ['twitter', 'twitter', 'twitter', 'twitter', 'twitter', 'twitter', 'twitter', 'twitter', 'twitter', 'twitter',
                    'twitter', 'twitter', 'twitter', 'twitter', 'twitter', 'twitter', 'twitter', 'twitter', 'twitter'],
            keys: ['message_online', 'message_gamechange', 'message_update', 'polldelay_mentions', 'polldelay_retweets', 'polldelay_hometimeline', 'polldelay_usertimeline', 'postdelay_update',
                    'reward_points', 'reward_cooldown', 'poll_mentions', 'poll_retweets', 'poll_hometimeline', 'poll_usertimeline', 'post_online', 'post_gamechange', 'post_update', 'reward_toggle', 'reward_announce']
        }, true, function(e) {
            helpers.getModal('twitter-alert', 'Twitter Alert Settings', 'Save', $('<form/>', {
                'role': 'form'
            })
            // Add the div for the col boxes.
            .append($('<div/>', {
                'class': 'panel-group',
                'id': 'accordion'
            })
            // Append first collapsible accordion.
            .append(helpers.getCollapsibleAccordion('main-1', 'Twitter Configuration', $('<form/>', {
                    'role': 'form'
                })
                // Add the toggle for mentions
                .append(helpers.getDropdownGroup('poll-mentions', 'Query Mentions', (e.poll_mentions === 'true' ? 'Yes' : 'No'), ['Yes', 'No'],
                    'If PhantomBot should look for mentions on your timeline and post them in chat.'))
                // Add the toggle for retweets
                .append(helpers.getDropdownGroup('poll-retweets', 'Query Retweets', (e.poll_retweets === 'true' ? 'Yes' : 'No'), ['Yes', 'No'],
                    'If PhantomBot should look for your retweets and post them in chat.'))
                // Add the toggle for home timeline
                .append(helpers.getDropdownGroup('poll-home', 'Query Home Timeline', (e.poll_hometimeline === 'true' ? 'Yes' : 'No'), ['Yes', 'No'],
                    'If PhantomBot should look for anything on your timeline and post it in chat.'))
                // Add the toggle for user timeline
                .append(helpers.getDropdownGroup('poll-user', 'Query User Timeline', (e.poll_usertimeline === 'true' ? 'Yes' : 'No'), ['Yes', 'No'],
                    'If PhantomBot should look for anything on your timeline posted by you and post it in chat.'))
                // Query interval for mentions
                .append(helpers.getInputGroup('query-mentions', 'number', 'Query Interval for Mentions (Seconds)', '', e.polldelay_mentions, 'How often the bot looks for mentions. Minimum is 60 seconds.'))
                // Query interval for retweets
                .append(helpers.getInputGroup('query-retweets', 'number', 'Query Interval for Retweets (Seconds)', '', e.polldelay_retweets, 'How often the bot looks for retweets. Minimum is 60 seconds.'))
                // Query interval for mentions
                .append(helpers.getInputGroup('query-home', 'number', 'Query Interval for Home TimeLine (Seconds)', '', e.polldelay_hometimeline, 'How often the bot looks for home timeline. Minimum is 60 seconds.'))
                // Query interval for mentions
                .append(helpers.getInputGroup('query-user', 'number', 'Query Interval for User TimeLine (Seconds)', '', e.polldelay_usertimeline, 'How often the bot looks for user timeline. Minimum is 15 seconds.'))))
            // Append second collapsible accordion.
            .append(helpers.getCollapsibleAccordion('main-2', 'Twitter Retweet Configuration', $('<form/>', {
                    'role': 'form'
                })
                // Add the toggle for mentions
                .append(helpers.getDropdownGroup('retweet-toggle', 'Enable Retweet Rewards', (e.reward_toggle === 'true' ? 'Yes' : 'No'), ['Yes', 'No'], 'If PhantomBot should reward users who Retweet your Tweets.'))
                // Add the toggle for retweets
                .append(helpers.getDropdownGroup('retweet-toggle-msg', 'Enable Retweet Rewards Announcements', (e.reward_announce === 'true' ? 'Yes' : 'No'), ['Yes', 'No'],
                    'If PhantomBot should announce that it rewarded a user for Reetweeting your Tweets.'))
                // Query interval for mentions
                .append(helpers.getInputGroup('retweet-reward', 'number', 'Retweet Reward', '', e.reward_points, 'Reward given to user you Retweet your Tweets.'))
                // Query interval for mentions
                .append(helpers.getInputGroup('retweet-cooldown', 'number', 'Retweet Cooldown (Hours)', '', e.reward_cooldown, 'Cooldown for how many times the bot can reward a user for Retweets.'))))
            // Append third collapsible accordion.
            .append(helpers.getCollapsibleAccordion('main-3', 'Alert Settings', $('<form/>', {
                    'role': 'form'
                })
                // Add the toggle for the online Tweet.
                .append(helpers.getDropdownGroup('online-toggle', 'Enable Online Tweet', (e.post_online === 'true' ? 'Yes' : 'No'), ['Yes', 'No'], 'Let the bot Tweet for you when you go live.'))
                // Add the toggle for the game Tweet.
                .append(helpers.getDropdownGroup('game-toggle', 'Enable Game Change Tweet', (e.post_gamechange === 'true' ? 'Yes' : 'No'), ['Yes', 'No'], 'Let the bot Tweet for you when you switch games.'))
                // Add the toggle for the timed Tweet.
                .append(helpers.getDropdownGroup('timed-toggle', 'Enable Timed Online Tweet', (e.post_update === 'true' ? 'Yes' : 'No'), ['Yes', 'No'], 'Let the bot Tweet for you every X hours saying that you\'re still live.'))
                // Add the the text area for online message
                .append(helpers.getTextAreaGroup('online-msg', 'text', 'Online Tweet', '', e.message_online, 'Message that will be Tweeted out when you go line. Tags: (title), (game), and (twitchurl)', false))
                // Add the the text area for online message
                .append(helpers.getTextAreaGroup('game-msg', 'text', 'Game Change Tweet', '', e.message_gamechange, 'Message that will be Tweeted out when you switch games. Tags: (title), (game), and (twitchurl)', false))
                // Add the the text area for online message
                .append(helpers.getTextAreaGroup('timed-msg', 'text', 'Timed Online Tweet', '', e.message_update, 'Message that will be Tweeted out every so often. Tags: (title), (game), (uptime), and (twitchurl)', false))
                // timed message minutes.
                .append(helpers.getInputGroup('timed-msg-time', 'number', 'Timed Message Interval (Minutes)', '', e.postdelay_update, 'How often in minutes the online timed message gets posted. Minimum is 180 minutes.'))))),
            function() { // Callback once the user clicks save.
                let onlineToggle = $('#online-toggle').find(':selected').text() === 'Yes',
                    gameToggle = $('#game-toggle').find(':selected').text() === 'Yes',
                    timedToggle = $('#timed-toggle').find(':selected').text() === 'Yes',
                    onlineMsg = $('#online-msg'),
                    gameMsg = $('#game-msg'),
                    timedMsg = $('#timed-msg'),
                    timedTime = $('#timed-msg-time'),
                    mentionToggle = $('#poll-mentions').find(':selected').text() === 'Yes',
                    rtToggle = $('#poll-retweets').find(':selected').text() === 'Yes',
                    homeToggle = $('#poll-home').find(':selected').text() === 'Yes',
                    userToggle = $('#poll-user').find(':selected').text() === 'Yes',
                    mentionTime = $('#query-mentions'),
                    rtTime = $('#query-retweets'),
                    homeTime = $('#query-home'),
                    userTime = $('#query-user'),
                    rtRewardToggle = $('#retweet-toggle').find(':selected').text() === 'Yes',
                    rtRewardToggleMsg = $('#retweet-toggle-msg').find(':selected').text() === 'Yes',
                    rtReward = $('#retweet-reward'),
                    rtCooldown = $('#retweet-cooldown');

                // Make sure the user filled in everything.
                switch (false) {
                    case helpers.handleInputString(onlineMsg):
                    case helpers.handleInputString(gameMsg):
                    case helpers.handleInputString(timedMsg):
                    case helpers.handleInputNumber(timedTime, 180):
                    case helpers.handleInputNumber(mentionTime, 60):
                    case helpers.handleInputNumber(rtTime, 60):
                    case helpers.handleInputNumber(homeTime, 60):
                    case helpers.handleInputNumber(userTime, 15):
                    case helpers.handleInputNumber(rtReward, 0):
                    case helpers.handleInputNumber(rtCooldown, 0):
                        break;
                    default:
                        socket.updateDBValues('alerts_get_twitter_settings', {
                            tables: ['twitter', 'twitter', 'twitter', 'twitter', 'twitter', 'twitter', 'twitter', 'twitter', 'twitter', 'twitter',
                                    'twitter', 'twitter', 'twitter', 'twitter', 'twitter', 'twitter', 'twitter', 'twitter', 'twitter'],
                            keys: ['message_online', 'message_gamechange', 'message_update', 'polldelay_mentions', 'polldelay_retweets', 'polldelay_hometimeline', 'polldelay_usertimeline', 'postdelay_update',
                                    'reward_points', 'reward_cooldown', 'poll_mentions', 'poll_retweets', 'poll_hometimeline', 'poll_usertimeline', 'post_online', 'post_gamechange', 'post_update', 'reward_toggle', 'reward_announce'],
                            values: [onlineMsg.val(), gameMsg.val(), timedMsg.val(), mentionTime.val(), rtTime.val(), homeTime.val(), userTime.val(), timedTime.val(), rtReward.val(), rtCooldown.val(), mentionToggle,
                                    rtToggle, homeToggle, userToggle, onlineToggle, gameToggle, timedToggle, rtRewardToggle, rtRewardToggleMsg]
                        }, function() {
                            // Close the modal.
                            $('#twitter-alert').modal('toggle');
                            // Alert the user.
                            toastr.success('Successfully updated the Twitter alert settings!');
                        });
                }
            }).modal('toggle');
        });
    });
});
