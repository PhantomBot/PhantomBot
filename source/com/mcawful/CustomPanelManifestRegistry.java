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
package com.mcawful;

import java.util.Collections;
import java.util.HashMap;
import java.util.Locale;
import java.util.Map;

import org.json.JSONArray;
import org.json.JSONObject;

/**
 * Runtime index built from merged custom-panel manifests so {@link tv.phantombot.panel.PanelUser.PanelUserHandler}
 * can resolve INIDB tables and Rhino {@code scriptPath} values to a stock panel section ({@code games},
 * {@code extra}, etc.) without hard-coding community module names.
 *
 * <p>Rebuilt whenever {@link CustomPanelManifestCollector} produces a new merged manifest. Nav-only
 * modules that keep settings in bespoke panel JS (no manifest {@code settingsModal}) rely on the
 * panel sending {@code section} from {@code nav.section} on websocket messages.</p>
 *
 * @author mcawful
 */
public final class CustomPanelManifestRegistry {

    private static volatile Map<String, String> tableToPanelSection = Map.of();
    private static volatile Map<String, String> scriptToPanelSection = Map.of();

    private CustomPanelManifestRegistry() {
    }

    /**
     * Clears and repopulates the registry from the canonical merged {@code cards} array.
     *
     * @param cards merged {@code cards} array (may be empty)
     */
    static void rebuildFromMergedCards(JSONArray cards) {
        Map<String, String> tables = new HashMap<>();
        Map<String, String> scripts = new HashMap<>();

        if (cards != null) {
            for (int i = 0; i < cards.length(); i++) {
                JSONObject card = cards.optJSONObject(i);
                if (card == null) {
                    continue;
                }
                String panelSection = card.optString("section", "games").trim().toLowerCase(Locale.ROOT);
                String scriptPath = card.optString("scriptPath", "").trim();
                if (!scriptPath.isEmpty()) {
                    scripts.put(normalizeScriptPath(scriptPath), panelSection);
                }
                indexSettingsModalTables(card.optJSONObject("settingsModal"), panelSection, tables);
            }
        }

        tableToPanelSection = Collections.unmodifiableMap(tables);
        scriptToPanelSection = Collections.unmodifiableMap(scripts);
    }

    /**
     * @param table INIDB table name from a panel DB request
     * @return panel section to check, or {@code null} if unknown to custom manifests
     */
    public static String panelSectionForTable(String table) {
        if (table == null || table.isEmpty()) {
            return null;
        }
        return tableToPanelSection.get(table.toLowerCase(Locale.ROOT));
    }

    /**
     * @param scriptPath Rhino script path from a panel command or socket event
     * @return panel section to check, or {@code null} if unknown to custom manifests
     */
    public static String panelSectionForScript(String scriptPath) {
        if (scriptPath == null || scriptPath.isEmpty()) {
            return null;
        }
        return scriptToPanelSection.get(normalizeScriptPath(scriptPath));
    }

    private static void indexSettingsModalTables(JSONObject settingsModal, String panelSection, Map<String, String> tables) {
        if (settingsModal == null) {
            return;
        }

        JSONArray fields = settingsModal.optJSONArray("fields");
        if (fields != null) {
            indexFieldTables(fields, panelSection, tables);
        }

        JSONArray sections = settingsModal.optJSONArray("sections");
        if (sections != null) {
            for (int i = 0; i < sections.length(); i++) {
                JSONObject sec = sections.optJSONObject(i);
                if (sec != null) {
                    indexFieldTables(sec.optJSONArray("fields"), panelSection, tables);
                }
            }
        }
    }

    private static void indexFieldTables(JSONArray fields, String panelSection, Map<String, String> tables) {
        if (fields == null) {
            return;
        }

        for (int i = 0; i < fields.length(); i++) {
            JSONObject field = fields.optJSONObject(i);
            if (field == null) {
                continue;
            }
            String table = field.optString("table", "").trim();
            if (!table.isEmpty()) {
                tables.putIfAbsent(table.toLowerCase(Locale.ROOT), panelSection);
            }
        }
    }

    private static String normalizeScriptPath(String scriptPath) {
        return scriptPath.trim().toLowerCase(Locale.ROOT);
    }
}
