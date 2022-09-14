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
package com.gmt2001.twitch.tmi;

import tv.phantombot.PhantomBot;
import tv.phantombot.cache.UsernameCache;
import tv.phantombot.twitch.api.Helix;

/**
 * Captures and redirects slash commands to Helix
 *
 * @author gmt2001
 */
final class TMISlashCommands {

    private TMISlashCommands() {
    }

    static boolean checkAndProcessCommands(String channel, String message) {
        switch (message.toLowerCase().split(" ")[0]) {
            case "/mods":
            case ".mods":
                PhantomBot.instance().getSession().getModerationStatus();
                break;
            case "/announce":
            case ".announce":
            case "/announcepurple":
            case ".announcepurple":
            case "/announceblue":
            case ".announceblue":
            case "/announcegreen":
            case ".announcegreen":
            case "/announceorange":
            case ".announceorange":
                announce(channel, message);
                break;
            case "/timeout":
            case ".timeout":
                timeout(channel, message);
                break;
            case "/ban":
            case ".ban":
                ban(channel, message);
                break;
            case "/unban":
            case ".unban":
            case "/untimeout":
            case ".untimeout":
                unban(channel, message);
                break;
            case "/delete":
            case ".delete":
                delete(channel, message);
                break;
            case "/clear":
            case ".clear":
                clear(channel);
                break;
            case "/raid":
            case ".raid":
                raid(channel, message);
                break;
            case "/unraid":
            case ".unraid":
                unraid(channel);
                break;
            case ""//follow, sub, r9k, slow
            default:
                return false;
        }

        return true;
    }

    private static void announce(String channel, String message) {
        String color = "";
        if (message.indexOf(' ') > 9) {
            color = message.substring(9, message.indexOf(' '));
        }

        message = message.substring(message.indexOf(' ') + 1);

        Helix.instance().sendChatAnnouncementAsync(UsernameCache.instance().getID(channel), message, color)
                .doOnSuccess(jso -> {
                    if (jso.getInt("status") != 204) {
                        com.gmt2001.Console.err.println("Failed to send an /announce: " + jso.toString());
                    }
                })
                .doOnError(e -> com.gmt2001.Console.err.printStackTrace(e)).subscribe();
    }

    private static void timeout(String channel, String message) {
        String[] params = message.split(" ", 4);

        if (params.length < 2) {
            com.gmt2001.Console.err.println("Failed to /timeout due to missing param");
            return;
        }

        String user_id = UsernameCache.instance().getID(params[1], true);

        if (user_id.equals("0")) {
            com.gmt2001.Console.err.println("Failed to get user id for " + params[1] + ", can not /timeout");
            return;
        }

        int duration;
        if (params.length < 3) {
            duration = 600;
        } else {
            try {
                duration = Integer.parseInt(params[2]);
            } catch (NumberFormatException ex) {
                com.gmt2001.Console.err.println("Failed to convert " + params[2] + " to an integer, using default /timeout duration");
                com.gmt2001.Console.err.printStackTrace(ex, false, true);
                duration = 600;
            }
        }

        Helix.instance().banUserAsync(UsernameCache.instance().getID(channel), user_id, params.length > 3 ? params[3] : null, duration)
                .doOnSuccess(jso -> {
                    if (jso.getInt("status") != 200) {
                        com.gmt2001.Console.err.println("Failed to /timeout " + params[1] + ": " + jso.toString());
                    }
                })
                .doOnError(e -> com.gmt2001.Console.err.printStackTrace(e)).subscribe();
    }

    private static void ban(String channel, String message) {
        String[] params = message.split(" ", 3);

        if (params.length < 2) {
            com.gmt2001.Console.err.println("Failed to /ban due to missing param");
            return;
        }

        String user_id = UsernameCache.instance().getID(params[1], true);

        if (user_id.equals("0")) {
            com.gmt2001.Console.err.println("Failed to get user id for " + params[1] + ", can not /ban");
            return;
        }

        Helix.instance().banUserAsync(UsernameCache.instance().getID(channel), user_id, params.length > 2 ? params[2] : null, 0)
                .doOnSuccess(jso -> {
                    if (jso.getInt("status") != 200) {
                        com.gmt2001.Console.err.println("Failed to /ban " + params[1] + ": " + jso.toString());
                    }
                })
                .doOnError(e -> com.gmt2001.Console.err.printStackTrace(e)).subscribe();
    }

    private static void unban(String channel, String message) {
        String[] params = message.split(" ", 2);

        if (params.length < 2) {
            com.gmt2001.Console.err.println("Failed to /unban due to missing param");
            return;
        }

        String user_id = UsernameCache.instance().getID(params[1], true);

        if (user_id.equals("0")) {
            com.gmt2001.Console.err.println("Failed to get user id for " + params[1] + ", can not /unban");
            return;
        }

        Helix.instance().unbanUserAsync(UsernameCache.instance().getID(channel), user_id)
                .doOnSuccess(jso -> {
                    if (jso.getInt("status") != 204) {
                        com.gmt2001.Console.err.println("Failed to /unban " + params[1] + ": " + jso.toString());
                    }
                })
                .doOnError(e -> com.gmt2001.Console.err.printStackTrace(e)).subscribe();
    }

    private static void delete(String channel, String message) {
        String[] params = message.split(" ", 2);

        if (params.length < 2) {
            com.gmt2001.Console.err.println("Failed to /delete due to missing param");
            return;
        }

        Helix.instance().deleteChatMessagesAsync(UsernameCache.instance().getID(channel), params[1])
                .doOnSuccess(jso -> {
                    if (jso.getInt("status") != 204) {
                        com.gmt2001.Console.err.println("Failed to /delete " + params[1] + ": " + jso.toString());
                    }
                })
                .doOnError(e -> com.gmt2001.Console.err.printStackTrace(e)).subscribe();
    }

    private static void clear(String channel) {
        Helix.instance().deleteChatMessagesAsync(UsernameCache.instance().getID(channel), null)
                .doOnSuccess(jso -> {
                    if (jso.getInt("status") != 204) {
                        com.gmt2001.Console.err.println("Failed to /clear: " + jso.toString());
                    }
                })
                .doOnError(e -> com.gmt2001.Console.err.printStackTrace(e)).subscribe();
    }

    private static void raid(String channel, String message) {
        String[] params = message.split(" ", 2);

        if (params.length < 2) {
            com.gmt2001.Console.err.println("Failed to /raid due to missing param");
            return;
        }

        String user_id = UsernameCache.instance().getID(params[1], true);

        if (user_id.equals("0")) {
            com.gmt2001.Console.err.println("Failed to get user id for " + params[1] + ", can not /raid");
            return;
        }

        Helix.instance().startRaidAsync(UsernameCache.instance().getID(channel), user_id)
                .doOnSuccess(jso -> {
                    if (jso.getInt("status") != 200) {
                        com.gmt2001.Console.err.println("Failed to /raid " + params[1] + ": " + jso.toString());
                    }
                })
                .doOnError(e -> com.gmt2001.Console.err.printStackTrace(e)).subscribe();
    }

    private static void unraid(String channel) {
        Helix.instance().cancelRaidAsync(UsernameCache.instance().getID(channel))
                .doOnSuccess(jso -> {
                    if (jso.getInt("status") != 204) {
                        com.gmt2001.Console.err.println("Failed to /unraid: " + jso.toString());
                    }
                })
                .doOnError(e -> com.gmt2001.Console.err.printStackTrace(e)).subscribe();
    }
}
