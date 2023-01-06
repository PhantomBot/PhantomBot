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

$.lang.register('discord.accountlink.usage.nolink', 'In order to use this module, make sure the bot is not blocked from private messaging you on Discord.\nTo link your Discord and Twitch accounts please use the following command **!account link**');
$.lang.register('discord.accountlink.usage.link', 'Your Discord account is currently linked to **https://twitch.tv/$1**.\nYou can change it using **!account link** or remove it using **!account remove**');
$.lang.register('discord.accountlink.link', '**NOTE: This expires in 10 minutes**.\nTo complete the process of linking your Discord and Twitch accounts, please login to Twitch, go to **https://twitch.tv/$1**, and send the command **!account link $2**');
$.lang.register('discord.accountlink.link.relink', '**NOTE: This expires in 10 minutes**.\n**This will automatically remove your previous account link.** \nTo complete the process of linking your Discord account to your Twitch account, please login to Twitch, go to **https://twitch.tv/$1**, and send the command **!account link $2**');
$.lang.register('discord.accountlink.link.success', 'Your Discord account has been successfully linked to **https://twitch.tv/$1**.\nPlease note that if you change your name on Twitch, you will have to redo this.');
$.lang.register('discord.accountlink.link.fail', 'Sorry, that is an invalid or expired token. Make sure you copy the account linking command EXACTLY. If you are sure you typed it correctly, please restart the account linking process from a chat channel in the Discord server.');
$.lang.register('discord.accountlink.link.remove', 'Your Discord account has been unlinked from all Twitch accounts.\nTo link your Discord account to your Twitch account, use **!account link** in a regular chat channel on the Discord server');
$.lang.register('discord.accountlink.linkrequired', 'Sorry, that command is only available in Discord after your Twitch account has been linked using **!account**');
