/**##########################
 *
 * @title Guild Wars 2 API Module - A module for phantombot.
 * @author Nekres
 * @contact https://phantombot.net/
 *
 **###########################
 *
 *          - CHANGELOG -
 *
 *    V3.2.2
 *    - Fixed username letter case resolve in responds.
 *    - Added !gw2 birthday/bday - Checks if any of the characters had birthday on the last three days.
 *
 *    V3.1.3
 *    - Fixed !gw2 build for characters with multiple surnames.
 *    - Fixed !gw2 build for characters with a gamemode abbreviation inside their names.
 *    - Added 'fracs' as subcommand to the register.
 *
 *    V3.0.4
 *    - Improvements to code.
 *        Replaced string notations with dot notations for fetching JSON.
 *        Removed unnecessary semicolons.
 *        Removed unused variables.
 *        Fixed scoping for some variables.
 *        Removed unnecessary URI encoding.
 *    - Fixed deathcounter for characters with multiple surnames.
 *    - Added subcommands to the register.
 *    - Fixed deathcounter and goldcounter update interval being 10 seconds instead of 5 minutes.
 *
 *    V2.9.7
 *    - !gw2 deathcounter and !gw2 goldcounter can now be called by moderators and above.
 *    - !gw2 build [gamemode] [character] can now also be called with swapped arguments: !gw2 build [character] [gamemode].
 *    - Changed RegEx of [gamemode] to match even when there are typos at the start or end of the game mode string provided by the user.
 *    - Fixed !gw2 stats [profession] being case-sensitive.
 *    - Fixed !gw2 rank not finding all seasons.
 *    - Added multi language supporting error messages to !gw2, !gw2 rank and !gw2 build.
 *    - Fixed !gw2 coinsformat.
 *
 *    V2.8.0
 *    - Adjusted coding style to etiquette:
 *        Added some missing camel cases. Replaced any " with ' and any tab with 4 space indents.
 *        Encapsulated code in (function(){ /* code / })();
 *        Added JSDoc comments for classes and functions.
 *    - Removed just locally used variables from the $ global.
 *    - Added helper API function 'initReady' for command register.
 *    - Fixed loading settings from DB being used even after initialization. (Performance boost)
 *    - Fixed bot forced into wait state mode. (Removed $.inidb.SaveAll(true);)
 *    - Minor changes to variable layout. (Performance boost)
 *    - Changed permission restriction on !gw2 goldformat to mods and above.
 *    - Fixed $.writeToFile() path incompatibility for other operating systems besides MS Windows.
 *
 *    V2.6.6
 *    - Added !gw2 setkey [GW2ApiKey]
 *    - Added database key for api key.
 *    - Fixed error logging.
 *    - Added commandpaths.
 *    - Added language support for success and error messages.
 *    - Improved operations & stabilized code.
 *
 *    V2.5.2
 *    - Fixed !gw2 build [mode] [character] not generating currently equipped utility skills. Thanks to Arnaud Buathier (gw2tool.net)!
 *    - Changed !rank command to automatically fetch the currently active PvP season.
 *
 *    V2.4.2
 *    - Fixed !gw2 stats [profession].
 *    - Fixed comma and dot being switched around in coins formatting.
 *
 *    V2.3.3
 *    - Fixed !gw2 rank to automatically detect the current season.
 *    - Changed tier symbols to use single HTML roman numerals instead of replicated roman numerals consisting of several letters.
 *    - Changed legendary repeats to use correct multiplication sign instead of the letter x.
 *
 *    V2.2.4
 *    - Added cache in order to drastically decrease response delay for some API dependent commands.
 *    - Added language file support for professions, divisions and world populations.
 *    - Fixed legendary prestige response.
 *    - Added support for slang and abbreviations for profession parameter used in !gw2 stats [profession].
 *
 *    V2.1.1
 *    - Added automatic GW2Tool.net puplic access configuration for !gw2 build [mode] [character].
 *        It will update the users preferences about puplic access rights on gw2tool.net automatically so that the users audience can access current equipment links.
 *
 *    V2.0.1
 *    - Added multi language support.
 *
 *    V1.9.3
 *    - Removed GW2ToolID manual parsing. (!gw2 build [mode] [character] is now working automatically.)
 *    - Changed console print when toggling coin formats to be more clear.
 *    - Fixed reply sent to people trying to use mod or admin restricted commands returning 'undefined'.
 *
 *    V1.8.2
 *    - Added '!gw2 coinsformat'
 *        Toggles between two different formatting options: '####,00.00g' or '####g 00s 00c' (default).
 *    - Fixed URL encoding.
 *
 *    V1.7.3
 *    - Added '!gw2 wiki [string]'
 *        It will return a wiki search link that will return top search results or a wiki article if a perfect match is found (ie. if a precise article name was given.).
 *    - Added '!gw2 build [game mode] [character]' (Game modes are 'pve', 'pvp' or 'wvw'.)
 *        Returns a gw2tool.net link that will forward to the gw2skills.net build editor which will be adjusted to your current equipped build in a specified game mode on a specified character.
 *    - Fixed a small mistake at returned calculated coins for negative values.
 *
 *    V1.6.2
 *    - Changed calculation of coins to return the amount of coins in this format: 'XXXX,XX.XXg', instead of 'XXXXg XXs XXc'. Less clutter, better to display.
 *    - Fixed gold counter responds cluttering the broadcasters chat.
 *
 *    V1.5.2
 *    - Added 'gw2 goldcounter'
 *        It toggles a gold counter which saves the users current gold status, calculates losses/earnings underneath it and writes both to '[...]/addons/guildwars2/session_gold.txt'.
 *        The gold counter resets to '#InitialGold!<\br>+0c' everytime the counter is re-enabled. The counter has a 5 minute interval.
 *    - Changed some sentences to be more like everyday speech.
 *
 *    V1.4.1
 *    - Added '!gw2 deathcounter/deaths [character]'
 *        It toggles a death counter  for a specific character and writes its value to '[...]/addons/guildwars2/session_deaths.txt' followed by a skull and crossbones symbol '☠'.
 *        The death counter resets to '0☠' everytime the counter is re-enabled or a new pvp match is found in your history. The counter has a 5 minute interval.
 *
 *    V1.3.5
 *    - Changed account arguments to be commands themselves.
 *    - Added commonly used shorts & synonyms to commands (ex. fracs = fractals, coins = wallet)
 *    - Fixed chat cluttering. Long respond sentences (ex. guild list, char list) are now whispered.
 *    - Fixed comma spacing in responded lists.
 *    - Removed '@sender:' from puplic responses.
 *
 *    V1.2.2
 *    - Added optional argument 'wallet' to '!gw2 account'
 *        Displays the amount of gold, silver, copper and karma currently in the bot owners wallet.
 *    - Changed '!gw2 account' to display the creation date and time of the bot owners gw2 account.
 *
 *    V1.1.3:
 *    - Changed W/L Ratio formula to be more accurate.
 *        Ie. 'forfeits' do not count toward your W/L ratio anymore.
 *        Forfeits by defintion of ArenaNet: 
 *        If you loose a match while a player of your team has left the match, you loose no ranked points. 
 *        The forfeit case does not apply if you're still able to win. However, 
 *        a loss while the forfeit case applies means the match will neither be counted as win nor a loss.
 *        Therefore, forfeits are an invalid variable for  W/L ratio.
 *    - Fixed some spelling mistakes and comments.
 *    - Added response for overall total ranked matches played.
 *
 **###########################
 *
 * CORE SCRIPT BELOW!
 * ONLY CHANGE IF YOU KNOW WHAT YOU ARE DOING!
 *
 **##########################**/

