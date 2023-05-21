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
package com.gmt2001;

import com.illusionaryone.Logger;
import com.sun.management.HotSpotDiagnosticMXBean;
import java.io.IOException;
import java.lang.management.ManagementFactory;
import java.lang.management.MemoryUsage;
import java.lang.management.RuntimeMXBean;
import java.lang.reflect.Field;
import java.lang.reflect.Modifier;
import java.net.URISyntaxException;
import java.net.URL;
import java.nio.file.Paths;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.List;
import java.util.jar.JarEntry;
import java.util.jar.JarInputStream;
import javax.management.MBeanServer;
import tv.phantombot.PhantomBot;
import tv.phantombot.RepoVersion;

/**
 * Provides Java reflection services
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
     * Recursively loads all classes and sub-packages of the given package from {@code PhantomBot.jar}
     *
     * @param pkg the package to load
     */
    public void loadPackageRecursive(String pkg) {
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

    /**
     * Returns a list of all classes currently loaded into memory by the class loader
     *
     * @return a list of classes
     */
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

    /**
     * Returns a list of all classes for which the provided type is assignable from and are not abstract
     *
     * @param <T> the parent type to test against
     * @param type the {@link Class} instance representing the parent type
     * @return a list of child {@link Class} which are not abstract
     */
    @SuppressWarnings("unchecked")
    public <T> List<Class<? extends T>> getSubTypesOf(final Class<T> type) {
        List<Class<? extends T>> cl = new ArrayList<>();

        getClasses().stream().filter((c) -> (type.isAssignableFrom(c) && !Modifier.isAbstract(c.getModifiers()))).forEachOrdered((c) -> {
            cl.add((Class<? extends T>) c);
        });

        return cl;
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
