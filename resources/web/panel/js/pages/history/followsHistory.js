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

	let followingOffset = 0

	/**
	 *
	 * @param results
	 */
	function createClickButtonEvents(results) {
		for (let i = 0; i < results.length; i++) {
			let follow = results[i];
			let name = follow.key;
			$('#follows-btn-replay-' + name).off();
			if ($('#follows-btn-replay-' + name).length) {
				$('#follows-btn-replay-' + name).on('click', function () {
					socket.sendCommand('replay_follow', 'replayfollow ' + name, function () {
						toastr.success('Successfully replayed');
					});
				});
			}

		}
	}

	function pushDataIntoTable(results) {
		followingOffset = followingOffset + FOLLOW_STEP;
		let follows = [];

		for (let i = 0; i < results.length; i++) {
			let follow = results[i];
			let name = follow.key;
			let date = new Date(follow.value);
			let month = ((date.getMonth() + 1) < 10 ? '0' + (date.getMonth() + 1) : '' + (date.getMonth() + 1));
			let day = ((date.getDate()) < 10 ? '0' + (date.getDate()) : '' + (date.getDate()));

			follows.push([
				name,
				date.getFullYear() + '-' + month + '-' + day,
				'<button type="button" className="btn btn-primary pull-right" id="follows-btn-replay-' + name + '" data="' + name + '">Replay</button>'
			]);

		}

		$('#followsHistoryTable').on( 'draw.dt', function () {
			createClickButtonEvents(results);
		} );

		return follows;
	}

	socket.getDBTableValuesByOrder('get_all_follows_by_date', 'followedDate', FOLLOW_STEP, followingOffset, 'DESC', true, function(results) {

		let follows = pushDataIntoTable(results);

		// Create table.
		$('#followsHistoryTable').DataTable({
			'searching': true,
			'autoWidth': false,
			'data': follows,
			'pageLength': 10,
			'columnDefs': [
				{ 'width': '30%', 'targets': 0 }
			],
			'columns': [
				{ 'title': 'Username', 'orderData' : [1], 'order' : [0, 'desc'] },
				{ 'title': 'Date' },
				{ 'title': 'Replay' },
			]
		});

		createClickButtonEvents(results);
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
				follows = pushDataIntoTable(results);

				// Add the rows.
				table.rows.add(follows).draw(false);

				createClickButtonEvents(results);
			});
		} else {
			toastr.error('Cannot load more time since there are currently some being loaded.');
		}
	});

});