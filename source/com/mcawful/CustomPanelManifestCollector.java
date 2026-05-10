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

import com.gmt2001.PathValidator;
import com.gmt2001.util.Reflect;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.HashSet;
import java.util.Locale;
import java.util.Set;
import java.util.stream.Stream;

import org.json.JSONArray;
import org.json.JSONObject;

import tv.phantombot.RepoVersion;

/**
 * Discovers {@code manifest.json} files under {@code web/panel/custom/&lt;moduleId&gt;/} (bot install
 * and, in Docker, the data volume) and merges {@code nav} and {@code cards} entries for the panel.
 *
 * <p>Panel HTML/JS should continue to live under {@code web/panel/pages/&lt;folder&gt;/} using the same
 * URLs as stock {@code $.loadPage}; manifests register sidebar links ({@code nav}) and cards on
 * existing single-page panels ({@code cards}). {@code folder} must begin with {@code custom/} so
 * paths stay namespaced.</p>
 *
 * @author mcawful
 */
public final class CustomPanelManifestCollector {

    /**
     * Sidebar sections where community modules may register links. Other built-in sections
     * (commands, moderation, loyalty, ranking, keywords, discord, history, settings, help)
     * are intentionally off-limits because they gate on permissions, security, or core
     * feature integrity. Single-page sections (dashboard, timers, quotes, games, overlay,
     * permissions) have no submenu to append to and are therefore not supported as nav targets.
     */
    private static final Set<String> ALLOWED_NAV_SECTIONS = Set.of("extra", "alerts", "giveaways", "audio");

    /**
     * Single-page panels that expose a card mount point. Cards may be appended here without a
     * submenu. Currently only the Games page supports custom cards; expand this set when a new
     * page declares a {@code pb-panel-&lt;section&gt;-custom-cards} mount in {@code index.html} /
     * page fragment.
     */
    private static final Set<String> ALLOWED_CARD_SECTIONS = Set.of("games");

    /**
     * Section used when a {@code nav} entry omits {@code section} or specifies a value not in
     * {@link #ALLOWED_NAV_SECTIONS}.
     */
    private static final String DEFAULT_NAV_SECTION = "extra";

    /**
     * Section used when a {@code cards} entry omits {@code section} or specifies a value not in
     * {@link #ALLOWED_CARD_SECTIONS}.
     */
    private static final String DEFAULT_CARD_SECTION = "games";

    /**
     * Maximum fields in a card {@code settingsModal} block (DoS guardrail), counting all fields
     * across {@code sections} when using accordion layout.
     */
    private static final int MAX_SETTINGS_MODAL_FIELDS = 50;

    /**
     * Maximum collapsible sections in {@code settingsModal.sections}.
     */
    private static final int MAX_SETTINGS_MODAL_SECTIONS = 10;

    /**
     * Modal title / field label length limit.
     */
    private static final int MAX_SETTINGS_TITLE_LEN = 200;

    /**
     * Tooltip / help text length limit for modal fields.
     */
    private static final int MAX_SETTINGS_HELP_LEN = 500;

    /**
     * Optional {@code detailsModal.content} length cap (text or sanitized HTML for the info dialog).
     */
    private static final int MAX_DETAILS_MODAL_CONTENT_LEN = 16384;

    /**
     * INIDB table name and key segment length limit.
     */
    private static final int MAX_DB_IDENTIFIER_LEN = 64;

    /**
     * Optional {@code reloadCommand} passed to {@code socket.sendCommand} after save.
     */
    private static final int MAX_RELOAD_CMD_LEN = 64;

    /**
     * Optional {@code wsEvent.argsString} length cap.
     */
    private static final int MAX_WSEVENT_ARGS_STRING_LEN = 512;

    /**
     * Optional {@code wsEvent.args[]} length and element caps.
     */
    private static final int MAX_WSEVENT_ARGS_COUNT = 32;

    /**
     * Optional {@code wsEvent.args[]} element length cap.
     */
    private static final int MAX_WSEVENT_ARG_ITEM_LEN = 256;