(function(){
    // CACHE & DATABASE. DO NOT TOUCH!
    var GW2_apiKey = ($.inidb.exists('settings', 'gw2_apikey') ? $.inidb.get('settings', 'gw2_apikey') : '');
    // Minimum required permissions: account, wallet, characters, pvp, builds, progression.
    var GW2_apiURL = 'https://api.guildwars2.com';
    var GW2_coinformat = ($.inidb.exists('settings', 'gw2_coinformat') ? parseInt($.inidb.get('settings', 'gw2_coinformat')) : 1);
    var GW2_leagues = ['amber', 'emerald', 'sapphire', 'ruby', 'diamond', 'legendary'];
    var GW2_tiers = ['Ⅰ', 'Ⅱ', 'Ⅲ', 'Ⅳ', 'Ⅴ', 'Ⅵ', 'Ⅶ', 'Ⅷ', 'Ⅸ', 'Ⅹ'];
    var GW2_professions = ['elementalist', 'engineer', 'guardian', 'mesmer', 'necromancer', 'ranger', 'revenant', 'thief', 'warrior'];
    var GW2_toggle_goldcounter = 0;
    var GW2_overall_gold;
    var GW2_session_gold;
    var GW2_toggle_deathcounter = 0;
    var GW2_deathcounterChar;
    var GW2_overall_deaths;
    var GW2_session_deaths;
    var GW2_last_game;
    var GW2_characters;
    var GW2_accCreated;
    var GW2_accAccess;
    var GW2_accName;
    var GW2_world;
    var GW2_world_name;
    var GW2_world_population;
    var GW2_commander;
    var GW2_guilds;
    var GW2_fractal_level;
    var GW2_wvw_rank;
    var GW2_birthday;
    // ###############################

    /**
     * @function CalcCoins
     * @param {Number} coins
     * @returns {String}
     */
    function CalcCoins(coins) {
        coins = coins || 0;
        var c = coins % 100;
        var s;
        if (Math.abs(coins) >= 10000) {
            coins = (coins - c) / 100;
            s = coins % 100;
            var g = (coins - s) / 100;
            c = Math.round(c);
            if (s.toString().match(/^\s*-?[0-9]\s*$/)) { s = '0' + Math.abs(s); } else { s = Math.abs(s); }
            if (c.toString().match(/^\s*-?[0-9]\s*$/)) { c = '0' + Math.abs(c); } else { c = Math.abs(c); }
            if (GW2_coinformat) {
                return g + '.' + s + ',' + c + 'g';
            } else {
                return g + 'g ' + s + 's ' + c + 'c';
            }
        }
        if (Math.abs(coins) >= 100) {
            coins = (coins - c) / 100;
            s = coins % 100;
            c = Math.round(c);
            if (c.toString().match(/^\s*-?[0-9]\s*$/)) { c = '0' + Math.abs(c); } else { c = Math.abs(c); }
            if (GW2_coinformat) {
                return s + ',' + c + 's';
            } else {
                return s + 's ' + c + 'c';
            }
        }
        return Math.round(c) + 'c';
    }

    /**
     * @function _getJSON
     * @param {String} url
     * @returns {JSON}
     */
    function _getJSON(url){
        var HttpRequest = Packages.com.gmt2001.HttpRequest;
        var HashMap = Packages.java.util.HashMap;
        var responseData = HttpRequest.getData(HttpRequest.RequestType.GET, encodeURI(url), '', new HashMap());
        return responseData.content;
    }

    /**
     * @function _updateGW2ToolRights
     * @param {String} url
     */
    function _updateGW2ToolRights(url){
        url = url + '&rights[]=builds&rights[]=other.limit_characters';
        var data = JSON.parse(_getJSON(GW2_apiURL + '/v2/characters?access_token=' + GW2_apiKey));
        for (var i = 0; i < data.length; i++) {
            url = url + '&rights[]=character/' + data[i];
        }
        var HttpRequest = Packages.com.gmt2001.HttpRequest;
        var HashMap = Packages.java.util.HashMap;
        var headers = new HashMap();
        headers.put('Cookie', 'accesstoken=' + GW2_apiKey);
        HttpRequest.getData(HttpRequest.RequestType.POST, encodeURI(url), '', headers);
    }

    /**
     * GOLD COUNTER
     * used by !gw2 goldcounter
     */
    setInterval(function(){
        if (GW2_toggle_goldcounter != 1) { return; }
        var new_gold = JSON.parse(_getJSON(GW2_apiURL + '/v2/account/wallet?access_token=' + GW2_apiKey));
        for (var i = 0; i < new_gold.length; i++) {
            if (new_gold[i].id == 1 ) {
                new_gold = parseInt(new_gold[i].value - GW2_overall_gold);
            }
        }
        if (new_gold == GW2_session_gold) { return; }
        if (Math.abs(new_gold - GW2_session_gold) >= 10000) {
            if (new_gold < GW2_session_gold) {
                $.say($.lang.get('guildwars2.session_gold.lost', username, CalcCoins(Math.abs(new_gold - GW2_session_gold))));
            } else {
                $.say($.lang.get('guildwars2.session_gold.earned', username, CalcCoins(Math.abs(new_gold - GW2_session_gold))));
            }
        }
        if (new_gold >= 0) {
            $.writeToFile(CalcCoins(GW2_overall_gold) + '\n+' + CalcCoins(new_gold), './addons/guildwars2/session_gold.txt', false);
        } else {
            $.writeToFile(CalcCoins(GW2_overall_gold) + '\n' + CalcCoins(new_gold), './addons/guildwars2/session_gold.txt', false);
        }
        GW2_session_gold = new_gold;
    }, 300000);

    /**
     * DEATH COUNTER
     * used by !gw2 deathcounter [character]
     */
    setInterval(function(){
        if (GW2_toggle_deathcounter != 1) { return; }
        if (GW2_last_game != JSON.parse(_getJSON(GW2_apiURL + '/v2/pvp/games?access_token=' + GW2_apiKey)).shift()) {
            GW2_session_deaths = 0;
            GW2_overall_deaths = parseInt(JSON.parse(_getJSON(GW2_apiURL + '/v2/characters/' + GW2_deathcounterChar + '?access_token=' + GW2_apiKey)).deaths);
        }
        var new_deaths = parseInt(JSON.parse(_getJSON(GW2_apiURL + '/v2/characters/' + GW2_deathcounterChar + '?access_token=' + GW2_apiKey)).deaths) - GW2_overall_deaths;
        if (new_deaths == GW2_session_deaths) { return; }
        $.say($.lang.get('guildwars2.session_deaths.deaths', GW2_deathcounterChar, Math.abs(new_deaths - GW2_session_deaths)));
        $.writeToFile(new_deaths.toString() + '☠', './addons/guildwars2/session_deaths.txt', false);
        GW2_session_deaths = new_deaths;
    }, 300000);

    /**
     * @event command
     */
    $.bind('command', function (event) {
        var sender = event.getSender();
        var username = $.username.resolve($.channelName);
        var command = event.getCommand();
        var args = event.getArgs();
        var data;
        var i;
        var coins;

        if (command.equalsIgnoreCase('gw2')) {
            var action = args[0];
            
            if (!action) {
                $.say($.whisperPrefix(sender) + $.lang.get('guildwars2.action.404'));
                return;
            }

            /**
             * @commandpath gw2 setkey [GW2apiKey] - Sets a Guild Wars 2 api key. Required permissions: account, wallet, characters, pvp, builds, progression. Created at: https://account.arena.net/applications
             */
            if (action.equalsIgnoreCase('setkey')) {
                if (!$.isCaster(sender)) {
                    $.say($.whisperPrefix(sender) + $.adminMsg);
                    return;
                }
                if (!args[1] || !args[1].match(/^[0-9A-F]{8}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{20}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{12}$/)) {
                    $.say($.whisperPrefix(sender) + $.lang.get('guildwars2.setkey.404'));
                    $.log.error('guildwars2.js', 320, 'Invalid GW2 API Key!');
                    return;
                }
                $.inidb.set('settings', 'gw2_apikey', args[1]);
                GW2_apiKey = args[1];
                $.say($.whisperPrefix(sender) + $.lang.get('guildwars2.setkey.success'));
                return;
            }

            if (!GW2_apiKey) { $.say($.whisperPrefix(sender) + $.lang.get('guildwars2.apikey.404')); return; }

            /**
             * @commandpath gw2 rank [integer] - Displays current league placement or the best of a season given associated with the api key set.
             */
            if (action.equalsIgnoreCase('rank')) {
                data = JSON.parse(_getJSON(GW2_apiURL + '/v2/pvp/standings?access_token=' + GW2_apiKey));
                var league;
                var tier;
                var pips;
                var repeats;
                var UUIDs = JSON.parse(_getJSON('https://api.guildwars2.com/v2/pvp/seasons'));
                for (i = 0; i < Object.keys(UUIDs).length; i++) {
                    if (args[1]) {
                        if (args[1].match(/^[1-9]+$/)) {
                            var season = (parseInt(args[1]) - 1);
                            if (season == i) {
                                league = GW2_leagues[parseInt(data[season].best.division)];
                                tier = GW2_tiers[parseInt(data[season].best.tier)];
                                pips = data[season].best.points;
                                if (league.match('legendary')) {
                                    repeats = data[season].best.repeats;
                                    $.say($.lang.get('guildwars2.rank.peaked.legendary', username, args[1], repeats + '× ' + $.lang.get('guildwars2.leagues.' + league), tier, pips));
                                    return;
                                }
                                $.say($.lang.get('guildwars2.rank.peaked.normal', username, args[1], $.lang.get('guildwars2.leagues.' + league), tier, pips));
                                return;
                            }
                        }
                    }
                    var currSeason = JSON.parse(_getJSON('https://api.guildwars2.com/v2/pvp/seasons?id=' + UUIDs[i]));
                    if (String(currSeason.active) == 'true') {
                        for (i = 0; i < Object.keys(data).length; i++) {
                            if (data[i].season_id == currSeason.id) {
                                league = GW2_leagues[parseInt(data[i].current.division)];
                                tier = GW2_tiers[parseInt(data[i].current.tier)];
                                pips = data[i].current.points;
                            if (league.match('legendary')) {
                                repeats = data[i].current.repeats;
                                $.say($.lang.get('guildwars2.rank.current.legendary', username, repeats + '× ' + $.lang.get('guildwars2.leagues.' + league), tier, pips));
                                return;
                            }
                                $.say($.lang.get('guildwars2.rank.current.normal', username, $.lang.get('guildwars2.leagues.' + league), tier, pips));
                                return;
                            }
                        }
                    }
                }
                $.say($.lang.get('guildwars2.rank.404'));
                return;
            }

            /**
             * @commandpath gw2 stats [profession] - Displays overall pvp stats or stats by a given profession associated with the api key set.
             */
            if (action.equalsIgnoreCase('stats')) {
                data = JSON.parse(_getJSON(GW2_apiURL + '/v2/pvp/stats?access_token=' + GW2_apiKey));
                var wins;
                var losses;
                var desertions;
                var byes;
                var forfeits;
                var trueTotalGames;
                var totalGames;
                var winratio;
                var lossratio;
                var wlRatio;
                if (args[1]) {
                    for (i = 0; i < GW2_professions.length; i++) {
                        var prof_abbreviations = $.lang.get('guildwars2.professions.' + GW2_professions[i]).split(', ');
                        if (prof_abbreviations.indexOf(String(args[1]).toLocaleLowerCase()) > -1) {
                            wins = parseInt(data.professions[GW2_professions[i]].wins);
                            losses = parseInt(data.professions[GW2_professions[i]].losses);
                            desertions = parseInt(data.professions[GW2_professions[i]].desertions);
                            byes = parseInt(data.professions[GW2_professions[i]].byes);
                            forfeits = parseInt(data.professions[GW2_professions[i]].forfeits);
                            trueTotalGames = wins + losses + desertions + byes + forfeits;
                            totalGames = wins + losses + desertions + byes;
                            winratio = parseFloat(((wins + byes)/totalGames)*100);
                            var profession_lang = prof_abbreviations[0].toLocaleLowerCase();
                            profession_lang = profession_lang.charAt(0).toLocaleUpperCase() + profession_lang.slice(1);
                            $.say($.lang.get('guildwars2.stats.profession', username, trueTotalGames, profession_lang, winratio.toFixed(1)));
                        }
                    }
                    return;
                }
                
                var rank = data.pvp_rank;
                wins = parseInt(data.ladders.ranked.wins);
                losses = parseInt(data.ladders.ranked.losses);
                desertions = parseInt(data.ladders.ranked.desertions);
                byes = parseInt(data.ladders.ranked.byes);
                forfeits = parseInt(data.ladders.ranked.forfeits);
                trueTotalGames = wins + losses + desertions + byes + forfeits;
                totalGames = wins + losses + desertions + byes;
                winratio = parseFloat(((wins + byes)/totalGames)*100);
                lossratio = parseFloat(((losses + desertions)/totalGames)*100);
                wlRatio = (winratio/lossratio);
                $.say($.lang.get('guildwars2.stats.ranked', username, rank, trueTotalGames, wlRatio.toFixed(1)));
                return;
            }

            /**
             * @commandpath gw2 characters/chars  - Whispers the names of all the characters associated with the api key set.
             */
            if (action.equalsIgnoreCase('characters') || action.equalsIgnoreCase('chars')) {
                if (!GW2_characters || GW2_characters === undefined) {
                    data = JSON.parse(_getJSON(GW2_apiURL + '/v2/characters?access_token=' + GW2_apiKey));
                    GW2_characters = data.valueOf().toString().replace(/,/g, ', ');
                }
                $.say($.whisperPrefix(sender) + $.lang.get('guildwars2.characters', username, GW2_characters));
                return;
            }

            /**
             * @commandpath gw2 account/acc - Displays general information of the account associated with the api key set.
             */
            if (action.equalsIgnoreCase('account') || action.equalsIgnoreCase('acc')) {
                if (!GW2_accCreated || GW2_accCreated === undefined) {
                    data = JSON.parse(_getJSON(GW2_apiURL + '/v2/account?access_token=' + GW2_apiKey));
                    GW2_accCreated = data.created.replace('Z', '').split('T');
                    GW2_accAccess = data.access;
                    GW2_accName = data.name;
                }
                $.say($.lang.get('guildwars2.account', username, GW2_accName, GW2_accCreated[0], GW2_accCreated[1], GW2_accAccess));
                return;
            }

            /**
             * @commandpath gw2 world/server - Displays the world & population of the world associated with the api key set.
             */
            if (action.equalsIgnoreCase('world') || action.equalsIgnoreCase('server')) {
                if (!GW2_world || GW2_world === undefined) {
                    data = JSON.parse(_getJSON(GW2_apiURL + '/v2/account?access_token=' + GW2_apiKey));
                    GW2_world = JSON.parse(_getJSON(GW2_apiURL + '/v2/worlds?ids=' + data.world.toString() + '&lang=en'));
                    GW2_world_name = GW2_world[0].name;
                    GW2_world_population = $.lang.get('guildwars2.world_population.' + GW2_world[0].population.toLowerCase());
                    GW2_commander = data.commander;
                }
                if (GW2_commander === true) {
                    $.say($.lang.get('guildwars2.world.commander', username, GW2_world_population, GW2_world_name));
                } else {
                    $.say($.lang.get('guildwars2.world', username, GW2_world_population, GW2_world_name));
                }
                return;
            }

            /**
             * @commandpath gw2 wallet/coins/gold/karma - Displays the amount of gold and karma in possession associated with the api key set.
             */
            if (action.equalsIgnoreCase('wallet') || action.equalsIgnoreCase('coins') || action.equalsIgnoreCase('gold') || action.equalsIgnoreCase('karma')) {
                data = JSON.parse(_getJSON(GW2_apiURL + '/v2/account/wallet?access_token=' + GW2_apiKey));
                var rawKarma;
                for (i = 0; i < data.length; i++) {
                    if (data[i].id == 1 ) {
                        coins = data[i].value;
                    }
                    if (data[i].id == 2 ) {
                        rawKarma = data[i].value;
                    }
                }
                $.say($.lang.get('guildwars2.wallet', username, CalcCoins(coins), rawKarma));
                return;
            }

            /**
             * @commandpath gw2 guilds - Whispers the name and tag of guilds associated with the api key set.
             */
            if (action.equalsIgnoreCase('guilds')) {
                if (!GW2_guilds || GW2_guilds === undefined) {
                    data = JSON.parse(_getJSON(GW2_apiURL + '/v2/account?access_token=' + GW2_apiKey));
                    var guild_ids = data.guilds;
                    GW2_guilds = [];
                    for (i = 0; i < guild_ids.length; i++) {
                        var guild = JSON.parse(_getJSON(GW2_apiURL + '/v1/guild_details.json?guild_id=' + guild_ids[i]));
                        GW2_guilds.push(guild.guild_name + ' [' + guild.tag + ']');
                    }
                    GW2_guilds = GW2_guilds.toString().replace(/,/g, ', ');
                }
                $.say($.whisperPrefix(sender) + $.lang.get('guildwars2.guilds', username, GW2_guilds));
                return;
            }

            /**
             * @commandpath gw2 wvw - Displays the current WvW level associated with the api key set.
             */
            if (action.equalsIgnoreCase('wvw')) {
                if (!GW2_wvw_rank || GW2_wvw_rank === undefined) {
                    data = JSON.parse(_getJSON(GW2_apiURL + '/v2/account?access_token=' + GW2_apiKey));
                    GW2_wvw_rank = data.wvw_rank.toString();
                    GW2_commander = data.commander;
                    setTimeout(function(){ GW2_wvw_rank = undefined; }, 1800000);
                }
                if (GW2_commander === true) {
                    $.say($.lang.get('guildwars2.wvw.commander', username, GW2_wvw_rank));
                } else {
                    $.say($.lang.get('guildwars2.wvw', username, GW2_wvw_rank));
                }
                return;
            }
            
            /**
             * @commandpath gw2 fractals/fracs - Displays the current fractal level associated with the api key set.
             */
            if (action.equalsIgnoreCase('fractals') || action.equalsIgnoreCase('fracs')) {
                if (!GW2_fractal_level || GW2_fractal_level === undefined) {
                    data = JSON.parse(_getJSON(GW2_apiURL + '/v2/account?access_token=' + GW2_apiKey));
                    GW2_fractal_level = data.fractal_level.toString();
                    setTimeout(function(){ GW2_fractal_level = undefined; }, 1800000);
                }
                $.say($.lang.get('guildwars2.fractals', username, GW2_fractal_level));
                return;
            }
            if (action.equalsIgnoreCase('wiki')) {
                if (args[1]) {
                    var wiki_lang = args.filter(function(str){ return str != action; });
                    for (i = 0; i < wiki_lang.length; i++) {
                        wiki_lang[i] = String(wiki_lang[i]).charAt(0).toLocaleUpperCase() + wiki_lang[i].slice(1);
                    }
                    $.say('http://wiki.guildwars2.com?search=' + encodeURI(String(wiki_lang).replace(/,/g,' ')));
                }
                return;
            }

            /**
            * @commandpath gw2 build [gamemode] [character] - Returns a gw2tool.net link that will forward to the gw2skills.net build editor which will be adjusted to the current equipped build in a specified gamemode on a specified character associated with the api key set.
             */
            if (action.equalsIgnoreCase('build')) {
                data = JSON.parse(_getJSON(GW2_apiURL + '/v2/characters?access_token=' + GW2_apiKey));
                args = args.filter(function(str){ return str != action; }).toString().replace(/,/g, ' ').toLocaleLowerCase();
                for (i = 0; i < data.length; i++) {
                    if (args.includes(data[i].toLocaleLowerCase())) {
                        var gamemode = args.replace(data[i].toLocaleLowerCase(), '');
                        var GW2ToolID;
                        if (gamemode.match(/pve|(s)?pvp|(wv)?wvw/i)) {
                            GW2ToolID = JSON.parse(_getJSON('http://gw2tool.net/api/token-check?token=' + GW2_apiKey)).code;
                            if (!GW2ToolID || !GW2ToolID.match(/^\w{10,10}$/)) { $.consoleLn('Error: Couldn\'t recieve GW2ToolID!'); return; }
                            _updateGW2ToolRights('http://gw2tool.net/api/save-rights?code=' + GW2ToolID);
                        }
                        if (gamemode.match(/pve/i)) {
                            $.say($.lang.get('guildwars2.build.pve', data[i], 'https://gw2tool.net/en/' + GW2ToolID + '/gw2skills-pve/' + encodeURI(data[i])));
                            return;
                        }
                        if (gamemode.match(/(s)?pvp/i)) {
                            $.say($.lang.get('guildwars2.build.pvp', data[i], 'https://gw2tool.net/en/' + GW2ToolID + '/gw2skills-pvp/' + encodeURI(data[i])));
                            return;
                        }
                        if (gamemode.match(/(wv)?wvw/i)) {
                            $.say($.lang.get('guildwars2.build.wvw', data[i], 'https://gw2tool.net/en/' + GW2ToolID + '/gw2skills-wvw/' + encodeURI(data[i])));
                            return;
                        }
                    }
                }
                $.say($.lang.get('guildwars2.build.404'));
                return;
            }

            /**
             * @commandpath gw2 deathcounter/deaths [character] - Toggles a death counter for a specific character associated with the api key set and writes its value to '[...]/addons/guildwars2/session_deaths.txt'.
             */
            if (action.equalsIgnoreCase('deathcounter') || action.equalsIgnoreCase('deaths')) {
                if (!$.isMod(sender)) {
                    $.say($.whisperPrefix(sender) + $.adminMsg);
                    return;
                }
                if (GW2_toggle_deathcounter == 1) {
                    GW2_toggle_deathcounter = 0;
                    $.say($.whisperPrefix(sender) + $.lang.get('guildwars2.deathcounter.disabled'));
                } else {
                    if ($.isDirectory('./addons/guildwars2') !== true && $.fileExists('./addons/guildwars2/session_deaths.txt') !== true) {
                        $.mkDir('./addons/guildwars2');
                        java.io.File ('./addons/guildwars2/', 'session_deaths.txt');
                    }
                    if (args[1]) {
                        var charname = args.filter(function(str){ return str != action; });
                        for (i = 0; i < charname.length; i++) {
                            charname[i] = String(charname[i]).charAt(0).toLocaleUpperCase() + charname[i].slice(1).toLocaleLowerCase();
                        }
                        data = JSON.parse(_getJSON(GW2_apiURL + '/v2/characters/' + String(charname).replace(/,/g,' ') + '?access_token=' + GW2_apiKey)).deaths;
                        if (!data || data === undefined) {
                            $.say($.whisperPrefix(sender) + $.lang.get('guildwars2.deathcounter.error'));
                            return;
                        }
                        $.writeToFile('0☠', './addons/guildwars2/session_deaths.txt', false);
                        GW2_session_deaths = 0;
                        GW2_overall_deaths = parseInt(data);
                        GW2_deathcounterChar = String(charname).replace(/,/g,' ');
                        GW2_last_game =  JSON.parse(_getJSON(GW2_apiURL + '/v2/pvp/games?access_token=' + GW2_apiKey)).shift();
                        GW2_toggle_deathcounter = 1;
                        $.say($.whisperPrefix(sender) + $.lang.get('guildwars2.deathcounter.enabled', GW2_deathcounterChar));
                    }
                }
                return;
            }

            /**
             * @commandpath gw2 goldcounter - Toggles a gold counter for the gold associated with the api key set and writes initial gold, earnings plus losses to '[...]/addons/guildwars2/session_gold.txt'.
             */
            if (action.equalsIgnoreCase('goldcounter')) {
                if (!$.isMod(sender)) {
                    $.say($.whisperPrefix(sender) + $.adminMsg);
                    return;
                }
                if (GW2_toggle_goldcounter == 1) {
                    GW2_toggle_goldcounter = 0;
                    $.say($.whisperPrefix(sender) + $.lang.get('guildwars2.goldcounter.disabled'));
                } else {
                    if ($.isDirectory('./addons/guildwars2') !== true && $.fileExists('./addons/guildwars2/session_gold.txt') !== true) {
                        $.mkDir('./addons/guildwars2');
                        java.io.File ('./addons/guildwars2/', 'session_gold.txt');
                    }
                    data = JSON.parse(_getJSON(GW2_apiURL + '/v2/account/wallet?access_token=' + GW2_apiKey));
                    for (i = 0; i < data.length; i++) {
                        if (data[i].id == 1 ) {
                            coins = parseInt(data[i].value);
                        }
                    }
                    $.writeToFile(CalcCoins(coins) + '\n+0c', './addons/guildwars2/session_gold.txt', false);
                    GW2_session_gold = 0;
                    GW2_overall_gold = coins;
                    GW2_toggle_goldcounter = 1;
                    $.say($.whisperPrefix(sender) + $.lang.get('guildwars2.goldcounter.enabled'));    
                }
                return;
            }

            /**
             * @commandpath gw2 coinsformat - Toggles between two different currency formats: '####.00,00g' or '####g 00s 00c' (default).
             */
            if (action.equalsIgnoreCase('coinsformat')) {
                if (!$.isMod(sender)) {
                    $.say($.whisperPrefix(sender) + $.adminMsg);
                    return;
                }
                if (GW2_coinformat == 1) {
                    GW2_coinformat = 0;
                    $.inidb.set('settings', 'gw2_coinformat', '0');
                    $.say($.whisperPrefix(sender) + $.lang.get('guildwars2.coinsformat.toggle', '####g 00s 00c'));
                    $.consoleLn($.lang.get('guildwars2.coinsformat.toggle', '####g 00s 00c'));
                } else {
                    GW2_coinformat = 1;
                    $.inidb.set('settings', 'gw2_coinformat', '1');
                    $.say($.whisperPrefix(sender) + $.lang.get('guildwars2.coinsformat.toggle', '####.00,00g'));
                    $.consoleLn($.lang.get('guildwars2.coinsformat.toggle', '####.00,00g'));
                }
                return;
            }

            /**
             * @commandpath gw2 birthday/bday - Checks if any character associated with the api key set had birthday on the last 3 days.
             */
            if (action.equalsIgnoreCase('birthday') || action.equalsIgnoreCase('bday')) {
                if (!GW2_birthday || GW2_birthday === undefined) {
                    data = JSON.parse(_getJSON(GW2_apiURL + '/v2/characters?access_token=' + GW2_apiKey));
                    var d = $.getCurLocalTimeString('yyyy-MM-dd');
                    var d_array = d.split('-');
                    for (i = 0; i < data.length; i++) {
                        var char_name = data[i];
                        var char_data = JSON.parse(_getJSON(GW2_apiURL + '/v2/characters/' + char_name + '?access_token=' + GW2_apiKey));
                        var c = char_data.created.split('T')[0];
                        var c_array = c.split('-');
                        if (c_array[1] == d_array[1] && Math.abs(parseInt(c_array[2]) - parseInt(d_array[2])) <= 3) {
                            GW2_birthday = (char_name + (GW2_birthday?', ' + GW2_birthday:''))
                        }
                    }
                }
                if (GW2_birthday) {
                    $.say($.lang.get('guildwars2.birthday', username, GW2_birthday));
                } else {
                    $.say($.lang.get('guildwars2.birthday.404', username));
                }
                return;
            }
        }
    });

    /**
     * @event initReady
     */
    $.bind('initReady', function() {
        if ($.bot.isModuleEnabled('./games/guildwars2.js')) {
            $.registerChatCommand('./games/guildwars2.js', 'gw2', 7);
            $.registerChatSubcommand('gw2', 'setkey', 1);
            $.registerChatSubcommand('gw2', 'rank', 7);
            $.registerChatSubcommand('gw2', 'stats', 7);
            $.registerChatSubcommand('gw2', 'characters', 7); 
            $.registerChatSubcommand('gw2', 'chars', 7);
            $.registerChatSubcommand('gw2', 'account', 7);
            $.registerChatSubcommand('gw2', 'acc', 7);
            $.registerChatSubcommand('gw2', 'world', 7);
            $.registerChatSubcommand('gw2', 'server', 7);
            $.registerChatSubcommand('gw2', 'wallet', 7); 
            $.registerChatSubcommand('gw2', 'coins', 7);
            $.registerChatSubcommand('gw2', 'gold', 7); 
            $.registerChatSubcommand('gw2', 'karma', 7);
            $.registerChatSubcommand('gw2', 'guilds', 7);
            $.registerChatSubcommand('gw2', 'wvw', 7);
            $.registerChatSubcommand('gw2', 'fractals', 7);
            $.registerChatSubcommand('gw2', 'fracs', 7);
            $.registerChatSubcommand('gw2', 'build', 7);
            $.registerChatSubcommand('gw2', 'deathcounter', 2);
            $.registerChatSubcommand('gw2', 'deaths', 2);
            $.registerChatSubcommand('gw2', 'goldcounter', 2);
            $.registerChatSubcommand('gw2', 'coinsformat', 2);
            $.registerChatSubcommand('gw2', 'birthday', 7);
            $.registerChatSubcommand('gw2', 'bday', 7);
        }
    });
})();    