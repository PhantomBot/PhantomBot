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
package com.gmt2001.eventsub;

/**
 * EventSub Transport Data
 *
 * @author gmt2001
 */
public class EventSubTransport {

    private final String method;
    private final String callback;
    private final String secret;

    EventSubTransport(String method, String callback) {
        this.method = method;
        this.callback = callback;
        this.secret = "";
    }

    EventSubTransport(String method, String callback, String secret) {
        this.method = method;
        this.callback = callback;
        this.secret = secret;
    }

    /**
     * The transport method. Supported values: webhook.
     *
     * @return
     */
    public String getMethod() {
        return this.method;
    }

    /**
     * The callback URL where the notification should be sent.
     *
     * @return
     */
    public String getCallback() {
        return this.callback;
    }

    String getSecret() {
        return this.secret;
    }
}
