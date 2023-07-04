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
$(run = function () {
    // Check if the module is enabled.
    socket.getDBValue('quotes_module_toggle', 'modules', './systems/quoteSystem.js', function (e) {
        // If the module is off, don't load any data.
        if (!helpers.handleModuleLoadUp('quotesModule', e.modules)) {
            return;
        }

        // Get all quotes.
        socket.getDBTableValues('get_all_quotes', 'quotes', function (results) {
            let tableData = [];

            for (let i = 0; i < results.length; i++) {
                // Quotes are stored in an array for some reason.
                // So we need to parse it to access the data.
                let data = JSON.parse(results[i].value);

                tableData.push([
                    i,
                    new Date(parseInt(data[2])).toLocaleDateString(), // Date.
                    data[0], // Username.
                    data[3], // Game.
                    data[1], // Quote.
                    $('<div/>', {
                        'class': 'btn-group'
                    }).append($('<button/>', {
                        'type': 'button',
                        'class': 'btn btn-xs btn-danger',
                        'style': 'float: right',
                        'data-quote': results[i].key,
                        'html': $('<i/>', {
                            'class': 'fa fa-trash'
                        })
                    })).append($('<button/>', {
                        'type': 'button',
                        'class': 'btn btn-xs btn-warning',
                        'style': 'float: right',
                        'data-quote': results[i].key,
                        'html': $('<i/>', {
                            'class': 'fa fa-edit'
                        })
                    })).html()
                ]);
            }

            // if the table exists, destroy it.
            if ($.fn.DataTable.isDataTable('#quotesTable')) {
                $('#quotesTable').DataTable().clear().rows.add(tableData).invalidate().draw(false);
                return;
            }

            // Create table.
            let table = $('#quotesTable').DataTable({
                'searching': true,
                'autoWidth': false,
                'lengthChange': false,
                'data': tableData,
                'columnDefs': [
                    {'className': 'default-table', 'orderable': false, 'targets': 5},
                    {'width': '5%', 'targets': 0},
                    {'width': '10%', 'targets': 1},
                    {'width': '45%', 'targets': 4}
                ],
                'columns': [
                    {'title': 'Id'},
                    {'title': 'Created On', 'orderData': [1]},
                    {'title': 'Username'},
                    {'title': 'Game'},
                    {'title': 'Quote'},
                    {'title': 'Action'}
                ]
            });

            // On delete button.
            table.on('click', '.btn-danger', function () {
                let quoteId = $(this).data('quote');

                // Ask the user if the wants to remove the quote.
                helpers.getConfirmDeleteModal('quote_modal_remove', 'Are you sure you want to remove quote with ID ' + quoteId + '?', true,
                        'You\'ve successfully removed quote with ID ' + quoteId + '!', function () {
                            // Delete the quote.
                            socket.sendCommandSync('rm_quote_cmd', 'delquotesilent ' + quoteId, function () {
                                // Reload the table.
                                run();
                            });
                        });
            });

            // On edit button.
            table.on('click', '.btn-warning', function () {
                let quote = $(this).data('quote'),
                        t = $(this);

                // Get the quote.
                socket.getDBValue('edit_quote_get', 'quotes', quote, function (e) {
                    let data = JSON.parse(e.quotes);

                    helpers.getModal('edit-quote', 'Edit Quote', 'Save', $('<form/>', {
                        'role': 'form'
                    })
                            // Append quote date.
                            .append(helpers.getInputGroup('quote-date', 'text', 'Created On', '', helpers.getPaddedDateString(new Date(parseInt(data[2])).toLocaleDateString()), 'Date the quote was created on.'))
                            // Append quote creator
                            .append(helpers.getInputGroup('quote-user', 'text', 'Created By', '', data[0], 'The user who created the quote.'))
                            // Append quote game
                            .append(helpers.getInputGroup('quote-game', 'text', 'Game', '', data[3], 'Game being played when the quote was created.'))
                            // Append quote
                            .append(helpers.getTextAreaGroup('quote-quote', 'text', 'Quote', '', data[1], 'Quote text.', false)), function () {// Callback once we click the save button.
                        let quoteDate = $('#quote-date'),
                                quoteUser = $('#quote-user'),
                                quoteGame = $('#quote-game'),
                                quoteQuote = $('#quote-quote');

                        // Make sure all boxes have an input.
                        switch (false) {
                            case helpers.handleInputDate(quoteDate):
                            case helpers.handleInputString(quoteUser):
                            case helpers.handleInputString(quoteGame):
                            case helpers.handleInputString(quoteQuote):
                                break;
                            default:
                                // Edit the quote.
                                socket.updateDBValue('edit_quote_update', 'quotes', quote, JSON.stringify([
                                    quoteUser.val(),
                                    quoteQuote.val(),
                                    helpers.getEpochFromDate(quoteDate.val()),
                                    quoteGame.val()
                                ]), function () {
                                    // Update the date.
                                    t.parents('tr').find('td:eq(1)').text(quoteDate.val());
                                    // Update the game.
                                    t.parents('tr').find('td:eq(2)').text(quoteUser.val());
                                    // Update the user.
                                    t.parents('tr').find('td:eq(3)').text(quoteGame.val());
                                    // Update the quote.
                                    t.parents('tr').find('td:eq(4)').text(quoteQuote.val());
                                    // Close the modal.
                                    $('#edit-quote').modal('hide');
                                    // Alert the user.
                                    toastr.success('Successfully edited the quote!');
                                });
                        }
                    }).modal('toggle');
                });
            });
        });
    });
});

