/*
 * Copyright (C) 2016-2025 phantombot.github.io/PhantomBot
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
    socket.getDBTableValues('get_all_clipit', 'clipit', function (results) {
        let clipit = [];

        for (let i = 0; i < results.length; i++) {
            let id = results[i].key;
            let value = results[i].value;

            // Make sure that it's a json object.
            if (value.startsWith('{') && value.endsWith('}')) {
                // Just to be safe, we'll add a try catch.
                try {
                    let json = JSON.parse(value);

                    clipit.push([
                            '<abbr title="' + (json.creator_login.replaceAll('"', '')) + ' (' + json.creator_id + ')">' + json.creator_displayname + '</abbr>',
                            helpers.getPaddedDateString(new Date(parseInt(json.timestamp)).toLocaleString()),
                            json.title === undefined || json.title === null ? '' : json.title,
                            json.duration === undefined || json.duration === null ? '30s' : json.duration + 's',
                            parseInt(json.timestamp) + 86400000 >= Date.now() ? '<a href="' + json.edit_url + '" target="_blank">Edit</a>' : 'Expired',
                            '<a href="https://clips.twitch.tv/' + id + '" target="_blank">' + id + '</a>',
                            parseInt(json.timestamp)
                        ]);
                } catch (ex) {
                    helpers.logError('Failed to parse clipit [' + value + ']: ' + ex.stack, helpers.LOG_TYPE.FORCE);
                }
            }
        }

        // Create table.
        $('#clipitHistoryTable').DataTable({
            'searching': true,
            'autoWidth': false,
            'data': clipit,
            'order': [[6, 'desc']],
            'columns': [
                {'title': 'Username'},
                {'title': 'Date', 'orderData': [6]},
                {'title': 'Title'},
                {'title': 'Duration'},
                {'title': 'Edit URL'},
                {'title': 'View URL'},
                {'visible': false}
            ]
        });
    });
});
