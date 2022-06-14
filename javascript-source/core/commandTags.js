/*
 * Copyright (C) 2016-2022 phantombot.github.io/PhantomBot
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

/* global Packages */

(function () {
    var transformers = {};

    /*
     * @function unescapeTags
     * @export $
     * @param {string} args
     * @returns {string}
     */
    function escapeTags(args) {
        return args.replace(/([\\()])/g, '\\$1');
    }

    /*
     * @function unescapeTags
     *
     * @param {string} args
     */
    function unescapeTags(args) {
        return args.replace(/\\([\\()])/g, '$1');
    }

    function Transformer(tag, labels, transformer) {
        this.tag = $.jsString(tag).trim().toLowerCase();
        this.labels = [];
        this.transformer = transformer;
        this.hasLabel = function (label) {
            label = $.jsString(label);
            if (this.labels.length === 0 || label === undefined || label === null || label.length === 0) {
                return true;
            }
            
            return this.labels.includes(label.trim().toLowerCase());
        };
        this.hasAllLabels = function (labelSet) {
            if (labelSet.length === 0) {
                return true;
            }
            
            for (var i = 0; i < labelSet.length; i++) {
                if (!this.hasLabel(labelSet[i])) {
                    return false;
                }
            }
            
            return true;
        };
        this.hasAnyLabel = function (labelSet) {
            if (labelSet.length === 0) {
                return true;
            }
            
            for (var i = 0; i < labelSet.length; i++) {
                if (this.hasLabel(labelSet[i])) {
                    return true;
                }
            }
            
            return false;
        };

        if (labels !== undefined && labels !== null && labels.length !== undefined && labels.length !== null) {
            for (var i = 0; i < labels.length; i++) {
                this.labels.push($.jsString(labels[i]).trim().toLowerCase());
            }
        }
    }

    /*
     * @function tags
     * @export $
     * @param {string} event
     * @param {string} message
     * @param {bool} atEnabled
     * @param {object} localTransformers
     * @param {array or bool} globalTransformerLabels
     * @param {bool} allLabelsMode
     * @param {object} customArgs
     * @return {string}
     */
    function tags(event, message, atEnabled, localTransformers, globalTransformerLabels, allLabelsMode, customArgs) {
        var match,
                tagFound = false,
                transformed,
                transformCache = {};

        if (atEnabled === undefined) {
            atEnabled = false;
        }

        if (globalTransformerLabels === undefined) {
            globalTransformerLabels = [];
        }
        
        if (allLabelsMode === undefined) {
            allLabelsMode = false;
        }

        if (localTransformers === undefined) {
            localTransformers = {};
        }

        message = $.jsString(message);  // make sure this is a JS string, not a Java string
        while ((match = message.match(/(?:[^\\]|^)(\(([^\\\s\|=()]*)([\s=\|](?:\\\(|\\\)|[^()])*)?\))/))) {
            var wholeMatch = match[1],
                    tagName = match[2].toLowerCase(),
                    tagArgs = match[3] ? unescapeTags(match[3]) : '',
                    thisTagFound = false;
            if (transformCache.hasOwnProperty(wholeMatch)) {
                $.replace(message, wholeMatch, transformCache[wholeMatch]);
                thisTagFound = true;
            } else {
                if (localTransformers.hasOwnProperty(tagName)
                        && (transformed = localTransformers[tagName](tagArgs, event, customArgs))) {
                    thisTagFound = true;
                } else if (globalTransformerLabels !== true && transformers.hasOwnProperty(tagName)) {
                    if (globalTransformerLabels === false || (allLabelsMode && transformers[tagName].hasAllLabels(globalTransformerLabels))
                            || (!allLabelsMode && transformers[tagName].hasAnyLabel(globalTransformerLabels)))
                        if ((transformed = transformers[tagName].transformer(tagArgs, event, customArgs))) {
                            thisTagFound = true;
                        }
                }

                if (thisTagFound) {
                    tagFound = true;
                    if (transformed.hasOwnProperty('cancel') && transformed.cancel) {
                        return null;
                    }
                    if (!transformed.hasOwnProperty('raw') || !transformed.raw) {
                        transformed.result = escapeTags(transformed.result);
                    }
                    if (transformed.hasOwnProperty('cache') && transformed.cache) {
                        transformCache[wholeMatch] = transformed.result;
                        message = $.replace(message, wholeMatch, transformed.result);
                    } else {
                        // only replace the first appearance
                        message = message.replace(wholeMatch, transformed.result);
                    }
                }
            }

            if (!thisTagFound) {
                message = $.replace(message, wholeMatch, '\\(' + wholeMatch.slice(1, -1) + '\\)');
            }
        }

        // custom commands without tags can be directed towards users by mods
        if (tagFound === -1
                && atEnabled
                && event.getArgs()[0] !== undefined
                && $.checkUserPermission(event.getSender(), event.getTags(), $.PERMISSION.Mod)) {
            return event.getArgs()[0] + ' -> ' + unescapeTags(message);
        }

        message = unescapeTags(message);

        if (message) {
            if (message.match('\n')) {
                var splitMessage = message.split('\n');

                for (var i = 0; i < splitMessage.length && i <= 4; ++i) {
                    $.say(splitMessage[i]);
                }
                return null;
            }
        }

        return message;
    }

    /*
     * @function addTagTransformer
     * @export $
     * @param {string} tag
     * @param {function} transformer
     */
    function addTagTransformer(tag, transformer) {
        addTransformer(new Transformer(tag, [], transformer));
    }

    function addTransformer(transformer) {
        transformers[transformer.tag] = transformer;
    }
    
    function addTransformers(transformerSet) {
        for (var i = 0; i < transformerSet.length; i++) {
            addTransformer(transformerSet[i]);
        }
    }

    function getTransformers() {
        return transformers;
    }

    function getTransformer(tag) {
        return transformers[tag.toLowerCase()];
    }

    function getTransformersByLabel(label) {
        var result = [];
        for (var i = 0; i < transformers.length; i++) {
            if (transformers[i].hasLabel(label)) {
                result.push(transformers[i]);
            }
        }
        
        return result;
    }
    
    function getTransformersWithAllLabels(labelSet) {
        var result = [];
        for (var i = 0; i < transformers.length; i++) {
            if (transformers[i].hasAllLabels(labelSet)) {
                result.push(transformers[i]);
            }
        }
        
        return result;
    }
    
    function getTransformersWithAnyLabel(labelSet) {
        var result = [];
        for (var i = 0; i < transformers.length; i++) {
            if (transformers[i].hasAnyLabel(labelSet)) {
                result.push(transformers[i]);
            }
        }
        
        return result;
    }

    $.tags = tags;
    $.escapeTags = escapeTags;
    $.addTagTransformer = addTagTransformer;
    $.transformers = {
        tags: tags,
        transformer: Transformer,
        addTransformer: addTransformer,
        addTransformers: addTransformers,
        escapeTags: escapeTags,
        unescapeTags: unescapeTags,
        getTransformers: getTransformers,
        getTransformer: getTransformer,
        getTransformersByLabel: getTransformersByLabel,
        getTransformersWithAllLabels: getTransformersWithAllLabels,
        getTransformersWithAnyLabel: getTransformersWithAnyLabel
    };
})();
