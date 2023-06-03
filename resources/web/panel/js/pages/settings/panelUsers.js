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
    let panelSections,
        permissionLevels;

    //Load Data
    socket.getPanelSections('get_panel_sections', function (res) {
        panelSections = res;
    });
    socket.getPanelPermissionLevels('get_panel_permission_levels', function (res) {
        permissionLevels = res;
    });

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

    const addDashboarDefaultPermissions = function (permissions){
        if (findSectionIndex(permissions, 'dashboard') === -1) {
            permissions.push({
                section: 'dashboard',
                permission: 'Read Only'
            });
        }
    };

    const getDisabledIconAttr = function (enabled) {
        return {
            class: 'fa disabled-status-icon ' + (enabled ? 'fa-check' : 'fa-ban text-muted'),
            title: enabled ? 'enabled' : 'disabled'
        };
    };

    const findSectionIndex = function (permissions, section) {
        for (let i = 0; i < permissions.length; i++) {
            if (permissions[i].section === section) {
                return i;
            }
        }

        return -1;
    };

    const getPermissionTableRow = function (section, permission) {
        return [helpers.capitalizeFirstLettersInString(section), permission,
                $('<div/>', {
                    'class': 'btn-group'
                })
                .append($('<button/>', {
                    'type': 'button',
                    'class': 'btn btn-xs btn-danger',
                    'data-section': section,
                    'html': $('<i/>', {
                        'class': 'fa fa-trash'
                    })})).html()];
    };

    //Fill the permissions table and remove permissions already assigned
    const getAvailableSectionsAndFillTable = function (userPermissionTable, permissions) {
        let availableSections = panelSections.slice(0);

        for (let i in permissions) {
            userPermissionTable.DataTable().row.add(getPermissionTableRow(permissions[i].section, permissions[i].permission));
            let index = availableSections.indexOf(permissions[i].section.toLowerCase());
            if (index >= 0) {
                availableSections.splice(index, 1);
            }
        }

        return availableSections;
    };

    const getPermissionTable = function (userPermissionTable, permissions) {
        if (!$.fn.dataTable.isDataTable(userPermissionTable)) {
            userPermissionTable.DataTable({
                'searching': false,
                'autoWidth': false,
                'lengthChange': false,
                'bPaginate': true,
                'data': [],
                'columnDefs': [
                    {'className': 'default-table', 'orderable': true, 'targets': [0, 1]},
                    {'width': '40%', 'targets': 0},
                    {'width': '20%', 'targets': 1},
                    {'className': 'text-center', 'width': '10%', 'targets': 2, 'orderable': false}
                ],
                'columns': [
                    {'title': 'Panel section'},
                    {'title': 'Permission'},
                    {'title': 'Actions'}
                ]
            });
        }

        let availableSections = getAvailableSectionsAndFillTable(userPermissionTable, permissions);
        if (availableSections.length === 0) {
            $('#userPermissionAdd-button').attr('disabled', true);
        }

        userPermissionTable.DataTable().draw();

        //Remove permission
        userPermissionTable.on('click', '.btn-danger', function () {
            let section = $(this).data('section');
            let idx = findSectionIndex(permissions, section);
            if (idx === -1) {
                return;
            }

            availableSections.push(section);
            if (availableSections.length > 0) {
                $('#userPermissionAdd-button').attr('disabled', false);
            }

            permissions.splice(idx, 1);
            userPermissionTable.DataTable().row($(this).parents('tr')).remove().draw();
        });

        //Add permission
        $('#userPermissionAdd-button').on('click', function () {
            helpers.getModal('add-user-perm', 'Add Panel User Permission', 'Add', $('<form/>', {
                'role': 'form'
            })
            .append(helpers.getDropdownGroup('perm-level', 'Access permission', permissionLevels[0].permission, permissionLevels.map(perm => perm.permission), 'Access permission for the panel user. "Full Access" allows modification and sending commands as well as messages. "Read Only" only allows to read settings'))
            .append(helpers.getCheckBox('user-level-all', false, 'All Sections?', 'If checked, access permission will be set for all panel sections (except panel user management).'))
            .append(helpers.getDropdownGroup('panel-section', 'Panel section', availableSections[0], availableSections, 'Panel section. Some features will not be available even with "Full Access" permissions including panel user management and restarting the bot')),
            function () {
                let selectedPerm = $('#perm-level').find(':selected').text(),
                        selectedSection = $('#panel-section').find(':selected').text(),
                        allSections = $('#user-level-all').is(':checked');

                if (allSections) { //Add all available sections
                    for (let section in availableSections) {
                        permissions.push({
                            section: availableSections[section],
                            permission: selectedPerm
                        });

                        userPermissionTable.DataTable().row.add(getPermissionTableRow(availableSections[section], selectedPerm));
                    }

                    availableSections = [];
                } else { //Add single section
                    permissions.push({
                        section: selectedSection,
                        permission: selectedPerm
                    });
                    userPermissionTable.DataTable().row.add(getPermissionTableRow(selectedSection, selectedPerm));
                    availableSections.splice(availableSections.indexOf(selectedSection), 1);
                }

                if (availableSections.length === 0) {
                    $('#userPermissionAdd-button').attr('disabled', true);
                }

                userPermissionTable.DataTable().draw();
                $('#add-user-perm').modal('hide');
            }).on('shown.bs.modal', function () {
                let checkBox = $('#user-level-all');
                checkBox.on('change', function (e) {
                    if (e.target.checked) {
                        $('#panel-section').closest('.form-group').hide();
                    } else {
                        $('#panel-section').closest('.form-group').show();
                    }
                });

            }).modal('toggle');
        });
    };

    const getPermissionTableHTML = function () {
        return $('<div/>', {
                    'class': 'form-group',
                    'style': 'border-top: 1px solid #424242; margin-top: 15px; padding-top:15px'
                })
                .append($('<label/>', {
                    'html': '<b>Permissions</b>'
                }))
                .append($('<button/>', {
                    'class': 'btn btn-primary btn-sm pull-right',
                    'type': 'button',
                    'id': 'userPermissionAdd-button',
                    'html': '<i class="fa fa-plus"></i>&nbsp; Add permission'
                }))
                .append($('<table/>', {
                    'id': 'user-permissions-table',
                    'class': 'table table-bordered table-hover'
                }))
                .append($('<b/>', {
                    'text': 'Dashboard "read only"-permissions will be added automatically if no specific dashboard permissions are provided!'
                }));
    };

    const getPermissionShortString = function (permissions) {
        let fullAccessCounter = 0,
                readOnlyCounter = 0;
        for (let i in permissions) {
            if (permissions[i].permission === 'Full Access') {
                fullAccessCounter++;
            } else if (permissions[i].permission === 'Read Only') {
                readOnlyCounter++;
            }
        }

        return 'Full Access: ' + fullAccessCounter + '<br> Read Only: ' + readOnlyCounter;
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
                    getPermissionShortString(user.permission),
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
                    {'width': '31%', 'targets': 0},
                    {'width': '15%', 'searchable': false, 'targets': 1},
                    {'width': '18%', 'searchable': false, 'targets': [2, 3]},
                    {'width': '125px', 'searchable': false, 'targets': [4, 5]}
                ],
                'columns': [
                    {'title': 'Username'},
                    {'title': 'Permissions'},
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
                let username = $(this).data('username'),
                    permissions = [];

                socket.getPanelUser('get_panel_user', username, function (res) {
                    if (res.error !== undefined) {
                        toastr.error(res.error);
                        return;
                    }

                    permissions = res.permission;
                    helpers.getModal('edit-panelUser', 'Edit Panel User', 'Save', $('<form/>', {
                        'role': 'form'
                    })
                    .append(helpers.getInputGroup('user-name', 'text', 'Username', '', res.username, 'Login name / username of the panel user.'))
                    .append(helpers.getCheckBox('user-enabled', res.isEnabled, 'Enabled', 'If unchecked, the user cannot log in.'))
                    .append(getPermissionTableHTML()),
                    function () {
                        let user = $('#user-name'),
                                enabled = $('#user-enabled').is(':checked');

                        switch (false) {
                            case helpers.handleInputString(user):
                                break;
                            default:
                                addDashboarDefaultPermissions(permissions);
                                socket.editPanelUser('edit_panel_user', username, user.val(), JSON.stringify(permissions), enabled, function (res2) {
                                    if (res2.error !== undefined) {
                                        toastr.error(res2.error);
                                        return;
                                    }

                                    loadPanelUsers();
                                    $('#edit-panelUser').modal('hide');
                                    toastr.success(res2.success);
                                });
                        }
                    }).on('shown.bs.modal', function () {
                        let userPermissionTable = $('#user-permissions-table');
                        getPermissionTable(userPermissionTable, permissions);
                    }).modal('toggle');
                });
            });
        });
    };

    loadPanelUsers();

    $('#panelUserAdd-button').on('click', function () {
        let permissions = [];
        helpers.getModal('add-panel-user', 'Add Panel User', 'Save', $('<form/>', {
            'role': 'form'
        })
        .append(helpers.getInputGroup('user-name', 'text', 'Username', 'Phantom', '', 'Login name / username of the panel user.'))
        .append(helpers.getCheckBox('user-enabled', true, 'Enabled', 'If unchecked, the user cannot log in.'))
        .append(getPermissionTableHTML()),
        function () {
            let username = $('#user-name'),
                    enabled = $('#user-enabled').is(':checked');

            switch (false) {
                case helpers.handleInputString(username):
                    break;
                default:
                    addDashboarDefaultPermissions(permissions);
                    socket.addPanelUser('add_panel_user', username.val(), JSON.stringify(permissions), enabled, function (res) {

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
        }).on('shown.bs.modal', function () {
            let userPermissionTable = $('#user-permissions-table');
            getPermissionTable(userPermissionTable, permissions);
        }).modal('toggle');
    });
});