    /**
     * Allowed {@code settingsModal.fields[].type} values for declarative game-card settings UI.
     */
    private static final Set<String> SETTINGS_FIELD_TYPES = Set.of("number", "text", "textarea", "yesno", "dropdown", "permission");

    /**
     * Utility class (not instantiable).
     */
    private CustomPanelManifestCollector() {
    }

    /**
     * Walks {@code web/panel/custom/} under the bot execution directory (and, when running in
     * Docker, under {@code getDockerPath()/web/panel/custom/}), parses every immediate-child
     * module's {@code manifest.json}, validates and de-duplicates the {@code nav} and
     * {@code cards} entries, and serializes them into the JSON document served at
     * {@code /panel/custom-manifests.json}.
     *
     * <p>Invalid manifests are logged and skipped rather than aborting the response, so a single
     * misbehaving module cannot break the panel.</p>
     *
     * @return UTF-8 JSON bytes of the form {@code { "nav": [...], "cards": [...] }}; both arrays
     *         are always present even when empty
     */
    public static byte[] buildJsonResponseBytes() {
        JSONArray nav = new JSONArray();
        JSONArray cards = new JSONArray();
        Set<String> seenNav = new HashSet<>();
        Set<String> seenCards = new HashSet<>();

        appendFromCustomRoot(Paths.get(Reflect.GetExecutionPath(), "web", "panel", "custom"), nav, cards, seenNav, seenCards);

        if (RepoVersion.isDocker()) {
            appendFromCustomRoot(Paths.get(PathValidator.getDockerPath(), "web", "panel", "custom"), nav, cards, seenNav, seenCards);
        }

        JSONObject root = new JSONObject();
        root.put("nav", nav);
        root.put("cards", cards);
        return root.toString().getBytes(StandardCharsets.UTF_8);
    }

    /**
     * Iterates the immediate subdirectories of {@code customRoot}, parses each subdirectory's
     * {@code manifest.json} (when present), and merges its valid entries into {@code nav} and
     * {@code cards}. Errors (I/O, JSON parse, validation) are logged and skipped — a single
     * malformed manifest never aborts the walk.
     *
     * @param customRoot directory expected to contain {@code <moduleId>/manifest.json} entries;
     *                   if the path is not a directory, the call is a no-op
     * @param nav        accumulator for canonical nav entries; mutated in place
     * @param cards      accumulator for canonical card entries; mutated in place
     * @param seenNav    de-dup keys previously added to {@code nav} ({@code folder + page});
     *                   mutated in place
     * @param seenCards  de-dup keys previously added to {@code cards} ({@code section + id});
     *                   mutated in place
     */
    private static void appendFromCustomRoot(Path customRoot, JSONArray nav, JSONArray cards,
            Set<String> seenNav, Set<String> seenCards) {
        if (!Files.isDirectory(customRoot)) {
            return;
        }

        try (Stream<Path> stream = Files.list(customRoot)) {
            stream.filter(Files::isDirectory).forEach(modDir -> {
                Path manifest = modDir.resolve("manifest.json");

                if (!Files.isRegularFile(manifest)) {
                    return;
                }

                try {
                    JSONObject root = new JSONObject(Files.readString(manifest, StandardCharsets.UTF_8));
                    appendNavEntries(manifest, root.optJSONArray("nav"), nav, seenNav);
                    appendCardEntries(manifest, root.optJSONArray("cards"), cards, seenCards);
                } catch (Exception ex) {
                    com.gmt2001.Console.warn.println("Custom panel manifest invalid: " + manifest + " — " + ex.getMessage());
                }
            });
        } catch (IOException ex) {
            com.gmt2001.Console.debug.printOrLogStackTrace(ex);
        }
    }

