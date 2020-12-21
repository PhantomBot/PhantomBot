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
	socket.getDBTableValues('get_all_follows_by_date', 'followedDate', function(results) {

		socket.wsEvent()
		let follows = [];

		for (let i = 0; i < results.length; i++) {
			let follow = results[i];

			console.log(follow.key)

			let name = follow.key;
			let date = new Date(follow.value);
			let month = ((date.getMonth() + 1)<10? '0'+ (date.getMonth() + 1):''+(date.getMonth() + 1));
			let day = ((date.getDate() + 1)<10? '0'+ (date.getDate() + 1):''+(date.getDate() + 1));

			follows.push([
				name,
				date.getFullYear()+'-'+month+'-'+day,
				'<button type="button" className="btn btn-primary pull-right" id="follows-btn-replay-'+name+'" data="'+name+'">Replay</button>'
			]);

		}



		// Create table.
		$('#followsHistoryTable').DataTable({
			'searching': true,
			'autoWidth': false,
			'data': follows,
			'columnDefs': [
				{ 'width': '30%', 'targets': 0 }
			],
			'columns': [
				{ 'title': 'Username', 'orderData' : [1], 'order' : [0, 'desc'] },
				{ 'title': 'Date' },
				{ 'title': 'Replay' },
				// { 'title': 'Tipping Service' },
				// { 'visible': false }
			]
		});

		for (let i = 0; i < results.length; i++) {
			let follow = results[i];
			let name = follow.key;
			console.log(name);
			console.log($('#follows-btn-replay-'+name));
			$('#follows-btn-replay-'+name).on('click', function() {
				// Update title.
				console.log($('#follows-btn-replay-'+name))
				socket.sendCommand('replay_follow', 'replayfollow '+name, function() {
					toastr.success('Successfully replayed');
				});
			});

		}

	});
});