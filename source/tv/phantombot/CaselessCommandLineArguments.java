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

/**
 *
 * @author gmt2001
 */
public class CaselessCommandLineArguments extends CaselessProperties {

    private static final CaselessCommandLineArguments INSTANCE = new CaselessCommandLineArguments();

    public static CaselessCommandLineArguments instance() {
        return INSTANCE;
    }

    @Override
    public Object put(Object key, Object value) {
        return null;
    }

    private synchronized Object internalPut(Object key, Object value) {
        return super.put(((String) key).toLowerCase(), value);
    }

    @Override
    public void store(boolean reload) {
    }

    public void load(String[] args) {
        for (String arg : args) {
            if (arg.contains("=")) {
                String[] spl = arg.split("=", 2);
                this.internalPut(spl[0], spl[1]);
            } else {
                this.internalPut(arg, "true");
            }
        }
    }
}
