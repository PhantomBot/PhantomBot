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
    let currentPrediction = null;
    let isCommandPrediction = false;

    /*
     * @event eventSubPredictionBegin
     */
    $.bind('eventSubPredictionBegin', function (event) {
        if ($.jsString(event.event().broadcasterUserId()) === $.jsString($.username.getIDCaster())) {
            let prediction = null;

            try {
                prediction = {
                    id: $.jsString(event.event().id()),
                    title: $.jsString(event.event().title()),
                    outcomes: [],
                    locked: false
                };

                for (let i = 0; i < event.event().outcomes().size(); i++) {
                    prediction.outcomes.push({
                        index: i + 1,
                        id: $.jsString(event.event().outcomes().get(i).id()),
                        title: $.jsString(event.event().outcomes().get(i).title())
                    });
                }
            } catch (e) {
                prediction = null;
                $.log.error(e);
            }

            if (prediction !== null) {
                currentPrediction = prediction;

                if (isCommandPrediction) {
                    let msg = $.lang.get('predictionhandler.open.header', currentPrediction.title);

                    for (let i in currentPrediction.outcomes) {
                        msg += $.lang.get('predictionhandler.option', currentPrediction.outcomes[i].index, currentPrediction.outcomes[i].title);
                    }

                    $.say(msg);
                }
            }
        }
    });

    /*
     * @event eventSubPredictionEnd
     */
    $.bind('eventSubPredictionEnd', function (event) {
        if ($.jsString(event.event().broadcasterUserId()) === $.jsString($.username.getIDCaster())) {
            try {
                if (currentPrediction !== null && isCommandPrediction) {
                    if (event.event().status() === Packages.com.gmt2001.twitch.eventsub.subscriptions.channel.prediction.PredictionEnd.Status.RESOLVED) {
                        let winningOutcomeId = $.jsString(event.event().winningOutcomeId());
                        let winningOutcome = null;

                        for (let i in currentPrediction.outcomes) {
                            if (currentPrediction.outcomes[i].id === winningOutcomeId) {
                                winningOutcome = currentPrediction.outcomes[i];
                            }
                        }

                        if (winningOutcome !== null) {
                            $.say($.lang.get('predictionhandler.resolve', currentPrediction.title, winningOutcome.title));
                        }
                    } else {
                        $.say($.lang.get('predictionhandler.cancel'));
                    }
                }
            } catch (e) {
                $.log.error(e);
            }

            currentPrediction = null;
            isCommandPrediction = false;
        }
    });

    /*
     * @event eventSubPredictionLock
     */
    $.bind('eventSubPredictionLock', function (event) {
        if ($.jsString(event.event().broadcasterUserId()) === $.jsString($.username.getIDCaster())) {
            if (currentPrediction !== null) {
                currentPrediction.locked = true;

                if (isCommandPrediction) {
                    $.say($.lang.get('predictionhandler.lock'));
                }
            }
        }
    });

    function subscribeEventSub() {
        let subscriptions = [
            Packages.com.gmt2001.twitch.eventsub.subscriptions.channel.prediction.PredictionBegin,
            Packages.com.gmt2001.twitch.eventsub.subscriptions.channel.prediction.PredictionEnd,
            Packages.com.gmt2001.twitch.eventsub.subscriptions.channel.prediction.PredictionLock
        ];

        for (let i in subscriptions) {
            let newSubscription = new subscriptions[i]($.username.getIDCaster());
            try {
                newSubscription.create().block();
            } catch (ex) {
                $.log.error(ex);
            }
        }
    }

    function sync() {
        try {
            let response = $.helix.getPredictions(null, 1, null);

            if (response.has('data') && response.getJSONArray('data').length() > 0) {
                let activeprediction = response.getJSONArray('data').getJSONObject(0);
                if (!activeprediction.isNull('ended_at')) {
                    currentPrediction = null;
                } else {
                    let prediction = {
                        id: $.jsString(activeprediction.getString('id')),
                        title: $.jsString(activeprediction.getString('title')),
                        outcomes: [],
                        locked: !activeprediction.isNull('locked_at')
                    };

                    let outcomes = activeprediction.getJSONArray('outcomes');
                    for (let i = 0; i < outcomes.length(); i++) {
                        prediction.outcomes.push({
                            index: i + 1,
                            id: $.jsString(outcomes.getJSONObject(i).getString('id')),
                            title: $.jsString(outcomes.getJSONObject(i).getString('title'))
                        });
                    }

                    currentPrediction = prediction;
                }
            }
        } catch (e) {}
    }

    $.bind('twitchBroadcasterType', function(event) {
        if (!event.wasAffiliateOrPartner() && event.isAffiliateOrPartner()) {
            subscribeEventSub();
            sync();
        }
    });

    /*
     * @event eventSubWelcome
     */
    $.bind('eventSubWelcome', function (event) {
        if (!event.isReconnect()) {
            if (!$.twitchcache.isAffiliateOrPartner()) {
                return;
            }

            subscribeEventSub();
        }
    });

    /*
     * @event command
     */
    $.bind('command', function (event) {
        let sender = event.getSender(),
            command = $.jsString(event.getCommand(), '').toLowerCase(),
            args = $.jsArgs(event.getArgs());

            if (command === 'prediction') {
                if (!$.twitchcache.isAffiliateOrPartner()) {
                    return;
                }

                let handled = false;
                if (args.length > 0) {
                    let action = args[0].toLowerCase();
                    let subaction = args.length > 1 ? args[1].toLowerCase() : null;
                    if (subaction === 'example' && $.lang.exists('predictionhandler.' + action + '.example')) {
                        handled = true;
                        $.say($.whisperPrefix(sender) + $.lang.get('predictionhandler.' + action + '.example'));
                    } else if (subaction === 'usage' && $.lang.exists('predictionhandler.' + action + '.usage')) {
                        handled = true;
                        $.say($.whisperPrefix(sender) + $.lang.get('predictionhandler.' + action + '.usage'));
                    } else if (action === 'open') {
                        handled = true;
                        if (args.length < 5 || args[2].trim().length === 0 || args[3].trim().length === 0 || args[4].trim().length === 0) {
                            $.say($.whisperPrefix(sender) + $.lang.get('predictionhandler.open.usage'));
                        } else if (args.length > 13) {
                            $.say($.whisperPrefix(sender) + $.lang.get('predictionhandler.open.toomanyoptions'));
                        } else {
                            try {
                                let choices = new Packages.java.util.ArrayList();

                                for (let i = 3; i < args.length; i++) {
                                    choices.add($.javaString(args[i]));
                                }

                                let response = $.helix.createPrediction($.javaString(args[2]), $.duration(args[1]), choices);

                                if (response.has('data') && response.getJSONArray('data').length() > 0) {
                                    isCommandPrediction = true;
                                } else if (response.has('message')) {
                                    $.log.error(response.getString('message'));
                                } else {
                                    $.log.error('!prediction open - unknown failure ## ' + response.toString());
                                }
                            } catch (e) {
                                $.log.error(e);
                            }
                        }
                    } else if (action === 'options') {
                        handled = true;
                        if (currentPrediction === null) {
                            $.say($.whisperPrefix(sender) + $.lang.get('predictionhandler.404'));
                        } else {
                            let msg = $.lang.get('predictionhandler.options.header');

                            for (let i in currentPrediction.outcomes) {
                                msg += $.lang.get('predictionhandler.option', currentPrediction.outcomes[i].index, currentPrediction.outcomes[i].title);
                            }

                            $.say(msg);
                        }
                    } else if (action === 'lock') {
                        handled = true;
                        if (currentPrediction === null) {
                            $.say($.whisperPrefix(sender) + $.lang.get('predictionhandler.404'));
                        } else {
                            try {
                                let response = $.helix.endPrediction($.javaString(currentPrediction.id), Packages.tv.phantombot.twitch.api.Helix.PredictionStatus.LOCKED, null);

                                if (response.has('data') && response.getJSONArray('data').length() > 0) {
                                    isCommandPrediction = true;
                                } else if (response.has('message')) {
                                    $.log.error(response.getString('message'));
                                } else {
                                    $.log.error('!prediction lock - unknown failure ## ' + response.toString());
                                }
                            } catch (e) {
                                $.log.error(e);
                            }
                        }
                    } else if (action === 'resolve') {
                        handled = true;
                        if (args.length < 2) {
                            $.say($.whisperPrefix(sender) + $.lang.get('predictionhandler.resolve.usage'));
                        } else if (currentPrediction === null) {
                            $.say($.whisperPrefix(sender) + $.lang.get('predictionhandler.404'));
                        } else {
                            try {
                                let winningOutcome = null;
                                let winningOption = parseInt(args[1]);

                                for (let i in currentPrediction.outcomes) {
                                    if (currentPrediction.outcomes[i].index === winningOption) {
                                        winningOutcome = currentPrediction.outcomes[i];
                                    }
                                }

                                if (winningOutcome === null) {
                                    $.say($.whisperPrefix(sender) + $.lang.get('predictionhandler.resolve.404', args[1]));
                                } else {
                                    let response = $.helix.endPrediction($.javaString(currentPrediction.id), Packages.tv.phantombot.twitch.api.Helix.PredictionStatus.RESOLVED, $.javaString(winningOutcome.id));

                                    if (response.has('data') && response.getJSONArray('data').length() > 0) {
                                        isCommandPrediction = true;
                                    } else if (response.has('message')) {
                                        $.log.error(response.getString('message'));
                                    } else {
                                        $.log.error('!prediction resolve - unknown failure ## ' + response.toString());
                                    }
                                }
                            } catch (e) {
                                $.log.error(e);
                            }
                        }
                    } else if (action === 'cancel') {
                        handled = true;
                        if (currentPrediction === null) {
                            $.say($.whisperPrefix(sender) + $.lang.get('predictionhandler.404'));
                        } else {
                            try {
                                let response = $.helix.endPrediction($.javaString(currentPrediction.id), Packages.tv.phantombot.twitch.api.Helix.PredictionStatus.CANCELED, null);

                                if (response.has('data') && response.getJSONArray('data').length() > 0) {
                                    isCommandPrediction = true;
                                } else if (response.has('message')) {
                                    $.log.error(response.getString('message'));
                                } else {
                                    $.log.error('!prediction cancel - unknown failure ## ' + response.toString());
                                }
                            } catch (e) {
                                $.log.error(e);
                            }
                        }
                    } else if (action === 'sync') {
                        handled = true;
                        try {
                            let response = $.helix.getPredictions(null, 1, null);

                            if (response.has('data') && response.getJSONArray('data').length() > 0) {
                                let activeprediction = response.getJSONArray('data').getJSONObject(0);
                                if (!activeprediction.isNull('ended_at')) {
                                    currentPrediction = null;
                                } else {
                                    let prediction = {
                                        id: $.jsString(activeprediction.getString('id')),
                                        title: $.jsString(activeprediction.getString('title')),
                                        outcomes: [],
                                        locked: !activeprediction.isNull('locked_at')
                                    };

                                    let outcomes = activeprediction.getJSONArray('outcomes');
                                    for (let i = 0; i < outcomes.length(); i++) {
                                        prediction.outcomes.push({
                                            index: i + 1,
                                            id: $.jsString(outcomes.getJSONObject(i).getString('id')),
                                            title: $.jsString(outcomes.getJSONObject(i).getString('title'))
                                        });
                                    }

                                    currentPrediction = prediction;
                                }

                                $.say($.whisperPrefix(sender) + $.lang.get('predictionhandler.sync'));
                            } else if (response.has('message')) {
                                $.log.error(response.getString('message'));
                            } else {
                                $.log.error('!prediction sync - unknown failure ## ' + response.toString());
                            }
                        } catch (e) {
                            $.log.error(e);
                        }
                    }
                }

                if (!handled) {
                    $.say($.whisperPrefix(sender) + $.lang.get('predictionhandler.usage'));
                }
            }
    });

    /*
     * @event initReady
     */
    $.bind('initReady', function () {
        $.registerChatCommand('./handlers/predictionHandler.js', 'prediction', $.PERMISSION.Admin);
        $.registerChatSubcommand('prediction', 'open', $.PERMISSION.Admin);
        $.registerChatSubcommand('prediction', 'options', $.PERMISSION.Admin);
        $.registerChatSubcommand('prediction', 'lock', $.PERMISSION.Admin);
        $.registerChatSubcommand('prediction', 'resolve', $.PERMISSION.Admin);
        $.registerChatSubcommand('prediction', 'cancel', $.PERMISSION.Admin);

        setTimeout(function() {
            if (!$.twitchcache.isAffiliateOrPartner()) {
                return;
            }

            sync();
        }, 2000);
    });
})();