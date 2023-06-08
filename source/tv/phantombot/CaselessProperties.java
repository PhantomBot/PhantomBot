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
package tv.phantombot;

import java.io.IOException;
import java.io.OutputStream;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.time.Instant;
import java.util.Collections;
import java.util.Enumeration;
import java.util.HashMap;
import java.util.Iterator;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Properties;
import java.util.Set;
import java.util.TreeSet;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.concurrent.TimeUnit;

import com.gmt2001.ExecutorService;

/**
 * Provides an implementation of {@link Properties} where the {@code key} is case-insensitive and thread-safe
 * <p>
 * Provides methods which allow casting values as a char, int, long, double, or boolean
 * <p>
 * Provides the ability to perform a thread-safe update of multiple values as a transaction
 *
 * @author gmt2001
 */
public class CaselessProperties extends Properties {

    public static final long serialVersionUID = 1L;
    private static final int TRANSACTION_LIFETIME = 15;
    private final List<Transaction> transactions = new CopyOnWriteArrayList<>();
    private final Object lock = new Object();
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

    /**
     * Returns the specified property as a {@code char}
     *
     * @param key the hashtable key
     * @return the first {@code char} of the value returned by {@link #getProperty(String)}
     * @throws IndexOutOfBoundsException if the property does not exist or is empty
     */
    public char getPropertyAsChar(String key) throws IndexOutOfBoundsException {
        return this.getProperty(key, "").charAt(0);
    }

    /**
     * Returns the specified property as a {@code char}
     *
     * @param key the hashtable key
     * @param defaultValue a default value
     * @return the first {@code char} of the value returned by {@link #getProperty(String)}; {@code defaultValue} if the property does not exist or is empty
     */
    public char getPropertyAsChar(String key, char defaultValue) {
        String retval = this.getProperty(key, (String) null);

        if (retval == null) {
            return defaultValue;
        }

        try {
            return retval.charAt(0);
        } catch (IndexOutOfBoundsException ex) {
            return defaultValue;
        }
    }

    /**
     * Returns the specified property as an {@code int}
     *
     * @param key the hashtable key
     * @return the value returned by {@link #getProperty(String)} cast as an {@code int}
     * @throws NumberFormatException if the property does not exist or is empty
     */
    public int getPropertyAsInt(String key) throws NumberFormatException {
        return Integer.parseInt(this.getProperty(key, ""));
    }

    /**
     * Returns the specified property as an {@code int}
     *
     * @param key the hashtable key
     * @param defaultValue a default value
     * @return the value returned by {@link #getProperty(String)} cast as an {@code int}; {@code defaultValue} if
     * the property does not exist or is not parsable as an {@code int}
     */
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

    /**
     * Returns the specified property as a {@code long}
     *
     * @param key the hashtable key
     * @return the value returned by {@link #getProperty(String)} cast as a {@code long}
     * @throws NumberFormatException if the property does not exist or is empty
     */
    public long getPropertyAsLong(String key) throws NumberFormatException {
        return Long.parseLong(this.getProperty(key, ""));
    }

    /**
     * Returns the specified property as a {@code long}
     *
     * @param key the hashtable key
     * @param defaultValue a default value
     * @return the value returned by {@link #getProperty(String)} cast as a {@code long}; {@code defaultValue} if
     * the property does not exist or is not parsable as a {@code long}
     */
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

    /**
     * Returns the specified property as a {@code double}
     *
     * @param key the hashtable key
     * @return the value returned by {@link #getProperty(String)} cast as a {@code double}
     * @throws NumberFormatException if the property does not exist or is empty
     */
    public double getPropertyAsDouble(String key) throws NumberFormatException {
        return Double.parseDouble(this.getProperty(key, ""));
    }

    /**
     * Returns the specified property as a {@code double}
     *
     * @param key the hashtable key
     * @param defaultValue a default value
     * @return the value returned by {@link #getProperty(String)} cast as a {@code double}; {@code defaultValue} if
     * the property does not exist or is not parsable as a {@code double}
     */
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

    /**
     * Retruns the specified property as a {@code boolean}
     * <p>
     * Accepted truthy values:
     * <ul>
     * <li>{@code 1}</li>
     * <li>{@code true}</li>
     * <li>{@code yes}</li>
     * </ul>
     *
     * @param key the hashtable key
     * @return the value returned by {@link #getProperty(String)} cast as a {@code boolean}; {@code false} if
     * the property does not exist or does not match an accepted truthy value
     */
    public boolean getPropertyAsBoolean(String key) {
        return this.getProperty(key, "false").toLowerCase().matches("(1|true|yes)");
    }

    /**
     * Retruns the specified property as a {@code boolean}
     * <p>
     * Accepted truthy values:
     * <ul>
     * <li>{@code 1}</li>
     * <li>{@code true}</li>
     * <li>{@code yes}</li>
     * </ul>
     *
     * @param key the hashtable key
     * @return the value returned by {@link #getProperty(String)} cast as a {@code boolean}; {@code defaultValue} if
     * the property does not exist; {@code false} if the value does not match an accepted truthy value
     */
    public boolean getPropertyAsBoolean(String key, boolean defaultValue) {
        String retval = this.getProperty(key, (String) null);

        if (retval == null) {
            return defaultValue;
        }

        return retval.toLowerCase().matches("(1|true|yes)");
    }

