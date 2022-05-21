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
package tv.phantombot;

import java.io.IOException;
import java.io.OutputStream;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.Calendar;
import java.util.Collections;
import java.util.Date;
import java.util.Enumeration;
import java.util.HashMap;
import java.util.Iterator;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Properties;
import java.util.Set;
import java.util.Timer;
import java.util.TimerTask;
import java.util.TreeSet;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.function.BooleanSupplier;
import java.util.function.DoubleSupplier;
import java.util.function.IntSupplier;
import java.util.function.LongSupplier;
import java.util.function.Supplier;

public class CaselessProperties extends Properties {

    public static final long serialVersionUID = 1L;
    private static final int TRANSACTION_LIFETIME_MS = 15000;
    private final List<Transaction> transactions = new CopyOnWriteArrayList<>();
    private final Object lock = new Object();
    private final Timer timer = new Timer();
    private static final CaselessProperties INSTANCE = new CaselessProperties();
    private static final String HEADER = "PhantomBot Configuration File\n"
            + "\n                     +---------+"
            + "\n                     | WARNING |"
            + "\n                     +---------+"
            + "\n       DO NOT MODIFY WHILE THE BOT IS RUNNING!"
            + "\n CHANGES MADE WHILE THE BOT IS RUNNING WILL BE LOST!\n";

    public static CaselessProperties instance() {
        return INSTANCE;
    }

    @Override
    public Object put(Object key, Object value) {
        return super.put(((String) key).toLowerCase(), value);
    }

    @Override
    public String getProperty(String key) {
        return super.getProperty(key.toLowerCase());
    }

    @Override
    public String getProperty(String key, String defaultValue) {
        return super.getProperty(key.toLowerCase(), defaultValue);
    }

    public String getProperty(String key, Supplier<String> defaultValueSupplier) {
        String retval = super.getProperty(key.toLowerCase(), null);

        if (retval == null) {
            return defaultValueSupplier.get();
        }

        return retval;
    }

    public int getPropertyAsInt(String key) {
        return Integer.parseInt(this.getProperty(key));
    }

    public int getPropertyAsInt(String key, int defaultValue) {
        String retval = this.getProperty(key, (String) null);

        if (retval == null) {
            return defaultValue;
        }

        try {
            return Integer.parseInt(retval);
        } catch (NumberFormatException ex) {
            return defaultValue;
        }
    }

    public int getPropertyAsInt(String key, IntSupplier defaultValueSupplier) {
        String retval = this.getProperty(key, (String) null);

        if (retval == null) {
            return defaultValueSupplier.getAsInt();
        }

        try {
            return Integer.parseInt(retval);
        } catch (NumberFormatException ex) {
            return defaultValueSupplier.getAsInt();
        }
    }

    public long getPropertyAsLong(String key) {
        return Long.parseLong(this.getProperty(key));
    }

    public long getPropertyAsLong(String key, long defaultValue) {
        String retval = this.getProperty(key, (String) null);

        if (retval == null) {
            return defaultValue;
        }

        try {
            return Long.parseLong(retval);
        } catch (NumberFormatException ex) {
            return defaultValue;
        }
    }

    public long getPropertyAsLong(String key, LongSupplier defaultValueSupplier) {
        String retval = this.getProperty(key, (String) null);

        if (retval == null) {
            return defaultValueSupplier.getAsLong();
        }

        try {
            return Long.parseLong(retval);
        } catch (NumberFormatException ex) {
            return defaultValueSupplier.getAsLong();
        }
    }

    public double getPropertyAsDouble(String key) {
        return Double.parseDouble(this.getProperty(key));
    }

    public double getPropertyAsDouble(String key, double defaultValue) {
        String retval = this.getProperty(key, (String) null);

        if (retval == null) {
            return defaultValue;
        }

        try {
            return Double.parseDouble(retval);
        } catch (NumberFormatException ex) {
            return defaultValue;
        }
    }

    public double getPropertyAsDouble(String key, DoubleSupplier defaultValueSupplier) {
        String retval = this.getProperty(key, (String) null);

        if (retval == null) {
            return defaultValueSupplier.getAsDouble();
        }

        try {
            return Double.parseDouble(retval);
        } catch (NumberFormatException ex) {
            return defaultValueSupplier.getAsDouble();
        }
    }

    public boolean getPropertyAsBoolean(String key) {
        return this.getProperty(key).toLowerCase().matches("(1|true|yes)");
    }

    public boolean getPropertyAsBoolean(String key, boolean defaultValue) {
        String retval = this.getProperty(key, (String) null);

        if (retval == null) {
            return defaultValue;
        }

        return retval.toLowerCase().matches("(1|true|yes)");
    }

