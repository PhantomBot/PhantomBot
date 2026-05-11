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

/**
 * customScripts.js
 *
 * Lets the bot pick up newly-dropped community modules under
 * {@code scripts/custom/} (and lang strings under {@code scripts/lang/custom/})
 * without restarting. Idempotent: existing modules skip in O(1) via init.js's
 * {@code isModuleLoaded} guard, so the only real work happens for genuinely new
 * files.
 *
 * <p>Two ways to invoke:</p>
 * <ul>
 *   <li><b>Chat:</b> {@code !reloadcustom} (caster permission). Whispers a short
 *       confirmation back to the caller.</li>
 *   <li><b>Panel:</b> {@code !reloadcustom silent}. Same scan, no chat
 *       acknowledgement. The fork's {@code customPanelManifestLoader.js}
 *       fires this automatically after every manifest fetch so a browser
 *       refresh closes the loop on "drop module + reload panel."</li>
 * </ul>
 *
 * <p>Newly-loaded modules are seeded as {@code modules.<scriptPath> = true} in
 * INIDB by {@code init.js}'s {@code loadScript}, matching boot-time behaviour.
 * The bot console logs every fresh load (the {@code silent} arg only suppresses
 * the chat reply, not the per-script console line).</p>
 *
 * @author mcawful
 */
(function () {
    /**
     * Re-scan {@code scripts/custom/} for any {@code .js} files Rhino doesn't
     * already know about, and re-load lang files (covers
     * {@code scripts/lang/custom/} *.js helpers and *.json string files via
     * {@code $.lang.load}).
     *
     * <p>Defensive against missing APIs so this script can no-op safely if the
     * surrounding init bundle is ever rearranged. Errors are logged but
     * swallowed — a single broken module shouldn't take down the whole scan.</p>
     *
     * @param {boolean} silentLog when true, suppresses the per-file
     *        {@code Loaded module: ...} bot console line for the freshly-loaded
     *        scripts (chat reply suppression is handled separately by the
     *        command handler)
     */
    function reloadCustom(silentLog) {
        try {
            if (typeof $.bot !== 'undefined' && typeof $.bot.loadScriptRecursive === 'function') {
                $.bot.loadScriptRecursive('./custom', !!silentLog, false);
            }
        } catch (ex) {
            $.log.error('reloadcustom: scripts/custom scan failed: ' + ex);
        }

        try {
            if (typeof $.lang !== 'undefined' && typeof $.lang.load === 'function') {
                $.lang.load(false);
            }
        } catch (ex) {
            $.log.error('reloadcustom: lang reload failed: ' + ex);
        }
    }

    /**
     * @event command
     */
    $.bind('command', function (event) {
        if (!$.equalsIgnoreCase(event.getCommand(), 'reloadcustom')) {
            return;
        }

        var args = event.getArgs();
        var silent = args && args.length > 0 && $.equalsIgnoreCase(args[0], 'silent');

        reloadCustom(silent);

        if (!silent) {
            $.say($.whisperPrefix(event.getSender()) + 'Custom scripts and lang files re-scanned. See bot console for any newly-loaded modules.');
        }
    });

    /**
     * @event initReady
     */
    $.bind('initReady', function () {
        $.registerChatCommand('./core/customScripts.js', 'reloadcustom', 1);
    });

    /**
     * @export $
     */
    $.reloadCustom = reloadCustom;
})();
