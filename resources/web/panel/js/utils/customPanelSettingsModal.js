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
 * Custom-panel **settings modal**. Builds a Bootstrap modal from the manifest
 * {@code settingsModal} block (flat {@code fields} or accordion {@code sections}), populates
 * it from INIDB via {@code socket.getDBValues}, validates + writes back via
 * {@code socket.updateDBValues} on Save, and runs any optional {@code reloadCommand} /
 * {@code wsEvent} chain — all guarded by watchdog timeouts so a hung bot or dropped websocket
 * surfaces an error toast instead of leaving the user staring at an unresponsive modal.
 *
 * <p>Registers itself as {@code window.__pbCustomPanel__.openSettingsModal} so the cards file
 * can dispatch the open via the shared namespace. After a successful save the file fires a
 * single {@code pbCustomCardSettingsSaved} DOM {@code CustomEvent} on {@code document} with
 * {@code detail = {cardId, section, scriptPath, title}} so panel-side scripts can refresh
 * caches without polling.</p>
 *
 * @author mcawful
 */
(function () {
    var ns = window.__pbCustomPanel__ = window.__pbCustomPanel__ || {};

    ns.EVENTS = ns.EVENTS || {
        MANIFESTS_LOADED: 'pbCustomManifestsLoaded',
        CARD_SETTINGS_SAVED: 'pbCustomCardSettingsSaved'
    };
    ns.PANEL_SETTINGS_SAVED_WS_ARG = ns.PANEL_SETTINGS_SAVED_WS_ARG || 'panel-settings-saved';
    ns.LOAD_TIMEOUT_MS = ns.LOAD_TIMEOUT_MS || 8000;
    ns.RELOAD_TIMEOUT_MS = ns.RELOAD_TIMEOUT_MS || 8000;

    /**
     * Notifies panel scripts after INIDB save + post-save hooks finish (modal still open
     * until caller closes it). Fires a single DOM {@code CustomEvent} on {@code document};
     * jQuery handlers receive it natively and can read {@code e.originalEvent.detail}.
     *
     * @param {object} card canonical manifest card
     */
    function notifyCustomCardSettingsSaved(card) {
        if (!card) {
            return;
        }
        if (typeof document === 'undefined' || typeof CustomEvent !== 'function') {
            return;
        }
        var detail = {
            cardId: card.id,
            section: card.section != null ? card.section : null,
            scriptPath: card.scriptPath != null ? card.scriptPath : null,
            title: card.title != null ? card.title : null
        };
        document.dispatchEvent(new CustomEvent(ns.EVENTS.CARD_SETTINGS_SAVED, {bubbles: true, detail: detail}));
    }

    /**
     * Runs {@code socket.wsEvent} after save: explicit manifest {@code wsEvent} wins; else
     * the implicit {@code scriptPath} + {@code panel-settings-saved} fallback fires unless
     * the manifest opts out via {@code settingsModal.disableWsFallback: true}. The opt-out
     * has no effect when an explicit {@code wsEvent} block is also declared.
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
        if (sm.disableWsFallback === true) {
            finish();
            return;
        }
        var scriptPath = card.scriptPath;
        if (scriptPath && String(scriptPath).length > 0) {
            socket.wsEvent('pb_custom_card_ws_' + card.id, scriptPath, null, [ns.PANEL_SETTINGS_SAVED_WS_ARG], finish);
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
     * Collapsible block matching {@link helpers.getCollapsibleAccordion} with a unique
     * accordion group id.
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
     * Builds a namespaced DOM id for a settings-modal field input. Prevents collisions with
     * elements on the underlying page (e.g. {@code games.html} ships its own
     * {@code <input id="round-seconds">}) and across multiple custom cards that happen to
     * choose the same {@code field.id}. The manifest-author {@code field.id} stays the
     * logical key for unique-id validation in the Java collector.
     *
     * @param {string} cardId canonical card id from the manifest
     * @param {string} fieldId manifest-author field id
     * @returns {string} DOM id like {@code pb-custom-modal-trivia-leaderboard-round-seconds}
     */
    function cardFieldDomId(cardId, fieldId) {
        return 'pb-custom-modal-' + cardId + '-' + fieldId;
    }

    /**
     * Appends one declarative field widget to a container form using a namespaced DOM id
     * (see {@link cardFieldDomId}). Pairs with {@link readValidatedFieldValue} which must be
     * called with the same {@code cardId} so the lookups match.
     *
     * @param {jQuery} $form target form
     * @param {string} cardId canonical card id from the manifest
     * @param {object} f field manifest entry
     * @param {object} results key → value map from {@code getDBValues}
     */
    function appendSettingsFieldWidget($form, cardId, f, results) {
        var raw = results[f.key];
        var id = cardFieldDomId(cardId, f.id);
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
     * Validates one field on Save (same rules as initial modal build). Resolves the input by
     * its namespaced DOM id via {@link cardFieldDomId}; the {@code cardId} must be the same
     * value that was passed to {@link appendSettingsFieldWidget} when the modal was built.
     *
     * @param {string} cardId canonical card id from the manifest
     * @param {object} f field manifest entry
     * @returns {*} value to persist (string, boolean, or number from permission helper),
     *   or {@code 'invalid'}
     */
    function readValidatedFieldValue(cardId, f) {
        var type = (f.type || '').toLowerCase();
        var id = cardFieldDomId(cardId, f.id);

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

    /**
     * Runs {@code socket.sendCommand} for a settings-modal {@code reloadCommand} guarded by
     * a watchdog timeout. The DB save has already succeeded by the time this is called, so
     * on timeout we surface an error toast (so the user knows settings were persisted but
     * the live reload didn't confirm) and close the modal — without chaining into the
     * misleading "Successfully saved settings!" success path.
     *
     * @param {string} modalId DOM id of the open settings modal (closed on timeout)
     * @param {object} card canonical manifest card
     * @param {object} sm validated settingsModal block
     * @param {function()} onSuccess invoked exactly once when the bot acknowledges the reload
     */
    function dispatchReloadCommandWithWatchdog(modalId, card, sm, onSuccess) {
        var done = false;
        var watchdog = setTimeout(function () {
            if (done) {
                return;
            }
            done = true;
            if (typeof toastr !== 'undefined') {
                toastr.error(
                    'Settings were saved, but the bot did not acknowledge the reload command "' +
                    String(sm.reloadCommand) + '" within ' +
                    Math.round(ns.RELOAD_TIMEOUT_MS / 1000) +
                    ' seconds. A manual reload may be required.',
                    'Reload command timed out'
                );
            }
            $('#' + modalId).modal('toggle');
        }, ns.RELOAD_TIMEOUT_MS);

        socket.sendCommand('pb_custom_card_reload_' + card.id, sm.reloadCommand, function () {
            if (done) {
                return;
            }
            done = true;
            clearTimeout(watchdog);
            onSuccess();
        });
    }

    /**
     * Opens a Bootstrap settings modal using {@link helpers.getModal}, populated from the
     * manifest {@code settingsModal} block (flat {@code fields} or accordion {@code sections}).
     * Wraps the initial {@code getDBValues} round-trip in a sticky "Loading…" toast plus a
     * watchdog timeout, and runs any {@code reloadCommand} via
     * {@link dispatchReloadCommandWithWatchdog} so a hung bot surfaces an explicit error
     * rather than a silent hang or a misleading success toast.
     *
     * @param {object} card canonical manifest card with {@code settingsModal}
     */
    ns.openSettingsModal = function (card) {
        var sm = card && card.settingsModal;
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

        var loadAborted = false;
        var loadWatchdog = setTimeout(function () {
            loadAborted = true;
            if (typeof toastr !== 'undefined') {
                toastr.error(
                    'Settings did not load within ' +
                    Math.round(ns.LOAD_TIMEOUT_MS / 1000) +
                    ' seconds. The bot may be unresponsive.',
                    'Settings load timed out'
                );
            }
        }, ns.LOAD_TIMEOUT_MS);

        socket.getDBValues('pb_custom_card_settings_' + card.id, {tables: tables, keys: keys}, true, function (results) {
            if (loadAborted) {
                return;
            }
            clearTimeout(loadWatchdog);

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
                        appendSettingsFieldWidget($inner, card.id, field, results);
                    });
                    $group.append(pbCollapsibleAccordion(accDomId, collapseId, sec.title || 'Section', $inner, expand));
                });

                $form.append($group);
            } else {
                fieldsFlat.forEach(function (field) {
                    appendSettingsFieldWidget($form, card.id, field, results);
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
                    var val = readValidatedFieldValue(card.id, f);
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
                        dispatchReloadCommandWithWatchdog(modalId, card, sm, afterReload);
                    } else {
                        afterReload();
                    }
                });
            }).modal('toggle');
        });
    };
}());
