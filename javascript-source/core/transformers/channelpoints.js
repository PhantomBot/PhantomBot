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
    /*
     * @transformer cpfulfill
     * @formula (cpfulfill) marks the Channel Points redemption as fulfilled
     * @labels twitch channelpointsevent channelpoints
     * @notes only works on redeemables that have been created by the bot
     * @cached
     */
    function cpfulfill(args) {
        $.channelpoints.updateRedemptionStatusFulfilled(args.customArgs.redemption.getRewardID(), args.customArgs.redemption.getRedemptionID());
        return {
            result: '',
            cache: true
        };
    }
    /*
     * @transformer cpcancel
     * @formula (cpcancel) marks the Channel Points redemption as cancelled, refunding the users channel points
     * @labels twitch channelpointsevent channelpoints
     * @notes only works on redeemables that have been created by the bot
     * @cached
     */
    function cpcancel(args) {
        $.channelpoints.updateRedemptionStatusCancelled(args.customArgs.redemption.getRewardID(), args.customArgs.redemption.getRedemptionID());
        return {
            result: '',
            cache: true
        };
    }

    var transformers = [
        new $.transformers.transformer('cpfulfill', ['twitch', 'channelpointsevent', 'channelpoints'], cpfulfill),
        new $.transformers.transformer('cpcancel', ['twitch', 'channelpointsevent', 'channelpoints'], cpcancel)
    ];

    $.transformers.addTransformers(transformers);
})();
