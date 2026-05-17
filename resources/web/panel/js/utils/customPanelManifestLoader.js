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

/* global helpers, $ */

/**
 * Custom-panel **loader / namespace owner**. Fetches the merged
 * {@code /panel/custom-manifests.json} produced by
 * {@code com.mcawful.CustomPanelManifestCollector}, indexes the {@code cards} array, and
 * dispatches a {@code pbCustomManifestsLoaded} {@code CustomEvent} on {@code document} that
 * the sibling files (nav, cards, modals) consume.
 *
 * <p>Owns the {@code window.__pbCustomPanel__} namespace — every other file in the
 * {@code customPanel*} family reads constants, shared state, and shared helpers from there
 * (and modal files register their opener via {@code ns.openSettingsModal} /
 * {@code ns.openDetailsModal}). Defensive {@code ||} initialization means script load order
 * is forgiving, but the canonical order in {@code index.html} is loader → modals → nav →
 * cards so this file's defaults always win.</p>
 *
 * <p>Public API: {@code window.initCustomPanelNav()} — call once after panel websocket auth
 * completes (from {@code js/index.js}). Idempotent; repeat calls after the first are ignored.</p>
 *
 * @author mcawful
 */
(function () {
    const ns = window.__pbCustomPanel__ = window.__pbCustomPanel__ || {};

    ns.loaded = ns.loaded || false;
    ns.cardsBySection = ns.cardsBySection || {};
    ns.cardsById = ns.cardsById || {};
    ns.EVENTS = ns.EVENTS || {
        MANIFESTS_LOADED: 'pbCustomManifestsLoaded',
        CARD_SETTINGS_SAVED: 'pbCustomCardSettingsSaved'
    };
    ns.PANEL_SETTINGS_SAVED_WS_ARG = ns.PANEL_SETTINGS_SAVED_WS_ARG || 'panel-settings-saved';
    ns.LOAD_TIMEOUT_MS = ns.LOAD_TIMEOUT_MS || 8000;
    ns.MANIFEST_FETCH_TIMEOUT_MS = ns.MANIFEST_FETCH_TIMEOUT_MS || 15000;
    ns.TEXTAREA_DEFAULT_MAX_LEN = ns.TEXTAREA_DEFAULT_MAX_LEN || 480;
    ns.DEFAULT_PERMISSION_GROUP_ID = ns.DEFAULT_PERMISSION_GROUP_ID != null ? ns.DEFAULT_PERMISSION_GROUP_ID : 7;

    let stylesInjected = false;
    let ran = false;

    /**
     * Defines whether {@code settingsModal} is "actionable" — i.e. has a title and at least
     * one declarative field (flat or accordion).
     *
     * @param {object} sm settingsModal block from a canonical card entry
     * @returns {boolean}
     */
    function settingsModalHasContent(sm) {
        if (!sm || typeof sm !== 'object') {
            return false;
        }
        const hasFlat = Array.isArray(sm.fields) && sm.fields.length > 0;
        const hasSec = Array.isArray(sm.sections) && sm.sections.length > 0;
        return !!sm.title && (hasFlat || hasSec);
    }
    ns.settingsModalHasContent = settingsModalHasContent;

    /**
     * @param {object} card canonical card entry
     * @returns {boolean} whether the card has a usable {@code settingsModal}
     */
    ns.cardHasSettings = function (card) {
        if (!card) {
            return false;
        }
        return settingsModalHasContent(card.settingsModal);
    };

    /**
     * @param {object} card canonical card entry
     * @returns {boolean} whether the card declares read-only {@code detailsModal} content
     */
    ns.cardHasDetailsModal = function (card) {
        const dm = card && card.detailsModal;
        return !!(dm && typeof dm.content === 'string' && dm.content.trim().length > 0);
    };

    /**
     * Injects a single small {@code <style>} block once, the first time any custom UI is
     * rendered. If {@code #pb-custom-panel-styles} already exists (e.g. hot navigation),
     * marks injection complete without duplicating the block. Keeps stock CSS files
     * unmodified; nothing is added to the DOM if no manifests load. Used by the nav file
     * (sidebar dividers) and the cards file (cards-row dividers).
     */
    ns.ensureStylesInjected = function () {
        if (stylesInjected) {
            return;
        }
        if (document.getElementById('pb-custom-panel-styles')) {
            stylesInjected = true;
            return;
        }
        stylesInjected = true;
        const style = document.createElement('style');
        style.id = 'pb-custom-panel-styles';
        style.textContent = [
            '.pb-custom-nav-divider {',
            '    list-style: none;',
            '    margin: 6px 10px 2px 10px;',
            '    padding: 4px 4px 2px 4px;',
            '    border-top: 1px solid rgba(255,255,255,0.08);',
            '    color: #8aa4b1;',
            '    font-size: 10px;',
            '    font-weight: 600;',
            '    text-transform: uppercase;',
            '    letter-spacing: 1px;',
            '    pointer-events: none;',
            '    user-select: none;',
            '}',
            '.pb-custom-cards-divider {',
            '    margin: 16px 0 6px 0;',
            '    padding: 8px 0 4px 0;',
            '    border-top: 1px solid rgba(0,0,0,0.08);',
            '    color: #6c757d;',
            '    font-size: 13px;',
            '    font-weight: 600;',
            '    text-transform: uppercase;',
            '    letter-spacing: 1px;',
            '}',
            '.pb-custom-cards-divider .fa {',
            '    margin-right: 6px;',
            '}',
            '.pb-custom-card-tool-btn {',
            '    margin-bottom: 7px;',
            '}',
            '/* Equal-height community cards: BS3 float rows stagger when card bodies differ in height. */',
            '.pb-custom-cards-mount.row {',
            '    display: flex;',
            '    flex-wrap: wrap;',
            '    align-items: stretch;',
            '}',
            '.pb-custom-cards-mount.row:before,',
            '.pb-custom-cards-mount.row:after {',
            '    display: none;',
            '}',
            '.pb-custom-cards-mount > .col-md-12 {',
            '    flex: 0 0 100%;',
            '    max-width: 100%;',
            '}',
            '@media (min-width: 992px) {',
            '    .pb-custom-cards-mount > .col-md-4 {',
            '        display: flex;',
            '        flex-direction: column;',
            '    }',
            '    .pb-custom-cards-mount > .col-md-4 > .box,',
            '    .pb-custom-cards-mount > .col-md-4 > .box > form {',
            '        flex: 1 1 auto;',
            '        display: flex;',
            '        flex-direction: column;',
            '        min-height: 0;',
            '    }',
            '    .pb-custom-cards-mount > .col-md-4 > .box {',
            '        width: 100%;',
            '    }',
            '    .pb-custom-cards-mount > .col-md-4 .box-body {',
            '        flex: 1 1 auto;',
            '    }',
            '}',
            '.pb-custom-checkbox-group {',
            '    margin-bottom: 14px;',
            '}',
            '.pb-custom-checkbox-group-label {',
            '    display: block;',
            '    margin-bottom: 6px;',
            '    font-weight: 600;',
            '}',
            '.pb-custom-checkbox-group-help {',
            '    margin-bottom: 6px;',
            '    font-size: 0.9em;',
            '    opacity: 0.75;',
            '}',
            '.pb-custom-checkbox-group-items {',
            '    display: flex;',
            '    flex-wrap: wrap;',
            '    column-gap: 24px;',
            '    row-gap: 4px;',
            '    align-items: center;',
            '}',
            '.pb-custom-checkbox-group-items > .pretty {',
            '    margin-right: 0;',
            '}'
        ].join('\n');
        document.head.appendChild(style);
    };

    /**
     * Populates {@code ns.cardsById} and {@code ns.cardsBySection} from a canonical card array.
     * Cards missing required fields are dropped silently — the backend already warn-logs them
     * via {@code com.mcawful.CustomPanelManifestCollector}.
     *
     * @param {Array<object>} cards canonical card entries from the merged manifest response
     */
    function indexCards(cards) {
        ns.cardsBySection = {};
        ns.cardsById = {};
        if (!Array.isArray(cards)) {
            return;
        }
        cards.forEach(function (card) {
            if (!card || !card.section || !card.id || !card.title) {
                return;
            }
            ns.cardsById[card.id] = card;
            const section = String(card.section).toLowerCase();
            if (!ns.cardsBySection[section]) {
                ns.cardsBySection[section] = [];
            }
            ns.cardsBySection[section].push(card);
        });
    }

    /**
     * Public entry point invoked once from {@code js/index.js} after the panel websocket
     * finishes authenticating. Fetches the merged manifest JSON, indexes {@code cards}, and
     * dispatches {@code pbCustomManifestsLoaded} on {@code document} so sibling files (nav,
     * cards) can react. Repeat calls after the first are ignored, so it is safe to call from
     * any post-login hook.
     */
    window.initCustomPanelNav = function () {
        if (ran) {
            return;
        }
        ran = true;

        $.ajax({
            url: 'custom-manifests.json',
            type: 'GET',
            dataType: 'json',
            cache: false,
            timeout: ns.MANIFEST_FETCH_TIMEOUT_MS,
            success: function (data) {
                if (!data) {
                    return;
                }

                const navList = Array.isArray(data.nav) ? data.nav : [];
                const cardList = Array.isArray(data.cards) ? data.cards : [];

                indexCards(cardList);
                ns.loaded = true;

                if (typeof document !== 'undefined' && typeof CustomEvent === 'function') {
                    document.dispatchEvent(new CustomEvent(ns.EVENTS.MANIFESTS_LOADED, {
                        bubbles: true,
                        detail: {nav: navList, cards: cardList}
                    }));
                }

                // Ask the bot to scan scripts/custom for any newly-dropped modules
                // so the panel UI we just rendered isn't pointing at scriptPaths
                // Rhino doesn't know about yet. Idempotent + silent on the bot
                // side; the per-file load log still lands in the bot console.
                // No callback wiring needed: the panel doesn't display anything
                // about the scan and the operator can verify via console.
                if (typeof socket !== 'undefined' && socket && typeof socket.sendCommand === 'function') {
                    socket.sendCommand('pb_custom_panel_scan', 'reloadcustom silent', function () {});
                }
            },
            error: function (xhr, status, err) {
                helpers.log('Custom panel manifest not loaded (' + status + '): ' + (err || ''), helpers.LOG_TYPE.DEBUG);
            }
        });
    };
}());
