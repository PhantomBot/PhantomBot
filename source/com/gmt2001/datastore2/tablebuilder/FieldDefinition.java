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
package com.gmt2001.datastore2.tablebuilder;

/**
 * Provides a fluent interface to define a field in a {@link TableBuilder}
 *
 * @author gmt2001
 */
public final class FieldDefinition extends AbstractDefinition {
    /**
     * The name of the field
     */
    private final String name;
     /**
     * The data type of the field
     */
    private DataType type = DataType.INTEGER;
    /**
     * The length parameter, for data types that support it
     * <p>
     * If the data type supports skipping this parameter, use {@code -1} to skip it
     */
    private int length = -1;
    /**
     * The precision parameter, for data types that support it
     * <p>
     * If the data type supports skipping this parameter, use {@code -1} to skip it
     */
    private int precision = -1;
    /**
     * Whether the data type is unsigned, for data types that support it
     */
    private boolean unsigned = true;
    /**
     * Whether the field is prohibited from storing the SQL literal {@code NULL}
     */
    private boolean notNull = true;
    /**
     * Whether the field should be an auto increment field. If {@code true}, field is assumed to also be PRIMARY KEY
     */
    private boolean autoIncrement = false;
    /**
     * The default value, as a string. {@code null} to skip
     */
    private String defaultValue = null;
    /**
     * The stand-in for the SQL literal {@code NULL}
     */
    public static final String NULL = "____NULL____";

    /**
     * Represents the potential data types for the field
     */
    public static enum DataType {
        /**
         * Stores a 1 byte integer
         */
        TINYINT,
        /**
         * Stores a 2 byte integer
         */
        SMALLINT,
        /**
         * Stores a 3 byte integer
         */
        MEDIUMINT,
        /**
         * Stores a 4 byte integer
         */
        INTEGER,
        /**
         * Stores a 8 byte integer
         */
        BIGINT,
        /**
         * Stores a double precision floating point number
         */
        DOUBLE,
        /**
         * Stores a single precision floating point number
         */
        FLOAT,
        /**
         * Stores an exact value decimal number
         */
        DECIMAL,
        /**
         * Stores a date and time
         */
        DATETIME,
        /**
         * Stores a variable number of characters. Requires a length parameter
         */
        VARCHAR,
        /**
         * Stores a large amount of text
         */
        TEXT
    }

    /**
     * Constructor
     *
     * @param parent the parent {@link TableBuilder}
     * @param name the name of the field
     * @throws IllegalArgumentException if the name is null or blank
     */
    FieldDefinition(TableBuilder parent, String name) {
        super(parent);

        if (name == null || name.isBlank()) {
            throw new IllegalArgumentException("name is null or blank");
        }

        this.name = name;
    }

    /**
     * The name of the field
     *
     * @return the field name
     */
    public String name() {
        return this.name;
    }

    /**
     * Sets the data type of the field
     *
     * @param type the {@link DataType} of the field
     * @return {@code this}
     */
    public FieldDefinition type(DataType type) {
        this.type = type;
        return this;
    }

    /**
     * The data type of the field
     *
     * @return the {@link DataType}
     */
    public DataType type() {
        return this.type;
    }

    /**
     * Sets the length of data stored in the column
     * <p>
     * For {@link DataType} which support it, {@code -1} may be used to signal {@code unspecified/omitted}
     * <p>
     * This is the first number in columns which use both length and precision, such as {@link DataType#DECIMAL}
     *
     * @param length the length of data
     * @return {@code this}
     */
    public FieldDefinition length(int length) {
        this.length = length;
        return this;
    }

    /**
     * The length of the data stored in the column
     * <p>
     * This is the first number in columns which use both length and precision, such as {@link DataType#DECIMAL}
     *
     * @return the length; {@code -1} if not specified/omitted
     */
    public int length() {
        return this.length;
    }

    /**
     * Sets the precision of data stored in the column
     * <p>
     * For {@link DataType} which support it, {@code -1} may be used to signal {@code unspecified/omitted}
     * <p>
     * This is the second number in columns which use both length and precision, such as {@link DataType#DECIMAL}
     *
     * @param precision the precision of data
     * @return {@code this}
     */
    public FieldDefinition precision(int precision) {
        this.precision = precision;
        return this;
    }

    /**
     * The precision of the data stored in the column
     * <p>
     * This is the second number in columns which use both length and precision, such as {@link DataType#DECIMAL}
     *
     * @return the precision; {@code -1} if not specified/omitted
     */
    public int precision() {
        return this.precision;
    }

    /**
     * If the field is an integer-type, sets whether it is unsigned
     *
     * @param unsigned whether the field is unsigned
     * @return {@code this}
     */
    public FieldDefinition unsigned(boolean unsigned) {
        this.unsigned = unsigned;
        return this;
    }

    /**
     * If the field is an integer-type, whether it is unsigned
     *
     * @return whether the field is unsigned
     */
    public boolean unsigned() {
        return this.unsigned;
    }

    /**
     * Sets whether the field is prohibited from storing the SQL literal {@code NULL}
     *
     * @param notNull whether the field is prohibited from storing the SQL literal {@code NULL}
     * @return {@code this}
     */
    public FieldDefinition notNull(boolean notNull) {
        this.notNull = notNull;
        return this;
    }

    /**
     * Whether the field is prohibited from storing the SQL literal {@code NULL}
     *
     * @return whether the field is not-null
     */
    public boolean notNull() {
        return this.notNull;
    }

    /**
     * If the field is an integer-type, whether the field is an auto increment field
     * <p>
     * If {@code true}, field is assumed to also be PRIMARY KEY
     *
     * @param autoIncrement whether the field is an auto increment field
     * @return {@code this}
     */
    public FieldDefinition autoIncrement(boolean autoIncrement) {
        this.autoIncrement = autoIncrement;
        return this;
    }

    /**
     * Whether the field is an auto increment field
     *
     * @return whether the field is an auto increment field
     */
    public boolean autoIncrement() {
        return this.autoIncrement;
    }

    /**
     * Sets the default value of the field
     * <p>
     * To not set a default value, set this to {@code null}
     * <p>
     * To set the default value to the SQL literal {@code NULL}, set this to {@link #NULL}
     *
     * @param defaultValue the default value of the field, as a string
     * @return {@code this}
     */
    public FieldDefinition defaultValue(String defaultValue) {
        this.defaultValue = defaultValue;
        return this;
    }

    /**
     * The default value of the field
     * <p>
     * If the return value is {@code null}, this is unset
     * <p>
     * If the return value is equal to {@link #NULL}, then the default value is the SQL literal {@code NULL}
     *
     * @return the default value
     */
    public String defaultValue() {
        return this.defaultValue;
    }
}
