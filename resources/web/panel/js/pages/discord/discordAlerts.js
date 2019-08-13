/*
 * Copyright (c) 2019. - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Valentin Sickert <lapotor@lapotor.de>
 */

// Main function that gets all of our data.
$(function() {
	// Get all module toggles.
    socket.getDBValues('alerts_get_modules', {
        tables: ['modules', 'modules', 'modules', 'modules', 'modules', 'modules', 'modules', 'modules', 'modules', 'modules', 'modules', 'modules'],
        keys: ['./discord/handlers/followHandler.js', './discord/handlers/subscribeHandler.js', './discord/handlers/hostHandler.js',
        		'./discord/handlers/bitsHandler.js', './discord/handlers/clipHandler.js', './discord/systems/greetingsSystem.js', './discord/handlers/streamlabsHandler.js',
        		'./discord/handlers/raidHandler.js', './discord/handlers/tipeeeStreamHandler.js', './discord/handlers/streamElementsHandler.js',
        		'./discord/handlers/twitterHandler.js', './discord/handlers/streamHandler.js']
    }, true, function(e) {
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
$(function() {
	// Toggle for the alert modules.
    $('[data-alert-toggle]').on('change', function() {
        let name = $(this).attr('id'),
            checked = $(this).is(':checked');

        // Handle the module.
        socket.sendCommandSync('discord_alerts_module_toggle', 'module '
            + (checked ? 'enablesilent' : 'disablesilent') + ' ' + $(this).data('alert-toggle'), function() {
            name = name.replace('Toggle', 'Settings');
            // Toggle the settings button.
            $('#discord' + name.charAt(0).toUpperCase() + name.substring(1)).prop('disabled', !checked);
            // Alert the user.
            toastr.success('Das Alarmmodul wurde erfolgreich ' + (checked ? 'aktiviert' : 'deaktiviert') + '!');
        });
    });

    // Follower alert.
    $('#discordFollowHandlerSettings').on('click', function() {
        socket.getDBValues('discord_alerts_follow_get_settings', {
            tables: ['discordSettings', 'discordSettings', 'discordSettings'],
            keys: ['followToggle', 'followMessage', 'followChannel']
        }, true, function(e) {
            helpers.getModal('follow-alert', 'Follower Alarm-Einstellungen', 'Speichern', $('<form/>', {
                'role': 'form'
            })
            // Add the toggle for follow alerts.
            .append(helpers.getDropdownGroup('follow-toggle', 'Follow-Alerts aktivieren', (e.followToggle === 'true' ? 'Ja' : 'Nein'), ['Ja', 'Nein'],
                'Wenn eine Nachricht im Kanal gesendet werden soll, wenn jemand folgt.'))
            // Add the the text area for the follow message.
            .append(helpers.getTextAreaGroup('follow-message', 'text', 'Follow Nachricht', '', e.followMessage,
                'Die Nachricht wird gesendet, wenn jemand dem Kanal folgt. Tag: (name)', false))
            // Add the the box for the reward.
            .append(helpers.getInputGroup('follow-channel', 'text', 'Alarmkanal', '#alerts', e.followChannel,
                'Kanal, in dem auch alle Benachrichtigungen erfolgen sollen.')),
            function() { // Callback once the user clicks save.
                let followToggle = $('#follow-toggle').find(':selected').text() === 'Ja',
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
                        }, function() {
                            socket.wsEvent('discord', './discord/handlers/followHandler.js', '', [], function() {
                                // Close the modal.
                                $('#follow-alert').modal('toggle');
                                // Alert the user.
                                toastr.success('Folgealarm-Einstellungen wurden erfolgreich aktualisiert!');
                            });
                        });
                }
            }).modal('toggle');
        });
    });

    // Subscriber alerts.
    $('#discordSubscribeHandlerSettings').on('click', function() {
        socket.getDBValues('discord_alerts_subscribe_get_settings', {
            tables: ['discordSettings', 'discordSettings', 'discordSettings', 'discordSettings', 'discordSettings', 'discordSettings', 'discordSettings', 'discordSettings', 'discordSettings'],
            keys: ['subMessage', 'primeMessage', 'resubToggle', 'giftsubMessage', 'subToggle', 'primeToggle', 'resubMessage', 'giftsubToggle', 'subChannel']
        }, true, function(e) {
            helpers.getModal('subscribe-alert', 'Abonnent Alarm-Einstellungen', 'Speichern', $('<form/>', {
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
                .append(helpers.getDropdownGroup('sub-toggle', 'Abonnement-Alarme aktivieren', (e.subToggle === 'true' ? 'Ja' : 'Nein'), ['Ja', 'Nein'],
                    'Wenn eine Nachricht in einem Kanal gesendet werden soll, wenn dich jemand abonniert.'))
                // Append message box for the message
                .append(helpers.getTextAreaGroup('sub-msg', 'text', 'Abonnementnachricht', '', e.subMessage,
                    'Die Nachricht wird gesendet, wenn dich jemand abonniert. Tags: (name) und (plan)', false))))
            // Append second collapsible accordion.
            .append(helpers.getCollapsibleAccordion('main-2', 'Prime Abonnement-Einstellungen',  $('<form/>', {
                    'role': 'form'
                })
                // Add toggle for prime subscriptions.
                .append(helpers.getDropdownGroup('primesub-toggle', 'Prime Abonnement Alarme aktivieren', (e.primeToggle === 'true' ? 'Ja' : 'Nein'), ['Ja', 'Nein'],
                    'Wenn eine Nachricht im Kanal gesendet werden soll, wenn dich jemand über Twitch Prime abonniert.'))
                // Append message box for the message
                .append(helpers.getTextAreaGroup('primesub-msg', 'text', 'Prime Abonnement Nachricht', '', e.primeMessage,
                    'Die Nachricht wird gesendet, wenn jemand den Kanal über Twitch Prime abonniert. Tags: (name) und (plan)', false))))
            // Append third collapsible accordion.
            .append(helpers.getCollapsibleAccordion('main-3', 'Re-Abo Einstellungen', $('<form/>', {
                    'role': 'form'
                })
                // Add toggle for resubscriptions.
                .append(helpers.getDropdownGroup('resub-toggle', 'Re-Abo Alarme aktivieren', (e.resubToggle === 'true' ? 'Ja' : 'Nein'), ['Ja', 'Nein'],
                    'Wenn eine Nachricht im Kanal gesendet werden soll, wenn dich jemand erneut abonniert.'))
                // Append message box for the message
                .append(helpers.getTextAreaGroup('resub-msg', 'text', 'Re-Abo Nachricht', '', e.resubMessage,
                    'Die Nachricht wird gesendet, wenn dich jemand erneut abonniert. Tags: (name), (plan) und (months)', false))))
            // Append forth collapsible accordion.
            .append(helpers.getCollapsibleAccordion('main-4', 'Geschenk-Abonnement Einstellungen', $('<form/>', {
                    'role': 'form'
                })
                // Add toggle for gifted subscriptions.
                .append(helpers.getDropdownGroup('gifsub-toggle', 'Geschenk-Abonnement-Alarme aktivieren', (e.giftsubToggle === 'true' ? 'Ja' : 'Nein'), ['Ja', 'Nein'],
                    'Wenn eine Nachricht im Kanal gesendet werden soll, wenn jemand ein Abonnement verschenkt. Dadurch wird auch die Belohnung umgeschaltet.'))
                // Append message box for the message
                .append(helpers.getTextAreaGroup('gifsub-msg', 'text', 'Geschenk-Abonnement Nachricht', '', e.giftsubMessage,
                    'Die Nachricht wird gesendet, wenn jemand ein Abonnement für den Kanal verschenkt. Tags: (name), (recipient), (plan) und (months)', false))))
            // Append fifth collapsible accordion.
            .append(helpers.getCollapsibleAccordion('main-5', 'Einstellungen des Alarmkanals', $('<form/>', {
                    'role': 'form'
                })
                // Add channel box.
                .append(helpers.getInputGroup('channel-alert', 'text', 'Alarmkanal', '#alerts', e.subChannel,
                    'Kanal, in dem alle Alarme gesendet werden sollen.'))))),
            function() { // Callback once the user clicks save.
                let subToggle = $('#sub-toggle').find(':selected').text() === 'Ja',
                    subMsg = $('#sub-msg'),
                    primeSubToggle = $('#primesub-toggle').find(':selected').text() === 'Ja',
                    primeSubMsg = $('#primesub-msg'),
                    reSubToggle = $('#resub-toggle').find(':selected').text() === 'Ja',
                    reSubMsg = $('#resub-msg'),
                    gifSubToggle = $('#gifsub-toggle').find(':selected').text() === 'Ja',
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
                        }, function() {
                            socket.wsEvent('discord', './discord/handlers/subscribeHandler.js', '', [], function() {
                                // Close the modal.
                                $('#subscribe-alert').modal('toggle');
                                // Alert the user.
                                toastr.success('Abonnementalarmeinstellungen wurden erfolgreich aktualisiert!');
                            });
                        });
                }
            }).modal('toggle');
        });
    });

    // Host settings button.
    $('#discordHostHandlerSettings').on('click', function() {
        socket.getDBValues('alerts_get_host_settings', {
            tables: ['discordSettings', 'discordSettings', 'discordSettings', 'discordSettings'],
            keys: ['hostToggle', 'hostMessage', 'autohostMessage', 'hostChannel']
        }, true, function(e) {
            helpers.getModal('host-alert', 'Host-Alarmeinstellungen', 'Speichern', $('<form/>', {
                'role': 'form'
            })
            // Add the div for the col boxes.
            .append($('<div/>', {
                'class': 'panel-group',
                'id': 'accordion'
            })
            // Add the toggle for host alerts.
            .append(helpers.getDropdownGroup('host-toggle', 'Host-Alarme aktivieren', (e.hostToggle === 'true' ? 'Ja' : 'Nein'), ['Ja', 'Nein'],
                'Wenn eine Nachricht im Kanal gesendet werden soll, wenn jemand den Kanal hostet.'))
            // Add the the text area for the host message.
            .append(helpers.getTextAreaGroup('host-message', 'text', 'Host Nachricht', '', e.hostMessage,
                'Die Nachricht wird gesendet, wenn jemand den Kanal hostet. Tag: (name) und (viewers)', false))
            // Add the the text area for the auto host message.
            .append(helpers.getTextAreaGroup('auto-host-message', 'text', 'Auto-Host-Nachricht', '', e.autohostMessage,
                'Die Nachricht wird gesendet, wenn jemand den Kanal automatisch hostet. Tag: (name) und (viewers)', false))
            // Add the the box for the reward.
            .append(helpers.getInputGroup('host-channel', 'text', 'Alarmkanal', '#alerts', e.hostChannel,
                'Kanal, in dem alle Benachrichtigungen angezeigt werden sollen.'))),
            function() { // Callback once the user clicks save.
                let hostToggle = $('#host-toggle').find(':selected').text() === 'Ja',
                    hostMsg = $('#host-message'),
                    autoHostMsg = $('#auto-host-message'),
                    hostChannel = $('#host-channel');

                // Make sure the user has someone in each box.
                switch (false) {
                    case helpers.handleInputString(hostMsg):
                    case helpers.handleInputString(autoHostMsg):
                        break;
                    default:
                        socket.updateDBValues('alerts_update_host_settings', {
                            tables: ['discordSettings', 'discordSettings', 'discordSettings', 'discordSettings'],
                            keys: ['hostToggle', 'hostMessage', 'autohostMessage', 'hostChannel'],
                            values: [hostToggle, hostMsg.val(), autoHostMsg.val(), hostChannel.val()]
                        }, function() {
                            socket.wsEvent('discord', './discord/handlers/hostHandler.js', '', [], function() {
                                // Close the modal.
                                $('#host-alert').modal('toggle');
                                // Alert the user.
                                toastr.success('Host-Alarmeinstellungen wurden erfolgreich aktualisiert!');
                            });
                        });
                }

            }).modal('toggle');
        });
    });

    // Bits settings.
    $('#discordBitsHandlerSettings').on('click', function() {
    	socket.getDBValues('discord_alerts_get_bits_settings', {
            tables: ['discordSettings', 'discordSettings', 'discordSettings'],
            keys: ['bitsToggle', 'bitsMessage', 'bitsChannel']
        }, true, function(e) {
            helpers.getModal('bits-alert', 'Bits Alarm-Einstellungen', 'Speichern', $('<form/>', {
                'role': 'form'
            })
            // Add the toggle for bits alerts.
            .append(helpers.getDropdownGroup('bits-toggle', 'Bits-Alarme aktivieren', (e.bitsToggle === 'true' ? 'Ja' : 'Nein'), ['Ja', 'Nein'],
                'Wenn eine Nachricht im Channel gesendet werden soll, wenn jemand cheert.'))
            // Add the the text area for the bits message.
            .append(helpers.getTextAreaGroup('bits-message', 'text', 'Bits Nachricht', '', e.bitsMessage,
                'Die Nachricht wird gesendet, wenn jemand im Kanal cheert. Tags: (name), (message) und (amount)', false))
            // Add the box for the reward.
            .append(helpers.getInputGroup('bits-channel', 'text', 'Alarmkanal', '#alerts', e.bitsChannel,
             	'Der Kanal, in dem die Bit-Nachricht gesendet wird.')),
            function() { // Callback once the user clicks save.
                let bitsToggle = $('#bits-toggle').find(':selected').text() === 'Ja',
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
                        }, function() {
                            socket.wsEvent('discord', './discord/handlers/bitsHandler.js', '', [], function() {
                                // Close the modal.
                                $('#bits-alert').modal('toggle');
                                // Alert the user.
                                toastr.success('Bits Alarm-Einstellungen wurden erfolgreich aktualisiert!');
                            });
                        });
                }
            }).modal('toggle');
        });
    });

    // Clips handler.
    $('#discordClipHandlerSettings').on('click', function() {
    	socket.getDBValues('alerts_get_clip_settings', {
            tables: ['discordSettings', 'discordSettings', 'discordSettings'],
            keys: ['clipsToggle', 'clipsMessage', 'clipsChannel']
        }, true, function(e) {
            helpers.getModal('clip-alert', 'Clip-Alarmeinstellungen', 'Speichern', $('<form/>', {
                'role': 'form'
            })
            // Add the toggle for clip alerts.
            .append(helpers.getDropdownGroup('clip-toggle', 'Clip-Alarme aktivieren', (e.clipsToggle === 'true' ? 'Ja' : 'Nein'), ['Ja', 'Nein'],
                'Wenn eine Nachricht im Channel gesendet werden soll, wenn jemand einen Clip erstellt.'))
            // Add the text area for the clips message.
            .append(helpers.getTextAreaGroup('clip-message', 'text', 'Clip Nachricht', '', e.clipsMessage,
                'Die Nachricht wird gesendet, wenn jemand einen Clip erstellt. Tags: (Name), (embedurl) - wird als gesamte Nachricht verwendet, und (url)', false))
            // Add the text area for the clips channel.
            .append(helpers.getInputGroup('clip-channel', 'text', 'Alarm Channel', '#alerts', e.clipsChannel,
                'Der Kanal, in dem die Clips gepostet werden.')),
            function() { // Callback once the user clicks save.
                let clipToggle = $('#clip-toggle').find(':selected').text() === 'Ja',
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
                        }, function() {
                            socket.wsEvent('discord', './discord/handlers/clipHandler.js', '', [], function() {
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

    // Stream Alert settings.
    $('#discordStreamHandlerSettings').on('click', function() {
        socket.getDBValues('alerts_get_stream_settings', {
            tables: ['discordSettings', 'discordSettings', 'discordSettings', 'discordSettings',
                    'discordSettings', 'discordSettings', 'discordSettings', 'discordSettings'],
            keys: ['onlineToggle', 'onlineMessage', 'offlineToggle', 'offlineMessage', 'gameToggle',
                'gameMessage', 'botGameToggle', 'onlineChannel']
        }, true, function(e) {
            helpers.getModal('stream-alert', 'Stream-Alarmeinstellungen', 'Speichern', $('<form/>', {
                'role': 'form'
            })
            // Add the div for the col boxes.
            .append($('<div/>', {
                'class': 'panel-group',
                'id': 'accordion'
            })
            // Append first collapsible accordion.
            .append(helpers.getCollapsibleAccordion('main-1', 'Online-Einstellungen', $('<form/>', {
                    'role': 'form'
                })
            	// Add the toggle for onine alerts.
            	.append(helpers.getDropdownGroup('online-toggle', 'Online-Alarme aktivieren', (e.onlineToggle === 'true' ? 'Ja' : 'Nein'), ['Ja', 'Nein'],
                	'If a message should be said in the channel when you go live on Twitch.'))
            	// Add the toggle for one alerts.
            	.append(helpers.getDropdownGroup('online-status', 'Bot-Status aktivieren', (e.botGameToggle === 'true' ? 'Ja' : 'Nein'), ['Ja', 'Nein'],
                	'Wenn Sie live gehen, zeigen Sie Ihren Bot als Streaming.'))
            	// Add the text area for the online message.
            	.append(helpers.getTextAreaGroup('online-message', 'text', 'Online Nachricht', '', e.onlineMessage,
                	'Die Nachricht wird gesendet, wenn Sie live gehen. Diese Nachricht ist in einem Embed-Stil. Tags: (name)', false))))
            // Append second collapsible accordion.
            .append(helpers.getCollapsibleAccordion('main-2', 'Offline-Einstellungen', $('<form/>', {
                    'role': 'form'
                })
            	// Add the toggle for offline alerts.
            	.append(helpers.getDropdownGroup('offline-toggle', 'Offline-Alarme aktivieren', (e.offlineToggle === 'true' ? 'Ja' : 'Nein'), ['Ja', 'Nein'],
                	'Wenn eine Nachricht im Channel gesendet werden soll, wenn Sie offline gehen, auf Twitch.'))
            	// Add the text area for the offline message.
            	.append(helpers.getTextAreaGroup('offline-message', 'text', 'Offline Nachricht', '', e.offlineMessage,
                	'Die Nachricht wird gesendet, wenn Sie offline gehen. Diese Nachricht ist in einem Embed-Stil. Tags: (name)', false))))
            // Append third collapsible accordion.
            .append(helpers.getCollapsibleAccordion('main-3', 'Spielwechsel-Einstellungen', $('<form/>', {
                    'role': 'form'
                })
            	// Add the toggle for offline alerts.
            	.append(helpers.getDropdownGroup('game-toggle', 'Spieländerungsalarme aktivieren', (e.gameToggle === 'true' ? 'Ja' : 'Nein'), ['Ja', 'Nein'],
                	'Wenn eine Nachricht im Channel gesendet werden soll, wenn Sie das Spiel auf Twitch wechseln.'))
            	// Add the text area for the offline message.
            	.append(helpers.getTextAreaGroup('game-message', 'text', 'Spielwechsel Nachricht', '', e.gameMessage,
                	'Die Nachricht wird gesendet, wenn Sie das Spiel auf Twitch wechseln. Tags: (name)', false))))
            // Append forth collapsible accordion.
            .append(helpers.getCollapsibleAccordion('main-4', 'Alarmkanal-Einstellungen', $('<form/>', {
                    'role': 'form'
                })
                // Add channel box.
                .append(helpers.getInputGroup('channel-alert', 'text', 'Alarm Kanal', '#alerts', e.onlineChannel,
                    'Kanal, in dem alle Alarme gesendet werden sollen.'))))),
            function() {
            	let onlineToggle = $('#online-toggle').find(':selected').text() === 'Ja',
            		statusToggle = $('#online-status').find(':selected').text() === 'Ja',
            		onlineMessage = $('#online-message'),
            		offlineToggle = $('#offline-toggle').find(':selected').text() === 'Ja',
            		offlineMessage = $('#offline-message'),
            		gameToggle = $('#game-toggle').find(':selected').text() === 'Ja',
            		gameMessage = $('#game-message'),
            		channel = $('#channel-alert');

            	switch (false) {
            		case helpers.handleInputString(onlineMessage):
            		case helpers.handleInputString(offlineMessage):
            		case helpers.handleInputString(gameMessage):
            			break;
            		default:
            			socket.updateDBValues('discord_stream_alerts_updater', {
            				tables: ['discordSettings', 'discordSettings', 'discordSettings', 'discordSettings',
                    				'discordSettings', 'discordSettings', 'discordSettings', 'discordSettings'],
            				keys: ['onlineToggle', 'onlineMessage', 'offlineToggle', 'offlineMessage', 'gameToggle',
                				'gameMessage', 'botGameToggle', 'onlineChannel'],
            				values: [onlineToggle, onlineMessage.val(), offlineToggle, offlineMessage.val(),
            						gameToggle, gameMessage.val(), statusToggle, channel.val()]
            			}, function() {
            				socket.wsEvent('discord', './discord/handlers/streamHandler.js', '', [], function() {
                                // Close the modal.
                                $('#stream-alert').modal('toggle');
                                // Alert the user.
                                toastr.success('Stream-Alarmeinstellungen wurden erfolgreich aktualisiert!');
                            });
            			});
            	}
            }).modal('toggle');
        });
    });

	// Greetings alerts.
	$('#discordGreetingsSystemSettings').on('click', function() {
        socket.getDBValues('alerts_get_greetings_settings', {
            tables: ['discordSettings', 'discordSettings', 'discordSettings', 'discordSettings',
                    'discordSettings', 'discordSettings'],
            keys: ['joinToggle', 'partToggle', 'joinMessage', 'partMessage', 'greetingsChannel',
                'greetingsDefaultGroup']
        }, true, function(e) {
            helpers.getModal('greeting-alert', 'Einstellungen für Begrüßungen', 'Speichern', $('<form/>', {
                'role': 'form'
            })
            // Add the div for the col boxes.
            .append($('<div/>', {
                'class': 'panel-group',
                'id': 'accordion'
            })
            // Append first collapsible accordion.
            .append(helpers.getCollapsibleAccordion('main-1', 'Beitrittseinstellungen', $('<form/>', {
                    'role': 'form'
                })
                // Add the toggle for alert
                .append(helpers.getDropdownGroup('join-toggle', 'Beitrittsnachrichten aktivieren\n', (e.joinToggle === 'true' ? 'Ja' : 'Nein'), ['Ja', 'Nein'],
                    'Wenn eine Nachricht im Channel gesendet werden soll, wenn jemand deinem Discord beitritt.'))
                // Add a box for the join role.
                .append(helpers.getInputGroup('join-role', 'text', 'Beitrittsrolle', 'Newbie', e.greetingsDefaultGroup,
                    'Die Standardrolle wird neuen Benutzern zugewiesen, die deinem Discord beitreten.'))
                // Add the text area for the message.
                .append(helpers.getTextAreaGroup('join-message', 'text', 'Beitrittsnachricht', '', e.joinMessage,
                    'Die Nachricht wird gesendet, wenn jemand deinem Discord beitritt. Tags: (name) und (@name)', false))))
            // Append second collapsible accordion.
            .append(helpers.getCollapsibleAccordion('main-2', 'Verlassen-Einstellungen', $('<form/>', {
                    'role': 'form'
                })
                // Add the toggle for part alerts.
                .append(helpers.getDropdownGroup('part-toggle', 'Verlassen-Nachrichten aktivieren', (e.partToggle === 'true' ? 'Ja' : 'Nein'), ['Ja', 'Nein'],
                    'Wenn eine Nachricht in den Kanal gesendet werden soll, wenn jemand deine Discord verlässt.'))
                // Add the text area for the part message.
                .append(helpers.getTextAreaGroup('part-message', 'text', 'Verlassen-Nachricht', '', e.partMessage,
                    'Die Nachricht wird gesendet, wenn jemand deinen Discord verlässt. Tags: (name) und (@name)', false))))
            // Append third collapsible accordion.
            .append(helpers.getCollapsibleAccordion('main-3', 'Alarmkanal-Einstellungen', $('<form/>', {
                    'role': 'form'
                })
                // Add channel box.
                .append(helpers.getInputGroup('channel-alert', 'text', 'Alarmkanal', '#alerts', e.greetingsChannel,
                    'Kanal, in den alle Alarme gesendet werden sollen.'))))),
            function() {
                let joinToggle = $('#join-toggle').find(':selected').text() === 'Ja',
                    partToggle = $('#part-toggle').find(':selected').text() === 'Ja',
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
                        }, function() {
                            socket.wsEvent('discord', './discord/systems/greetingsSystem.js', '', [], function() {
                                // Close the modal.
                                $('#greeting-alert').modal('toggle');
                                // Alert the user.
                                toastr.success('Alarm-Einstellungen für Begrüßungen erfolgreich aktualisiert!');
                            });
                        });
                }
            }).modal('toggle');
        });
	});

    // StreamLabs settings.
    $('#discordStreamlabsHandlerSettings').on('click', function() {
        socket.getDBValues('discord_alerts_streamlabs_get_settings', {
            tables: ['discordSettings', 'discordSettings', 'discordSettings'],
            keys: ['streamlabsToggle', 'streamlabsMessage', 'streamlabsChannel']
        }, true, function(e) {
            helpers.getModal('streamlabs-alert', 'StreamLabs Alarmeinstellungen', 'Speichern', $('<form/>', {
                'role': 'form'
            })
            // Add the toggle for follow alerts.
            .append(helpers.getDropdownGroup('streamlabs-toggle', 'StreamLabs-Alarme aktivieren', (e.streamlabsToggle === 'true' ? 'Ja' : 'Nein'), ['Ja', 'Nein'],
                'Wenn eine Nachricht in den Kanal gesendet werden soll, wenn jemand spendet.'))
            // Add the the text area for the follow message.
            .append(helpers.getTextAreaGroup('streamlabs-message', 'text', 'Spendennachricht', '', e.streamlabsMessage,
                'Die Nachricht wird gesendet, wenn jemand dem Kanal spendet. Tag: (name), (amount), (currency) und (message)', false))
            // Add the the box for the reward.
            .append(helpers.getInputGroup('streamlabs-channel', 'text', 'Alarmkanal', '#alerts', e.streamlabsChannel,
                'Kanal, in den alle Alarme gesendet werden sollen.')),
            function() { // Callback once the user clicks save.
                let streamLabsToggle = $('#streamlabs-toggle').find(':selected').text() === 'Ja',
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
                        }, function() {
                            socket.wsEvent('discord', './discord/handlers/streamlabsHandler.js', '', [], function() {
                                // Close the modal.
                                $('#streamlabs-alert').modal('toggle');
                                // Alert the user.
                                toastr.success('StreamLabs Alarmeinstellungen erfolgreich aktualisiert!');
                            });
                        });
                }
            }).modal('toggle');
        });
    });

    // TipeeeStream settings.
    $('#discordTipeeeStreamHandlerSettings').on('click', function() {
        socket.getDBValues('discord_alerts_tipeeestream_get_settings', {
            tables: ['discordSettings', 'discordSettings', 'discordSettings'],
            keys: ['tipeeestreamToggle', 'tipeeestreamMessage', 'tipeeestreamChannel']
        }, true, function(e) {
            helpers.getModal('tipeeestream-alert', 'TipeeeStream Alarm-Einstellungen', 'Speichern', $('<form/>', {
                'role': 'form'
            })
            // Add the toggle for follow alerts.
            .append(helpers.getDropdownGroup('tipeeestream-toggle', 'TipeeeStream-Alarme aktivieren', (e.tipeeestreamToggle === 'true' ? 'Ja' : 'Nein'), ['Ja', 'Nein'],
                'Wenn eine Nachricht in den Kanal gesendet werden soll, wenn jemand spendet.'))
            // Add the the text area for the follow message.
            .append(helpers.getTextAreaGroup('tipeeestream-message', 'text', 'Spendennachricht', '', e.tipeeestreamMessage,
                'Die Nachricht wird gesendet, wenn jemand dem Kanal spendet. Tag: (name), (amount), (currency) und (message)', false))
            // Add the the box for the reward.
            .append(helpers.getInputGroup('tipeeestream-channel', 'text', 'Alarmkanal', '#alerts', e.tipeeestreamChannel,
                'Kanal, in den alle Alarme gesendet werden sollen.')),
            function() { // Callback once the user clicks save.
                let tipeeeStreamToggle = $('#tipeeestream-toggle').find(':selected').text() === 'Ja',
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
                        }, function() {
                            socket.wsEvent('discord', './discord/handlers/tipeeeStreamHandler.js', '', [], function() {
                                // Close the modal.
                                $('#tipeeestream-alert').modal('toggle');
                                // Alert the user.
                                toastr.success('TipeeeStream-Alarmeinstellungen erfolgreich aktualisiert!');
                            });
                        });
                }
            }).modal('toggle');
        });
    });

    // StreamElements settings.
    $('#discordStreamElementsHandlerSettings').on('click', function() {
        socket.getDBValues('discord_alerts_streamelements_get_settings', {
            tables: ['discordSettings', 'discordSettings', 'discordSettings'],
            keys: ['streamelementsToggle', 'streamelementsMessage', 'streamelementsChannel']
        }, true, function(e) {
            helpers.getModal('streamelements-alert', 'StreamElements Alarm-Einstellungen', 'Speichern', $('<form/>', {
                'role': 'form'
            })
            // Add the toggle for follow alerts.
            .append(helpers.getDropdownGroup('streamelements-toggle', 'StreamElements-Alarme aktivieren', (e.streamelementsToggle === 'true' ? 'Ja' : 'Nein'), ['Ja', 'Nein'],
                'Wenn eine Nachricht in den Kanal gesendet werden soll, wenn jemand spendet.'))
            // Add the the text area for the follow message.
            .append(helpers.getTextAreaGroup('streamelements-message', 'text', 'Spendennachricht', '', e.streamelementsMessage,
                'Die Nachricht wird gesendet, wenn jemand dem Kanal einen spendet. Tag: (name), (amount), (currency) und (message)', false))
            // Add the the box for the reward.
            .append(helpers.getInputGroup('streamelements-channel', 'text', 'Alarmkanal', '#alerts', e.streamelementsChannel,
                'Kanal, in den alle Alarme gesendet werden sollen.')),
            function() { // Callback once the user clicks save.
                let streamElementsToggle = $('#streamelements-toggle').find(':selected').text() === 'Ja',
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
                        }, function() {
                            socket.wsEvent('discord', './discord/handlers/streamElementsHandler.js', '', [], function() {
                                // Close the modal.
                                $('#streamelements-alert').modal('toggle');
                                // Alert the user.
                                toastr.success('StreamElements-Alarmeinstellungen erfolgreich aktualisiert!');
                            });
                        });
                }
            }).modal('toggle');
        });
    });

    // Twitter settings.
    $('#discordTwitterHandlerSettings').on('click', function() {
        socket.getDBValues('discord_alerts_twitter_get_settings', {
            tables: ['discordSettings', 'discordSettings'],
            keys: ['twitterToggle', 'twitterChannel']
        }, true, function(e) {
            helpers.getModal('twitter-alert', 'Twitter Alarm-Einstellungen', 'Speichern', $('<form/>', {
                'role': 'form'
            })
            // Add the toggle for follow alerts.
            .append(helpers.getDropdownGroup('twitter-toggle', 'Twitter-Alarme aktivieren', (e.twitterToggle === 'true' ? 'Ja' : 'Nein'), ['Ja', 'Nein'],
                'Wenn deine Tweets in Discord gepostet werden sollen. Bitte beachte, dass das Twitch Twitter-Modul eingerichtet sein muss, damit dies funktioniert.'))
            // Add the the box for the reward.
            .append(helpers.getInputGroup('twitter-channel', 'text', 'Alarmkanal', '#alerts', e.twitterChannel,
                'Kanal, in den alle Alarme gesendet werden sollen.')),
            function() { // Callback once the user clicks save.
                let twitterToggle = $('#twitter-toggle').find(':selected').text() === 'Ja',
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
                        }, function() {
                            socket.wsEvent('discord', './discord/handlers/twitterHandler.js', '', [], function() {
                                // Close the modal.
                                $('#twitter-alert').modal('toggle');
                                // Alert the user.
                                toastr.success('Twitter-Alarmeinstellungen erfolgreich aktualisiert!');
                            });
                        });
                }
            }).modal('toggle');
        });
    });
});
