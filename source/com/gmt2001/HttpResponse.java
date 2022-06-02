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
package com.gmt2001;

import com.gmt2001.HttpRequest.RequestType;
import java.util.Map;

/**
 *
 * @author gmt2001
 */
@Deprecated
public class HttpResponse {

    public RequestType type;
    public String url;
    public String post;
    public String content;
    public Map<String, String> headers;
    public int httpCode;
    public boolean success;
    public String exception;
    public Exception rawException;

    @Override
    public String toString() {
        if (exception != null && !exception.isEmpty()) {
            return type.name() + " " + url + " {" + post + "} -> EXCEPTION " + exception;
        }

        return type.name() + " " + url + " {" + post + "} -> " + httpCode + " " + content;
    }
}
