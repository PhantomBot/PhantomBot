/*
 * Copyright (C) 2016-2025 phantombot.github.io/PhantomBot
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

import java.time.Duration;

import com.gmt2001.twitch.cache.Viewer;
import com.gmt2001.twitch.cache.ViewerCache;
import com.gmt2001.util.DurationString;

import tv.phantombot.PhantomBot;
import tv.phantombot.twitch.api.Helix;

/**
 * Captures and redirects slash commands to Helix
 *
 * @author gmt2001
 */
public final class TMISlashCommands {

    private TMISlashCommands() {
    }

    public static boolean checkAndProcessCommands(String channel, String message) {
        String cmd = message.toLowerCase().split(" ")[0];
        switch (cmd) {
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
            case "/shoutout":
            case ".shoutout":
                shoutout(channel, message);
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
            case "/followers":
            case ".followers":
                followers(channel, message);
                break;
            case "/followersoff":
            case ".followersoff":
                followersoff(channel);
                break;
            case "/emoteonly":
            case ".emoteonly":
                emoteonly(channel);
                break;
            case "/emoteonlyoff":
            case ".emoteonlyoff":
                emoteonlyoff(channel);
                break;
            case "/shield":
            case ".shield":
                shield(channel);
                break;
            case "/shieldoff":
            case ".shieldoff":
                shieldoff(channel);
                break;
            case "/slow":
            case ".slow":
                slow(channel, message);
                break;
            case "/slowoff":
            case ".slowoff":
                slowoff(channel);
                break;
            case "/subscribers":
            case ".subscribers":
                subscribers(channel);
                break;
            case "/subscribersoff":
            case ".subscribersoff":
                subscribersoff(channel);
                break;
            case "/uniquechat":
            case ".uniquechat":
            case "/r9kbeta":
            case ".r9kbeta":
                uniquechat(channel);
                break;
            case "/uniquechatoff":
            case ".uniquechatoff":
            case "/r9kbetaoff":
            case ".r9kbetaoff":
                uniquechatoff(channel);
                break;
            case "/commercial":
            case ".commercial":
                commercial(channel, message);
                break;
            case "/w":
            case ".w":
                whisper(message);
                break;
            case "/mod":
            case ".mod":
                mod(message);
                break;
            case "/unmod":
            case ".unmod":
                unmod(message);
                break;
            case "/vip":
            case ".vip":
                vip(message);
                break;
            case "/unvip":
            case ".unvip":
                unvip(message);
                break;
            default:
                return false;
        }

        com.gmt2001.Console.debug.println("Redirected command " + cmd);

        return true;
    }

    private static void announce(String channel, String message) {
        String[] params = message.split(" ", 2);

        if (params.length < 2) {
            com.gmt2001.Console.err.println("Failed to /announce due to missing param");
            return;
        }

        String color = "";
        if (params[0].length() > 9) {
            color = params[0].substring(9);
        }

        Helix.instance().sendChatAnnouncementAsync(ViewerCache.instance().broadcaster().id(), params[1], color)
                .doOnSuccess(jso -> {
                    if (jso.getInt("_http") != 204) {
                        com.gmt2001.Console.err.println("Failed to send an /announce: " + jso.toString());
                    }
                })
                .doOnError(e -> com.gmt2001.Console.err.printStackTrace(e)).subscribe();
    }