    /**
     * Validates each entry in a manifest's {@code nav} array and copies the survivors into
     * {@code navOut} as canonical JSON objects ({@code label}, {@code folder}, {@code page},
     * {@code hash}, {@code section}). Entries are dropped (with a warn-log) when:
     *
     * <ul>
     *   <li>{@code label}, {@code folder}, or {@code page} is missing,</li>
     *   <li>{@code folder} or {@code page} fails {@link #isSafeFolder} / {@link #isSafePageFile}, or</li>
     *   <li>the {@code folder + page} key has already been seen across all manifests.</li>
     * </ul>
     *
     * Unsupported {@code section} values are normalized to {@link #DEFAULT_NAV_SECTION} (warn-log)
     * rather than dropped. Missing {@code hash} defaults to {@code "#" + page}; a non-empty
     * {@code hash} that does not start with {@code #} is prefixed with one.
     *
     * @param manifest path of the source manifest, used in log messages
     * @param navIn    raw {@code nav} array as parsed from the manifest, may be {@code null}
     * @param navOut   accumulator for canonical nav entries; mutated in place
     * @param seen     de-dup keys for {@code folder + page}; mutated in place
     */
    private static void appendNavEntries(Path manifest, JSONArray navIn, JSONArray navOut, Set<String> seen) {
        if (navIn == null) {
            return;
        }

        for (int i = 0; i < navIn.length(); i++) {
            JSONObject entry = navIn.optJSONObject(i);

            if (entry == null) {
                continue;
            }

            String label = entry.optString("label", "").trim();
            String folder = entry.optString("folder", "").trim();
            String page = entry.optString("page", "").trim();
            String hash = entry.optString("hash", "").trim();
            String section = entry.optString("section", DEFAULT_NAV_SECTION).trim().toLowerCase(Locale.ROOT);

            if (label.isEmpty() || folder.isEmpty() || page.isEmpty()) {
                com.gmt2001.Console.warn.println("Custom panel manifest skipped nav (missing label/folder/page): " + manifest);
                continue;
            }

            if (!isSafeFolder(folder) || !isSafePageFile(page)) {
                com.gmt2001.Console.warn.println("Custom panel manifest skipped nav (invalid folder/page): " + manifest);
                continue;
            }

            if (!ALLOWED_NAV_SECTIONS.contains(section)) {
                com.gmt2001.Console.warn.println("Custom panel manifest: nav section '" + section + "' is not supported, using '" + DEFAULT_NAV_SECTION + "': " + manifest);
                section = DEFAULT_NAV_SECTION;
            }

            if (hash.isEmpty()) {
                hash = '#' + page;
            } else if (!hash.startsWith("#")) {
                hash = '#' + hash;
            }

            String key = folder + '\0' + page;

            if (!seen.add(key)) {
                continue;
            }

            JSONObject out = new JSONObject();
            out.put("label", label);
            out.put("folder", folder);
            out.put("page", page);
            out.put("hash", hash);
            out.put("section", section);
            navOut.put(out);
        }
    }

