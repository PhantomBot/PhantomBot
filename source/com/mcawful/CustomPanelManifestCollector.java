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
     * {@code settingsPage}). Entries are dropped (with a warn-log) when:
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
            cardsOut.put(out);
        }
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
