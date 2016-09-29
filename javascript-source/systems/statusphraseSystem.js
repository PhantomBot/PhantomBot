/*
 * Copyright (C) 2016 phantombot.tv
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
 *
 * @title: Status Phrase System - A module for phantombot.
 * @author Nekres
 * @contact: https://phantombot.net/
 *
 */

/*
 *		  - COMMANDS -
 *
 * @commandpath togglephrases - Toggles automatic status phrase changes enabled or disabled.
 *
 * @commandpath phraseposition - Toggles the status phrase position in front or back of the broadcast title.
 * 
 * @commandpath phraseseparator [symbol] - Changes the symbol that separates the phrase from the broadcast title.
 *
 * @commandpath addphrase [phrase] - Adds a new phrase to the list.
 *
 * @commandpath delphrase [ID] - Deletes a phrase by its given ID.
 *
 * @commandpath phraseinterval [integer] - Changes the interval between automatic status phrase changes in minutes.
 *
 * @commandpath phrasemessage - Toggles wether the bot should say the phrase in chat or if a change should be print into console.
 *
 */

(function() {
	setInterval(function() {
		if (parseInt($.inidb.get("statusphrasesystem", "toggle_phrases")) != 1) { return; };
		var pos = parseInt($.inidb.get("statusphrasesystem", "pos_phrase"));
		var last_pos = parseInt($.inidb.get("statusphrasesystem", "pos_phrase_last"));
		var msg_toggle = parseInt($.inidb.get("statusphrasesystem", "msg_toggle"));
		var separator = $.inidb.get("statusphrasesystem", "separator");
		var separator_last = $.inidb.get("statusphrasesystem", "separator_last");
		var num_phrases = parseInt($.inidb.GetKeyList('statusphrases', '').length) > 0 ? parseInt($.inidb.GetKeyList('statusphrases', '').length) : NaN;
		var num;
		var new_status = "";
		var old_phrase = "";
		var phrase = "";
		var i;
		var res;

		if (!isNaN(num_phrases)) {

			var channelData = $.twitch.GetChannel($.channelName);
			var curr_status = channelData.getString('status');
			
			if (curr_status == "" || curr_status == null) {
				
				$.consoleLn("Failed to retrieve the status. TwitchAPI must be having issues.");
				
			} else {

				if (curr_status.includes(separator_last)) {
					if (parseInt(last_pos) >= 1) {
						old_phrase = curr_status.substring(curr_status.indexOf(separator_last) - 1, curr_status.length()); //check in back
					} else {
						old_phrase = curr_status.substring(0, curr_status.lastIndexOf(separator_last) + 1); //check in front
					};
					if (old_phrase) {
						curr_status = curr_status.replace(old_phrase, "").trim(); //remove old phrase
					};
				};

				do {
					num = num_phrases > 1 ? Math.floor(Math.random() * num_phrases) : 0;
					phrase = JSON.parse($.inidb.get('statusphrases', num))[1];
				} while(old_phrase.includes(phrase));

				if (pos >= 1) {
					new_status = curr_status + " " + separator + " " + phrase; //added in back
				} else {
					new_status = phrase + " " + separator + " " + curr_status; //added in front
				};

				var res = $.twitch.UpdateChannel($.channelName, new_status, "");
				if (res.getBoolean("_success")) {
					if (res.getInt("_http") == 200) {
						$.inidb.set("streamInfo","title",res.getString("status"));
						$.inidb.set('statusphrasesystem', 'pos_phrase_last', pos);
						$.inidb.set('statusphrasesystem', 'separator_last', separator);
						if (msg_toggle >= 1) {
							$.say(phrase);
						} else {
							if (pos >= 1) {
								$.consoleLn("Changed status phrase to '" + separator + " " + phrase + "'!");
							} else {
								$.consoleLn("Changed status phrase to '" + phrase + " " + separator + "'!");
							};
						};
						if (pos >= 1) {
							$.log.event("statusphraseSystem.js", 110, "Changed status phrase to '" + separator + " " + phrase + "'!");
						} else {
							$.log.event("statusphraseSystem.js", 112, "Changed status phrase to '" + phrase + " " + separator + "'!");			
						};
						$.consoleLn($.inidb.get("streamInfo","title"));
					} else {
						$.consoleLn("Failed to change the status. TwitchAPI must be having issues.");
						$.consoleLn(res.getString("message"));
						$.log.error("statusphraseSystem.js", 118, res.getString("message"));
					};
				} else {
					$.consoleLn("Failed to change the status. TwitchAPI must be having issues.");
					$.consoleLn(res.getString("_exception") + " " + res.getString("_exceptionMessage"));
					$.log.error("statusphraseSystem.js", 123, res.getString("_exception") + " " + res.getString("_exceptionMessage"));
				};
			};
		} else {
			$.say($.whisperPrefix($.ownerName) + "The status phrase list is empty!");
		};
	}, parseInt($.inidb.exists("statusphrasesystem", "interval") ? $.inidb.get("statusphrasesystem", "interval") : 120000));

	/**
	 * @function savePhrase
	 * @param {String} username {String} phrase
	 */
	function savePhrase(username, phrase) {
		var newKey = $.inidb.GetKeyList('statusphrases', '').length;
		$.inidb.set('statusphrases', newKey, JSON.stringify([username, phrase, $.systemTime()]));
		return newKey;
	};

	/**
	 * @function deletePhrase
	 * @param {String} id
	 */
	function deletePhrase(phraseId) {
		var phraseKeys,
		phrases = [],
		i;

		if ($.inidb.exists('statusphrases', phraseId)) {
			$.inidb.del('statusphrases', phraseId);
			phraseKeys = $.inidb.GetKeyList('statusphrases', '');

			for (i in phraseKeys) {
				phrases.push($.inidb.get('statusphrases', phraseKeys[i]));
				$.inidb.del('statusphrases', phraseKeys[i]);
			}

			for (i in phrases) {
				$.inidb.set('statusphrases', i, phrases[i]);
			}
			return (phrases.length ? phrases.length : 0);
		} else {
			return -1;
		}
	}

	$.bind('command', function (event) {
		var sender = event.getSender();
		var username = $.username.resolve(sender);
		var command = event.getCommand();
		var args = event.getArgs();
		var num_phrases = (parseInt($.inidb.GetKeyList('statusphrases', '').length) ? parseInt($.inidb.GetKeyList('statusphrases', '').length) : 0);
		var pos_phrase = parseInt($.inidb.get("statusphrasesystem", "pos_phrase"));
		var msg_toggle = parseInt($.inidb.get("statusphrasesystem", "msg_toggle"));
		var toggle_phrases = parseInt($.inidb.get("statusphrasesystem", "toggle_phrases"));
		var num;

		if (command.equalsIgnoreCase('addphrase')) {
			if (args.length < 1) {
				$.say($.whisperPrefix(sender) + $.lang.get('statusphrasesystem.add.usage'));
				return;
			}
			phrase = args.splice(0).join(' ');
			$.say($.lang.get('statusphrasesystem.add.success', $.username.resolve(sender), savePhrase(String($.username.resolve(sender)), phrase)));
			$.log.event(sender + ' added a status phrase "' + phrase + '".');
			return;
		}

		/**
		* USED BY THE PANEL
		*/
		if (command.equalsIgnoreCase('addphrasesilent')) {
			if (!$.isBot(sender)) {
				return;
			}
			if (args.length < 1) {
				return;
			}
			phrase = args.splice(0).join(' ');
			savePhrase(String($.username.resolve(sender)), phrase);
		}

		if (command.equalsIgnoreCase('delphrase')) {
			if (!args[0] || isNaN(args[0])) {
				$.say($.whisperPrefix(sender) + $.lang.get('statusphrasesystem.del.usage'));
				return;
			}

			var newCount;

			if ((newCount = deletePhrase(args[0])) >= 0) {
				$.say($.whisperPrefix(sender) + $.lang.get('statusphrasesystem.del.success', args[0], newCount));
			} else {
				$.say($.whisperPrefix(sender) + $.lang.get('statusphrasesystem.del.404', args[0]));
			}
			$.log.event(sender + ' removed status phrase with id: ' + args[0]);
		}

		/**
		* USED BY THE PANEL
		*/
		if (command.equalsIgnoreCase('delphrasesilent')) {
			if (!$.isBot(sender)) {
				return;
			}
			
			var newCount;

			if ((newCount = deletePhrase(args[0])) >= 0) {
				} else {
			}
		}

		if (command.equalsIgnoreCase("togglephrases")) {
			if (!$.isCaster(sender)) {
				$.say($.whisperPrefix(sender) + $.adminMsg);
				return;
			}
			if (toggle_phrases >= 1) {
				$.inidb.set('statusphrasesystem', 'toggle_phrases', parseInt(0));
				$.say($.whisperPrefix(sender) + $.lang.get('statusphrasesystem.toggle.off'));
			} else {
				$.inidb.set('statusphrasesystem', 'toggle_phrases', parseInt(1));
				$.say($.whisperPrefix(sender) + $.lang.get('statusphrasesystem.toggle.on'));		
			}

		}
		
		/**
		* USED BY THE PANEL
		*/
		if (command.equalsIgnoreCase("togglephrasessilent")) {
			if (!$.isBot(sender)) {
				return;
			}
			if (toggle_phrases >= 1) {
				$.inidb.set('statusphrasesystem', 'toggle_phrases', parseInt(0));
			} else {
				$.inidb.set('statusphrasesystem', 'toggle_phrases', parseInt(1));	
			}

		}

		if (command.equalsIgnoreCase("phraseposition")) {
			if (!$.isCaster(sender)) {
				$.say($.whisperPrefix(sender) + $.adminMsg);
				return;
			}
			if (pos_phrase >= 1) {
				$.inidb.set('statusphrasesystem', 'pos_phrase', parseInt(0));
				$.say($.whisperPrefix(sender) + $.lang.get('statusphrasesystem.position.front'));
			} else {
				$.inidb.set('statusphrasesystem', 'pos_phrase', parseInt(1));
				$.say($.whisperPrefix(sender) + $.lang.get('statusphrasesystem.position.back'));		
			}
		}

		/**
		* USED BY THE PANEL
		*/
		if (command.equalsIgnoreCase("phrasepositionsilent")) {
			if (!$.isBot(sender)) {
				return;
			}
			$.inidb.set('statusphrasesystem', 'pos_phrase', parseInt(args[0]));
		}
		
		if (command.equalsIgnoreCase("phraseseparator")) {
			if (!$.isCaster(sender)) {
				$.say($.whisperPrefix(sender) + $.adminMsg);
				return;
			}
			if (args[0].length() == 1) {
				$.inidb.set('statusphrasesystem', 'separator', args[0].trim());
				$.say($.whisperPrefix(sender) + $.lang.get('statusphrasesystem.separator.changed', args[0].trim()));
			} else {
				$.say($.whisperPrefix(sender) + $.lang.get('statusphrasesystem.separator.404'));
			}
		}

		/**
		* USED BY THE PANEL
		*/
		if (command.equalsIgnoreCase("phraseseparatorsilent")) {
			if (!$.isBot(sender)) {
				return;
			}
			if (args[0].length() == 1) {
				$.inidb.set('statusphrasesystem', 'separator', args[0].trim());
			}
		}

		if (command.equalsIgnoreCase("phraseinterval")) {
			if (!$.isCaster(sender)) {
				$.say($.whisperPrefix(sender) + $.adminMsg);
				return;
			}
			if (parseInt(args[0]) >= 2) {
				var new_int = parseInt(args[0].trim()) * 60 * 1000
				$.inidb.set('statusphrasesystem', 'interval', new_int);
				$.say($.whisperPrefix(sender) + $.lang.get('statusphrasesystem.interval.changed', args[0].trim(), new_int));
			} else {
				$.say($.whisperPrefix(sender) + $.lang.get('statusphrasesystem.interval.404'));		
			}
		}

		/**
		* USED BY THE PANEL
		*/
		if (command.equalsIgnoreCase("phraseintervalsilent")) {
			if (!$.isBot(sender)) {
				return;
			}
			if (parseInt(args[0]) >= 2) {
				var new_int = parseInt(args[0].trim()) * 60 * 1000
				$.inidb.set('statusphrasesystem', 'interval', new_int);
			}
		}

		if (command.equalsIgnoreCase("phrasemessage")) {
			if (!$.isMod(sender)) {
				$.say($.whisperPrefix(sender) + $.modMsg);
				return;
			}
			if (msg_toggle >= 1) {
				$.inidb.set('statusphrasesystem', 'msg_toggle', parseInt(0));
				$.say($.whisperPrefix(sender) + $.lang.get('statusphrasesystem.message.console'));
			} else {
				$.inidb.set('statusphrasesystem', 'msg_toggle', parseInt(1));
				$.say($.whisperPrefix(sender) + $.lang.get('statusphrasesystem.message.chat'));
			}
		}
		
		/**
		* USED BY THE PANEL
		*/
		if (command.equalsIgnoreCase("phrasemessagesilent")) {
			if (!$.isBot(sender)) {
				return;
			}
			if (msg_toggle >= 1) {
				$.inidb.set('statusphrasesystem', 'msg_toggle', parseInt(0));
			} else {
				$.inidb.set('statusphrasesystem', 'msg_toggle', parseInt(1));
			}
		}
	});
	if (!$.inidb.exists('statusphrasesystem', 'initial_push')) {
		setTimeout(function () {
			$.inidb.set('statusphrasesystem', 'initial_push', true);
				$.inidb.set('statusphrasesystem', 'msg_toggle', '0');
				$.inidb.set('statusphrasesystem', 'toggle_phrases', '0');
				$.inidb.set('statusphrasesystem', 'interval', '120000');
				$.inidb.set('statusphrasesystem', 'pos_phrase', '1');
				$.inidb.set('statusphrasesystem', 'pos_phrase_last', '1');
				$.inidb.set('statusphrasesystem', 'separator', '»');
				$.inidb.set('statusphrasesystem', 'separator_last', '»');
			$.inidb.SaveAll(true);
		}, 5 * 1000);
	};
	$.bind('initReady', function() {
		if ($.bot.isModuleEnabled('./systems/statusphraseSystem.js')) {
			$.registerChatCommand("./systems/statusphraseSystem.js", "addphrase");
			$.registerChatCommand("./systems/statusphraseSystem.js", "addphrasesilent");
			$.registerChatCommand("./systems/statusphraseSystem.js", "delphrase");
			$.registerChatCommand("./systems/statusphraseSystem.js", "delphrasesilent");
			$.registerChatCommand("./systems/statusphraseSystem.js", "togglephrases");
			$.registerChatCommand("./systems/statusphraseSystem.js", "togglephrasessilent");
			$.registerChatCommand("./systems/statusphraseSystem.js", "phraseposition");
			$.registerChatCommand("./systems/statusphraseSystem.js", "phrasepositionsilent");
			$.registerChatCommand("./systems/statusphraseSystem.js", "phraseseparator");
			$.registerChatCommand("./systems/statusphraseSystem.js", "phraseseparatorsilent");
			$.registerChatCommand("./systems/statusphraseSystem.js", "phraseinterval");
			$.registerChatCommand("./systems/statusphraseSystem.js", "phraseintervalsilent");
			$.registerChatCommand("./systems/statusphraseSystem.js", "phrasemessage");
			$.registerChatCommand("./systems/statusphraseSystem.js", "phrasemessagesilent");
		};
	});
})();