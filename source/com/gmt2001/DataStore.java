/* 
 * Copyright (C) 2015 www.phantombot.net
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

/**
 *
 * @author gmt2001
 */
public class DataStore
{

    private static final DataStore instance = new DataStore();

    public static DataStore instance()
    {
        return instance;
    }

    protected DataStore()
    {
    }

    public void SaveChangedNow()
    {
    }

    public void SaveAll(boolean force)
    {
    }

    public void ReloadFile(String fName)
    {
    }

    public void LoadConfig(String configStr)
    {
    }

    public String[] GetFileList()
    {
        return new String[]
        {
        };
    }

    public String[] GetCategoryList(String fName)
    {
        return new String[]
        {
        };
    }

    public String[] GetKeyList(String fName, String section)
    {
        return new String[]
        {
        };
    }

    public String GetString(String fName, String section, String key)
    {
        return "";
    }

    public void SetString(String fName, String section, String key, String value)
    {
    }

    public Object GetObject(String fName, String section, String key)
    {
        throw new UnsupportedOperationException();
    }

    public void SetObject(String fName, String section, String key, Object value)
    {
        throw new UnsupportedOperationException();
    }

    public int GetInteger(String fName, String section, String key)
    {
        String sval = GetString(fName, section, key);

        try
        {
            return Integer.parseInt(sval);
        } catch (Exception ex)
        {
            return 0;
        }
    }

    public void SetInteger(String fName, String section, String key, int value)
    {
        String sval = Integer.toString(value);

        SetString(fName, section, key, sval);
    }

    public float GetFloat(String fName, String section, String key)
    {
        String sval = GetString(fName, section, key);

        try
        {
            return Float.parseFloat(sval);
        } catch (Exception ex)
        {
            return 0.0f;
        }
    }

    public void SetFloat(String fName, String section, String key, float value)
    {
        String sval = Float.toString(value);

        SetString(fName, section, key, sval);
    }

    public double GetDouble(String fName, String section, String key)
    {
        String sval = GetString(fName, section, key);

        try
        {
            return Double.parseDouble(sval);
        } catch (Exception ex)
        {
            return 0.0;
        }
    }

    public void SetDouble(String fName, String section, String key, double value)
    {
        String sval = Double.toString(value);

        SetString(fName, section, key, sval);
    }

    public Boolean GetBoolean(String fName, String section, String key)
    {
        int ival = GetInteger(fName, section, key);

        return ival == 1;
    }

    public void SetBoolean(String fName, String section, String key, Boolean value)
    {
        int ival = 0;

        if (value)
        {
            ival = 1;
        }

        SetInteger(fName, section, key, ival);
    }

    public void RemoveKey(String fName, String section, String key)
    {
    }

    public void RemoveSection(String fName, String section)
    {
    }

    public void AddFile(String fName)
    {
    }

    public void RemoveFile(String fName)
    {
    }

    public boolean FileExists(String fName)
    {
        return false;
    }

    public boolean HasKey(String fName, String section, String key)
    {
        return GetString(fName, section, key) != null;
    }

    public boolean exists(String fName, String key)
    {
        return HasKey(fName, "", key);
    }

    public String get(String fName, String key)
    {
        return GetString(fName, "", key);
    }

    public void set(String fName, String key, String value)
    {
        SetString(fName, "", key, value);
    }

    public void del(String fName, String key)
    {
        RemoveKey(fName, "", key);
    }

    public void incr(String fName, String key, int amount)
    {
        int ival = GetInteger(fName, "", key);

        ival += amount;

        SetInteger(fName, "", key, ival);
    }

    public void decr(String fName, String key, int amount)
    {
        int ival = GetInteger(fName, "", key);

        ival -= amount;

        SetInteger(fName, "", key, ival);
    }
}
