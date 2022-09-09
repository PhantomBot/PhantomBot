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

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

/**
 * Handles rate limiting using a window which resets a period of time after the first token is used
 *
 * @author gmt2001
 */
public class WindowedRateLimiter {

    private final long windowMS;
    private final int limit;
    private final Object mutex = new Object();
    private Instant nextReset;
    private int currentTokens;

    /**
     * @param windowMS The length of the window, in milliseconds
     * @param limit The maximum number of tokens available during the window
     */
    public WindowedRateLimiter(long windowMS, int limit) {
        this.windowMS = windowMS;
        this.limit = limit;
        this.currentTokens = limit;
        this.nextReset = Instant.now();
    }

    /**
     * @return true if there is a token available
     */
    public boolean isAvailable() {
        this.reset();
        return this.currentTokens > 0;
    }

    /**
     * @return The current number of tokens available
     */
    public int currentTokens() {
        this.reset();
        return this.currentTokens;
    }

    /**
     * @return An {@link Instant} indicating when the window will next reset
     */
    public Instant nextReset() {
        return this.nextReset;
    }

    /**
     * Determines if the window has passed the next reset time, and resets the current token count if it has
     */
    public void reset() {
        synchronized (this.mutex) {
            if (this.currentTokens < this.limit && Instant.now().isAfter(this.nextReset)) {
                this.currentTokens = this.limit;
            }
        }
    }

    /**
     * Attempts to take a token, and starts a new window if the bucket was full
     *
     * @return true on success; false if no tokens are available
     */
    public boolean takeToken() {
        this.reset();
        synchronized (this.mutex) {
            if (this.currentTokens == this.limit) {
                this.nextReset = Instant.now().plusMillis(this.windowMS);
            }

            if (this.currentTokens > 0) {
                this.currentTokens--;
                return true;
            }
        }

        return false;
    }

    /**
     * Takes a token and then runs the specified command. If a token is not available, waits until the next reset, then tries again
     *
     * @param command The command to run on success
     */
    public void waitAndTakeToken(Runnable command) {
        if (this.takeToken()) {
            command.run();
        } else {
            ScheduledExecutorService service = Executors.newSingleThreadScheduledExecutor();
            service.schedule(() -> {
                this.waitAndTakeToken(command);
            }, Instant.now().until(this.nextReset, ChronoUnit.MILLIS), TimeUnit.MILLISECONDS);
        }
    }
}
