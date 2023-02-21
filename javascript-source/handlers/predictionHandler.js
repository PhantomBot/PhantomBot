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

/* global Packages */

(function () {
    let currentPrediction = null;

    /*
     * @event command
     */
    $.bind('command', function (event) {
        let sender = event.getSender(),
            command = $.jsString(event.getCommand(), '').toLowerCase(),
            args = $.jsArgs(event.getArgs());

            if (command === 'prediction') {
                let handled = false;
                if (args.length > 0) {
                    let action = args[0].toLowerCase();
                    let subaction = args.length > 1 ? args[1].toLowerCase() : null;
                    if (action === 'open') {
                        handled = true;
                        if (subaction === 'example') {
                            $.say($.whisperPrefix(sender) + $.lang.get('predictionhandler.open.example'));
                        } else if (args.length < 5 || args[2].trim().length === 0 || args[3].trim().length === 0 || args[4].trim().length === 0) {
                            $.say($.whisperPrefix(sender) + $.lang.get('predictionhandler.open.usage'));
                        } else {
                            try {
                                let choices = new Packages.java.util.ArrayList();

                                for (let i = 3; i < args.length; i++) {
                                    choices.add($.javaString(args[i]));
                                }

                                let response = $.helix.createPrediction($.javaStrimg(args[2]), $.duration(args[1]), choices);

                                if (response.has("data")) {

                                } else if (response.has("message")) {
                                    $.log.error(response.getString("message"));
                                }
                            } catch (e) {
                                $.log.error(e);
                            }
                        }
                    }
                }

                if (!handled) {
                    $.say($.whisperPrefix(sender) + $.lang.get('predictionhandler.usage'));
                }
            }
    });

    /*
    * @event initReady
    */
    $.bind('initReady', function () {
        $.registerChatCommand('./handlers/predictionHandler.js', 'prediction', $.PERMISSION.Admin);
    });
})();