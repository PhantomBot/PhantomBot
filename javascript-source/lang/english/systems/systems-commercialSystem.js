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

$.lang.register('commercialsystem.usage', 'Usage: !commercial (length_secs:30,60,90,120,150,180) [silent]  --or-- !commercial autotimer');
$.lang.register('commercialsystem.run', 'Running a $1 second commercial');
$.lang.register('commercialsystem.422', 'Commercials can only be run on partnered channels, once per 8 minutes, when the stream is live, for one of the following lengths: 30, 60, 90, 120, 150, 180');
$.lang.register('commercialsystem.autotimer.status-off', 'Commercial autotimer is off. To enable: !commercial autotimer (interval_mins:8 or greater) (length_secs:30,60,90,120,150,180) [message]');
$.lang.register('commercialsystem.autotimer.status-on', 'Commercial autotimer is on. $1 seconds of ads every $2 minutes. To disable: !commercial autotimer off --or-- To add/change a message: !commercial autotimer message (message) --or-- To remove message: !commercial autotimer nomessage');
$.lang.register('commercialsystem.autotimer.bad-parm', 'Failed to set autotimer. Interval must be at least 8 minutes and length must be one of: 30, 60, 90, 120, 150, 180');
$.lang.register('commercialsystem.autotimer.status-on-msg', 'The message sent when an auto commercial starts: $1');
$.lang.register('commercialsystem.autotimer.status-on-nomsg', 'No message is sent when an auto commercial starts');
$.lang.register('commercialsystem.autotimer.msg-set', 'Changed the message sent when an auto commercial starts to: $1');
$.lang.register('commercialsystem.autotimer.msg-del', 'No longer sending a message when an auto commercial starts');
