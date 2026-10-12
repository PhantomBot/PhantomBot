/*
 * Copyright (C) 2016-2026 phantombot.github.io/PhantomBot
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
package com.mcawful;

import java.math.BigInteger;
import java.net.URI;
import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;
import java.security.AlgorithmParameters;
import java.security.GeneralSecurityException;
import java.security.KeyFactory;
import java.security.MessageDigest;
import java.security.PublicKey;
import java.security.SecureRandom;
import java.security.Signature;
import java.security.interfaces.ECPublicKey;
import java.security.interfaces.RSAPublicKey;
import java.security.spec.ECGenParameterSpec;
import java.security.spec.ECParameterSpec;
import java.security.spec.X509EncodedKeySpec;
import java.util.Arrays;
import java.util.Base64;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import org.json.JSONException;
import org.json.JSONObject;

import com.gmt2001.security.Digest;
import com.gmt2001.security.HMAC;

/**
 * Server-side checks for passkey (WebAuthn) registration and sign-in on the panel.
 *
 * <p>Attestation is not requested, so the browser hands over the public key in
 * SubjectPublicKeyInfo form and no CBOR parsing is needed. Only ES256 (P-256) and RS256 keys
 * are accepted.</p>
 *
 * <p>This class holds no bot state. Every {@code verify} method throws
 * {@link IllegalArgumentException} with the reason when a check fails.</p>
 *
 * @author mcawful
 */
public final class PasskeyVerifier {

    /**
     * How long a challenge stays valid, in milliseconds
     */
    public static final long CHALLENGE_TTL_MILLIS = 300000L;
    /**
     * Largest accepted {@code clientDataJSON}, in bytes
     */
    public static final int MAX_CLIENT_DATA = 8192;
    /**
     * Largest accepted authenticator data, in bytes
     */
    public static final int MAX_AUTH_DATA = 2048;
    /**
     * Largest accepted public key or signature, in bytes. A key of this size still fits the column it is stored in
     */
    public static final int MAX_KEY = 1500;
    /**
     * Largest credential ID allowed by WebAuthn, in bytes
     */
    public static final int MAX_CREDENTIAL_ID = 1023;

    /**
     * Authenticator data flag: user present
     */
    private static final int FLAG_UP = 0x01;
    /**
     * Authenticator data flag: user verified
     */
    private static final int FLAG_UV = 0x04;
    /**
     * Authenticator data flag: attested credential data included
     */
    private static final int FLAG_AT = 0x40;
    /**
     * Length of the random part of a challenge, in bytes
     */
    private static final int NONCE_LENGTH = 16;
    /**
     * Length of the signed part of a challenge (random part and expiry), in bytes
     */
    private static final int SIGNED_LENGTH = NONCE_LENGTH + Long.BYTES;
    /**
     * Length of the truncated HMAC on a challenge, in bytes
     */
    private static final int TAG_LENGTH = 16;

    /**
     * Key for signing challenges. Regenerated on every start, which only invalidates
     * challenges that were issued in the last few minutes
     */
    private static final byte[] CHALLENGE_KEY = randomBytes(32);
    /**
     * Sign-in challenges that have already been used, mapped to their expiry
     */
    private static final Map<String, Long> USED_CHALLENGES = new ConcurrentHashMap<>();
    /**
     * The P-256 curve, the only curve accepted for ES256
     */
    private static final ECParameterSpec P256 = loadP256();

    /**
     * Utility class (not instantiable).
     */
    private PasskeyVerifier() {
    }

    /**
     * Generates cryptographically secure random bytes
     *
     * @param length the number of bytes
     * @return the random bytes
     */
    public static byte[] randomBytes(int length) {
        byte[] bytes = new byte[length];
        new SecureRandom().nextBytes(bytes);
        return bytes;
    }

    /**
     * Encodes bytes as base64url without padding, the encoding WebAuthn uses in JSON
     *
     * @param data the bytes to encode
     * @return the encoded string
     */
    public static String encode(byte[] data) {
        return Base64.getUrlEncoder().withoutPadding().encodeToString(data);
    }

