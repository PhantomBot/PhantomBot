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

/**
 * gameMessages.js
 *
 * An API for predefined game result messages
 * Use the $.gameMessages API
 */
(function() {
    var lastRandom = -1,
    	winMessageCount = {
            roll: 0,
            gamble: 0,
            slot: 0
        },
        lostMessagesCount = {
            roll: 0,
            gamble: 0,
            slot: 0
        },
        _lock = new Packages.java.util.concurrent.locks.ReentrantLock();

    /**
     * @function loadResponses
     */
    function loadResponses() {
        var i;

        // Load up messages for the roll command.
        for (i = 1; $.lang.exists('roll.win.' + i); i++) {
            _lock.lock();
            try {
                winMessageCount.roll++;
            } finally {
                _lock.unlock();
            }
        }

        // Load up messages for the roll command.
        for (i = 1; $.lang.exists('roll.lost.' + i); i++) {
            _lock.lock();
            try {
                lostMessagesCount.roll++;
            } finally {
                _lock.unlock();
            }
        }

        // Load up messages for the slot command.
        for (i = 1; $.lang.exists('slot.win.' + i); i++) {
            _lock.lock();
            try {
                winMessageCount.slot++;
            } finally {
                _lock.unlock();
            }
        }

        // Load up messages for the slot command.
        for (i = 1; $.lang.exists('slot.lost.' + i); i++) {
            _lock.lock();
            try {
                lostMessagesCount.slot++;
            } finally {
                _lock.unlock();
            }
        }

        // Load up messages for the gamble command.
        for (i = 1; $.lang.exists('gamble.win.' + i); i++) {
            _lock.lock();
            try {
                winMessageCount.gamble++;
            } finally {
                _lock.unlock();
            }
        }

        // Load up messages for the gamble command.
        for (i = 1; $.lang.exists('gamble.lost.' + i); i++) {
            _lock.lock();
            try {
                lostMessagesCount.gamble++;
            } finally {
                _lock.unlock();
            }
        }
    }

    /**
     * @function getWin
     *
     * @export $.gameMessages
     * @param {string} username
     * @param {string} game
     * @returns {string}
     */
    function getWin(username, game) {
        var rand;

        _lock.lock();
        try {
            switch (game) {
                case 'roll':
                    if (winMessageCount.roll === 0) {
                        return '';
                    } else {
                        do {
                            rand = $.randRange(1, winMessageCount.roll);
                        } while (rand === lastRandom);
                    }
                    lastRandom = rand;
                    return $.lang.get(game + '.win.' + rand, $.resolveRank(username));
                case 'gamble':
                    if (winMessageCount.gamble === 0) {
                        return '';
                    } else {
                        do {
                            rand = $.randRange(1, winMessageCount.gamble);
                        } while (rand === lastRandom);
                    }
                    lastRandom = rand;
                    return $.lang.get(game + '.win.' + rand, $.resolveRank(username));
                case 'slot':
                    if (winMessageCount.slot === 0) {
                        return '';
                    } else {
                        do {
                            rand = $.randRange(1, winMessageCount.slot);
                        } while (rand === lastRandom);
                    }
                    lastRandom = rand;
                    return $.lang.get(game + '.win.' + rand, $.resolveRank(username));
                default:
                    return '';
            }
        } finally {
            _lock.unlock();
        }
    }

    /**
     * @function getLose
     * @export $.gameMessages
     * @param {string} username
     * @returns {string}
     */
    function getLose(username, game) {
        var rand;

        _lock.lock();
        try {
            switch (game) {
                case 'roll':
                    if (lostMessagesCount.roll === 0) {
                        return '';
                    } else {
                        do {
                            rand = $.randRange(1, lostMessagesCount.roll);
                        } while (rand === lastRandom);
                    }
                    lastRandom = rand;
                    return $.lang.get(game + '.lost.' + rand, $.resolveRank(username));
                case 'gamble':
                    if (lostMessagesCount.gamble === 0) {
                        return '';
                    } else {
                        do {
                            rand = $.randRange(1, lostMessagesCount.gamble);
                        } while (rand === lastRandom);
                    }
                    lastRandom = rand;
                    return $.lang.get(game + '.lost.' + rand, $.resolveRank(username));
                case 'slot':
                    if (lostMessagesCount.slot === 0) {
                        return '';
                    } else {
                        do {
                            rand = $.randRange(1, lostMessagesCount.slot);
                        } while (rand === lastRandom);
                    }
                    lastRandom = rand;
                    return $.lang.get(game + '.lost.' + rand, $.resolveRank(username));
                default:
                    return '';
            }
        } finally {
            _lock.unlock();
        }
    }

    /**
     * @event initReady
     */
    $.bind('initReady', function() {
        if ($.bot.isModuleEnabled('./core/gameMessages.js')) {
            loadResponses();
        }
    });

    /** Export functions to API */
    $.gameMessages = {
        getWin: getWin,
        getLose: getLose
    };
})();
