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
package com.scaniatv;

import com.gmt2001.PathValidator;
import java.io.BufferedReader;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileNotFoundException;
import java.io.IOException;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.nio.file.AccessDeniedException;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.nio.file.StandardOpenOption;
import java.util.ArrayList;
import java.util.Collection;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import org.apache.commons.io.FileUtils;
import org.apache.commons.io.filefilter.TrueFileFilter;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;
import org.json.JSONStringer;
import tv.phantombot.PhantomBot;
import tv.phantombot.script.Script;
import tv.phantombot.script.ScriptManager;

public final class LangFileUpdater {

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
    public static String getCustomLang(String langFile) throws JSONException {
        String stringArray;

        if (PathValidator.isValidPathLang(CUSTOM_LANG_ROOT + langFile)) {
            stringArray = convertLangMapToJSONArray(
                    getCustomAndDefaultLangMap(
                            getLang(DEFAULT_LANG_ROOT + sanitizePath(langFile)),
                            getLang(CUSTOM_LANG_ROOT + sanitizePath(langFile))
                    )
            );
        } else {
            stringArray = new JSONStringer().array().object().key("id").value("AccessDenied").key("response").value("Outside acceptable path").endObject().endArray().toString();
        }

        return stringArray;
    }

    /**
     * Method that updates a custom lang file.
     *
     * @param stringArray
     * @param langFile
     */
    public static void updateCustomLang(String stringArray, String langFile, JSONStringer jso) throws JSONException {
        final StringBuilder sb = new StringBuilder();
        final JSONArray array = new JSONArray(stringArray);
        boolean success = true;

        for (int i = 0; i < array.length(); i++) {
            JSONObject obj = array.getJSONObject(i);

            sb.append("$.lang.register('");
            sb.append(obj.getString("id"));
            sb.append("', '");
            sb.append(sanitizeResponse(obj.getString("response")));
            sb.append("');\n");
        }

        try {
            langFile = CUSTOM_LANG_ROOT + sanitizePath(langFile);

            if (!PathValidator.isValidPathLang(langFile)) {
                jso.object().key("errors").array().object()
                        .key("status").value("403")
                        .key("title").value("Forbidden")
                        .key("detail").value("Outside acceptable path")
                        .endObject().endArray().endObject();
                success = false;
                throw new AccessDeniedException(langFile, null, "Outside acceptable path");
            }

            Files.createDirectories(PathValidator.getRealPath(Paths.get(langFile)).getParent());

            // This is used if we need to load the script or not.
            boolean exists = true;
            if (!Files.exists(Paths.get(langFile))) {
                exists = false;
            }

            // Write the data.
            Files.write(Paths.get(langFile), sb.toString().getBytes(StandardCharsets.UTF_8), StandardOpenOption.CREATE, StandardOpenOption.TRUNCATE_EXISTING);

            // If the script doesn't exist, load it.
            File file = new File(langFile);
            if (!exists) {
                ScriptManager.loadScript(file, langFile);
            } else {
                if (!PhantomBot.getReloadScripts()) {
                    Map<String, Script> scripts = ScriptManager.getScripts();
                    String matchPath = file.toPath().toString().substring(file.toPath().toString().indexOf("lang"));

                    final List<String> errors = new ArrayList<>();
                    scripts.values().forEach((script -> {
                        String path = script.getFile().toPath().toString();

                        if (path.contains("lang")) {
                            if (path.substring(path.indexOf("lang")).equals(matchPath)) {
                                try {
                                    script.reload();
                                } catch (IOException ex) {
                                    errors.add(ex.getMessage());
                                    com.gmt2001.Console.err.printStackTrace(ex);
                                }
                            }
                        }
                    }));

                    if (errors.size() > 0) {
                        jso.object().key("errors").array();
                        errors.forEach(msg -> jso.object()
                                .key("status").value("500")
                                .key("title").value("Internal Server Error")
                                .key("detail").value("IOException: " + msg)
                                .endObject());
                        jso.endArray().endObject();
                        success = false;
                    }
                }
            }
        } catch (IOException ex) {
            jso.object().key("errors").array().object()
                    .key("status").value("500")
                    .key("title").value("Internal Server Error")
                    .key("detail").value("IOException: " + ex.getMessage())
                    .endObject().endArray().endObject();
            success = false;
            com.gmt2001.Console.err.printStackTrace(ex);
        }

        jso.object().key("success").value(success).endObject();
    }

