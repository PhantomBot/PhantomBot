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
package com.gmt2001.datastore2.fluentstatement;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

/**
 * Provides a fluent interface to define the components of an SQL {@code WHERE} clause in a database-agnostic manner
 *
 * @author gmt2001
 */
public final class WhereClause {
    /**
     * Contains
     */
    private final List<WhereOperation> operations = new ArrayList<>();

    /**
     * The operator being applied to the LHS
     */
    public enum Operator {
        /**
         * Compare with RHS for equality
         */
        EQUALS,
        /**
         * Compare with RHS for negated equality
         */
        NOT_EQUAL,
        /**
         * Compare for LHS is less than RHS
         */
        LESS_THAN,
        /**
         * Compare for LHS is less than or equality with RHS
         */
        LESS_THAN_OR_EQUAL,
        /**
         * Compare for LHS is greater than RHS
         */
        GREATER_THAN,
        /**
         * Compare for LHS is greater than or equality with RHS
         */
        GREATER_THAN_OR_EQUAL,
        /**
         * Compare with RHS for equality, with simple pattern matching
         * <p>
         * <ul>
         * <li>{@code %} (percent sign) - Wildcard for zero or more characters</li>
         * <li>{@code _} (underscore) - Wildcard for exactly one character</li>
         * <li>{@code \%} - Escape to put literal {@code %} character</li>
         * <li>{@code \_} - Escape to put literal {@code _} character</li>
         * </ul>
         */
        LIKE,
        /**
         * Compare with RHS for negated equality, with simple pattern matching
         * <p>
         * <ul>
         * <li>{@code %} (percent sign) - Wildcard for zero or more characters</li>
         * <li>{@code _} (underscore) - Wildcard for exactly one character</li>
         * <li>{@code \%} - Escape to put literal {@code %} character</li>
         * <li>{@code \_} - Escape to put literal {@code _} character</li>
         * </ul>
         */
        NOT_LIKE,
        /**
         * Test if LHS is set to the SQL literal {@code NULL}
         */
        IS_NULL,
        /**
         * Test if LHS is not set to the SQL literal {@code NULL}
         */
        IS_NOT_NULL,
        /**
         * Test if LHS is between the two values of RHS
         */
        BETWEEN,
        /**
         * Test if LHS is not between the two values of RHS
         */
        NOT_BETWEEN,
        /**
         * Test if LHS is in a list of values in the RHS
         */
        IN,
        /**
         * Test if LHS is not in a list of values in the RHS
         */
        NOT_IN,
        /**
         * Tests if any of the sub-WhereClause is true
         */
        OR
    }

    /**
     * An operation in a {@link WhereClause}
     */
    public final class WhereOperation {
        /**
         * The operator
         */
        private final Operator operator;
        /**
         * The LHS
         */
        private final ColumnInfo LHS;
        /**
         * The RHS
         */
        private final String RHS;
        /**
         * The second RHS for {@link Operator#BETWEEN} and {@link Operator#NOT_BETWEEN}
         */
        private final String RHS2;
        /**
         * The list sub-WhereClause
         */
        private List<WhereClause> or;

        /**
         * Constructor for LHS only
         *
         * @param operator the operator
         * @param LHS the LHS
         */
        private WhereOperation(Operator operator, ColumnInfo LHS) {
            this.operator = operator;
            this.LHS = LHS;
            this.RHS = null;
            this.RHS2 = null;
            this.or = null;
        }

        /**
         * Constructor for LHS and RHS
         *
         * @param operator the operator
         * @param LHS the LHS
         * @param RHS the RHS
         */
        private WhereOperation(Operator operator, ColumnInfo LHS, String RHS) {
            this.operator = operator;
            this.LHS = LHS;
            this.RHS = RHS;
            this.RHS2 = null;
            this.or = null;
        }

        /**
         * Constructor for LHS and RHS on {@link Operator#BETWEEN} and {@link Operator#NOT_BETWEEN}
         *
         * @param operator the operator
         * @param LHS the LHS
         * @param RHS the RHS
         * @param RHS2 the second RHS
         */
        private WhereOperation(Operator operator, ColumnInfo LHS, String RHS, String RHS2) {
            this.operator = operator;
            this.LHS = LHS;
            this.RHS = RHS;
            this.RHS2 = RHS2;
            this.or = null;
        }

        /**
         * Constructor for {@link Operator#OR}
         *
         * @param or the list of sub-WhereClause
         */
        private WhereOperation(List<WhereClause> or) {
            this.operator = Operator.OR;
            this.LHS = null;
            this.RHS = null;
            this.RHS2 = null;
            this.or = Collections.unmodifiableList(or);
        }

        /**
         * The operator being applied to the LHS
         *
         * @return the operator
         */
        public Operator operator() {
            return this.operator;
        }

        /**
         * The LHS
         *
         * @return the LHS
         */
        public ColumnInfo LHS() {
            return this.LHS;
        }

        /**
         * The RHS
         *
         * @return the RHS
         */
        public String RHS() {
            return this.RHS;
        }

        /**
         * The second RHS for {@link Operator#BETWEEN} and {@link Operator#NOT_BETWEEN}
         *
         * @return the second RHS
         */
        public String RHS2() {
            return this.RHS2;
        }

        /**
         * The list of sub-WhereClause for {@link Operator#OR}
         *
         * @return the list of {@link WhereClause}
         */
        public List<WhereClause> or() {
            return this.or;
        }
    }

    /**
     * Constructor
     */
    public WhereClause() {
    }

    /**
     * The list of {@link WhereOperation} defining the operations of this where clause
     *
     * @return the list of operations
     */
    public List<WhereOperation> operations() {
        return this.operations;
    }
}
