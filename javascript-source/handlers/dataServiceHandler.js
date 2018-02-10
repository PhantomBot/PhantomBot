(function() {
    var reCustomAPI = new RegExp(/\(customapi\s.*\)/),
        reCustomAPIJson = new RegExp(/\(customapijson\s.*\)/);

    /**
     * @function drsTimer
     */
    function drsTimer() {
        var keys,
            parts,
            apiStatus,
            commandValue,
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

        keys = $.inidb.GetKeyList('command', '');
        jsonStringer = new JSONStringer();
        jsonStringer.object().key('commands').array();
        for (var idx in keys) {
            if (!$.inidb.exists('disabledCommands', keys[idx])) {
                jsonStringer.object();
                jsonStringer.key('command').value(keys[idx] + '');

                if (commandHelpData[keys[idx]] === undefined) {
                    jsonStringer.key('help').value('');
                } else {
                    jsonStringer.key('help').value(commandHelpData[keys[idx]]);
                }

                commandValue = String($.inidb.get('command', keys[idx]));
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

        keys = $.inidb.GetKeyList('quotes', '');
        jsonStringer = new JSONStringer();
        jsonStringer.object().key('quotes').array();
        for (var idx in keys) {
            var quoteObj = JSON.parse($.inidb.get('quotes', keys[idx]));
            jsonStringer.object();
            jsonStringer.key('id').value(parseInt(keys[idx]));
            jsonStringer.key('user').value(quoteObj[0] + '');
            jsonStringer.key('quote').value(quoteObj[1] + '');
            jsonStringer.endObject();
        }
        jsonStringer.endArray().endObject();
        apiStatus = $.dataRenderServiceAPI.postData(jsonStringer.toString(), $.channelName, 'quotes');
        $.log.event('DataRenderService: Quotes API status : ' + apiStatus);

        keys = $.inidb.GetKeyList('points', '');
        jsonStringer = new JSONStringer();
        jsonStringer.object().key('pointsName').value($.pointNameMultiple).key('points').array();
        for (var idx in keys) {
            jsonStringer.object();
            jsonStringer.key('user').value(keys[idx] + '');
            jsonStringer.key('points').value($.inidb.get('points', keys[idx]));
            jsonStringer.endObject();
        }
        jsonStringer.endArray().endObject();
        apiStatus = $.dataRenderServiceAPI.postData(jsonStringer.toString(), $.channelName, 'points');
        $.log.event('DataRenderService: Points API status : ' + apiStatus);

        keys = $.inidb.GetKeyList('time', '');
        jsonStringer = new JSONStringer();
        ranksJsonStringer = new JSONStringer();
        jsonStringer.object().key('times').array();
        ranksJsonStringer.object().key('ranks').array();
        for (var idx in keys) {
            jsonStringer.object();
            jsonStringer.key('user').value(keys[idx] + '');
            jsonStringer.key('time').value($.inidb.get('time', keys[idx]));
            jsonStringer.endObject();

            ranksJsonStringer.object();
            ranksJsonStringer.key('user').value(keys[idx] + '');
            ranksJsonStringer.key('rank').value($.getRank(keys[idx]));
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