// Function that handlers the loading of events.
$(function () {
    socket.addListener('quote_update', function () {
        run();
    });

    // Module toggle.
    $('#quotesModuleToggle').on('change', function () {
        // Enable the module then query the data.
        socket.sendCommand('quotes_module_toggle_cmd', 'module ' + ($(this).is(':checked') ? 'enablesilent' : 'disablesilent') + ' ./systems/quoteSystem.js', run);
    });

    // Add quote button.
    $('#add-quote-button').on('click', function () {
        helpers.getModal('add-quote', 'Add Quote', 'Save', $('<form/>', {
            'role': 'form'
        })
                // Quote input.
                .append(helpers.getTextAreaGroup('quote-quote', 'text', 'Quote', 'PhantomBot is great!', '', 'Quote text.', false)), function () {// Callback once we click the save button.
            let quoteQuote = $('#quote-quote');

            // Handle each input to make sure they have a value.
            switch (false) {
                case helpers.handleInputString(quoteQuote):
                    break;
                default:
                    // Add quote.
                    socket.sendCommandSync('add_quote_cmd', 'addquotesilent ' + quoteQuote.val().replace(/"/g, '\'\''), function () {
                        // Close the modal.
                        $('#add-quote').modal('hide');
                        // Alert the user.
                        toastr.success('Successfully added quote!');
                    });
            }
        }).modal('toggle');
    });

    // Quotes settings button.
    $('#quote-settings-button').on('click', function () {
        socket.getDBValues('get_quote_settings', {
            tables: ['settings', 'settings'],
            keys: ['quoteMessage', 'quoteTwitchNamesToggle']
        }, true, function (e) {
            helpers.getModal('quote-settings', 'Quote Settings', 'Save', $('<form/>', {
                'role': 'form'
            })
                    // Quote input.
                    .append(helpers.getInputGroup('quote-msg', 'text', 'Quote Response', '', helpers.getDefaultIfNullOrUndefined(e.settings, '[(id)] "(quote)", by (user) ((date))'),
                            'Message said in chat when someone uses the quote command. Tags: (id), (quote), (user), (game) and (date)'))
                    .append(helpers.getDropdownGroup('quote-twitch-names-toggle', 'Force Twitch Names', (e['quoteTwitchNamesToggle'] !== 'false' ? 'Yes' : 'No'), ['Yes', 'No'],
                            'If names for quotes should be validated against Twitch usernames. If not, names can be anything.')),
                    function () {// Callback once we click the save button.
                        let quoteMsg = $('#quote-msg'),
                                quoteTwitchNamesToggle = $('#quote-twitch-names-toggle').find(':selected').text() === 'Yes';

                        // Handle each input to make sure they have a value.
                        switch (false) {
                            case helpers.handleInputString(quoteMsg):
                                break;
                            default:
                                // Add quote.
                                socket.updateDBValues('get_quote_settings_update', {
                                    tables: ['settings', 'settings'],
                                    keys: ['quoteMessage', "quoteTwitchNamesToggle"],
                                    values: [quoteMsg.val(), quoteTwitchNamesToggle]
                                }, function () {
                                    // Close the modal.
                                    $('#quote-settings').modal('hide');
                                    // Alert the user.
                                    toastr.success('Successfully saved quote settings!');
                                });
                        }
                    }).modal('toggle');
        });
    });
});