    /**
     * Method that replaces ' with \'.
     *
     * @param response
     * @return
     */
    private static String sanitizeResponse(String response) {
        return response.replaceAll("'", "\\\\'");
    }

    private static String sanitizePath(String path) {
        return path.replaceAll("%", "_");
    }

    /**
     * Method that gets a list of all lang files.
     *
     * @return
     */
    public static String[] getLangFiles() {
        Collection<File> files = FileUtils.listFiles(new File(DEFAULT_LANG_ROOT), TrueFileFilter.INSTANCE, TrueFileFilter.INSTANCE);
        ArrayList<String> fileNames = new ArrayList<>();

        String sep = File.separator;

        files.forEach((File file) -> {
            fileNames.add(file.getPath().replace("." + sep + "scripts" + sep + "lang" + sep + "english" + sep, ""));
        });

        return fileNames.toArray(new String[fileNames.size()]);
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

        langFile = sanitizePath(langFile);

        if (PathValidator.isValidPathLang(langFile)) {
            if (new File(langFile).exists()) {
                try {
                    try ( BufferedReader br = new BufferedReader(new InputStreamReader(new FileInputStream(langFile)))) {
                        int c;

                        while ((c = br.read()) != -1) {
                            sb.append((char) c);
                        }
                    }
                } catch (IOException ex) {
                    com.gmt2001.Console.err.printStackTrace(ex);
                }
            }
        } else {
            sb.append("AccessDenied: Outside acceptable path");
        }

        return sb.toString();
    }

    /**
     * Method that gets the ID from the custom and default lang file, and adds missing lang IDs to the custom one, plus returns the lang ID and
     * matches in a HashMap.
     *
     * @param defaultLang
     * @param customLang
     * @return
     */
    private static HashMap<String, String> getCustomAndDefaultLangMap(String defaultLang, String customLang) {
        // Create a new patter that will match if the default lang ID is also in the custom one.
        final Pattern pattern = Pattern.compile("^\\$\\.lang\\.register\\((\\'|\\\")([a-zA-Z0-9,.-]+)(\\'|\\\")\\,\\s(\\'|\\\")(.*)(\\'|\\\")\\);", Pattern.MULTILINE);

        // Get all matches for the default lang.
        final Matcher m1 = pattern.matcher(defaultLang);
        final HashMap<String, String> defaultMatches = new HashMap<>();
        while (m1.find()) {
            defaultMatches.put(m1.group(2), m1.group(5));
        }

        // Get all matches for the custom lang.
        final Matcher m2 = pattern.matcher(customLang);
        final HashMap<String, String> customMatches = new HashMap<>();
        while (m2.find()) {
            customMatches.put(m2.group(2), m2.group(5));
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
    private static String convertLangMapToJSONArray(HashMap<String, String> map) throws JSONException {
        final JSONStringer jsonArray = new JSONStringer();

        // Make a new array.
        jsonArray.array();

        map.forEach((String key, String value) -> {
            final JSONObject obj = new JSONObject();

            try {
                jsonArray.object().key("id").value(key).key("response").value(value).endObject();
            } catch (JSONException ex) {
                com.gmt2001.Console.err.logStackTrace(ex);
            }
        });

        // Close the array.
        jsonArray.endArray();

        // This part is a bit slow.
        return jsonArray.toString();
    }
}
