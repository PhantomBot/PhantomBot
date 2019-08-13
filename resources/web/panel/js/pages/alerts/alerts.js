/*
 * Copyright (c) 2019. - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Valentin Sickert <lapotor@lapotor.de>
 */

// Function that querys all of the data we need.
$(function() {
    // Get all module toggles.
    socket.getDBValues('alerts_get_modules', {
        tables: ['modules', 'modules', 'modules', 'modules', 'modules', 'modules', 'modules', 'modules', 'modules', 'modules', 'modules'],
        keys: ['./handlers/followHandler.js', './handlers/subscribeHandler.js', './handlers/hostHandler.js', './handlers/bitsHandler.js', './handlers/clipHandler.js',
                './systems/greetingSystem.js', './handlers/donationHandler.js', './handlers/raidHandler.js', './handlers/tipeeeStreamHandler.js',
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
            toastr.success('Das Alarmmodul wurde erfolgreich ' + (checked ? 'aktiviert!' : 'deaktiviert!'));
        });
    });

    // Follow handler settings.
    $('#followHandlerSettings').on('click', function() {
        socket.getDBValues('alerts_follow_get_settings', {
            tables: ['settings', 'settings', 'settings', 'settings'],
            keys: ['followToggle', 'followReward', 'followMessage', 'followDelay']
        }, true, function(e) {
            helpers.getModal('follow-alert', 'Follower Alarm Einstellungen', 'Speichern', $('<form/>', {
                'role': 'form'
            })
            // Add the toggle for follow alerts.
            .append(helpers.getDropdownGroup('follow-toggle', 'Follow-Alerts aktivieren', (e.followToggle === 'true' ? 'Ja' : 'Nein'), ['Ja', 'Nein'],
                'Wenn eine Nachricht im Kanal gesendet werden soll, wenn jemand folgt. Dadurch wird auch die Belohnung umgeschaltet.'))
            // Add the the text area for the follow message.
            .append(helpers.getTextAreaGroup('follow-message', 'text', 'Follow Nachricht', '', e.followMessage,
                'Die Nachricht wird gesendet, wenn jemand dem Kanal folgt. Tags: (name) und (reward)', false))
            // Add the the box for the reward.
            .append(helpers.getInputGroup('follow-reward', 'number', 'Follow Belohnung', '', e.followReward,
                'Belohnung für Benutzer, die dem Kanal folgen.'))
            // Add the the box for the reward
            .append(helpers.getInputGroup('follow-delay', 'number', 'Follow Verzögerung (Sekunden)', '', e.followDelay,
                'Verzögerung zwischen den im Kanal geposteten Follow-Meldungen. Das Minimum beträgt 5 Sekunden.')),
            function() { // Callback once the user clicks save.
                let followToggle = $('#follow-toggle').find(':selected').text() === 'Ja',
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
                                toastr.success('Die Einstellungen für die Follower-Alarm wurden erfolgreich aktualisiert!');
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
                    'subscribeHandler', 'subscribeHandler', 'subscribeHandler', 'subscribeHandler', 'subscribeHandler', 'subscribeHandler'],
            keys: ['subscribeMessage', 'primeSubscribeMessage', 'reSubscribeMessage', 'giftSubMessage', 'subscriberWelcomeToggle', 'primeSubscriberWelcomeToggle',
                    'reSubscriberWelcomeToggle', 'giftSubWelcomeToggle', 'subscribeReward', 'reSubscribeReward', 'giftSubReward', 'resubEmote', 'subPlan1000', 'subPlan2000', 'subPlan3000',
                    'massGiftSubWelcomeToggle', 'massGiftSubMessage', 'massGiftSubReward', 'giftAnonSubMessage', 'massAnonGiftSubMessage', 'giftAnonSubWelcomeToggle', 'massAnonGiftSubWelcomeToggle']
        }, true, function(e) {
            helpers.getModal('subscribe-alert', 'Abonnement Benachrichtigungseinstellungen', 'Speichen', $('<form/>', {
                'role': 'form'
            })
            // Add the div for the col boxes.
            .append($('<div/>', {
                'class': 'panel-group',
                'id': 'accordion'
            })
            // Append first collapsible accordion.
            .append(helpers.getCollapsibleAccordion('main-1', 'Abonnement-Einstellungen', $('<form/>', {
                    'role': 'form'
                })
                // Add toggle for normal subscriptions.
                .append(helpers.getDropdownGroup('sub-toggle', 'Abonnement-Alarme aktivieren', (e.subscriberWelcomeToggle === 'true' ? 'Ja' : 'Nein'), ['Ja', 'Nein'],
                    'Wenn eine Nachricht im Channel gesendet werden soll, wenn dich jemand abonniert. Dadurch wird auch die Belohnung umgeschaltet.'))
                // Append message box for the message
                .append(helpers.getTextAreaGroup('sub-msg', 'text', 'Abonnementnachricht', '', e.subscribeMessage,
                    'Die Nachricht wird gesendet, wenn sich jemand den Kanal abonniert. Tags: (name) (plan), und (reward)', false))
                // Appen the reward box
                .append(helpers.getInputGroup('sub-reward', 'number', 'Abonnement Belohnung', '', e.subscribeReward,
                    'Belohnung, die der Benutzer erhält, wenn er den Kanal abonnier, ein Geschenk-Abonnement erhält oder mit Twitch Prime abonniert.'))))
            // Append second collapsible accordion.
            .append(helpers.getCollapsibleAccordion('main-2', 'Prime Abonnement-Einstellungen',  $('<form/>', {
                    'role': 'form'
                })
                // Add toggle for prime subscriptions.
                .append(helpers.getDropdownGroup('primesub-toggle', 'Aktivieren von Prime Abonnement Alarmen', (e.primeSubscriberWelcomeToggle === 'true' ? 'Ja' : 'Nein'), ['Ja', 'Nein'],
                    'Wenn eine Nachricht im Kanal gesendet werden soll, wenn dich jemand über Twitch Prime abonniert. Dadurch wird auch die Belohnung umgeschaltet.'))
                // Append message box for the message
                .append(helpers.getTextAreaGroup('primesub-msg', 'text', 'Prime Abonnement Nachricht', '', e.primeSubscribeMessage,
                    'Die Nachricht wird gesendet, wenn jemand den Kanal mit Twitch Prime abonniert. Tags: (name), (plan), und (reward)', false))))
            // Append third collapsible accordion.
            .append(helpers.getCollapsibleAccordion('main-3', 'Einstellungen für das erneute Abonnieren', $('<form/>', {
                    'role': 'form'
                })
                // Add toggle for resubscriptions.
                .append(helpers.getDropdownGroup('resub-toggle', 'Benachrichtigungen für erneutes Abonnieren aktivieren', (e.reSubscriberWelcomeToggle === 'true' ? 'Ja' : 'Nein'), ['Ja', 'Nein'],
                    'Wenn eine Nachricht im Kanal gesendet werden soll, wenn dich jemand erneut abonniert. Dadurch wird auch die Belohnung umgeschaltet.'))
                // Append message box for the message
                .append(helpers.getTextAreaGroup('resub-msg', 'text', 'Wieder-Abonnement Nachricht', '', e.reSubscribeMessage,
                    'Die Nachricht wird gesendet, wenn jemand den Kanal erneut abonniert. Tags: (name), (plan), (months), (customemote), und (reward)', false))
                // Appen the reward box
                .append(helpers.getInputGroup('resub-reward', 'number', 'Wieder-Abonnement Belohnung', '', e.reSubscribeReward,
                    'Belohnung, die dem Benutzer gegeben wird, wenn er den Kanal erneut abonniert.'))
                // Appen the emotes box
                .append(helpers.getInputGroup('resub-emote', 'text', 'Wieder-Abonnement Emote', '', e.resubEmote,
                    'Emote das ersetzt (customemote) für die Anzahl der Monate, die der Benutzer abonniert hat.'))))
            // Append forth collapsible accordion.
            .append(helpers.getCollapsibleAccordion('main-4', 'Einstellungen für Geschenk-Abonnements', $('<form/>', {
                    'role': 'form'
                })
                // Add toggle for gifted subscriptions.
                .append(helpers.getDropdownGroup('gifsub-toggle', 'Geschenk-Abonnement-Alarme aktivieren', (e.giftSubWelcomeToggle === 'true' ? 'Ja' : 'Nein'), ['Ja', 'Nein'],
                    'Wenn eine Nachricht im Kanal gesendet werden soll, wenn jemand ein Abonnement verschenkt. Dadurch wird auch die Belohnung umgeschaltet.'))
                // Append message box for the message
                .append(helpers.getTextAreaGroup('gifsub-msg', 'text', 'Geschenk-Abonnement Nachricht', '', e.giftSubMessage,
                    'Die Nachricht wird gesendet, wenn jemand ein Abonnement für den Kanal verschenkt. Tags: (name), (recipient), (plan), (months), und (reward)', false))
                // Appen the reward box
                .append(helpers.getInputGroup('gifsub-reward', 'number', 'Geschenk-Abonnement Belohnung', '', e.giftSubReward,
                    'Belohnung für den Benutzer, der das Abonnement gekauft hat.'))))
            // Append forth collapsible accordion.
            .append(helpers.getCollapsibleAccordion('main-5', 'Mystery Geschenk-Abonnement Einstellungen', $('<form/>', {
                    'role': 'form'
                })
                // Add toggle for gifted subscriptions.
                .append(helpers.getDropdownGroup('mass-gifsub-toggle', 'Benachrichtigungen für Mystery Geschenk-Abonnements aktivieren', (e.massGiftSubWelcomeToggle === 'true' ? 'Ja' : 'Nein'), ['Ja', 'Nein'],
                    'Wenn eine Nachricht im Channel gesendet werden soll, wenn jemand mehrere Abonnements verschenkt. Dadurch wird auch die Belohnung umgeschaltet.'))
                // Append message box for the message
                .append(helpers.getTextAreaGroup('mass-gifsub-msg', 'text', 'Mystery Geschenk-Abonnement Nachricht', '', e.massGiftSubMessage,
                    'Die Nachricht wird gesendet, wenn jemand mehrere Abonnements für den Kanal verschenkt. Tags: (name), (plan), (amount), und (reward)', false))
                // Appen the reward box
                .append(helpers.getInputGroup('mass-gifsub-reward', 'number', 'Mystery Geschenk-Abonnement Belohnung', '', e.massGiftSubReward,
                    'Belohnung für den Benutzer, der das Abonnement gekauft hat. Dies ist ein Multiplikator. (Belohnung * Anzahl Geschenke)'))))
            // Append sixth collapsible accordion.
            .append(helpers.getCollapsibleAccordion('main-6', 'Anonymes Geschenk-Abo Einstellungen', $('<form/>', {
                    'role': 'form'
                })
                // Add toggle for gifted subscriptions.
                .append(helpers.getDropdownGroup('anon-gifsub-toggle', 'Benachrichtigungen für anonyme Geschenk-Abonnements aktivieren', (e.giftAnonSubWelcomeToggle === 'true' ? 'Ja' : 'Nein'), ['Ja', 'Nein'],
                    'Wenn eine Nachricht im Kanal gesendet werden soll, wenn jemand ein anonymes Abonnement verschenkt. Dadurch wird auch die Belohnung umgeschaltet.'))
                // Append message box for the message
                .append(helpers.getTextAreaGroup('anon-gifsub-msg', 'text', 'Anonyme Geschenk-Abonnement Nachricht', '', e.giftAnonSubMessage,
                    'Die Nachricht wird gesendet, wenn jemand mehrere Abonnements für den Kanal anonym verschenkt. Tags: (name), (plan), (amount), und (reward)', false))
                // Appen the reward box
                .append(helpers.getInputGroup('anon-gifsub-reward', 'number', 'Anonyme Geschenk-Abonnement Belohnung', '', e.subscribeReward,
                    'Belohnung für den Benutzer, an den das Abonnement vergeben wurde. Dies ist das Gleiche wie die normale Abonnement Belohnung.', true))))
            // Append sixth collapsible accordion.
            .append(helpers.getCollapsibleAccordion('main-7', 'Anonyme Mystery Geschenk-Abo Einstellungen', $('<form/>', {
                    'role': 'form'
                })
                // Add toggle for gifted subscriptions.
                .append(helpers.getDropdownGroup('anon-mass-gifsub-toggle', 'Anonyme Mystery Geschenk-Abonnements Alarme aktivieren', (e.massAnonGiftSubWelcomeToggle === 'true' ? 'Ja' : 'Nein'), ['Ja', 'Nein'],
                    'Wenn eine Nachricht im Channel gesendet werden soll, wenn ein anonymer Benutzer mehrere Abonnements verschenkt. Dadurch wird auch die Belohnung umgeschaltet.'))
                // Append message box for the message
                .append(helpers.getTextAreaGroup('anon-mass-gifsub-msg', 'text', 'Anonymes Mystery Geschenk Abonnement Nachricht', '', e.massAnonGiftSubMessage,
                    'Die Nachricht wird gesendet, wenn jemand anonym Abonnements für den Kanal verschenkt. Tags: (name), (plan), und (amount)', false))))
            // Tier settings
            .append(helpers.getCollapsibleAccordion('main-8', 'Tier Settings', $('<form/>', {
                    'role': 'form'
                })
                // Append first sub plan name
                .append(helpers.getInputGroup('sub-1000', 'text', 'Name des Abonnement-Plans 1', '', e.subPlan1000, 'Name, der dem Tier-1-Plan gegeben wird.'))
                // Append first sub plan name
                .append(helpers.getInputGroup('sub-2000', 'text', 'Name des Abonnement-Plans 2', '', e.subPlan2000, 'Name, der dem Tier-2-Plan gegeben wird.'))
                // Append first sub plan name
                .append(helpers.getInputGroup('sub-3000', 'text', 'Name des Abonnement-Plans 3', '', e.subPlan3000, 'Name, der dem Tier-3-Plan gegeben wird.'))))),
            function() { // Callback once the user clicks save.
                let subToggle = $('#sub-toggle').find(':selected').text() === 'Ja',
                    subMsg = $('#sub-msg'),
                    subReward = $('#sub-reward'),
                    primeSubToggle = $('#primesub-toggle').find(':selected').text() === 'Ja',
                    primeSubMsg = $('#primesub-msg'),
                    reSubToggle = $('#resub-toggle').find(':selected').text() === 'Ja',
                    reSubMsg = $('#resub-msg'),
                    reSubReward = $('#resub-reward'),
                    reSubEmote = $('#resub-emote'),
                    gifSubToggle = $('#gifsub-toggle').find(':selected').text() === 'Ja',
                    gifSubMsg = $('#gifsub-msg'),
                    anonGifSubToggle = $('#anon-gifsub-toggle').find(':selected').text() === 'Ja',
                    anonGifSubMsg = $('#anon-gifsub-msg'),
                    gifSubReward = $('#gifsub-reward'),
                    massGiftSubToggle = $('#mass-gifsub-toggle').find(':selected').text() === 'Ja',
                    massGiftSubMsg = $('#mass-gifsub-msg'),
                    anonMassGiftSubToggle = $('#anon-mass-gifsub-toggle').find(':selected').text() === 'Ja',
                    anonMassGiftSubMsg = $('#anon-mass-gifsub-msg'),
                    massGiftSubReward = $('#mass-gifsub-reward'),
                    tierOne = $('#sub-1000'),
                    tierTwo = $('#sub-2000'),
                    tierThree = $('#sub-3000');

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
                        break;
                    default:
                        socket.updateDBValues('alerts_subscribe_update_settings', {
                            tables: ['subscribeHandler', 'subscribeHandler', 'subscribeHandler', 'subscribeHandler', 'subscribeHandler', 'subscribeHandler', 'subscribeHandler', 'subscribeHandler',
                                    'subscribeHandler', 'subscribeHandler', 'subscribeHandler', 'subscribeHandler', 'subscribeHandler', 'subscribeHandler', 'subscribeHandler', 'subscribeHandler',
                                    'subscribeHandler', 'subscribeHandler', 'subscribeHandler', 'subscribeHandler', 'subscribeHandler', 'subscribeHandler'],
                            keys: ['subscribeMessage', 'primeSubscribeMessage', 'reSubscribeMessage', 'giftSubMessage', 'subscriberWelcomeToggle', 'primeSubscriberWelcomeToggle',
                                    'reSubscriberWelcomeToggle', 'giftSubWelcomeToggle', 'subscribeReward', 'reSubscribeReward', 'giftSubReward', 'resubEmote', 'subPlan1000', 'subPlan2000', 'subPlan3000',
                                    'massGiftSubWelcomeToggle', 'massGiftSubMessage', 'massGiftSubReward', 'giftAnonSubMessage', 'massAnonGiftSubMessage', 'giftAnonSubWelcomeToggle', 'massAnonGiftSubWelcomeToggle'],
                            values: [subMsg.val(), primeSubMsg.val(), reSubMsg.val(), gifSubMsg.val(), subToggle, primeSubToggle, reSubToggle, gifSubToggle, subReward.val(), reSubReward.val(),
                                gifSubReward.val(), reSubEmote.val(), tierOne.val(), tierTwo.val(), tierThree.val(), massGiftSubToggle, massGiftSubMsg.val(), massGiftSubReward.val(),
                                anonGifSubMsg.val(), anonMassGiftSubMsg.val(), anonGifSubToggle, anonMassGiftSubToggle]
                        }, function() {
                            socket.sendCommand('alerts_subscribe_update_settings_cmd', 'subscriberpanelupdate', function() {
                                // Close the modal.
                                $('#subscribe-alert').modal('toggle');
                                // Alert the user.
                                toastr.success('Erfolgreich Benachrichtigungseinstellungen für Abonnements aktualisiert!');
                            });
                        });
                }
            }).modal('toggle');
        });
    });

    // Host settings button.
    $('#hostHandlerSettings').on('click', function() {
        socket.getDBValues('alerts_get_host_settings', {
            tables: ['settings', 'settings', 'settings', 'settings', 'settings', 'settings', 'settings', 'settings', 'settings'],
            keys: ['hostReward', 'autoHostReward', 'hostMinViewerCount', 'hostMinCount', 'hostMessage', 'autoHostMessage', 'hostHistory', 'hostToggle', 'autoHostToggle']
        }, true, function(e) {
            helpers.getModal('host-alert', 'Host-Alarmeinstellungen', 'Speichern', $('<form/>', {
                'role': 'form'
            })
            // Add the div for the col boxes.
            .append($('<div/>', {
                'class': 'panel-group',
                'id': 'accordion'
            })
            // Append first collapsible accordion.
            .append(helpers.getCollapsibleAccordion('main-1', 'Host-Einstellungen', $('<form/>', {
                    'role': 'form'
                })
                // Add toggle for normal hosts
                .append(helpers.getDropdownGroup('host-toggle', 'Host-Alarme aktivieren', (e.hostToggle === 'true' ? 'Ja' : 'Nein'), ['Ja', 'Nein'],
                    'Wenn eine Nachricht im Kanal gesendet werden soll, wenn jemand den Kanal hostet.'))
                // Append message box for the message
                .append(helpers.getTextAreaGroup('host-msg', 'text', 'Host Nachricht', '', e.hostMessage,
                    'Die Nachricht wird gesendet, wenn jemand den Kanal hostet. Tags: (name), (reward), und (viewers)', false))
                // Appen the reward box
                .append(helpers.getInputGroup('host-reward', 'number', 'Host Belohnung', '', e.hostReward,
                    'Belohnung, die dem Benutzer gezahlt wird, wenn er den Kanal hostet.'))))
            // Append second collapsible accordion.
            .append(helpers.getCollapsibleAccordion('main-2', 'Auto-Host Settings', $('<form/>', {
                    'role': 'form'
                })
                // Add toggle for normal hosts
                .append(helpers.getDropdownGroup('autohost-toggle', 'Auto-Host-Alarme aktivieren', (e.autoHostToggle === 'true' ? 'Ja' : 'Nein'), ['Ja', 'Nein'],
                    'Wenn eine Nachricht im Channel gesendet werden soll, wenn jemand den Kanal automatisch hostet.'))
                // Append message box for the message
                .append(helpers.getTextAreaGroup('autohost-msg', 'text', 'Auto-Host-Nachricht', '', e.autoHostMessage,
                    'Die Nachricht wird gesendet, wenn jemand den Kanal automatisch hostet. Tags: (name), (reward), und (viewers)', false))
                // Appen the reward box
                .append(helpers.getInputGroup('autohost-reward', 'number', 'Auto-Host-Belohnung', '', e.autoHostReward,
                    'Belohnung, die dem Benutzer gezahlt wird, wenn er den Kanal automatisch hostet.'))))
            // Append third collapsible accordion.
            .append(helpers.getCollapsibleAccordion('main-3', 'Zusätzliche Einstellungen', $('<form/>', {
                    'role': 'form'
                })
                // Add toggle for host history.
                .append(helpers.getDropdownGroup('host-history', 'Host-Verlauf aktivieren', (e.hostHistory === 'true' ? 'Ja' : 'Nein'), ['Ja', 'Nein'],
                    'Wenn alle Hosts für eine spätere Ansicht protokolliert werden sollen.'))
                // Min host box reward.
                .append(helpers.getInputGroup('host-minpoint', 'number', 'Mindestanzahl der Zuschauer für die Host-Belohnung', '', e.hostMinViewerCount,
                    'Minimale Anzahl von Zuschauern, mit denen die Benutzer hosten muss, um eine Belohnung zu erhalten.'))
                // Min host box alert.
                .append(helpers.getInputGroup('host-minalert', 'number', 'Minimale Zuschauer für Host Alarm', '', e.hostMinCount,
                    'Minimale Anzahl von Zuschauern, mit denen die Benutzer hosten muss, um den Alarm auszulösen.'))))),
            function() { // Callback once the user clicks save.
                let hostToggle = $('#host-toggle').find(':selected').text() === 'Ja',
                    hostMsg = $('#host-msg'),
                    hostReward = $('#host-reward'),
                    autoHostToggle = $('#autohost-toggle').find(':selected').text() === 'Ja',
                    autoHostMsg = $('#autohost-msg'),
                    autoHostReward = $('#autohost-reward'),
                    hostHistory = $('#host-history').find(':selected').text() === 'Ja',
                    hostMinPoints = $('#host-minpoint'),
                    hostMinAlert = $('#host-minalert');

                // Make sure the user has someone in each box.
                switch (false) {
                    case helpers.handleInputString(hostMsg):
                    case helpers.handleInputNumber(hostReward, 0):
                    case helpers.handleInputString(autoHostMsg):
                    case helpers.handleInputNumber(autoHostReward, 0):
                    case helpers.handleInputNumber(hostMinPoints, 0):
                    case helpers.handleInputNumber(hostMinAlert, 0):
                        break;
                    default:
                        socket.updateDBValues('alerts_update_host_settings', {
                            tables: ['settings', 'settings', 'settings', 'settings', 'settings', 'settings', 'settings',
                                'settings', 'settings'],
                            keys: ['hostReward', 'autoHostReward', 'hostMinViewerCount', 'hostMinCount', 'hostMessage',
                                'autoHostMessage', 'hostHistory', 'hostToggle', 'autoHostToggle'],
                            values: [hostReward.val(), autoHostReward.val(), hostMinPoints.val(), hostMinAlert.val(),
                                hostMsg.val(), autoHostMsg.val(), hostHistory, hostToggle, autoHostToggle]
                        }, function() {
                            socket.sendCommand('alerts_update_host_settings_cmd', 'reloadhost', function() {
                                // Close the modal.
                                $('#host-alert').modal('toggle');
                                // Alert the user.
                                toastr.success('Host-Alarmeinstellungen erfolgreich aktualisiert!');
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
            helpers.getModal('bits-alert', 'Bits Alarm-Einstellungen', 'Speichern', $('<form/>', {
                'role': 'form'
            })
            // Add the toggle for bits alerts.
            .append(helpers.getDropdownGroup('bits-toggle', 'Bits-Alarme aktivieren', (e.toggle === 'true' ? 'Ja' : 'Nein'), ['Ja', 'Nein'],
                'Wenn eine Nachricht im Kanal gesagt werden soll, wenn jemand cheert.'))
            // Add the the text area for the bits message.
            .append(helpers.getTextAreaGroup('bits-message', 'text', 'Bits Nachricht', '', e.message,
                'Die Nachricht wird gesendet, wenn jemand im Kanal cheert. Tags: (name), (message), und (amount)', false))
            // Add the box for the reward.
            .append(helpers.getInputGroup('bits-minimum', 'number', 'Bits Minimum', '', e.minimum, 'Anzahl der Bits, die benötigt werden, um den Alarm auszulösen.')),
            function() { // Callback once the user clicks save.
                let bitsToggle = $('#bits-toggle').find(':selected').text() === 'Ja',
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
                                toastr.success('Bit-Alarmeinstellungen erfolgreich aktualisiert!');
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
            helpers.getModal('clip-alert', 'Clip-Alarmeinstellungen', 'Speichern', $('<form/>', {
                'role': 'form'
            })
            // Add the toggle for clip alerts.
            .append(helpers.getDropdownGroup('clip-toggle', 'Clip-Alarme aktivieren', (e.toggle === 'true' ? 'Ja' : 'Nein'), ['Ja', 'Nein'],
                'Wenn eine Nachricht im Kanal gesendet werden soll, wenn jemand einen Clip erstellt.'))
            // Add the text area for the clips message.
            .append(helpers.getTextAreaGroup('clip-message', 'text', 'Clip-Nachricht', '', e.message,
                'Die Nachricht wird gesendet, wenn jemand einen Clip erstellt. Tags: (name), (title), und (url)', false)),
            function() { // Callback once the user clicks save.
                let clipToggle = $('#clip-toggle').find(':selected').text() === 'Ja',
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
                                toastr.success('Clip-Alarmeinstellungen erfolgreich aktualisiert!');
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
            helpers.getModal('raid-alert', 'Raid Alarm Einstellungen', 'Speichern', $('<form/>', {
                'role': 'form'
            })
            // Add the div for the col boxes.
            .append($('<div/>', {
                'class': 'panel-group',
                'id': 'accordion'
            })
            // Append first collapsible accordion.
            .append(helpers.getCollapsibleAccordion('main-1', 'Einstellungen für eingehende Raids', $('<form/>', {
                    'role': 'form'
                })
                 // Add the toggle for raid alerts.
                .append(helpers.getDropdownGroup('raid-toggle', 'Raid-Alarme aktivieren', (e.raidToggle === 'true' ? 'Ja' : 'Nein'), ['Ja', 'Nein'],
                    'Wenn eine Nachricht im Kanal gesendet werden soll, wenn ein eingehender Raid passiert.'))
                // Add the text area for the new raid message.
                .append(helpers.getTextAreaGroup('new-raid-message', 'text', 'New Raider Message', '', e.newRaidIncMessage,
                    'Die Nachricht wird gesendet, wenn jemand zum ersten Mal deinen Kanal raiden. Tags: (username), (viewers), (url), (reward) und (game)', false))
                // Add the text area for the raid message.
                .append(helpers.getTextAreaGroup('raid-message', 'text', 'Raider Nachricht', '', e.raidIncMessage,
                    'Die Nachricht wird gesendet, wenn jemand deinen Kanal raidet. Tags: (username), (viewers), (url), (times), (reward) und (game)', false))
                // Appen the reward box
                .append(helpers.getInputGroup('raid-reward', 'number', 'Raid Belohnung', '', e.raidReward,
                    'Belohnung für die Benutzer, die deinen Kanal geraidet haben.'))))
            // Append second collapsible accordion.
            .append(helpers.getCollapsibleAccordion('main-2', 'Einstellungen für ausgehende Raids', $('<form/>', {
                    'role': 'form'
                })
                // Add the text area for the new raid message.
                .append(helpers.getTextAreaGroup('out-raid-message', 'text', 'Raiding Nachricht', '', e.raidOutMessage,
                    'Die Nachricht wird in den Chat gesendet, wenn du den Befehl !raid verwendest, um einen Kanal zu raiden. Tags: (username) und (url)', false))
                 // Appen the spam box
                .append(helpers.getInputGroup('raid-spam', 'number', 'Raiding Nachrichten-Spam', '', e.raidOutSpam,
                    'Wie oft wird die Nachricht bei Verwendung des Befehls !raid im Chat angezeigt. Maximum ist 10 Mal.'))))),
            function() {
                let raidToggle = $('#raid-toggle').find(':selected').text() === 'Ja',
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
                                toastr.success('Raid-Einstellungen erfolgreich aktualisiert!');
                                // Close the modal.
                                $('#raid-alert').modal('toggle');
                            });
                        });
                }
            }).modal('toggle');
        });
    });

    // Greeting settings.
    $('#greetingSystemSettings').on('click', function() {
        socket.getDBValues('alerts_get_greeting_settings', {
            tables: ['greeting', 'greeting'],
            keys: ['autoGreetEnabled', 'cooldown']
        }, true, function(e) {
            helpers.getModal('greeting-alert', 'Einstellungen für Begrüßungsnachrichten', 'Speichern', $('<form/>', {
                'role': 'form'
            })
            // Add the toggle for greeting alerts.
            .append(helpers.getDropdownGroup('greeting-toggle', 'Begrüßungsnachrichten aktivieren', (e.autoGreetEnabled === 'true' ? 'Ja' : 'Nein'), ['Ja', 'Nein'],
                'Wenn Benutzer eine Nachricht einstellen dürfen sollen, wenn sie dem Kanal beitreten.'))
            // Add the input for the greeting reward.
            .append(helpers.getInputGroup('greeting-cooldown', 'number', 'Abklingzeit der Begrüßung (Stunden)', '', (parseInt(e.cooldown) / 36e5),
                'Wie lang die Begrüßungsnachricht pro Benutzer in Stunden ist. Das Minimum beträgt 5 Stunden.')),
            function() { // Callback once the user clicks save.
                let greetingToggle = $('#greeting-toggle').find(':selected').text() === 'Ja',
                    greetingCooldown = $('#greeting-cooldown');

                // Make sure the user has someone in each box.
                switch (false) {
                    case helpers.handleInputNumber(greetingCooldown, 5):
                        break;
                    default:
                        socket.updateDBValues('alerts_update_greeting_settings', {
                            tables: ['greeting', 'greeting'],
                            keys: ['autoGreetEnabled', 'cooldown'],
                            values: [greetingToggle, (parseInt(greetingCooldown.val()) * 36e5)]
                        }, function() {
                            socket.sendCommand('alerts_update_greeting_settings_cmd', 'greetingspanelupdate', function() {
                                // Close the modal.
                                $('#greeting-alert').modal('toggle');
                                // Alert the user.
                                toastr.success('Begrüßungsnachricht Einstellungen erfolgreich aktualisiert!');
                            });
                        });
                }
            }).modal('toggle');
        });
    });

    // StreamLabs settings.
    $('#donationHandlerSettings').on('click', function() {
        socket.getDBValues('alerts_get_streamlabs_settings', {
            tables: ['donations', 'donations', 'donations'],
            keys: ['announce', 'reward', 'message']
        }, true, function(e) {
            helpers.getModal('streamlabs-alert', 'StreamLabs Alarmeinstellungen', 'Speichern', $('<form/>', {
                'role': 'form'
            })
            /// Add the toggle for streamlabs alerts.
            .append(helpers.getDropdownGroup('streamlabs-toggle', 'StreamLabs-Alarme aktivieren', (e.announce === 'true' ? 'Ja' : 'Nein'), ['Ja', 'Nein'],
                'Wenn StreamLabs Spenden in den Chat senden soll.'))
            // Add the the text area for the tip message.
            .append(helpers.getTextAreaGroup('streamlabs-message', 'text', 'Spenden Nachricht', '', e.message,
                'Die Nachricht wird in den Kanal gesendet, wenn jemand über StreamLabs spendet. Tags: (name), (amount), (points), (reward), (pointname), (currency) und (message)'))
            // Add the the box for the tip reward
            .append(helpers.getInputGroup('streamlabs-reward', 'number', 'Spenden Belohnungs-Multiplikator', '', e.reward, 'Belohnungsmultiplikator für die Belohnung.')),
            function() { // Callback once the user clicks save.
                let tipToggle = $('#streamlabs-toggle').find(':selected').text() === 'Ja',
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
                                toastr.success('StreamLabs Benachrichtigungseinstellungen wurden erfolgreich aktualisiert!');
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
            helpers.getModal('tipeeestream-alert', 'TipeeeStream Alarm-Einstellungen', 'Speichern', $('<form/>', {
                'role': 'form'
            })
            /// Add the toggle for streamlabs alerts.
            .append(helpers.getDropdownGroup('tipeeestream-toggle', 'TipeeeStream-Alarme aktivieren', (e.toggle === 'true' ? 'Ja' : 'Nein'), ['Ja', 'Nein'],
                'Wenn TipeeeStream Spenden in den Chat gesendet werden sollen.'))
            // Add the the text area for the tip message.
            .append(helpers.getTextAreaGroup('tipeeestream-message', 'text', 'Spenden Nachrichte', '', e.message,
                'Die Nachricht wird in den Kanal gesendet, wenn jemand über TipeeStream spendet. Tags: (name), (amount), (reward), (formattedamount) und (message)'))
            // Add the the box for the tip reward
            .append(helpers.getInputGroup('tipeeestream-reward', 'number', 'Spenden Belohnungs-Multiplier', '', e.reward, 'Belohnungsmultiplikator für die Belohnung.')),
            function() { // Callback once the user clicks save.
                let tipToggle = $('#tipeeestream-toggle').find(':selected').text() === 'Ja',
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
                                toastr.success('TipeeeStream-Benachrichtigungseinstellungen wurden erfolgreich aktualisiert!');
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
            helpers.getModal('streamelements-alert', 'StreamElements Benachrichtigungseinstellungen', 'Speichern', $('<form/>', {
                'role': 'form'
            })
            /// Add the toggle for streamelements alerts.
            .append(helpers.getDropdownGroup('streamelements-toggle', 'StreamElements-Alarme aktivieren', (e.toggle === 'true' ? 'Ja' : 'Nein'), ['Ja', 'Nein'],
                'Wenn StreamElements Spenden in den Chat gesendet werden sollen.'))
            // Add the the text area for the tip message.
            .append(helpers.getTextAreaGroup('streamelements-message', 'text', 'Spenden Nachricht', '', e.message,
                'Die Nachricht wird in den Kanal gesendet, wenn jemand über StreamElements spendet. Tags: (name), (amount), (reward), (currency) und (message)'))
            // Add the the box for the tip reward
            .append(helpers.getInputGroup('streamelements-reward', 'number', 'Spenden Belohnungs-Multiplier', '', e.reward, 'Belohnungsmultiplikator für die Belohnung.')),
            function() { // Callback once the user clicks save.
                let tipToggle = $('#streamelements-toggle').find(':selected').text() === 'Ja',
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
                                toastr.success('StreamElements-Benachrichtigungseinstellungen wurden erfolgreich aktualisiert!');
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
            helpers.getModal('twitter-alert', 'Twitter-Alarmeinstellungen', 'Speichern', $('<form/>', {
                'role': 'form'
            })
            // Add the div for the col boxes.
            .append($('<div/>', {
                'class': 'panel-group',
                'id': 'accordion'
            })
            // Append first collapsible accordion.
            .append(helpers.getCollapsibleAccordion('main-1', 'Twitter-Konfiguration', $('<form/>', {
                    'role': 'form'
                })
                // Add the toggle for mentions
                .append(helpers.getDropdownGroup('poll-mentions', 'Suche Erwähnungen', (e.poll_mentions === 'true' ? 'Ja' : 'Nein'), ['Ja', 'Nein'],
                    'Wenn PhantomBot nach Erwähnungen auf Ihrer Timeline suchen und diese im Chat posten sollte.'))
                // Add the toggle for retweets
                .append(helpers.getDropdownGroup('poll-retweets', 'Suche Retweets', (e.poll_retweets === 'true' ? 'Ja' : 'Nein'), ['Ja', 'Nein'],
                    'Wenn PhantomBot nach Ihren Retweets suchen und diese im Chat posten soll.'))
                // Add the toggle for home timeline
                .append(helpers.getDropdownGroup('poll-home', 'Suche auf der Home Timeline', (e.poll_hometimeline === 'true' ? 'Ja' : 'Nein'), ['Ja', 'Nein'],
                    'Wenn PhantomBot nach allem auf deiner Timeline suchen und es im Chat posten soll.'))
                // Add the toggle for user timeline
                .append(helpers.getDropdownGroup('poll-user', 'Suche auf der Benutzer-Timeline', (e.poll_usertimeline === 'true' ? 'Ja' : 'Nein'), ['Ja', 'Nein'],
                    'Wenn PhantomBot nach allem auf deiner von dir geposteten Timeline suchen und es im Chat posten sollte.'))
                // Query interval for mentions
                .append(helpers.getInputGroup('query-mentions', 'number', 'Such Interval für Erwähnung (Sekunden)', '', e.polldelay_mentions, 'Wie oft der Bot nach Erwähnungen suchen soll. Das Minimum beträgt 60 Sekunden.'))
                // Query interval for retweets
                .append(helpers.getInputGroup('query-retweets', 'number', 'Such Interval für Retweets (Sekunden)', '', e.polldelay_retweets, 'Wie oft der Bot nach Retweets suchen soll. Das Minimum beträgt 60 Sekunden.'))
                // Query interval for mentions
                .append(helpers.getInputGroup('query-home', 'number', 'Such Interval für Home TimeLine (Sekunden)', '', e.polldelay_hometimeline, 'Wie oft der Bot nach der Home Timeline suchen soll. Das Minimum beträgt 60 Sekunden.'))
                // Query interval for mentions
                .append(helpers.getInputGroup('query-user', 'number', 'Such Interval für User TimeLine (Sekunden)', '', e.polldelay_usertimeline, 'Wie oft der Bot nach der User-Timeline suchen soll. Das Minimum beträgt 15 Sekunden.'))))
            // Append second collapsible accordion.
            .append(helpers.getCollapsibleAccordion('main-2', 'Twitter Retweet Konfiguration', $('<form/>', {
                    'role': 'form'
                })
                // Add the toggle for mentions
                .append(helpers.getDropdownGroup('retweet-toggle', 'Retweet-Belohnungen aktivieren', (e.reward_toggle === 'true' ? 'Ja' : 'Nein'), ['Ja', 'Nein'], 'Wenn PhantomBot Benutzer belohnen soll, die Ihre Tweets retweeten.'))
                // Add the toggle for retweets
                .append(helpers.getDropdownGroup('retweet-toggle-msg', 'Retweet Belohnungensnachricht aktivieren', (e.reward_announce === 'true' ? 'Ja' : 'Nein'), ['Ja', 'Nein'],
                    'Wenn PhantomBot ankündigen soll, dass es einen Benutzer für das Reetweeten Ihrer Tweets belohnt hat.'))
                // Query interval for mentions
                .append(helpers.getInputGroup('retweet-reward', 'number', 'Retweet Belohnung', '', e.reward_points, 'Belohnung für den Benutzer der Ihre Tweets retweetete.'))
                // Query interval for mentions
                .append(helpers.getInputGroup('retweet-cooldown', 'number', 'Retweet Abklingzeit (Stunden)', '', e.reward_cooldown, 'Abklingzeit, wie oft der Bot einen Benutzer für Retweets belohnen kann.'))))
            // Append third collapsible accordion.
            .append(helpers.getCollapsibleAccordion('main-3', 'Alarmeinstellungen', $('<form/>', {
                    'role': 'form'
                })
                // Add the toggle for the online Tweet.
                .append(helpers.getDropdownGroup('online-toggle', 'Online-Tweet aktivieren', (e.post_online === 'true' ? 'Ja' : 'Nein'), ['Ja', 'Nein'], 'Lass den Bot für dich twittern, wenn du live gehst.'))
                // Add the toggle for the game Tweet.
                .append(helpers.getDropdownGroup('game-toggle', 'Spielwechsel-Tweet aktivieren', (e.post_gamechange === 'true' ? 'Ja' : 'Nein'), ['Ja', 'Nein'], 'Lassen Sie den Bot für Sie twittern, wenn Sie das Spiel wechseln.'))
                // Add the toggle for the timed Tweet.
                .append(helpers.getDropdownGroup('timed-toggle', 'Zeitgesteuerten Online-Tweet aktivieren', (e.post_update === 'true' ? 'Ja' : 'Nein'), ['Ja', 'Nein'], 'Lass den Bot alle X Stunden für dich twittern und sagen, dass du noch live bist.'))
                // Add the the text area for online message
                .append(helpers.getTextAreaGroup('online-msg', 'text', 'Online-Tweet', '', e.message_online, 'Nachricht, die getwittert wird, wenn Sie live gehen. Tags: (title), (game) und (twitchurl)', false))
                // Add the the text area for online message
                .append(helpers.getTextAreaGroup('game-msg', 'text', 'Spielwechsel-Tweet', '', e.message_gamechange, 'Nachricht, die beim Spielwechsel getwittert wird. Tags: (title), (game) und (twitchurl)', false))
                // Add the the text area for online message
                .append(helpers.getTextAreaGroup('timed-msg', 'text', 'Zeitgesteuerter Online-Tweet', '', e.message_update, 'Nachricht, die von Zeit zu Zeit getwittert wird. Tags: (title), (game), (uptime) und (twitchurl)', false))
                // timed message minutes.
                .append(helpers.getInputGroup('timed-msg-time', 'number', 'Zeitgesteuertes Nachrichtenintervall (Minuten)', '', e.postdelay_update, 'Wie oft in Minuten soll die zeitgesteuerte Online-Nachricht gesendet werden? Das Minimum beträgt 180 Minuten.'))))),
            function() { // Callback once the user clicks save.
                let onlineToggle = $('#online-toggle').find(':selected').text() === 'Ja',
                    gameToggle = $('#game-toggle').find(':selected').text() === 'Ja',
                    timedToggle = $('#timed-toggle').find(':selected').text() === 'Ja',
                    onlineMsg = $('#online-msg'),
                    gameMsg = $('#game-msg'),
                    timedMsg = $('#timed-msg'),
                    timedTime = $('#timed-msg-time'),
                    mentionToggle = $('#poll-mentions').find(':selected').text() === 'Ja',
                    rtToggle = $('#poll-retweets').find(':selected').text() === 'Ja',
                    homeToggle = $('#poll-home').find(':selected').text() === 'Ja',
                    userToggle = $('#poll-user').find(':selected').text() === 'Ja',
                    mentionTime = $('#query-mentions'),
                    rtTime = $('#query-retweets'),
                    homeTime = $('#query-home'),
                    userTime = $('#query-user'),
                    rtRewardToggle = $('#retweet-toggle').find(':selected').text() === 'Ja',
                    rtRewardToggleMsg = $('#retweet-toggle-msg').find(':selected').text() === 'Ja',
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
                            toastr.success('Twitter-Alarmeinstellungen wurden erfolgreich aktualisiert!');
                        });
                }
            }).modal('toggle');
        });
    });
});