    /**
     * Validates each entry in a manifest's {@code cards} array and copies the survivors into
     * {@code cardsOut} as canonical JSON objects ({@code section}, {@code id}, {@code title},
     * {@code description}, optional {@code scriptPath}, optional {@code settingsFolder} and
     * {@code settingsPage}, optional {@code detailsModal}). Entries are dropped (with a warn-log) when:
     *
     * <ul>
     *   <li>{@code id} or {@code title} is missing,</li>
     *   <li>{@code id} fails {@link #isSafeCardId},</li>
     *   <li>{@code scriptPath} is present but fails {@link #isSafeScriptPath},</li>
     *   <li>either {@code settingsFolder} or {@code settingsPage} is set and fails its safe-path
     *       check, or</li>
     *   <li>the {@code section + id} key has already been seen across all manifests.</li>
     * </ul>
     *
     * Unsupported {@code section} values are normalized to {@link #DEFAULT_CARD_SECTION} (warn-log)
     * rather than dropped.
     *
     * @param manifest path of the source manifest, used in log messages
     * @param cardsIn  raw {@code cards} array as parsed from the manifest, may be {@code null}
     * @param cardsOut accumulator for canonical card entries; mutated in place
     * @param seen     de-dup keys for {@code section + id}; mutated in place
     */
    private static void appendCardEntries(Path manifest, JSONArray cardsIn, JSONArray cardsOut, Set<String> seen) {
        if (cardsIn == null) {
            return;
        }

        for (int i = 0; i < cardsIn.length(); i++) {
            JSONObject entry = cardsIn.optJSONObject(i);

            if (entry == null) {
                continue;
            }

            String section = entry.optString("section", DEFAULT_CARD_SECTION).trim().toLowerCase(Locale.ROOT);
            String id = entry.optString("id", "").trim();
            String title = entry.optString("title", "").trim();
            String description = entry.optString("description", "").trim();
            String scriptPath = entry.optString("scriptPath", "").trim();
            String settingsFolder = entry.optString("settingsFolder", "").trim();
            String settingsPage = entry.optString("settingsPage", "").trim();

            if (id.isEmpty() || title.isEmpty()) {
                com.gmt2001.Console.warn.println("Custom panel manifest skipped card (missing id/title): " + manifest);
                continue;
            }

            if (!isSafeCardId(id)) {
                com.gmt2001.Console.warn.println("Custom panel manifest skipped card (invalid id): " + manifest);
                continue;
            }

            if (!ALLOWED_CARD_SECTIONS.contains(section)) {
                com.gmt2001.Console.warn.println("Custom panel manifest: card section '" + section + "' is not supported, using '" + DEFAULT_CARD_SECTION + "': " + manifest);
                section = DEFAULT_CARD_SECTION;
            }

            if (!scriptPath.isEmpty() && !isSafeScriptPath(scriptPath)) {
                com.gmt2001.Console.warn.println("Custom panel manifest skipped card (invalid scriptPath): " + manifest);
                continue;
            }

            boolean hasSettings = !settingsFolder.isEmpty() || !settingsPage.isEmpty();

            if (hasSettings && (!isSafeFolder(settingsFolder) || !isSafePageFile(settingsPage))) {
                com.gmt2001.Console.warn.println("Custom panel manifest skipped card (invalid settingsFolder/settingsPage): " + manifest);
                continue;
            }

            String key = section + '\0' + id;

            if (!seen.add(key)) {
                continue;
            }

            JSONObject out = new JSONObject();
            out.put("section", section);
            out.put("id", id);
            out.put("title", title);
            out.put("description", description);
            if (!scriptPath.isEmpty()) {
                out.put("scriptPath", scriptPath);
            }
            if (hasSettings) {
                out.put("settingsFolder", settingsFolder);
                out.put("settingsPage", settingsPage);
            }

            JSONObject settingsModal = optValidatedSettingsModal(entry.optJSONObject("settingsModal"), manifest);
            if (settingsModal != null) {
                out.put("settingsModal", settingsModal);
            }

            JSONObject detailsModal = optValidatedDetailsModal(entry.optJSONObject("detailsModal"), manifest);
            if (detailsModal != null) {
                out.put("detailsModal", detailsModal);
            }

            cardsOut.put(out);
        }
    }

    /**
     * Validates optional {@code detailsModal} for the read-only card info dialog.
     * {@code content} is plain text unless {@code format} is {@code html}; HTML is sanitized in the panel.
     *
     * @param raw      raw {@code detailsModal} object from manifest, or {@code null}
     * @param manifest source manifest path for logging
     * @return canonical JSON or {@code null} when absent or invalid
     */
    private static JSONObject optValidatedDetailsModal(JSONObject raw, Path manifest) {
        if (raw == null) {
            return null;
        }

        String content = raw.optString("content", "").trim();

        if (content.isEmpty()) {
            com.gmt2001.Console.warn.println("Custom panel manifest skipped detailsModal (empty content): " + manifest);
            return null;
        }

        if (content.length() > MAX_DETAILS_MODAL_CONTENT_LEN) {
            com.gmt2001.Console.warn.println("Custom panel manifest skipped detailsModal (content too long): " + manifest);
            return null;
        }

        String fmt = raw.optString("format", "text").trim().toLowerCase(Locale.ROOT);

        if (!fmt.equals("text") && !fmt.equals("html")) {
            com.gmt2001.Console.warn.println("Custom panel manifest: detailsModal unknown format '" + fmt + "', using text: " + manifest);
            fmt = "text";
        }

        JSONObject out = new JSONObject();
        out.put("content", content);

        if ("html".equals(fmt)) {
            out.put("format", "html");
        }

        String title = raw.optString("title", "").trim();

        if (!title.isEmpty()) {
            if (title.length() > MAX_SETTINGS_TITLE_LEN) {
                com.gmt2001.Console.warn.println("Custom panel manifest skipped detailsModal (title too long): " + manifest);
                return null;
            }

            out.put("title", title);
        }

        return out;
    }

