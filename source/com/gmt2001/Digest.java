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
package com.gmt2001;

import java.math.BigInteger;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.Arrays;

/**
 * Helper to handle digesting a string
 *
 * @author gmt2001
 */
public final class Digest {
    private Digest() {
    }

    /**
     * Calculates a SHA-256 digest
     *
     * @param message The message to calculate the digest on
     * @return The calculated digest
     */
    public static byte[] sha256(byte[] message) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            return md.digest(message);
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("Failed to calculate sha256", e);
        }
    }

    /**
     * Calculates a SHA-256 digest and returns the result as a hex-encoded string
     *
     * @param message The message to calculate the digest on
     * @return The calculated digest as a hex-encoded string
     */
    public static String sha256(String message) {
        return String.format("%064x", new BigInteger(1, sha256(message.getBytes())));
    }

    /**
     * Calculates a SHA-256 digest and compares it to an existing digest
     *
     * @param message The message to calculate the digest on
     * @param digest The existing digest to compare to
     * @return {@code true} if the calculated digest of {@code message} is equal to {@code digest}
     */
    public static boolean compareSha256(byte[] message, byte[] digest) {
        return Arrays.equals(sha256(message), digest);
    }

    /**
     * Calculates a SHA-256 digest and compares it to an existing hex-encoded digest
     *
     * @param message The message to calculate the digest on
     * @param digest The existing hex-encoded digest to compare to
     * @return {@code true} if the calculated digest of {@code message} is equal to {@code digest}
     */
    public static boolean compareSha256(String message, String digest) {
        return sha256(message).equals(digest);
    }
}
