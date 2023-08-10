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
package com.gmt2001.util;

import java.io.IOException;
import java.lang.management.ManagementFactory;
import java.lang.management.MemoryUsage;
import java.lang.management.RuntimeMXBean;
import java.lang.reflect.Field;
import java.lang.reflect.InvocationTargetException;
import java.lang.reflect.Method;
import java.lang.reflect.Modifier;
import java.net.URISyntaxException;
import java.net.URL;
import java.nio.file.Paths;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.jar.JarEntry;
import java.util.jar.JarInputStream;

import javax.management.MBeanServer;

import com.gmt2001.PathValidator;
import com.illusionaryone.Logger;
import com.sun.management.HotSpotDiagnosticMXBean;

import tv.phantombot.PhantomBot;
import tv.phantombot.RepoVersion;

/**
 * Provides methods which perform common reflection operations
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

    /**
     * Loads all classes visible to the default {@link ClassLoader} which have the specified package prefix into the classloaders cache
     *
     * @param pkg the package or package prefix to load
     */
    public void loadPackageRecursive(String pkg) {
        this.loadPackageRecursive(pkg, Collections.emptyList());
    }

    /**
     * Loads all classes visible to the default {@link ClassLoader} which have the specified package prefix into the classloaders cache
     * <p>
     * If any paths return {@code true} on a {@link String#contains(CharSequence)} of any entry in {@code exclude}, the class will be excluded from loading
     *
     * @param pkg the package or package prefix to load
     * @param exclude a list of partial path names to exclude
     */
    public void loadPackageRecursive(String pkg, List<String> exclude) {
        pkg = pkg.replace('.', '/');
        ClassLoader classLoader = Reflect.class.getClassLoader();
        URL u = Reflect.class.getProtectionDomain().getCodeSource().getLocation();
        try ( JarInputStream jar = new JarInputStream(u.openStream())) {
            JarEntry e;
            do {
                e = jar.getNextJarEntry();

                if (e != null) {
                    String name = e.getName();

                    if (name.startsWith(pkg) && name.endsWith(".class")) {
                        boolean excluded = false;

                        for (String s: exclude) {
                            if (name.contains(s)) {
                                excluded = true;
                                break;
                            }
                        }

                        if (!excluded) {
                            try {
                                Class.forName(name.replace('/', '.').replace(".class", ""), true, classLoader);
                            } catch (ClassNotFoundException ex) {
                                com.gmt2001.Console.debug.printStackTrace(ex);
                            }
                        }
                    }
                }
            } while (e != null);
        } catch (IOException ex) {
            com.gmt2001.Console.debug.printStackTrace(ex);
        }
    }

    /**
     * Workaround to get the {@link ClassLoader#classes} field in JDK 12+
     *
     * @return the field
     * @throws NoSuchMethodException if unable to load {@link Class#getDeclaredFields0()} or unable to find the field
     * @throws IllegalAccessException if Java language access control blocks invocation
     * @throws InvocationTargetException if an exception is thrown by the method being invoked
     */
    private Field getClassesField() throws NoSuchMethodException, IllegalAccessException, InvocationTargetException {
        Method getDeclaredFields0 = Class.class.getDeclaredMethod("getDeclaredFields0", boolean.class);
        getDeclaredFields0.setAccessible(true);
        Field[] fields = (Field[]) getDeclaredFields0.invoke(ClassLoader.class, false);
        Field modifiers = null;
        for (Field each : fields) {
            if ("classes".equals(each.getName())) {
                return each;
            }
        }

        throw new NoSuchMethodException("Could not find field 'classes'");
    }

    /**
     * Gets a list of {@link Class} that are in the cache of the default {@link ClassLoader}
     *
     * @return a list of {@link Class}
     */
    @SuppressWarnings({"unchecked", "rawtypes"})
    public List<Class<?>> getClasses() {
        List<Class<?>> cl = new ArrayList<>();

        try {
            Field f = this.getClassesField();
            f.setAccessible(true);
            ClassLoader classLoader = Reflect.class.getClassLoader();
            @SuppressWarnings("UseOfObsoleteCollectionType")
            List<Class> classes = (List<Class>) f.get(classLoader);
            final int size = classes.size();
            for (int i = 0; i < size; i++) {
                cl.add(classes.get(i));
            }
        } catch (IllegalArgumentException | IllegalAccessException | NoSuchMethodException | SecurityException | InvocationTargetException ex) {
            com.gmt2001.Console.err.printStackTrace(ex);
        }

        return Collections.unmodifiableList(cl);
    }

    /**
     * Gets a list of non-abstract {@link Class} that are in the cache of the default {@link ClassLoader} which are assignable from the specified type
     *
     * @param <T> the parent class or interface
     * @param type the parent class or interface
     * @return a list of sub-classes
     */
    @SuppressWarnings("unchecked")
    public <T> List<Class<? extends T>> getSubTypesOf(final Class<T> type) {
        List<Class<? extends T>> cl = new ArrayList<>();

        getClasses().stream().filter((c) -> (type.isAssignableFrom(c) && !Modifier.isAbstract(c.getModifiers()))).forEachOrdered((c) -> {
            cl.add((Class<? extends T>) c);
        });

        return Collections.unmodifiableList(cl);
    }

    /**
     * Dumps the Java heap to an hprof file
     * <p>
     * This method tries to generate a filename of {@code java_pid##.TIMESTAMP.hprof} where {@code ##} is
     * the PID of the running process and {@code TIMESTAMP} is the timestamp when the method was called in {@code yyyy-MM-dd_HH-mm-ss} format
     * <p>
     * This method calls {@link #dumpHeap(String, boolean)} with the {@code live} parameter set to {@code true}
     */
    public static void dumpHeap() {
        String timestamp;
        try {
            timestamp = Logger.instance().logFileDTTimestamp();
        } catch (Exception ex) {
            com.gmt2001.Console.err.printStackTrace(ex);
            try {
                timestamp = Logger.instance().logFileDTTimestamp(ZoneId.of("Z")) + "Z";
            } catch (Exception ex2) {
                com.gmt2001.Console.err.printStackTrace(ex2);
                timestamp = "UNK";
            }
        }

        try {
            String fName = "java_pid" + Long.toString(pid()) + "." + timestamp + ".hprof";
            String fPath;

            if (RepoVersion.isDocker()) {
                fPath = Paths.get(PathValidator.getDockerPath(), fName).toString();
            } else {
                fPath = Paths.get(GetExecutionPath(), fName).toString();
            }

            dumpHeap(fPath, true);
        } catch (IOException ex) {
            com.gmt2001.Console.err.printStackTrace(ex, false, true);
        }
    }

    /**
     * Dumps the Java Heap to a file
     *
     * @param filePath the path to the file where the heap should be written
     * @param live {@code true} to only dump <i>live</i> objects
     * @throws IOException if the file already exists, cannot be created, opened, or written to
     */
    // https://www.baeldung.com/java-heap-dump-capture
    /**
     * Dumps the Java heap to an hprof file
     *
     * @param filePath the path to where the heap dump should be written
     * @param live {@code true} to only dump <i>live</i> objects (objects which are referenced by others)
     * @throws IOException if the {@code outputFile} already exists, cannot be created, opened, or written to
     * @throws IllegalArgumentException if {@code filePath} does not end with the {@code .hprof} extension
     */
    public static void dumpHeap(String filePath, boolean live) throws IOException, IllegalArgumentException {
        MBeanServer server = ManagementFactory.getPlatformMBeanServer();
        HotSpotDiagnosticMXBean mxBean = ManagementFactory.newPlatformMXBeanProxy(
                server, "com.sun.management:type=HotSpotDiagnostic", HotSpotDiagnosticMXBean.class);
        mxBean.dumpHeap(filePath, live);
    }

    /**
     * Attempts to retrieve the PID of the running process from the {@link RuntimeMXBean} of the JVM process
     *
     * @return the PID
     */
    public static long pid() throws NumberFormatException {
        return ManagementFactory.getRuntimeMXBean().getPid();
    }

    /**
     * Gets a {@link MemoryUsage} containing information about the current memory usage of the heap
     *
     * @return a {@link MemoryUsage} for the heap
     */
    public static MemoryUsage getHeapMemoryUsage() {
        return ManagementFactory.getMemoryMXBean().getHeapMemoryUsage();
    }

    /**
     * Gets a {@link MemoryUsage} containing information about the current non-heap memory usage
     *
     * @return a {@link MemoryUsage} for non-heap memory
     */
    public static MemoryUsage getNonHeapMemoryUsage() {
        return ManagementFactory.getMemoryMXBean().getNonHeapMemoryUsage();
    }

    /**
     * Attempts to retrieve the full, real, absolute path to the directory in which PhantomBot.jar is located
     *
     * @return {@code .} on failure; otherwise, the path
     */
    public static String GetExecutionPath() {
        try {
            return Paths.get(PhantomBot.class.getProtectionDomain().getCodeSource().getLocation().toURI()).getParent().toAbsolutePath().toRealPath().toString();
        } catch (IOException | URISyntaxException ex) {
            com.gmt2001.Console.err.printStackTrace(ex);
        }

        return ".";
    }
}
