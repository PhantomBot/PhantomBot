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

/* global helpers, socket, toastr */

/**
 * Loads {@code /panel/custom-manifests.json} and:
 *  - Appends sidebar links from {@code nav} entries.
 *  - Caches {@code cards} entries on {@code window.__pbCustomManifests__} so single-page panels
 *    (e.g. Games) can render community-contributed cards on demand via
 *    {@code window.injectCustomCards(section, mountSelector)}.
 *
 * Page fragments still use {@code $.loadPage} with the same {@code pages/&lt;folder&gt;/&lt;page&gt;}
 * layout as stock (e.g. folder {@code custom/myaddon}).
 *
 * @author mcawful
 */
(function () {
    var ran = false;
    var cardsBySection = {};
    var navDividerInserted = {};
    var stylesInjected = false;

    var SECTION_MOUNTS = {
        'extra': '#pb-panel-extra-menu',
        'alerts': '#pb-panel-alerts-menu',
        'giveaways': '#pb-panel-giveaways-menu',
        'audio': '#pb-panel-audio-menu'
    };

    var DEFAULT_NAV_SECTION = 'extra';

    /**
     * Injects a single small <style> block once, the first time any custom UI is rendered.
     * Keeps panel CSS files unmodified; nothing is added to the DOM if no manifests load.
     */
    function ensureStylesInjected() {
        if (stylesInjected || document.getElementById('pb-custom-panel-styles')) {
            stylesInjected = true;
            return;
        }
        stylesInjected = true;
        var style = document.createElement('style');
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
            '}'
        ].join('\n');
        document.head.appendChild(style);
    }

    /**
     * Appends a one-time divider to the given sidebar section so users can tell at a glance
     * which submenu items came from manifests. Only fires when at least one custom item is about
     * to be added to that section, and only inserts the divider on the first call per section.
     *
     * @param {jQuery} $mount the `<ul>` submenu mount for the section
     * @param {string} section normalized section key (e.g. `"extra"`, `"alerts"`)
     */
    function ensureNavDivider($mount, section) {
        if (navDividerInserted[section]) {
            return;
        }
        navDividerInserted[section] = true;
        ensureStylesInjected();
        $mount.append($('<li/>', {
            'class': 'pb-custom-nav-divider',
            role: 'separator',
            'aria-hidden': 'true'
        }).text('Custom'));
    }

    /**
     * Renders one canonical nav entry as an `<li><a>` and appends it to its target submenu,
     * inserting the one-time `Custom` divider above it if this is the first manifest item in
     * that section. Silently skips entries that are missing required fields or that target an
     * unknown section mount.
     *
     * @param {{label: string, folder: string, page: string, hash: string, section: string}} entry
     *        canonical nav entry from the merged `panel/custom-manifests.json`
     */
    function appendNavItem(entry) {
        var href = entry.hash;
        var folder = entry.folder;
        var page = entry.page;
        var label = entry.label;
        var section = (entry.section || DEFAULT_NAV_SECTION).toString().toLowerCase();

        if (!href || !folder || !page || !label) {
            return;
        }

        var mount = SECTION_MOUNTS[section] || SECTION_MOUNTS[DEFAULT_NAV_SECTION];
        var $mount = $(mount);

        if ($mount.length === 0) {
            return;
        }

        ensureNavDivider($mount, section);

        var $a = $('<a/>', {
            href: href,
            'data-folder': folder
        });
        $a.append($('<i/>', {'class': 'fa fa-circle-o'}));
        $a.append(document.createTextNode(' '));
        $a.append($('<span/>').text(label));
        $mount.append($('<li/>').append($a));
    }

    /**
     * Groups the canonical `cards` array from `panel/custom-manifests.json` by section so that
     * `injectCustomCards` can look up entries in O(1) on demand. Cards missing required fields
     * are dropped silently; the backend already warn-logs them.
     *
     * @param {Array<object>} cards canonical card entries from the merged manifest response
     */
    function indexCards(cards) {
        if (!Array.isArray(cards)) {
            return;
        }
        cards.forEach(function (card) {
            if (!card || !card.section || !card.id || !card.title) {
                return;
            }
            var section = String(card.section).toLowerCase();
            if (!cardsBySection[section]) {
                cardsBySection[section] = [];
            }
            cardsBySection[section].push(card);
        });
    }

    /**
     * Builds a single Bootstrap card (a `col-md-4` wrapping a `box box-solid`) from a canonical
     * card entry, including the optional module-toggle switch (when `scriptPath` is set) and
     * the optional settings cog button (when both `settingsFolder` and `settingsPage` are set).
     *
     * @param {{id: string, title: string, description?: string, scriptPath?: string,
     *          settingsFolder?: string, settingsPage?: string}} card canonical card entry
     * @returns {jQuery} the column wrapper, ready to be appended to a `.row` mount
     */
    function buildCardElement(card) {
        var domId = 'pb-custom-card-' + card.id;
        var toggleId = domId + '-toggle';
        var settingsBtnId = domId + '-settings';

        var $col = $('<div/>', {'class': 'col-md-4'});
        var $box = $('<div/>', {'class': 'box box-solid', 'id': domId});
        var $header = $('<div/>', {'class': 'box-header with-border'});
        var $tools = $('<div/>', {'class': 'box-tools pull-right'});

        if (card.scriptPath) {
            var $label = $('<label/>', {'class': 'switch', 'data-toggle': 'tooltip', 'title': 'Module toggle.'});
            var $input = $('<input/>', {
                type: 'checkbox',
                id: toggleId,
                'data-pb-custom-card-toggle': card.scriptPath
            });
            $input.prop('checked', true);
            $label.append($input);
            $label.append($('<span/>', {'class': 'slider round'}));
            $tools.append($label);
        }

        if (card.settingsFolder && card.settingsPage) {
            var hash = '#' + card.settingsPage;
            var $btn = $('<button/>', {
                type: 'button',
                id: settingsBtnId,
                'class': 'btn btn-md btn-box-tool',
                'data-pb-custom-card-settings-folder': card.settingsFolder,
                'data-pb-custom-card-settings-page': card.settingsPage,
                'data-pb-custom-card-settings-hash': hash,
                style: 'margin-bottom: 7px;'
            });
            $btn.append($('<i/>', {'class': 'fa fa-cog fa-lg'}));
            $tools.append($btn);
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
     * Binds a `change` handler to every card module-toggle inside `$mount` that issues
     * `module enablesilent|disablesilent <scriptPath>` over the panel websocket and surfaces a
     * toast confirmation on success. No-op if `socket` is unavailable.
     *
     * @param {jQuery} $mount container holding the freshly injected card elements
     */
    function wireCardToggles($mount) {
        $mount.find('[data-pb-custom-card-toggle]').on('change', function () {
            var $input = $(this);
            var scriptPath = $input.data('pb-custom-card-toggle');
            var checked = $input.is(':checked');

            if (typeof socket === 'undefined' || !socket || !socket.sendCommandSync) {
                return;
            }

            socket.sendCommandSync('pb_custom_card_toggle', 'module ' + (checked ? 'enablesilent' : 'disablesilent') + ' ' + scriptPath, function () {
                if (typeof toastr !== 'undefined') {
                    toastr.success('Successfully ' + (checked ? 'enabled' : 'disabled') + ' the module!');
                }
            });
        });
    }

    /**
     * Binds a `click` handler to every card settings cog inside `$mount` that loads the card's
     * settings page via `$.loadPage(folder, page, hash)`.
     *
     * @param {jQuery} $mount container holding the freshly injected card elements
     */
    function wireCardSettings($mount) {
        $mount.find('[data-pb-custom-card-settings-folder]').on('click', function (e) {
            e.preventDefault();
            var $btn = $(this);
            var folder = $btn.data('pb-custom-card-settings-folder');
            var page = $btn.data('pb-custom-card-settings-page');
            var hash = $btn.data('pb-custom-card-settings-hash');

            if (folder && page && typeof $.loadPage === 'function') {
                $.loadPage(folder, page, hash);
            }
        });
    }

    /**
     * Queries the bot DB for the current `modules` table state of every card that declares a
     * `scriptPath`, then syncs each toggle's checked state and the matching settings button's
     * `disabled` state. No-op if no cards declare `scriptPath` or if `socket` is unavailable.
     *
     * @param {jQuery} $mount container holding the freshly injected card elements
     * @param {Array<object>} cards canonical card entries that were just rendered into `$mount`
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

        var tables = togglesNeeded.map(function () {
            return 'modules';
        });
        var keys = togglesNeeded.map(function (c) {
            return c.scriptPath;
        });

        socket.getDBValues('pb_custom_cards_get_modules', {tables: tables, keys: keys}, true, function (results) {
            if (!results) {
                return;
            }
            togglesNeeded.forEach(function (card) {
                var enabled = results[card.scriptPath];
                if (enabled === undefined || enabled === null) {
                    return;
                }
                var isEnabled = String(enabled).toLowerCase() === 'true';
                var $toggle = $mount.find('#pb-custom-card-' + card.id + '-toggle');
                $toggle.prop('checked', isEnabled);
                $mount.find('#pb-custom-card-' + card.id + '-settings').prop('disabled', !isEnabled);
            });
        });
    }

    /**
     * Public entry point invoked once from `index.js` after the panel websocket finishes
     * authenticating. Fetches the merged manifest JSON, injects sidebar links from `nav` entries,
     * and indexes `cards` entries so single-page panels (e.g. Games) can render them on demand
     * via {@link window.injectCustomCards}. Repeat calls after the first are ignored, so it is
     * safe to call from any post-login hook.
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
            timeout: 15000,
            success: function (data) {
                if (!data) {
                    return;
                }

                var navList = Array.isArray(data.nav) ? data.nav : [];
                var cardList = Array.isArray(data.cards) ? data.cards : [];

                navList.forEach(function (entry) {
                    if (entry) {
                        appendNavItem(entry);
                    }
                });

                indexCards(cardList);
                window.__pbCustomManifests__ = {
                    nav: navList,
                    cards: cardList,
                    cardsBySection: cardsBySection
                };
            },
            error: function (xhr, status, err) {
                helpers.log('Custom panel manifest not loaded (' + status + '): ' + (err || ''), helpers.LOG_TYPE.DEBUG);
            }
        });
    };

    /**
     * Injects all manifest-supplied cards for the given section into the element matching
     * `mountSelector`, prefixed with a one-time `Community modules` divider. Page fragments
     * (e.g. `games.html`) call this after their HTML is in the DOM. No-op when the mount is
     * missing or there are no cards for that section, so it is safe to call from any page.
     *
     * @param {string} section the canonical section key (e.g. `"games"`)
     * @param {string} mountSelector jQuery selector for the row container that should receive the
     *        cards (e.g. `"#pb-panel-games-custom-cards"`)
     */
    window.injectCustomCards = function (section, mountSelector) {
        var $mount = $(mountSelector);

        if ($mount.length === 0) {
            return;
        }

        var sectionKey = String(section || '').toLowerCase();
        var cards = cardsBySection[sectionKey] || [];

        if (cards.length === 0) {
            return;
        }

        ensureStylesInjected();

        // Visually mark the boundary between stock cards above and community cards below.
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
        loadInitialCardStates($mount, cards);
    };
}());
