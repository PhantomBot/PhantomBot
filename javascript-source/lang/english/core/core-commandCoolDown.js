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

$.lang.register('cooldown.set.togglemodcooldown', 'Command cooldowns have been $1 for moderators.');
$.lang.register('cooldown.coolcom.usage', 'Usage: !coolcom [command] [seconds / global=seconds / user=seconds] [global=seconds / user=seconds] - Using -1 for the seconds removes the cooldown. Only specifying seconds assumes global only if no secondary argument is given!');
$.lang.register('cooldown.coolcom.err', 'The minimum cooldown that can be set is 5 seconds.');
$.lang.register('cooldown.coolcom.setGlobal', 'Cooldown for command !$1 has globally been set to $2 seconds.');
$.lang.register('cooldown.coolcom.setUser', 'Cooldown for command !$1 has been set to $2 seconds individually for each user.');
$.lang.register('cooldown.coolcom.setCombo', 'Cooldown for command !$1 has globally been set to $2 seconds and to $3 seconds individually for each user.');
$.lang.register('cooldown.coolcom.setGlobalModsSkip', 'Cooldown for command !$1 has globally been set to $2 seconds. Moderators will skip the cooldown for this command.');
$.lang.register('cooldown.coolcom.setUserModsSkip', 'Cooldown for command !$1 has been set to $2 seconds individually for each user. Moderators will skip the cooldown for this command.');
$.lang.register('cooldown.coolcom.setComboModsSkip', 'Cooldown for command !$1 has globally been set to $2 seconds and to $3 seconds individually for each user. Moderators will skip the cooldown for this command.');
$.lang.register('cooldown.coolcom.remove', 'Cooldown for command !$1 has been removed.');
$.lang.register('cooldown.cooldown.usage', 'Usage: !cooldown [togglemoderators / setdefault]');
$.lang.register('cooldown.default.set', 'The default cooldown for commands without one has been set to $1 seconds.');
$.lang.register('cooldown.default.usage', 'Usage: !cooldown setdefault [seconds] - Set a cooldown for commands that don\'t have one. Currently $1 seconds');
$.lang.register('cooldown.adventure.err', 'Please use "!adventure set cooldown" to set the cooldown for adventures.');