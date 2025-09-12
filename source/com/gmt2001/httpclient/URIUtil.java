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
package com.gmt2001.httpclient;

import java.io.UnsupportedEncodingException;
import java.net.URI;
import java.net.URISyntaxException;
import java.net.URLEncoder;
import java.util.regex.Pattern;

/**
 * Assists with creating a {@link URI} by automatically encoding characters that {@link URI} finds unacceptable
 *
 * @author gmt2001
 */
public final class URIUtil {

    private URIUtil() {
    }

    /**
     * Creates a {@link URI} by parsing the given spec as described in RFC 2396 "Uniform Resource Identifiers: Generic * Syntax" and encoding any
     * illegal characters according to the MIME format {@code application/x-www-form-urlencoded} using {@link URLEncoder#encode(String, java.nio.charset.Charset)}
     *
     * @param uri the string to parse
     * @return the {@link URI}; {@code null} if unable to encode some or all of the URI successfully
     * @see https://www.ietf.org/rfc/rfc2396.txt
     */
    public static URI create(String uri) {
        try {
            return create(uri, -1);
        } catch (URISyntaxException ex) {
            com.gmt2001.Console.err.printStackTrace(ex);
        }

        return null;
    }

    /**
     * Recursively parses the input string URI into a {@link URI}, encoding illegal characters
     * <p>
     * If a {@link URISyntaxException} is thrown in the same location on 2 attempts in a row, then encoding stops and it is thrown up the stack
     *
     * @param uri the current URI string, after any modifications made in the previous attempt
     * @param lastidx the last index where a {@link URISyntaxException} ocurred
     * @return the {@link URI}
     * @throws URISyntaxException if the input string could not be parsed into a {@link URI} despite attempting to encode all illegal characters
     */
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
                    return create(uri.substring(0, ex.getIndex()) + uri.substring(ex.getIndex()).replaceAll(Pattern.quote(c), e), ex.getIndex());
                } catch (URISyntaxException ex3) {
                    throw ex;
                }
            }

            throw ex;
        }
    }
}
