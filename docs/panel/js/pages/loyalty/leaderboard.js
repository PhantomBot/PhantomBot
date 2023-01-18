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
$(function () {
    // Get top points.
    socket.getDBTableValuesByOrder('points_top_get_order', 'points', 100, 0, 'DESC', true, function (results) {
        let tableData = [];

        for (let i = 0; i < results.length; i++) {
            tableData.push([
                (i + 1),
                results[i].key,
                helpers.parseNumber(results[i].value)
            ]);
        }

        // if the table exists, destroy it.
        if ($.fn.DataTable.isDataTable('#leaderboard-points')) {
            $('#leaderboard-points').DataTable().clear().rows.add(tableData).invalidate().draw(false);
            return;
        }

        // Create table.
        $('#leaderboard-points').DataTable({
            'searching': true,
            'autoWidth': false,
            'lengthChange': false,
            'data': tableData,
            'pageLength': 15,
            'columnDefs': [
                {'width': '15%', 'targets': 0}
            ],
            'columns': [
                {'title': 'Position'},
                {'title': 'Username'},
                {'title': 'Currency'}
            ]
        });

        // Set the title again in case this is a reload.
        $('#currency-top-title').html('Top 100 Currency');
    });

    // Get top time.
    socket.getDBTableValuesByOrder('time_top_get_order', 'time', 100, 0, 'DESC', true, function (results) {
        let tableData = [];

        for (let i = 0; i < results.length; i++) {
            tableData.push([
                (i + 1),
                results[i].key,
                helpers.parseNumber(results[i].value),
                helpers.parseNumber(Math.floor(parseInt(results[i].value) / 3600))
            ]);
        }

        // if the table exists, destroy it.
        if ($.fn.DataTable.isDataTable('#leaderboard-time')) {
            $('#leaderboard-time').DataTable().clear().rows.add(tableData).invalidate().draw(false);
            return;
        }

        // Create table.
        $('#leaderboard-time').DataTable({
            'searching': true,
            'autoWidth': false,
            'lengthChange': false,
            'data': tableData,
            'pageLength': 15,
            'columnDefs': [
                {'width': '15%', 'targets': 0},
                {'width': '25%', 'targets': 1}
            ],
            'columns': [
                {'title': 'Position'},
                {'title': 'Username'},
                {'title': 'Time (Seconds)'},
                {'title': 'Time (Hours)'}
            ]
        });

        // Set the title again in case this is a reload.
        $('#loyalty-top-title').html('Top 100 Loyalty');
    });
});

// Function that handlers the loading of events.
$(function () {
    var currencyOffset = 100,
            loyaltyOffset = 100;

    // On load more points button.
    $('#currency-load-more').on('click', function () {
        let table = $('#leaderboard-points').DataTable(),
                dataCount = table.rows().count(),
                tableData = [];

        // Only allow more data to be loaded once the last click was fully loaded.
        if (currencyOffset === dataCount) {
            toastr.success('Loading more users into the currency table.');

            // Get the next 100 users.
            socket.getDBTableValuesByOrder('points_top_get_order_btn', 'points', 100, (currencyOffset + 100), 'DESC', true, function (results) {
                for (let i = 0; i < results.length; i++) {
                    tableData.push([
                        (++currencyOffset),
                        results[i].key,
                        helpers.parseNumber(results[i].value)
                    ]);
                }

                // Add the rows.
                table.rows.add(tableData).draw(false);
                // Edit the title.
                $('#currency-top-title').html('Top ' + helpers.parseNumber(currencyOffset) + ' Currency');
            });
        } else {
            toastr.error('Cannot load more points since there are currently some being loaded.');
        }
    });

    // On load more time button.
    $('#loyalty-load-more').on('click', function () {
        let table = $('#leaderboard-time').DataTable(),
                dataCount = table.rows().count(),
                tableData = [];

        // Only allow more data to be loaded once the last click was fully loaded.
        if (loyaltyOffset === dataCount) {
            toastr.success('Loading more users into the loyalty table.');

            // Get the next 100 users.
            socket.getDBTableValuesByOrder('time_top_get_order_btn', 'time', 100, (loyaltyOffset + 100), 'DESC', true, function (results) {
                for (let i = 0; i < results.length; i++) {
                    tableData.push([
                        (++loyaltyOffset),
                        results[i].key,
                        helpers.parseNumber(results[i].value),
                        helpers.parseNumber(Math.floor(parseInt(results[i].value) / 3600))
                    ]);
                }

                // Add the rows.
                table.rows.add(tableData).draw(false);
                // Edit the title.
                $('#loyalty-top-title').html('Top ' + helpers.parseNumber(loyaltyOffset) + ' Loyalty');
            });
        } else {
            toastr.error('Cannot load more time since there are currently some being loaded.');
        }
    });
});
