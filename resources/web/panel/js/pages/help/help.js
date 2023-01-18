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
    // Get the version
    socket.getBotVersion('get_panel_info_version', function (e) {
        // Set bot version
        $('#panel-bot-version').html(e['version'].substring(20));
        // Set the java version.
        $('#panel-java-version').html(e['java-version']);
        // Set the OS version.
        $('#panel-os-version').html(e['os-version']);
    });
});
