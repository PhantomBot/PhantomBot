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
package com.gmt2001;

import java.io.IOException;
import java.lang.reflect.Field;
import java.net.URL;
import java.util.ArrayList;
import java.util.List;
import java.util.jar.JarEntry;
import java.util.jar.JarInputStream;

/**
 *
 * @author gmt2001
 */
public final class Reflect {

    private static final Reflect instance = new Reflect();

    public static Reflect instance() {
        return instance;
    }

    private Reflect() {
    }

    public void loadPackageRecursive(String pkg) {
        pkg = pkg.replace('.', '/');
        ClassLoader classLoader = Reflect.class.getClassLoader();
        URL u = Reflect.class.getProtectionDomain().getCodeSource().getLocation();
        try (JarInputStream jar = new JarInputStream(u.openStream())) {
            JarEntry e;
            do {
                e = jar.getNextJarEntry();

                if (e != null) {
                    String name = e.getName();

                    if (name.startsWith(pkg) && name.endsWith(".class")) {
                        try {
                            Class.forName(name.replace('/', '.').replace(".class", ""), true, classLoader);
                        } catch (ClassNotFoundException ex) {
                            com.gmt2001.Console.debug.printStackTrace(ex);
                        }
                    }
                }
            } while (e != null);
        } catch (IOException ex) {
            com.gmt2001.Console.debug.printStackTrace(ex);
        }
    }

    @SuppressWarnings({"unchecked", "rawtypes"})
    public List<Class<?>> getClasses() {
        List<Class<?>> cl = new ArrayList<>();

        try {
            Field f = ClassLoader.class.getDeclaredField("classes");
            f.setAccessible(true);
            ClassLoader classLoader = Reflect.class.getClassLoader();
            @SuppressWarnings("UseOfObsoleteCollectionType")
            java.util.Vector<Class> classes = (java.util.Vector<Class>) f.get(classLoader);
            classes.forEach((c) -> {
                cl.add(c);
            });
        } catch (IllegalArgumentException | IllegalAccessException | NoSuchFieldException | SecurityException ex) {
            com.gmt2001.Console.err.printStackTrace(ex);
        }

        return cl;
    }

    @SuppressWarnings("unchecked")
    public <T> List<Class<? extends T>> getSubTypesOf(final Class<T> type) {
        List<Class<? extends T>> cl = new ArrayList<>();

        getClasses().stream().filter((c) -> (type.isAssignableFrom(c))).forEachOrdered((c) -> {
            cl.add((Class<? extends T>) c);
        });

        return cl;
    }
}
