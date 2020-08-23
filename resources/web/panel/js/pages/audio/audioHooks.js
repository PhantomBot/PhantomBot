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
$(run = function() {
    // Check if the module is enabled.
    socket.getDBValue('audio_module', 'modules', './systems/audioPanelSystem.js', function(e) {
        // If the module is off, don't load any data.
        if (!helpers.handleModuleLoadUp('audioHookModule', e.modules)) {
            // Disable the tab selection.
            $('#audiohooks_t, #audiocommands_t').addClass('disabled').parent().addClass('disabled');
            return;
        } else {
            // Enable the tab selection.
            $('#audiohooks_t, #audiocommands_t').removeClass('disabled').parent().removeClass('disabled');
        }

        // Get all audio hooks.
        socket.getDBTableValues('get_audio_hooks', 'audio_hooks', function(results) {
            let tableData = [];

            for (let i = 0; i < results.length; i++) {
                tableData.push([
                    results[i].key,
                    $('<div/>', {
                        'class': 'btn-group'
                    }).append($('<button/>', {
                        'type': 'button',
                        'class': 'btn btn-xs btn-danger',
                        'style': 'float: right',
                        'data-audio': results[i].key,
                        'html': $('<i/>', {
                            'class': 'fa fa-trash'
                        })
                    })).append($('<button/>', {
                        'type': 'button',
                        'class': 'btn btn-xs btn-success',
                        'style': 'float: right',
                        'data-toggle': 'tooltip',
                        'title': 'Dadurch werden die Audio-Hooks über das Panel und nicht über die Browserquelle wiedergegeben.',
                        'data-audio': results[i].value,
                        'html': $('<i/>', {
                            'class': 'fa fa-play'
                        })
                    })).html()
                ]);
            }

            // if the table exists, destroy it.
            if ($.fn.DataTable.isDataTable('#audioHooksTable')) {
                $('#audioHooksTable').DataTable().destroy();
                // Remove all of the old events.
                $('#audioHooksTable').off();
            }

            // Create table.
            let table = $('#audioHooksTable').DataTable({
                'searching': true,
                "language": {
                    "url": "//cdn.datatables.net/plug-ins/1.10.19/i18n/German.json"
                },
                'autoWidth': false,
                'lengthChange': false,
                'data': tableData,
                'columnDefs': [
                    { 'className': 'default-table', 'orderable': false, 'targets': 1 }
                ],
                'columns': [
                    { 'title': 'Audio Hook' },
                    { 'title': 'Actions' }
                ]
            });

            // On play button.
            table.on('click', '.btn-success', function() {
                let audioHook = $(this).data('audio'),
                    soundPath = '/config/audio-hooks/';

                // Load the audio.
                let audio = new Audio(soundPath + audioHook);
                // Set the volume.
                audio.volume = '0.8';
                // Add event handler.
                $(audio).on('ended', function() {
                    audio.currentTime = 0;
                });

                // Play it!
                audio.play();
            });

            // On delete button.
            table.on('click', '.btn-danger', function() {
                let audioHookName = $(this).data('audio'),
                    row = $(this).parents('tr');

                // Ask the user if he wants to delete the audio hook.
                helpers.getConfirmDeleteModal('audio_modal_remove', 'Bist du sicher, dass du die Audio-Hook "' + audioHookName + '" entfernen willst?', true,
                    'Die Audio-Hook "' + audioHookName + '" wurde erfolgreich entfernt!', function() { // Callback if the user clicks delete.
                    socket.sendCommand('audio_hook_rm_cmd', 'panelremoveaudiohook ' + audioHookName, function() {
                        // Remove the table row.
                        table.row(row).remove().draw(false);
                    });
                });
            });
        });

        // Get audio commands.
        socket.getDBTableValues('audio_hooks_get_cmds', 'audioCommands', function(results) {
            let tableData = [];

            for (let i = 0; i < results.length; i++) {
                tableData.push([
                    '!' + results[i].key,
                    results[i].value,
                    $('<div/>', {
                        'class': 'btn-group'
                    }).append($('<button/>', {
                        'type': 'button',
                        'class': 'btn btn-xs btn-danger',
                        'style': 'float: right',
                        'data-command': results[i].key,
                        'html': $('<i/>', {
                            'class': 'fa fa-trash'
                        })
                    })).append($('<button/>', {
                        'type': 'button',
                        'class': 'btn btn-xs btn-warning',
                        'style': 'float: right',
                        'data-command': results[i].key,
                        'html': $('<i/>', {
                            'class': 'fa fa-edit'
                        })
                    })).html()
                ]);
            }

            // if the table exists, destroy it.
            if ($.fn.DataTable.isDataTable('#audioHookCommandsTable')) {
                $('#audioHookCommandsTable').DataTable().destroy();
                // Remove all of the old events.
                $('#audioHookCommandsTable').off();
            }

            // Create table.
            let table = $('#audioHookCommandsTable').DataTable({
                'searching': true,
                "language": {
                    "url": "//cdn.datatables.net/plug-ins/1.10.19/i18n/German.json"
                },
                'autoWidth': false,
                'lengthChange': false,
                'data': tableData,
                'columnDefs': [
                    { 'className': 'default-table', 'orderable': false, 'targets': 2 },
                    { 'width': '45%', 'targets': 0 }
                ],
                'columns': [
                    { 'title': 'Command' },
                    { 'title': 'Audio Hook' },
                    { 'title': 'Actions' }
                ]
            });

            // On delete button.
            table.on('click', '.btn-danger', function() {
                let command = $(this).data('command'),
                    row = $(this).parents('tr');

                // Ask the user if he want to remove the command.
                helpers.getConfirmDeleteModal('rm_audio_command_cmd_modal', 'Bist du sicher, dass du den Befehl !' + command + ' entfernen willst?', true,
                    'Der Befehl !' + command + ' wurde erfolgreich entfernt!', function() {
                    socket.removeDBValue('rm_audio_command', 'audioCommands', command, function() {
                        socket.sendCommand('rm_audio_command_cmd', 'panelloadaudiohookcmds ' + command, function() {
                            // Remove the table row.
                            table.row(row).remove().draw(false);
                        });
                    });
                });
            });

            // On edit button.
            table.on('click', '.btn-warning', function() {
                let command = $(this).data('command'),
                    t = $(this);

                // Get all the info about the command.
                socket.getDBValues('audio_command_edit', {
                    tables: ['audioCommands', 'permcom', 'cooldown', 'pricecom', 'paycom'],
                    keys: [command, command, command, command, command]
                }, function(e) {
                    let cooldownJson = (e.cooldown === null ? { isGlobal: 'true', seconds: 0 } : JSON.parse(e.cooldown));

                    // Get advance modal from our util functions in /utils/helpers.js
                    helpers.getAdvanceModal('edit-audio-command', 'Audiobefehl bearbeiten', 'Speichern', $('<form/>', {
                        'role': 'form'
                    })
                    // Append input box for the command name. This one is disabled.
                    .append(helpers.getInputGroup('command-name', 'text', 'Befehl', '', '!' + command, 'Name des Befehls. Dieser kann nicht bearbeitet werden.', true))
                    // Append input box for the command audio. This one is disabled.
                    .append(helpers.getInputGroup('command-audio', 'text', 'Audio Hook', '', e.audioCommands, 'Audio der abgespielt werden soll. Dieser kann nicht bearbeitet werden.', true))
                    // Append a select option for the command permission.
                    .append(helpers.getDropdownGroup('command-permission', 'User Level', helpers.getGroupNameById(e.permcom),
                        ['Caster', 'Administrators', 'Moderators', 'Subscribers', 'Donators', 'VIPs', 'Regulars', 'Viewers']))
                    // Add an advance section that can be opened with a button toggle.
                    .append($('<div/>', {
                        'class': 'collapse',
                        'id': 'advance-collapse',
                        'html': $('<form/>', {
                                'role': 'form'
                            })
                            // Append input box for the command cost.
                            .append(helpers.getInputGroup('command-cost', 'number', 'Kosten', '0', helpers.getDefaultIfNullOrUndefined(e.pricecom, '0'),
                                'Kosten in Punkten, die dem Benutzer bei der Ausführung des Befehls abgezogen werden.'))
                            // Append input box for the command reward.
                            .append(helpers.getInputGroup('command-reward', 'number', 'Belohnung', '0', helpers.getDefaultIfNullOrUndefined(e.paycom, '0'),
                                'Belohnung in Punkten, die der Benutzer beim Ausführen des Befehls erhalten soll.'))
                            // Append input box for the command cooldown.
                            .append(helpers.getInputGroup('command-cooldown', 'number', 'Abklingzeit (Sekunden)', '5', cooldownJson.seconds,
                                'Abklingzeit des Befehls in Sekunden.')
                                // Append checkbox for if the cooldown is global or per-user.
                                .append(helpers.getCheckBox('command-cooldown-global', cooldownJson.isGlobal === 'true', 'Global',
                                    'Wenn diese Option aktiviert ist, wird die Abklingzeit auf alle im Kanal angewendet. Wenn diese Option nicht aktiviert ist, wird die Abklingzeit pro Benutzer angewendet.')))
                    })), function() {
                        let commandPermission = $('#command-permission'),
                            commandCost = $('#command-cost'),
                            commandReward = $('#command-reward'),
                            commandCooldown = $('#command-cooldown'),
                            commandCooldownGlobal = $('#command-cooldown-global').is(':checked');

                        // Handle each input to make sure they have a value.
                        switch (false) {
                            case helpers.handleInputNumber(commandCost):
                            case helpers.handleInputNumber(commandReward):
                            case helpers.handleInputNumber(commandCooldown):
                                break;
                            default:
                               // Save command information here and close the modal.
                                socket.updateDBValues('custom_command_edit', {
                                    tables: ['pricecom', 'permcom', 'paycom'],
                                    keys: [command, command, command],
                                    values: [commandCost.val(), helpers.getGroupIdByName(commandPermission.find(':selected').text(), true), commandReward.val()]
                                }, function() {
                                    // Add the cooldown to the cache.
                                    socket.wsEvent('audio_command_edit_cooldown_ws', './core/commandCoolDown.js', null,
                                        ['add', command, commandCooldown.val(), String(commandCooldownGlobal)], function() {
                                        // Update command permission.
                                        socket.sendCommand('edit_command_permission_cmd', 'permcomsilent ' + command + ' ' +
                                            helpers.getGroupIdByName(commandPermission.find(':selected').text(), true), function() {
                                            // Close modal.
                                            $('#edit-audio-command').modal('toggle');
                                            // Alert the user.
                                            toastr.success('Audiobefehl erfolgreich bearbeitet!');
                                        });
                                    });
                                });
                        }
                    }).modal('toggle');
                });
            });
        });

        // Welcome the user to the new page.
        socket.getDBValue('get_audio_hook_warning', 'panelData', 'audioHookNewUser', function(e) {
            if (e.panelData !== 'true') {
                alert('Hallo, hallo! \nWillkommen auf der Audio-Hook-Seite von PhantomBot! Auf dieser Seite können Sie Audiobefehle testen, hören und hinzufügen. \n' +
                    'Wenn Sie das alte Bedienfeld schon einmal verwendet haben, wurden Audiohooks auf dieser Seite wiedergegeben, wenn ein Benutzer einen Audiobefehl ausgeführt hat. ' +
                    'Dies funktioniert nicht mehr. Jetzt werden alle Audio-Hooks über die Benachrichtigungsseite von PhantomBot gesendet, die als Browser-Quelle in OBS verwendet werden kann. \n' +
                    'Klicken Sie auf die Schaltfläche Einstellungen, um auf die URL der Browser-Quelle zuzugreifen.');
                socket.updateDBValue('audio_hook_warning_set', 'panelData', 'audioHookNewUser', 'true', new Function());
            }
        });
    });
});

