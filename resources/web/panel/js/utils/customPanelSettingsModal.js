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
    // Namespace + shared constants (EVENTS, PANEL_SETTINGS_SAVED_WS_ARG, LOAD_TIMEOUT_MS,
    // RELOAD_TIMEOUT_MS) are owned by customPanelManifestLoader.js, which runs first per the
    // script-tag order in index.html. The `||` fallback is a load-order safety net only;
    // nothing else here re-initializes shared state.
    var ns = window.__pbCustomPanel__ = window.__pbCustomPanel__ || {};

    /**
     * Wraps an async {@code callback} with a watchdog timer. Returns a function the caller
     * passes to {@code socket.sendCommand} / {@code socket.getDBValues} / similar; whichever
     * fires first wins, the loser becomes a no-op.
     *
     * @param {number} timeoutMs how long to wait before triggering {@code onTimeout}
     * @param {function()} onTimeout fired exactly once if {@code callback} doesn't return in time
     * @param {function(*=)} callback original success callback; receives the bot's result(s)
     * @returns {function(*=)}
     */
    function withWatchdog(timeoutMs, onTimeout, callback) {
        var done = false;
        var timer = setTimeout(function () {
            if (done) {
                return;
            }
            done = true;
            try {
                onTimeout();
            } catch (e) {}
        }, timeoutMs);
        return function () {
            if (done) {
                return;
            }
            done = true;
            clearTimeout(timer);
            callback.apply(null, arguments);
        };
    }

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
     * Expands a manifest field into its underlying {@code (table, key)} INIDB rows.
     *
     * <p>Most field types map 1:1 to a single INIDB row, so the returned array has one
     * entry. {@code checkboxgroup} fields fan out into one entry per inner checkbox,
     * each sharing the field-level {@code table} and using its own {@code key}. The
     * {@code getValue} thunk is what the save loop calls once the user hits Save —
     * regular fields delegate to {@link readValidatedFieldValue}; checkbox entries
     * read their checked state straight from the DOM.</p>
     *
     * @param {string} cardId canonical card id (used for namespaced DOM ids)
     * @param {object} f manifest field entry
     * @returns {Array<{table: string, key: string, getValue: function(): *}>}
     */
    function expandFieldEntries(cardId, f) {
        if (!f) {
            return [];
        }
        var type = (f.type || '').toLowerCase();
        if (type === 'checkboxgroup' && Array.isArray(f.checkboxes)) {
            var out = [];
            f.checkboxes.forEach(function (cb) {
                if (!cb || !cb.id || !cb.key) {
                    return;
                }
                var cbDomId = cardFieldDomId(cardId, cb.id);
                out.push({
                    table: f.table,
                    key: cb.key,
                    getValue: function () {
                        return $('#' + cbDomId).is(':checked');
                    }
                });
            });
            return out;
        }
        return [{
            table: f.table,
            key: f.key,
            getValue: function () {
                return readValidatedFieldValue(cardId, f);
            }
        }];
    }

    /**
     * Iterates every {@code (table, key, getValue)} INIDB row across a flat field list,
     * including the per-checkbox fan-out from {@code checkboxgroup} fields. Centralises
     * the {@code fields.forEach -> expandFieldEntries.forEach} traversal that load and
     * save paths both need.
     *
     * @param {string} cardId canonical card id (forwarded to {@link expandFieldEntries})
     * @param {Array<object>} fields manifest field entries in declared order
     * @param {function(object)} callback receives each {@code {table, key, getValue}} entry
     */
    function forEachFieldEntry(cardId, fields, callback) {
        fields.forEach(function (f) {
            expandFieldEntries(cardId, f).forEach(callback);
        });
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
            var numVal;
            if (raw !== undefined && raw !== null && raw !== '') {
                numVal = raw;
            } else if (f.min !== undefined && f.min !== null) {
                numVal = String(f.min);
            } else {
                numVal = '0';
            }
            $form.append(helpers.getInputGroup(id, 'number', f.label, '', numVal, help));
        } else if (type === 'text') {
            $form.append(helpers.getInputGroup(id, 'text', f.label, '', raw != null ? String(raw) : '', help));
        } else if (type === 'textarea') {
            $form.append(helpers.getTextAreaGroup(id, 'text', f.label, '', raw != null ? String(raw) : '', help, !!f.unlimited));
        } else if (type === 'boolean') {
            // Author-supplied labels: options[0] = true, options[1] = false. The Java
            // validator guarantees exactly 2 unique non-empty strings, so the array shape
            // check below is purely defensive against direct JS callers / test harnesses.
            var boolOpts = (f.options && f.options.length === 2)
                ? [String(f.options[0]), String(f.options[1])]
                : ['Yes', 'No'];
            $form.append(helpers.getDropdownGroup(id, f.label, helpers.isTrue(raw) ? boolOpts[0] : boolOpts[1], boolOpts, help));
        } else if (type === 'toggle') {
            $form.append(helpers.getCheckBox(id, helpers.isTrue(raw), f.label, help));
        } else if (type === 'checkboxgroup') {
            if (typeof ns.ensureStylesInjected === 'function') {
                ns.ensureStylesInjected();
            }
            var $group = $('<div/>', {'class': 'pb-custom-checkbox-group'});
            $group.append($('<span/>', {'class': 'pb-custom-checkbox-group-label', 'text': f.label}));
            if (help) {
                $group.append($('<div/>', {'class': 'pb-custom-checkbox-group-help', 'text': help}));
            }
            var $items = $('<div/>', {'class': 'pb-custom-checkbox-group-items'});
            (f.checkboxes || []).forEach(function (cb) {
                if (!cb || !cb.id || !cb.key) {
                    return;
                }
                var cbDomId = cardFieldDomId(cardId, cb.id);
                var cbVal = helpers.isTrue(results[cb.key]);
                $items.append(helpers.getCheckBox(cbDomId, cbVal, cb.label, cb.help || ''));
            });
            $group.append($items);
            $form.append($group);
        } else if (type === 'dropdown') {
            var opts = f.options || [];
            var def = raw !== undefined && raw !== null ? String(raw) : (opts[0] || '');
            if (opts.indexOf(def) === -1) {
                def = opts[0] || '';
            }
            $form.append(helpers.getDropdownGroup(id, f.label, def, opts, help));
        } else if (type === 'permission') {
            var gid = raw != null ? parseInt(raw, 10) : ns.DEFAULT_PERMISSION_GROUP_ID;
            if (isNaN(gid)) {
                gid = ns.DEFAULT_PERMISSION_GROUP_ID;
            }
            $form.append(helpers.getDropdownGroup(id, f.label, helpers.getGroupNameById(gid), helpers.getPermGroupNames(), help));
        }
    }

    /**
     * Renders a flat field list into {@code $container}, packing any consecutive run of
     * fields that declare a Bootstrap {@code column} (1-11) into a single
     * {@code <div class="row">} with {@code col-md-N} wrappers. Fields without {@code column}
     * (or with {@code column} = 12) flush any open row and render full-width as before.
     *
     * <p>The Java validator already strips {@code column = 12} (it's the implicit full-width
     * default), so in practice the renderer only sees 1-11. The {@code <= 11} check here
     * is defensive against direct JS callers and any future code path that might bypass
     * the validator's normalization.</p>
     *
     * <p>Bootstrap's grid wraps on overflow naturally, so a run that totals more than 12 just
     * spills onto a second visual row inside the same {@code .row} wrapper — no special
     * accumulator math needed here.</p>
     *
     * @param {jQuery} $container target form / inner form receiving the rendered fields
     * @param {string} cardId canonical card id (forwarded to {@link appendSettingsFieldWidget})
     * @param {Array<object>} fields manifest field entries in declared order
     * @param {object} results key → value map from {@code getDBValues}
     */
    function renderFieldList($container, cardId, fields, results) {
        var openRow = null;
        fields.forEach(function (f) {
            if (!f) {
                return;
            }
            var col = (typeof f.column === 'number' && f.column >= 1 && f.column <= 11) ? f.column : null;
            if (col === null) {
                if (openRow) {
                    $container.append(openRow);
                    openRow = null;
                }
                appendSettingsFieldWidget($container, cardId, f, results);
                return;
            }
            if (!openRow) {
                openRow = $('<div/>', {'class': 'row'});
            }
            var $cell = $('<div/>', {'class': 'col-md-' + col});
            appendSettingsFieldWidget($cell, cardId, f, results);
            openRow.append($cell);
        });
        if (openRow) {
            $container.append(openRow);
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
            var maxLen = f.unlimited ? Number.MAX_SAFE_INTEGER : ns.TEXTAREA_DEFAULT_MAX_LEN;
            if (!helpers.handleInputString($ta, 0, maxLen)) {
                return 'invalid';
            }
            return $ta.val();
        }
        if (type === 'boolean') {
            // The 'true' label is options[0] by convention. Same defensive fallback as the
            // render path above; in practice the validator guarantees options is well-formed.
            var trueLabel = (f.options && f.options[0]) ? String(f.options[0]) : 'Yes';
            return $('#' + id).find(':selected').text() === trueLabel;
        }
        if (type === 'toggle') {
            return $('#' + id).is(':checked');
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
     * {@link #withWatchdog}. The DB save has already succeeded by the time this is called,
     * so on timeout we surface an error toast (settings persisted, live reload didn't
     * confirm) and close the modal — without chaining into the misleading
     * "Successfully saved settings!" success path.
     *
     * @param {string} modalId DOM id of the open settings modal (closed on timeout)
     * @param {object} card canonical manifest card
     * @param {object} sm validated settingsModal block
     * @param {function()} onSuccess invoked exactly once when the bot acknowledges the reload
     */
    function dispatchReloadCommandWithWatchdog(modalId, card, sm, onSuccess) {
        var ack = withWatchdog(ns.RELOAD_TIMEOUT_MS, function () {
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
        }, onSuccess);

        socket.sendCommand('pb_custom_card_reload_' + card.id, sm.reloadCommand, ack);
    }

    /**
     * Builds the {@code <form>} body for a settings modal. Branches on accordion vs flat
     * layout and delegates field rendering to {@link renderFieldList}.
     *
     * @param {object} card canonical manifest card
     * @param {object} sm validated settingsModal block
     * @param {Array<object>} fieldsFlat flattened field list (used in flat mode only)
     * @param {object} results key → value map from {@code getDBValues}
     * @returns {jQuery} {@code <form>} ready to drop into {@code helpers.getModal}
     */
    function buildSettingsForm(card, sm, fieldsFlat, results) {
        var $form = $('<form/>', {'role': 'form'});

        if (Array.isArray(sm.sections) && sm.sections.length > 0) {
            var accDomId = 'pb-custom-settings-acc-' + card.id;
            var $group = $('<div/>', {'class': 'panel-group', 'id': accDomId});
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
                renderFieldList($inner, card.id, sec.fields, results);
                $group.append(pbCollapsibleAccordion(accDomId, collapseId, sec.title || 'Section', $inner, expand));
            });

            $form.append($group);
        } else {
            renderFieldList($form, card.id, fieldsFlat, results);
        }

        return $form;
    }

    /**
     * Reads + validates every field on Save and assembles the {@code updateDBValues}
     * payload. Returns {@code null} when any field is invalid (caller should abort the
     * save and let the per-widget validation toast surface to the user).
     *
     * @param {string} cardId canonical card id (used for namespaced DOM lookups)
     * @param {Array<object>} fieldsFlat flattened field list
     * @returns {?{tables: string[], keys: string[], values: *[]}}
     */
    function collectSaveData(cardId, fieldsFlat) {
        var tables = [];
        var keys = [];
        var values = [];
        var ok = true;

        forEachFieldEntry(cardId, fieldsFlat, function (entry) {
            if (!ok) {
                return;
            }
            var val = entry.getValue();
            if (val === 'invalid') {
                ok = false;
                return;
            }
            tables.push(entry.table);
            keys.push(entry.key);
            values.push(val);
        });

        if (!ok) {
            return null;
        }

        return {tables: tables, keys: keys, values: values};
    }

    /**
     * Persists the save payload then chains the optional {@code reloadCommand} and
     * {@code wsEvent} hooks. {@code finish} is invoked exactly once after the full chain
     * settles (or once on watchdog timeout — see {@link dispatchReloadCommandWithWatchdog}).
     *
     * @param {object} card canonical manifest card
     * @param {object} sm validated settingsModal
     * @param {string} modalId DOM id of the open settings modal (for the reload watchdog)
     * @param {{tables: string[], keys: string[], values: *[]}} payload from {@link collectSaveData}
     * @param {function()} finish post-chain callback (closes modal, fires success toast, etc.)
     */
    function dispatchSaveSequence(card, sm, modalId, payload, finish) {
        socket.updateDBValues('pb_custom_card_save_' + card.id, payload, function () {
            var afterReload = function () {
                dispatchBotWsAfterCustomCardSave(sm, card, finish);
            };

            if (sm.reloadCommand && String(sm.reloadCommand).length > 0 && typeof socket.sendCommand === 'function') {
                dispatchReloadCommandWithWatchdog(modalId, card, sm, afterReload);
            } else {
                afterReload();
            }
        });
    }

    /**
     * Opens a Bootstrap settings modal using {@link helpers.getModal}, populated from the
     * manifest {@code settingsModal} block (flat {@code fields} or accordion {@code sections}).
     * Wraps the initial {@code getDBValues} round-trip in a watchdog timeout and runs any
     * {@code reloadCommand} via {@link dispatchReloadCommandWithWatchdog} so a hung bot
     * surfaces an explicit error rather than a silent hang.
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

        var modalId = 'pb-custom-game-settings-' + card.id;
        var tables = [];
        var keys = [];
        forEachFieldEntry(card.id, fieldsFlat, function (entry) {
            tables.push(entry.table);
            keys.push(entry.key);
        });

        var loadCallback = withWatchdog(ns.LOAD_TIMEOUT_MS, function () {
            if (typeof toastr !== 'undefined') {
                toastr.error(
                    'Settings did not load within ' +
                    Math.round(ns.LOAD_TIMEOUT_MS / 1000) +
                    ' seconds. The bot may be unresponsive.',
                    'Settings load timed out'
                );
            }
        }, function (results) {
            var $form = buildSettingsForm(card, sm, fieldsFlat, results || {});

            helpers.getModal(modalId, sm.title || 'Settings', 'Save', $form, function () {
                var payload = collectSaveData(card.id, fieldsFlat);
                if (payload === null) {
                    return;
                }
                dispatchSaveSequence(card, sm, modalId, payload, function () {
                    notifyCustomCardSettingsSaved(card);
                    $('#' + modalId).modal('toggle');
                    if (typeof toastr !== 'undefined') {
                        toastr.success('Successfully saved settings!');
                    }
                });
            }).modal('toggle');
        });

        socket.getDBValues('pb_custom_card_settings_' + card.id, {tables: tables, keys: keys}, true, loadCallback);
    };
}());
