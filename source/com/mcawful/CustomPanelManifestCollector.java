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
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashSet;
import java.util.List;
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
     * Card / field id length limit (DOM-id-safe identifier segment).
     */
    private static final int MAX_CARD_ID_LEN = 64;

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
     * Minimum legal length of {@code card.scriptPath} (and {@code wsEvent.script}). The bot's
     * {@code module} command works with {@code ./<dir>/<file>.js}-shape paths, and the shortest
     * legal value of that shape — {@code ./a/b.js} — is exactly 8 characters.
     */
    private static final int SAFE_SCRIPT_PATH_MIN_LEN = 8;

    /**
     * Maximum legal length of {@code card.scriptPath} (and {@code wsEvent.script}). The bot's
     * {@code module} command happily handles long subdirectory chains, but a value over 256
     * chars is almost certainly a mistake (or an exploit attempt) and would also bloat the
     * cached manifest payload disproportionately.
     */
    private static final int MAX_SCRIPT_PATH_LEN = 256;

    /**
     * Per-option string length limit for {@code dropdown} and {@code boolean} field
     * {@code options}. Matches the schema's {@code maxLength} so server and IDE agree.
     */
    private static final int MAX_OPTION_LEN = 200;

    /**
     * Allowed {@code settingsModal.fields[].type} values for declarative game-card settings UI.
     */
    private static final Set<String> SETTINGS_FIELD_TYPES = Set.of("number", "text", "textarea", "boolean", "toggle", "checkboxgroup", "dropdown", "permission");

    /**
     * Lowest legal value for a field's optional {@code column} layout hint
     * (Bootstrap col-md-{@code N}). Anything outside {@code [1, 12]} is rejected.
     */
    private static final int MIN_FIELD_COLUMN_SPAN = 1;

    /**
     * Highest legal value for a field's optional {@code column} layout hint. Mirrors
     * Bootstrap's 12-column grid; {@code column} omitted (or set to 12) means full-width.
     */
    private static final int MAX_FIELD_COLUMN_SPAN = 12;

    /**
     * Maximum number of inline checkboxes a single {@code checkboxgroup} field can declare.
     * Each checkbox writes its own INIDB key, but the whole group still counts as one
     * entry against {@link #MAX_SETTINGS_MODAL_FIELDS}.
     */
    private static final int MAX_CHECKBOXES_PER_GROUP = 12;

    /**
     * Required length of {@code options} on a {@code boolean} field. The two strings are the
     * dropdown labels for {@code true} ({@code options[0]}) and {@code false} ({@code options[1]});
     * INIDB still stores a JS boolean.
     */
    private static final int BOOLEAN_OPTIONS_LENGTH = 2;

    /**
     * Utility class (not instantiable).
     */
    private CustomPanelManifestCollector() {
    }

    /**
     * Returns a memoized {@link CustomPanelManifestCache.CachedResponse} for the merged
     * manifest JSON. Delegates to {@link CustomPanelManifestCache#getOrRefresh}; this method
     * supplies the manifest-domain callbacks (filesystem-signature recipe and JSON-bytes
     * builder) while the cache layer owns the TTL/ETag/concurrency policy.
     *
     * @return current cached response, recomputed on demand when the underlying manifests change
     */
    public static CustomPanelManifestCache.CachedResponse getCachedResponse() {
        List<Path> roots = customRoots();
        return CustomPanelManifestCache.getOrRefresh(
                () -> computeFilesystemSignature(roots),
                () -> buildJsonResponseBytesUncached(roots));
    }

    /**
     * Returns the {@code web/panel/custom/} directories the collector should scan, in priority
     * order: bot execution directory first, Docker {@code _data} second (if applicable). Either
     * may be missing — callers must handle the empty list and individual missing roots.
     */
    private static List<Path> customRoots() {
        List<Path> roots = new ArrayList<>(2);
        roots.add(Paths.get(Reflect.GetExecutionPath(), "web", "panel", "custom"));
        if (RepoVersion.isDocker()) {
            roots.add(Paths.get(PathValidator.getDockerPath(), "web", "panel", "custom"));
        }
        return roots;
    }

    /**
     * Walks every root for direct-child {@code manifest.json} files, parses them, and serializes
     * the merged result. Callers should prefer {@link #getCachedResponse()} so repeated invocations
     * during a panel-login burst don't re-parse identical content.
     *
     * <p>Invalid manifests are logged and skipped rather than aborting the response, so a single
     * misbehaving module cannot break the panel.</p>
     *
     * @param roots the {@code web/panel/custom} directories to scan
     * @return UTF-8 JSON bytes of the form {@code { "nav": [...], "cards": [...] }}
     */
    private static byte[] buildJsonResponseBytesUncached(List<Path> roots) {
        JSONArray nav = new JSONArray();
        JSONArray cards = new JSONArray();
        Set<String> seenNav = new HashSet<>();
        Set<String> seenCards = new HashSet<>();

        for (Path root : roots) {
            appendFromCustomRoot(root, nav, cards, seenNav, seenCards);
        }

        JSONObject root = new JSONObject();
        root.put("nav", nav);
        root.put("cards", cards);
        return root.toString().getBytes(StandardCharsets.UTF_8);
    }

    /**
     * Computes a fast content fingerprint of the on-disk manifest set without parsing any
     * {@code manifest.json}. Walks each root for direct-child {@code manifest.json} files and
     * concatenates {@code path|lastModified|size} for each (sorted for stable output across runs).
     *
     * <p>Any I/O error degrades to a wall-clock sentinel — that intentionally invalidates the
     * cache so the next request re-parses, surfacing the issue rather than serving potentially
     * stale bytes.</p>
     *
     * @param roots the directories to inspect
     * @return opaque signature string; never {@code null}
     */
    private static String computeFilesystemSignature(List<Path> roots) {
        List<String> entries = new ArrayList<>();

        for (Path root : roots) {
            if (!Files.isDirectory(root)) {
                entries.add(root.toString() + "|<missing>");
                continue;
            }

            try (Stream<Path> stream = Files.list(root)) {
                stream.filter(Files::isDirectory).forEach(modDir -> {
                    Path manifest = modDir.resolve("manifest.json");
                    if (!Files.isRegularFile(manifest)) {
                        return;
                    }
                    try {
                        long mtime = Files.getLastModifiedTime(manifest).toMillis();
                        long size = Files.size(manifest);
                        entries.add(manifest.toString() + "|" + mtime + "|" + size);
                    } catch (IOException ex) {
                        entries.add(manifest.toString() + "|<io-error>");
                    }
                });
            } catch (IOException ex) {
                // Force a cache invalidation on the next request so the failure is reported
                // by the warn-log in appendFromCustomRoot rather than silently re-using
                // potentially stale bytes.
                entries.add(root.toString() + "|<io-error>|" + System.nanoTime());
            }
        }

        Collections.sort(entries);
        StringBuilder sb = new StringBuilder();
        for (String entry : entries) {
            sb.append(entry).append('\n');
        }
        return CustomPanelManifestCache.sha256Base64(sb.toString().getBytes(StandardCharsets.UTF_8));
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
                    warnSkip(manifest, "manifest parse error: " + ex.getMessage());
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
                warnSkip(manifest, "nav (missing label/folder/page)");
                continue;
            }

            if (!isSafeFolder(folder) || !isSafePageFile(page)) {
                warnSkip(manifest, "nav (invalid folder/page)");
                continue;
            }

            if (!ALLOWED_NAV_SECTIONS.contains(section)) {
                warnNote(manifest, "nav section '" + section + "' is not supported, using '" + DEFAULT_NAV_SECTION + "'");
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
                warnSkip(manifest, "card (missing id/title)");
                continue;
            }

            if (!isSafeCardId(id)) {
                warnSkip(manifest, "card (invalid id)");
                continue;
            }

            if (!ALLOWED_CARD_SECTIONS.contains(section)) {
                warnNote(manifest, "card section '" + section + "' is not supported, using '" + DEFAULT_CARD_SECTION + "'");
                section = DEFAULT_CARD_SECTION;
            }

            if (!scriptPath.isEmpty() && !isSafeScriptPath(scriptPath)) {
                warnSkip(manifest, "card (invalid scriptPath)");
                continue;
            }

            boolean hasSettings = !settingsFolder.isEmpty() || !settingsPage.isEmpty();

            if (hasSettings && (!isSafeFolder(settingsFolder) || !isSafePageFile(settingsPage))) {
                warnSkip(manifest, "card (invalid settingsFolder/settingsPage)");
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
     * {@code content} is plain text unless {@code format} is {@code html}; HTML is sanitized
     * client-side by {@code customPanelDetailsModal.js#sanitizeDetailsModalHtml} (see schema
     * for the allowed tag whitelist). Server-side sanitization is intentionally not done —
     * custom modules are already trusted code, and the panel is the only consumer.
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
            warnSkip(manifest, "detailsModal (empty content)");
            return null;
        }

        if (content.length() > MAX_DETAILS_MODAL_CONTENT_LEN) {
            warnSkip(manifest, "detailsModal (content too long)");
            return null;
        }

        String fmt = raw.optString("format", "text").trim().toLowerCase(Locale.ROOT);

        if (!fmt.equals("text") && !fmt.equals("html")) {
            warnNote(manifest, "detailsModal unknown format '" + fmt + "', using text");
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
                warnSkip(manifest, "detailsModal (title too long)");
                return null;
            }

            out.put("title", title);
        }

        return out;
    }

    /**
     * Validates {@code settingsModal} for declarative game-card settings (Bootstrap modal + INIDB).
     *
     * <p>Optional {@code reloadCommand} and {@code wsEvent} are consumed by
     * {@code customPanelSettingsModal.js} after a successful save. If {@code wsEvent} is omitted but the parent card declares
     * {@code scriptPath}, the panel sends a websocket event to that script with first argument
     * {@code panel-settings-saved} so Rhino modules can refresh in-memory settings without
     * needing a separate {@code reloadCommand}.</p>
     *
     * <p>The implicit {@code panel-settings-saved} fallback can be opted out of with
     * {@code "disableWsFallback": true} in the manifest, for authors whose modules use a
     * different reload mechanism (e.g. polling, a {@code reloadCommand} only, or no reload at
     * all). The flag only flows into the canonical JSON when explicitly set to {@code true} so
     * the wire format stays compact for the common case. Has no effect when an explicit
     * {@code wsEvent} block is also declared (the explicit event always wins).</p>
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
            warnSkip(manifest, "settingsModal (invalid title)");
            return null;
        }

        JSONArray fieldsIn = raw.optJSONArray("fields");
        JSONArray sectionsIn = raw.optJSONArray("sections");
        boolean hasFields = fieldsIn != null && fieldsIn.length() > 0;
        boolean hasSections = sectionsIn != null && sectionsIn.length() > 0;

        if (hasFields && hasSections) {
            warnSkip(manifest, "settingsModal (use either fields or sections, not both)");
            return null;
        }

        if (!hasFields && !hasSections) {
            warnSkip(manifest, "settingsModal (need fields or sections)");
            return null;
        }

        JSONObject out = new JSONObject();
        out.put("title", title);

        Set<String> fieldIds = new HashSet<>();

        if (hasSections) {
            if (sectionsIn.length() < 1 || sectionsIn.length() > MAX_SETTINGS_MODAL_SECTIONS) {
                warnSkip(manifest, "settingsModal (invalid sections count)");
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
                    warnSkip(manifest, "settingsModal (invalid section id/title)");
                    return null;
                }

                if (!sectionIds.add(sid)) {
                    warnSkip(manifest, "settingsModal (duplicate section id)");
                    return null;
                }

                if (secFieldsIn == null || secFieldsIn.length() < 1) {
                    warnSkip(manifest, "settingsModal (section needs fields)");
                    return null;
                }

                JSONArray secFieldsOut = validateSettingsModalFieldsArray(secFieldsIn, manifest, fieldIds);

                if (secFieldsOut == null) {
                    return null;
                }

                totalFields += secFieldsOut.length();

                if (totalFields > MAX_SETTINGS_MODAL_FIELDS) {
                    warnSkip(manifest, "settingsModal (too many fields across sections)");
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
                warnSkip(manifest, "settingsModal (no valid sections)");
                return null;
            }

            out.put("sections", sectionsOut);
        } else {
            if (fieldsIn.length() > MAX_SETTINGS_MODAL_FIELDS) {
                warnSkip(manifest, "settingsModal (too many fields)");
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
                warnSkip(manifest, "settingsModal (invalid reloadCommand)");
                return null;
            }

            out.put("reloadCommand", reload);
        }

        JSONObject wsOut = optValidatedWsEvent(raw.optJSONObject("wsEvent"), manifest);

        if (wsOut != null) {
            out.put("wsEvent", wsOut);
        }

        if (raw.optBoolean("disableWsFallback", false)) {
            out.put("disableWsFallback", true);
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
            warnSkip(manifest, "settingsModal (no valid fields)");
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
        String help = f.optString("help", "").trim();

        if (!SETTINGS_FIELD_TYPES.contains(type) || !isSafeDbIdentifier(table)) {
            warnSkip(manifest, "settingsModal (field has invalid type or table)");
            return null;
        }

        if (!validateFieldIdentity(fid, label, help, manifest, fieldIds, "field")) {
            return null;
        }

        // checkboxgroup bundles its own subfields and writes one INIDB row per inner
        // checkbox, so it has no field-level "key" and rejects all type-specific knobs
        // belonging to other field types. Branch out before the regular key check.
        if ("checkboxgroup".equals(type)) {
            return validateCheckboxGroupField(f, fid, label, table, help, manifest, fieldIds);
        }

        String key = f.optString("key", "").trim();

        if (!isSafeDbIdentifier(key)) {
            warnSkip(manifest, "settingsModal (field has invalid key)");
            return null;
        }

        if (f.has("checkboxes")) {
            warnSkip(manifest, "settingsModal ('checkboxes' is only valid on type=checkboxgroup)");
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
            JSONArray optsOut = validateOptionsArray(f.optJSONArray("options"), manifest, "dropdown", 1, Integer.MAX_VALUE, false);

            if (optsOut == null) {
                return null;
            }

            fout.put("options", optsOut);
        }

        // 'boolean' renders the same widget as 'dropdown' (helpers.getDropdownGroup) but stores
        // a JS boolean in INIDB. Authors supply exactly two unique labels: options[0] is the
        // label for true, options[1] is the label for false. (See schema for the [trueLabel,
        // falseLabel] convention.)
        if ("boolean".equals(type)) {
            JSONArray optsOut = validateOptionsArray(f.optJSONArray("options"), manifest, "boolean",
                    BOOLEAN_OPTIONS_LENGTH, BOOLEAN_OPTIONS_LENGTH, true);

            if (optsOut == null) {
                return null;
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

        if (f.has("column") && !f.isNull("column")) {
            // 'toggle' renders a small fixed-width pretty-checkbox that doesn't fill a
            // Bootstrap col-md-N cell, so packing it with 'column' produces orphan
            // whitespace. Reject at validation time and steer authors at 'checkboxgroup'
            // (for grouped booleans) or full-width rendering (for a single boolean).
            // 'checkboxgroup' itself rejects 'column' separately in validateCheckboxGroupField
            // since it has no field-level column slot at all. ('boolean' is fine here — it
            // renders as a full-width dropdown like 'dropdown' / 'permission'.)
            if ("toggle".equals(type)) {
                warnSkip(manifest, "settingsModal (column is not supported on type=toggle; use checkboxgroup for grouped booleans)");
                return null;
            }

            int col = f.optInt("column", -1);

            if (col < MIN_FIELD_COLUMN_SPAN || col > MAX_FIELD_COLUMN_SPAN) {
                warnSkip(manifest, "settingsModal (field column must be " + MIN_FIELD_COLUMN_SPAN + ".." + MAX_FIELD_COLUMN_SPAN + ")");
                return null;
            }

            if (col < MAX_FIELD_COLUMN_SPAN) {
                fout.put("column", col);
            }
        }

        return fout;
    }

    /**
     * Validates a {@code checkboxgroup} field. Each inner checkbox is itself a tiny
     * field-like object ({@code id}, {@code label}, {@code key}, optional {@code help})
     * and shares the field-level {@code table}. Inner ids are added to {@code fieldIds}
     * so collisions with sibling field ids — flat or nested — are caught modal-wide.
     *
     * <p>This field type intentionally rejects {@code key}, {@code min}, {@code max},
     * {@code options}, {@code unlimited}, and {@code column} — all of those belong to
     * other field types and would be silently ignored otherwise. Failing fast surfaces
     * authoring mistakes as warn-log skips instead of mysterious save bugs.</p>
     *
     * @param f raw manifest field
     * @param fid pre-validated field id
     * @param label pre-validated label
     * @param table pre-validated INIDB table (shared by every checkbox in the group)
     * @param help pre-validated help text (may be empty)
     * @param manifest manifest path for warn logging
     * @param fieldIds modal-wide id set; updated with every accepted checkbox id
     * @return canonical JSON for the field, or {@code null} when validation fails
     */
    private static JSONObject validateCheckboxGroupField(JSONObject f, String fid, String label, String table, String help, Path manifest, Set<String> fieldIds) {
        if (f.has("key") || f.has("min") || f.has("max") || f.has("options") || f.has("unlimited") || f.has("column")) {
            warnSkip(manifest, "settingsModal (checkboxgroup does not support key/min/max/options/unlimited/column)");
            return null;
        }

        JSONArray cbsIn = f.optJSONArray("checkboxes");

        if (cbsIn == null || cbsIn.length() < 1 || cbsIn.length() > MAX_CHECKBOXES_PER_GROUP) {
            warnSkip(manifest, "settingsModal (checkboxgroup needs 1.." + MAX_CHECKBOXES_PER_GROUP + " checkboxes)");
            return null;
        }

        JSONArray cbsOut = new JSONArray();

        for (int i = 0; i < cbsIn.length(); i++) {
            JSONObject cb = cbsIn.optJSONObject(i);

            if (cb == null) {
                warnSkip(manifest, "settingsModal (checkboxgroup checkbox not an object)");
                return null;
            }

            String cbId = cb.optString("id", "").trim();
            String cbLabel = cb.optString("label", "").trim();
            String cbKey = cb.optString("key", "").trim();
            String cbHelp = cb.optString("help", "").trim();

            if (!validateFieldIdentity(cbId, cbLabel, cbHelp, manifest, fieldIds, "checkboxgroup checkbox")) {
                return null;
            }

            if (!isSafeDbIdentifier(cbKey)) {
                warnSkip(manifest, "settingsModal (checkboxgroup checkbox has invalid key)");
                return null;
            }

            JSONObject cbOut = new JSONObject();
            cbOut.put("id", cbId);
            cbOut.put("label", cbLabel);
            cbOut.put("key", cbKey);

            if (!cbHelp.isEmpty()) {
                cbOut.put("help", cbHelp);
            }

            cbsOut.put(cbOut);
        }

        JSONObject fout = new JSONObject();
        fout.put("id", fid);
        fout.put("type", "checkboxgroup");
        fout.put("label", label);
        fout.put("table", table);

        if (!help.isEmpty()) {
            fout.put("help", help);
        }

        fout.put("checkboxes", cbsOut);
        return fout;
    }

    /**
     * Validates the identity properties shared by every settings-modal field — and by every
     * inner checkbox of a {@code checkboxgroup}:
     *
     * <ul>
     *   <li>{@code id}: safe identifier (≤ {@link #MAX_CARD_ID_LEN} chars), unique modal-wide</li>
     *   <li>{@code label}: non-empty, ≤ {@link #MAX_SETTINGS_TITLE_LEN} chars</li>
     *   <li>{@code help}: ≤ {@link #MAX_SETTINGS_HELP_LEN} chars (may be empty)</li>
     * </ul>
     *
     * <p>Type-specific concerns ({@code type}, {@code key}, {@code table}, {@code options},
     * {@code checkboxes}, {@code column}) are validated by the caller.</p>
     *
     * @param id           trimmed candidate id
     * @param label        trimmed candidate label
     * @param help         trimmed help text (may be empty)
     * @param manifest     manifest path for warn logging
     * @param fieldIds     modal-wide id set; mutated on success
     * @param contextLabel inserted into warn messages so authors can tell whether the bad
     *                     field was an outer field or an inner checkbox (e.g. {@code "field"},
     *                     {@code "checkboxgroup checkbox"})
     * @return {@code true} on success; {@code false} after warn-skip
     */
    private static boolean validateFieldIdentity(String id, String label, String help, Path manifest, Set<String> fieldIds, String contextLabel) {
        if (!isSafeCardId(id)) {
            warnSkip(manifest, "settingsModal (" + contextLabel + " has invalid id)");
            return false;
        }

        if (!fieldIds.add(id)) {
            warnSkip(manifest, "settingsModal (" + contextLabel + " id collides with another field id)");
            return false;
        }

        if (label.isEmpty() || label.length() > MAX_SETTINGS_TITLE_LEN) {
            warnSkip(manifest, "settingsModal (" + contextLabel + " has invalid label)");
            return false;
        }

        if (help.length() > MAX_SETTINGS_HELP_LEN) {
            warnSkip(manifest, "settingsModal (" + contextLabel + " help too long)");
            return false;
        }

        return true;
    }

    /**
     * Shared validator for the {@code options} array on field types that present a dropdown of
     * author-supplied strings. Used by {@code dropdown} (1+ items, duplicates allowed) and
     * {@code boolean} (exactly 2 unique items, where {@code [0]} = true, {@code [1]} = false).
     * Each option is trimmed to a non-empty string of at most {@link #MAX_OPTION_LEN} chars.
     *
     * @param opts          raw options array (may be {@code null})
     * @param manifest      manifest path for warn logging
     * @param kind          field type name used in the warn message (e.g. {@code "dropdown"})
     * @param minLen        minimum array length (inclusive)
     * @param maxLen        maximum array length (inclusive); use {@link Integer#MAX_VALUE} for unbounded
     * @param requireUnique reject duplicate entries
     * @return canonical {@code JSONArray} of trimmed strings, or {@code null} on validation failure
     */
    private static JSONArray validateOptionsArray(JSONArray opts, Path manifest, String kind, int minLen, int maxLen, boolean requireUnique) {
        int len = opts == null ? 0 : opts.length();

        if (opts == null || len < minLen || len > maxLen) {
            String range;
            if (minLen == maxLen) {
                range = "exactly " + minLen;
            } else if (maxLen == Integer.MAX_VALUE) {
                range = "at least " + minLen;
            } else {
                range = minLen + ".." + maxLen;
            }
            warnSkip(manifest, "settingsModal (" + kind + " needs " + range + " options)");
            return null;
        }

        JSONArray optsOut = new JSONArray();
        Set<String> seen = requireUnique ? new HashSet<>() : null;

        for (int j = 0; j < len; j++) {
            String o = opts.optString(j, "").trim();

            if (o.isEmpty() || o.length() > MAX_OPTION_LEN) {
                warnSkip(manifest, "settingsModal (bad " + kind + " option)");
                return null;
            }

            if (seen != null && !seen.add(o)) {
                warnSkip(manifest, "settingsModal (" + kind + " options must be unique)");
                return null;
            }

            optsOut.put(o);
        }

        return optsOut;
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
            warnSkip(manifest, "wsEvent (invalid script)");
            return null;
        }

        JSONObject out = new JSONObject();
        out.put("script", script);

        if (raw.has("argsString") && !raw.isNull("argsString")) {
            String as = raw.optString("argsString", "");

            if (as.length() > MAX_WSEVENT_ARGS_STRING_LEN) {
                warnSkip(manifest, "wsEvent (argsString too long)");
                return null;
            }

            out.put("argsString", as);
        }

        JSONArray argsIn = raw.optJSONArray("args");

        if (argsIn != null) {
            if (argsIn.length() > MAX_WSEVENT_ARGS_COUNT) {
                warnSkip(manifest, "wsEvent (too many args)");
                return null;
            }

            JSONArray argsOut = new JSONArray();

            for (int i = 0; i < argsIn.length(); i++) {
                if (!argsIn.isNull(i) && !(argsIn.get(i) instanceof String)) {
                    warnSkip(manifest, "wsEvent (args must be strings)");
                    return null;
                }

                String a = argsIn.optString(i, "");

                if (a.length() > MAX_WSEVENT_ARG_ITEM_LEN) {
                    warnSkip(manifest, "wsEvent (arg too long)");
                    return null;
                }

                argsOut.put(a);
            }

            out.put("args", argsOut);
        }

        return out;
    }

    /**
     * Logs that an entry was skipped, naming the manifest and reason. Use for hard-fail
     * validation (entry is dropped from the merged response).
     */
    private static void warnSkip(Path manifest, String reason) {
        com.gmt2001.Console.warn.println("Custom panel manifest skipped " + reason + ": " + manifest);
    }

    /**
     * Logs an informational note about a manifest entry that survived validation, typically
     * when an unsupported value was normalized to a default rather than dropped.
     */
    private static void warnNote(Path manifest, String detail) {
        com.gmt2001.Console.warn.println("Custom panel manifest: " + detail + ": " + manifest);
    }

    /**
     * INIDB table / key names: alphanumeric plus underscore, typical PhantomBot naming.
     */
    private static boolean isSafeDbIdentifier(String s) {
        return isSafeIdentifier(s, MAX_DB_IDENTIFIER_LEN, false);
    }

    /**
     * Bot console reload command after saving modal settings (e.g. {@code reloadadventure}).
     */
    private static boolean isSafeReloadCommand(String s) {
        return isSafeIdentifier(s, MAX_RELOAD_CMD_LEN, false);
    }

    /**
     * Shared validator for short identifier-shaped strings: 1..{@code maxLen} chars, ASCII
     * letters/digits/underscore, optionally hyphen. Used by INIDB identifiers, reload commands,
     * and card / field ids.
     *
     * @param s            input to validate
     * @param maxLen       inclusive maximum length
     * @param allowHyphen  whether {@code -} is permitted
     * @return {@code true} if {@code s} is non-empty, within length, and matches the charset
     */
    private static boolean isSafeIdentifier(String s, int maxLen, boolean allowHyphen) {
        if (s.isEmpty() || s.length() > maxLen) {
            return false;
        }

        for (int i = 0; i < s.length(); i++) {
            char c = s.charAt(i);
            boolean ok = (c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z') || (c >= '0' && c <= '9') || c == '_'
                    || (allowHyphen && c == '-');

            if (!ok) {
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
        return isSafeIdentifier(id, MAX_CARD_ID_LEN, true);
    }

    /**
     * Script paths are passed verbatim to the {@code module enable/disable} command and to
     * {@code socket.wsEvent} as the target script. PhantomBot's {@code module} command works
     * against {@code ./<dir>/<file>.js}-shape paths under {@code scripts/}, so the manifest
     * must declare the same shape: a {@code ./} prefix, at least one subdirectory segment, and
     * a {@code .js} suffix. Bare filenames ({@code "foo.js"}, {@code "./foo.js"}) and absolute
     * or otherwise-malformed paths are rejected outright; the parent caller then logs and
     * skips the offending entry rather than letting an invalid path silently no-op at toggle
     * time.
     *
     * <p>Additional negatives (defense-in-depth alongside the shape rule):</p>
     * <ul>
     *   <li>{@code ..} anywhere (path traversal)</li>
     *   <li>{@code \\} (Windows-style separators)</li>
     *   <li>{@code \n} / {@code \r} (line splitting in the bot console)</li>
     *   <li>oversized strings (&gt; 256 chars)</li>
     *   <li>empty path segments around the inner {@code /} ({@code ./.foo}, {@code ./foo/.js})</li>
     * </ul>
     *
     * <p>The {@link #SAFE_SCRIPT_PATH_MIN_LEN} constant of 8 corresponds to the shortest legal
     * shape: {@code ./a/b.js}. The upper bound is {@link #MAX_SCRIPT_PATH_LEN} chars.</p>
     *
     * @param scriptPath manifest-supplied bot-script path (e.g. {@code ./games/myGame.js})
     * @return {@code true} if the script path is safe to forward to the {@code module} command
     */
    private static boolean isSafeScriptPath(String scriptPath) {
        int len = scriptPath.length();

        if (len < SAFE_SCRIPT_PATH_MIN_LEN || len > MAX_SCRIPT_PATH_LEN) {
            return false;
        }

        if (!scriptPath.startsWith("./") || !scriptPath.endsWith(".js")) {
            return false;
        }

        if (scriptPath.contains("\\") || scriptPath.contains("..") || scriptPath.contains("\n") || scriptPath.contains("\r")) {
            return false;
        }

        // Require at least one additional path separator AFTER the "./" prefix so the script
        // lives in a subdirectory (matches PB's `scripts/<dir>/<file>.js` convention). The
        // separator must be strictly between the prefix and the ".js" suffix, with at least one
        // non-separator character on each side — rejects "././foo.js" (separator at index 2)
        // and "./foo/.js" (separator immediately before ".js").
        int separator = scriptPath.indexOf('/', 2);
        return separator > 2 && separator < len - 3;
    }
}
