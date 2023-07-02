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

$(function () {
    var currentLang = '';

    // Load file button
    $('#load-file-button').on('click', function () {
        socket.doRemote('getLangList', 'getLangList', {}, function (e) {
            let tree = [];
            function updateTree(fullPath, parts, branches) {
                let found = false;
                for (let b in branches) {
                    if (branches[b].text.trim() === parts[0]) {
                        found = true;
                        if (parts.length > 1) {
                            if (!branches[b].hasOwnProperty('nodes')) {
                                branches[b].nodes = [];
                            }

                            branches[b].nodes = updateTree(fullPath, parts.slice(1), branches[b].nodes);
                        }
                        break;
                    }
                }

                if (!found) {
                    let newBranch = {
                        text: parts[0],
                        selectedIcon: 'fa fas fa-circle'
                    };

                    if (parts.length > 1) {
                        newBranch.text = ' ' + newBranch.text;
                        newBranch.icon = 'glyphicon glyphicon-folder-open';
                        newBranch.selectable = false;
                        newBranch.state = { expanded: false };
                        newBranch.nodes = updateTree(fullPath, parts.slice(1), []);
                    } else {
                        newBranch.fullPath = fullPath;
                    }

                    branches.push(newBranch);
                }

                return branches;
            }

            for (let x of e) {
                let parts = x.replaceAll('\\', '/').split('/');
                tree = updateTree(x, parts, tree);
            }

            let modal = helpers.getModal('edit-lang', 'Load Lang File', 'Edit', $('<form/>', {
                'role': 'form'
            }).append($('<div />', {id: 'filetree'}))
                    // Add select box.
                    /*.append(helpers.getDropdownGroup('file-to-load', 'Lang file: ', 'Choose a File', e))*/, function () {
                currentLang = $('#filetree').treeview('getSelected');
                if (currentLang.length === 0) {
                    $('#edit-lang').modal('hide');
                    return;
                }
                currentLang = currentLang[0].fullPath;
                socket.doRemote('loadLang', 'loadLang', {
                    'lang-path': currentLang
                }, function (e) {
                    loadLang(JSON.parse(e[0].langFile));
                    // Alert the user.
                    toastr.success('Successfully loaded the file!');
                    // Close the modal.
                    $('#edit-lang').modal('hide');
                    // Enable the insert and save buttons.
                    $('#save-button').prop('disabled', false);
                    $('#add-line-button').prop('disabled', false);
                });
            }).modal('toggle');
            modal.on('shown.bs.modal', function () {
                $('#filetree').treeview({
                    data: tree
                });
            });
        });
    });

    // Add line button.
    $('#add-line-button').on('click', function () {
        helpers.getModal('add-lang', 'Add Lang Entry', 'Add', $('<form/>', {
            'role': 'form'
        })
                // ID for the lang.
                .append(helpers.getInputGroup('lang-id', 'text', 'Lang ID', 'module.name.id'))
                // Resonse for the lang.
                .append(helpers.getTextAreaGroup('lang-response', 'text', 'Response', 'Response example!')), function () {
            const table = $('#langTable').DataTable(),
                    langId = $('#lang-id'),
                    langRes = $('#lang-response');

            switch (false) {
                case helpers.handleInputString(langId):
                case helpers.handleInputString(langRes):
                    break;
                default:
                    langId.val(langId.val().replace(/[^a-zA-Z0-9-\.]+/g, '-'));

                    table.row.add([
                        langId.val(),
                        langRes.val(),
                        $('<div/>', {
                            'class': 'btn-group'
                        }).append($('<button/>', {
                            'type': 'button',
                            'class': 'btn btn-xs btn-danger',
                            'style': 'float: right',
                            'data-id': langId.val(),
                            'data-response': langRes.val(),
                            'html': $('<i/>', {
                                'class': 'fa fa-trash'
                            })
                        })).append($('<button/>', {
                            'type': 'button',
                            'class': 'btn btn-xs btn-warning',
                            'style': 'float: right',
                            'data-id': langId.val(),
                            'data-response': langRes.val(),
                            'html': $('<i/>', {
                                'class': 'fa fa-edit'
                            })
                        })).html()
                    ]).draw();

                    // Close the modal.
                    $('#add-lang').modal('toggle');
                    // Alert the user.
                    toastr.success('Successfully added the lang entry.');
            }
        }).modal('toggle');
    });

    // Save button
    $('#save-button').on('click', function () {
        const datas = $('#langTable').DataTable().rows().data(),
                dataObj = [];

        for (let i = 0; i < datas.length; i++) {
            if (typeof datas[i] === 'object') {
                dataObj.push({
                    'id': datas[i][0],
                    'response': datas[i][1]
                });
            } else {
                // No longer data, break the loop.
                break;
            }
        }

        socket.doRemote('saveLang', 'saveLang', {
            'lang-path': currentLang,
            'content': JSON.stringify(dataObj)
        }, function (e) {
            if (e.length === 0 || e[0].errors === undefined) {
                toastr.success('Successfully saved the lang!');
            } else {
                toaster.error(e[0].errors[0].status + ' ' + e[0].errors[0].title + '<br>' + e[0].errors[0].detail, 'Failed to save the lang');
            }
        });
    });

    // Load lang function
    function loadLang(langArray) {
        const tableData = [];

        for (let i = 0; i < langArray.length; i++) {
            langArray[i]['response'] = langArray[i]['response'].replace(/\\'/g, '\'');

            tableData.push([
                langArray[i]['id'],
                langArray[i]['response'],
                $('<div/>', {
                    'class': 'btn-group'
                }).append($('<button/>', {
                    'type': 'button',
                    'class': 'btn btn-xs btn-danger',
                    'style': 'float: right',
                    'data-id': langArray[i]['id'],
                    'data-response': langArray[i]['response'],
                    'html': $('<i/>', {
                        'class': 'fa fa-trash'
                    })
                })).append($('<button/>', {
                    'type': 'button',
                    'class': 'btn btn-xs btn-warning',
                    'style': 'float: right',
                    'data-id': langArray[i]['id'],
                    'data-response': langArray[i]['response'],
                    'html': $('<i/>', {
                        'class': 'fa fa-edit'
                    })
                })).html()
            ]);
        }

        // if the table exists, destroy it.
        if ($.fn.DataTable.isDataTable('#langTable')) {
            $('#langTable').DataTable().clear().rows.add(tableData).invalidate().draw(false);
            return;
        }

        // Create table.
        let table = $('#langTable').DataTable({
            'searching': true,
            'autoWidth': false,
            'lengthChange': false,
            'paging': false,
            'data': tableData,
            'columnDefs': [
                {'className': 'default-table', 'orderable': false, 'targets': 2},
                {'width': '25%', 'targets': 0}
            ],
            'columns': [
                {'title': 'Lang ID'},
                {'title': 'Response'},
                {'title': 'Actions'}
            ]
        });

        // On delete button.
        table.on('click', '.btn-danger', function () {
            const row = $(this).parents('tr'),
                    id = $(this).data('id');

            // Ask the user if he wants to delete the lang.
            helpers.getConfirmDeleteModal('lang_modal_remove', 'Are you sure you want to remove this lang entry?', true,
                    'The land entry has been successfully removed!', function () { // Callback if the user clicks delete.
                        // Remove the table row.
                        table.row(row).remove().draw(false);
                    });
        });

        // On edit button.
        table.on('click', '.btn-warning', function () {
            const t = $(this);

            helpers.getModal('edit-lang', 'Edit Lang Entry', 'Edit', $('<form/>', {
                'role': 'form'
            })
                    // ID for the lang.
                    .append(helpers.getInputGroup('lang-id', 'text', 'Lang ID', '', t.data('id'), 'The ID of this lang.'))
                    // Resonse for the lang.
                    .append(helpers.getTextAreaGroup('lang-response', 'text', 'Response', '', t.data('response').replace(/\\'/g, '\''), 'The response of this lang.')), function () {
                let id = $('#lang-id'),
                        response = $('#lang-response');

                switch (false) {
                    case helpers.handleInputString(id):
                    case helpers.handleInputString(response):
                        break;
                    default:
                        // Update the special chars.
                        id = id.val().replace(/[^a-zA-Z0-9-\.]+/g, '-');

                        // Update the table.
                        $('#langTable').DataTable().row(t.parents('tr')).data([
                            id,
                            response.val(),
                            $('<div/>', {
                                'class': 'btn-group'
                            }).append($('<button/>', {
                                'type': 'button',
                                'class': 'btn btn-xs btn-danger',
                                'style': 'float: right',
                                'data-id': id,
                                'data-response': response.val(),
                                'html': $('<i/>', {
                                    'class': 'fa fa-trash'
                                })
                            })).append($('<button/>', {
                                'type': 'button',
                                'class': 'btn btn-xs btn-warning',
                                'style': 'float: right',
                                'data-id': id,
                                'data-response': response.val(),
                                'html': $('<i/>', {
                                    'class': 'fa fa-edit'
                                })
                            })).html()
                        ]).draw(false);

                        // Alert the user.
                        toastr.success('Successfully updated the lang response!');

                        // Close the modal.
                        $('#edit-lang').modal('toggle');
                }
            }).modal('toggle');
        });
    }

    function cleanLangID(obj) {
        return obj.val(obj.val().replace(/[^a-zA-Z0-9-\.]+/g, '-'));
    }

    // Load the table for now.
    loadLang([]);
});
