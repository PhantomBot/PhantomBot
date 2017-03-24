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
package com.gmt2001.datastore;

import java.awt.event.ActionEvent;
import java.awt.event.ActionListener;
import java.io.File;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.nio.file.StandardOpenOption;
import java.util.Collection;
import java.util.Date;
import java.util.HashMap;
import java.util.Iterator;
import java.util.Set;
import javax.swing.Timer;
import org.apache.commons.io.FileUtils;

/**
 *
 * @author gmt2001
 */
public class IniStore extends DataStore implements ActionListener {

    private final HashMap<String, IniFile> files = new HashMap<>();
    private final HashMap<String, Date> changed = new HashMap<>();
    private final Date nextSave = new Date(0);
    private final Timer t;
    private final Timer t2;
    private static final long saveinterval = 5 * 60 * 1000;
    private static final IniStore instance = new IniStore();
    private String inifolder = "";

    public static IniStore instance() {
        return instance;
    }

    private IniStore() {
        inifolder = LoadConfigReal("");

        t = new Timer((int) saveinterval, this);
        t2 = new Timer(1, this);

        Thread.setDefaultUncaughtExceptionHandler(com.gmt2001.UncaughtExceptionHandler.instance());

        t.start();
    }

    private String validatefName(String fName) {
        fName = fName.replaceAll("([^a-zA-Z0-9_-])", "_");

        return fName;
    }

    private String validateSection(String section) {
        section = section.replaceAll("([^a-zA-Z0-9_-])", "_");

        return section;
    }

    private String validateKey(String key) {
        key = key.replaceAll("=", "_eq_");

        if (key.startsWith(";") || key.startsWith("[")) {
            key = "_" + key;
        }

        return key;
    }

    private boolean LoadFile(String fName, boolean force) {
        fName = validatefName(fName);

        if (!files.containsKey(fName) || force) {
            try {
                String data = FileUtils.readFileToString(new File("./" + inifolder + "/" + fName + ".ini"));
                String[] lines = data.replaceAll("\\r", "").split("\\n");

                IniFile f = new IniFile();

                String section = "";

                f.data.put(section, new HashMap<>());

                for (String line : lines) {
                    if (!line.trim().startsWith(";")) {
                        if (line.trim().startsWith("[") && line.trim().endsWith("]")) {
                            section = line.trim().substring(1, line.trim().length() - 1);
                            f.data.put(section, new HashMap<>());
                        } else if (!line.trim().isEmpty()) {
                            String[] spl = line.split("=", 2);
                            f.data.get(section).put(spl[0], spl[1]);
                        }
                    }
                }

                files.put(fName, f);
            } catch (IOException ex) {
                AddFile(fName);
                return false;
            }
        }

        return true;
    }

    private void SaveFile(String fName, IniFile data) {
        if (data == null) {
            return;
        }

        try {
            String wdata = "";
            Object[] adata = data.data.keySet().toArray();
            Object[] akdata;
            Object[] avdata;

            for (int i = 0; i < adata.length; i++) {
                if (i > 0) {
                    wdata += "\r\n";
                }

                if (!((String) adata[i]).equals("")) {
                    wdata += "[" + ((String) adata[i]) + "]\r\n";
                }

                akdata = data.data.get(((String) adata[i])).keySet().toArray();
                avdata = data.data.get(((String) adata[i])).values().toArray();

                for (int b = 0; b < akdata.length; b++) {
                    wdata += ((String) akdata[b]) + "=" + ((String) avdata[b]) + "\r\n";
                }
            }
            if (!Files.isDirectory(Paths.get("./" + inifolder + "/"))) {
                Files.createDirectory(Paths.get("./" + inifolder + "/"));
            }

            Files.write(Paths.get("./" + inifolder + "/" + fName + ".ini"), wdata.getBytes(StandardCharsets.UTF_8),
                        StandardOpenOption.CREATE, StandardOpenOption.WRITE, StandardOpenOption.TRUNCATE_EXISTING);

            changed.remove(fName);
        } catch (IOException ex) {
            com.gmt2001.Console.err.printStackTrace(ex);
        }
    }

