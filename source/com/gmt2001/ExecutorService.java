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

import java.util.concurrent.Callable;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.ScheduledFuture;
import java.util.concurrent.TimeUnit;

/**
 * Provides an interface to a shared {@link ScheduledExecutorService}
 *
 * @author gmt2001
 */
public class ExecutorService {

    private static final ScheduledExecutorService SCHEDULEDEXECUTOR = Executors.newScheduledThreadPool(1);

    private ExecutorService() {
    }

    public static <V> ScheduledFuture<V> schedule(Callable<V> callable, long delay, TimeUnit unit) {
        return SCHEDULEDEXECUTOR.schedule(callable, delay, unit);
    }

    public static ScheduledFuture<?> schedule(Runnable command, long delay, TimeUnit unit) {
        return SCHEDULEDEXECUTOR.schedule(command, delay, unit);
    }

    public static ScheduledFuture<?> scheduleAtFixedRate(Runnable command, long initialDelay, long period, TimeUnit unit) {
        return SCHEDULEDEXECUTOR.scheduleAtFixedRate(command, initialDelay, period, unit);
    }

    public static ScheduledFuture<?> scheduleWithFixedDelay(Runnable command, long initialDelay, long delay, TimeUnit unit) {
        return SCHEDULEDEXECUTOR.scheduleWithFixedDelay(command, initialDelay, delay, unit);
    }

    public static void execute(Runnable command) {
        SCHEDULEDEXECUTOR.execute(command);
    }

    public static Future<?> submit(Runnable task) {
        return SCHEDULEDEXECUTOR.submit(task);
    }

    public static <T> Future<T> submit(Runnable task, T result) {
        return SCHEDULEDEXECUTOR.submit(task, result);
    }

    public static <T> Future<T> submit(Callable<T> task) {
        return SCHEDULEDEXECUTOR.submit(task);
    }

    public static void shutdown() {
        SCHEDULEDEXECUTOR.shutdown();
    }
}
