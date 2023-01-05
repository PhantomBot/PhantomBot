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
package com.gmt2001;

import java.util.concurrent.Callable;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.RejectedExecutionException;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.ScheduledFuture;
import java.util.concurrent.TimeUnit;

/**
 * Provides an interface to a shared {@link ScheduledExecutorService}.
 *
 * Documentation copied from official OpenJDK 7
 *
 * @author gmt2001
 */
public class ExecutorService {

    private static final ScheduledExecutorService SCHEDULEDEXECUTOR = Executors.newScheduledThreadPool(4);
    private static boolean shutdown = false;

    private ExecutorService() {
    }

    /**
     * Creates and executes a ScheduledFuture that becomes enabled after the given delay.
     *
     * @param <V> the return type of the callable
     * @param callable the function to execute
     * @param delay the time from now to delay execution
     * @param unit the time unit of the delay parameter
     * @return a ScheduledFuture that can be used to extract result or cancel
     * @throws RejectedExecutionException if the task cannot be scheduled for execution
     * @throws NullPointerException if callable is null
     */
    public static <V> ScheduledFuture<V> schedule(Callable<V> callable, long delay, TimeUnit unit) {
        if (shutdown) {
            return null;
        }

        return SCHEDULEDEXECUTOR.schedule(callable, delay, unit);
    }

    /**
     * Creates and executes a one-shot action that becomes enabled after the given delay.
     *
     * @param command the task to execute
     * @param delay the time from now to delay execution
     * @param unit the time unit of the delay parameter
     * @return a ScheduledFuture representing pending completion of the task and whose {@code get()} method will return {@code null} upon completion
     * @throws RejectedExecutionException if the task cannot be scheduled for execution
     * @throws NullPointerException if command is null
     */
    public static ScheduledFuture<?> schedule(Runnable command, long delay, TimeUnit unit) {
        if (shutdown) {
            return null;
        }

        return SCHEDULEDEXECUTOR.schedule(command, delay, unit);
    }

    /**
     * Creates and executes a periodic action that becomes enabled first after the given initial delay, and subsequently with the given period; that
     * is executions will commence after {@code initialDelay} then {@code initialDelay+period}, then {@code initialDelay + 2 * period}, and so on. If
     * any execution of the task encounters an exception, subsequent executions are suppressed. Otherwise, the task will only terminate via
     * cancellation or termination of the executor. If any execution of this task takes longer than its period, then subsequent executions may start
     * late, but will not concurrently execute.
     *
     * @param command the task to execute
     * @param initialDelay the time to delay first execution
     * @param period the period between successive executions
     * @param unit the time unit of the initialDelay and period parameters
     * @return a ScheduledFuture representing pending completion of the task, and whose {@code get()} method will throw an exception upon cancellation
     * @throws RejectedExecutionException if the task cannot be scheduled for execution
     * @throws NullPointerException if command is null
     * @throws IllegalArgumentException if period less than or equal to zero
     */
    public static ScheduledFuture<?> scheduleAtFixedRate(Runnable command, long initialDelay, long period, TimeUnit unit) {
        if (shutdown) {
            return null;
        }

        return SCHEDULEDEXECUTOR.scheduleAtFixedRate(command, initialDelay, period, unit);
    }

    /**
     * Creates and executes a periodic action that becomes enabled first after the given initial delay, and subsequently with the given delay between
     * the termination of one execution and the commencement of the next. If any execution of the task encounters an exception, subsequent executions
     * are suppressed. Otherwise, the task will only terminate via cancellation or termination of the executor.
     *
     * @param command the task to execute
     * @param initialDelay the time to delay first execution
     * @param delay the delay between the termination of one execution and the commencement of the next
     * @param unit the time unit of the initialDelay and delay parameters
     * @return a ScheduledFuture representing pending completion of the task, and whose {@code get()} method will throw an exception upon cancellation
     * @throws RejectedExecutionException if the task cannot be scheduled for execution
     * @throws NullPointerException if command is null
     * @throws IllegalArgumentException if delay less than or equal to zero
     */
    public static ScheduledFuture<?> scheduleWithFixedDelay(Runnable command, long initialDelay, long delay, TimeUnit unit) {
        if (shutdown) {
            return null;
        }

        return SCHEDULEDEXECUTOR.scheduleWithFixedDelay(command, initialDelay, delay, unit);
    }

    /**
     * Executes the given command at some time in the future. The command may execute in a new thread, in a pooled thread, or in the calling thread,
     * at the discretion of the {@code Executor} implementation.
     *
     * @param command the runnable task
     * @throws RejectedExecutionException if this task cannot be accepted for execution.
     * @throws NullPointerException if command is null
     */
    public static void execute(Runnable command) {
        if (shutdown) {
            return;
        }

        SCHEDULEDEXECUTOR.execute(command);
    }

    /**
     * Submits a Runnable task for execution and returns a Future representing that task. The Future's {@code get} method will return {@code null}
     * upon <em>successful</em> completion.
     *
     * @param task the task to submit
     * @return a Future representing pending completion of the task
     * @throws RejectedExecutionException if the task cannot be scheduled for execution
     * @throws NullPointerException if the task is null
     */
    public static Future<?> submit(Runnable task) {
        if (shutdown) {
            return null;
        }

        return SCHEDULEDEXECUTOR.submit(task);
    }

    /**
     * Submits a Runnable task for execution and returns a Future representing that task.The Future's {@code get} method will return the given result
     * upon successful completion.
     *
     * @param <T> the return type of result
     * @param task the task to submit
     * @param result the result to return
     * @return a Future representing pending completion of the task
     * @throws RejectedExecutionException if the task cannot be scheduled for execution
     * @throws NullPointerException if the task is null
     */
    public static <T> Future<T> submit(Runnable task, T result) {
        if (shutdown) {
            return null;
        }

        return SCHEDULEDEXECUTOR.submit(task, result);
    }

    /**
     * Submits a value-returning task for execution and returns a Future representing the pending results of the task.The Future's {@code get} method
     * will return the task's result upon successful completion.<p>
     * If you would like to immediately block waiting for a task, you can use constructions of the form {@code result = exec.submit(aCallable).get();}
     *
     * <p>
     * Note: The {@link Executors} class includes a set of methods that can convert some other common closure-like objects, for example,
     * {@link java.security.PrivilegedAction} to {@link Callable} form so they can be submitted.
     *
     * @param <T> the return type of the callable
     * @param task the task to submit
     * @return a Future representing pending completion of the task
     * @throws RejectedExecutionException if the task cannot be scheduled for execution
     * @throws NullPointerException if the task is null
     */
    public static <T> Future<T> submit(Callable<T> task) {
        if (shutdown) {
            return null;
        }

        return SCHEDULEDEXECUTOR.submit(task);
    }

    /**
     * Initiates an orderly shutdown in which previously submitted tasks are executed, but no new tasks will be accepted. Invocation has no additional
     * effect if already shut down.
     *
     * <p>
     * This method does not wait for previously submitted tasks to complete execution. Use {@link #awaitTermination awaitTermination} to do that.
     *
     * @throws SecurityException if a security manager exists and shutting down this ExecutorService may manipulate threads that the caller is not
     * permitted to modify because it does not hold {@link
     *         java.lang.RuntimePermission}{@code ("modifyThread")}, or the security manager's {@code checkAccess} method denies access.
     */
    public static void shutdown() {
        shutdown = true;
        SCHEDULEDEXECUTOR.shutdown();
    }

    /**
     * Indicates if this ExecutorService is shutdown or in the process of shutting down
     *
     * @return
     */
    public static boolean isShutdown() {
        return shutdown;
    }
}
