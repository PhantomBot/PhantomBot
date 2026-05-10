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

/* global helpers, socket, toastr, $ */

/**
 * Loads {@code /panel/custom-manifests.json} and:
 *  - Appends sidebar links from {@code nav} entries.
 *  - Caches {@code cards} entries on {@code window.__pbCustomManifests__} so single-page panels
 *    (e.g. Games) can render community-contributed cards on demand via
 *    {@code window.injectCustomCards(section, mountSelector)}.
 *
 * After a declarative settings modal save completes (DB written, optional reload / wsEvent done):
 *  - Panel fires {@code pbCustomCardSettingsSaved}: subscribe with {@code $(document).on} using {@code (e, detail)}
 *    <strong>or</strong> {@code document.addEventListener} using {@code event.detail} — not both for the same logic
 *    (would double-fire).
 *  - When {@code settingsModal.wsEvent} is absent but {@code card.scriptPath} is set, the bot receives
 *    {@code panel-settings-saved} as {@code wsEvent} {@code args[0]} (Rhino {@code webPanelSocketUpdate}).
 *
 * Page fragments still use {@code $.loadPage} with the same {@code pages/&lt;folder&gt;/&lt;page&gt;}
 * layout as stock (e.g. folder {@code custom/myaddon}).
 *
 * @author mcawful
 */
