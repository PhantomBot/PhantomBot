/*
 * Copyright (C) 2016-2019 phantombot.tv
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
    // Get all modules.
    socket.getDBTableValues('get_all_modules', 'modules', function(results) {
        let twitchModules = [],
            discordModules = [];

        for (let i = 0; i < results.length; i++) {
            if (results[i].key.indexOf('/lang/') === -1 && results[i].key.indexOf('/core/') === -1) {
                if (results[i].key.indexOf('./discord') !== -1) {
                    discordModules.push({
                        module: results[i].key,
                        status: results[i].value === 'true'
                    });
                } else {
                    twitchModules.push({
                        module: results[i].key,
                        status: results[i].value === 'true'
                    });
                }
            }
        }

        // Load Twitch table.
        let twitchTable = [];
        for (let i = 0; i < twitchModules.length; i++) {
            twitchTable.push([
                twitchModules[i].module,
                $('<div/>', {
                    'class': 'btn-group'
                }).append($('<button/>', {
                    'type': 'button',
                    'class': 'btn btn-xs btn-danger',
                    'data-toggle': 'tooltip',
                    'title': 'Lösche das Modul, wenn es nicht mehr existiert.',
                    'style': 'float: right',
                    'data-module': twitchModules[i].module,
                    'html': $('<i/>', {
                        'class': 'fa fa-trash'
                    })
                })).append($('<button/>', {
                    'type': 'button',
                    'class': 'btn btn-xs btn-' + (twitchModules[i].status ? 'success' : 'warning'),
                    'data-toggle': 'tooltip',
                    'title': (twitchModules[i].status ? 'Klick hier, um das Modul zu deaktivieren.' : 'Klick hier, um das Modul zu aktivieren.') ,
                    'style': 'float: right',
                    'data-module': twitchModules[i].module,
                    'data-mtoggle': twitchModules[i].status,
                    'html': $('<i/>', {
                        'class': 'fa fa-' + (twitchModules[i].status ? 'close' : 'check')
                    })
                })).html()
            ]);
        }

        // if the table exists, destroy it.
        if ($.fn.DataTable.isDataTable('#twitchModuleTable')) {
            $('#twitchModuleTable').DataTable().destroy();
            // Remove all of the old events.
            $('#twitchModuleTable').off();
        }

        // Create table.
        let table = $('#twitchModuleTable').DataTable({
            'searching': true,
            "language": {
                "url": "//cdn.datatables.net/plug-ins/1.10.19/i18n/German.json"
            },
            'autoWidth': false,
            'lengthChange': true,
            'data': twitchTable,
            'columnDefs': [
                { 'className': 'default-table', 'orderable': false, 'targets': 1 },
            ],
            'columns': [
                { 'title': 'Modul' },
                { 'title': 'Aktionen' }
            ]
        });

        // On delete button.
        table.on('click', '.btn-danger', function() {
            let module = $(this).data('module'),
                row = $(this).parents('tr');

            // Ask the user if he want to remove the module.
            helpers.getConfirmDeleteModal('rm_module_cmd_modal', 'Sind Sie sicher, dass Sie das Modul "' + module + '" entfernen wollen?', true,
                    'Das Modul "' + module + '" wurde erfolgreich entfernt!', function() {
                socket.removeDBValue('rm_twitch_module', 'modules', module, function() {
                    // Remove the table row.
                    table.row(row).remove().draw(false);
                });
            });
        });

        // On toggle button.
        table.on('click', '.btn-warning, .btn-success', function() {
            let module = $(this).data('module'),
                toggle = $(this).data('mtoggle'),
                btn = $(this);

            socket.sendCommand('module_toggle_cmd', 'module ' + (!toggle ? 'enablesilent ' : 'disablesilent ') + module, function() {
                toastr.success('Das Modul wurde erfolgreich ' + (!toggle ? 'aktiviert' : 'deaktiviert'));

                // Update the button.
                if (toggle) {
                    btn.removeClass('btn-success').addClass('btn-warning').find('i').removeClass('fa-close').addClass('fa-check');
                    btn.prop('title', 'Klick hier, um das Modul zu aktivieren.').tooltip('fixTitle').tooltip('show');
                } else {
                    btn.removeClass('btn-warning').addClass('btn-success').find('i').removeClass('fa-check').addClass('fa-close');
                    btn.prop('title', 'Klick hier, um das Modul zu deaktivieren.').tooltip('fixTitle').tooltip('show');
                }
                btn.data('mtoggle', !toggle);
            });
        });

        // Get the status of Discord.
        // Only load the list if we are using it.
        socket.getDBValue('get_discord_status', 'panelData', 'hasDiscord', function(e) {
            // Disable the tab if we are not using Discord.
            if (e.panelData !== 'true') {
                $('#discord_modules_t').addClass('disabled').parent().addClass('disabled');
                return;
            }

            // Load Discord table.
            let discordTable = [];
            for (let i = 0; i < discordModules.length; i++) {
                discordTable.push([
                    discordModules[i].module,
                    $('<div/>', {
                        'class': 'btn-group'
                    }).append($('<button/>', {
                        'type': 'button',
                        'class': 'btn btn-xs btn-danger',
                        'data-toggle': 'tooltip',
                        'title': 'Löschen Sie das Modul, wenn es nicht mehr existiert.',
                        'style': 'float: right',
                        'data-module': discordModules[i].module,
                        'html': $('<i/>', {
                            'class': 'fa fa-trash'
                        })
                    })).append($('<button/>', {
                        'type': 'button',
                        'class': 'btn btn-xs btn-' + (discordModules[i].status ? 'success' : 'warning'),
                        'data-toggle': 'tooltip',
                        'title': (discordModules[i].status ? 'Klick hier, um das Modul zu deaktivieren.' : 'Klick hier, um das Modul zu aktivieren.') ,
                        'style': 'float: right',
                        'data-module': discordModules[i].module,
                        'data-mtoggle': discordModules[i].status,
                        'html': $('<i/>', {
                            'class': 'fa fa-' + (discordModules[i].status ? 'close' : 'check')
                        })
                    })).html()
                ]);
            }

            // if the table exists, destroy it.
            if ($.fn.DataTable.isDataTable('#discordModuleTable')) {
                $('#discordModuleTable').DataTable().destroy();
                // Remove all of the old events.
                $('#discordModuleTable').off();
            }

            // Create table.
            let table = $('#discordModuleTable').DataTable({
                'searching': true,
                "language": {
                    "url": "//cdn.datatables.net/plug-ins/1.10.19/i18n/German.json"
                },
                'autoWidth': false,
                'lengthChange': true,
                'data': discordTable,
                'columnDefs': [
                    { 'className': 'default-table', 'orderable': false, 'targets': 1 },
                ],
                'columns': [
                    { 'title': 'Modul' },
                    { 'title': 'Aktionen' }
                ]
            });

            // On delete button.
            table.on('click', '.btn-danger', function() {
                let module = $(this).data('module'),
                    row = $(this).parents('tr');

                // Ask the user if he want to remove the module.
                helpers.getConfirmDeleteModal('rm_module_cmd_modal', 'Sind Sie sicher, dass Sie das Modul "' + module + '" entfernen wollen?', true,
                        'Das Modul "' + module + '" wurde erfolgreich entfernt!', function() {
                    socket.removeDBValue('rm_discord_module', 'modules', module, function() {
                        // Remove the table row.
                        table.row(row).remove().draw(false);
                    });
                });
            });

            // On toggle button.
            table.on('click', '.btn-warning, .btn-success', function() {
                let module = $(this).data('module'),
                    toggle = $(this).data('mtoggle'),
                    btn = $(this);

                socket.sendCommand('module_toggle_cmd', 'module ' + (!toggle ? 'enablesilent ' : 'disablesilent ') + module, function() {
                    toastr.success('Das Modul wurde erfolgreich ' + (!toggle ? 'aktiviert.' : 'deaktiviert.'));

                    // Update the button.
                    if (toggle) {
                        btn.removeClass('btn-success').addClass('btn-warning').find('i').removeClass('fa-close').addClass('fa-check');
                        btn.prop('title', 'Klick hier, um das Modul zu aktivieren.').tooltip('fixTitle').tooltip('show');
                    } else {
                        btn.removeClass('btn-warning').addClass('btn-success').find('i').removeClass('fa-check').addClass('fa-close');
                        btn.prop('title', 'Klick hier, um das Modul zu deaktivieren.').tooltip('fixTitle').tooltip('show');
                    }
                    btn.data('mtoggle', !toggle);
                });
            });
        });
    });
});
