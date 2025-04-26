/*
 * Copyright (C) 2016-2024 phantombot.github.io/PhantomBot
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
package com.gmt2001.util;

import tv.phantombot.CaselessProperties;

/**
 * Filters log data
 */
public class LogFilter {
    private LogFilter(){}

    public static String filter(String message) {
        if (message.contains(CaselessProperties.instance().getProperty("oauth", ""))) {
            message = replace(message, (CaselessProperties.instance().getProperty("oauth", ""), "***");
        } else if (message.contains(CaselessProperties.instance().getProperty("apioauth", ""))) {
            message = replace(message, (CaselessProperties.instance().getProperty("apioauth", ""), "***");
        } else if (message.contains(CaselessProperties.instance().getProperty("refresh", ""))) {
            message = replace(message, (CaselessProperties.instance().getProperty("refresh", ""), "***");
        } else if (message.contains(CaselessProperties.instance().getProperty("apirefresh", ""))) {
            message = replace(message, (CaselessProperties.instance().getProperty("apirefresh", ""), "***");
        } else if (message.contains(CaselessProperties.instance().getProperty("apptoken", ""))) {
            message = replace(message, (CaselessProperties.instance().getProperty("apptoken", ""), "***");
        } else if (message.contains(CaselessProperties.instance().getProperty("discord_token", ""))) {
            message = replace(message, (CaselessProperties.instance().getProperty("discord_token", ""), "***");
        } else if (message.contains(CaselessProperties.instance().getProperty("streamlabskey", ""))) {
            message = replace(message, (CaselessProperties.instance().getProperty("streamlabskey", ""), "***");
        } else if (message.contains(CaselessProperties.instance().getProperty("youtubekey", ""))) {
            message = replace(message, (CaselessProperties.instance().getProperty("youtubekey", ""), "***");
        } else if (message.contains(CaselessProperties.instance().getProperty("clientid", ""))) {
            message = replace(message, (CaselessProperties.instance().getProperty("clientid", ""), "***");
        } else if (message.contains(CaselessProperties.instance().getProperty("clientsecret", ""))) {
            message = replace(message, (CaselessProperties.instance().getProperty("clientsecret", ""), "***");
        }
        return message;
    }

    private static String replace(String message, String find, String replace) {
        if (!find.isBlank()) {
            message = message.replace(find, replace);
        }

        return message;
    }
}
