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

$.lang.register('channelpointshandler.notenabled', 'no channel points functions are currently enabled. Please use "!channelpoints info" for information about what PhantomBot can do with channelpoints or "!channelpoints usage" for usage');
$.lang.register('channelpointshandler.info', 'PhantomBot can be configured to automate channel point redemptions for several functions. Transfer: user will receive bot currency. Giveall: everyone in chat to receive bot currency. Emoteonly: place chat in emote only mode for an amount of time. Timeout: timeout a specified user for an amount of time.');
$.lang.register('channelpointshandler.usage', 'usage: !channelpoints [info / usage / transfer / giveall / emoteonly / timeout]');
$.lang.register('channelpointshandler.current', 'channel point automation currently enabled for$1. Use "!channelpoints useage" for command usage or "!channelpoints info" for information about what PhantomBot can do with channelpoints');
$.lang.register('channelpointshandler.nan', 'input must be a number, please try again.');
$.lang.register('channelpointshandler.config.failed', 'no channel point redemption was detected. Please try again. If you are having problems please visit the PhantomBot Discord discord.com/invite/YKvMd78');

$.lang.register('channelpointshandler.transfer.info', 'transfer is not enabled. When a transfer redemption is claimed, user will be given a set amount of points. To configure please use "!channelpoints transfer config" or for more info please use "!channelpoints transfer usage."');
$.lang.register('channelpointshandler.transfer.current', 'transfer redemptions are registered to $1 and user will receive $2 points for each redemption. To change please use "!channelpoints transfer [config / amount]"');
$.lang.register('channelpointshandler.transfer.usage', 'usage: !channelpoints transfer [usage / config / amount / toggle]');
$.lang.register('channelpointshandler.transfer.config.start', 'channel points transfer config active. Please redeem desired reward.');
$.lang.register('channelpointshandler.transfer.config.complete', 'Channel points transfer config complete. Transfer is now registered to reward $1.');
$.lang.register('channelpointshandler.transfer.amount.notset', 'channel points reward, transfer amount has not been set. Use "!channelpoints transfer amount [amount of points bot will award]" to set.');
$.lang.register('channelpointshandler.transfer.amount.usage', 'channel points reward, transfer amount set to $1. Use "!channelpoints transfer amount [amount of points bot will award]" to change.');
$.lang.register('channelpointshandler.transfer.amount.message', 'channel points redemption transfer will add $1 points to user who redeemed the reward.');
$.lang.register('channelpointshandler.transfer.toggle.id', 'unable to enable transfer as no valid reward ID was found. Please use "!channelpoints transfer config" to set reward.');
$.lang.register('channelpointshandler.transfer.toggle.amount', 'unable to enable transfer as no amount has been set. Please use "!channelpoints transfer [amount amount of points bot will award]" to set.');
$.lang.register('channelpointshandler.transfer.enabled', 'channel points redemption transfer enabled for reward $1.');
$.lang.register('channelpointshandler.transfer.disabled', 'channel points redemption transfer disabled.');

$.lang.register('channelpointshandler.giveall.info', 'giveall is not enabled. When a giveall redemption is claimed, all users in chat will be given a set amount of points. To configure please use "!channelpoints giveall config" or for more info please use "!channelpoints giveall usage."');
$.lang.register('channelpointshandler.giveall.current', 'giveall redemptions are registered to $1 and user will receive $2 points for each redemption. To change please use "!channelpoints giveall [config / amount]"');
$.lang.register('channelpointshandler.giveall.usage', 'usage: !channelpoints giveall [usage / config / amount / toggle]');
$.lang.register('channelpointshandler.giveall.config.start', 'channel points giveall config active. Please redeem desired reward.');
$.lang.register('channelpointshandler.giveall.config.complete', 'Channel points giveall config complete. Giveall is now registered to reward $1.');
$.lang.register('channelpointshandler.giveall.amount.notset', 'channel points reward, giveall amount has not been set. Use "!channelpoints giveall amount [amount of points bot will award]" to set.');
$.lang.register('channelpointshandler.giveall.amount.usage', 'channel points reward, giveall amount set to $1. Use "!channelpoints giveall amount [amount of points bot will award]" to change.');
$.lang.register('channelpointshandler.giveall.amount.message', 'channel points redemption giveall will add $1 points to all users in chat.');
$.lang.register('channelpointshandler.giveall.toggle.id', 'unable to enable giveall as no valid reward ID was found. Please use "!channelpoints giveall config" to set reward.');
$.lang.register('channelpointshandler.giveall.toggle.amount', 'unable to enable giveall as no amount has been set. Please use "!channelpoints giveall amount [amount of points bot will award]" to set.');
$.lang.register('channelpointshandler.giveall.enabled', 'channel points redemption giveall enabled for reward $1.');
$.lang.register('channelpointshandler.giveall.disabled', 'channel points redemption giveall disabled.');

