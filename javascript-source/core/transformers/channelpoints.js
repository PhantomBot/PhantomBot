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

(function () {
    /*
     * @transformer cpcancel
     * @formula (cpcancel) marks the Channel Points redemption as cancelled, refunding the users channel points
     * @labels twitch channelpointsevent channelpoints
     * @notes only works on redeemables that have been created by the bot
     * @notes only works on redeemables that have `should_redemptions_skip_request_queue` set to `false`
     * @cached
     */
    function cpcancel(args) {
        if (args.customArgs.redemption.getFulfillmentStatus().equals('UNFULFILLED')) {
            $.channelpoints.updateRedemptionStatusCancelled(args.customArgs.redemption.getRewardID(), args.customArgs.redemption.getRedemptionID());
        }
        return {
            result: '',
            cache: true
        };
    }

    /*
     * @transformer cpcost
     * @formula (cpcost) the cost of the redeemable that was redeemed
     * @labels twitch channelpointsevent channelpoints
     * @cached
     */
    function cpcost(args) {
        return {
            result: $.jsString(args.customArgs.redemption.getCost()),
            cache: true
        };
    }

    /*
     * @transformer cpdisplayname
     * @formula (cpdisplayname) the display name of the user who redeemed
     * @labels twitch channelpointsevent channelpoints
     * @cached
     */
    function cpdisplayname(args) {
        return {
            result: $.jsString(args.customArgs.redemption.getDisplayName()),
            cache: true
        };
    }

    /*
     * @transformer cpfulfill
     * @formula (cpfulfill) marks the Channel Points redemption as fulfilled
     * @labels twitch channelpointsevent channelpoints
     * @notes only works on redeemables that have been created by the bot
     * @notes only works on redeemables that have `should_redemptions_skip_request_queue` set to `false`
     * @cached
     */
    function cpfulfill(args) {
        if (args.customArgs.redemption.getFulfillmentStatus().equals('UNFULFILLED')) {
            $.channelpoints.updateRedemptionStatusFulfilled(args.customArgs.redemption.getRewardID(), args.customArgs.redemption.getRedemptionID());
        }
        return {
            result: '',
            cache: true
        };
    }

    /*
     * @transformer cpfulfillstatus
     * @formula (cpfulfillstatus) the fulfillment status of the redemption when it was received by PubSub
     * @labels twitch channelpointsevent channelpoints
     * @cached
     */
    function cpfulfillstatus(args) {
        return {
            result: $.jsString(args.customArgs.redemption.getFulfillmentStatus()),
            cache: true
        };
    }

    /*
     * @transformer cpinput
     * @formula (cpinput) the input supplied by the redeeming user, if set
     * @labels twitch channelpointsevent channelpoints
     * @notes All newline characters `\n` are URL-encoded as `%0A`
     * @cached
     */
    function cpinput(args) {
        return {
            result: $.replace($.jsString(args.customArgs.redemption.getUserInput()), '\n', '%0A'),
            cache: true
        };
    }

    /*
     * @transformer cpinputraw
     * @formula (cpinput) the raw input supplied by the redeeming user, if set
     * @labels twitch channelpointsevent channelpoints
     * @cached
     */
    function cpinputraw(args) {
        return {
            result: $.jsString(args.customArgs.redemption.getUserInput()),
            cache: true
        };
    }

    /*
     * @transformer cpprompt
     * @formula (cpprompt) the input prompt of the redeemable that was redeemed, if set
     * @labels twitch channelpointsevent channelpoints
     * @cached
     */
    function cpprompt(args) {
        return {
            result: $.jsString(args.customArgs.redemption.getInputPrompt()),
            cache: true
        };
    }

    /*
     * @transformer cpredemptionid
     * @formula (cpredemptionid) the ID of this redemption event
     * @labels twitch channelpointsevent channelpoints
     * @cached
     */
    function cpredemptionid(args) {
        return {
            result: $.jsString(args.customArgs.redemption.getRedemptionID()),
            cache: true
        };
    }

    /*
     * @transformer cpredeemableid
     * @formula (cpredeemableid) the ID of the redeemable that was redeemed
     * @labels twitch channelpointsevent channelpoints
     * @cached
     */
    function cpredeemableid(args) {
        return {
            result: $.jsString(args.customArgs.redemption.getRewardID()),
            cache: true
        };
    }

    /*
     * @transformer cpsetenabled
     * @formula (cpsetenabled redeemableId:str isEnabled:bool) sets the enabled state of the redeemable
     * @labels twitch discord noevent channelpoints
     * @notes disabled redeemables are not visible to viewers
     */
    function cpsetenabled(args) {
        var pargs = $.parseArgs(args.args, ' ', 2, false);
        if (pargs !== null && pargs.length === 2) {
            let isEnabled = pargs[1].toLowerCase();
            $.channelpoints.setRedeemableEnabled(pargs[0], isEnabled === 'true' || isEnabled === 'yes' || isEnabled === '1');
        }
        return {
            result: ''
        };
    }

    /*
     * @transformer cpsetpaused
     * @formula (cpsetpaused redeemableId:str isPaused:bool) sets the paused state of the redeemable
     * @labels twitch discord noevent channelpoints
     * @notes paused redeemables are visible to viewers, but can not be redeemed
     */
    function cpsetpaused(args) {
        var pargs = $.parseArgs(args.args, ' ', 2, false);
        if (pargs !== null && pargs.length === 2) {
            let isPaused = pargs[1].toLowerCase();
            $.channelpoints.setRedeemablePaused(pargs[0], isPaused === 'true' || isPaused === 'yes' || isPaused === '1');
        }
        return {
            result: ''
        };
    }

    /*
     * @transformer cptitle
     * @formula (cptitle) the title of the redeemable that was redeemed
     * @labels twitch channelpointsevent channelpoints
     * @cached
     */
    function cptitle(args) {
        return {
            result: $.jsString(args.customArgs.redemption.getRewardTitle()),
            cache: true
        };
    }

    /*
     * @transformer cpuserid
     * @formula (cpuserid) the ID of the user who redeemed
     * @labels twitch channelpointsevent channelpoints
     * @cached
     */
    function cpuserid(args) {
        return {
            result: $.jsString(args.customArgs.redemption.getUserID()),
            cache: true
        };
    }

    /*
     * @transformer cpusername
     * @formula (cpusername) the login name of the user who redeemed
     * @labels twitch channelpointsevent channelpoints
     * @cached
     */
    function cpusername(args) {
        return {
            result: $.jsString(args.customArgs.redemption.getUsername()),
            cache: true
        };
    }

    var transformers = [
        new $.transformers.transformer('cpcancel', ['twitch', 'channelpointsevent', 'channelpoints'], cpcancel),
        new $.transformers.transformer('cpcost', ['twitch', 'channelpointsevent', 'channelpoints'], cpcost),
        new $.transformers.transformer('cpdisplayname', ['twitch', 'channelpointsevent', 'channelpoints'], cpdisplayname),
        new $.transformers.transformer('cpfulfill', ['twitch', 'channelpointsevent', 'channelpoints'], cpfulfill),
        new $.transformers.transformer('cpfulfillstatus', ['twitch', 'channelpointsevent', 'channelpoints'], cpfulfillstatus),
        new $.transformers.transformer('cpinput', ['twitch', 'channelpointsevent', 'channelpoints'], cpinput),
        new $.transformers.transformer('cpinputraw', ['twitch', 'channelpointsevent', 'channelpoints'], cpinputraw),
        new $.transformers.transformer('cpprompt', ['twitch', 'channelpointsevent', 'channelpoints'], cpprompt),
        new $.transformers.transformer('cpredemptionid', ['twitch', 'channelpointsevent', 'channelpoints'], cpredemptionid),
        new $.transformers.transformer('cpredeemableid', ['twitch', 'channelpointsevent', 'channelpoints'], cpredeemableid),
        new $.transformers.transformer('cpsetenabled', ['twitch', 'discord', 'noevent', 'channelpoints'], cpsetenabled),
        new $.transformers.transformer('cpsetpaused', ['twitch', 'discord', 'noevent', 'channelpoints'], cpsetpaused),
        new $.transformers.transformer('cptitle', ['twitch', 'channelpointsevent', 'channelpoints'], cptitle),
        new $.transformers.transformer('cpuserid', ['twitch', 'channelpointsevent', 'channelpoints'], cpuserid),
        new $.transformers.transformer('cpusername', ['twitch', 'channelpointsevent', 'channelpoints'], cpusername)
    ];

    $.transformers.addTransformers(transformers);
})();
