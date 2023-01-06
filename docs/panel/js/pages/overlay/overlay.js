/*
 * Copyright (C) 2016-2023 phantombot.github.io/PhantomBot
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
$(function () {
    // Constants
    // Meta information for the database and to connect it to HTML
    const moduleId = 'overlay';
    const databaseModuleId = 'overlay_module';
    const moduleConfigTable = 'overlay';
    const formId = 'alertsOverlayModule';
    const outputElementId = 'overlayUrl';

    // Config entries
    const enableAudioHooks = 'enableAudioHooks';
    const audioHookVolume = 'audioHookVolume';
    const enableFlyingEmotes = 'enableFlyingEmotes';
    const enableGifAlerts = 'enableGifAlerts';
    const gifAlertVolume = 'gifAlertVolume';
    const enableVideoClips = 'enableVideoClips';
    const videoClipVolume = 'videoClipVolume';
    const enableDebug = 'enableDebug';

    // members
    let inputElements = null;
    let outputElement = null;

    function init() {
        // This module cannot be enabled or disabled since it provides a resource and just helps to configure
        // this resource file. The stored values are just the last used settings.
        socket.getDBValues(databaseModuleId, {
            tables: [
                moduleConfigTable, moduleConfigTable, moduleConfigTable,
                moduleConfigTable, moduleConfigTable, moduleConfigTable,
                moduleConfigTable, moduleConfigTable
            ],
            keys: [
                enableAudioHooks, audioHookVolume, enableFlyingEmotes,
                enableGifAlerts, gifAlertVolume, enableDebug,
                enableVideoClips, videoClipVolume
            ]
        }, true, function (config) {
            // handle boolean values
            [
                enableAudioHooks,
                enableFlyingEmotes,
                enableGifAlerts,
                enableVideoClips,
                enableDebug
            ].forEach((key) => {
                let inputNode = document.getElementById(moduleId + key[0].toUpperCase() + key.slice(1));
                // only accept 'true' and 'false' as valid
                if (config[key] === 'true' || config[key] === 'false') {
                    inputNode.checked = config[key] === 'true';
                } else {
                    // set the default value otherwise
                    inputNode.checked = inputNode.defaultChecked;
                }
            });
            // handle decimals
            [audioHookVolume, gifAlertVolume, videoClipVolume].forEach((key) => {
                let inputNode = document.getElementById(moduleId + key[0].toUpperCase() + key.slice(1));
                // Convert the value to a String and then to number to validate it
                // and use the default value, if it's invalid
                let value = Number(String(config[key]));
                inputNode.value = isNaN(value) ? inputNode.placeholder : value;
            });
        });

        // Connect DOM to Code

        outputElement = document.forms[formId][outputElementId];
        // get a list of all elements that should get an event listener on their change to trigger an update of the url
        inputElements = document.forms[formId].getElementsByClassName('trigger-update');

        Array.prototype.forEach.call(inputElements, (element) => {
            element.addEventListener("change", () => {
                buildOverlayUrl();
                window.helpers.debounce(function () {
                    save();
                }, 1000)();
            });
        });

        // finally generate the url once
        buildOverlayUrl();
    }


    function buildOverlayUrl() {
        socket.doRemote('overlay_ssl_settings', 'sslSettings', null, function (d) {
            outputElement.value = `${helpers.getBotSchemePath(d)}/alerts?`;
            let stringSettings = Array.prototype.filter.call(inputElements, (element) => element.type !== 'checkbox')
                    .map((element) => {
                        let name = element.id.slice(moduleId.length);
                        return `${name[0].toLowerCase()}${name.slice(1)}=${element.value}`;
                    })
                    .join('&');
            let booleanSettings = Array.prototype.filter.call(inputElements, (element) => element.type === 'checkbox')
                    .map((element) => {
                        let name = element.id.slice(moduleId.length);
                        return `${name[0].toLowerCase()}${name.slice(1)}=${element.checked}`;
                    })
                    .join('&');
            outputElement.value += stringSettings + '&' + booleanSettings;
        });
    }

    function save() {
        // Collect values from the form with special caution to checkbox elements
        let keysStrings = [audioHookVolume, gifAlertVolume, videoClipVolume];
        let keysCheckboxes = [enableAudioHooks, enableFlyingEmotes, enableGifAlerts, enableVideoClips, enableDebug];
        let valuesStrings = keysStrings.map(key => inputElements[moduleId + key[0].toUpperCase() + key.slice(1)].value);
        let valuesCheckboxes = keysCheckboxes.map(key => inputElements[moduleId + key[0].toUpperCase() + key.slice(1)].checked);
        let keys = keysStrings.concat(keysCheckboxes);
        let values = valuesStrings.concat(valuesCheckboxes);
        // Save the values in the database omitting the success callback because value changes can happen often and fast
        socket.updateDBValues(databaseModuleId, {
            tables: [
                moduleConfigTable, moduleConfigTable, moduleConfigTable,
                moduleConfigTable, moduleConfigTable, moduleConfigTable,
                moduleConfigTable, moduleConfigTable
            ],
            keys: keys,
            values: values
        }, () => {
        });
    }

    init();
});