/*
 * Copyright (C) 2016-2020 phantombot.github.io/PhantomBot
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

    const FOLLOW_STEP = 100;

    let followingOffset = 0;

    function prepareDataForTable(results) {
        followingOffset = followingOffset + FOLLOW_STEP;
        let follows = [];

        for (let i = 0; i < results.length; i++) {
            let follow = results[i];
            let name = follow.key;
            let date = new Date(follow.value);

            follows.push([
                name,
                date,
                $('<div/>', {
                    'class': 'btn-group'
                }).append($('<button/>', {
                    'type': 'button',
                    'id': 'follows-btn-replay-' + name,
                    'data-follow': name,
                    'class': 'btn btn-xs btn-info',
                    'style': 'float: right',
                    'html': $('<i/>', {
                        'class': 'fa fa-refresh'
                    }),
                    'title': 'Replay alert !'
                })).html()
            ]);

        }

        return follows;
    }

    socket.getDBTableValuesByOrder('get_all_follows_by_date', 'followedDate', FOLLOW_STEP, followingOffset, 'DESC', true, function(results) {

        let follows = prepareDataForTable(results);

        // Create table.
        let table = $('#followsHistoryTable').DataTable({
            'searching': true,
            'autoWidth': false,
            'data': follows,
            'pageLength': 10,
            'order': [[ 1, "desc" ]],
            'columnDefs': [
                {
                    'width': '35%',
                    'targets': 0
                },
                {
                    'width': '35%',
                    'targets': 1,
                    'createdCell': function (td, cellData) {
                        $(td).attr('data-sort', new Date(cellData).toISOString()).text(new Date(cellData).toLocaleString())
                    }
                }

            ],
            'columns': [
                { 'title': 'Username' },
                { 'title': 'Date' },
                { 'title': 'Actions' }
            ]
        });

        table.on('click', '.btn-info', function() {
            let follow = $(this).data('follow');

            socket.sendCommand('replay_follow', 'replayfollow ' + follow, function () {
                toastr.success('Successfully replayed');
            });
        });
    });

    // On load more time button.
    $('#follows-history-load-more').on('click', function() {
        let table = $('#followsHistoryTable').DataTable(),
            dataCount = table.rows().count(),
            follows = [];
        // Only allow more data to be loaded once the last click was fully loaded.
        if (followingOffset === dataCount) {
            toastr.success('Loading more users into the follows table.');
            // Get the next 100 users.
            socket.getDBTableValuesByOrder('get_all_follows_by_date', 'followedDate', FOLLOW_STEP, followingOffset, 'DESC', true, function(results) {
                follows = prepareDataForTable(results);

                // Add the rows.
                table.rows.add(follows).draw(false);
            });
        } else {
            toastr.error('Cannot load more time since there are currently some being loaded.');
        }
    });

});