$.lang.register('channelpointshandler.emoteonly.info', 'emoteonly is not enabled. When an emoteonly redemption is claimed, chat will be placed in emote only mode for a set duration. To configure please use "!channelpoints emoteonly config" or for more info please use "!channelpoints emoteonly usage."');
$.lang.register('channelpointshandler.emoteonly.current', 'emoteonly redemptions are registered to $1 and chat will be placed in emote only mode for $2 seconds. To change please use "!channelpoints emoteonly [config / duration]"');
$.lang.register('channelpointshandler.emoteonly.usage', 'usage: !channelpoints emoteonly [usage / config / duration / toggle]');
$.lang.register('channelpointshandler.emoteonly.config.start', 'channel points emoteonly config active. Please redeem desired reward.');
$.lang.register('channelpointshandler.emoteonly.config.complete', 'Channel points emoteonly config complete. Emoteonly is now registered to reward $1.');
$.lang.register('channelpointshandler.emoteonly.duration.notset', 'channel points reward, emoteonly duration has not been set. Use "!channelpoints emoteonly duration [duration in seconds]" to set.');
$.lang.register('channelpointshandler.emoteonly.duration.usage', 'channel points reward, emoteonly duration set to $1. Use "!channelpoints emoteonly duration [duration in seconds]" to change.');
$.lang.register('channelpointshandler.emoteonly.duration.message', 'channel points redemption emoteonly will place chat in emote only mode for $1 seconds.');
$.lang.register('channelpointshandler.emoteonly.toggle.id', 'unable to enable emoteonly as no valid reward ID was found. Please use "!channelpoints emoteonly config" to set reward.');
$.lang.register('channelpointshandler.emoteonly.toggle.duration', 'unable to enable emoteonly as no duration has been set. Please use "!channelpoints emoteonly duration [duration in seconds]" to set.');
$.lang.register('channelpointshandler.emoteonly.enabled', 'channel points redemption emoteonly enabled for reward $1.');
$.lang.register('channelpointshandler.emoteonly.disabled', 'channel points redemption emoteonly disabled.');

$.lang.register('channelpointshandler.timeout.info', 'timeout is not enabled. When an timeout redemption is claimed, stated user will be timed out for a set duration. To configure please use "!channelpoints timeout config" or for more info please use "!channelpoints timeout usage."');
$.lang.register('channelpointshandler.timeout.current', 'timeout redemptions are registered to $1 and specified user will be timed out for $2 seconds. To change please use "!channelpoints timeout [config / duration]"');
$.lang.register('channelpointshandler.timeout.usage', 'usage: !channelpoints timeout [usage / config / duration / toggle]');
$.lang.register('channelpointshandler.timeout.config.start', 'channel points timeout config active. Please redeem desired reward.');
$.lang.register('channelpointshandler.timeout.config.complete', 'Channel points timeout config complete. Timeout is now registered to reward $1.');
$.lang.register('channelpointshandler.timeout.duration.notset', 'channel points reward, timeout duration has not been set. Use "!channelpoints timeout duration [duration in seconds]" to set.');
$.lang.register('channelpointshandler.timeout.duration.usage', 'channel points reward, timeout duration set to $1. Use "!channelpoints timeout duration [duration in seconds]" to change.');
$.lang.register('channelpointshandler.timeout.duration.message', 'channel points redemption timeout will time specified user out for $1 seconds.');
$.lang.register('channelpointshandler.timeout.toggle.id', 'unable to enable timeout as no valid reward ID was found. Please use "!channelpoints timeout config" to set reward.');
$.lang.register('channelpointshandler.timeout.toggle.duration', 'unable to enable timeout as no duration has been set. Please use "!channelpoints timeout duration [duration in seconds]" to set.');
$.lang.register('channelpointshandler.timeout.enabled', 'channel points redemption timeout enabled for reward $1.');
$.lang.register('channelpointshandler.timeout.disabled', 'channel points redemption timeout disabled.');
$.lang.register('channelpointshandler.timeout.nouserinput', 'Channel point reward redeemed has no user input so cannot be set used for timeout. Please setup a reward with user input and try again.');