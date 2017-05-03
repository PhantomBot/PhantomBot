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

import java.sql.Connection;

/**
 *
 * @author gmt2001
 */
public class DataStore {

    private static final DataStore instance = new DataStore();

    public static DataStore instance() {
        return instance;
    }

    protected DataStore() {
    }

    public void SaveChangedNow() {
    }

    public void SaveAll(boolean force) {
    }

    public void ReloadFile(String fName) {
    }

    public void LoadConfig(String configStr) {
    }

    public String[] GetFileList() {
        return new String[] {
               };
    }

    public String[] GetCategoryList(String fName) {
        return new String[] {
               };
    }

    public String[] GetKeyList(String fName, String section) {
        return new String[] {
               };
    }

    public String[] GetKeysByOrder(String fName, String section, String order, String limit, String offset) {
        return new String[] {
               };
    }

    public String[] GetKeysByLikeValues(String fName, String section, String search) {
        return new String[] {
               };
    }

    public String[] GetKeysByLikeKeys(String fName, String section, String search) {
        return new String[] {
               };
    }

    public String[] GetKeysByLikeKeysOrder(String fName, String section, String search, String order, String limit, String offset) {
        return new String[] {
               };
    }

    public String GetString(String fName, String section, String key) {
        return "";
    }

    public void SetString(String fName, String section, String key, String value) {
    }

    public void InsertString(String fName, String section, String key, String value) {
        SetString(fName, section, key, value);
    }

    public void SetBatchString(String fName, String section, String[] key, String[] value) {
        for (int i = 0; i < key.length; i++) {
            SetString(fName, section, key[i], value[i]);
        }
    }

    public Object GetObject(String fName, String section, String key) {
        throw new UnsupportedOperationException();
    }

    public void SetObject(String fName, String section, String key, Object value) {
        throw new UnsupportedOperationException();
    }

    public long GetLong(String fName, String section, String key) {
        String sval = GetString(fName, section, key);

        try {
            return Long.parseLong(sval);
        } catch (Exception ex) {
            return 0;
        }
    }

    public void SetLong(String fName, String section, String key, long value) {
        String sval = Long.toString(value);

        SetString(fName, section, key, sval);
    }

    public int GetInteger(String fName, String section, String key) {
        String sval = GetString(fName, section, key);

        try {
            return Integer.parseInt(sval);
        } catch (Exception ex) {
            return 0;
        }
    }

    public void SetInteger(String fName, String section, String key, int value) {
        String sval = Integer.toString(value);

        SetString(fName, section, key, sval);
    }

    public float GetFloat(String fName, String section, String key) {
        String sval = GetString(fName, section, key);

        try {
            return Float.parseFloat(sval);
        } catch (Exception ex) {
            return 0.0f;
        }
    }

    public void SetFloat(String fName, String section, String key, float value) {
        String sval = Float.toString(value);

        SetString(fName, section, key, sval);
    }

    public double GetDouble(String fName, String section, String key) {
        String sval = GetString(fName, section, key);

        try {
            return Double.parseDouble(sval);
        } catch (Exception ex) {
            return 0.0;
        }
    }

    public void SetDouble(String fName, String section, String key, double value) {
        String sval = Double.toString(value);

        SetString(fName, section, key, sval);
    }

    public Boolean GetBoolean(String fName, String section, String key) {
        int ival = GetInteger(fName, section, key);

        return ival == 1;
    }

    public void SetBoolean(String fName, String section, String key, Boolean value) {
        int ival = 0;

        if (value) {
            ival = 1;
        }

        SetInteger(fName, section, key, ival);
    }

    public void RemoveKey(String fName, String section, String key) {
    }

    public void RemoveSection(String fName, String section) {
    }

    public void AddFile(String fName) {
    }

    public void RemoveFile(String fName) {
    }

    public void RenameFile(String fNameSource, String fNameDest) {
    }

    public boolean FileExists(String fName) {
        return false;
    }

    public boolean HasKey(String fName, String section, String key) {
        return GetString(fName, section, key) != null;
    }

    public boolean exists(String fName, String key) {
        return HasKey(fName, "", key);
    }

    public String get(String fName, String key) {
        return GetString(fName, "", key);
    }

    public void set(String fName, String key, String value) {
        SetString(fName, "", key, value);
    }

    public void setbatch(String fName, String[] keys, String[] values) {
        SetBatchString(fName, "", keys, values);
    }

    public void del(String fName, String key) {
        RemoveKey(fName, "", key);
    }

    public void incr(String fName, String section, String key, int amount) {
        int ival = GetInteger(fName, section, key);
        ival += amount;
        SetInteger(fName, section, key, ival);
    }

    public void incr(String fName, String key, int amount) {
        incr(fName, "", key, amount);
    }

    public void decr(String fName, String section, String key, int amount) {
        int ival = GetInteger(fName, section, key);
        ival -= amount;
        SetInteger(fName, section, key, ival);
    }

    public void decr(String fName, String key, int amount) {
        decr(fName, "", key, amount);
    }

    public String[] searchByValue(String fName, String search) {
        return GetKeysByLikeValues(fName, "", search);
    }

    public String[] searchByKey(String fName, String search) {
        return GetKeysByLikeKeys(fName, "", search);
    }

    public void CreateIndexes() {
    }

    public void DropIndexes() {
    }

    public Connection CreateConnection(String db, String user, String pass) {
        return null;
    }

    public void setAutoCommit(boolean mode) {
    }

    public void backupSQLite3(String filename) {
    }
}