    /**
     * Searches for the property with the specified key in this property list. If the property is found, returns the current
     * value; otherwise, adds the property to the property list
     *
     * @param key the property key
     * @param value the value to put if the property key does not exist
     * @return the current value if {@code key} already exists; else {@code null}
     */
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

    /**
     * Starts a transaction for updating multiple values simultaneously at {@link Transaction#PRIORITY_NORMAL}
     *
     * @return a new {@link Transaction}
     */
    public Transaction startTransaction() {
        return this.startTransaction(Transaction.PRIORITY_NORMAL);
    }

    /**
     * Starts a transaction for updating multiple values simultaneously
     * <p>
     * If multiple transactions editing the same values are comitted within 15 seconds of each other,
     * the transaction with the highest {@code priority} wins. Transactions with the same {@code priority}
     * are first-come first-served
     *
     * @param priority the priority level, between 0 and 100
     * @return a new {@link Transaction}
     */
    public Transaction startTransaction(int priority) {
        return new Transaction(this, priority);
    }

    /**
     * Saves the current property set, then reloads the current state
     */
    public void store() {
        this.store(true);
    }

    /**
     * Saves the current property set
     *
     * @param reload if {@code true}, the state is also reloaded and {@link tv.phantombot.event.jvm.PropertiesReloadedEvent} is fired
     */
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
                if (v == null) {
                    this.remove(k);
                } else {
                    this.setProperty(k, v);
                }
            });

            this.store();

            ExecutorService.schedule(() -> {
                transactions.forEach(ot -> {
                    if (Instant.now().minusSeconds(TRANSACTION_LIFETIME).isBefore(ot.getCommitTime())) {
                        transactions.remove(ot);
                    }
                });
            }, TRANSACTION_LIFETIME, TimeUnit.SECONDS);

            this.transactions.add(t);
        }
    }

    /**
     * Represents a transaction which apples new values to the property set simultaneously
     */
    public class Transaction {

        /**
         * Minimum priority
         */
        public static final int PRIORITY_NONE = 0;
        /**
         * Low priority
         */
        public static final int PRIORITY_LOW = 25;
        /**
         * Normal priority
         */
        public static final int PRIORITY_NORMAL = 50;
        /**
         * High priority
         */
        public static final int PRIORITY_HIGH = 75;
        /**
         * Maximum priority
         */
        public static final int PRIORITY_MAX = 100;
        private final int priority;
        private final Map<String, String> newValues = new HashMap<>();
        private boolean isCommitted = false;
        private final CaselessProperties parent;
        private Instant commitTime = null;

        private Transaction(CaselessProperties parent, int priority) {
            this.parent = parent;
            this.priority = Math.min(Math.max(priority, PRIORITY_NONE), PRIORITY_MAX);
        }

        private Map<String, String> getNewValues() {
            return this.newValues;
        }

        /**
         * Returns the priority of this transaction
         *
         * @return the priority
         */
        public int getPriority() {
            return this.priority;
        }

        /**
         * Marks a property to be removed
         *
         * @param key the proeprty key
         * @throws IllegalStateException if this transaction is already committed
         */
        public void remove(String key) throws IllegalStateException {
            this.setProperty(key, (String) null);
        }

        /**
         * Sets a string value in the transaction
         * <p>
         * Setting {@code value} to {@code null} will mark the property for removal
         *
         * @param key the property key
         * @param value the new value
         * @throws IllegalStateException if this transaction is already committed
         */
        public void setProperty(String key, String value) throws IllegalStateException {
            if (isCommitted) {
                throw new IllegalStateException("committed");
            }

            this.newValues.put(key, value);
        }

        /**
         * Sets an integer value in the transaction
         *
         * @param key the property key
         * @param value the new value
         * @throws IllegalStateException if this transaction is already committed
         */
        public void setProperty(String key, int value) throws IllegalStateException {
            this.setProperty(key, Integer.toString(value));
        }

        /**
         * Sets a long value in the transaction
         *
         * @param key the property key
         * @param value the new value
         * @throws IllegalStateException if this transaction is already committed
         */
        public void setProperty(String key, long value) throws IllegalStateException {
            this.setProperty(key, Long.toString(value));
        }

        /**
         * Sets a double value in the transaction
         *
         * @param key the property key
         * @param value the new value
         * @throws IllegalStateException if this transaction is already committed
         */
        public void setProperty(String key, double value) throws IllegalStateException {
            this.setProperty(key, Double.toString(value));
        }

        /**
         * Sets a boolean value in the transaction
         *
         * @param key the property key
         * @param value the new value
         * @throws IllegalStateException if this transaction is already committed
         */
        public void setProperty(String key, boolean value) throws IllegalStateException {
            this.setProperty(key, value ? "true" : "false");
        }

        /**
         * Returns if this transaction has been committed
         *
         * @return {@code true} if this transaction has been committed
         */
        public boolean isCommitted() {
            return this.isCommitted;
        }

        /**
         * An {@link Instant} indicating when this transaction was committed
         *
         * @return the {@link Instant} when this transaction was committed; {@code null} if this transaction is not yet committed
         */
        public Instant getCommitTime() {
            return this.commitTime;
        }

        /**
         * Commits all new/updated properties in this transaction to the {@link CaselessProperties} instance, then saves the state
         */
        public void commit() {
            this.isCommitted = true;
            this.commitTime = Instant.now();
            parent.commit(this);
        }
    }
}