    /**
     * Validates {@code settingsModal} for declarative game-card settings (Bootstrap modal + INIDB).
     *
     * <p>Optional {@code reloadCommand} and {@code wsEvent} are consumed by {@code customPanelNav.js}
     * after a successful save. If {@code wsEvent} is omitted but the parent card declares
     * {@code scriptPath}, the panel sends a websocket event to that script with first argument
     * {@code panel-settings-saved} so Rhino modules can refresh in-memory settings without a fork-specific
     * reload command.</p>
     *
     * @param raw      raw {@code settingsModal} object from manifest, or {@code null}
     * @param manifest source manifest path for logging
     * @return canonical JSON or {@code null} when absent or invalid
     */
    private static JSONObject optValidatedSettingsModal(JSONObject raw, Path manifest) {
        if (raw == null) {
            return null;
        }

        String title = raw.optString("title", "").trim();
        if (title.isEmpty() || title.length() > MAX_SETTINGS_TITLE_LEN) {
            com.gmt2001.Console.warn.println("Custom panel manifest skipped settingsModal (invalid title): " + manifest);
            return null;
        }

        JSONArray fieldsIn = raw.optJSONArray("fields");
        JSONArray sectionsIn = raw.optJSONArray("sections");
        boolean hasFields = fieldsIn != null && fieldsIn.length() > 0;
        boolean hasSections = sectionsIn != null && sectionsIn.length() > 0;

        if (hasFields && hasSections) {
            com.gmt2001.Console.warn.println("Custom panel manifest skipped settingsModal (use either fields or sections, not both): " + manifest);
            return null;
        }

        if (!hasFields && !hasSections) {
            com.gmt2001.Console.warn.println("Custom panel manifest skipped settingsModal (need fields or sections): " + manifest);
            return null;
        }

        JSONObject out = new JSONObject();
        out.put("title", title);

        Set<String> fieldIds = new HashSet<>();

        if (hasSections) {
            if (sectionsIn.length() < 1 || sectionsIn.length() > MAX_SETTINGS_MODAL_SECTIONS) {
                com.gmt2001.Console.warn.println("Custom panel manifest skipped settingsModal (invalid sections count): " + manifest);
                return null;
            }

            JSONArray sectionsOut = new JSONArray();
            Set<String> sectionIds = new HashSet<>();
            int totalFields = 0;

            for (int s = 0; s < sectionsIn.length(); s++) {
                JSONObject sec = sectionsIn.optJSONObject(s);

                if (sec == null) {
                    continue;
                }

                String sid = sec.optString("id", "").trim();
                String stitle = sec.optString("title", "").trim();
                JSONArray secFieldsIn = sec.optJSONArray("fields");

                if (!isSafeCardId(sid) || stitle.isEmpty() || stitle.length() > MAX_SETTINGS_TITLE_LEN) {
                    com.gmt2001.Console.warn.println("Custom panel manifest skipped settingsModal (invalid section id/title): " + manifest);
                    return null;
                }

                if (!sectionIds.add(sid)) {
                    com.gmt2001.Console.warn.println("Custom panel manifest skipped settingsModal (duplicate section id): " + manifest);
                    return null;
                }

                if (secFieldsIn == null || secFieldsIn.length() < 1) {
                    com.gmt2001.Console.warn.println("Custom panel manifest skipped settingsModal (section needs fields): " + manifest);
                    return null;
                }

                JSONArray secFieldsOut = validateSettingsModalFieldsArray(secFieldsIn, manifest, fieldIds);

                if (secFieldsOut == null) {
                    return null;
                }

                totalFields += secFieldsOut.length();

                if (totalFields > MAX_SETTINGS_MODAL_FIELDS) {
                    com.gmt2001.Console.warn.println("Custom panel manifest skipped settingsModal (too many fields across sections): " + manifest);
                    return null;
                }

                JSONObject secOut = new JSONObject();
                secOut.put("id", sid);
                secOut.put("title", stitle);
                secOut.put("fields", secFieldsOut);

                if (sec.optBoolean("defaultExpanded", false)) {
                    secOut.put("defaultExpanded", true);
                }

                sectionsOut.put(secOut);
            }

            if (sectionsOut.length() == 0) {
                com.gmt2001.Console.warn.println("Custom panel manifest skipped settingsModal (no valid sections): " + manifest);
                return null;
            }

            out.put("sections", sectionsOut);
        } else {
            if (fieldsIn.length() > MAX_SETTINGS_MODAL_FIELDS) {
                com.gmt2001.Console.warn.println("Custom panel manifest skipped settingsModal (too many fields): " + manifest);
                return null;
            }

            JSONArray fieldsOut = validateSettingsModalFieldsArray(fieldsIn, manifest, fieldIds);

            if (fieldsOut == null) {
                return null;
            }

            out.put("fields", fieldsOut);
        }

        String reload = raw.optString("reloadCommand", "").trim();

        if (!reload.isEmpty()) {
            if (!isSafeReloadCommand(reload)) {
                com.gmt2001.Console.warn.println("Custom panel manifest skipped settingsModal (invalid reloadCommand): " + manifest);
                return null;
            }

            out.put("reloadCommand", reload);
        }

        JSONObject wsOut = optValidatedWsEvent(raw.optJSONObject("wsEvent"), manifest);

        if (wsOut != null) {
            out.put("wsEvent", wsOut);
        }

        return out;
    }

