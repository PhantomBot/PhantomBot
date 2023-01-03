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

(function() {
    var commercialLength = $.getSetIniDbNumber('commercialSettings', 'length', 30),
        commercialInterval = $.getSetIniDbNumber('commercialSettings', 'interval', 10),
        commercialMessage = $.getSetIniDbString('commercialSettings', 'message', ''),
        commercialTimer = $.getSetIniDbBoolean('commercialSettings', 'commercialtimer', false),
        lastCommercial = 0,
        interval;

    /**
     * @function startCommercialTimer
     */
    function startCommercialTimer() {
        lastCommercial = $.systemTime();
        
        interval = setInterval(function() {
            if (commercialTimer && $.bot.isModuleEnabled('./systems/commercialSystem.js')) {
                if ((lastCommercial + (commercialInterval * 6e4)) <= $.systemTime()) {
                    if ($.isOnline($.channelName)) {
                        var result = $.twitch.RunCommercial($.channelName, commercialLength);
                        lastCommercial = $.systemTime();
                        
                        if (commercialMessage.length > 0 && result.getInt("_http") != 422) {
                            $.say(commercialMessage);
                        }
                    }
                }
            }
        }, 1e4, 'scripts::systems::commercialSystem.js');
    };

    /**
     * @event command
     */
    $.bind('command', function(event) {
        var sender = event.getSender(),
            command = event.getCommand(),
            argsString = event.getArguments().trim(),
            args = event.getArgs(),
            action = args[0];

        /**
         * @commandpath commercial - Command for manually running comemrcials or managing the commercial autotimer
         */
        if (command.equalsIgnoreCase('commercial')) {
            if (args.length == 0) {
                $.say($.whisperPrefix(sender) + $.lang.get('commercialsystem.usage'));
                return;
            }

            /**
             * @commandpath commercial autotimer - Manages the autotimer
             */
            if (action.equalsIgnoreCase('autotimer')) {
                if (args.length <= 1) {
                    if (commercialTimer) {
                        $.say($.whisperPrefix(sender) + $.lang.get('commercialsystem.autotimer.status-on', commercialLength, commercialInterval));
                        if (commercialMessage.length > 0) {
                            $.say($.whisperPrefix(sender) + $.lang.get('commercialsystem.autotimer.status-on-msg', commercialMessage));
                        } else {
                            $.say($.whisperPrefix(sender) + $.lang.get('commercialsystem.autotimer.status-on-nomsg'));
                        }
                    } else {
                        $.say($.whisperPrefix(sender) + $.lang.get('commercialsystem.autotimer.status-off'));
                    }
                    return;
                } else {
                    /**
                    * @commandpath commercial autotimer off - Disables the autotimer
                    */
                    if (args[1].equalsIgnoreCase("off")) {
                        $.inidb.set('commercialSettings', 'commercialtimer', false.toString());
                        commercialTimer = false;
                        clearInterval(interval);
                        $.say($.whisperPrefix(sender) + $.lang.get('commercialsystem.autotimer.status-off'));
                    /**
                    * @commandpath commercial autotimer nomessage - Removes the message sent when autotimer starts a commercial
                    */
                    } else if (args[1].equalsIgnoreCase("nomessage")) {
                        $.inidb.set('commercialSettings', 'message', '');
                        commercialMessage = '';
                        $.say($.whisperPrefix(sender) + $.lang.get('commercialsystem.autotimer.msg-del'));
                    /**
                    * @commandpath commercial autotimer message (message) - Adds/changes the message sent when autotimer starts a commercial
                    */
                    } else if (args.length >= 3 && args[1].equalsIgnoreCase("message") && args[2].length() > 0) {
                        argsString = args.slice(2).join(' ');
                        $.inidb.set('commercialSettings', 'message', argsString);
                        commercialMessage = argsString;
                        $.say($.whisperPrefix(sender) + $.lang.get('commercialsystem.autotimer.msg-set', argsString));
                    /**
                    * @commandpath commercial autotimer (interval_mins) (length_secs) [message] - Sets the autotimer
                    */
                    } else {
                        var valid_lengths = ["30", "60", "90", "120", "150", "180"];
                        if (args.length < 3 || isNaN(args[1]) || isNaN(args[2]) || args[1] < 8 || !valid_lengths.includes(args[2])) {
                            $.say($.whisperPrefix(sender) + $.lang.get('commercialsystem.autotimer.bad-parm'));
                            return;
                        }

                        argsString = '';

                        if (args.length > 3) {
                            argsString = args.slice(3).join(' ');
                        }

                        $.inidb.set('commercialSettings', 'length', args[2]);
                        $.inidb.set('commercialSettings', 'interval', args[1]);
                        $.inidb.set('commercialSettings', 'message', argsString);
                        $.inidb.set('commercialSettings', 'commercialtimer', true.toString());
                        
                        commercialLength = parseInt(args[2]);
                        commercialInterval = parseInt(args[1]);
                        commercialMessage = argsString;
                        commercialTimer = true;
                        
                        startCommercialTimer();
                        
                        $.say($.whisperPrefix(sender) + $.lang.get('commercialsystem.autotimer.status-on', commercialLength, commercialInterval));
                        if (commercialMessage.length() > 0) {
                            $.say($.whisperPrefix(sender) + $.lang.get('commercialsystem.autotimer.status-on-msg', commercialMessage));
                        } else {
                            $.say($.whisperPrefix(sender) + $.lang.get('commercialsystem.autotimer.status-on-nomsg'));
                        }
                    }
                    return;
                }
            }

            /**
             * @commandpath commercial (length) [silent] - Runs a commercial, optionally does not post a success message to chat
             */
            if (args.length >= 1 && !isNaN(args[0])) {
                var result = $.twitch.RunCommercial($.channelName, args[0]);
                
                if (result.getInt("_http") === 422) {
                    $.say($.whisperPrefix(sender) + $.lang.get('commercialsystem.422'));
                } else {
                    lastCommercial = $.systemTime();
                    
                    if (args.length < 2 || !args[1].equalsIgnoreCase("silent")) {
                        $.say($.lang.get('commercialsystem.run', args[0]));
                    }
                }
            }
        }
    });

    /**
     * @event initReady
     */
    $.bind('initReady', function() {
        $.registerChatCommand('./systems/commercialSystem.js', 'commercial', $.PERMISSION.Mod);
        $.registerChatSubcommand('commercial', 'autotimer', $.PERMISSION.Admin);

        // Set the interval to run commercials
        if (commercialTimer) {
            startCommercialTimer();
        }
    });

    /**
     * @event webPanelSocketUpdate
     */
    $.bind('webPanelSocketUpdate', function(event) {
        if (event.getScript().equalsIgnoreCase('./systems/commercialSystem.js')) {
            var action = event.getArgs()[0];

            if (action.equalsIgnoreCase('setautotimer')) {
                var msg = '';

                if (event.getArgs().length > 3) {
                    msg = event.getArgs().slice(3).join(' ');
                }

                $.inidb.set('commercialSettings', 'length', event.getArgs()[2]);
                $.inidb.set('commercialSettings', 'interval', event.getArgs()[1]);
                $.inidb.set('commercialSettings', 'message', msg);
                $.inidb.set('commercialSettings', 'commercialtimer', true.toString());

                commercialLength = parseInt(event.getArgs()[2]);
                commercialInterval = parseInt(event.getArgs()[1]);
                commercialMessage = msg;
                commercialTimer = true;

                startCommercialTimer();
            } else if (action.equalsIgnoreCase('autotimeroff')) {
                $.inidb.set('commercialSettings', 'commercialtimer', false.toString());
                commercialTimer = false;
                clearInterval(interval);
            }
        }
    });
})();

