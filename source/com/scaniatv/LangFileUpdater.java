/*
 * Copyright (C) 2016-2026 phantombot.github.io/PhantomBot
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

import java.io.BufferedReader;
import java.io.FileInputStream;
import java.io.FileNotFoundException;
import java.io.IOException;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.nio.file.AccessDeniedException;
import java.nio.file.FileVisitOption;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardOpenOption;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Stream;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;
import org.json.JSONStringer;

import com.gmt2001.PathValidator;
import com.gmt2001.datastore.DataStore;

import reactor.util.function.Tuple2;
import reactor.util.function.Tuples;
import tv.phantombot.event.EventBus;
import tv.phantombot.event.webpanel.websocket.WebPanelSocketUpdateEvent;

public final class LangFileUpdater {

    private static final String LANG_ROOT = "./scripts/lang/";

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

        if (PathValidator.isValidPathLang(LANG_ROOT + "custom/" + langFile)) {
            String currentLangName = DataStore.instance().GetString("settings", "", "lang");
            Tuple2<String, Boolean> defaultLang = getLang(LANG_ROOT + "english/" + sanitizePath(langFile));
            Tuple2<String, Boolean> currentLang;
            if (currentLangName != null && !currentLangName.equalsIgnoreCase("english")) {
                currentLang = getLang(LANG_ROOT + currentLangName + "/" + sanitizePath(langFile));
            } else {
                currentLang = Tuples.of("", false);
            }
            Tuple2<String, Boolean> customLang = getLang(LANG_ROOT + "custom/" + sanitizePath(langFile));
            stringArray = convertLangMapToJSONArray(
                    getLangMap(
                            defaultLang.getT1(), defaultLang.getT2(),
                            currentLang.getT1(), currentLang.getT2(),
                            customLang.getT1(), customLang.getT2()
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
        boolean success = true;

        try {
            langFile = LANG_ROOT + "custom/" + sanitizePath(langFile);

            if (!PathValidator.isValidPathLang(langFile)) {
                jso.object().key("errors").array().object()
                        .key("status").value("403")
                        .key("title").value("Forbidden")
                        .key("detail").value("Outside acceptable path")
                        .endObject().endArray().endObject();
                success = false;
                throw new AccessDeniedException(langFile, null, "Outside acceptable path");
            }

            if (!Files.exists(PathValidator.getRealPath(Paths.get(langFile)))) {
                Files.createDirectories(PathValidator.getRealPath(Paths.get(langFile)).getParent());
            }

            boolean isJson = langFile.endsWith(".json");
            String fName = langFile;
            boolean exists = Files.exists(Paths.get(fName));
            if (!exists) {
                fName = langFile.replace(isJson ? ".json" : ".js", isJson ? ".js" : ".json");
                exists = Files.exists(Paths.get(fName));
            }

            final StringBuilder sb = new StringBuilder();
            final JSONArray array = new JSONArray(stringArray);

            JSONStringer jss = new JSONStringer();
            jss.object();

            for (int i = 0; i < array.length(); i++) {
                JSONObject obj = array.getJSONObject(i);

                jss.key(obj.getString("id"));
                jss.value(obj.getString("response"));
            }

            jss.endObject();
            sb.append(jss.toString());

            if (exists) {
                Files.deleteIfExists(Paths.get(fName));
            }

            if (!isJson) {
                langFile = langFile.replace(".js", ".json");
            }

            // Write the data.
            Files.write(Paths.get(langFile), sb.toString().getBytes(StandardCharsets.UTF_8), StandardOpenOption.CREATE, StandardOpenOption.TRUNCATE_EXISTING);

            // If the script doesn't exist, load it.
            EventBus.instance().postAsync(new WebPanelSocketUpdateEvent("langUpdated", "core/bootstrap/lang", null, new String[0]));
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

    private static String sanitizePath(String path) {
        return path.replaceAll("%", "_");
    }

    /**
     * Method that gets a list of all lang files.
     *
     * @return
     */
    public static String[] getLangFiles() {
        List<String> fileNames = new ArrayList<>();
        Path langRoot = Paths.get(LANG_ROOT + "english/");

        try ( Stream<Path> fileStream = Files.find(langRoot, Integer.MAX_VALUE, (p, a) -> p.getFileName().toString().endsWith(".js") || p.getFileName().toString().endsWith(".json"), FileVisitOption.FOLLOW_LINKS)) {
            fileStream.forEach(p -> fileNames.add(langRoot.relativize(p).toString()));
        } catch (IOException ex) {
            com.gmt2001.Console.err.printStackTrace(ex);
        }

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
    private static Tuple2<String, Boolean> getLang(String langFile) {
        final StringBuilder sb = new StringBuilder();

        langFile = sanitizePath(langFile);
        boolean isJson = langFile.endsWith(".json");

        if (PathValidator.isValidPathLang(langFile)) {
            String fName = langFile;
            boolean exists = Files.exists(Paths.get(fName));
            if (!exists) {
                fName = langFile.replace(isJson ? ".json" : ".js", isJson ? ".js" : ".json");
                isJson = !isJson;
                exists = Files.exists(Paths.get(fName));
            }
            if (exists) {
                try {
                    try ( BufferedReader br = new BufferedReader(new InputStreamReader(new FileInputStream(fName)))) {
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

        return Tuples.of(sb.toString(), isJson);
    }

    private static JSONObject jsonOrNull(String json, boolean isJson) {
        if (isJson) {
            try {
                JSONObject jso = new JSONObject(json);
                return jso;
            } catch (JSONException ex) {
                com.gmt2001.Console.err.logStackTrace(ex);
            }
        }

        return null;
    }

    /**
     * Method that gets the ID from the custom and default lang file, and adds missing lang IDs to the custom one, plus returns the lang ID and
     * matches in a HashMap.
     *
     * @param defaultLang
     * @param customLang
     * @return
     */
    private static HashMap<String, String> getLangMap(String defaultLang, boolean defaultJson, String currentLang, boolean currentJson, String customLang, boolean customJson) {
        // Create a new patter that will match if the default lang ID is also in the custom one.
        final Pattern pattern = Pattern.compile("^\\$\\.lang\\.register\\((\\'|\\\")([a-zA-Z0-9,.-]+)(\\'|\\\")\\,\\s(\\'|\\\")(.*)(\\'|\\\")\\);", Pattern.MULTILINE);

        // Get all matches for the default lang.
        final HashMap<String, String> defaultMatches = new HashMap<>();
        final JSONObject jsoD = jsonOrNull(defaultLang, defaultJson);
        if (jsoD != null) {
            jsoD.keySet().stream().forEach(k -> defaultMatches.put(k, jsoD.optString(k)));
        } else {
            final Matcher m1 = pattern.matcher(defaultLang);
            while (m1.find()) {
                defaultMatches.put(m1.group(2), m1.group(5));
            }
        }

        // Get all matches for the current lang.
        final HashMap<String, String> currentMatches = new HashMap<>();
        final JSONObject jsoS = jsonOrNull(currentLang, currentJson);
        if (jsoS != null) {
            jsoS.keySet().stream().forEach(k -> currentMatches.put(k, jsoS.optString(k)));
        } else {
            final Matcher m2 = pattern.matcher(currentLang);
            while (m2.find()) {
                currentMatches.put(m2.group(2), m2.group(5));
            }
        }

        // Get all matches for the custom lang.
        final HashMap<String, String> customMatches = new HashMap<>();
        final JSONObject jsoC = jsonOrNull(customLang, customJson);
        if (jsoC != null) {
            jsoC.keySet().stream().forEach(k -> customMatches.put(k, jsoC.optString(k)));
        } else {
            final Matcher m2 = pattern.matcher(customLang);
            while (m2.find()) {
                customMatches.put(m2.group(2), m2.group(5));
            }
        }

        // Check if any is missing in the custom one.
        currentMatches.forEach((String key, String value) -> {
            if (!customMatches.containsKey(key)) {
                customMatches.put(key, value);
            }
        });

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