    /**
     * Validates {@code settingsModal.fields} or a section's {@code fields} array.
     *
     * @param fieldsIn raw JSON array of field objects
     * @param manifest manifest path for logging
     * @param fieldIds accumulator for unique {@code id}s across the whole modal; mutated in place
     * @return canonical JSON array or {@code null} when invalid
     */
    private static JSONArray validateSettingsModalFieldsArray(JSONArray fieldsIn, Path manifest, Set<String> fieldIds) {
        JSONArray fieldsOut = new JSONArray();

        for (int i = 0; i < fieldsIn.length(); i++) {
            JSONObject f = fieldsIn.optJSONObject(i);

            if (f == null) {
                continue;
            }

            JSONObject fout = validateOneSettingsModalField(f, manifest, fieldIds);

            if (fout == null) {
                return null;
            }

            fieldsOut.put(fout);
        }

        if (fieldsOut.length() == 0) {
            com.gmt2001.Console.warn.println("Custom panel manifest skipped settingsModal (no valid fields): " + manifest);
            return null;
        }

        return fieldsOut;
    }

    /**
     * Validates a single settings field object.
     *
     * @param f        raw field JSON
     * @param manifest manifest path for logging
     * @param fieldIds ids seen so far in this modal (including across sections); mutated in place
     * @return canonical field JSON or {@code null}
     */
    private static JSONObject validateOneSettingsModalField(JSONObject f, Path manifest, Set<String> fieldIds) {
        String fid = f.optString("id", "").trim();
        String type = f.optString("type", "").trim().toLowerCase(Locale.ROOT);
        String label = f.optString("label", "").trim();
        String table = f.optString("table", "").trim();
        String key = f.optString("key", "").trim();
        String help = f.optString("help", "").trim();

        if (!isSafeCardId(fid) || !SETTINGS_FIELD_TYPES.contains(type) || label.isEmpty() || label.length() > MAX_SETTINGS_TITLE_LEN
                || !isSafeDbIdentifier(table) || !isSafeDbIdentifier(key)) {
            com.gmt2001.Console.warn.println("Custom panel manifest skipped settingsModal (invalid field): " + manifest);
            return null;
        }

        if (!fieldIds.add(fid)) {
            com.gmt2001.Console.warn.println("Custom panel manifest skipped settingsModal (duplicate field id): " + manifest);
            return null;
        }

        if (help.length() > MAX_SETTINGS_HELP_LEN) {
            com.gmt2001.Console.warn.println("Custom panel manifest skipped settingsModal (help too long): " + manifest);
            return null;
        }

        JSONObject fout = new JSONObject();
        fout.put("id", fid);
        fout.put("type", type);
        fout.put("label", label);
        fout.put("table", table);
        fout.put("key", key);

        if (!help.isEmpty()) {
            fout.put("help", help);
        }

        if ("dropdown".equals(type)) {
            JSONArray opts = f.optJSONArray("options");

            if (opts == null || opts.length() < 1) {
                com.gmt2001.Console.warn.println("Custom panel manifest skipped settingsModal (dropdown needs options): " + manifest);
                return null;
            }

            JSONArray optsOut = new JSONArray();

            for (int j = 0; j < opts.length(); j++) {
                String o = opts.optString(j, "").trim();

                if (o.isEmpty() || o.length() > 200) {
                    com.gmt2001.Console.warn.println("Custom panel manifest skipped settingsModal (bad dropdown option): " + manifest);
                    return null;
                }

                optsOut.put(o);
            }

            fout.put("options", optsOut);
        }

        if ("number".equals(type)) {
            if (f.has("min")) {
                fout.put("min", f.optInt("min"));
            }

            if (f.has("max")) {
                fout.put("max", f.optInt("max"));
            }
        }

        if ("textarea".equals(type) && f.optBoolean("unlimited", false)) {
            fout.put("unlimited", true);
        }

        return fout;
    }

