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
package com.gmt2001.httpclient;

import java.io.UnsupportedEncodingException;
import java.net.URI;
import java.net.URISyntaxException;
import java.net.URLEncoder;

/**
 *
 * @author gmt2001
 */
public class URIUtil {

    private URIUtil() {
    }

    /**
     * Creates a {@link URI} by parsing the given spec as described in RFC 2396 "Uniform Resource Identifiers: Generic * Syntax" and encoding any
     * illegal characters according to the MIME format {@code application/x-www-form-urlencoded}
     *
     * @param uri The string to parse
     * @return The URI
     */
    public static URI create(String uri) {
        try {
            return create(uri, -1);
        } catch (URISyntaxException ex) {
            com.gmt2001.Console.err.printStackTrace(ex);
        }

        return null;
    }

    private static URI create(String uri, int lastidx) throws URISyntaxException {
        try {
            return new URI(uri);
        } catch (URISyntaxException ex) {
            if (ex.getIndex() >= 0 && ex.getIndex() > lastidx) {
                String c = uri.substring(ex.getIndex(), ex.getIndex() + 1);
                String e;

                try {
                    e = URLEncoder.encode(c, "UTF-8");
                } catch (UnsupportedEncodingException ex2) {
                    com.gmt2001.Console.err.printStackTrace(ex2);
                    e = "";
                }

                try {
                    return create(uri.substring(0, ex.getIndex()) + uri.substring(ex.getIndex()).replaceAll(c, e), ex.getIndex());
                } catch (URISyntaxException ex3) {
                    throw ex;
                }
            }

            throw ex;
        }
    }
}
