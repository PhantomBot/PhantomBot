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

/* global Packages */

(function () {
    let transformers = {},
            tagPattern = Packages.java.util.regex.Pattern.compile("(?:[^\\\\]|^)(\\(([^\\\\\\s\\|=()]*)([\\s=\\|](?:\\\\\\(|\\\\\\)|[^()])*)?(?<!\\\\)\\))"),
            _lock = new Packages.java.util.concurrent.locks.ReentrantLock(),
            debugon = true;

    function debug(str) {
        if (debugon) {
            $.consoleDebug(str);
        }
    }

    /*
     * transformer function definition
     *
     * function(args)
     *
     * param {object} args - a js object that may contain any of the following params
     *
     *
     * param {jsString} tagArgs - any arguments provided in the tag itself
     * * Example: (mytag arg1 arg2 arg3) - tagArgs = 'arg1 arg2 arg3'
     *
     * param {jsString} tag - the name of the tag
     *
     * param {javaObject[T extends tv.phantombot.event.Event]} event - the event object which triggered the caller of the tag processor,
     *              such as a CommandEvent
     *
     * param {jsObject} customArgs - a js object which can contain arbitrary arguments defined by the caller
     *
     * param {jsArray[jsString]} globalTransformerRequiredLabels - the input to the globalTransformerRequiredLabels argument from $.transformers.tags
     *
     * param {jsArray[jsString]} globalTransformerAnyLabels - the input to the globalTransformerAnyLabels argument from $.transformers.tags
     *
     * param {jsString} platform - identifies the platform that triggered the command. Valid values: 'twitch', 'discord'
     *
     * return {jsObject}     {
     *                         result: {jsString or null}, // default: ''. the returned value. The tag being processed will be replaced with this
     *                                                     //     value, if a valid string is returned (including empty string)
     *                         cancel: {boolean},          // default: false. Set `true` to cancel further tag processing and return null to the caller
     *                         raw: {boolean},             // default: false. If set to `false`, the value of `result` will be escaped, preventing
     *                                                     //     processing of any tags that may be contained in `result`
     *                         cache: {boolean}            // default: false. If set to `true` the value of `result` is temporarily cached. This means
     *                                                     //     that processing is not repeated if the exact same tag appears multiple times in the
     *                                                     //     same input message. The cache is erased after the input message is processed
     *                     }
     */

    /*
     * @function transformer
     * @description constructor for an object representing a tag transformer
     * @export $.transformers
     * @param {string} tag - the name of the tag to be matched, triggering this transformer
     * @param {jsArray[jsString]} labels - the labels that categorize where this transformer works and what category of function it performs
     * @param {function} transformer - the function which performs transformation
     */
    function Transformer(tag, labels, transformer) {
        this.tag = $.jsString(tag).trim().toLowerCase();
        this.labels = [];
        this.transformer = transformer;

        /*
         * @function hasLabel
         * @description indicates if the specified label is present in this.labels. Always returns true if undefined, null, or empty string.
         *                      Always returns true if this.labels is empty
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
         * @description indicates if this.labels contains all labels in `labelSet`. Always returns true if length is 0. Always returns true if
         *                      this.labels is empty
         * @export Transformer
         * @param {jsArray[jsString]} labelSet - the set of labels to check. Can contain sub-arrays which will create an `or` between all
         *      possible combinations by using transformer.hasAnyLabel on the sub-array. ex. ['twitch', ['commandevent', 'noevent']] will effectively
         *      create the check ['twitch', 'commandevent'] || ['twitch', 'noevent']
         * @returns {boolean}
         */
        this.hasAllLabels = function (labelSet) {
            if (labelSet.length === 0) {
                return true;
            }

            for (var i = 0; i < labelSet.length; i++) {
                if (Array.isArray(labelSet[i])) {
                    if (!this.hasAnyLabel(labelSet[i])) {
                        return false;
                    }
                } else if (!this.hasLabel(labelSet[i])) {
                    return false;
                }
            }

            return true;
        };

        /*
         * @function hasAnyLabel
         * @description indicates if this.labels contains at least one label in `labelSet`. Always returns true if length is 0. Always returns true
         *                      if this.labels is empty
         * @export Transformer
         * @param {jsArray[jsString]} labelSet - the set of labels to check
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
     * @param {jsArray[jsString]} globalTransformerRequiredLabels - default ['twitch', ['commandevent', 'noevent']]. A set of required labels. Only
     *                              transformers which have all labels in this set will be processed.
     *                              A sub-array in a particular position creates an `or` between all possible combinations
     * @param {object} args - a js object containing any of the below parameters
     * @param {bool} atEnabled - default false. If set `true`, no tags are found to process, the sender is a moderator, and at least one argument is
     *                              present, responds with `argument1 -> message`
     * @param {jsArray[jsString]} globalTransformerAnyLabels - default []. A set of labels. Only transformers which have at least one label in this set
     *                              will be processed
     * @param {object[string->function]} localTransformers - a js object of custom transformers defined by the caller
     * @param {object} customArgs - an arbitrary js object containing custom arguments to pass to transformers which support them
     * @param {string} platform - identifies the platform that triggered the command. Valid values: 'twitch', 'discord'. Default: 'twitch'
     * @return {string or null}
     */
    function tags(event, message, globalTransformerRequiredLabels, args) {
        debug('tags');
        let tagFound = false,
                transformed,
                transformCache = {};

        if (args === undefined || args === null) {
            args = {};
        }

        if (args.atEnabled === undefined || args.atEnabled === null) {
            args.atEnabled = false;
        }

        if (globalTransformerRequiredLabels === undefined || globalTransformerRequiredLabels === null) {
            globalTransformerRequiredLabels = ['twitch', ['commandevent', 'noevent']];
        }

        if (args.globalTransformerAnyLabels === undefined || args.globalTransformerAnyLabels === null) {
            args.globalTransformerAnyLabels = [];
        }

        if (args.localTransformers === undefined || args.localTransformers === null) {
            args.localTransformers = {};
        }

        if (args.platform === undefined || args.platform === null) {
            args.platform = 'twitch';
        }

        message = $.jsString(message);  // make sure this is a JS string
        debug(message);

        let globalTransformers = getTransformers();

        let matcher = tagPattern.matcher($.javaString(message));
        while (matcher.find()) {
            let wholeMatch = $.jsString(matcher.group(1)),
                    tagName = $.jsString(matcher.group(2)).toLowerCase(),
                    tagArgs = {
                        event: event,
                        tag: tagName,
                        args: matcher.group(3) !== null ? unescapeTags($.jsString(matcher.group(3))) : '',
                        customArgs: args.customArgs,
                        globalTransformerRequiredLabels: globalTransformerRequiredLabels,
                        globalTransformerAnyLabels: args.globalTransformerAnyLabels,
                        platform: args.platform.toLowerCase()
                    },
                    thisTagFound = false;
                    if (debugon) {
                        debug('>>');
                        debug('wholeMatch=' + wholeMatch);
                        debug('tagArgs=' + JSON.stringify(tagArgs));
                    }
            if (transformCache.hasOwnProperty(wholeMatch)) {
                debug('cached');
                message = $.replace(message, wholeMatch, transformCache[wholeMatch]);
                thisTagFound = true;
            } else {
                _lock.lock();
                try {
                    if (args.localTransformers.hasOwnProperty(tagName)
                            && (transformed = args.localTransformers[tagName](tagArgs))) {
                        debug('local');
                        thisTagFound = true;
                    } else if (globalTransformers.hasOwnProperty(tagName) && globalTransformers[tagName].hasAllLabels(globalTransformerRequiredLabels)
                            && globalTransformers[tagName].hasAnyLabel(args.globalTransformerAnyLabels)
                            && (transformed = globalTransformers[tagName].transformer(tagArgs))) {
                        debug('global');
                        thisTagFound = true;
                    }
                } finally {
                    _lock.unlock();
                }

                if (thisTagFound) {
                    tagFound = true;
                    if (transformed === undefined || transformed === null) {
                        debug('tag did not return');
                        transformed = {};
                    }
                    if (transformed.hasOwnProperty('result') && transformed.result !== null) {
                        transformed.result = $.jsString(transformed.result);
                    } else {
                        debug('no result');
                        transformed.result = '';
                    }
                    if (transformed.hasOwnProperty('cancel') && transformed.cancel) {
                        debug('cancel');
                        return null;
                    }
                    if (!transformed.hasOwnProperty('raw') || !transformed.raw) {
                        transformed.result = escapeTags(transformed.result);
                    } else {
                        debug('raw');
                    }
                    if (transformed.hasOwnProperty('cache') && transformed.cache) {
                        debug('cache');
                        transformCache[wholeMatch] = transformed.result;
                        message = $.replace(message, wholeMatch, transformed.result);
                    } else {
                        // only replace the first appearance
                        message = message.replace(wholeMatch, transformed.result);
                    }
                    if (debugon) {
                        debug('result=' + JSON.stringify(transformed));
                        debug('message=' + message);
                    }
                }
            }

            if (!thisTagFound) {
                debug('!found');
                message = $.replace(message, wholeMatch, '\\(' + wholeMatch.slice(1, -1) + '\\)');
            }

            matcher.reset($.javaString(message));
        }

        // custom commands without tags can be directed towards users by mods
        if (!tagFound && args.atEnabled && event.getArgs()[0] !== undefined && $.checkUserPermission(event.getSender(), event.getTags(), $.PERMISSION.Mod)) {
            debug('atUser');
            // Split the message into parts
            let part = message.split(' ');
            // Check if the command is written in color ('/me ')
            if (part[0] !== undefined && part[0] === '/me') {
                //  remove '/me ' if present
                message = message.replace('/me ', '');
                //  write '/me ' at the beginning of the message
                return '/me ' + $.jsString(event.getArgs()[0]) + ' -> ' + unescapeTags(message);
            }

            return $.jsString(event.getArgs()[0]) + ' -> ' + unescapeTags(message);

        }

        message = unescapeTags(message).trim();
        debug('final message: ' + message);
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
        addTransformer(new Transformer(tag, ['twitch', 'commandevent', 'legacy'], transformer));
    }

    /*
     * @function addTransformer
     * @description adds a transformer to the global transformer list
     * @export $.transformers
     * @param {transformer} transformer - a transformer object constructed from $.transformers.transformer
     */
    function addTransformer(transformer) {
        _lock.lock();
        try {
            transformers[transformer.tag] = transformer;
        } finally {
            _lock.unlock();
        }
    }

    /*
     * @function addTransformers
     * @description adds multiple transformers to the global transformer list
     * @export $.transformers
     * @param {jsArray[transformer]} transformerSet - an array of transformer objects constructed from $.transformers.transformer
     */
    function addTransformers(transformerSet) {
        for (let i = 0; i < transformerSet.length; i++) {
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
        let ret = {};
        _lock.lock();
        try {
            for (let x in transformers) {
                ret[x] = transformers[x];
            }
        } finally {
            _lock.unlock();
        }

        return ret;
    }

    /*
     * @function getTransformer
     * @description returns the specified transformer from the global transformer list
     * @export $.transformers
     * @param {string} tag - the transformer to retrieve
     * @returns {transformer}
     */
    function getTransformer(tag) {
        _lock.lock();
        try {
            return transformers[tag.toLowerCase()];
        } finally {
            _lock.unlock();
        }
    }

    /*
     * @function getTransformersWithLabel
     * @description returns all transformers which contain the specified label from the global transformer list
     * @export $.transformers
     * @param {string} label - the label to find
     * @returns {jsArray[transformer]}
     */
    function getTransformersWithLabel(label) {
        let result = [];
        _lock.lock();
        try {
            for (let x in transformers) {
                if (transformers[x].hasLabel(label)) {
                    result.push(transformers[x]);
                }
            }
        } finally {
            _lock.unlock();
        }

        return result;
    }

    /*
     * @function getTransformersWithAllLabels
     * @description returns all transformers which contain all labels in `labelSet` from the global transformer list
     * @export $.transformers
     * @param {jsArray[jsString]} labelSet - the labels to find
     * @returns {jsArray[transformer]}
     */
    function getTransformersWithAllLabels(labelSet) {
        let result = [];
        _lock.lock();
        try {
            for (let x in transformers) {
                if (transformers[x].hasAllLabels(labelSet)) {
                    result.push(transformers[x]);
                }
            }
        } finally {
            _lock.unlock();
        }

        return result;
    }

    /*
     * @function getTransformersWithAnyLabel
     * @description returns all transformers which contain at least one label in `labelSet` from the global transformer list
     * @export $.transformers
     * @param {jsArray[jsString]} labelSet - the labels to find
     * @returns {jsArray[transformer]}
     */
    function getTransformersWithAnyLabel(labelSet) {
        let result = [];
        _lock.lock();
        try {
            for (let x in transformers) {
                if (transformers[x].hasAnyLabel(labelSet)) {
                    result.push(transformers[x]);
                }
            }
        } finally {
            _lock.unlock();
        }

        return result;
    }

    /*
     * @deprecated
     */
    function legacyTags(event, message, atEnabled, localTransformers, disableGlobalTransformers) {
        let globalRequired = [];
        if (disableGlobalTransformers === true) {
            globalRequired.push('local');
        } else {
            globalRequired.push('twitch');
            globalRequired.push(['commandevent', 'noevent']);
        }

        return tags(event, message, globalRequired, {atEnabled: atEnabled, localTransformers: localTransformers});
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