    /**
     * Validates optional {@code wsEvent} for {@code socket.wsEvent} after INIDB save.
     *
     * @param raw      raw {@code wsEvent} object or {@code null}
     * @param manifest manifest path for logging
     * @return canonical JSON or {@code null} when absent or invalid
     */
    private static JSONObject optValidatedWsEvent(JSONObject raw, Path manifest) {
        if (raw == null) {
            return null;
        }

        String script = raw.optString("script", "").trim();

        if (script.isEmpty() || !isSafeScriptPath(script)) {
            com.gmt2001.Console.warn.println("Custom panel manifest skipped wsEvent (invalid script): " + manifest);
            return null;
        }

        JSONObject out = new JSONObject();
        out.put("script", script);

        if (raw.has("argsString") && !raw.isNull("argsString")) {
            String as = raw.optString("argsString", "");

            if (as.length() > MAX_WSEVENT_ARGS_STRING_LEN) {
                com.gmt2001.Console.warn.println("Custom panel manifest skipped wsEvent (argsString too long): " + manifest);
                return null;
            }

            out.put("argsString", as);
        }

        JSONArray argsIn = raw.optJSONArray("args");

        if (argsIn != null) {
            if (argsIn.length() > MAX_WSEVENT_ARGS_COUNT) {
                com.gmt2001.Console.warn.println("Custom panel manifest skipped wsEvent (too many args): " + manifest);
                return null;
            }

            JSONArray argsOut = new JSONArray();

            for (int i = 0; i < argsIn.length(); i++) {
                if (!argsIn.isNull(i) && !(argsIn.get(i) instanceof String)) {
                    com.gmt2001.Console.warn.println("Custom panel manifest skipped wsEvent (args must be strings): " + manifest);
                    return null;
                }

                String a = argsIn.optString(i, "");

                if (a.length() > MAX_WSEVENT_ARG_ITEM_LEN) {
                    com.gmt2001.Console.warn.println("Custom panel manifest skipped wsEvent (arg too long): " + manifest);
                    return null;
                }

                argsOut.put(a);
            }

            out.put("args", argsOut);
        }

        return out;
    }

