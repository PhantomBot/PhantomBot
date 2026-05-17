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
 * Hot-loads newly-dropped modules under {@code scripts/custom/} and lang files
 * under {@code scripts/lang/custom/}. Exposes {@code !reloadcustom}
 * (caster perm) for chat use; the panel's {@code customPanelManifestLoader.js}
 * fires {@code !reloadcustom silent} after every manifest fetch so a browser
 * refresh is enough to pick up new modules.
 *
 * <p>{@code init.js} only fires {@code initReady} once at boot, but most
 * modules register chat commands inside that hook. After the scan we diff
 * {@code $.bot.modules} and selectively re-invoke {@code initReady} handlers
 * for the newly-loaded scripts so their commands actually register.</p>
 *
 * @author mcawful
 */
(function () {
    function normalizeScriptName(name) {
        return ('' + name).replace(/^\.\//, '');
    }

    function snapshotLoadedModules() {
        const out = [];
        if ($.bot && $.bot.modules) {
            for (let name in $.bot.modules) {
                if ($.bot.modules.hasOwnProperty(name)) {
                    out.push(name);
                }
            }
        }
        return out;
    }

    function diffLoadedModules(after, before) {
        const seen = {};
        for (let i = 0; i < before.length; i++) {
            seen[before[i]] = true;
        }
        const fresh = [];
        for (let j = 0; j < after.length; j++) {
            if (!seen[after[j]]) {
                fresh.push(after[j]);
            }
        }
        return fresh;
    }

    function fireInitReadyOn(newModuleNames) {
        if (!newModuleNames || newModuleNames.length === 0) {
            return 0;
        }

        const hookContainer = $.bot && $.bot.hooks ? $.bot.hooks.initReady : null;
        if (!hookContainer || !hookContainer.handlers) {
            return 0;
        }

        // $.bot.modules keys keep the leading "./", Hook.scriptName strips it.
        const nameSet = {};
        for (let i = 0; i < newModuleNames.length; i++) {
            nameSet[normalizeScriptName(newModuleNames[i])] = true;
        }

        let fired = 0;
        for (let j = 0; j < hookContainer.handlers.length; j++) {
            const handler = hookContainer.handlers[j];
            if (handler && nameSet[normalizeScriptName(handler.scriptName)]) {
                try {
                    handler.handler(null);
                    fired++;
                } catch (ex) {
                    $.log.error('reloadcustom: initReady handler for ' + handler.scriptName + ' threw: ' + ex);
                }
            }
        }
        return fired;
    }

    /**
     * @param {boolean} silentLog suppress the per-file bot-console load line
     * @returns {{loaded: number, initReadyFired: number}}
     */
    function reloadCustom(silentLog) {
        const beforeModules = snapshotLoadedModules();

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

        const afterModules = snapshotLoadedModules();
        const newModules = diffLoadedModules(afterModules, beforeModules);
        const fired = fireInitReadyOn(newModules);

        return {
            loaded: newModules.length,
            initReadyFired: fired
        };
    }

    /**
     * @event command
     */
    $.bind('command', function (event) {
        if (!$.equalsIgnoreCase(event.getCommand(), 'reloadcustom')) {
            return;
        }

        const args = event.getArgs();
        const silent = args && args.length > 0 && $.equalsIgnoreCase(args[0], 'silent');

        const result = reloadCustom(silent);

        if (!silent) {
            $.say($.whisperPrefix(event.getSender())
                    + 'Custom scripts re-scanned: ' + result.loaded
                    + ' new module(s), ' + result.initReadyFired
                    + ' initReady handler(s) fired. See bot console for details.');
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
