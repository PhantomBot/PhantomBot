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

(function () {
    var transformers = {};

    /*
     * transformer function definition
     *
     * function(tagArgs, event, customArgs)
     *
     * param {string} tagArgs - any arguments provided in the tag itself
     * * Example: (mytag arg1 arg2 arg3) - tagArgs = 'arg1 arg2 arg3'
     *
     * param {javaObject[tv.phantombot.event.Event]} event - the event object which triggered the caller of the tag processor, such as CommandEvent
     *
     * param {object} customArgs - a js object which can contain arbitrary arguments defined by the caller
     *
     * return {object}     {
     *                         result: string or null // the returned value. The tag being processed will be replaced with this value, if a valid string is returned (including empty string)
     *                         cancel: boolean // default: false. Set `true` to cancel further tag processing and return null to the caller
     *                         raw: boolean // default: false. If set to `false`, the value of `result` will be escaped, preventing processing of any tags that may be contained in `result`
     *                         cache: boolean // default: false. If set to `true` the value of `result` is temporarily cached. This means that processing is not repeated if the exact same tag appears multiple times in the same input message. The cache is erased after the input message is processed
     *                     }
     */

    /*
     * @function transformer
     * @description constructor for an object representing a tag transformer
     * @export $.transformers
     * @param {string} tag - the name of the tag to be matched, triggering this transformer
     * @param {array[string]} labels - the labels that categorize where this transformer works and what category of function it performs
     * @param {function} transformer - the function which performs transformation
     */
    function Transformer(tag, labels, transformer) {
        this.tag = $.jsString(tag).trim().toLowerCase();
        this.labels = [];
        this.transformer = transformer;

        /*
         * @function hasLabel
         * @description indicates if the specified label is present in this.labels. Always returns true if undefined, null, or empty string. Always returns true if this.labels is empty
         * @export Transformer
         * @param {string} label - the label to check
         * @returns {boolean}
         */
        this.hasLabel = function (label) {
            label = $.jsString(label);
            if (this.labels.length === 0 || label === undefined || label === null || label.length === 0) {
                return true;
            }

            return this.labels.includes(label.trim().toLowerCase());
        };

        /*
         * @function hasAllLabels
         * @description indicates if this.labels contains all labels in `labelSet`. Always returns true if length is 0. Always returns true if this.labels is empty
         * @export Transformer
         * @param {array[string]} labelSet - the set of labels to check
         * @returns {boolean}
         */
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

        /*
         * @function hasAllLabels
         * @description indicates if this.labels contains at least one label in `labelSet`. Always returns true if length is 0. Always returns true if this.labels is empty
         * @export Transformer
         * @param {array[string]} labelSet - the set of labels to check
         * @returns {boolean}
         */
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
     * @description processes tags using transformers and returns the result
     * @export $.transformers
     * @param {javaObject[tv.phantombot.event.Event]} event - the event object which triggered the caller of the tag processor, such as CommandEvent
     * @param {string} message - the input message containing tags to be processed
     * @param {bool} atEnabled - default false. If set `true`, no tags are found to process, the sender is a moderator, and at least one argument is present, responds with `argument1 -> message`
     * @param {array[string]} globalTransformerRequiredLabels - default ['twitch']. A set of required labels. Only transformers which have all labels in this set will be processed
     * @param {array[string]} globalTransformerAnyLabels - default []. A set of labels. Only transformers which have at least one label in this set will be processed
     * @param {object[string->function]} localTransformers - a js object of custom transformers defined by the caller
     * @param {object} customArgs - an arbitrary js object containing custom arguments to pass to transformers which support them
     * @return {string or null}
     */
    function tags(event, message, atEnabled, globalTransformerRequiredLabels, globalTransformerAnyLabels, localTransformers, customArgs) {
        var match,
                tagFound = false,
                transformed,
                transformCache = {};

        if (atEnabled === undefined || atEnabled === null) {
            atEnabled = false;
        }

        if (globalTransformerRequiredLabels === undefined || globalTransformerRequiredLabels === null) {
            globalTransformerRequiredLabels = ['twitch', 'command'];
        }

        if (globalTransformerAnyLabels === undefined || globalTransformerAnyLabels === null) {
            globalTransformerAnyLabels = [];
        }

        if (localTransformers === undefined || localTransformers === null) {
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
                } else if (transformers.hasOwnProperty(tagName) && transformers[tagName].hasAllLabels(globalTransformerRequiredLabels)
                        && transformers[tagName].hasAnyLabel(globalTransformerAnyLabels)
                        && (transformed = transformers[tagName].transformer(tagArgs, event, customArgs))) {
                    thisTagFound = true;
                }

                if (thisTagFound) {
                    tagFound = true;
                    if (transformed.hasOwnProperty('result') && transformed.result !== null) {
                        transformed.result = $.jsString(transformed.result);
                    } else {
                        transformed.result = '';
                    }
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
        if (!tagFound && atEnabled && event.getArgs()[0] !== undefined && $.checkUserPermission(event.getSender(), event.getTags(), $.PERMISSION.Mod)) {
            return $.jsString(event.getArgs()[0]) + ' -> ' + unescapeTags(message);
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
     * @function escapeTags
     * @description escapes tags to prevent processing
     * @export $.transformers
     * @param {string} args - a string to escape
     * @returns {string}
     */
    function escapeTags(args) {
        return args.replace(/([\\()])/g, '\\$1');
    }

    /*
     * @function unescapeTags
     * @description unescapes tags to allow processing
     * @export $.transformers
     * @param {string} args - a string to unescape
     * @returns {string}
     */
    function unescapeTags(args) {
        return args.replace(/\\([\\()])/g, '$1');
    }

    /*
     * @deprecated
     */
    function legacyAddTransformer(tag, transformer) {
        addTransformer(new Transformer(tag, [], transformer));
    }

    /*
     * @function addTransformer
     * @description adds a transformer to the global transformer list
     * @export $.transformers
     * @param {transformer} transformer - a transformer object constructed from $.transformers.transformer
     */
    function addTransformer(transformer) {
        transformers[transformer.tag] = transformer;
    }

    /*
     * @function addTransformers
     * @description adds multiple transformers to the global transformer list
     * @export $.transformers
     * @param {array[transformer]} transformerSet - an array of transformer objects constructed from $.transformers.transformer
     */
    function addTransformers(transformerSet) {
        for (var i = 0; i < transformerSet.length; i++) {
            addTransformer(transformerSet[i]);
        }
    }

    /*
     * @function getTransformers
     * @description returns the global transformer list
     * @export $.transformers
     * @returns {object[string->transformer]}
     */
    function getTransformers() {
        return transformers;
    }

    /*
     * @function getTransformer
     * @description returns the specified transformer from the global transformer list
     * @export $.transformers
     * @param {string} tag - the transformer to retrieve
     * @returns {transformer}
     */
    function getTransformer(tag) {
        return transformers[tag.toLowerCase()];
    }

    /*
     * @function getTransformersWithLabel
     * @description returns all transformers which contain the specified label from the global transformer list
     * @export $.transformers
     * @param {string} label - the label to find
     * @returns {array[transformer]}
     */
    function getTransformersWithLabel(label) {
        var result = [];
        for (var i = 0; i < transformers.length; i++) {
            if (transformers[i].hasLabel(label)) {
                result.push(transformers[i]);
            }
        }

        return result;
    }

    /*
     * @function getTransformersWithAllLabels
     * @description returns all transformers which contain all labels in `labelSet` from the global transformer list
     * @export $.transformers
     * @param {array[string]} labelSet - the labels to find
     * @returns {array[transformer]}
     */
    function getTransformersWithAllLabels(labelSet) {
        var result = [];
        for (var i = 0; i < transformers.length; i++) {
            if (transformers[i].hasAllLabels(labelSet)) {
                result.push(transformers[i]);
            }
        }

        return result;
    }

    /*
     * @function getTransformersWithAnyLabel
     * @description returns all transformers which contain at least one label in `labelSet` from the global transformer list
     * @export $.transformers
     * @param {array[string]} labelSet - the labels to find
     * @returns {array[transformer]}
     */
    function getTransformersWithAnyLabel(labelSet) {
        var result = [];
        for (var i = 0; i < transformers.length; i++) {
            if (transformers[i].hasAnyLabel(labelSet)) {
                result.push(transformers[i]);
            }
        }

        return result;
    }

    /*
     * @deprecated
     */
    function legacyTags(event, message, atEnabled, localTransformers, disableGlobalTransformers) {
        var globalRequired = [];
        if (disableGlobalTransformers === true) {
            globalRequired.push('local');
        } else {
            globalRequired.push('twitch');
            globalRequired.push('command');
        }

        return tags(event, message, atEnabled, globalRequired, [], localTransformers, null);
    }

    $.tags = legacyTags; // @deprecated export
    $.escapeTags = escapeTags; // @deprecated export
    $.addTagTransformer = legacyAddTransformer; // @deprecated export
    $.transformers = {
        tags: tags,
        transformer: Transformer,
        addTransformer: addTransformer,
        addTransformers: addTransformers,
        escapeTags: escapeTags,
        unescapeTags: unescapeTags,
        getTransformers: getTransformers,
        getTransformer: getTransformer,
        getTransformersWithLabel: getTransformersWithLabel,
        getTransformersWithAllLabels: getTransformersWithAllLabels,
        getTransformersWithAnyLabel: getTransformersWithAnyLabel
    };
})();