    private static void shoutout(String channel, String message) {
        String[] params = message.split(" ", 2);

        if (params.length < 2) {
            com.gmt2001.Console.err.println("Failed to /shoutout due to missing param");
            return;
        }

        String from_user_id = ViewerCache.instance().broadcaster().id();

        if (from_user_id == null || from_user_id.equals("0")) {
            com.gmt2001.Console.err.println("Failed to get user id for " + channel + ", can not /shoutout");
            return;
        }

        Viewer user = ViewerCache.instance().getByLogin(params[1]);

        if (user == null || user.id().equals("0")) {
            com.gmt2001.Console.err.println("Failed to get user id for " + params[1] + ", can not /shoutout");
            return;
        }

        String to_user_id = user.id();

        Helix.instance().sendShoutoutAsync(from_user_id, to_user_id)
                .doOnSuccess(jso -> {
                    if (jso.getInt("_http") == 429) {
                        com.gmt2001.Console.err.println("Failed to /shoutout " + params[1]
                                + " due to rate limit (2/min, 60 min cooldown for same target): " + jso.toString());
                    } else if (jso.getInt("_http") != 204) {
                        com.gmt2001.Console.err.println("Failed to /shoutout " + params[1] + ": " + jso.toString());
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

        Viewer user = ViewerCache.instance().getByLogin(params[1]);

        if (user == null || user.id().equals("0")) {
            com.gmt2001.Console.err.println("Failed to get user id for " + params[1] + ", can not /timeout");
            return;
        }

        String user_id = user.id();

        int duration;
        if (params.length < 3) {
            duration = 600;
        } else {
            try {
                duration = Integer.parseInt(params[2]);
            } catch (NumberFormatException ex) {
                Duration d = DurationString.from(params[2]);
                if (!d.isZero() && !d.isNegative()) {
                    duration = (int) d.getSeconds();
                } else {
                    com.gmt2001.Console.err.println(
                            "Failed to convert " + params[2] + " to an integer, using default /timeout duration");
                    com.gmt2001.Console.err.printStackTrace(ex, false, true);
                    duration = 600;
                }
            }
        }

        Helix.instance()
                .banUserAsync(ViewerCache.instance().broadcaster().id(), user_id,
                        params.length > 3 ? params[3] : null, duration)
                .doOnSuccess(jso -> {
                    if (jso.getInt("_http") != 200) {
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

        Viewer user = ViewerCache.instance().getByLogin(params[1]);

        if (user == null || user.id().equals("0")) {
            com.gmt2001.Console.err.println("Failed to get user id for " + params[1] + ", can not /ban");
            return;
        }

        String user_id = user.id();

        Helix.instance()
                .banUserAsync(ViewerCache.instance().broadcaster().id(), user_id,
                        params.length > 2 ? params[2] : null, 0)
                .doOnSuccess(jso -> {
                    if (jso.getInt("_http") != 200) {
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

        Viewer user = ViewerCache.instance().getByLogin(params[1]);

        if (user == null || user.id().equals("0")) {
            com.gmt2001.Console.err.println("Failed to get user id for " + params[1] + ", can not /unban");
            return;
        }

        String user_id = user.id();

        Helix.instance().unbanUserAsync(ViewerCache.instance().broadcaster().id(), user_id)
                .doOnSuccess(jso -> {
                    if (jso.getInt("_http") != 204) {
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

        Helix.instance().deleteChatMessagesAsync(ViewerCache.instance().broadcaster().id(), params[1])
                .doOnSuccess(jso -> {
                    if (jso.getInt("_http") != 204) {
                        com.gmt2001.Console.err.println("Failed to /delete " + params[1] + ": " + jso.toString());
                    }
                })
                .doOnError(e -> com.gmt2001.Console.err.printStackTrace(e)).subscribe();
    }

    private static void clear(String channel) {
        Helix.instance().deleteChatMessagesAsync(ViewerCache.instance().broadcaster().id(), null)
                .doOnSuccess(jso -> {
                    if (jso.getInt("_http") != 204) {
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

        Viewer user = ViewerCache.instance().getByLogin(params[1]);

        if (user == null || user.id().equals("0")) {
            com.gmt2001.Console.err.println("Failed to get user id for " + params[1] + ", can not /raid");
            return;
        }

        String user_id = user.id();

        Helix.instance().startRaidAsync(ViewerCache.instance().broadcaster().id(), user_id)
                .doOnSuccess(jso -> {
                    if (jso.getInt("_http") != 200) {
                        com.gmt2001.Console.err.println("Failed to /raid " + params[1] + ": " + jso.toString());
                    }
                })
                .doOnError(e -> com.gmt2001.Console.err.printStackTrace(e)).subscribe();
    }

    private static void unraid(String channel) {
        Helix.instance().cancelRaidAsync(ViewerCache.instance().broadcaster().id())
                .doOnSuccess(jso -> {
                    if (jso.getInt("_http") != 204) {
                        com.gmt2001.Console.err.println("Failed to /unraid: " + jso.toString());
                    }
                })
                .doOnError(e -> com.gmt2001.Console.err.printStackTrace(e)).subscribe();
    }

    private static void followers(String channel, String message) {
        String[] params = message.split(" ", 2);

        int duration;
        if (params.length < 2) {
            duration = 0;
        } else {
            try {
                duration = Integer.parseInt(params[1]);
            } catch (NumberFormatException ex) {
                com.gmt2001.Console.err.println(
                        "Failed to convert " + params[1] + " to an integer, using default /followers duration");
                com.gmt2001.Console.err.printStackTrace(ex, false, true);
                duration = 0;
            }
        }

        Helix.instance()
                .updateChatSettingsAsync(ViewerCache.instance().broadcaster().id(), null, true, duration, null,
                        null, null, null, null, null)
                .doOnSuccess(jso -> {
                    if (jso.getInt("_http") != 200) {
                        com.gmt2001.Console.err.println("Failed to /followers: " + jso.toString());
                    }
                })
                .doOnError(e -> com.gmt2001.Console.err.printStackTrace(e)).subscribe();
    }

    private static void followersoff(String channel) {
        Helix.instance()
                .updateChatSettingsAsync(ViewerCache.instance().broadcaster().id(), null, false, null, null, null,
                        null, null, null, null)
                .doOnSuccess(jso -> {
                    if (jso.getInt("_http") != 200) {
                        com.gmt2001.Console.err.println("Failed to /followersoff: " + jso.toString());
                    }
                })
                .doOnError(e -> com.gmt2001.Console.err.printStackTrace(e)).subscribe();
    }

    private static void emoteonly(String channel) {
        Helix.instance()
                .updateChatSettingsAsync(ViewerCache.instance().broadcaster().id(), true, null, null, null, null,
                        null, null, null, null)
                .doOnSuccess(jso -> {
                    if (jso.getInt("_http") != 200) {
                        com.gmt2001.Console.err.println("Failed to /emoteonly: " + jso.toString());
                    }
                })
                .doOnError(e -> com.gmt2001.Console.err.printStackTrace(e)).subscribe();
    }

    private static void emoteonlyoff(String channel) {
        Helix.instance()
                .updateChatSettingsAsync(ViewerCache.instance().broadcaster().id(), false, null, null, null, null,
                        null, null, null, null)
                .doOnSuccess(jso -> {
                    if (jso.getInt("_http") != 200) {
                        com.gmt2001.Console.err.println("Failed to /emoteonlyoff: " + jso.toString());
                    }
                })
                .doOnError(e -> com.gmt2001.Console.err.printStackTrace(e)).subscribe();
    }

    private static void shield(String channel) {
        Helix.instance().updateShieldModeStatusAsync(ViewerCache.instance().broadcaster().id(), true)
                .doOnSuccess(jso -> {
                    if (jso.getInt("_http") != 200) {
                        com.gmt2001.Console.err.println("Failed to /shield: " + jso.toString());
                    }
                })
                .doOnError(e -> com.gmt2001.Console.err.printStackTrace(e)).subscribe();
    }

    private static void shieldoff(String channel) {
        Helix.instance().updateShieldModeStatusAsync(ViewerCache.instance().broadcaster().id(), false)
                .doOnSuccess(jso -> {
                    if (jso.getInt("_http") != 200) {
                        com.gmt2001.Console.err.println("Failed to /shieldoff: " + jso.toString());
                    }
                })
                .doOnError(e -> com.gmt2001.Console.err.printStackTrace(e)).subscribe();
    }

    private static void slow(String channel, String message) {
        String[] params = message.split(" ", 2);

        int duration;
        if (params.length < 2) {
            duration = 30;
        } else {
            try {
                duration = Integer.parseInt(params[1]);
            } catch (NumberFormatException ex) {
                com.gmt2001.Console.err
                        .println("Failed to convert " + params[1] + " to an integer, using default /slow duration");
                com.gmt2001.Console.err.printStackTrace(ex, false, true);
                duration = 30;
            }
        }

        Helix.instance()
                .updateChatSettingsAsync(ViewerCache.instance().broadcaster().id(), null, null, null, null, null,
                        true, duration, null, null)
                .doOnSuccess(jso -> {
                    if (jso.getInt("_http") != 200) {
                        com.gmt2001.Console.err.println("Failed to /slow: " + jso.toString());
                    }
                })
                .doOnError(e -> com.gmt2001.Console.err.printStackTrace(e)).subscribe();
    }

    private static void slowoff(String channel) {
        Helix.instance()
                .updateChatSettingsAsync(ViewerCache.instance().broadcaster().id(), null, null, null, null, null,
                        false, null, null, null)
                .doOnSuccess(jso -> {
                    if (jso.getInt("_http") != 200) {
                        com.gmt2001.Console.err.println("Failed to /slowoff: " + jso.toString());
                    }
                })
                .doOnError(e -> com.gmt2001.Console.err.printStackTrace(e)).subscribe();
    }

    private static void subscribers(String channel) {
        Helix.instance()
                .updateChatSettingsAsync(ViewerCache.instance().broadcaster().id(), null, null, null, null, null,
                        null, null, true, null)
                .doOnSuccess(jso -> {
                    if (jso.getInt("_http") != 200) {
                        com.gmt2001.Console.err.println("Failed to /subscribers: " + jso.toString());
                    }
                })
                .doOnError(e -> com.gmt2001.Console.err.printStackTrace(e)).subscribe();
    }

    private static void subscribersoff(String channel) {
        Helix.instance()
                .updateChatSettingsAsync(ViewerCache.instance().broadcaster().id(), null, null, null, null, null,
                        null, null, false, null)
                .doOnSuccess(jso -> {
                    if (jso.getInt("_http") != 200) {
                        com.gmt2001.Console.err.println("Failed to /subscribersoff: " + jso.toString());
                    }
                })
                .doOnError(e -> com.gmt2001.Console.err.printStackTrace(e)).subscribe();
    }

    private static void uniquechat(String channel) {
        Helix.instance()
                .updateChatSettingsAsync(ViewerCache.instance().broadcaster().id(), null, null, null, null, null,
                        null, null, null, true)
                .doOnSuccess(jso -> {
                    if (jso.getInt("_http") != 200) {
                        com.gmt2001.Console.err.println("Failed to /uniquechat: " + jso.toString());
                    }
                })
                .doOnError(e -> com.gmt2001.Console.err.printStackTrace(e)).subscribe();
    }

    private static void uniquechatoff(String channel) {
        Helix.instance()
                .updateChatSettingsAsync(ViewerCache.instance().broadcaster().id(), null, null, null, null, null,
                        null, null, null, false)
                .doOnSuccess(jso -> {
                    if (jso.getInt("_http") != 200) {
                        com.gmt2001.Console.err.println("Failed to /uniquechatoff: " + jso.toString());
                    }
                })
                .doOnError(e -> com.gmt2001.Console.err.printStackTrace(e)).subscribe();
    }

    private static void commercial(String channel, String message) {
        String[] params = message.split(" ", 2);

        int duration;
        if (params.length < 2) {
            duration = 30;
        } else {
            try {
                duration = Integer.parseInt(params[1]);
            } catch (NumberFormatException ex) {
                com.gmt2001.Console.err.println(
                        "Failed to convert " + params[1] + " to an integer, using default /commercial duration");
                com.gmt2001.Console.err.printStackTrace(ex, false, true);
                duration = 30;
            }
        }

        Helix.instance().startCommercialAsync(ViewerCache.instance().broadcaster().id(), duration)
                .doOnSuccess(jso -> {
                    if (jso.getInt("_http") != 200) {
                        com.gmt2001.Console.err.println("Failed to /commercial: " + jso.toString());
                    }
                })
                .doOnError(e -> com.gmt2001.Console.err.printStackTrace(e)).subscribe();
    }

    private static void whisper(String message) {
        String[] params = message.split(" ", 3);

        if (params.length < 3) {
            com.gmt2001.Console.err.println("Failed to /w due to missing param");
            return;
        }

        Viewer user = ViewerCache.instance().getByLogin(params[1]);

        if (user == null || user.id().equals("0")) {
            com.gmt2001.Console.err.println("Failed to get user id for " + params[1] + ", can not /w");
            return;
        }

        String user_id = user.id();

        Helix.instance().sendWhisperAsync(user_id, params[2])
                .doOnSuccess(jso -> {
                    if (jso.getInt("_http") != 204) {
                        com.gmt2001.Console.err.println("Failed to /w " + params[1] + ": " + jso.toString());
                    }
                })
                .doOnError(e -> com.gmt2001.Console.err.printStackTrace(e)).subscribe();
    }

    private static void mod(String message) {
        String[] params = message.split(" ", 3);

        if (params.length < 2) {
            com.gmt2001.Console.err.println("Failed to /mod due to missing param");
            return;
        }

        Viewer user = ViewerCache.instance().getByLogin(params[1]);

        if (user == null || user.id().equals("0")) {
            com.gmt2001.Console.err.println("Failed to get user id for " + params[1] + ", can not /mod");
            return;
        }

        String user_id = user.id();

        Helix.instance()
                .addChannelModeratorAsync(ViewerCache.instance().broadcaster().id(), user_id)
                .doOnSuccess(jso -> {
                    if (jso.getInt("_http") != 204) {
                        com.gmt2001.Console.err.println("Failed to /mod " + params[1] + ": " + jso.toString());
                    }
                })
                .doOnError(e -> com.gmt2001.Console.err.printStackTrace(e)).subscribe();
    }

    private static void unmod(String message) {
        String[] params = message.split(" ", 3);

        if (params.length < 2) {
            com.gmt2001.Console.err.println("Failed to /unmod due to missing param");
            return;
        }

        Viewer user = ViewerCache.instance().getByLogin(params[1]);

        if (user == null || user.id().equals("0")) {
            com.gmt2001.Console.err.println("Failed to get user id for " + params[1] + ", can not /unmod");
            return;
        }

        String user_id = user.id();

        Helix.instance()
                .removeChannelModeratorAsync(ViewerCache.instance().broadcaster().id(), user_id)
                .doOnSuccess(jso -> {
                    if (jso.getInt("_http") != 204) {
                        com.gmt2001.Console.err.println("Failed to /unmod " + params[1] + ": " + jso.toString());
                    }
                })
                .doOnError(e -> com.gmt2001.Console.err.printStackTrace(e)).subscribe();
    }

    private static void vip(String message) {
        String[] params = message.split(" ", 3);

        if (params.length < 2) {
            com.gmt2001.Console.err.println("Failed to /vip due to missing param");
            return;
        }

        Viewer user = ViewerCache.instance().getByLogin(params[1]);

        if (user == null || user.id().equals("0")) {
            com.gmt2001.Console.err.println("Failed to get user id for " + params[1] + ", can not /vip");
            return;
        }

        String user_id = user.id();

        Helix.instance()
                .addChannelVIPAsync(ViewerCache.instance().broadcaster().id(), user_id)
                .doOnSuccess(jso -> {
                    if (jso.getInt("_http") != 204) {
                        com.gmt2001.Console.err.println("Failed to /vip " + params[1] + ": " + jso.toString());
                    }
                })
                .doOnError(e -> com.gmt2001.Console.err.printStackTrace(e)).subscribe();
    }

    private static void unvip(String message) {
        String[] params = message.split(" ", 3);

        if (params.length < 2) {
            com.gmt2001.Console.err.println("Failed to /unvip due to missing param");
            return;
        }

        Viewer user = ViewerCache.instance().getByLogin(params[1]);

        if (user == null || user.id().equals("0")) {
            com.gmt2001.Console.err.println("Failed to get user id for " + params[1] + ", can not /unvip");
            return;
        }

        String user_id = user.id();

        Helix.instance()
                .removeChannelVIPAsync(ViewerCache.instance().broadcaster().id(), user_id)
                .doOnSuccess(jso -> {
                    if (jso.getInt("_http") != 204) {
                        com.gmt2001.Console.err.println("Failed to /unvip " + params[1] + ": " + jso.toString());
                    }
                })
                .doOnError(e -> com.gmt2001.Console.err.printStackTrace(e)).subscribe();
    }
}
