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
import java.lang.management.ThreadInfo;
import java.lang.management.ThreadMXBean;
import java.lang.reflect.Modifier;
import java.net.URISyntaxException;
import java.net.URL;
import java.net.URLClassLoader;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.nio.file.StandardOpenOption;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.jar.JarEntry;
import java.util.jar.JarInputStream;

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
    /**
     * Instance
     */
    private static final Reflect INSTANCE = new Reflect();
    /**
     * Cache of loaded packages to prevent scanning multiple times
     */
    private final List<String> loadedPackages = new CopyOnWriteArrayList<>();
    /**
     * Cache of loaded classes
     */
    private final List<Class<?>> classes = new CopyOnWriteArrayList<>();

    /**
     * Returns an instance of {@link Reflect}
     *
     * @return an instance of {@link Reflect}
     */
    public static Reflect instance() {
        return INSTANCE;
    }

    private Reflect() {
    }

    /**
     * Loads all classes visible to the default {@link ClassLoader} which have the specified package prefix into the local cache
     * <p>
     * This process also triggers static initializers in matching classes
     * <p>
     * {@code pkg} is matched using {@link String#startsWith(String)}
     * <p>
     * The classes are enumerated from the main jar file
     *
     * @param pkg the package or package prefix to load
     * @return {@code this}
     */
    public Reflect loadPackageRecursive(String pkg) {
        return this.loadPackageRecursive(pkg, Collections.emptyList());
    }

    /**
     * Loads all classes visible to the default {@link ClassLoader} which have the specified package prefix into the local cache
     * <p>
     * If any paths return {@code true} on a {@link String#contains(CharSequence)} of any entry in {@code exclude}, the class will be excluded from loading
     * <p>
     * This process also triggers static initializers in matching classes
     * <p>
     * {@code pkg} is matched using {@link String#startsWith(String)}. {@code exclude} is matched using {@link String#contains(CharSequence)}
     * <p>
     * The classes are enumerated from the main jar file
     *
     * @param pkg the package or package prefix to load
     * @param exclude a list of partial path names to exclude
     * @return {@code this}
     */
    public Reflect loadPackageRecursive(String pkg, List<String> exclude) {
        return this.loadPackageRecursive(null, pkg, exclude);
    }

    /**
     * Loads all classes visible to the default {@link ClassLoader} in the specified jar file which have the specified package prefix into the local cache
     * <p>
     * If any paths return {@code true} on a {@link String#contains(CharSequence)} of any entry in {@code exclude}, the class will be excluded from loading
     * <p>
     * This process also triggers static initializers in matching classes
     * <p>
     * {@code pkg} is matched using {@link String#startsWith(String)}. {@code exclude} is matched using {@link String#contains(CharSequence)}
     *
     * @param jarFile the {@link URL} representing the path to the jar file which will be searched; {@code null} to search the main jar file
     * @param pkg the package or package prefix to load; {@code ""} (empty string) to load the entire jar file
     * @param exclude a list of partial path names to exclude
     * @return {@code this}
     */
    public Reflect loadPackageRecursive(URL jarFile, String pkg, List<String> exclude) {
        ClassLoader classLoader = null;

        if (jarFile == null) {
            jarFile = Reflect.class.getProtectionDomain().getCodeSource().getLocation();
            classLoader = Reflect.class.getClassLoader();
        }

        if (this.loadedPackages.contains(jarFile.toString() + "#" + pkg)) {
            return this;
        }

        this.loadedPackages.add(jarFile.toString() + "#" +pkg);

        if (classLoader == null) {
            classLoader = new URLClassLoader(new URL[] { jarFile }, Reflect.class.getClassLoader());
        }

        pkg = pkg.replace('.', '/');

        try ( JarInputStream jar = new JarInputStream(jarFile.openStream())) {
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
                                Class<?> c = Class.forName(name.replace('/', '.').replace(".class", ""), true, classLoader);
                                if (!this.classes.contains(c)) {
                                    this.classes.add(c);
                                }
                            } catch (ClassNotFoundException ex) {
                                com.gmt2001.Console.debug.printStackTrace(ex, Map.of(
                                    "jarFile", jarFile == null ? null : jarFile.toString(),
                                    "pkg", pkg,
                                    "exclude", exclude,
                                    "name", name
                                ));
                            }
                        }
                    }
                }
            } while (e != null);
        } catch (IOException ex) {
            com.gmt2001.Console.debug.printStackTrace(ex);
        }

        return this;
    }

    /**
     * Gets a list of {@link Class} that are in the local cache as a result of calls to {@link #loadPackageRecursive(String, List)}
     *
     * @return a list of {@link Class}
     */
    public List<Class<?>> getClasses() {
        return Collections.unmodifiableList(this.classes);
    }

    /**
     * Gets a list of non-abstract {@link Class} that are in the local cache as a result of calls to {@link #loadPackageRecursive(String, List)} which are assignable from the specified type
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

    // https://www.baeldung.com/java-heap-dump-capture
    /**
     * Dumps the Java heap to an hprof file
     *
     * @param filePath the path to where the heap dump should be written
     * @param live {@code true} to only dump <i>live</i> objects (objects which are referenced by others)
     * @throws IOException if {@code filePath} already exists, cannot be created, opened, or written to
     * @throws IllegalArgumentException if {@code filePath} does not end with the {@code .hprof} extension
     */
    public static void dumpHeap(String filePath, boolean live) throws IOException, IllegalArgumentException {
        ManagementFactory.newPlatformMXBeanProxy(
                ManagementFactory.getPlatformMBeanServer(),
                "com.sun.management:type=HotSpotDiagnostic",
                HotSpotDiagnosticMXBean.class)
                .dumpHeap(filePath, live);
    }

    /**
     * Dumps all threads to a file
     * <p>
     * This method tries to generate a filename of {@code java_pid##.TIMESTAMP.threads.txt} where {@code ##} is
     * the PID of the running process and {@code TIMESTAMP} is the timestamp when the method was called in {@code yyyy-MM-dd_HH-mm-ss} format
     */
    public static void dumpThreads() {
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
            String fName = "java_pid" + Long.toString(pid()) + "." + timestamp + ".threads.txt";
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
     * Dumps all threads to a file
     *
     * @param filePath the path to where the thread dump should be written
     * @throws IOException if {@code filePath} already exists, cannot be created, opened, or written to
     */
    public static void dumpThreads(String filePath) throws IOException {
        ThreadMXBean bean = ManagementFactory.getThreadMXBean();
        ThreadInfo[] threads = bean.dumpAllThreads(bean.isObjectMonitorUsageSupported(), bean.isSynchronizerUsageSupported());

        StringBuilder sb = new StringBuilder();
        for (ThreadInfo thread: threads) {
            sb.append(thread.toString());
        }

        Files.writeString(Paths.get(filePath), sb, StandardOpenOption.CREATE_NEW, StandardOpenOption.WRITE);
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
