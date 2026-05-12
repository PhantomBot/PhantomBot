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

/* global socket, toastr, $ */

/**
 * Custom-panel **cards renderer**. Renders manifest-supplied cards into a per-page mount
 * point ({@code window.injectCustomCards(section, mountSelector)}), wires their module
 * toggle, settings cog, and info button. Modal opens are dispatched via the shared
 * {@code window.__pbCustomPanel__} namespace ({@code openSettingsModal} /
 * {@code openDetailsModal}); the cards file itself never reaches into modal internals.
 *
 * <p>Mount-selector validation: stock pages call this with their own static selector
 * (e.g. {@code games.html} hardcodes {@code "#pb-panel-games-custom-cards"}), but the
 * function is on {@code window} so external pages could pass arbitrary input. We allow only
 * the canonical {@code #pb-panel-<id>-custom-cards} shape and silently drop anything else
 * to keep card injection from being abused as a generic DOM-replace primitive.</p>
 *
 * @author mcawful
 */
(function () {
    // Namespace + card indexes are owned by customPanelManifestLoader.js, which runs first
    // per the script-tag order in index.html. The `||` fallback is a load-order safety net
    // only; nothing else here re-initializes shared state.
    var ns = window.__pbCustomPanel__ = window.__pbCustomPanel__ || {};

    var SAFE_MOUNT_SELECTOR = /^#pb-panel-[a-z0-9-]+-custom-cards$/;

    /**
     * DOM id helper for a card's child elements (matches {@link #buildCardElement} output).
     * Centralizing this keeps the toggle/settings/details lookups in lockstep with the
     * builder when the id shape ever changes.
     *
     * @param {string} cardId canonical card id from the manifest
     * @param {string} suffix one of {@code "toggle"}, {@code "settings"}, {@code "details"}
     * @returns {string}
     */
    function cardChildId(cardId, suffix) {
        return 'pb-custom-card-' + cardId + '-' + suffix;
    }

    /**
     * Whitelisted mount-selector validation — must be exactly the canonical hash-id shape
     * used by stock pages. Anything else returns false and the cards skip rendering.
     *
     * @param {string} sel mountSelector argument passed to {@code injectCustomCards}
     * @returns {boolean}
     */
    function isSafeMountSelector(sel) {
        return typeof sel === 'string' && SAFE_MOUNT_SELECTOR.test(sel);
    }

    /**
     * Pulls a single {@code modules} table value out of a {@code getDBValues storeKey: true}
     * result. Tolerates the shape variants we've seen across stock callers (flat
     * {@code {key: value}}, nested {@code {value: ...}}, list-style {@code {0:..., 1:...}}).
     *
     * @param {object} results getDBValues result object
     * @param {string} scriptPath manifest scriptPath used as the lookup key
     * @returns {*} stored value, or undefined when no matching key is present
     */
    function lookupModulesTableValue(results, scriptPath) {
        if (!results) {
            return undefined;
        }
        if (Object.prototype.hasOwnProperty.call(results, scriptPath)) {
            return results[scriptPath];
        }
        var keys = Object.keys(results);
        for (var i = 0; i < keys.length; i++) {
            var entry = results[keys[i]];
            if (entry && typeof entry === 'object' && entry.table === 'modules' && entry.key === scriptPath) {
                return entry.value;
            }
        }
        return undefined;
    }

    /**
     * Decides whether a stored {@code modules} value means "enabled". The stock convention
     * is {@code "true"}/{@code "false"} strings but we accept booleans, {@code 1}/{@code 0},
     * and {@code "enabled"}/{@code "disabled"} just in case a custom module wrote one of
     * those instead.
     *
     * @param {*} raw value from {@code lookupModulesTableValue}
     * @returns {boolean}
     */
    function modulesDbValueIsEnabled(raw) {
        if (raw === true || raw === 1 || raw === '1') {
            return true;
        }
        if (typeof raw === 'string') {
            var s = raw.trim().toLowerCase();
            return s === 'true' || s === 'enabled' || s === 'on';
        }
        return false;
    }

    /**
     * Builds a single Bootstrap card ({@code col-md-4} wrapping a {@code box box-solid}) from
     * a canonical card entry. Optional {@code detailsModal} adds an info ({@code fa-info-circle})
     * button that opens a read-only dialog. Settings cog matches stock Games cards: modal
     * ({@code settingsModal}), legacy full-page ({@code settingsFolder}/{@code settingsPage}),
     * or disabled with tooltip when there are no settings.
     *
     * @param {object} card canonical manifest card
     * @returns {jQuery}
     */
    function buildCardElement(card) {
        var toggleId = cardChildId(card.id, 'toggle');
        var settingsBtnId = cardChildId(card.id, 'settings');
        var detailsBtnId = cardChildId(card.id, 'details');
        var hasSettings = ns.cardHasSettings(card);
        var useModal = ns.settingsModalHasContent(card.settingsModal);
        var hasDetails = ns.cardHasDetailsModal(card);

        var $col = $('<div/>', {'class': 'col-md-4'});
        var $box = $('<div/>', {'class': 'box box-solid', 'id': 'pb-custom-card-' + card.id});
        var $header = $('<div/>', {'class': 'box-header with-border'});
        var $tools = $('<div/>', {'class': 'box-tools pull-right'});

        if (card.scriptPath) {
            var $label = $('<label/>', {'class': 'switch', 'data-toggle': 'tooltip', 'title': 'Module toggle.'});
            var $input = $('<input/>', {
                type: 'checkbox',
                id: toggleId,
                'data-pb-custom-card-toggle': card.scriptPath,
                'data-pb-custom-card-id': card.id
            });
            $input.prop('checked', true);
            $label.append($input);
            $label.append($('<span/>', {'class': 'slider round'}));
            $tools.append($label);
        }

        if (hasDetails) {
            $tools.append($('<button/>', {
                type: 'button',
                id: detailsBtnId,
                'class': 'btn btn-md btn-box-tool pb-custom-card-open-details',
                style: 'margin-bottom: 7px;',
                'data-toggle': 'tooltip',
                title: 'More information',
                'data-pb-custom-card-id': card.id
            }).append($('<i/>', {'class': 'fa fa-info-circle fa-lg'})));
        }

        if (hasSettings) {
            var $btn = $('<button/>', {
                type: 'button',
                id: settingsBtnId,
                'class': 'btn btn-md btn-box-tool',
                style: 'margin-bottom: 7px;',
                'data-pb-custom-card-id': card.id
            });
            if (useModal) {
                $btn.attr('data-pb-custom-card-settings-mode', 'modal');
            } else {
                var hash = '#' + card.settingsPage;
                $btn.attr('data-pb-custom-card-settings-mode', 'page');
                $btn.attr('data-pb-custom-card-settings-folder', card.settingsFolder);
                $btn.attr('data-pb-custom-card-settings-page', card.settingsPage);
                $btn.attr('data-pb-custom-card-settings-hash', hash);
            }
            $btn.append($('<i/>', {'class': 'fa fa-cog fa-lg'}));
            $tools.append($btn);
        } else {
            $tools.append($('<button/>', {
                type: 'button',
                id: settingsBtnId,
                'class': 'btn btn-md btn-box-tool disabled pb-custom-no-settings',
                'data-toggle': 'tooltip',
                title: 'This module doesn\'t have any settings.',
                style: 'margin-bottom: 7px;'
            }).append($('<i/>', {'class': 'fa fa-cog fa-lg disabled'})));
        }

        $header.append($tools);
        $header.append($('<h3/>', {'class': 'box-title'}).text(card.title));

        var $body = $('<div/>', {'class': 'box-body'});
        $body.append($('<p/>', {'class': 'auto-cut'}).text(card.description || ''));

        var $form = $('<form/>', {'role': 'form'});
        $form.append($body);

        $box.append($header);
        $box.append($form);
        $col.append($box);
        return $col;
    }

    /**
     * Binds a {@code change} handler to every card module-toggle inside {@code $mount} that
     * issues {@code module enablesilent|disablesilent <scriptPath>} over the panel websocket
     * and surfaces a toast confirmation on success. No-op if {@code socket} is unavailable.
     *
     * @param {jQuery} $mount container holding the freshly injected card elements
     */
    function wireCardToggles($mount) {
        $mount.find('[data-pb-custom-card-toggle]').on('change', function () {
            var $input = $(this);
            var scriptPath = $input.data('pb-custom-card-toggle');
            var checked = $input.is(':checked');
            var cardId = $input.data('pb-custom-card-id');

            if (typeof socket === 'undefined' || !socket || !socket.sendCommandSync) {
                return;
            }

            socket.sendCommandSync('pb_custom_card_toggle', 'module ' + (checked ? 'enablesilent' : 'disablesilent') + ' ' + scriptPath, function () {
                if (typeof toastr !== 'undefined') {
                    toastr.success('Successfully ' + (checked ? 'enabled' : 'disabled') + ' the module!');
                }
                if (cardId && ns.cardsById[cardId] && ns.cardHasSettings(ns.cardsById[cardId])) {
                    $mount.find('#' + cardChildId(cardId, 'settings')).prop('disabled', !checked);
                }
            });
        });
    }

    /**
     * Binds the settings cog with a single delegated click handler that branches on the
     * card's {@code data-pb-custom-card-settings-mode} attribute. {@code "page"} =>
     * {@link $.loadPage} (legacy {@code settingsFolder}/{@code settingsPage} flow);
     * {@code "modal"} => {@code ns.openSettingsModal(card)} from
     * {@code customPanelSettingsModal.js}.
     *
     * @param {jQuery} $mount container holding the freshly injected card elements
     */
    function wireCardSettings($mount) {
        $mount.find('[data-pb-custom-card-settings-mode]').on('click', function (e) {
            e.preventDefault();
            var $btn = $(this);
            var mode = $btn.data('pb-custom-card-settings-mode');

            if (mode === 'page') {
                var folder = $btn.data('pb-custom-card-settings-folder');
                var page = $btn.data('pb-custom-card-settings-page');
                var hash = $btn.data('pb-custom-card-settings-hash');

                if (folder && page && typeof $.loadPage === 'function') {
                    $.loadPage(folder, page, hash);
                }
                return;
            }

            if (mode === 'modal') {
                var id = $btn.data('pb-custom-card-id');
                var card = ns.cardsById[id];

                if (card && card.settingsModal && typeof ns.openSettingsModal === 'function') {
                    ns.openSettingsModal(card);
                }
            }
        });
    }

    /**
     * Binds the optional info ({@code fa-info-circle}) control to {@code ns.openDetailsModal}
     * registered by {@code customPanelDetailsModal.js}.
     *
     * @param {jQuery} $mount container holding the freshly injected card elements
     */
    function wireCardDetails($mount) {
        $mount.find('.pb-custom-card-open-details').on('click', function (e) {
            e.preventDefault();
            var id = $(this).data('pb-custom-card-id');
            var c = ns.cardsById[id];
            if (c && ns.cardHasDetailsModal(c) && typeof ns.openDetailsModal === 'function') {
                ns.openDetailsModal(c);
            }
        });
    }

    /**
     * Queries the bot DB for the current {@code modules} table state of every card that
     * declares a {@code scriptPath}, then syncs each toggle's checked state and the matching
     * settings button's {@code disabled} state. No-op if no cards declare {@code scriptPath}
     * or if {@code socket} is unavailable.
     *
     * @param {jQuery} $mount container holding the freshly injected card elements
     * @param {Array<object>} cards canonical card entries that were just rendered into {@code $mount}
     */
    function loadInitialCardStates($mount, cards) {
        var togglesNeeded = cards.filter(function (c) {
            return c.scriptPath;
        });

        if (togglesNeeded.length === 0) {
            return;
        }

        if (typeof socket === 'undefined' || !socket || !socket.getDBValues) {
            return;
        }

        var tables = [];
        var keys = [];
        togglesNeeded.forEach(function (c) {
            tables.push('modules');
            keys.push(c.scriptPath);
        });

        socket.getDBValues('pb_custom_cards_get_modules', {tables: tables, keys: keys}, true, function (results) {
            if (!results) {
                return;
            }
            togglesNeeded.forEach(function (card) {
                var enabled = lookupModulesTableValue(results, card.scriptPath);
                if (enabled === undefined || enabled === null) {
                    return;
                }
                var isEnabled = modulesDbValueIsEnabled(enabled);
                $mount.find('#' + cardChildId(card.id, 'toggle')).prop('checked', isEnabled);
                if (ns.cardHasSettings(card)) {
                    $mount.find('#' + cardChildId(card.id, 'settings')).prop('disabled', !isEnabled);
                }
            });
        });
    }

    /**
     * Public per-page entry point. Injects all manifest-supplied cards for the given section
     * into the element matching {@code mountSelector}, prefixed with a one-time
     * {@code Community modules} divider. Page fragments (e.g. {@code games.html}) call this
     * after their HTML is in the DOM. No-op when the mount selector is invalid or missing,
     * when the namespace isn't ready yet, or when there are no cards for that section.
     *
     * @param {string} section the canonical section key (e.g. {@code "games"})
     * @param {string} mountSelector the canonical {@code "#pb-panel-<id>-custom-cards"} selector
     */
    window.injectCustomCards = function (section, mountSelector) {
        if (!isSafeMountSelector(mountSelector)) {
            return;
        }
        var $mount = $(mountSelector);

        if ($mount.length === 0) {
            return;
        }

        var sectionKey = String(section || '').toLowerCase();
        var cards = ns.cardsBySection[sectionKey] || [];

        if (cards.length === 0) {
            return;
        }

        if (typeof ns.ensureStylesInjected === 'function') {
            ns.ensureStylesInjected();
        }

        $mount.empty();

        var $divider = $('<div/>', {'class': 'col-md-12'}).append(
            $('<h4/>', {'class': 'pb-custom-cards-divider'})
                .append($('<i/>', {'class': 'fa fa-puzzle-piece'}))
                .append(document.createTextNode('Community modules'))
        );
        $mount.append($divider);

        cards.forEach(function (card) {
            $mount.append(buildCardElement(card));
        });

        wireCardToggles($mount);
        wireCardSettings($mount);
        wireCardDetails($mount);
        loadInitialCardStates($mount, cards);
        if (typeof $.fn.tooltip === 'function') {
            $mount.find('[data-toggle="tooltip"]').tooltip({container: 'body'});
        }
    };
}());
