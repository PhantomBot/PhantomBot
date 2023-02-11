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
package com.gmt2001.ratelimiters;

/**
 * Handles rate limiting using a window which resets a period of time after the first token is used, and where the limit can switch between two values
 *
 * @author gmt2001
 */
public class WindowedSwitchingRateLimiter extends WindowedRateLimiter {

    private final int mainLimit;
    private final int alternateLimit;
    private boolean usingMain = true;

    /**
     * @param windowMS The length of the window, in milliseconds
     * @param mainLimit The normal maximum number of tokens available during the window
     * @param alternateLimit The alternate maximum number of tokens available during the window
     */
    public WindowedSwitchingRateLimiter(long windowMS, int mainLimit, int alternateLimit) {
        super(windowMS, mainLimit);
        this.mainLimit = mainLimit;
        this.alternateLimit = alternateLimit;
    }

    /**
     * @param windowMS The length of the window, in milliseconds
     * @param mainLimit The normal maximum number of tokens available during the window
     * @param alternateLimit The alternate maximum number of tokens available during the window
     * @param isMain {@code true} to select mainLimit; {@code false} to select alternateLimit
     */
    public WindowedSwitchingRateLimiter(long windowMS, int mainLimit, int alternateLimit, boolean isMain) {
        super(windowMS, mainLimit);
        this.mainLimit = mainLimit;
        this.alternateLimit = alternateLimit;
        this.usingMain = isMain;
    }

    /**
     * Switches which limit is active
     *
     * @param isMain {@code true} to select mainLimit; {@code false} to select alternateLimit
     */
    public synchronized void switchLimit(boolean isMain) {
        this.usingMain = isMain;
    }

    /**
     * @return {@code true} if currently using mainLimit; {@code false} if currently using alternateLimit
     */
    public boolean isMainLimit() {
        return this.usingMain;
    }

    /**
     * @return The maximum number of tokens available during the window, based on the currently selected limit
     */
    @Override
    public int limit() {
        return this.isMainLimit() ? this.mainLimit() : this.alternateLimit();
    }

    /**
     * @return The mainLimit
     */
    public int mainLimit() {
        return this.mainLimit;
    }

    /**
     * @return The alternateLimit
     */
    public int alternateLimit() {
        return this.alternateLimit;
    }
}
