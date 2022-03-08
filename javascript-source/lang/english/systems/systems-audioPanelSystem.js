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

$.lang.register('audiohook.usage', 'Usage: !audiohook [play / list / customcommand / togglemessages]');
$.lang.register('audiohook.play.usage', 'Usage: !audiohook play [audio_hook]');
$.lang.register('audiohook.play.404', 'Audiohook does not exist: $1');
$.lang.register('audiohook.play.success', 'Sent audio hook: $1');
$.lang.register('audiohook.list', 'Audio Hooks: $1');
$.lang.register('audiohook.list.total', 'Total Pages: $1');
$.lang.register('audiohook.toggle', 'Audio messages have been set to $1.');
$.lang.register('audiohook.customcommand.usage', 'Usage: !audiohook customcommand [add / remove] [command] [sound name]');
$.lang.register('audiohook.customcommand.add.usage', 'Usage: !audiohook customcommand add [command] [sound name]');
$.lang.register('audiohook.customcommand.add.error.exists', 'That command already exists or is an alias.');
$.lang.register('audiohook.customcommand.add.list', 'Command !$1 will now give a list of all the audio hook commands.');
$.lang.register('audiohook.customcommand.add.error.fx.null', 'That audio hook does not exist. Use: "!audioHook list" to see the audio list.');
$.lang.register('audiohook.customcommand.add.success', 'Command !$1 will now trigger the audio hook $2!');
$.lang.register('audiohook.customcommand.remove.usage', 'Usage: !audiohook customcommand remove [command]');
$.lang.register('audiohook.customcommand.remove.error.404', 'That command does not exists.');
$.lang.register('audiohook.customcommand.remove.success', 'Command !$1 has been removed.');
