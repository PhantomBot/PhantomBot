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
$(function() {
    // Get top points.
    socket.getDBTableValuesByOrder('points_top_get_order', 'points', 100, 0, 'DESC', true, function(results) {
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
            $('#leaderboard-points').DataTable().destroy();
            // Remove all of the old events.
            $('#leaderboard-points').off();
        }

        // Create table.
        $('#leaderboard-points').DataTable({
            'searching': true,
            "language": {
                "url": "//cdn.datatables.net/plug-ins/1.10.19/i18n/German.json"
            },
            'autoWidth': false,
            'lengthChange': false,
            'data': tableData,
            'pageLength': 15,
            'columnDefs': [
                { 'width': '15%', 'targets': 0 }
            ],
            'columns': [
                { 'title': 'Position' },
                { 'title': 'Benutzername' },
                { 'title': 'Punkte' }
            ]
        });

        // Set the title again in case this is a reload.
        $('#currency-top-title').html('Top 100 Punkte');
    });

    // Get top time.
    socket.getDBTableValuesByOrder('time_top_get_order', 'time', 100, 0, 'DESC', true, function(results) {
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
            $('#leaderboard-time').DataTable().destroy();
            // Remove all of the old events.
            $('#leaderboard-time').off();
        }

        // Create table.
        $('#leaderboard-time').DataTable({
            'searching': true,
            "language": {
                "url": "//cdn.datatables.net/plug-ins/1.10.19/i18n/German.json"
            },
            'autoWidth': false,
            'lengthChange': false,
            'data': tableData,
            'pageLength': 15,
            'columnDefs': [
                { 'width': '15%', 'targets': 0 },
                { 'width': '25%', 'targets': 1 }
            ],
            'columns': [
                { 'title': 'Position' },
                { 'title': 'Benutzername' },
                { 'title': 'Zeit (Sekunden)' },
                { 'title': 'Zeit (Stunden)' }
            ]
        });

        // Set the title again in case this is a reload.
        $('#loyalty-top-title').html('Top 100 Loyalität');
    });
});

// Function that handlers the loading of events.
$(function() {
    var currencyOffset = 100,
        loyaltyOffset = 100;

    // On load more points button.
    $('#currency-load-more').on('click', function() {
        let table = $('#leaderboard-points').DataTable({
                "language": {
                    "url": "//cdn.datatables.net/plug-ins/1.10.19/i18n/German.json"
                }}),
            dataCount = table.rows().count(),
            tableData = [];

        // Only allow more data to be loaded once the last click was fully loaded.
        if (currencyOffset === dataCount) {
            toastr.success('Laden von mehr Benutzern in die Punkte-Tabelle.');

            // Get the next 100 users.
            socket.getDBTableValuesByOrder('points_top_get_order_btn', 'points', 100, (currencyOffset + 100), 'DESC', true, function(results) {
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
                $('#currency-top-title').html('Top ' + helpers.parseNumber(currencyOffset) + ' Punkte');
            });
        } else {
            toastr.error('Es können nicht mehr Punkte geladen werden, da derzeit einige geladen werden.');
        }
    });

    // On load more time button.
    $('#loyalty-load-more').on('click', function() {
        let table = $('#leaderboard-time').DataTable({
                "language": {
                    "url": "//cdn.datatables.net/plug-ins/1.10.19/i18n/German.json"
                }
            }),
            dataCount = table.rows().count(),
            tableData = [];

        // Only allow more data to be loaded once the last click was fully loaded.
        if (loyaltyOffset === dataCount) {
            toastr.success('Laden von mehr Benutzern in die Loyalitätstabelle.');

            // Get the next 100 users.
            socket.getDBTableValuesByOrder('time_top_get_order_btn', 'time', 100, (loyaltyOffset + 100), 'DESC', true, function(results) {
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
                $('#loyalty-top-title').html('Top ' + helpers.parseNumber(loyaltyOffset) + ' Loyalität');
            });
        } else {
            toastr.error('Kann nicht mehr Zeiten laden, da derzeit einige geladen werden.');
        }
    });
});
