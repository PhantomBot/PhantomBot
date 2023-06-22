package com.gmt2001.datastore;

/**
 * A key/value pair in the database
 *
 * @author gmt2001
 */
public class KeyValue {

    /**
     * Constructor
     *
     * @param key the value of the {@code variable} column
     * @param value the value of the {@code value} column
     */
    public KeyValue(String key, String value) {
        this.key = key;
        this.value = value;
    }

    /**
     * Constructor
     *
     * @param <K> the key type
     * @param <V> the value type
     * @param key the value of the {@code variable} column
     * @param value the value of the {@code value} column
     */
    public <K,V> KeyValue(K key, V value) {
        if (key instanceof String ks) {
            this.key = ks;
        } else {
            this.key = key.toString();
        }

        if (value instanceof String vs) {
            this.value = vs;
        } else {
            this.value = value.toString();
        }
    }

    /**
     * The value of the {@code variable} column
     *
     * @return the variable
     */
    public String getKey() {
        return key;
    }

    /**
     * The value of the {@code value} column
     *
     * @return the value
     */
    public String getValue() {
        return value;
    }

    private final String key;
    private final String value;
}