    /**
     * INIDB table / key names: alphanumeric plus underscore, typical PhantomBot naming.
     */
    private static boolean isSafeDbIdentifier(String s) {
        if (s.isEmpty() || s.length() > MAX_DB_IDENTIFIER_LEN) {
            return false;
        }

        for (int i = 0; i < s.length(); i++) {
            char c = s.charAt(i);
            boolean ok = (c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z') || (c >= '0' && c <= '9') || c == '_';

            if (!ok) {
                return false;
            }
        }

        return true;
    }

    /**
     * Bot console reload command after saving modal settings (e.g. {@code reloadadventure}).
     */
    private static boolean isSafeReloadCommand(String s) {
        if (s.isEmpty() || s.length() > MAX_RELOAD_CMD_LEN) {
            return false;
        }

        for (int i = 0; i < s.length(); i++) {
            char c = s.charAt(i);

            if (!((c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z') || (c >= '0' && c <= '9') || c == '_')) {
                return false;
            }
        }

        return true;
    }

    /**
     * Folder values from a manifest must begin with {@code custom/} (so paths land in the
     * namespaced custom tree) and contain neither {@code ..} nor {@code \\}, which would let a
     * malicious manifest escape that namespace or trip Windows path quirks. Used both for
     * {@code nav.folder} and {@code cards.settingsFolder}.
     *
     * @param folder manifest-supplied folder string
     * @return {@code true} if the folder is safe to forward to the panel page loader
     */
    private static boolean isSafeFolder(String folder) {
        if (!folder.startsWith("custom/")) {
            return false;
        }
        if (folder.contains("..") || folder.contains("\\")) {
            return false;
        }
        return true;
    }

    /**
     * Page values from a manifest must be a single {@code .html} filename (no path separators,
     * no parent traversal, no backslashes) so the panel loader can join them onto an
     * already-validated folder without further sanitisation. Used both for {@code nav.page} and
     * {@code cards.settingsPage}.
     *
     * @param page manifest-supplied page filename
     * @return {@code true} if the page filename is safe to forward to the panel page loader
     */
    private static boolean isSafePageFile(String page) {
        if (page.contains("/") || page.contains("..") || page.contains("\\")) {
            return false;
        }
        return page.endsWith(".html");
    }

    /**
     * Card ids must be a short identifier safe to use as a DOM id segment: letters, digits,
     * underscores, or hyphens, 1-64 chars. Used as a suffix on the card's element ids and as
     * part of the de-duplication key.
     *
     * @param id manifest-supplied card id
     * @return {@code true} if the id is safe to interpolate into DOM ids and selectors
     */
    private static boolean isSafeCardId(String id) {
        if (id.isEmpty() || id.length() > 64) {
            return false;
        }
        for (int i = 0; i < id.length(); i++) {
            char c = id.charAt(i);
            boolean ok = (c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z') || (c >= '0' && c <= '9') || c == '-' || c == '_';
            if (!ok) {
                return false;
            }
        }
        return true;
    }

    /**
     * Script paths are passed verbatim to the {@code module enable/disable} command. We only
     * reject obviously malformed inputs (path traversal, backslashes, line breaks, oversized
     * strings, missing {@code .js} suffix); PhantomBot's module system normalizes the rest.
     *
     * @param scriptPath manifest-supplied bot-script path (e.g. {@code ./games/myGame.js})
     * @return {@code true} if the script path is safe to forward to the {@code module} command
     */
    private static boolean isSafeScriptPath(String scriptPath) {
        if (scriptPath.length() > 256) {
            return false;
        }
        if (scriptPath.contains("\\") || scriptPath.contains("..") || scriptPath.contains("\n") || scriptPath.contains("\r")) {
            return false;
        }
        return scriptPath.endsWith(".js");
    }
}
