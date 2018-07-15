/*
 * Copyright (C) 2016-2018 phantombot.tv
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

package com.scaniatv;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.BufferedReader;
import java.io.BufferedWriter;
import java.io.FileNotFoundException;
import java.io.IOException;
import java.io.InputStreamReader;
import java.io.OutputStreamWriter;

import java.util.regex.Pattern;
import java.util.regex.Matcher;
import java.util.HashMap;

import org.json.JSONObject;
import org.json.JSONArray;
import org.json.JSONStringer;

public final class LangFileUpdater {
    private static final LangFileUpdater INSTANCE = new LangFileUpdater();
    private static final String CUSTOM_LANG_ROOT = "./scripts/lang/custom/";
    private static final String DEFAULT_LANG_ROOT = "./scripts/lang/english/";
    
    /**
     * Class constructor.
     */
    private LangFileUpdater() {
        
    }
    
    /**
     * Method that gets a custom lang file, and adds default ones if missing from the custom one.
     * 
     * @param langFile
     * @return 
     */
    public static String getCustomLang(String langFile) {
        String stringArray = null;
        
        stringArray = convertLangMapToJSONArray(
            getCustomAndDefaultLangMap(
                getLang(DEFAULT_LANG_ROOT + langFile),
                getLang(CUSTOM_LANG_ROOT + langFile)
            )
        );
        
        return stringArray;
    }
    
    /**
     * Method that updates a custom lang file.
     * 
     * @param stringArray 
     * @param langFile 
     */
    public static void updateCustomLang(String stringArray, String langFile) {
        final StringBuilder sb = new StringBuilder();
        final JSONArray array = new JSONArray(stringArray);
        
        for (int i = 0; i < array.length(); i++) {
            JSONObject obj = array.getJSONObject(i);
            
            sb.append("$.lang.register('" + obj.getString("id") + "', '" + obj.getString("response") + "');\n");
        }
        
        try {
            // Make sure the folder exists.
            if (!new File(langFile).isDirectory()) {
                new File(langFile).mkdirs();
            }
            // Write the data.
            try (BufferedWriter bw = new BufferedWriter(new OutputStreamWriter(new FileOutputStream(CUSTOM_LANG_ROOT + langFile, false)))) {
                bw.write(sb.toString());
                bw.close();
            }
        } catch (IOException ex) {
            com.gmt2001.Console.err.printStackTrace(ex);
        }
    }
    
    /**
     * Method that gets a lang file.
     * 
     * @param langFile
     * @return
     * @throws FileNotFoundException
     * @throws IOException 
     */
    private static String getLang(String langFile) {
        final StringBuilder sb = new StringBuilder();
        
        try {
            try (BufferedReader br = new BufferedReader(new InputStreamReader(new FileInputStream(langFile)))) {
                int c;
            
                while ((c = br.read()) != -1) {
                    sb.append((char)c);
                }
                br.close();
            }
        } catch (IOException ex) {
            com.gmt2001.Console.err.printStackTrace(ex);
        }
        return sb.toString();
    }
    
    /**
     * Method that gets the ID from the custom and default lang file, and adds 
     * missing lang IDs to the custom one, plus returns the lang ID and matches in a HashMap.
     * 
     * @param defaultLang
     * @param customLang
     * @return 
     */
    private static HashMap<String, String> getCustomAndDefaultLangMap(String defaultLang, String customLang) {
        // Create a new patter that will match if the default lang ID is also in the custom one.
        final Pattern pattern = Pattern.compile("\\$\\.lang\\.register\\(\\'([a-zA-Z0-9,.-]+)\\'\\,\\s\\'(.*)\\'\\);");
        
        // Get all matches for the default lang.
        final Matcher m1 = pattern.matcher(defaultLang);
        final HashMap<String, String> defaultMatches = new HashMap<>();
        while (m1.find()) {
            defaultMatches.put(m1.group(1), m1.group(2));
        }
        
        // Get all matches for the custom lang.
        final Matcher m2 = pattern.matcher(customLang);
        HashMap<String, String> customMatches = new HashMap<>();
        while (m2.find()) {
            customMatches.put(m2.group(1), m2.group(2));
        }
        
        // Check if any is missing in the custom one.
        defaultMatches.forEach((String key, String value) -> {
            if (!customMatches.containsKey(key)) {
                customMatches.put(key, value);
            }
        });
        
        return customMatches;
    }
    
    /**
     * Method that converts the lang map to a JSON array for the panel to us.
     * 
     * @param map
     * @return 
     */
    private static String convertLangMapToJSONArray(HashMap<String, String> map) {
        final JSONStringer jsonArray = new JSONStringer();
        
        // Make a new array.
        jsonArray.array();
        
        map.forEach((String key, String value) -> {
            final JSONObject obj = new JSONObject();
            
            jsonArray.object().key(key).value(value).endObject();
        });
        
        // Close the array.
        jsonArray.endArray();
        
        // This part is a bit slow.
        return jsonArray.toString();
    }
}