    /**
     * Decodes a base64url string
     *
     * @param data the string to decode
     * @param maxBytes the largest decoded size to accept
     * @return the decoded bytes
     * @throws IllegalArgumentException if the string is missing, not base64url, or too large
     */
    public static byte[] decode(String data, int maxBytes) {
        if (data == null || data.isEmpty() || data.length() > (maxBytes * 4 / 3) + 4) {
            throw new IllegalArgumentException("Missing or oversized value");
        }

        byte[] decoded = Base64.getUrlDecoder().decode(data);

        if (decoded.length > maxBytes) {
            throw new IllegalArgumentException("Missing or oversized value");
        }

        return decoded;
    }

    /**
     * Creates a challenge which carries its own expiry and an HMAC, so the server does not
     * have to remember challenges it has handed out to unauthenticated clients
     *
     * @return the challenge, base64url encoded
     */
    public static String createChallenge() {
        ByteBuffer challenge = ByteBuffer.allocate(SIGNED_LENGTH + TAG_LENGTH);
        challenge.put(randomBytes(NONCE_LENGTH)).putLong(System.currentTimeMillis() + CHALLENGE_TTL_MILLIS);
        challenge.put(createChallengeTag(challenge.array()));
        return encode(challenge.array());
    }

    /**
     * Checks if an origin can use passkeys with this bot. Browsers only offer WebAuthn over
     * HTTPS, or over HTTP on {@code localhost}
     *
     * @param origin the origin, such as {@code https://bot.example.com}
     * @return {@code true} if the origin is acceptable
     */
    private static boolean isAllowedOrigin(String origin) {
        if (origin == null) {
            return false;
        }

        try {
            URI uri = URI.create(origin);
            return uri.getHost() != null && ("https".equals(uri.getScheme())
                    || ("http".equals(uri.getScheme()) && uri.getHost().equals("localhost")));
        } catch (IllegalArgumentException ex) {
            return false;
        }
    }

    /**
     * Verifies the response to {@code navigator.credentials.create()}
     *
     * @param clientDataJSON the raw {@code clientDataJSON}
     * @param authData the raw authenticator data
     * @param publicKey the public key in SubjectPublicKeyInfo form
     * @param credentialId the credential ID reported by the browser
     * @param challenge the challenge that was issued for this registration, as returned by {@link #createChallenge()}
     * @param origin the origin the browser must have performed the registration on
     * @return the initial signature counter
     * @throws IllegalArgumentException if any check fails
     */
    public static long verifyRegistration(byte[] clientDataJSON, byte[] authData, byte[] publicKey, byte[] credentialId,
            String challenge, String origin) {
        if (!encode(checkClientData(clientDataJSON, "webauthn.create", origin)).equals(challenge)) {
            throw new IllegalArgumentException("Challenge does not match");
        }

        long signCount = checkAuthData(authData, origin, credentialId);
        decodePublicKey(publicKey);
        return signCount;
    }

    /**
     * Verifies the response to {@code navigator.credentials.get()}
     *
     * @param clientDataJSON the raw {@code clientDataJSON}
     * @param authData the raw authenticator data
     * @param signature the signature
     * @param publicKey the stored public key in SubjectPublicKeyInfo form
     * @param origin the origin the passkey was registered on
     * @param signCount the stored signature counter
     * @return the new signature counter
     * @throws IllegalArgumentException if any check fails
     */
    public static long verifyAssertion(byte[] clientDataJSON, byte[] authData, byte[] signature, byte[] publicKey,
            String origin, long signCount) {
        byte[] challenge = checkClientData(clientDataJSON, "webauthn.get", origin);
        long newSignCount = checkAuthData(authData, origin, null);

        checkSignature(decodePublicKey(publicKey), authData, clientDataJSON, signature);

        // Synced passkeys always report 0. Any other counter must go up, or the key may have been cloned
        if ((newSignCount != 0L || signCount != 0L) && newSignCount <= signCount) {
            throw new IllegalArgumentException("Signature counter did not increase");
        }

        long now = System.currentTimeMillis();
        USED_CHALLENGES.values().removeIf(expiry -> expiry < now);

        if (USED_CHALLENGES.putIfAbsent(encode(challenge), ByteBuffer.wrap(challenge).getLong(NONCE_LENGTH)) != null) {
            throw new IllegalArgumentException("Challenge was already used");
        }

        return newSignCount;
    }

