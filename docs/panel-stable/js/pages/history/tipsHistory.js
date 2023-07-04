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
    socket.getDBTableValues('get_all_tips', 'donations', function (results) {
        let tips = [];

        for (let i = 0; i < results.length; i++) {
            let value = results[i].value;

            // Make sure that it's a json object.
            if (value.startsWith('{') && value.endsWith('}')) {
                // Just to be safe, we'll add a try catch.
                try {
                    let json = JSON.parse(value);

                    // Since we don't store what service the tip came from.
                    // We have to guess.
                    switch (true) {
                        case json.currency !== undefined && json.name !== undefined:
                            tips.push([
                                json.name,
                                helpers.getPaddedDateString(new Date(parseInt(json.created_at) * 1e3).toLocaleString()),
                                json.currency + ' ' + parseFloat(json.amount).toFixed(2),
                                'StreamLabs',
                                parseInt(json.created_at) * 1e3
                            ]);
                            break;
                        case json.parameters !== undefined:
                            tips.push([
                                json.parameters.username,
                                helpers.getPaddedDateString(new Date(json.created_at.substring(0, json.created_at.indexOf('+'))).toLocaleString()), // We remove the +0200 because Safari doesn't like it.
                                json.parameters.currency + ' ' + parseFloat(json.parameters.amount).toFixed(2),
                                'TipeeeStream',
                                new Date(json.created_at.substring(0, json.created_at.indexOf('+'))).getTime()
                            ]);
                            break;
                        case json.createdAt !== undefined && json.donation !== undefined:
                            tips.push([
                                json.donation.user.username,
                                helpers.getPaddedDateString(new Date(json.createdAt).toLocaleString()),
                                json.donation.currency + ' ' + parseFloat(json.donation.amount).toFixed(2),
                                'StreamElements',
                                new Date(json.createdAt).getTime()
                            ]);
                            break;
                        case json.user !== undefined && json.user.name !== undefined:
                            tips.push([
                                json.user.name,
                                helpers.getPaddedDateString(new Date(json.date).toLocaleString()),
                                json.currencyCode + ' ' + parseFloat(json.amount).toFixed(2),
                                'StreamTip',
                                new Date(json.date).getTime()
                            ]);
                            break;
                    }
                } catch (ex) {
                    helpers.logError('Failed to parse tip [' + value + ']: ' + ex.stack, helpers.LOG_TYPE.FORCE);
                }
            }
        }

        // Create table.
        $('#tipsHistoryTable').DataTable({
            'searching': true,
            'autoWidth': false,
            'data': tips,
            'columnDefs': [
                {'width': '30%', 'targets': 0}
            ],
            'columns': [
                {'title': 'Username'},
                {'title': 'Date', 'orderData': [4]},
                {'title': 'Amount'},
                {'title': 'Tipping Service'},
                {'visible': false}
            ]
        });
    });
});