    @Override
    public void actionPerformed(ActionEvent e) {
        t2.stop();
        SaveAll(false);
    }

    private static class IniFile {

        protected HashMap<String, HashMap<String, String>> data = new HashMap<>();
    }

    @Override
    public void AddFile(String fName) {
        if (!new File("./" + inifolder + "/").exists()) {
            new File("./" + inifolder + "/").mkdirs();
        }

        IniFile f = new IniFile();
        f.data.put("", new HashMap<>());

        files.put(fName, f);
    }

    @Override
    public void SaveChangedNow() {
        nextSave.setTime(new Date().getTime() - 1);

        SaveAll(false);
    }

    @Override
    public void SaveAll(boolean force) {
        if (!nextSave.after(new Date()) || force) {
            Object[] n = changed.keySet().toArray();
            if (n != null) {

                if (force) {
                    n = files.keySet().toArray();
                }

                if (n.length > 0) {
                    com.gmt2001.Console.debug.println("Saving " + n.length + " files");
                }

                for (Object n1 : n) {
                    try {
                        if (force || changed.get((String) n1).after(nextSave) || changed.get((String) n1).equals(nextSave)) {
                            SaveFile((String) n1, files.get((String) n1));
                        }
                    } catch (java.lang.NullPointerException e) {
                        try {
                            SaveFile((String) n1, files.get((String) n1));
                        } catch (java.lang.NullPointerException e2) {
                            com.gmt2001.Console.err.printStackTrace(e2);
                        }
                    }
                }

                nextSave.setTime(new Date().getTime() + saveinterval);

                if (n.length > 0) {
                    com.gmt2001.Console.debug.println("Save complete");
                }
            } else {
                com.gmt2001.Console.debug.println("Object null, nothing to save.");
            }
        }
    }

    @Override
    public void ReloadFile(String fName) {
        fName = validatefName(fName);

        LoadFile(fName, true);
    }

    @Override
    public void LoadConfig(String configStr) {
        inifolder = LoadConfigReal(configStr);
    }

    private static String LoadConfigReal(String configStr) {
        if (configStr.isEmpty()) {
            return "inistore";
        } else {
            return configStr;
        }
    }

    @Override
    public String[] GetFileList() {
        if (new File("./" + inifolder + "/").exists()) {

            Collection<File> f = FileUtils.listFiles(new File("./" + inifolder + "/"), null, false);

            String[] s = new String[f.size()];

            Iterator<File> it = f.iterator();
            int i = 0;

            while (it.hasNext()) {
                String name = it.next().getName();

                name = name.substring(0, name.lastIndexOf(".ini"));

                s[i++] = name;
            }

            return s;
        }

        return new String[] {
               };
    }

    @Override
    public String[] GetCategoryList(String fName) {
        fName = validatefName(fName);

        if (!LoadFile(fName, false)) {
            return new String[] {
                   };
        }

        Set<String> o = files.get(fName).data.keySet();

        String[] s = new String[o.size()];

        Iterator<String> it = o.iterator();
        int i = 0;

        while (it.hasNext()) {
            s[i++] = it.next();
        }

        return s;
    }

    @Override
    public String[] GetKeyList(String fName, String section) {
        fName = validatefName(fName);

        if (!LoadFile(fName, false)) {
            return new String[] {
                   };
        }

        section = validateSection(section);

        Set<String> o = files.get(fName).data.get(section).keySet();

        String[] s = new String[o.size()];

        Iterator<String> it = o.iterator();
        int i = 0;

        while (it.hasNext()) {
            s[i++] = it.next();
        }

        return s;
    }

    @Override
    public String GetString(String fName, String section, String key) {
        fName = validatefName(fName);

        if (!LoadFile(fName, false)) {
            return null;
        }

        section = validateSection(section);
        key = validateKey(key);

        if (!files.containsKey(fName) || !files.get(fName).data.containsKey(section)
                || !files.get(fName).data.get(section).containsKey(key)) {
            return null;
        }

        return files.get(fName).data.get(section).get(key);
    }

