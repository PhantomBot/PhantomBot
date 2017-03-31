/*
 * Copyright (C) 2017 phantombot.tv
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

/* 
 * @author IllusionaryOne
 */

/*
 * disablePanel.js
 */
(function() {

    /**
     * @function handlePanel
     * @param {String} module
     * @param {String} divID
     * @param {Boolean} isEnabled
     */
    function handlePanel(module, divID, isEnabled) {
        if (isEnabled) {
            $(divID + 'Disabled').hide();
            $(divID).show();
        } else {
            $(divID + 'Disabled').html('Panel disabled due to module being disabled (' + module + ')');
            $(divID).hide();
            $(divID + 'Disabled').show();
        }
    }

    /**
     * @function disablePanels
     * @param {Object} moduleData
     */
    function disablePanels(moduleData) {
        var module = '',
            moduleEnabled = '';

        for (idx in moduleData) {
            module = moduleData[idx]['key'];
            moduleEnabled = (panelMatch(moduleData[idx]['value'], 'true'));

            if (panelMatch(module, './commands/highlightCommand.js')) {
                handlePanel('./commands/highlightCommand.js', '#_highlightsPanel', moduleEnabled);
            }
            if (panelMatch(module, './commands/deathctrCommand.js')) {
                handlePanel('./commands/deathctrCommand.js', '#_deathCtrPanel', moduleEnabled);
            }
            if (panelMatch(module, './commands/dualstreamCommand.js')) {
                handlePanel('./commands/dualstreamCommand.js', '#_multiLinkPanel', moduleEnabled);
            }
            if (panelMatch(module, './handlers/followHandler.js')) {
                handlePanel('./handlers/followHandler.js', '#_shoutoutPanel', moduleEnabled);
            }
            if (panelMatch(module, './systems/youtubePlayer.js')) {
                handlePanel('./systems/youtubePlayer.js', '#_youtubePlayerPanel', moduleEnabled);
            }
            if (panelMatch(module, './systems/audioPanelSystem.js')) {
                handlePanel('./systems/audioPanelSystem.js', '#_audioPanel', moduleEnabled);
            }
            if (panelMatch(module, './commands/customCommands.js')) {
                handlePanel('./commands/customCommands.js', '#_editCustomCommandsPanel', moduleEnabled);
                handlePanel('./commands/customCommands.js', '#_viewCustomCommandsPanel', moduleEnabled);
                handlePanel('./commands/customCommands.js', '#_viewCommandAliasesPanel', moduleEnabled);
                handlePanel('./commands/customCommands.js', '#_commandPermissionPanel', moduleEnabled);
                handlePanel('./commands/customCommands.js', '#_commandPricesPanel', moduleEnabled);
                handlePanel('./commands/customCommands.js', '#_commandPayPanel', moduleEnabled);
            }
            if (panelMatch(module, './systems/pointSystem.js')) {
                handlePanel('./systems/pointSystem.js', '#_pointsConfigPanel', moduleEnabled);
                handlePanel('./systems/pointSystem.js', '#_groupPointConfigPanel', moduleEnabled);
                handlePanel('./systems/pointSystem.js', '#_userPointConfigPanel', moduleEnabled);
            }
            if (panelMatch(module, './systems/ranksSystem.js')) {
                handlePanel('./systems/ranksSystem.js', '#_ranksMappingPanel', moduleEnabled);
                handlePanel('./systems/ranksSystem.js', '#_customRanksPanel', moduleEnabled);
            }
            if (panelMatch(module, './systems/greetingSystem.js')) {
                handlePanel('./systems/greetingSystem.js', '#_globalGreetingsPanel', moduleEnabled);
            }
            if (panelMatch(module, './handlers/followHandler.js')) {
                handlePanel('./handlers/followHandler.js', '#_followAlertsPanel', moduleEnabled);
            }
            if (panelMatch(module, './handlers/donationHandler.js')) {
                handlePanel('./handlers/donationHandler.js', '#_donationAlertsPanel', moduleEnabled);
                handlePanel('./handlers/donationHandler.js', '#_donationsPanel', moduleEnabled);
            }
            if (panelMatch(module, './handlers/streamTipHandler.js')) {
                handlePanel('./handlers/streamTipHandler.js', '#_streamtipdonationAlertsPanel', moduleEnabled);
                handlePanel('./handlers/streamTipHandler.js', '#_streamtipdonationsPanel', moduleEnabled);
            }
            if (panelMatch(module, './handlers/bitsHandler.js')) {
                handlePanel('./handlers/bitsHandler.js', '#_twitchBitsAlertsPanel', moduleEnabled);
                handlePanel('./handlers/bitsHandler.js', '#_twitchBitsPanel', moduleEnabled);
            }
            if (panelMatch(module, './handlers/subscribeHandler.js')) {
                handlePanel('./handlers/subscribeHandler.js', '#_twitchSubPanel', moduleEnabled);
            }
            if (panelMatch(module, './handlers/gameWispHandler.js')) {
                handlePanel('./handlers/gameWispHandler.js', '#_gwSubPanel', moduleEnabled);
                handlePanel('./handlers/gameWispHandler.js', '#_gwTierPanel', moduleEnabled);
            }
            if (panelMatch(module, './systems/noticeSystem.js')) {
                handlePanel('./systems/noticeSystem.js', '#_noticeConfigPanel', moduleEnabled);
                handlePanel('./systems/noticeSystem.js', '#_noticesPanel', moduleEnabled);
            }
            if (panelMatch(module, './systems/quoteSystem.js')) {
                handlePanel('./systems/quoteSystem.js', '#_quotesPanel', moduleEnabled);
            }
            if (panelMatch(module, './handlers/keywordHandler.js')) {
                handlePanel('./handlers/keywordHandler.js', '#_keywordsPanel', moduleEnabled);
            }
            if (panelMatch(module, './systems/pollSystem.js')) {
                handlePanel('./systems/pollSystem.js', '#_pollPanel', moduleEnabled);
            }
            if (panelMatch(module, './systems/queueSystem.js')) {
                handlePanel('./systems/queueSystem.js', '#_queuePanel', moduleEnabled);
            }
            if (panelMatch(module, './handlers/hostHandler.js')) {
                handlePanel('./handlers/hostHandler.js', '#_hostChannelPanel', moduleEnabled);
                handlePanel('./handlers/hostHandler.js', '#_hostAlertsPanel', moduleEnabled);
                handlePanel('./handlers/hostHandler.js', '#_hostHistoryPanel', moduleEnabled);
            }
            if (panelMatch(module, './systems/raidSystem.js')) {
                handlePanel('./systems/raidSystem.js', '#_raidChannelPanel', moduleEnabled);
                handlePanel('./systems/raidSystem.js', '#_raidMsgPanel', moduleEnabled);
                handlePanel('./systems/raidSystem.js', '#_raidIncomingPanel', moduleEnabled);
                handlePanel('./systems/raidSystem.js', '#_raidOutgoingPanel', moduleEnabled);
            }
            if (panelMatch(module, './systems/auctionSystem.js')) {
                handlePanel('./systems/auctionSystem.js', '#_auctionPanel', moduleEnabled);
            }
            if (panelMatch(module, './systems/bettingSystem.js')) {
                handlePanel('./systems/bettingSystem.js', '#_bettingPanel', moduleEnabled);
            }
            if (panelMatch(module, './systems/raffleSystem.js')) {
                handlePanel('./systems/raffleSystem.js', '#_rafflePanel', moduleEnabled);
            }
            if (panelMatch(module, './systems/ticketraffleSystem.js')) {
                handlePanel('./systems/ticketraffleSystem.js', '#_trafflePanel', moduleEnabled);
            }
            if (panelMatch(module, './games/adventureSystem.js')) {
                handlePanel('./games/adventureSystem.js', '#_adventurePanel', moduleEnabled);
            }
            if (panelMatch(module, './games/roulette.js')) {
                handlePanel('./games/roulette.js', '#_roulettePanel', moduleEnabled);
            }
            if (panelMatch(module, './handlers/panelHandler.js')) {
                if (!moduleEnabled) {
                    $('#panelStatsStatus').html('<span class="purplePill" data-toggle="tooltip" title="Panel Stats Disabled. Enable module ./handlers/panelHandler.js for Twitch online/offline information, uptime, and chat statistics data in the panel."><i class="fa fa-exclamation-triangle fa-lg" /></span>');
                } else {
                    $('#panelStatsStatus').html('');
                }
            }
            if (panelMatch(module, './handlers/twitterHandler.js')) {
                handlePanel('./handlers/twitterHandler.js', '#_twitterPanel', moduleEnabled);
            }
            if (panelMatch(module, './games/slotMachine.js')) {
                handlePanel('./games/slotMachine.js', '#_slotPanel', moduleEnabled);
            }
            if (panelMatch(module, './games/roll.js')) {
                handlePanel('./games/roll.js', '#_rollPanel', moduleEnabled);
            }
            if (panelMatch(module, './games/gambling.js')) {
                handlePanel('./games/gambling.js', '#_gamlbingPanel', moduleEnabled);
            }
            if (panelMatch(module, './handlers/tipeeeStreamHandler.js')) {
                handlePanel('./handlers/tipeeeStreamHandler.js', '#_tipeeeStreamDonationsPanel', moduleEnabled);
            }

            // Discord modules.
            if (panelMatch(module, './discord/handlers/bitsHandler.js')) {
                handlePanel('./discord/handlers/bitsHandler.js', '#_discord_bitsHandler', moduleEnabled);
            }
            if (panelMatch(module, './discord/handlers/followHandler.js')) {
                handlePanel('./discord/handlers/followHandler.js', '#_discord_followHandler', moduleEnabled);
            }
            if (panelMatch(module, './discord/handlers/subscribeHandler.js')) {
                handlePanel('./discord/handlers/subscribeHandler.js', '#_discord_subscribeHandler', moduleEnabled);
            }
            if (panelMatch(module, './discord/handlers/tipeeeStreamHandler.js')) {
                handlePanel('./discord/handlers/tipeeeStreamHandler.js', '#_discord_tipeeeStreamHandler', moduleEnabled);
            }
            if (panelMatch(module, './discord/handlers/streamtipHandler.js')) {
                handlePanel('./discord/handlers/streamtipHandler.js', '#_discord_streamTipHandler', moduleEnabled);
            }
            if (panelMatch(module, './discord/handlers/streamlabsHandler.js')) {
                handlePanel('./discord/handlers/streamlabsHandler.js', '#_discord_streamLabsHandler', moduleEnabled);
            }
            if (panelMatch(module, './discord/handlers/hostHandler.js')) {
                handlePanel('./discord/handlers/hostHandler.js', '#_discord_hostHandler', moduleEnabled);
            }
            if (panelMatch(module, './discord/handlers/twitterHandler.js')) {
                handlePanel('./discord/handlers/twitterHandler.js', '#_discord_twitterHandler', moduleEnabled);
            }
            if (panelMatch(module, './discord/handlers/keywordHandler.js')) {
                handlePanel('./discord/handlers/keywordHandler.js', '#_discord_keywordHandler', moduleEnabled);
            }
            if (panelMatch(module, './discord/handlers/streamHandler.js')) {
                handlePanel('./discord/handlers/streamHandler.js', '#_discord_streamHandler', moduleEnabled);
            }
            if (panelMatch(module, './discord/handlers/gamewispHandler.js')) {
                handlePanel('./discord/handlers/gamewispHandler.js', '#_discord_gameWispHandler', moduleEnabled);
            }
            if (panelMatch(module, './discord/handlers/keywordHandler.js')) {
                handlePanel('./discord/handlers/keywordHandler.js', '#_discord_customkeywords', moduleEnabled);
            }
            if (panelMatch(module, './discord/systems/greetingsSystem.js')) {
                handlePanel('./discord/systems/greetingsSystem.js', '#_discord_greetingSystem', moduleEnabled);
            }
            if (panelMatch(module, './discord/commands/customCommands.js')) {
                handlePanel('./discord/games/customCommands.js', '#_discord_customCommands', moduleEnabled);
            }
            if (panelMatch(module, './discord/games/slotMachine.js')) {
                handlePanel('./discord/games/slotMachine.js', '#_discord_slotMachine', moduleEnabled);
            }
            if (panelMatch(module, './discord/games/gambling.js')) {
                handlePanel('./discord/games/gambling.js', '#_discord_gambling', moduleEnabled);
            }
            if (panelMatch(module, './discord/games/roll.js')) {
                handlePanel('./discord/games/roll.js', '#_discord_roll', moduleEnabled);
            }
        }
    }

    // Export Function
    $.disablePanels = disablePanels
})();
