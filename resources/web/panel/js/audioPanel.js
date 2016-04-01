/*
 * Copyright (C) 2016 www.phantombot.net
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

/* 
 * @author IllusionaryOne
 */

/*
 * audioPanel.js
 * Drives the Audio Panel
 */
(function() {
    // Configure the sound panel.
    $(document).ready(function() {
        ion.sound({
            sounds: [
                { name: "beer_can_opening" },
                { name: "bell_ring" },
                { name: "branch_break" },
                { name: "button_click" },
                { name: "button_click_on" },
                { name: "button_push" },
                { name: "button_tiny" },
                { name: "camera_flashing_2" },
                { name: "camera_flashing" },
                { name: "cd_tray" },
                { name: "computer_error" },
                { name: "door_bell" },
                { name: "door_bump" },
                { name: "glass" },
                { name: "keyboard_desk" },
                { name: "light_bulb_breaking" },
                { name: "metal_plate_2" },
                { name: "metal_plate" },
                { name: "pop_cork" },
                { name: "snap" },
                { name: "staple_gun" },
                { name: "tap" },
                { name: "water_droplet_2" },
                { name: "water_droplet_3" },
                { name: "water_droplet" }
            ],
    
            path: "/panel/js/ion-sound/sounds/",
            preload: true,
            volume: 1.0,
            ready_callback: ionSoundLoaded
        });
    });

    /**
     * @function ionSoundLoaded
     */
    function ionSoundLoaded() {
        $("#ionSoundLoaded").html("<span style=\"float: right\" class=\"greenPill-sm\">Ready</span>");
    }

    // Import the HTML file for this panel.
    $("#audioPanel").load("/panel/audio.html");
})();
