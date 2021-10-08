/*
 * Copyright (C) 2016-2021 phantombot.github.io/PhantomBot
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

import java.util.Collections;
import java.util.Enumeration;
import java.util.Iterator;
import java.util.LinkedHashSet;
import java.util.Map;
import java.util.Properties;
import java.util.Set;
import java.util.TreeSet;
import java.util.function.BooleanSupplier;
import java.util.function.DoubleSupplier;
import java.util.function.IntSupplier;
import java.util.function.LongSupplier;
import java.util.function.Supplier;

public class CaselessProperties extends Properties {

    public static final long serialVersionUID = 1L;

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
}
