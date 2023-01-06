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
import java.security.InvalidKeyException;
import java.security.NoSuchAlgorithmException;
import java.util.Arrays;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;

/**
 * https://sorenpoulsen.com/calculate-hmac-sha256-with-java
 *
 * @author Søren Poulsen and gmt2001
 */
public final class HMAC {

    private HMAC() {
    }

    /**
     * Calculates an HMAC-SHA256
     *
     * @param secretKey The secret key
     * @param message The message to calculate the mac on
     * @return
     */
    public static byte[] calcHmacSha256(byte[] secretKey, byte[] message) {
        byte[] hmacSha256 = null;

        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            SecretKeySpec secretKeySpec = new SecretKeySpec(secretKey, "HmacSHA256");
            mac.init(secretKeySpec);
            hmacSha256 = mac.doFinal(message);
        } catch (IllegalStateException | InvalidKeyException | NoSuchAlgorithmException e) {
            throw new RuntimeException("Failed to calculate hmac-sha256", e);
        }

        return hmacSha256;
    }

    /**
     * Calculates an HMAC-SHA256 and returns the MAC as a hex-encoded string
     *
     * @param secretKey The secret key
     * @param message The message to calculate the mac on
     * @return
     */
    public static String calcHmacSha256(String secretKey, String message) {
        return String.format("%064x", new BigInteger(1, calcHmacSha256(secretKey.getBytes(), message.getBytes())));
    }

    /**
     * Calculates an HMAC-SHA256 and compares it to an existing MAC
     *
     * @param secretKey The secret key
     * @param message The message to calculate the mac on
     * @param mac The MAC to compare to
     * @return true if the calculated mac matches the provided mac
     */
    public static boolean compareHmacSha256(byte[] secretKey, byte[] message, byte[] mac) {
        return Arrays.equals(calcHmacSha256(secretKey, message), mac);
    }

    /**
     * Calculates an HMAC-SHA256 and compares it to an existing MAC
     *
     * @param secretKey The secret key
     * @param message The message to calculate the mac on
     * @param mac The MAC to compare to
     * @return true if the calculated mac matches the provided mac
     */
    public static boolean compareHmacSha256(String secretKey, String message, String mac) {
        return compareHmacSha256(secretKey.getBytes(), message.getBytes(), mac.getBytes());
    }
}