    /**
     * Checks {@code clientDataJSON} and extracts the challenge
     *
     * @param clientDataJSON the raw {@code clientDataJSON}
     * @param type the expected ceremony type
     * @param origin the expected origin
     * @return the challenge, which has a valid HMAC and has not expired
     * @throws IllegalArgumentException if any check fails
     */
    private static byte[] checkClientData(byte[] clientDataJSON, String type, String origin) {
        JSONObject clientData;

        try {
            clientData = new JSONObject(new String(clientDataJSON, StandardCharsets.UTF_8));
        } catch (JSONException ex) {
            throw new IllegalArgumentException("Client data is not valid JSON");
        }

        if (!type.equals(clientData.optString("type"))) {
            throw new IllegalArgumentException("Wrong ceremony type");
        }

        if (!isAllowedOrigin(origin) || !origin.equals(clientData.optString("origin"))) {
            throw new IllegalArgumentException("Origin does not match");
        }

        if (clientData.optBoolean("crossOrigin", false)) {
            throw new IllegalArgumentException("Cross-origin use is not allowed");
        }

        byte[] challenge = decode(clientData.optString("challenge"), SIGNED_LENGTH + TAG_LENGTH);

        if (challenge.length != SIGNED_LENGTH + TAG_LENGTH
                || !MessageDigest.isEqual(createChallengeTag(challenge), Arrays.copyOfRange(challenge, SIGNED_LENGTH, challenge.length))
                || ByteBuffer.wrap(challenge).getLong(NONCE_LENGTH) < System.currentTimeMillis()) {
            throw new IllegalArgumentException("Challenge is invalid or has expired");
        }

        return challenge;
    }

    /**
     * Checks the authenticator data
     *
     * @param authData the raw authenticator data
     * @param origin the origin whose host is the relying party ID
     * @param credentialId the credential ID which must be attested; {@code null} if no
     *                     attested credential data is expected
     * @return the signature counter
     * @throws IllegalArgumentException if any check fails
     */
    private static long checkAuthData(byte[] authData, String origin, byte[] credentialId) {
        if (authData.length < 37) {
            throw new IllegalArgumentException("Authenticator data is too short");
        }

        ByteBuffer buffer = ByteBuffer.wrap(authData);
        byte[] rpIdHash = new byte[32];
        buffer.get(rpIdHash);

        if (!MessageDigest.isEqual(rpIdHash, Digest.sha256(URI.create(origin).getHost().getBytes(StandardCharsets.UTF_8)))) {
            throw new IllegalArgumentException("Passkey belongs to a different site");
        }

        int flags = buffer.get() & 0xFF;

        if ((flags & FLAG_UP) == 0 || (flags & FLAG_UV) == 0) {
            throw new IllegalArgumentException("User was not verified by the authenticator");
        }

        long signCount = buffer.getInt() & 0xFFFFFFFFL;

        if (credentialId != null) {
            // AAGUID (16 bytes), credential ID length (2 bytes), credential ID, public key
            if ((flags & FLAG_AT) == 0 || buffer.remaining() < 18) {
                throw new IllegalArgumentException("Authenticator data has no credential");
            }

            buffer.position(buffer.position() + 16);
            byte[] attested = new byte[buffer.getShort() & 0xFFFF];

            if (attested.length > buffer.remaining()) {
                throw new IllegalArgumentException("Authenticator data is truncated");
            }

            buffer.get(attested);

            if (!Arrays.equals(attested, credentialId)) {
                throw new IllegalArgumentException("Credential ID does not match");
            }
        }

        return signCount;
    }

