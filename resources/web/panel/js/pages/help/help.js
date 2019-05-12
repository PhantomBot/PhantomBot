/*
 * Copyright (C) 2016-2018 phantombot.tv
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
	// Get the version
	socket.getBotVersion('get_panel_info_version', function(e) {
		// Set bot version
		$('#panel-bot-version').html(e['version'].substring(20));
		// Set the java version.
		$('#panel-java-version').html(e['java-version']);
		// Set the OS version.
		$('#panel-os-version').html(e['os-version']);
		// Set the panel version.
		$('#panel-version-number').html(helpers.PANEL_VERSION);
	});
});

// Function that handlers the loading of events.
$(function() {
	// On search button.
	$('#forum-search').on('click', function() {
		let search = $('#forum-search-text').val();

		// Make sure that there's something in the box.
		if (search.length > 0) {
			window.open('https://community.phantombot.tv/search?q=' + encodeURI(search));

			// Remove the box content.
			$('#forum-search-text').val('');
		}
	});

	// If the user clicks enter.
	$('#forum-search-text').on('keypress', function(e) {
		if (e.which === 13) {
			let search = $('#forum-search-text').val();

			// Make sure that there's something in the box.
			if (search.length > 0) {
				window.open('https://community.phantombot.tv/search?q=' + encodeURI(search));

				// Remove the box content.
				$('#forum-search-text').val('');
			}
		}
	});
});