    public boolean getPropertyAsBoolean(String key, BooleanSupplier defaultValueSupplier) {
        String retval = this.getProperty(key, (String) null);

        if (retval == null) {
            return defaultValueSupplier.getAsBoolean();
        }

        return retval.toLowerCase().matches("(1|true|yes)");
    }

    public Object putIfAbsent(String key, Object value) {
        if (this.containsKey(key)) {
            return this.getProperty(key);
        } else {
            return this.put(key, value);
        }
    }

    @Override
    public Set<Object> keySet() {
        return Collections.unmodifiableSet(new TreeSet<>(super.keySet()));
    }

    @Override
    public Set<Map.Entry<Object, Object>> entrySet() {

        Set<Map.Entry<Object, Object>> set1 = super.entrySet();
        Set<Map.Entry<Object, Object>> set2 = new LinkedHashSet<>(set1.size());

        Iterator<Map.Entry<Object, Object>> iterator = set1.stream().sorted((java.util.Map.Entry<Object, Object> o1, java.util.Map.Entry<Object, Object> o2) -> o1.getKey().toString().compareTo(o2.getKey().toString())).iterator();

        while (iterator.hasNext()) {
            set2.add(iterator.next());
        }

        return set2;
    }

    @Override
    public synchronized Enumeration<Object> keys() {
        return Collections.enumeration(new TreeSet<>(super.keySet()));
    }

    public Transaction startTransaction() {
        return this.startTransaction(Transaction.PRIORITY_NORMAL);
    }

    public Transaction startTransaction(int priority) {
        return new Transaction(this, priority);
    }

    public void store() {
        this.store(true);
    }

    public void store(boolean reload) {
        try {
            try ( OutputStream outputStream = Files.newOutputStream(Paths.get("./config/botlogin.txt"))) {
                this.store(outputStream, HEADER);
            }

            if (reload && PhantomBot.instance() != null) {
                com.gmt2001.Console.debug.println("reloading properties");
                PhantomBot.instance().reloadProperties();
            }
        } catch (NullPointerException | IOException ex) {
            com.gmt2001.Console.err.printStackTrace(ex);
        }
    }

    private void commit(Transaction t) {
        synchronized (this.lock) {
            Map<String, String> newValues = new HashMap<>();

            t.getNewValues().forEach((k, v) -> {
                if (transactions.stream().noneMatch(ot -> ot.getPriority() > t.getPriority() && ot.getNewValues().containsKey(k))) {
                    newValues.put(k, v);
                }
            });

            newValues.forEach((k, v) -> {
                this.setProperty(k, v);
            });

            this.store();

            this.timer.schedule(new TimerTask() {
                @Override
                public void run() {
                    transactions.forEach(ot -> {
                        Calendar c = Calendar.getInstance();
                        c.add(Calendar.MILLISECOND, -TRANSACTION_LIFETIME_MS);
                        if (c.getTime().before(ot.getCommitTime())) {
                            transactions.remove(ot);
                        }
                    });
                }
            }, TRANSACTION_LIFETIME_MS);

            this.transactions.add(t);
        }
    }

    public class Transaction {

        public static final int PRIORITY_NONE = 0;
        public static final int PRIORITY_LOW = 25;
        public static final int PRIORITY_NORMAL = 50;
        public static final int PRIORITY_HIGH = 75;
        public static final int PRIORITY_MAX = 100;
        private final int priority;
        private final Map<String, String> newValues = new HashMap<>();
        private boolean isCommitted = false;
        private final CaselessProperties parent;
        private Date commitTime;

        private Transaction(CaselessProperties parent, int priority) {
            this.parent = parent;
            this.priority = Math.min(Math.max(priority, PRIORITY_NONE), PRIORITY_MAX);
        }

        private Map<String, String> getNewValues() {
            return this.newValues;
        }

        public int getPriority() {
            return this.priority;
        }

        public void setProperty(String key, String value) {
            if (isCommitted) {
                throw new IllegalStateException("committed");
            }

            this.newValues.put(key, value);
        }

        public void setProperty(String key, int value) {
            this.setProperty(key, Integer.toString(value));
        }

        public void setProperty(String key, long value) {
            this.setProperty(key, Long.toString(value));
        }

        public void setProperty(String key, double value) {
            this.setProperty(key, Double.toString(value));
        }

        public void setProperty(String key, boolean value) {
            this.setProperty(key, value ? "true" : "false");
        }

        public boolean isCommitted() {
            return this.isCommitted;
        }

        public Date getCommitTime() {
            return this.commitTime;
        }

        public void commit() {
            this.isCommitted = true;
            this.commitTime = new Date();
            parent.commit(this);
        }
    }
}
