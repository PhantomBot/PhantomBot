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

import java.util.Date;
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
    private final long resetIntervalMS;
    private Date lastBackoff = new Date();
    private long lastIntervalMS;
    private int totalIterations = 0;
    private boolean isNextIntervalDetermined = true;
    private boolean isBackingOff = false;

    /**
     *
     * @param minIntervalMS Minimum backoff interval, in MS
     * @param maxIntervalMS Maximum backoff interval, in MS
     */
    public ExponentialBackoff(long minIntervalMS, long maxIntervalMS) {
        this.minIntervalMS = minIntervalMS;
        this.maxIntervalMS = maxIntervalMS;
        this.resetIntervalMS = -1;
        this.lastIntervalMS = this.minIntervalMS;
    }

    /**
     *
     * @param minIntervalMS Minimum backoff interval, in MS
     * @param maxIntervalMS Maximum backoff interval, in MS
     * @param resetIntervalMS Time since last backoff until an auto-reset occurs
     */
    public ExponentialBackoff(long minIntervalMS, long maxIntervalMS, long resetIntervalMS) {
        this.minIntervalMS = minIntervalMS;
        this.maxIntervalMS = maxIntervalMS;
        this.resetIntervalMS = resetIntervalMS;
        this.lastIntervalMS = this.minIntervalMS;
    }

    /**
     * Blocks with Thread.sleep until the next interval
     */
    public void Backoff() {
        try {
            com.gmt2001.Console.debug.println("Backoff() called by: " + com.gmt2001.Console.debug.findCaller("com.gmt2001.ExponentialBackoff"));
            this.setIsBackingOff(true);
            com.gmt2001.Console.debug.println("Locked backoff...");
            this.determineNextInterval();
            com.gmt2001.Console.debug.println("Interval calculated as " + this.lastIntervalMS + "...");
            this.totalIterations++;
            com.gmt2001.Console.debug.println("Sleeping...");
            Thread.sleep(this.lastIntervalMS);
            com.gmt2001.Console.debug.println("Awake...");
        } catch (InterruptedException ex) {
            com.gmt2001.Console.err.logStackTrace(ex);
        } finally {
            this.lastBackoff = new Date();
            this.setIsBackingOff(false);
            com.gmt2001.Console.debug.println("Unlocked backoff...");
            this.setIsNextIntervalDetermined(false);
            com.gmt2001.Console.debug.println("Unlocked calculation...");
        }

        com.gmt2001.Console.debug.println("Returning control...");
    }

    /**
     * Calls the specified Runnable once the next interval expires
     *
     * @param command The Runnable to callback
     */
    public void BackoffAsync(Runnable command) {
        com.gmt2001.Console.debug.println("BackoffAsync() called by: " + com.gmt2001.Console.debug.findCaller("com.gmt2001.ExponentialBackoff"));
        this.setIsBackingOff(true);
        com.gmt2001.Console.debug.println("Locked backoff...");
        this.determineNextInterval();
        com.gmt2001.Console.debug.println("Interval calculated as " + this.lastIntervalMS + "...");
        this.totalIterations++;
        com.gmt2001.Console.debug.println("Scheduling...");
        ScheduledExecutorService service = Executors.newSingleThreadScheduledExecutor();
        service.schedule(() -> {
            this.lastBackoff = new Date();
            this.setIsBackingOff(false);
            com.gmt2001.Console.debug.println("Unlocked backoff...");
            this.setIsNextIntervalDetermined(false);
            com.gmt2001.Console.debug.println("Unlocked calculation...");
            command.run();
            com.gmt2001.Console.debug.println("Callback completed...");
            com.gmt2001.Console.debug.println("Returning control...");
        }, this.lastIntervalMS, TimeUnit.MILLISECONDS);
    }

    /**
     * Resets the backoff to use the minimum values on the next call
     */
    public void Reset() {
        this.lastIntervalMS = this.minIntervalMS;
        this.totalIterations = 0;
        this.setIsNextIntervalDetermined(true);
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
     * Returns true if the previous interval was equal to the max interval
     *
     * @return true if the previous interval was equal to the max interval
     */
    public boolean IsAtMaxInterval() {
        return this.lastIntervalMS == this.maxIntervalMS;
    }

    /**
     * Determines the next interval to backoff for and stores it in this.lastIntervalMS
     */
    private synchronized void determineNextInterval() {
        if (this.isNextIntervalDetermined) {
            return;
        }

        if (this.resetIntervalMS >= 0 && new Date().getTime() >= this.lastBackoff.getTime() + this.resetIntervalMS) {
            com.gmt2001.Console.debug.println("Reset interval has expired, resetting to " + this.minIntervalMS + "...");
            this.lastIntervalMS = this.minIntervalMS;
            this.totalIterations = 0;
            this.isNextIntervalDetermined = true;
            return;
        }

        com.gmt2001.Console.debug.println("Calculating a new interval, previous was " + this.lastIntervalMS + "...");
        long nextInterval = this.lastIntervalMS * 2;
        com.gmt2001.Console.debug.println("Candidate value is " + nextInterval + "...");

        nextInterval = Math.min(nextInterval, this.maxIntervalMS);
        com.gmt2001.Console.debug.println("Min value is " + nextInterval + "...");

        this.lastIntervalMS = nextInterval;
        this.isNextIntervalDetermined = true;
        com.gmt2001.Console.debug.println("Calculation complete...");
    }

    /**
     * Set this.isBackingOff
     *
     * @param isBackingOff The new value
     */
    private synchronized void setIsBackingOff(boolean isBackingOff) {
        this.isBackingOff = isBackingOff;
    }

    /**
     * Reset this.isNextIntervalDetermined
     */
    private synchronized void setIsNextIntervalDetermined(boolean isNextIntervalDetermined) {
        this.isNextIntervalDetermined = isNextIntervalDetermined;
    }
}