    @Override
    public String[] GetKeysByLikeValues(String fName, String section, String search) {
        fName = validatefName(fName);

        if (!LoadFile(fName, false)) {
            return null;
        }

        section = validateSection(section);
        Set<String> o = files.get(fName).data.get(section).keySet();
        String[] s = new String[o.size()];

        int i = 0;
        Iterator<String> it = o.iterator();
        while (it.hasNext()) {
            String key = it.next();
            if (files.get(fName).data.get(section).get(key).toLowerCase().contains(search.toLowerCase())) {
                s[i++] = key;
            }
        }

        if (i == 0) {
            return null;
        }

        String[] retVal = new String[i];
        System.arraycopy(s, 0, retVal, 0, i);
        return retVal;
    }

    @Override
    public String[] GetKeysByLikeKeys(String fName, String section, String search) {
        fName = validatefName(fName);

        if (!LoadFile(fName, false)) {
            return null;
        }

        section = validateSection(section);
        Set<String> o = files.get(fName).data.get(section).keySet();
        String[] s = new String[o.size()];

        int i = 0;
        Iterator<String> it = o.iterator();
        while (it.hasNext()) {
            String key = it.next();
            if (key.toLowerCase().contains(search.toLowerCase())) {
                s[i++] = key;
            }
        }

        if (i == 0) {
            return null;
        }

        String[] retVal = new String[i];
        System.arraycopy(s, 0, retVal, 0, i);
        return retVal;
    }

    @Override
    public void SetBatchString(String fName, String section, String[] keys, String[] values) {
        fName = validatefName(fName);

        LoadFile(fName, false);

        section = validateSection(section);

        if (!files.get(fName).data.containsKey(section)) {
            files.get(fName).data.put(section, new HashMap<>());
        }

        for (int idx = 0; idx < keys.length; idx++) {
            String key = validateKey(keys[idx]);
            files.get(fName).data.get(section).put(key, values[idx]);
        }

        changed.put(fName, new Date());

        t2.start();
    }

    @Override
    public void SetString(String fName, String section, String key, String value) {
        fName = validatefName(fName);

        LoadFile(fName, false);

        section = validateSection(section);
        key = validateKey(key);

        if (!files.get(fName).data.containsKey(section)) {
            files.get(fName).data.put(section, new HashMap<>());
        }

        files.get(fName).data.get(section).put(key, value);

        changed.put(fName, new Date());

        t2.start();
    }

    @Override
    public void RemoveKey(String fName, String section, String key) {
        fName = validatefName(fName);

        LoadFile(fName, false);

        section = validateSection(section);
        key = validateKey(key);

        files.get(fName).data.get(section).remove(key);

        SaveFile(fName, files.get(fName));
    }

    @Override
    public void RemoveSection(String fName, String section) {
        fName = validatefName(fName);

        LoadFile(fName, false);

        section = validateSection(section);

        files.get(fName).data.remove(section);

        SaveFile(fName, files.get(fName));
    }

    @Override
    public void RemoveFile(String fName) {
        fName = validatefName(fName);

        File f = new File("./" + inifolder + "/" + fName + ".ini");

        f.delete();

        files.remove(fName);
    }

    @Override
    public void RenameFile(String fNameSource, String fNameDest) {
        fNameSource = validatefName(fNameSource);
        fNameDest = validatefName(fNameDest);

        SaveFile(fNameSource, files.get(fNameSource));
        if (!FileExists(fNameSource)) {
            return;
        }

        SaveFile(fNameDest, files.get(fNameDest));
        if (FileExists(fNameDest)) {
            RemoveFile(fNameDest);
        }

        File sourceFile = new File("./" + inifolder + "/" + fNameSource + ".ini");
        File destFile = new File("./" + inifolder + "/" + fNameDest + ".ini");

        sourceFile.renameTo(destFile);

        files.remove(fNameSource);
        LoadFile(fNameDest, false);
    }

    @Override
    public boolean FileExists(String fName) {
        fName = validatefName(fName);

        File f = new File("./" + inifolder + "/" + fName + ".ini");

        return f.exists();
    }
}
