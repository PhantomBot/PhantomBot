/*
 * Copyright (C) 2016-2020 phantombot.tv
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
 *
 * @author gmt2001
 */
public class ExponentialBackoff {
    private static final int MIN_STEPS = 10;
    private final long minIntervalMS;
    private final long maxIntervalMS;
    private long lastIntervalMS = 0L;
    private int lastIntervalIterations = 0;
    private int uniqueIterations = 0;

    /**
     *
     * @param minIntervalMS Minimum backoff interval, in MS
     * @param maxIntervalMS Maximum backoff interval, in MS
     */
    public ExponentialBackoff(long minIntervalMS, long maxIntervalMS) {
        this.minIntervalMS = minIntervalMS;
        this.maxIntervalMS = maxIntervalMS;
    }

    /**
     * Blocks with Thread.sleep until the next interval
     */
    public void Backoff() {
        try {
            this.determineNextInterval();
            Thread.sleep(this.lastIntervalMS);
        } catch (InterruptedException ex) {
            com.gmt2001.Console.err.logStackTrace(ex);
        }
    }

    /**
     * Calls the specified Runnable once the next interval expires
     * @param command The Runnable to callback
     */
    public void BackoffAsync(Runnable command) {
        this.determineNextInterval();
        ScheduledExecutorService service = Executors.newSingleThreadScheduledExecutor();
        service.schedule(command, this.lastIntervalMS, TimeUnit.MILLISECONDS);
    }

    /**
     * Resets the backoff to use the minimum values on the next call
     */
    public void Reset() {
        this.lastIntervalIterations = 0;
        this.lastIntervalMS = 0L;
        this.uniqueIterations = 0;
    }

    private void determineNextInterval() {
        long nextInterval;

        if (this.lastIntervalIterations == 1) {
            this.uniqueIterations++;
        }

        int numSteps = (int)Math.ceil((this.maxIntervalMS - this.minIntervalMS) / (this.minIntervalMS * 1.0));
        if (numSteps < MIN_STEPS) {
            int stepDiv = (int)Math.floor((MIN_STEPS - numSteps) / (numSteps - 1));

            if (this.lastIntervalIterations < stepDiv) {
                nextInterval = this.lastIntervalMS;
            } else {
                nextInterval = this.lastIntervalMS + (this.minIntervalMS * this.uniqueIterations);
                this.lastIntervalIterations = 0;
            }
        } else {
            nextInterval = this.lastIntervalMS + (this.minIntervalMS * this.uniqueIterations);
        }

        if (this.lastIntervalMS < this.minIntervalMS) {
            nextInterval = this.minIntervalMS;
        }

        if (this.lastIntervalMS >= this.maxIntervalMS) {
            nextInterval = this.maxIntervalMS;
        }

        this.lastIntervalIterations++;
        this.lastIntervalMS = nextInterval;
    }
}
