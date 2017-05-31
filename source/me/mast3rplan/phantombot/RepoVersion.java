/*
 * Copyright (C) 2017 phantombot.tv
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
package me.mast3rplan.phantombot;

import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.net.URL;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Enumeration;
import java.util.jar.Attributes;
import java.util.jar.JarFile;
import java.util.jar.Manifest;

public class RepoVersion {
  
  private static final boolean nightlyBuild = false;
  
  private RepoVersion() {}
  
  protected static String getValue(String key) {
    try {
      String path = PhantomBot.class.getProtectionDomain().getCodeSource().getLocation().getPath();
      JarFile jar = new JarFile(new File(path));
      Manifest mf = new Manifest(jar.getManifest());
      Attributes attrib = mf.getMainAttributes();
      String value = attrib.getValue(key);
      if(value != null) {
        return value;
      }
    } catch (IOException e) {
      com.gmt2001.Console.err.printStackTrace(e);
    }
    return null;
  }
  
  public static String getPhantomBotVersion() {
    return getValue("Bundle-Version");
  }
  
  public static String getRepoVersion() {
    return getValue("Bundle-Revision");
  }
  
  public static boolean getNightlyBuild() {
    return nightlyBuild;
  }
}