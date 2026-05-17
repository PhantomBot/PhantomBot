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

import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.Base64;
import java.util.function.Supplier;

/**
 * Memoization layer for {@link CustomPanelManifestCollector}'s merged JSON response. Holds
 * the last-built {@link CachedResponse} (UTF-8 bytes + strong ETag + filesystem signature +
 * last-checked timestamp) in a single {@code volatile} reference and rebuilds it lazily when
 * the caller-supplied signature changes.
 *
 * <p>This file is intentionally domain-agnostic: it knows nothing about manifests, paths, or
 * JSON shape. The collector hands it two callbacks — one that produces the current
 * "fingerprint" of the underlying source (any string that compares-equal when content is
 * unchanged) and one that produces the serialized bytes when a rebuild is needed. That
 * keeps cache-invalidation policy, hashing, and ETag generation in one small, easy-to-audit
 * class while the collector stays focused on validating and merging community manifests.</p>
 *
 * <p>Concurrency: HTTP threads call {@link #getOrRefresh} freely. The cache is a single
 * {@code volatile} reference replaced atomically; under concurrent rebuilds the worst case
 * is duplicate work (both threads run the supplier), and only one of the resulting
 * {@link CachedResponse} objects becomes the next published value — never a torn read.</p>
 *
 * @author mcawful
 */
public final class CustomPanelManifestCache {

    /**
     * Cooldown between filesystem signature recomputes. The signature itself is cheap
     * (one {@code Files.list} + one {@code stat} per module), but bursts of concurrent
     * panel logins shouldn't pay for it more than once per window. Two seconds is small
     * enough that hot-add of a new module is still effectively immediate from the
     * operator's perspective.
     */
    private static final long CACHE_SIGNATURE_TTL_MILLIS = 2000L;

    /**
     * Memoized result of the last build. {@code volatile} so HTTP threads see publication
     * without locking; never mutated, only replaced wholesale by {@link #getOrRefresh}.
     */
    private static volatile CachedResponse cache;

    /**
     * Result of one full build: serialized bytes, an ETag derived from those bytes, the
     * caller-supplied signature that produced them, and the wall-clock time the signature
     * was last verified (used by the {@link #CACHE_SIGNATURE_TTL_MILLIS} floor). Immutable;
     * safe to hand out to multiple HTTP threads.
     */
    public static final class CachedResponse {
        private final byte[] bytes;
        private final String etag;
        private final String signature;
        private final long signatureCheckedAt;

        private CachedResponse(byte[] bytes, String etag, String signature, long signatureCheckedAt) {
            this.bytes = bytes;
            this.etag = etag;
            this.signature = signature;
            this.signatureCheckedAt = signatureCheckedAt;
        }

        /**
         * @return UTF-8 JSON bytes; do not mutate
         */
        public byte[] bytes() {
            return bytes;
        }

        /**
         * @return strong ETag of the form {@code "sha256-<base64url>"}, suitable for
         *         {@code ETag} / {@code If-None-Match}
         */
        public String etag() {
            return etag;
        }

        /**
         * @param ifNoneMatch raw {@code If-None-Match} request header (may be {@code null})
         * @return {@code true} when the client already has the current bytes
         */
        public boolean matchesIfNoneMatch(String ifNoneMatch) {
            if (ifNoneMatch == null || ifNoneMatch.isEmpty()) {
                return false;
            }
            String trimmed = ifNoneMatch.trim();
            if ("*".equals(trimmed)) {
                return true;
            }
            for (String token : trimmed.split(",")) {
                String t = token.trim();
                if (t.startsWith("W/")) {
                    t = t.substring(2).trim();
                }
                if (t.equals(etag)) {
                    return true;
                }
            }
            return false;
        }
    }

    /**
     * Utility class (not instantiable).
     */
    private CustomPanelManifestCache() {
    }

    /**
     * Returns a memoized {@link CachedResponse}. Recomputes the signature at most once per
     * {@link #CACHE_SIGNATURE_TTL_MILLIS}; only invokes {@code byteBuilder} when the
     * signature actually changes. Safe under concurrent calls — the cache is a single
     * {@code volatile} reference replaced atomically.
     *
     * <p>Both suppliers may be invoked on the calling thread. {@code signatureSupplier} runs
     * first (and only after the TTL has elapsed); {@code byteBuilder} runs only when the
     * signature differs from the previously cached one. Suppliers should never return
     * {@code null}.</p>
     *
     * @param signatureSupplier produces the current source-fingerprint string; equality with
     *                          the last cached value short-circuits the rebuild
     * @param byteBuilder       produces the freshly-serialized bytes when a rebuild is needed
     * @return current cached response, recomputed on demand when the signature changes
     */
    public static CachedResponse getOrRefresh(Supplier<String> signatureSupplier, Supplier<byte[]> byteBuilder) {
        long now = System.currentTimeMillis();
        CachedResponse current = cache;

        if (current != null && now - current.signatureCheckedAt < CACHE_SIGNATURE_TTL_MILLIS) {
            return current;
        }

        String signature = signatureSupplier.get();

        if (current != null && current.signature.equals(signature)) {
            // No content change since last build — keep the same bytes/ETag, just refresh
            // the TTL window so the next caller within the floor doesn't re-walk the source.
            CachedResponse refreshed = new CachedResponse(current.bytes, current.etag, current.signature, now);
            cache = refreshed;
            return refreshed;
        }

        byte[] bytes = byteBuilder.get();
        String etag = computeEtag(bytes);
        CachedResponse next = new CachedResponse(bytes, etag, signature, now);
        cache = next;
        return next;
    }

    /**
     * SHA-256 the input and return URL-safe base64 with no padding. Falls back to a stable
     * length-based string if (somehow) SHA-256 is unavailable so the caller never sees a
     * {@code null}. Package-private so the collector can use the same primitive when
     * fingerprinting filesystem state.
     *
     * @param input bytes to hash
     * @return URL-safe base64 SHA-256 (or {@code "len-<n>"} on platform error)
     */
    static String sha256Base64(byte[] input) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            return Base64.getUrlEncoder().withoutPadding().encodeToString(md.digest(input));
        } catch (NoSuchAlgorithmException ex) {
            return "len-" + input.length;
        }
    }

    /**
     * Builds a strong ETag for the cached bytes — {@code "sha256-<base64url>"}.
     *
     * @param bytes serialized response body
     * @return quoted ETag value ready to drop into the {@code ETag} header
     */
    private static String computeEtag(byte[] bytes) {
        return "\"sha256-" + sha256Base64(bytes) + "\"";
    }
}
