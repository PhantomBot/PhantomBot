/*
 * Copyright (C) 2016-2020 phantombot.tv
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

(function() {
    var reCustomAPI = new RegExp(/\(customapi\s.*\)/),
        reCustomAPIJson = new RegExp(/\(customapijson\s.*\)/);

    /**
     * @function drsTimer
     */
    function drsTimer() {
        var entries,
            parts,
            apiStatus,
            commandHelpData = {},
            commandHelpFileData,
            lastTime = parseInt($.getSetIniDbNumber('datarenderservice', 'last_time', 0)),
            checkTime = lastTime + parseInt(90 * 6e4),
            JSONStringer = Packages.org.json.JSONStringer;

        /* Run only once every 90 minutes. Do not change this. The Data Service has a rate limit
         * and will reject the data.
         */
        if (lastTime > 0 && checkTime > $.systemTime()) {
            return;
        }

        $.consoleLn('DataRenderService: Processing Data (see event logs for details)');
        $.log.event('DataRenderService: Handler Process Start');

        commandHelpFileData = $.readFile('./addons/dataservice/commands_help.txt');
        for (var idx in commandHelpFileData) {
            if (commandHelpFileData[idx].startsWith('#')) {
                continue;
            }
            if (!commandHelpFileData[idx].includes(',')) {
                continue;
            }
            parts = commandHelpFileData[idx].split(', ', 2);
            commandHelpData[parts[0]] = parts[1];
        }

        entries = $.inidb.GetKeyValueList('command', '');
        jsonStringer = new JSONStringer();
        jsonStringer.object().key('commands').array();
        for (var idx in entries) {
            // commandValue is a Java string, but needs to be a JS string for the replace() calls
            // below to work, so we cast it explicitly here.
            var command = entries[idx].key, commandValue = String(entries[idx].value);
            if (!$.inidb.exists('disabledCommands', command)) {
                jsonStringer.object();
                jsonStringer.key('command').value(command);

                if (commandHelpData[command] === undefined) {
                    jsonStringer.key('help').value('');
                } else {
                    jsonStringer.key('help').value(commandHelpData[command]);
                }

                if (commandValue.match(reCustomAPI)) {
                    commandValue = commandValue.replace(reCustomAPI, '(customapi)');
                }
                if (commandValue.match(reCustomAPIJson)) {
                    commandValue = commandValue.replace(reCustomAPIJson, '(customapijson)');
                }
                jsonStringer.key('value').value(commandValue);
                jsonStringer.endObject();
            }
        }
        jsonStringer.endArray().endObject();
        apiStatus = $.dataRenderServiceAPI.postData(jsonStringer.toString(), $.channelName, 'commands');
        $.log.event('DataRenderService: Commands API status : ' + apiStatus);

        entries = $.inidb.GetKeyValueList('quotes', '');
        jsonStringer = new JSONStringer();
        jsonStringer.object().key('quotes').array();
        for (var idx in entries) {
            var quoteObj = JSON.parse(entries[idx].value);
            jsonStringer.object();
            jsonStringer.key('id').value(parseInt(entries[idx].key));
            jsonStringer.key('user').value(quoteObj[0] + '');
            jsonStringer.key('quote').value(quoteObj[1] + '');
            jsonStringer.endObject();
        }
        jsonStringer.endArray().endObject();
        apiStatus = $.dataRenderServiceAPI.postData(jsonStringer.toString(), $.channelName, 'quotes');
        $.log.event('DataRenderService: Quotes API status : ' + apiStatus);

        entries = $.inidb.GetKeyValueList('points', '');
        jsonStringer = new JSONStringer();
        jsonStringer.object().key('pointsName').value($.pointNameMultiple).key('points').array();
        for (var idx in entries) {
            jsonStringer.object();
            jsonStringer.key('user').value(entries[idx].key);
            jsonStringer.key('points').value(entries[idx].value);
            jsonStringer.endObject();
        }
        jsonStringer.endArray().endObject();
        apiStatus = $.dataRenderServiceAPI.postData(jsonStringer.toString(), $.channelName, 'points');
        $.log.event('DataRenderService: Points API status : ' + apiStatus);

        entries = $.inidb.GetKeyValueList('time', '');
        jsonStringer = new JSONStringer();
        ranksJsonStringer = new JSONStringer();
        jsonStringer.object().key('times').array();
        ranksJsonStringer.object().key('ranks').array();
        for (var idx in entries) {
            var user = entries[idx].key, time = entries[idx].value;
            jsonStringer.object();
            jsonStringer.key('user').value(user);
            jsonStringer.key('time').value(time);
            jsonStringer.endObject();

            ranksJsonStringer.object();
            ranksJsonStringer.key('user').value(user);
            ranksJsonStringer.key('rank').value($.getRank(user, parseInt(time)));
            ranksJsonStringer.endObject();
        }
        jsonStringer.endArray().endObject();
        ranksJsonStringer.endArray().endObject();
        apiStatus = $.dataRenderServiceAPI.postData(jsonStringer.toString(), $.channelName, 'times');
        $.log.event('DataRenderService: Times API status : ' + apiStatus);

        apiStatus = $.dataRenderServiceAPI.postData(ranksJsonStringer.toString(), $.channelName, 'ranks');
        $.log.event('DataRenderService: Ranks API status : ' + apiStatus);

        $.log.event('DataRenderService: Handler Process Complete');
        $.setIniDbNumber('datarenderservice', 'last_time', $.systemTime());

        $.consoleLn('DataRenderService: Data has been Processed');
    }

    /**
     * @event command
     */
    $.bind('command', function(event) {
        var sender = event.getSender(),
            command = event.getCommand(),
            args = event.getArgs();

        /**
         * @commandpath terminatedataserviceapi - Removes all account and PhantomBot data from the Render Data Service.
         */
        if (command.equalsIgnoreCase('terminatedataserviceapi')) {
            apiStatus = $.dataRenderServiceAPI.deleteAllData($.channelName);
            $.say($.whisperPrefix(sender) + $.lang.get('dataservicehandler.delete.status.' + apiStatus));
            return;
        }

    });

    /**
     * @event initReady
     */
    $.bind('initReady', function() {
        $.registerChatCommand('./handlers/dataServiceHandler.js', 'terminatedataserviceapi', 1);

        if ($.dataRenderServiceAPI.hasAPIKey()) {
            $.consoleLn('Data Render Service API Key Present, Enabling Data Feed');
            setInterval(drsTimer, 6e4);
        }
    });
})();
