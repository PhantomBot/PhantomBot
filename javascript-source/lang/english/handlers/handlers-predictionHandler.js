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

$.lang.register('predictionhandler.usage', 'Usage: !prediction [open / options / lock / resolve / cancel / sync] [usage / example]');
$.lang.register('predictionhandler.404', 'There currently isn\'t an open prediction');
$.lang.register('predictionhandler.open.usage', 'Usage: !prediction open [Time until Auto-Lock (30s to 30m)] "Question (45 char)" "Option 1 (25 char)" "Option 2 (25 char)" (Max 10 Options) - Opens a new prediction');
$.lang.register('predictionhandler.open.example', 'Example: !prediction open 5m10s "What will the match outcome be?" "Win" "Loss" "Draw"');
$.lang.register('predictionhandler.open.toomanyoptions', 'Too many options. Limit: 10. Need Help? Try "!prediction open usage" or "!prediction open example"');
$.lang.register('predictionhandler.open.header', '=== Prediction: $1 ===');
$.lang.register('predictionhandler.option', ' ## $1: $2');
$.lang.register('predictionhandler.options.usage', 'Usage: !prediction options - Prints the option IDs and titles of the current prediction');
$.lang.register('predictionhandler.options.example', 'Example: !prediction options - === Options === ## 1: Win ## 2: Loss ## 3: Draw');
$.lang.register('predictionhandler.options.header', '=== Options ===');
$.lang.register('predictionhandler.lock.usage', 'Usage: !prediction lock - Locks the prediction early, so viewers can no longer add bets on the outcome');
$.lang.register('predictionhandler.lock.example', 'Example: !prediction lock - === Prediction Locked === No more bets');
$.lang.register('predictionhandler.lock', '=== Prediction Locked === No more bets');
$.lang.register('predictionhandler.resolve.usage', 'Usage: !prediction resolve [Option ID] - Resolves the prediction, awarding channel points to the viewers who bet on the selected option');
$.lang.register('predictionhandler.resolve.example', 'Example: !prediction resolve 1 - === What will the match outcome be? === The winning option is: Win');
$.lang.register('predictionhandler.resolve', '=== $1 === The winning option is: $2');
$.lang.register('predictionhandler.resolve.404', 'Option $1 does not exist');
$.lang.register('predictionhandler.cancel.usage', 'Usage: !prediction cancel - Cancels the prediction, refunding all bet channel points');
$.lang.register('predictionhandler.cancel.example', 'Example: !prediction cancel - === Prediction Canceled === Points have been refunded');
$.lang.register('predictionhandler.cancel', '=== Prediction Canceled === Points have been refunded');
$.lang.register('predictionhandler.sync.usage', 'Usage: !prediction sync - Re-syncs the current prediction status');
$.lang.register('predictionhandler.sync.example', 'Example: !prediction sync - Prediction state has been synced');
$.lang.register('predictionhandler.sync', 'Prediction state has been synced');