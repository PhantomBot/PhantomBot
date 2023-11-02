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
package com.gmt2001.httpwsserver;

import java.lang.ref.WeakReference;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.locks.ReadWriteLock;
import java.util.concurrent.locks.StampedLock;

import com.gmt2001.Console.err;
import com.gmt2001.util.concurrent.ExecutorService;

import io.netty.util.IllegalReferenceCountException;
import io.netty.util.ReferenceCounted;

/**
 * Utilities for working with {@link ReferenceCounted} objects
 */
public final class ReferenceCountedUtil {
    /**
     * List to be released on the next interval
     */
    private static final CopyOnWriteArrayList<WeakReference<ReferenceCounted>> expiringList = new CopyOnWriteArrayList<>();
    /**
     * List to be moved to {@link #expiringList} on the next interval
     */
    private static final CopyOnWriteArrayList<WeakReference<ReferenceCounted>> currentList = new CopyOnWriteArrayList<>();
    /**
     * Lock for access to {@link #expiringList} and {@link #currentList}
     */
    private static final ReadWriteLock rwl = new StampedLock().asReadWriteLock();

    private ReferenceCountedUtil() {
    }

    static {
        ExecutorService.scheduleAtFixedRate(() -> {
            expire();
            transfer();
        }, 30, 30, TimeUnit.SECONDS);
    }

    /**
     * Fully releases a {@link ReferenceCounted} object at least 30 seconds into the future
     *
     * @param obj The object to release
     */
    public static void releaseAuto(ReferenceCounted obj) {
        if (obj != null && obj.refCnt() > 0) {
            rwl.readLock().lock();
            try {
                currentList.add(new WeakReference<ReferenceCounted>(obj));
            } finally {
                rwl.readLock().unlock();
            }
        }
    }

    /**
     * Transfer from {@link #currentList} to {@link #expiringList}
     */
    private static void transfer() {
        rwl.writeLock().lock();
        try {
            expiringList.addAll(currentList);
            currentList.clear();
        } finally {
            rwl.writeLock().unlock();
        }
    }

    /**
     * Release all in {@link #expiringList}
     */
    private static void expire() {
        rwl.writeLock().lock();
        try {
            expiringList.forEach(r -> {
                if (r != null && r.get() != null) {
                    releaseObj(r.get(), true);
                }
            });
            expiringList.clear();
        } finally {
            rwl.writeLock().unlock();
        }
    }

    /**
     * Releases a {@link ReferenceCounted} object
     *
     * @param obj The object to release
     */
    public static void releaseObj(ReferenceCounted obj) {
        releaseObj(obj, false);
    }

    /**
     * Releases a {@link ReferenceCounted} object
     *
     * @param obj The object to release
     * @param all {@code true} to release until 0; {@code false} to only release 1
     *            time
     */
    public static void releaseObj(ReferenceCounted obj, boolean all) {
        try {
            if (obj != null && obj.refCnt() > 0) {
                obj.release(all ? obj.refCnt() : 1);
            }
        } catch (IllegalReferenceCountException ex) {
            err.printStackTrace(ex);
        }
    }
}
