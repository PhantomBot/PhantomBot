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

        getClasses().stream().filter((c) -> (type.isAssignableFrom(c) && !Modifier.isAbstract(c.getModifiers()))).forEachOrdered((c) -> {
            cl.add((Class<? extends T>) c);
        });

        return cl;
    }

    public static void dumpHeap() {
        int pid;
        try {
            pid = pid();
        } catch (NumberFormatException ex) {
            com.gmt2001.Console.err.printStackTrace(ex);
            pid = 0;
        }

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
            String fName = "java_pid" + Integer.toString(pid) + "." + timestamp + ".hprof";
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
    public static void dumpHeap(String filePath, boolean live) throws IOException {
        MBeanServer server = ManagementFactory.getPlatformMBeanServer();
        HotSpotDiagnosticMXBean mxBean = ManagementFactory.newPlatformMXBeanProxy(
                server, "com.sun.management:type=HotSpotDiagnostic", HotSpotDiagnosticMXBean.class);
        mxBean.dumpHeap(filePath, live);
    }

    public static int pid() throws NumberFormatException {
        RuntimeMXBean runtime = ManagementFactory.getRuntimeMXBean();
        return Integer.parseInt(runtime.getName().split("@")[0]);
    }

    public static String GetExecutionPath() {
        try {
            return Paths.get(PhantomBot.class.getProtectionDomain().getCodeSource().getLocation().toURI()).getParent().toAbsolutePath().toRealPath().toString();
        } catch (IOException | URISyntaxException ex) {
            com.gmt2001.Console.err.printStackTrace(ex);
        }

        return ".";
    }
}
