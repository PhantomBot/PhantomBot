/*
 * Copyright (C) 2016-2022 phantombot.github.io/PhantomBot
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
	socket.getDBTableValues('get_all_hosts', 'hosthistory', function(results) {
		let hosts = [];

		for (let i = 0; i < results.length; i++) {
			let json = JSON.parse(results[i].value);

			hosts.push([
				json.host,
				new Date(parseInt(json.time)).toLocaleString(),
				helpers.getDefaultIfNullOrUndefined(json.viewers, 'N/A'),
				parseInt(json.time)
			]);
		}

		// Create table.
		$('#hostHistoryTable').DataTable({
			'searching': true,
			'autoWidth': false,
			'data': hosts,
			'columnDefs': [
    			{ 'width': '35%', 'targets': 0 }
    		],
			'columns': [
				{ 'title': 'Username' },
				{ 'title': 'Date', 'orderData': [3] },
				{ 'title': 'Viewers' },
				{ 'visible': false }
			]
		});
	});
});