(function () {
    var ran = false;
    var cardsBySection = {};
    /** @type {Object<string, object>} card id -> canonical manifest card entry */
    var cardsById = {};
    var navDividerInserted = {};
    var stylesInjected = false;

    /** jQuery synthetic event + DOM {@code CustomEvent} type after declarative custom-card settings save. */
    var PB_CUSTOM_CARD_SETTINGS_SAVED_EVENT = 'pbCustomCardSettingsSaved';
    /**
     * Bot-side {@code webPanelSocketUpdate} {@code args[0]} when manifest omits {@code wsEvent} but declares {@code scriptPath}.
     * Must stay aligned with community scripts that refresh caches after panel saves.
     */
    var PB_PANEL_SETTINGS_SAVED_WS_ARG = 'panel-settings-saved';

    /**
     * Raw {@code modules} cell value from merged {@code getDBValues(..., storeKey: true)} results (optional {@code ./} alias).
     *
     * @param {object} results merged callback object
     * @param {string} scriptPath manifest {@code scriptPath}
     * @returns {string|undefined}
     */
    function lookupModulesTableValue(results, scriptPath) {
        if (!results || scriptPath == null) {
            return undefined;
        }
        var sp = String(scriptPath);
        if (Object.prototype.hasOwnProperty.call(results, sp)) {
            return results[sp];
        }
        var alt = sp.indexOf('./') === 0 ? sp.slice(2) : './' + sp;
        return Object.prototype.hasOwnProperty.call(results, alt) ? results[alt] : undefined;
    }

    /**
     * @param {*} raw INIDB string for {@code modules} row
     * @returns {boolean}
     */
    function modulesDbValueIsEnabled(raw) {
        if (typeof helpers !== 'undefined' && helpers.isTrue) {
            return helpers.isTrue(raw);
        }
        return String(raw).toLowerCase() === 'true';
    }

    /**
     * @param {object} sm settingsModal object from manifest
     * @returns {boolean} whether the modal defines at least one field (flat or accordion)
     */
    function settingsModalHasContent(sm) {
        if (!sm || typeof sm !== 'object') {
            return false;
        }
        if (Array.isArray(sm.fields) && sm.fields.length > 0) {
            return true;
        }
        if (Array.isArray(sm.sections)) {
            return sm.sections.some(function (sec) {
                return sec && Array.isArray(sec.fields) && sec.fields.length > 0;
            });
        }
        return false;
    }

    /**
     * @param {object} card canonical card entry
     * @returns {boolean} whether the card declares settings (modal, or legacy full-page)
     */
    function cardHasSettings(card) {
        if (!card) {
            return false;
        }
        if (settingsModalHasContent(card.settingsModal)) {
            return true;
        }
        return !!(card.settingsFolder && card.settingsPage);
    }

    /**
     * @param {object} card canonical card entry
     * @returns {boolean} whether the card declares read-only {@code detailsModal} content
     */
    function cardHasDetailsModal(card) {
        var dm = card && card.detailsModal;
        return !!(dm && typeof dm.content === 'string' && dm.content.trim().length > 0);
    }

    /**
     * Notifies panel scripts after INIDB save + post-save hooks finish (modal still open until caller closes it).
     *
     * @param {object} card canonical manifest card
     */
    function notifyCustomCardSettingsSaved(card) {
        if (!card) {
            return;
        }
        var detail = {
            cardId: card.id,
            section: card.section != null ? card.section : null,
            scriptPath: card.scriptPath != null ? card.scriptPath : null,
            title: card.title != null ? card.title : null
        };
        if (typeof $ !== 'undefined') {
            $(document).trigger(PB_CUSTOM_CARD_SETTINGS_SAVED_EVENT, [detail]);
        }
        if (typeof document !== 'undefined' && typeof CustomEvent === 'function') {
            document.dispatchEvent(new CustomEvent(PB_CUSTOM_CARD_SETTINGS_SAVED_EVENT, {bubbles: true, detail: detail}));
        }
    }

    /**
     * Runs {@code socket.wsEvent} after save: explicit manifest {@code wsEvent}, else {@code scriptPath} + {@code panel-settings-saved}.
     *
     * @param {object} sm settingsModal (validated)
     * @param {object} card canonical manifest card
     * @param {function()} finish callback when done or skipped
     */
    function dispatchBotWsAfterCustomCardSave(sm, card, finish) {
        if (typeof socket === 'undefined' || !socket || typeof socket.wsEvent !== 'function') {
            finish();
            return;
        }
        var w = sm.wsEvent;
        if (w && w.script) {
            var argStr = Object.prototype.hasOwnProperty.call(w, 'argsString') ? w.argsString : null;
            socket.wsEvent('pb_custom_card_ws_' + card.id, w.script, argStr, w.args || [], finish);
            return;
        }
        var scriptPath = card.scriptPath;
        if (scriptPath && String(scriptPath).length > 0) {
            socket.wsEvent('pb_custom_card_ws_' + card.id, scriptPath, null, [PB_PANEL_SETTINGS_SAVED_WS_ARG], finish);
            return;
        }
        finish();
    }

    /**
     * Flatten {@code fields} or {@code sections[].fields} in manifest order for DB load/save.
     *
     * @param {object} sm settingsModal
     * @returns {Array<object>}
     */
    function collectSettingsModalFields(sm) {
        var out = [];
        if (!sm) {
            return out;
        }
        if (Array.isArray(sm.sections) && sm.sections.length > 0) {
            sm.sections.forEach(function (sec) {
                if (sec && Array.isArray(sec.fields)) {
                    sec.fields.forEach(function (f) {
                        if (f) {
                            out.push(f);
                        }
                    });
                }
            });
        } else if (Array.isArray(sm.fields)) {
            sm.fields.forEach(function (f) {
                if (f) {
                    out.push(f);
                }
            });
        }
        return out;
    }

    /**
     * Collapsible block matching {@link helpers.getCollapsibleAccordion} with a unique accordion group id.
     *
     * @param {string} panelGroupId DOM id of the surrounding {@code panel-group}
     * @param {string} collapseDomId unique id for the collapsible region
     * @param {string} title section heading
     * @param {jQuery} $bodyContent panel body contents (typically a {@code <form>})
     * @param {boolean} expanded whether this section starts expanded
     * @returns {jQuery}
     */
    function pbCollapsibleAccordion(panelGroupId, collapseDomId, title, $bodyContent, expanded) {
        return $('<div/>', {
            'class': 'panel panel-default'
        }).append($('<div/>', {
            'class': 'panel-heading'
        }).append($('<a/>', {
            'data-toggle': 'collapse',
            'data-parent': '#' + panelGroupId,
            'style': 'color: #ccc !important',
            'href': '#' + collapseDomId
        }).append($('<h4/>', {
            'class': 'panel-title',
            'text': title
        })))).append($('<div/>', {
            'class': 'panel-collapse collapse' + (expanded ? ' in' : ''),
            'id': collapseDomId
        }).append($('<div/>', {
            'class': 'panel-body'
        }).append($bodyContent)));
    }

    /**
     * Appends one declarative field widget to a container form.
     *
     * @param {jQuery} $form target form
     * @param {object} f field manifest entry
     * @param {object} results key → value map from {@code getDBValues}
     */
    function appendSettingsFieldWidget($form, f, results) {
        var raw = results[f.key];
        var id = f.id;
        var help = f.help || '';
        var type = (f.type || '').toLowerCase();

        if (type === 'number') {
            var numVal = '';
            if (raw !== undefined && raw !== null && raw !== '') {
                numVal = raw;
            } else if (f.min !== undefined && f.min !== null) {
                numVal = String(f.min);
            } else {
                numVal = '0';
            }
            $form.append(helpers.getInputGroup(id, 'number', f.label, '', numVal, help));
        } else if (type === 'text') {
            $form.append(helpers.getInputGroup(id, 'text', f.label, '', raw !== undefined && raw !== null ? String(raw) : '', help));
        } else if (type === 'textarea') {
            var unlimited = !!f.unlimited;
            $form.append(helpers.getTextAreaGroup(id, 'text', f.label, '', raw !== undefined && raw !== null ? String(raw) : '', help, unlimited));
        } else if (type === 'yesno') {
            $form.append(helpers.getDropdownGroup(id, f.label, helpers.isTrue(raw) ? 'Yes' : 'No', ['Yes', 'No'], help));
        } else if (type === 'dropdown') {
            var opts = f.options || [];
            var def = raw !== undefined && raw !== null ? String(raw) : (opts[0] || '');
            if (opts.indexOf(def) === -1) {
                def = opts[0] || '';
            }
            $form.append(helpers.getDropdownGroup(id, f.label, def, opts, help));
        } else if (type === 'permission') {
            var gid = raw !== undefined && raw !== null ? parseInt(raw, 10) : 7;
            if (isNaN(gid)) {
                gid = 7;
            }
            $form.append(helpers.getDropdownGroup(id, f.label, helpers.getGroupNameById(gid), helpers.getPermGroupNames(), help));
        }
    }

    /**
     * Validates one field on Save (same rules as initial modal build).
     *
     * @param {object} f field manifest entry
     * @returns {*} value to persist (string, boolean, or number from permission helper), or {@code 'invalid'}
     */
    function readValidatedFieldValue(f) {
        var type = (f.type || '').toLowerCase();
        var id = f.id;

        if (type === 'number') {
            var $n = $('#' + id);
            var minV = f.min !== undefined && f.min !== null ? f.min : undefined;
            var maxV = f.max !== undefined && f.max !== null ? f.max : undefined;
            if (!helpers.handleInputNumber($n, minV, maxV)) {
                return 'invalid';
            }
            return $n.val();
        }
        if (type === 'text') {
            var $t = $('#' + id);
            if (!helpers.handleInputString($t, 0)) {
                return 'invalid';
            }
            return $t.val();
        }
        if (type === 'textarea') {
            var $ta = $('#' + id);
            var maxLen = f.unlimited ? Number.MAX_SAFE_INTEGER : 480;
            if (!helpers.handleInputString($ta, 0, maxLen)) {
                return 'invalid';
            }
            return $ta.val();
        }
        if (type === 'yesno') {
            return $('#' + id).find(':selected').text() === 'Yes';
        }
        if (type === 'dropdown') {
            return $('#' + id).find(':selected').text();
        }
        if (type === 'permission') {
            return helpers.getGroupIdByName($('#' + id).find(':selected').text(), true);
        }
        return 'invalid';
    }


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
        cardsBySection = {};
        cardsById = {};
        if (!Array.isArray(cards)) {
            return;
        }
        cards.forEach(function (card) {
            if (!card || !card.section || !card.id || !card.title) {
                return;
            }
            cardsById[card.id] = card;
            var section = String(card.section).toLowerCase();
            if (!cardsBySection[section]) {
                cardsBySection[section] = [];
            }
            cardsBySection[section].push(card);
        });
    }

    /**
     * Builds a single Bootstrap card (a `col-md-4` wrapping a `box box-solid`) from a canonical
     * card entry. Optional {@code detailsModal} adds an info ({@code fa-info-circle}) button that
     * opens a read-only dialog. Settings cog matches stock Games cards: modal ({@code settingsModal}),
     * legacy full-page ({@code settingsFolder}/{@code settingsPage}), or disabled with tooltip when there
     * are no settings.
     *
     * @param {{id: string, title: string, description?: string, scriptPath?: string,
     *          settingsModal?: object, detailsModal?: object, settingsFolder?: string, settingsPage?: string}} card
     * @returns {jQuery} the column wrapper, ready to be appended to a `.row` mount
     */
    function buildCardElement(card) {
        var domId = 'pb-custom-card-' + card.id;
        var toggleId = domId + '-toggle';
        var settingsBtnId = domId + '-settings';
        var hasSettings = cardHasSettings(card);
        var useModal = settingsModalHasContent(card.settingsModal);
        var hasDetails = cardHasDetailsModal(card);

        var $col = $('<div/>', {'class': 'col-md-4'});
        var $box = $('<div/>', {'class': 'box box-solid', 'id': domId});
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
                id: domId + '-details',
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
     * Opens a Bootstrap settings modal using {@link helpers.getModal}, populated from the manifest
     * {@code settingsModal} block (flat {@code fields} or accordion {@code sections}).
     *
     * @param {object} card canonical manifest card with {@code settingsModal}
     */
    function openCustomCardSettingsModal(card) {
        var sm = card.settingsModal;
        var fieldsFlat = collectSettingsModalFields(sm);

        if (!sm || fieldsFlat.length === 0 || typeof helpers === 'undefined' || typeof helpers.getModal !== 'function') {
            return;
        }

        if (typeof socket === 'undefined' || !socket || !socket.getDBValues || !socket.updateDBValues) {
            return;
        }

        var tables = [];
        var keys = [];

        fieldsFlat.forEach(function (f) {
            tables.push(f.table);
            keys.push(f.key);
        });

        socket.getDBValues('pb_custom_card_settings_' + card.id, {tables: tables, keys: keys}, true, function (results) {
            if (!results) {
                results = {};
            }

            var $form = $('<form/>', {'role': 'form'});

            if (Array.isArray(sm.sections) && sm.sections.length > 0) {
                var accDomId = 'pb-custom-settings-acc-' + card.id;
                var $group = $('<div/>', {
                    'class': 'panel-group',
                    'id': accDomId
                });
                var placedDefault = false;

                sm.sections.forEach(function (sec, idx) {
                    if (!sec || !Array.isArray(sec.fields) || sec.fields.length === 0) {
                        return;
                    }
                    var collapseId = 'pb-custom-sec-' + card.id + '-' + sec.id;
                    var expand = !!(sec.defaultExpanded === true) || (!placedDefault && idx === 0);
                    if (expand) {
                        placedDefault = true;
                    }
                    var $inner = $('<form/>', {'role': 'form'});
                    sec.fields.forEach(function (field) {
                        appendSettingsFieldWidget($inner, field, results);
                    });
                    $group.append(pbCollapsibleAccordion(accDomId, collapseId, sec.title || 'Section', $inner, expand));
                });

                $form.append($group);
            } else {
                fieldsFlat.forEach(function (field) {
                    appendSettingsFieldWidget($form, field, results);
                });
            }

            var modalId = 'pb-custom-game-settings-' + card.id;

            helpers.getModal(modalId, sm.title || 'Settings', 'Save', $form, function () {
                var tablesOut = [];
                var keysOut = [];
                var valuesOut = [];

                var ok = true;
                fieldsFlat.forEach(function (f) {
                    if (!ok) {
                        return;
                    }
                    tablesOut.push(f.table);
                    keysOut.push(f.key);
                    var val = readValidatedFieldValue(f);
                    if (val === 'invalid') {
                        ok = false;
                        return;
                    }
                    valuesOut.push(val);
                });

                if (!ok) {
                    return;
                }

                socket.updateDBValues('pb_custom_card_save_' + card.id, {tables: tablesOut, keys: keysOut, values: valuesOut}, function () {
                    var finish = function () {
                        notifyCustomCardSettingsSaved(card);
                        $('#' + modalId).modal('toggle');
                        if (typeof toastr !== 'undefined') {
                            toastr.success('Successfully saved settings!');
                        }
                    };

                    var afterReload = function () {
                        dispatchBotWsAfterCustomCardSave(sm, card, finish);
                    };

                    if (sm.reloadCommand && String(sm.reloadCommand).length > 0 && typeof socket.sendCommand === 'function') {
                        socket.sendCommand('pb_custom_card_reload_' + card.id, sm.reloadCommand, afterReload);
                    } else {
                        afterReload();
                    }
                });
            }).modal('toggle');
        });
    }

    /**
     * Allowed tags for {@code detailsModal} when {@code format} is {@code html}. Everything else is
     * stripped; {@code a} keeps only safe {@code href} values.
     *
     * @type {Object<string, boolean>}
     */
    var PB_DETAILS_HTML_TAGS = {
        P: true, BR: true, STRONG: true, B: true, EM: true, I: true, U: true, S: true,
        H4: true, H5: true, H6: true, UL: true, OL: true, LI: true,
        A: true, CODE: true, PRE: true, BLOCKQUOTE: true, DIV: true, SPAN: true, HR: true
    };

    /**
     * @param {string} href raw attribute
     * @returns {string} safe href or empty
     */
    function sanitizeDetailsHref(href) {
        if (!href || typeof href !== 'string') {
            return '';
        }
        var h = href.trim();
        if (h.length === 0) {
            return '';
        }
        var lower = h.toLowerCase();
        if (lower.indexOf('javascript:') === 0 || lower.indexOf('data:') === 0 || lower.indexOf('vbscript:') === 0) {
            return '';
        }
        if (/^https?:\/\//i.test(h)) {
            return h;
        }
        if (/^mailto:/i.test(h)) {
            return h;
        }
        if (h.charAt(0) === '#' && /^#[\w\-:.]+$/.test(h)) {
            return h;
        }
        return '';
    }

    /**
     * Whitelist-based HTML sanitizer for {@code detailsModal.content} (format html).
     *
     * @param {string} html untrusted HTML string
     * @returns {string} sanitized HTML
     */
    function sanitizeDetailsModalHtml(html) {
        var container = document.createElement('div');
        container.innerHTML = html;
        var all = container.querySelectorAll('*');
        var i;
        for (i = all.length - 1; i >= 0; i--) {
            var el = all[i];
            var tag = el.tagName.toUpperCase();
            if (!PB_DETAILS_HTML_TAGS[tag]) {
                while (el.firstChild) {
                    el.parentNode.insertBefore(el.firstChild, el);
                }
                el.parentNode.removeChild(el);
                continue;
            }
            var attrs = el.attributes;
            var hRef = '';
            if (tag === 'A') {
                hRef = sanitizeDetailsHref(el.getAttribute('href') || '');
            }
            while (attrs.length > 0) {
                el.removeAttribute(attrs[0].name);
            }
            if (tag === 'A') {
                if (!hRef) {
                    while (el.firstChild) {
                        el.parentNode.insertBefore(el.firstChild, el);
                    }
                    el.parentNode.removeChild(el);
                    continue;
                }
                el.setAttribute('href', hRef);
                el.setAttribute('rel', 'noopener noreferrer');
                el.setAttribute('target', '_blank');
            }
        }
        return container.innerHTML;
    }

    /**
     * Opens a read-only modal with {@code detailsModal.content}.
     * Default {@code format} is plain text (escaped; newlines preserved). {@code format: "html"}
     * renders sanitized HTML (whitelist tags only).
     *
     * @param {object} card canonical manifest card with {@code detailsModal}
     */
    function openCustomCardDetailsModal(card) {
        var dm = card.detailsModal;
        if (!dm || typeof dm.content !== 'string' || !dm.content.trim()) {
            return;
        }
        if (typeof helpers === 'undefined' || typeof helpers.getModal !== 'function') {
            return;
        }

        var modalId = 'pb-custom-card-details-' + card.id;
        var modalTitle = (typeof dm.title === 'string' && dm.title.trim()) ? dm.title.trim() : 'Details';
        var fmt = (typeof dm.format === 'string' ? dm.format : 'text').toLowerCase();
        var $body = $('<div/>', {'class': 'pb-custom-details-modal-body'})
            .css('word-break', 'break-word');

        if (fmt === 'html') {
            $body.css('white-space', 'normal').html(sanitizeDetailsModalHtml(dm.content));
        } else {
            $body.css('white-space', 'pre-wrap').text(dm.content);
        }

        helpers.getModal(modalId, modalTitle, null, $body, undefined, {
            canceltext: 'Close',
            cancelclass: 'btn-primary'
        }).modal('toggle');
    }

    /**
     * Binds a `change` handler to every card module-toggle inside `$mount` that issues
     * `module enablesilent|disablesilent <scriptPath>` over the panel websocket and surfaces a
     * toast confirmation on success. No-op if `socket` is unavailable.
     *
     * @param {jQuery} $mount container holding the freshly injected card elements
     */
    function wireCardToggles($mount) {
        $mount.find('[data-pb-custom-card-toggle]').off('change.pbCustomNav').on('change.pbCustomNav', function () {
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
                if (cardId && cardsById[cardId] && cardHasSettings(cardsById[cardId])) {
                    $mount.find('#pb-custom-card-' + cardId + '-settings').prop('disabled', !checked);
                }
            });
        });
    }

    /**
     * Binds settings cog: declarative modal ({@code settingsModal}) or legacy {@code $.loadPage}.
     *
     * @param {jQuery} $mount container holding the freshly injected card elements
     */
    function wireCardSettings($mount) {
        $mount.find('[data-pb-custom-card-settings-mode="page"]').on('click', function (e) {
            e.preventDefault();
            var $btn = $(this);
            var folder = $btn.data('pb-custom-card-settings-folder');
            var page = $btn.data('pb-custom-card-settings-page');
            var hash = $btn.data('pb-custom-card-settings-hash');

            if (folder && page && typeof $.loadPage === 'function') {
                $.loadPage(folder, page, hash);
            }
        });

        $mount.find('[data-pb-custom-card-settings-mode="modal"]').on('click', function (e) {
            e.preventDefault();
            var id = $(this).data('pb-custom-card-id');
            var card = cardsById[id];

            if (card && card.settingsModal) {
                openCustomCardSettingsModal(card);
            }
        });
    }

    /**
     * Binds the optional info ({@code fa-info-circle}) control to {@link openCustomCardDetailsModal}.
     *
     * @param {jQuery} $mount container holding the freshly injected card elements
     */
    function wireCardDetails($mount) {
        $mount.find('.pb-custom-card-open-details').on('click', function (e) {
            e.preventDefault();
            var id = $(this).data('pb-custom-card-id');
            var c = cardsById[id];
            if (c && cardHasDetailsModal(c)) {
                openCustomCardDetailsModal(c);
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
                var $toggle = $mount.find('#pb-custom-card-' + card.id + '-toggle');
                $toggle.prop('checked', isEnabled);
                if (cardHasSettings(card)) {
                    $mount.find('#pb-custom-card-' + card.id + '-settings').prop('disabled', !isEnabled);
                }
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

        $mount.empty();

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
        wireCardDetails($mount);
        loadInitialCardStates($mount, cards);
        if (typeof $.fn.tooltip === 'function') {
            $mount.find('[data-toggle="tooltip"]').tooltip({container: 'body'});
        }
    };
}());
