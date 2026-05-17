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

/* global $ */

/**
 * Custom-panel **sidebar nav**. Subscribes to the {@code pbCustomManifestsLoaded} event
 * dispatched by {@code customPanelManifestLoader.js} and renders one
 * {@code <li><a href="#&lt;hash&gt;">…</a></li>} per manifest {@code nav} entry into the
 * matching submenu mount in {@code index.html}. Inserts a one-time {@code Custom} divider at
 * the top of each section the first time it gains a manifest item, so users can tell stock
 * vs community at a glance.
 *
 * <p>Knows nothing about cards or modals — those live in their own files. Reads only from
 * {@code window.__pbCustomPanel__.ensureStylesInjected} (for the divider style block).</p>
 *
 * @author mcawful
 */
(function () {
    // Namespace + EVENTS are owned by customPanelManifestLoader.js, which runs first per
    // the script-tag order in index.html. The `||` fallback is a load-order safety net only.
    const ns = window.__pbCustomPanel__ = window.__pbCustomPanel__ || {};

    const SECTION_MOUNTS = {
        'extra': '#pb-panel-extra-menu',
        'alerts': '#pb-panel-alerts-menu',
        'giveaways': '#pb-panel-giveaways-menu',
        'audio': '#pb-panel-audio-menu'
    };

    const DEFAULT_NAV_SECTION = 'extra';

    const navDividerInserted = {};

    /**
     * Appends a one-time divider to the given sidebar section so users can tell at a glance
     * which submenu items came from manifests. Only fires when at least one custom item is
     * about to be added to that section, and only inserts the divider on the first call per
     * section.
     *
     * @param {jQuery} $mount the {@code <ul>} submenu mount for the section
     * @param {string} section normalized section key (e.g. {@code "extra"}, {@code "alerts"})
     */
    function ensureNavDivider($mount, section) {
        if (navDividerInserted[section]) {
            return;
        }
        navDividerInserted[section] = true;
        if (typeof ns.ensureStylesInjected === 'function') {
            ns.ensureStylesInjected();
        }
        $mount.append($('<li/>', {
            'class': 'pb-custom-nav-divider',
            role: 'separator',
            'aria-hidden': 'true'
        }).text('Custom'));
    }

    /**
     * Renders one canonical nav entry as an {@code <li><a>} and appends it to its target
     * submenu, inserting the one-time {@code Custom} divider above it if this is the first
     * manifest item in that section. Silently skips entries that are missing required fields
     * or that target an unknown section mount.
     *
     * @param {object} entry canonical nav entry from the merged manifest
     */
    function appendNavItem(entry) {
        const href = entry.hash;
        const folder = entry.folder;
        const page = entry.page;
        const label = entry.label;
        const section = (entry.section || DEFAULT_NAV_SECTION).toString().toLowerCase();

        if (!href || !folder || !page || !label) {
            return;
        }

        const mount = SECTION_MOUNTS[section] || SECTION_MOUNTS[DEFAULT_NAV_SECTION];
        const $mount = $(mount);

        if ($mount.length === 0) {
            return;
        }

        ensureNavDivider($mount, section);

        const $a = $('<a/>', {
            href: href,
            'data-folder': folder
        });
        $a.append($('<i/>', {'class': 'fa fa-circle-o'}));
        $a.append(document.createTextNode(' '));
        $a.append($('<span/>').text(label));
        $mount.append($('<li/>').append($a));
    }

    document.addEventListener(ns.EVENTS.MANIFESTS_LOADED, function (e) {
        const detail = e && e.detail;
        const navList = detail && Array.isArray(detail.nav) ? detail.nav : [];
        navList.forEach(function (entry) {
            if (entry) {
                appendNavItem(entry);
            }
        });
    });
}());