    /**
     * Decodes a public key, accepting only P-256 and RSA keys of at least 2048 bits
     *
     * @param publicKey the public key in SubjectPublicKeyInfo form
     * @return the public key
     * @throws IllegalArgumentException if the key is not supported
     */
    private static PublicKey decodePublicKey(byte[] publicKey) {
        X509EncodedKeySpec spec = new X509EncodedKeySpec(publicKey);

        try {
            ECPublicKey key = (ECPublicKey) KeyFactory.getInstance("EC").generatePublic(spec);

            if (key.getParams().getCurve().equals(P256.getCurve()) && key.getParams().getGenerator().equals(P256.getGenerator())
                    && key.getParams().getOrder().equals(P256.getOrder())) {
                return key;
            }
        } catch (GeneralSecurityException ex) {
            // Not an EC key
        }

        try {
            RSAPublicKey key = (RSAPublicKey) KeyFactory.getInstance("RSA").generatePublic(spec);

            if (key.getModulus().bitLength() >= 2048) {
                return key;
            }
        } catch (GeneralSecurityException ex) {
            // Not an RSA key
        }

        throw new IllegalArgumentException("Unsupported public key type");
    }

    /**
     * Checks the signature over the authenticator data and the hash of {@code clientDataJSON}
     *
     * @param key the public key
     * @param authData the raw authenticator data
     * @param clientDataJSON the raw {@code clientDataJSON}, exactly as received
     * @param signature the signature
     * @throws IllegalArgumentException if the signature is not valid
     */
    private static void checkSignature(PublicKey key, byte[] authData, byte[] clientDataJSON, byte[] signature) {
        boolean isEc = key instanceof ECPublicKey;

        try {
            if (isEc && !isEcdsaSignatureInRange(signature)) {
                throw new IllegalArgumentException("Signature is not valid");
            }

            Signature verifier = Signature.getInstance(isEc ? "SHA256withECDSA" : "SHA256withRSA");
            verifier.initVerify(key);
            verifier.update(authData);
            verifier.update(Digest.sha256(clientDataJSON));

            if (!verifier.verify(signature)) {
                throw new IllegalArgumentException("Signature is not valid");
            }
        } catch (GeneralSecurityException ex) {
            throw new IllegalArgumentException("Signature is not valid");
        }
    }

    /**
     * Checks that both values in a DER-encoded ECDSA signature are within range for P-256.
     * Java 17.0.0 to 17.0.2 accept a signature of two zeroes for any message, so this is
     * checked here instead of relying on the runtime
     *
     * @param signature the DER-encoded signature
     * @return {@code true} if both values are greater than zero and less than the curve order
     */
    private static boolean isEcdsaSignatureInRange(byte[] signature) {
        try {
            ByteBuffer buffer = ByteBuffer.wrap(signature);

            // SEQUENCE; a P-256 signature is always short enough for a one-byte length
            if (buffer.get() != 0x30 || buffer.get() != buffer.remaining()) {
                return false;
            }

            for (int i = 0; i < 2; i++) {
                // INTEGER
                if (buffer.get() != 0x02) {
                    return false;
                }

                byte[] value = new byte[buffer.get()];
                buffer.get(value);
                BigInteger number = new BigInteger(value);

                if (number.signum() <= 0 || number.compareTo(P256.getOrder()) >= 0) {
                    return false;
                }
            }

            return !buffer.hasRemaining();
        } catch (RuntimeException ex) {
            return false;
        }
    }

    /**
     * Calculates the truncated HMAC over the random part and expiry of a challenge
     *
     * @param challenge the challenge; only the signed part is read
     * @return the tag
     */
    private static byte[] createChallengeTag(byte[] challenge) {
        return Arrays.copyOf(HMAC.calcHmacSha256(CHALLENGE_KEY, Arrays.copyOf(challenge, SIGNED_LENGTH)), TAG_LENGTH);
    }

    /**
     * Loads the parameters of the P-256 curve
     *
     * @return the curve parameters
     */
    private static ECParameterSpec loadP256() {
        try {
            AlgorithmParameters parameters = AlgorithmParameters.getInstance("EC");
            parameters.init(new ECGenParameterSpec("secp256r1"));
            return parameters.getParameterSpec(ECParameterSpec.class);
        } catch (GeneralSecurityException ex) {
            throw new IllegalStateException("P-256 is not available", ex);
        }
    }
}
