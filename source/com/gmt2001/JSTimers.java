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

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ScheduledFuture;
import java.util.concurrent.TimeUnit;

/**
 *
 * @author gmt2001
 */
public class JSTimers {

    private static final JSTimers INSTANCE = new JSTimers();
    private final Map<Integer, JSTimer> timers = new ConcurrentHashMap<>();
    private int index = 0;
    private boolean overflow = false;

    public static JSTimers instance() {
        return INSTANCE;
    }

    private JSTimers() {
        ExecutorService.scheduleAtFixedRate(this::cleanup, 15, 15, TimeUnit.MINUTES);
    }

    public int setTimeout(Runnable callback, int delayMS) {
        return this.setTimeout(callback, delayMS, null);
    }

    public int setTimeout(Runnable callback, int delayMS, String name) {
        int id = this.getNextId();
        delayMS = Math.max(1, delayMS);

        if (name == null || name.isBlank()) {
            name = "GenericTimeout" + id;
        }

        JSTimer timer = new JSTimer(name, false, callback);
        ScheduledFuture future = ExecutorService.schedule(timer::run, delayMS, TimeUnit.MILLISECONDS);
        timer.setFuture(future);

        this.timers.put(id, timer);

        return id;
    }

    public int setInterval(Runnable callback, int delayMS) {
        return this.setInterval(callback, delayMS, null);
    }

    public int setInterval(Runnable callback, int delayMS, String name) {
        int id = this.getNextId();
        delayMS = Math.max(1, delayMS);

        if (name == null || name.isBlank()) {
            name = "GenericInterval" + id;
        }

        JSTimer timer = new JSTimer(name, true, callback);
        ScheduledFuture future = ExecutorService.scheduleAtFixedRate(timer::run, delayMS, delayMS, TimeUnit.MILLISECONDS);
        timer.setFuture(future);

        this.timers.put(id, timer);

        return id;
    }

    public void clearTimer(int idx) {
        if (this.timers.containsKey(idx)) {
            JSTimer timer = this.timers.remove(idx);

            if (timer != null) {
                timer.cancel();
            }
        }
    }

    private void cleanup() {
        this.timers.forEach((id, timer) -> {
            if (timer == null || timer.isCancelled()) {
                this.timers.remove(id);
            }
        });
    }

    private synchronized int getNextId() {
        if (this.index < Integer.MAX_VALUE && !this.overflow) {
            return this.index++;
        } else if (this.index < Integer.MAX_VALUE) {
            for (int b = this.index; b < Integer.MAX_VALUE; b++) {
                if (!this.timers.containsKey(b)) {
                    this.index = b;
                    return this.index++;
                }
            }
        }

        this.overflow = true;
        this.cleanup();

        for (int b = 0; b < Integer.MAX_VALUE; b++) {
            if (!this.timers.containsKey(b)) {
                this.index = b;
                return this.index++;
            }
        }

        throw new IllegalStateException("TimerQueue Exhausted");
    }

    private class JSTimer {

        private final String name;
        private final Runnable callback;
        private final boolean isInterval;
        private boolean isCancelled = false;
        private ScheduledFuture future = null;

        public JSTimer(String name, boolean isInterval, Runnable callback) {
            this.name = name + (isInterval ? " [interval]" : "");
            this.isInterval = isInterval;
            this.callback = callback;
        }

        public void setFuture(ScheduledFuture future) {
            this.future = future;
        }

        public void cancel() {
            this.isCancelled = true;
            if (this.future != null) {
                this.future.cancel(false);
            }
        }

        public boolean isCancelled() {
            return this.isCancelled;
        }

        public void run() {
            Thread.currentThread().setName("com.gmt2001.JSTimers(" + this.name + ")");
            if (!this.isCancelled) {
                try {
                    this.callback.run();
                } finally {
                    if (!this.isInterval) {
                        this.isCancelled = true;
                    }
                }
            }
        }
    }
}