// Function that handlers the loading of events.
$(function() {
    // Toggle for the module.
    $('#audioHookModuleToggle').on('change', function() {
        // Enable the module then query the data.
        socket.sendCommandSync('audio_module_toggle_cmd', 'module ' + ($(this).is(':checked') ? 'enablesilent' : 'disablesilent') + ' ./systems/audioPanelSystem.js', run);
    });

    // Reload audio hooks button.
    $('#reload-audio-hooks').on('click', function() {
        socket.sendCommandSync('reload_audio_hooks_cmd', 'reloadaudiopanelhooks', function() {
            // Load new audio hooks.
            run();
            // Alert the user.
            toastr.success('Erfolgreich Audio-Hooks aktualisiert!');
        });
    });

    // Audio hooks settings.
    $('#audio-hooks-settings').on('click', function() {
        // Create custom modal for this module.
        helpers.getModal('audio-settings', 'Browser Quell-Einstellungen', 'Ok', $('<form/>', {
            'role': 'form'
        })
        // Main div for the browser source link.
        .append($('<div/>', {
            'class': 'form-group',
        })
        // Append the lable.
        .append($('<label/>', {
            'text': 'Browser Quelllink'
        }))
        .append($('<div/>', {
            'class': 'input-group'
        })
        // Add client widget URL.
        .append($('<input/>', {
            'type': 'text',
            'class': 'form-control',
            'id': 'audio-url',
            'readonly': 'readonly',
            'value': window.location.protocol + '//' + window.location.host + '/alerts?allow-audio-hooks=true&allow-alerts=false&audio-hook-volume=0.8',
            'style': 'color: transparent !important; text-shadow: 0 0 5px hsla(0, 0%, 100%, .5);',
            'data-toggle': 'tooltip',
            'title': 'Wenn du auf dieses Feld klickst, wird der Link angezeigt.',
            'click': function() {
                // Reset styles.
                $(this).prop('style', '');
            },
            'blur': function() {
                // Reset styles.
                $(this).prop('style', 'color: transparent !important; text-shadow: 0 0 5px hsla(0, 0%, 100%, .5);');
            }
        })).append($('<span/>', {
            'class': 'input-group-btn',
            'style': 'color: transparent !important; text-shadow: 0 0 5px hsla(0, 0%, 100%, .5);',
            'html': $('<button/>', {
                'type': 'button',
                'class': 'btn btn-primary btn-flat',
                'html': 'Kopieren',
                'click': function() {
                    // Select URL.
                    $('#audio-url').select().blur();
                    // Copy the URL.
                    document.execCommand('Copy');
                    // Close the modal.
                    $('#audio-settings').removeClass('fade').modal('hide');
                    // Alert the user.
                    toastr.success('Browser-Quell-URL kopiert!');
                }
            })
        })))), function() {
            // Close the modal.
            $('#audio-settings').modal('toggle');
        }).modal('toggle');
    });

    // Audio hooks command settings.
    $('#audio-hooks-cmd-settings').on('click', function() {
        helpers.getModal('add-audio-settings-cmd', 'Audio-Hook-Einstellungen', 'Speichern', $('<form/>', {
                'role': 'form'
            })
            // Append command name.
            .append(helpers.getInputGroup('cooldown-hooks', 'number', 'Master Abklingzeit (Sekunden)', '30', '',
                'Setzen Sie eine Master-Coldown für Audio-Hooks, diese Abklingzeit wird auf alle Befehle angewendet, wenn ein Befehl gesendet wird, ein anderer kann erst nach dieser Abklingzeit gesendet werden.')), function() {

            // Code.
        }).modal('toggle');
    });

    // Add audio command.
    $('#audio-hooks-cmd-add').on('click', function() {
        socket.getDBTableValues('get_all_audio_hooks', 'audio_hooks', function(results) {
            let audioNames = [];

            for (let i = 0; i < results.length; i++) {
                audioNames.push(results[i].key);
            }

            helpers.getAdvanceModal('add-audio-cmd', 'Audio-Befehl hinzufügen', 'Speichern', $('<form/>', {
                'role': 'form'
            })
            // Append command name.
            .append(helpers.getInputGroup('command-name', 'text', 'Befehl', '!boo', '', 'Befehl, der den Audio-Hook auslöst.'))
            // All audio hooks in a list.
            .append(helpers.getDropdownGroup('command-audio', 'Audio Hook', 'Auswählen eines Audio-Hooks', audioNames, 'Audio-Hook, der abgespielt werden soll, wenn der Befehl ausgeführt wird.'))
            // Append a select option for the command permission.
            .append(helpers.getDropdownGroup('command-permission', 'User Level', 'Viewers',
                ['Caster', 'Administrators', 'Moderators', 'Subscribers', 'Donators', 'VIPs', 'Regulars', 'Viewers'], 'Benutzer, die den Befehl ausführen können.'))
            // Add an advance section that can be opened with a button toggle.
            .append($('<div/>', {
                'class': 'collapse',
                'id': 'advance-collapse',
                'html': $('<form/>', {
                        'role': 'form'
                    })
                    // Append input box for the command cost.
                    .append(helpers.getInputGroup('command-cost', 'number', 'Kosten', '0', '0',
                        'Kosten in Punkten, die dem Benutzer bei der Ausführung des Befehls abgezogen werden.'))
                    // Append input box for the command reward.
                    .append(helpers.getInputGroup('command-reward', 'number', 'Belohnung', '0', '0',
                    'Belohnung in Punkten, die der Benutzer beim Ausführen des Befehls erhalten soll.'))
                    // Append input box for the command cooldown.
                    .append(helpers.getInputGroup('command-cooldown', 'number', 'Abklingzeit (Sekunden)', '0', '5',
                        'Abklingzeit des Befehls in Sekunden.')
                        // Append checkbox for if the cooldown is global or per-user.
                        .append(helpers.getCheckBox('command-cooldown-global', true, 'Global',
                            'Wenn diese Option aktiviert ist, wird die Abklingzeit auf alle im Kanal angewendet. Wenn diese Option nicht aktiviert ist, wird die Abklingzeit pro Benutzer angewendet.')))
            })), function() {
                let commandName = $('#command-name'),
                    commandAudio = $('#command-audio'),
                    commandPermission = $('#command-permission'),
                    commandCost = $('#command-cost'),
                    commandReward = $('#command-reward'),
                    commandCooldown = $('#command-cooldown'),
                    commandCooldownGlobal = $('#command-cooldown-global').is(':checked');

                // Remove the ! and spaces.
                commandName.val(commandName.val().replace(/(\!|\s)/g, '').toLowerCase());

                // Handle each input to make sure they have a value.
                switch (false) {
                    case helpers.handleInputString(commandName):
                    case helpers.handleInputNumber(commandCost):
                    case helpers.handleInputNumber(commandReward):
                    case helpers.handleInputNumber(commandCooldown):
                        break;
                    default:
                        if (commandAudio.val() === null) {
                            toastr.error('Bitte wählen Sie eine gültige Audio-Hook aus, die wiedergegeben werden soll.');
                        } else {
                            // Make sure the command doesn't exist already.
                            socket.getDBValue('audio_command_exists', 'permcom', commandName.val(), function(e) {
                                // If the command exists we stop here.
                                if (e.permcom !== null) {
                                    toastr.error('Befehl konnte nicht hinzugefügt werden, da er bereits vorhanden ist.');
                                    return;
                                }

                                // Add the command.
                                socket.updateDBValues('add_audio_command', {
                                    tables: ['pricecom', 'permcom', 'paycom', 'audioCommands'],
                                    keys: [commandName.val(), commandName.val(), commandName.val(), commandName.val()],
                                    values: [commandCost.val(), helpers.getGroupIdByName(commandPermission.find(':selected').text()), commandReward.val(), commandAudio.val()]
                                }, function() {
                                    socket.wsEvent('audio_command_add_cooldown_ws', './core/commandCoolDown.js', null,
                                        ['add', commandName.val(), commandCooldown.val(), String(commandCooldownGlobal)], function() {
                                        socket.sendCommandSync('add_audio_command_cmd', 'panelloadaudiohookcmds', function() {
                                            // Reload the table
                                            run();
                                            // Close the modal.
                                            $('#add-audio-cmd').modal('toggle');
                                            // Alert the user.
                                            toastr.success('Der Audio-Befehl wurde erfolgreich hinzugefügt!');
                                        });
                                    });
                                });
                            });
                        }
                }
            }).modal('toggle');
        });
    });
});
