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

$.lang.register('noticesystem.notice-usage', 'Usage: !notice [status / add / get / list / remove / edit / toggleid / insert / interval / req / toggle / toggleoffline / toggleshuffle / selectgroup / addgroup / removegroup / renamegroup]');
$.lang.register('noticesystem.notice-config', 'Notice Settings - [Selected Group: $1 / Number of Groups: $2 / Notice Toggle: $3 / Interval Min: $4 / Interval Max: $5 / Message Trigger: $6 / Messages in Group: $7 / Say Notice in Offline Chat: $8 / Shuffle Messages: $9]');
$.lang.register('noticesystem.notice-no-notices', 'There are no notices in group $1 - Create one with !notice add');
$.lang.register('noticesystem.notice-get-usage', 'Usage: !notice get [notice id] - Notice ids in group $1 go from 0 to $2');
$.lang.register('noticesystem.notice-list', 'Notices in group $1: $2');
$.lang.register('noticesystem.notice-remove-usage', 'Usage: !notice remove [notice id] - Notice ids in group $1 go from 0 to $2');
$.lang.register('noticesystem.notice-edit-usage', 'Usage: !notice edit (notice id) (message) - Notice ids in group $1 go from 0 to $1');
$.lang.register('noticesystem.notice-edit-success', 'Notice edited in group $1!');
$.lang.register('noticesystem.notice-toggleid-usage', 'Usage: !notice toggleid (notice id) - Toggles the notice at the specified id on/off');
$.lang.register('noticesystem.notice-toggleid-success', 'Notice $1 is now $2');
$.lang.register('noticesystem.notice-remove-success', 'Notice removed from group $1!');
$.lang.register('noticesystem.notice-add-usage', 'Usage: !notice add [message or command]');
$.lang.register('noticesystem.notice-add-success', 'Notice added to group $1 at position $2!');
$.lang.register('noticesystem.notice-insert-usage', 'Usage: !notice notice insert [id] [message or command]');
$.lang.register('noticesystem.notice-insert-nan', 'Notice id must be a number');
$.lang.register('noticesystem.notice-insert-success', 'Notice inserted into group $2 at position $1!');
$.lang.register('noticesystem.notice-interval-usage', 'Usage: !notice interval [min minutes] [max minutes] | [fixed minutes]');
$.lang.register('noticesystem.notice-interval-nan', 'Notice intervals need to be numbers.');
$.lang.register('noticesystem.notice-interval-too-small', 'Notice intervals need to be more then 0.25 minutes.');
$.lang.register('noticesystem.notice-interval-wrong-order', 'Minimum interval was be smaller or equal maximum interval.');
$.lang.register('noticesystem.notice-inteval-success', 'Notice interval for group $1 set!');
$.lang.register('noticesystem.notice-req-success', 'Required message(s) between notices of groups $1 set!');
$.lang.register('noticesystem.notice-req-usage', 'Usage: !notice req [req messages]');
$.lang.register('noticesystem.notice-req-404', 'Notice req messages needs to be a number and at least 0.');
$.lang.register('noticesystem.notice-enabled', 'Notice group $1 has been enabled!');
$.lang.register('noticesystem.notice-disabled', 'Notice group $1 has been disabled.');
$.lang.register('noticesystem.notice-enabled.offline', 'Notices in group $1 will now be sent while the stream is offline.');
$.lang.register('noticesystem.notice-disabled.offline', 'Notices in group $1 will no longer be sent while the stream is offline.');
$.lang.register('noticesystem.notice-enabled.shuffle', 'Notices in group $1 will now be sent in random order.');
$.lang.register('noticesystem.notice-disabled.shuffle', 'Notices in group $1 will now be sent in order of their ids.');
$.lang.register('noticesystem.notice-no-groups', 'There are no notice groups - Create one with !notice addgroup.');
$.lang.register('noticesystem.notice-selectgroup-usage', 'Usage: !notice selectgroup [group id] - Group ids go from 0 to $1.');
$.lang.register('noticesystem.notice-selectgroup-404', 'Group ids go from 0 to $1.');
$.lang.register('noticesystem.notice-selectgroup-success', 'Changed selected group to $1.');
$.lang.register('noticesystem.notice-addgroup-usage', 'Uage: !notice addgroup [name]');
$.lang.register('noticesystem.notice-addgroup-success', 'Added new group $1 and selected it.');
$.lang.register('noticesystem.notice-removegroup-usage', 'Usage: !notice removegroup [group id] - Group ids go from 0 to $1.');
$.lang.register('noticesystem.notice-removegroup-404', 'Group ids go from 0 to $1.');
$.lang.register('noticesystem.notice-removegroup-success', 'Group $1 was deleted. Currently selected group: $2.');
$.lang.register('noticesystem.notice-removegroup-success-none-left', 'Group $1 was deleted. No groups left. Create one with !notice addgroup.');
$.lang.register('noticesystem.notice-renamegroup-usage', 'Usage: !notice renamegroup [group id] [name] - Group ids go from 0 to $1.');
$.lang.register('noticesystem.notice-renamegroup-404', 'Group ids go from 0 to $1.');
$.lang.register('noticesystem.notice-renamegroup-success', 'Group $1 was renamed to $2.');
