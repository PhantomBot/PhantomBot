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

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import com.gmt2001.httpwsserver.HttpServerPageHandler;
import com.gmt2001.security.Digest;

import io.netty.handler.codec.http.HttpHeaderNames;
import io.netty.handler.codec.http.HttpHeaders;
import tv.phantombot.panel.PanelUser.PanelUser;

/**
 * Panel login sessions that are started by signing in with a passkey.
 *
 * <p>The browser holds a random session ID in a cookie. Only the SHA-256 of the ID is kept
 * here, and only in memory, so every session ends when the bot restarts.</p>
 *
 * @author mcawful
 */
public final class PanelSessionManager {

    /**
     * Name of the cookie that holds the session ID
     */
    public static final String COOKIE = "pbpanelsession";

    /**
     * Sessions by the SHA-256 of their ID as a hex-encoded string. Ended sessions are removed when the next one starts
     */
    private static final Map<String, Session> SESSIONS = new ConcurrentHashMap<>();

    /**
     * A panel login session. Immutable apart from being ended early.
     */
    public static final class Session {
        private final String username;
        private final String origin;
        private final String passkey;
        private volatile long expires;

        private Session(String username, String origin, String passkey, long expires) {
            this.username = username;
            this.origin = origin;
            this.passkey = passkey;
            this.expires = expires;
        }

        /**
         * @return the origin the user signed in on
         */
        public String origin() {
            return this.origin;
        }

        /**
         * @return {@code true} if the session has neither expired nor been ended
         */
        public boolean isValid() {
            return this.expires > System.currentTimeMillis();
        }

        /**
         * Looks up the user of this session
         *
         * @return the {@link PanelUser}; {@code null} if the user no longer exists or is disabled
         */
        public PanelUser getUser() {
            PanelUser user = PanelUser.LookupByUsername(this.username);
            return user != null && user.isEnabled() ? user : null;
        }
    }

    /**
     * Utility class (not instantiable).
     */
    private PanelSessionManager() {
    }

    /**
     * Starts a session
     *
     * @param username the name of the user who signed in
     * @param origin the origin the user signed in on
     * @param passkey the primary key of the passkey that was used
     * @param lifetime how long the session lasts, in milliseconds
     * @return the session ID to send to the browser in the {@link #COOKIE} cookie
     */
    public static String createSession(String username, String origin, String passkey, long lifetime) {
        String id = PasskeyVerifier.encode(PasskeyVerifier.randomBytes(32));

        SESSIONS.values().removeIf(session -> !session.isValid());
        SESSIONS.put(Digest.sha256(id), new Session(username, origin, passkey, System.currentTimeMillis() + lifetime));

        return id;
    }

    /**
     * Finds the session of a request
     *
     * @param headers the {@link HttpHeaders} of the request
     * @return the {@link Session}; {@code null} if there is no valid session
     */
    public static Session getSession(HttpHeaders headers) {
        String id = HttpServerPageHandler.parseCookies(headers).get(COOKIE);
        Session session = id == null ? null : SESSIONS.get(Digest.sha256(id));

        return session != null && session.isValid() ? session : null;
    }

    /**
     * Ends the session of a request, if it has one and the request comes from the origin the user signed in on.
     * Other sites must not be able to sign the user out
     *
     * @param headers the {@link HttpHeaders} of the request
     * @return {@code true} if a session was ended
     */
    public static boolean revokeSession(HttpHeaders headers) {
        Session session = getSession(headers);

        if (session == null || !session.origin.equals(headers.get(HttpHeaderNames.ORIGIN))) {
            return false;
        }

        session.expires = 0L;
        return true;
    }

    /**
     * Ends all sessions that were started with a passkey
     *
     * @param passkey the primary key of the passkey
     */
    public static void revokePasskey(String passkey) {
        SESSIONS.values().forEach(session -> {
            if (session.passkey.equals(passkey)) {
                session.expires = 0L;
            }
        });
    }

    /**
     * Ends all sessions of a user
     *
     * @param username the user's name
     */
    public static void revokeUser(String username) {
        SESSIONS.values().forEach(session -> {
            if (session.username.equalsIgnoreCase(username)) {
                session.expires = 0L;
            }
        });
    }
}
