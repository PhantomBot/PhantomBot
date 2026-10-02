/*
 * Copyright (C) 2016-2026 phantombot.github.io/PhantomBot
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

/* global toastr */

// Function that querys all of the data we need.
$(function () {
    const getDisabledIconAttr = function (disabled) {
        return {
            class: 'fa disabled-status-icon ' + (disabled ? 'fa-ban text-muted' : 'fa-check'),
            title: disabled ? 'disabled' : 'enabled'
        };
    };
    const getHiddenIconAttr = function (hidden) {
        return {
            class: 'fa hidden-status-icon ' + (hidden ? 'fa-eye-slash text-muted' : 'fa-eye'),
            title: hidden ? 'hidden' : 'visible'
        };
    };
    let selectedCommands = new Set();

    const updateAliasVisibility = function (name, disabled, hidden, callback) {
        let addTables = [],
                addKeys = [],
                addValues = [],
                removeTables = [],
                removeKeys = [];
        if (disabled) {
            addTables.push('disabledCommands');
            addKeys.push(name);
            addValues.push(true);
        } else {
            removeTables.push('disabledCommands');
            removeKeys.push(name);
        }
        if (hidden) {
            addTables.push('hiddenCommands');
            addKeys.push(name);
            addValues.push(true);
        } else {
            removeTables.push('hiddenCommands');
            removeKeys.push(name);
        }
        const remove = function (callback) {
            if (removeTables.length > 0) {
                socket.removeDBValues('alias_visibility_remove', {tables: removeTables, keys: removeKeys}, callback);
            } else {
                callback();
            }
        };
        const add = function (callback) {
            if (addTables.length > 0) {
                socket.updateDBValues('alias_visibility_update', {tables: addTables, keys: addKeys, values: addValues}, callback);
            } else {
                callback();
            }
        };
        remove(function () {
            add(callback);
        });
    };

    const loadAliases = function () {
        // Query aliases.
        socket.getDBTablesValues('commands_get_aliases', [{table: 'aliases'}, {table: 'disabledCommands'}, {table: 'hiddenCommands'}], function (results) {
            let tableData = [];
            let disabledCommands = {};
            let hiddenCommands = {};
            let aliases = [];
            for (let result of results) {
                switch (result['table']) {
                    case 'aliases':
                        aliases.push(result);
                        break;
                    case 'disabledCommands':
                        disabledCommands[result.key] = true;
                        break;
                    case 'hiddenCommands':
                        hiddenCommands[result.key] = true;
                        break;
                }
            }

            for (let alias of aliases) {
                tableData.push([
                    $('<div/>', {
                        'class': 'pretty p-icon'
                    }).append($('<input/>', {
                        'class': 'command-select-checkbox',
                        'type': 'checkbox',
                        'value': alias.key
                    })).append($('<div/>', {
                        'class': 'state p-default'
                    }).append($('<i/>', {
                        'class': 'icon fa fa-check'
                    })).append($('<label/>', {
                        'text': ''
                    }))).html(),
                    '!' + alias.key,
                    '!' + alias.value,
                    $('<div/>', {
                        'class': 'btn-group'
                    }).append($('<button/>', {
                        'type': 'button',
                        'class': 'btn btn-xs btn-warning btn-disablealias',
                        'style': 'float: right',
                        'data-alias': alias.key,
                        'html': $('<i/>', {
                                ...getDisabledIconAttr(disabledCommands.hasOwnProperty(alias.key)),
                                'style': "width: 9px"
                            })
                    })).append($('<button/>', {
                        'type': 'button',
                        'class': 'btn btn-xs btn-warning btn-hidealias',
                        'style': 'float: right',
                        'data-alias': alias.key,
                        'html': $('<i/>', {
                                ...getHiddenIconAttr(hiddenCommands.hasOwnProperty(alias.key)),
                                'style': "width: 9px"
                            })
                    })).html(),
                    $('<div/>', {
                        'class': 'btn-group'
                    }).append($('<button/>', {
                        'type': 'button',
                        'class': 'btn btn-xs btn-danger btn-deletealias',
                        'style': 'float: right',
                        'data-alias': alias.key,
                        'html': $('<i/>', {
                            'class': 'fa fa-trash'
                        })
                    })).append($('<button/>', {
                        'type': 'button',
                        'class': 'btn btn-xs btn-warning btn-editalias',
                        'style': 'float: right',
                        'data-alias': alias.key,
                        'html': $('<i/>', {
                            'class': 'fa fa-edit'
                        })
                    })).html()
                ]);
            }

            const $aliasesTable = $('#aliasesTable');

            // if the table exists, destroy it.
            if ($.fn.DataTable.isDataTable('#aliasesTable')) {
                $aliasesTable.DataTable().clear().rows.add(tableData).invalidate().draw(false);
                return;
            }

            // Create table.
            let table = $aliasesTable.DataTable({
                'searching': true,
                'autoWidth': false,
                'data': tableData,
                'lengthMenu': [[10, 25, 50, 100, -1], [10, 25, 50, 100, "All"]],
                'columnDefs': [
                    {'className': 'default-table', 'orderable': false, 'targets': [3, 4]},
                    {'width': '35%', 'targets': 1}
                ],
                'columns': [
                    {'title': '<div class="pretty p-icon" style="margin-right: 0;"><input type="checkbox" id="selectAllCommands"><div class="state p-default"><i class="icon fa fa-check"></i><label></label></div></div>', 'orderable': false, 'defaultContent': ''},
                    {'title': 'Alias'},
                    {'title': 'Command'},
                    {'title': 'Status'},
                    {'title': 'Actions'}
                ]
            });

            
            // Toggle Bulk Toolbar
            const toggleBulkToolbar = function() {
                if (selectedCommands.size > 0) {
                    $('#bulkActionsToolbar').show();
                } else {
                    $('#bulkActionsToolbar').hide();
                }
            };

            // On select all checkbox
            $('#selectAllCommands').off('change').on('change', function() {
                let isChecked = $(this).is(':checked');
                $('.command-select-checkbox').each(function() {
                    $(this).prop('checked', isChecked);
                    if (isChecked) {
                        selectedCommands.add($(this).val());
                    } else {
                        selectedCommands.delete($(this).val());
                    }
                });
                toggleBulkToolbar();
            });

            // On row checkbox change
            table.on('change', '.command-select-checkbox', function() {
                if ($(this).is(':checked')) {
                    selectedCommands.add($(this).val());
                } else {
                    selectedCommands.delete($(this).val());
                }
                
                let allChecked = $('.command-select-checkbox').length > 0 && $('.command-select-checkbox:not(:checked)').length === 0;
                $('#selectAllCommands').prop('checked', allChecked);
                toggleBulkToolbar();
            });

            // Maintain selection across pages
            table.on('draw', function() {
                $('.command-select-checkbox').each(function() {
                    if (selectedCommands.has($(this).val())) {
                        $(this).prop('checked', true);
                    }
                });
                let allChecked = $('.command-select-checkbox').length > 0 && $('.command-select-checkbox:not(:checked)').length === 0;
                $('#selectAllCommands').prop('checked', allChecked);
            });

            const processBulkAction = function(disableState, hiddenState) {
                let commandsToProcess = Array.from(selectedCommands);
                if (commandsToProcess.length === 0) return;
                
                let processed = 0;
                commandsToProcess.forEach(alias => {
                    socket.getDBValues('alias_bulk_edit', {
                        tables: ['aliases', 'disabledCommands', 'hiddenCommands'],
                        keys: [alias, alias, alias]
                    }, function (e) {
                        let commandDisabled = e.disabledCommands !== null;
                        let commandHidden = e.hiddenCommands !== null;
                        
                        let targetDisabled = disableState !== null ? disableState : commandDisabled;
                        let targetHidden = hiddenState !== null ? hiddenState : commandHidden;
                        
                        updateAliasVisibility(alias, targetDisabled, targetHidden, function() {
                            socket.wsEvent('alias_edit_ws', './commands/customCommands.js', null, ['edit', String(alias), e.aliases, JSON.stringify({disabled: targetDisabled})], function () {
                                // Find row and update icon
                                let indexes = table.rows().indexes().filter(function(idx) {
                                    return table.row(idx).data()[1] === '!' + alias;
                                });
                                
                                if (indexes.length > 0) {
                                    let node = table.row(indexes[0]).node();
                                    $(node).find('.disabled-status-icon').attr(getDisabledIconAttr(targetDisabled));
                                    $(node).find('.hidden-status-icon').attr(getHiddenIconAttr(targetHidden));
                                }
                                
                                processed++;
                                if (processed === commandsToProcess.length) {
                                    selectedCommands.clear();
                                    $('.command-select-checkbox').prop('checked', false);
                                    $('#selectAllCommands').prop('checked', false);
                                    toggleBulkToolbar();
                                }
                            });
                        });
                    });
                });
            };

            $('#bulkDisable').off('click').on('click', function() { processBulkAction(true, null); });
            $('#bulkEnable').off('click').on('click', function() { processBulkAction(false, null); });
            $('#bulkHide').off('click').on('click', function() { processBulkAction(null, true); });
            $('#bulkShow').off('click').on('click', function() { processBulkAction(null, false); });

// On delete button.
            table.on('click', '.btn-deletealias', function () {
                let alias = $(this).data('alias'),
                        row = $(this).parents('tr');

                // Ask the user if he wants to delete the alias.
                helpers.getConfirmDeleteModal('custom_alias_modal_remove', 'Are you sure you want to remove the alias !' + alias + '?', true,
                        'The alias !' + alias + ' has been successfully removed!', function () { // Callback if the user clicks delete.
                            // Delete all information about the alias.
                            socket.removeDBValues('alias_remove', {
                                tables: ['aliases', 'disabledCommands', 'hiddenCommands'],
                                keys: [alias, alias, alias]
                            }, function () {
                                socket.sendCommand('alias_remove_cmd', 'reloadcommand ' + alias, function () {
                                    // Remove the table row.
                                    table.row(row).remove().draw(false);
                                });
                            });
                        });
            });

            // On disable button.
            table.on('click', '.btn-disablealias', function () {
                let alias = $(this).data('alias'),
                row = $(this).parents('tr');
                socket.getDBValues('alias_edit', {
                  tables: ['aliases', 'disabledCommands', 'hiddenCommands'],
                  keys: [alias, alias, alias]
                  }, function (e) {
                    let disabledCommands = e.disabledCommands === null,
                            hiddenCommands = e.hiddenCommands !== null;
                      updateAliasVisibility(alias, disabledCommands, hiddenCommands, function () {
                        // Register the custom command with the cache.
                        socket.wsEvent('alias_edit_ws', './commands/customCommands.js', null, ['edit', String(alias),
                            e.aliases, JSON.stringify({disabled: disabledCommands})], function () {
                            // Update status icon
                            row.find('.disabled-status-icon').attr(getDisabledIconAttr(disabledCommands));
                            });
                      });
                    });
              });
  
              // On hidden button.
              table.on('click', '.btn-hidealias', function () {
                let alias = $(this).data('alias'),
                row = $(this).parents('tr');
                socket.getDBValues('alias_edit', {
                  tables: ['aliases', 'disabledCommands', 'hiddenCommands'],
                  keys: [alias, alias, alias]
                  }, function (e) {
                    let commandDisabled = e.disabledCommands !== null,
                      commandHidden = e.hiddenCommands === null;
                    updateAliasVisibility(alias, commandDisabled, commandHidden, function () {
                      // Register the custom command with the cache.
                      socket.wsEvent('alias_edit_ws', './commands/customCommands.js', null, ['edit', String(alias),
                        e.aliases, JSON.stringify({hidden: commandHidden})], function () {
                          // Update status icon
                          row.find('.hidden-status-icon').attr(getHiddenIconAttr(commandHidden));
                        });
                      });
                    });
              });

            // On edit button.
            table.on('click', '.btn-editalias', function () {
                let alias = $(this).data('alias'),
                        t = $(this);

                socket.getDBValues('alias_name_get', {
                    tables: ['aliases', 'disabledCommands', 'hiddenCommands'],
                    keys: [alias, alias, alias]
                }, function (e) {
                    helpers.getModal('edit-alias', 'Edit Alias', 'Save', $('<form/>', {
                        'role': 'form'
                    })
                            // Append alias name.
                            .append(helpers.getInputGroup('alias-name', 'text', 'Alias', '', '!' + alias, 'Name of the alias. This cannot be edited.', true))
                            // Append alias.
                            .append(helpers.getInputGroup('alias-cmd', 'text', 'Command', '', '!' + e.aliases, 'Command to be ran by the alias.'))
                            .append(helpers.getCheckBox('alias-disabled', e.disabledCommands !== null, 'Disabled',
                                    'If checked, the alias cannot be used in chat.'))
                            .append(helpers.getCheckBox('alias-hidden', e.hiddenCommands !== null, 'Hidden',
                                    'If checked, the alias will not be listed when !command is called.')),
                            function () {// Callback once we click the save button.
                                let aliasCmd = $('#alias-cmd');

                                if (aliasCmd.val().startsWith('!')) {
                                    aliasCmd.val(aliasCmd.val().substring(1));
                                }

                                aliasCmd.val(aliasCmd.val().toLowerCase());

                                let aliasDisabled = $('#alias-disabled').is(':checked');
                                let aliasHidden = $('#alias-hidden').is(':checked');

                                // Handle each input to make sure they have a value.
                                switch (false) {
                                    case helpers.handleInputString(aliasCmd):
                                        break;
                                    default:
                                        // Update the alias.
                                        socket.updateDBValue('update_command_alias', 'aliases', alias, aliasCmd.val(), function () {
                                            updateAliasVisibility(alias, aliasDisabled, aliasHidden, function () {
                                                socket.wsEvent('alias_add_ws', './commands/customCommands.js', null,
                                                        ['editAlias', alias, aliasCmd.val(), JSON.stringify({disabled: aliasDisabled})], function () {
                                                    const $tr = t.parents('tr');
                                                    // Update the table.
                                                    $tr.find('td:eq(1)').text('!' + aliasCmd.val());
                                                    // Update status icons
                                                    $tr.find('.disabled-status-icon').attr(getDisabledIconAttr(aliasDisabled));
                                                    $tr.find('.hidden-status-icon').attr(getHiddenIconAttr(aliasHidden));
                                                    // Close the modal.
                                                    $('#edit-alias').modal('hide');
                                                    // Alert the user.
                                                    toastr.success('Successfully edited alias !' + alias);
                                                });
                                            });
                                        });
                                }
                            }).modal('toggle');
                });
            });
        });
    };

    const init = function () {
        // Check if the module is enabled.
        socket.getDBValue('alias_command_module', 'modules', './commands/customCommands.js', function (e) {
            // If the module is off, don't load any data.
            if (helpers.handleModuleLoadUp('aliasesModule', e.modules)) {
                loadAliases();
            }
        });
    };
    init();

    // Function that handlers the loading of events.
    // Toggle for the module.
    $('#aliasesModuleToggle').on('change', function () {
        // Enable the module then query the data.
        socket.sendCommandSync('aliases_commands_module_toggle_cmd', 'module ' + ($(this).is(':checked') ? 'enablesilent' : 'disablesilent') + ' ./commands/customCommands.js', init);
    });

    // Add alias button.
    $('#aliascom-button').on('click', function () {
        helpers.getModal('add-alias', 'Add Alias', 'Save', $('<form/>', {
            'role': 'form'
        })
                // Append alias name.
                .append(helpers.getInputGroup('alias-name', 'text', 'Alias', '!cmds', '', 'Name of the alias.'))
                // Append alias.
                .append(helpers.getInputGroup('alias-cmd', 'text', 'Command', '!commands', '', 'Command to be ran by the alias.'))
                .append(helpers.getCheckBox('alias-disabled', false, 'Disabled', 'If checked, the alias cannot be used in chat.'))
                .append(helpers.getCheckBox('alias-hidden', false, 'Hidden', 'If checked, the alias will not be listed when !command is called.')),
                function () {// Callback once we click the save button.
                    let aliasName = $('#alias-name'),
                            aliasCmd = $('#alias-cmd');

                    if (aliasName.val().startsWith('!')) {
                        aliasName.val(aliasName.val().substring(1));
                    }

                    aliasName.val(aliasName.val().toLowerCase());

                    if (aliasCmd.val().startsWith('!')) {
                        aliasCmd.val(aliasCmd.val().substring(1));
                    }

                    aliasCmd.val(aliasCmd.val().toLowerCase());

                    let aliasDisabled = $('#alias-disabled').is(':checked');
                    let aliasHidden = $('#alias-hidden').is(':checked');

                    // Handle each input to make sure they have a value.
                    switch (false) {
                        case helpers.handleInputString(aliasName):
                        case helpers.handleInputString(aliasCmd):
                            break;
                        default:
                            // Make sure the alias doesn't exit already.
                            socket.getDBValue('alias_exists', 'aliases', aliasName.val(), function (e) {
                                // If the command exists we stop here.
                                if (e.aliases !== null) {
                                    toastr.error('Failed to add alias as it already exists.');
                                    return;
                                }

                                // Add the alias.
                                socket.updateDBValue('add_command_alias', 'aliases', aliasName.val(), aliasCmd.val(), function () {
                                    updateAliasVisibility(aliasName.val(), aliasDisabled, aliasHidden, function () {
                                        socket.wsEvent('custom_command_add_ws', './commands/customCommands.js', null,
                                                ['addAlias', aliasName.val(), aliasCmd.val()], function () {
                                            // Reload the table.
                                            loadAliases();
                                            // Close the modal.
                                            $('#add-alias').modal('hide');
                                            // Alert the user.
                                            toastr.success('Successfully added alias !' + aliasName.val());
                                        });
                                    });
                                });
                            });
                    }
                }).modal('toggle');
    });
});
