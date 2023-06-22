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
     * @param key The value of the {@code variable} column
     * @param value The value of the {@code value} column
     */
    public KeyValue(String key, String value) {
        this.key = key;
        this.value = value;
    }

    /**
     * Constructor
     *
     * @param key The value of the {@code variable} column
     * @param value The value of the {@code value} column
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
     * @return
     */
    public String getKey() {
        return key;
    }

    /**
     * The value of the {@code value} column
     *
     * @return
     */
    public String getValue() {
        return value;
    }

    private final String key;
    private final String value;
}
