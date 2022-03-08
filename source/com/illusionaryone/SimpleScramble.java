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

/* Provide a simple scramble mechanism for strings.  Do not rely on this
 * for security as, obviously, the source code is right here making reverse
 * engineering very easy to do.  The idea is to simply make something a
 * little harder to read instantly, nothing more than that.
 */

package com.illusionaryone;

import java.io.UnsupportedEncodingException;
import java.util.Base64;

public class SimpleScramble {
    private String simpleSalt = "%M+JPH~b#q9$yV+'atwq'|2s*A6?=h";

    public String simpleFixedScramble(String unscrambled) {
        if (unscrambled == null) {
            return null;
        }
        try {
            return Base64.getEncoder().encodeToString(applySalt(unscrambled.getBytes("UTF-8")));
        } catch (IllegalArgumentException ex) {
            return null;
        } catch (UnsupportedEncodingException ex) {
            return null;
        }
    }

    public String simpleFixedUnscramble(String scrambled) {
        if (scrambled == null) {
            return null;
        }
        try {
            return new String(applySalt(Base64.getDecoder().decode(scrambled.getBytes("UTF-8"))));
        } catch (IllegalArgumentException ex) {
            return null;
        } catch (UnsupportedEncodingException ex) {
            return null;
        }
    }

    private byte[] applySalt(final byte[] input) {
        final byte[] output = new byte[input.length];
        final byte[] secret = simpleSalt.getBytes();
        int spos = 0;

        for (int pos = 0; pos < input.length; ++pos) {
            output[pos] = (byte) (input[pos] ^ secret[spos]);
            spos += 1;
            if (spos >= secret.length) {
                spos = 0;
            }
        }
        return output;
    }

}

