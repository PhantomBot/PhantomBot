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

import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

/**
 * Handles backoff timing using an exponentially increasing duration strategy.
 *
 * @author gmt2001
 */
public class ExponentialBackoff {

    private final long minIntervalMS;
    private final long maxIntervalMS;
    private long lastIntervalMS;
    private int totalIterations = 0;
    private boolean isNextIntervalDetermined = false;
    private boolean isBackingOff = false;

    /**
     *
     * @param minIntervalMS Minimum backoff interval, in MS
     * @param maxIntervalMS Maximum backoff interval, in MS
     */
    public ExponentialBackoff(long minIntervalMS, long maxIntervalMS) {
        this.minIntervalMS = minIntervalMS;
        this.maxIntervalMS = maxIntervalMS;
        this.lastIntervalMS = this.minIntervalMS;
    }

    /**
     * Blocks with Thread.sleep until the next interval
     */
    public void Backoff() {
        try {
            this.setIsBackingOff(true);
            this.determineNextInterval();
            this.totalIterations++;
            this.isNextIntervalDetermined = false;
            Thread.sleep(this.lastIntervalMS);
        } catch (InterruptedException ex) {
            com.gmt2001.Console.err.logStackTrace(ex);
        } finally {
            this.setIsBackingOff(false);
        }
    }

    /**
     * Calls the specified Runnable once the next interval expires
     *
     * @param command The Runnable to callback
     */
    public void BackoffAsync(Runnable command) {
        this.setIsBackingOff(true);
        this.determineNextInterval();
        this.totalIterations++;
        this.isNextIntervalDetermined = false;
        ScheduledExecutorService service = Executors.newSingleThreadScheduledExecutor();
        service.schedule(() -> {
            this.setIsBackingOff(false);
            command.run();
        }, this.lastIntervalMS, TimeUnit.MILLISECONDS);
    }

    /**
     * Resets the backoff to use the minimum values on the next call
     */
    public void Reset() {
        this.lastIntervalMS = this.minIntervalMS;
        this.totalIterations = 0;
        this.isNextIntervalDetermined = false;
    }

    /**
     * Returns whether a backoff is currently in progress
     *
     * @return true if a backoff is executing; false otherwise
     */
    public synchronized boolean GetIsBackingOff() {
        return this.isBackingOff;
    }

    /**
     * Determines and returns the next interval to backoff for
     *
     * @return The next interval that will be used when Backoff() or BackoffAsync(command) is called, in milliseconds
     */
    public long GetNextInterval() {
        this.determineNextInterval();
        return this.lastIntervalMS;
    }

    /**
     * Returns the total number of times the backoff has been used since the last reset
     *
     * @return The total
     */
    public int GetTotalIterations() {
        return this.totalIterations;
    }

    /**
     * Determines the next interval to backoff for and stores it in this.lastIntervalMS
     */
    private synchronized void determineNextInterval() {
        if (this.isNextIntervalDetermined) {
            return;
        }

        long nextInterval = this.lastIntervalMS * this.lastIntervalMS;

        nextInterval = Math.min(nextInterval, this.maxIntervalMS);

        this.lastIntervalMS = nextInterval;
        this.isNextIntervalDetermined = true;
    }

    /**
     * Set this.isBackingOff
     *
     * @param isBackingOff The new value
     */
    private synchronized void setIsBackingOff(boolean isBackingOff) {
        this.isBackingOff = isBackingOff;
    }
}
