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
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program. If not, see <http://www.gnu.org/licenses/>.
 */

$.lang.register('channelpointshandler.config.failed', 'no channel point redemption was detected. Please try again. If you are having problems please visit the PhantomBot Discord discord.com/invite/YKvMd78');
$.lang.register('channelpointshandler.command.info', 'converts the redeemable into a command, then parses command tags as if a custom command was called as the bot. See "!channelpoints add" to configure, "!channelpoints usage" for usage, or "!channelpoints example" for an example');
$.lang.register('channelpointshandler.command.usage', 'usage: !channelpoints [usage / example / list / get / add / edit / remove]');
$.lang.register('channelpointshandler.command.example', 'example: !channelpoints add Thank you for redeeming @(cpdisplayname)! (playsound applause)');
$.lang.register('channelpointshandler.command.list', 'active command redeemable ids: $1');
$.lang.register('channelpointshandler.command.get', 'the command for channel points redeemable id $1 is: $2');
$.lang.register('channelpointshandler.command.get.usage', 'usage: !channelpoints get (redeemable id)');
$.lang.register('channelpointshandler.command.get.404', 'there is no command for channel points redeemable id $1');
$.lang.register('channelpointshandler.command.add.usage1', 'usage: !channelpoints add (custom command definition)');
$.lang.register('channelpointshandler.command.add.usage2', 'when redeemed, the (custom command definition) is parsed in the same way as a custom command created with !addcom. The (sender) will be $1 and will have ADMIN permissions');
$.lang.register('channelpointshandler.command.add.usage3', 'data about the redemption can be accessed using command tags with the channelpointsevent label, check the guides for info');
$.lang.register('channelpointshandler.command.add.start', 'channel points command config active. Please redeem desired redeemable.');
$.lang.register('channelpointshandler.command.add.complete', 'channel points command config complete. Redeemable $1 is now registered to: $2');
$.lang.register('channelpointshandler.command.add.failed', 'unable to configure command reward. Redeemable $1 is already registered to a reward');
$.lang.register('channelpointshandler.command.edit.usage1', 'usage: !channelpoints edit (redeemable id) (custom command definition)');
$.lang.register('channelpointshandler.command.edit', 'redeemable $1 is now registered to: $2');
$.lang.register('channelpointshandler.command.remove.usage', 'usage: !channelpoints remove (redeemable id)');
$.lang.register('channelpointshandler.command.remove', 'removed command reward for redeemable $1');