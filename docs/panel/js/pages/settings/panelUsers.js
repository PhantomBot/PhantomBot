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

/* global toastr */

$(function () {
    const newPasswordModal = function (password) {
        return helpers.getModal('add-panel-user-pwd', 'New user password', undefined, $('<form/>', {
            'role': 'form'
        })
        .append($('<div/>', {
            'class': 'form-group'
        }).append($('<div/>', {
            'html': $('<b/>', {
                'text': 'We\'ve created a random password which the new user can use to login. The user will be requested to change the password during their first login.'
            })
        })).append($('<div/>', {
            'html': $('<b/>', {
                'text': password
            }),
            'style': 'text-align: center; margin-top:50px'
        }))), undefined, {
            canceltext: 'OK',
            cancelclass: 'btn-primary',
            blockClosing: true
        });
    };

    const getDisabledIconAttr = function (enabled) {
        return {
            class: 'fa disabled-status-icon ' + (enabled ? 'fa-check' : 'fa-ban text-muted'),
            title: enabled ? 'enabled' : 'disabled'
        };
    };

    const panelUsersTable = $('#panelUsersTable');

    const loadPanelUsers = function () {
        socket.getAllPanelUsers('get_panel_users', function (panelUsers) {
            let tableData = [];

            for (let user of panelUsers) {
                if (user.username === helpers.currentPanelUserData.username){
                    continue;
                }

                let lastLogon = 'Never';
                if (parseInt(user.lastLogin) !== -1) {
                    lastLogon = helpers.getDateStringFromDate(new Date(parseInt(user.lastLogin)));
                }

                tableData.push([
                    user.username,
                    user.permission,
                    lastLogon,
                    helpers.getDateStringFromDate(new Date(parseInt(user.creationDate))),
                    $('<div/>')
                    .append($('<i/>',
                        getDisabledIconAttr(user.isEnabled)
                    )).html(),
                    $('<div/>', {
                        'class': 'btn-group'
                    })
                    .append($('<button/>', {
                        'type': 'button',
                        'class': 'btn btn-xs btn-danger',
                        'style': 'float: right',
                        'data-username': user.username,
                        'html': $('<i/>', {
                            'class': 'fa fa-trash'
                        })
                    })).append($('<button/>', {
                        'type': 'button',
                        'class': 'btn btn-xs btn-success',
                        'style': 'float: right',
                        'data-username': user.username,
                        'html': $('<i/>', {
                            'class': 'fa fa-rotate-left'
                        })
                    })).append($('<button/>', {
                        'type': 'button',
                        'class': 'btn btn-xs btn-warning',
                        'style': 'float: right',
                        'data-username': user.username,
                        'html': $('<i/>', {
                            'class': 'fa fa-edit'
                        })
                    })).html()
                ]);
            }

            if ($.fn.DataTable.isDataTable('#panelUsersTable')) {
                panelUsersTable.DataTable().clear().rows.add(tableData).invalidate().draw(false);
                return;
            }

            let table = panelUsersTable.DataTable({
                'searching': true,
                'autoWidth': false,
                'lengthChange': false,
                'data': tableData,
                'columnDefs': [
                    {'className': 'default-table', 'orderable': false, 'targets': [4, 5]},
                    {'width': '25%', 'targets': 0},
                    {'width': '11%', 'searchable': false, 'targets': 1},
                    {'width': '11%', 'searchable': false, 'targets': [2, 3]},
                    {'width': '0%', 'searchable': false, 'targets': 4},
                    {'width': '10%', 'searchable': false, 'targets': 5}
                ],
                'columns': [
                    {'title': 'Username'},
                    {'title': 'Permission'},
                    {'title': 'Last login'},
                    {'title': 'Creation date'},
                    {'title': 'Status'},
                    {'title': 'Actions'}
                ]
            });

            //Password reset
            table.on('click', '.btn-success', function () {
                let username = $(this).data('username');
                helpers.getConfirmDeleteModal('reset_panel_user_pwd_modal', 'Are you sure you want to reset ' + username + '\'s password?', false,
                    username + '\'s password has been successfully reset!', function () {
                        socket.resetPanelUserPWD('reset_panel_user_pwd', username, function (res) {
                            if (res.error !== undefined) {
                                toastr.error(res.error);
                                return {
                                    message: res.error,
                                    icon: 'error'
                                };
                            }

                            toastr.success('Successfully reset user password');
                            newPasswordModal(res.success).modal( {
                                keyboard: false,
                                backdrop: 'static'
                            });
                        });
                    }, {deleteText: 'Reset password'});
            });

            //Delete
            table.on('click', '.btn-danger', function () {
                let username = $(this).data('username');

                helpers.getConfirmDeleteModal('delete_panel_user_modal', 'Are you sure you want to remove the panel user ' + username + '?', false,
                    'Panel access for user ' + username + ' has been successfully removed!', function () {
                        socket.deletePanelUser('delete_panel_user', username, function (res) {
                            if (res.error !== undefined) {
                                toastr.error(res.error);
                                return {
                                    message: res.error,
                                    icon: 'error'
                                };
                            }

                            loadPanelUsers();
                            toastr.success(res.success);
                        });
                    });
            });

            //Edit
            table.on('click', '.btn-warning', function () {
                let username = $(this).data('username');

                socket.getPanelUser('get_panel_user', username, function (res) {
                    if (res.error !== undefined) {
                        toastr.error(res.error);
                        return;
                    }

                    helpers.getModal('edit-panelUser', 'Edit Panel User', 'Save', $('<form/>', {
                        'role': 'form'
                    })
                    .append(helpers.getInputGroup('user-name', 'text', 'Username', '', res.username, 'Login name / username of the panel user.'))
                    .append(helpers.getDropdownGroup('user-permission', 'Permission', res.permission, ['Full Access', 'Read Only'], 'Access permission for the panel user. Full Access does not allow setting up the bot nor changing the oauth settings.'))
                    .append(helpers.getCheckBox('user-enabled', res.isEnabled, 'Enabled', 'If unchecked, the user cannot log in.')),
                    function () {
                        let user = $('#user-name'),
                                permission = $('#user-permission').find(':selected').text(),
                                enabled = $('#user-enabled').is(':checked');

                        switch (false) {
                            case helpers.handleInputString(user):
                                break;
                            default:
                                socket.editPanelUser('edit_panel_user', username, user.val(), permission, enabled, function (res2) {
                                    if (res2.error !== undefined) {
                                        toastr.error(res2.error);
                                        return;
                                    }

                                    loadPanelUsers();
                                    $('#edit-panelUser').modal('hide');
                                    toastr.success(res2.success);
                                });
                        }
                    }).modal('toggle');
                });
            });
        });
    };

    loadPanelUsers();

    $('#panelUserAdd-button').on('click', function () {
        helpers.getModal('add-panel-user', 'Add Panel User', 'Save', $('<form/>', {
            'role': 'form'
        })
        .append(helpers.getInputGroup('user-name', 'text', 'Username', 'Phantom', '', 'Login name / username of the panel user.'))
        .append(helpers.getDropdownGroup('user-permission', 'Permission', 'Full Access', ['Full Access', 'Read Only'], 'Access permission for the panel user. Full Access does not allow setting up the bot, changing the oauth settings, or accessing the panel users management page.'))
        .append(helpers.getCheckBox('user-enabled', true, 'Enabled', 'If unchecked, the user cannot log in.')),
        function () {
            let username = $('#user-name'),
                    permission = $('#user-permission').find(':selected').text(),
                    enabled = $('#user-enabled').is(':checked');

            switch (false) {
                case helpers.handleInputString(username):
                    break;
                default:
                    socket.addPanelUser('add_panel_user', username.val(), permission, enabled, function (res) {

                        if (res.error !== undefined) {
                            toastr.error(res.error);
                            return;
                        }

                        loadPanelUsers();
                        $('#add-panel-user').modal('hide');
                        toastr.success('Successfully added new panel user!');
                        newPasswordModal(res.success).modal({
                            keyboard: false,
                            backdrop: 'static'
                        });
                    });
            }
        }).modal('toggle');
    });
});
