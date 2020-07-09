/*
 * Copyright (C) 2016-2020 phantombot.tv
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

$.lang.register('channelpointshandler.usage', 'Usage: !channelpoints [transfer / giveall / emoteonly / timeout]');

$.lang.register('channelpointshandler.transfer.setup', 'When a transfer redemption is claimed, user will be given a set amount of points. To configure please use "!channelpoints transfer config".');
$.lang.register('channelpointshandler.transfer.setup.enabled', 'Transfer redemptions are registered to $1 and user will receive $2 points for each redemption.');
$.lang.register('channelpointshandler.transfer.setup.disabled', 'Transfer redemptions are currently disabled. Use "!channelpoints transfer toggle" to enable.');
$.lang.register('channelpointshandler.transfer.usage', 'When a transfer channel point redemption is claimed, users will be given a set amount of points. Usage: !channelpoints transfer [config / toggle / amount]');
$.lang.register('channelpointshandler.transfer.id', 'Transfer cannot be enabled as the reward ID has not been set. Please use [!channelpoints transfer config] to set ID.');
$.lang.register('channelpointshandler.transfer.enabled', 'Channel points redemption transfer enabled for reward $1.');
$.lang.register('channelpointshandler.transfer.disabled', 'Channel points redemption transfer disabled.');
$.lang.register('channelpointshandler.transfer.amount.usage', 'Channel points reward, transfer amount set to $1. Use "!channelpoints transfer amount [amount of points bot will award]" to change.');
$.lang.register('channelpointshandler.transfer.amount.message', 'Channel points redemption transfer will add $1 points to user who redemed the reward.');
$.lang.register('channelpointshandler.transfer.config.on', 'Channel points transfer config active. Please redeem desired item then type: !channelpoints transfer config');
$.lang.register('channelpointshandler.transfer.config.off', 'Channel points transfer config complete. Transfer is registered to $1 reward.');

$.lang.register('channelpointshandler.giveall.setup', 'When a give all redemption is claimed, all users in chat will be given a set amount of points. To configure please use "!channelpoints giveall config".');
$.lang.register('channelpointshandler.giveall.setup.enabled', 'Give all redemptions are registered to $1 and users receive $2 points for each redemption.');
$.lang.register('channelpointshandler.giveall.setup.disabled', 'Give all redemptions are currently disabled. Use "!channelpoints giveall toggle" to enable.');
$.lang.register('channelpointshandler.giveall.usage', 'When a give all channel point redemption is claimed, all users in chat will be given a set amount of points. Usage: !channelpoints giveall [config / toggle / amount]');
$.lang.register('channelpointshandler.giveall.id', 'Give all cannot be enabled as the reward ID has not been set. Please use [!channelpoints giveall config] to set ID.');
$.lang.register('channelpointshandler.giveall.enabled', 'Channel points redemption give all enabled for reward $1.');
$.lang.register('channelpointshandler.giveall.disabled', 'Channel points redemption give all disabled.');
$.lang.register('channelpointshandler.giveall.amount.usage', 'Channel points reward, give all amount set to $1. Use "!channelpoints giveall amount [amount of points bot will award]" to change.');
$.lang.register('channelpointshandler.giveall.amount.message', 'Channel points redemption give all will add $1 points to all users.');
$.lang.register('channelpointshandler.giveall.config.on', 'Channel points give all config active. Please redeem desired item then type: !channelpoints giveall config');
$.lang.register('channelpointshandler.giveall.config.off', 'Channel points give all config complete. Give all is registered to $1 reward.');

$.lang.register('channelpointshandler.emoteonly.setup', 'When an emote only redemption is claimed, all users in chat will be given a set amount of points. To configure please use "!channelpoints emoteonly config".');
$.lang.register('channelpointshandler.emoteonly.setup.enabled', 'emote only chat redemptions are registered to $1 and chat will be put in emote-only mode for $2 seconds for each redemption.');
$.lang.register('channelpointshandler.emoteonly.setup.disabled', 'Emote only chat redemptions are currently disabled. Use "!channelpoints emoteonly toggle" to enable.');
$.lang.register('channelpointshandler.emoteonly.usage', 'When an emote only chat channel point redemption is claimed, chat will be placed in emote only mode for a set duration. Usage: !channelpoints emoteonly [config / toggle / duration]');
$.lang.register('channelpointshandler.emoteonly.id', 'Emote only cannot be enabled as the reward ID has not been set. Please use [!channelpoints emoteonly config] to set ID.');
$.lang.register('channelpointshandler.emoteonly.enabled', 'Channel points redemption emote only enabled for reward $1.');
$.lang.register('channelpointshandler.emoteonly.disabled', 'Channel points redemption emote only disabled.');
$.lang.register('channelpointshandler.emoteonly.duration.usage', 'Channel points reward, emote only chat duration set to $1. Use "!channelpoints emoteonly duration [time chat will be emote only mode]" to change.');
$.lang.register('channelpointshandler.emoteonly.duration.message', 'Channel points redemption emote only chat will put chat in emote only mode for $1 seconds.');
$.lang.register('channelpointshandler.emoteonly.config.on', 'Channel points emote only config active. Please redeem desired item then type: !channelpoints emoteonly config');
$.lang.register('channelpointshandler.emoteonly.config.off', 'Channel points emote only config complete. Emote only chat is registered to $1 reward.');

$.lang.register('channelpointshandler.timeout.setup', 'When a timeout redemption is claimed, all users in chat will be given a set amount of points. To configure please use "!channelpoints timeout config".');
$.lang.register('channelpointshandler.timeout.setup.enabled', 'Timeout redemptions are registered to $1 and users receive $2 points for each redemption.');
$.lang.register('channelpointshandler.timeout.setup.disabled', 'Timeout redemptions are currently disabled. Use "!channelpoints timeout toggle" to enable.');
$.lang.register('channelpointshandler.timeout.usage', 'When an timeout channel point redemption is claimed, the user stated will be timed out for a set duration. Usage: !channelpoints timeout [config / toggle / duration]');
$.lang.register('channelpointshandler.timeout.id', 'Timeout cannot be enabled as the reward ID has not been set. Please use [!channelpoints timeout config] to set ID.');
$.lang.register('channelpointshandler.timeout.enabled', 'Channel points redemption timeout enabled for reward $1.');
$.lang.register('channelpointshandler.timeout.disabled', 'Channel points redemption timeout disabled.');
$.lang.register('channelpointshandler.timeout.duration.usage', 'Channel points reward, timeout duration set to $1. Use "!channelpoints timeout duration [time chat will be timeout mode]" to change.');
$.lang.register('channelpointshandler.timeout.duration.message', 'Channel points redemption timeout will timeout stated user for $1 seconds.');
$.lang.register('channelpointshandler.timeout.config.on', 'Channel points timeout config active. Please redeem desired item then type: !channelpoints timeout config');
$.lang.register('channelpointshandler.timeout.config.off', 'Channel points timeout config complete. Timeout is registered to $1 reward.');