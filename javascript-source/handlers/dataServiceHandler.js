(function() {

    /**
     * @event command
     */
    $.bind('command', function(event) {
        var sender = event.getSender().toLowerCase(),
            command = event.getCommand(),
            args = event.getArgs(),
            keys, 
            apiStatus,
            jsonObject = [],
            JSONStringer = Packages.org.json.JSONStringer;

        /**
         * @commandpath updatecommandsapi - Sends command data to the Render Data Service API.
         */
        if (command.equalsIgnoreCase('updatecommandsapi')) {
            keys = $.inidb.GetKeyList('command', '');

            jsonObject['commands'] = [];
            for (var idx in keys) {
                if (!$.inidb.exists('disabledCommands', keys[idx])) {
                    jsonObject['commands'].push({ command: keys[idx] + '' });
                }
            }
            apiStatus = $.dataRenderServiceAPI.postData(JSON.stringify(jsonObject), $.channelName, 'commands');
            $.say($.whisperPrefix(sender) + $.lang.get('dataservicehandler.update.status.' + apiStatus));
            return;
        }

        /**
         * @commandpath updatequotesapi - Sends quote data to the Render Data Service API.
         */
        if (command.equalsIgnoreCase('updatequotesapi')) {
            keys = $.inidb.GetKeyList('quotes', '');

            jsonObject['quotes'] = [];
            for (var idx in keys) {
                var quoteObj = JSON.parse($.inidb.get('quotes', keys[idx]));
                jsonObject['quotes'].push({ id: parseInt(keys[idx]), user: quoteObj[0] + '', quote: quoteObj[1] + '' });
            }
            apiStatus = $.dataRenderServiceAPI.postData(JSON.stringify(jsonObject), $.channelName, 'quotes');
            $.say($.whisperPrefix(sender) + $.lang.get('dataservicehandler.update.status.' + apiStatus));
            return;
        }

        /**
         * @commandpath updatepointsapi - Sends points data to the Render Data Service API.
         */
        if (command.equalsIgnoreCase('updatepointsapi')) {
            keys = $.inidb.GetKeyList('points', '');

            jsonStringer = new JSONStringer();
            jsonStringer.object().key('pointsName').value($.pointNameMultiple).key('points').array();
            for (var idx in keys) {
                jsonStringer.object().key(keys[idx]).value($.inidb.get('points', keys[idx])).endObject();
            }
            jsonStringer.endArray().endObject();
            apiStatus = $.dataRenderServiceAPI.postData(jsonStringer.toString(), $.channelName, 'points');
            $.say($.whisperPrefix(sender) + $.lang.get('dataservicehandler.update.status.' + apiStatus));
            return;
        }

        /**
         * @commandpath updatetimesapi - Sends time data to the Render Data Service API.
         */
        if (command.equalsIgnoreCase('updatetimesapi')) {
            keys = $.inidb.GetKeyList('points', '');

            jsonStringer = new JSONStringer();
            jsonStringer.object().key('times').array();
            for (var idx in keys) {
                jsonStringer.object().key(keys[idx]).value($.inidb.get('time', keys[idx])).endObject();
            }
            jsonStringer.endArray().endObject();
            apiStatus = $.dataRenderServiceAPI.postData(jsonStringer.toString(), $.channelName, 'times');
            $.say($.whisperPrefix(sender) + $.lang.get('dataservicehandler.update.status.' + apiStatus));
            return;
        }

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
        if ($.bot.isModuleEnabled('./handlers/dataServiceHandler.js')) {
            $.registerChatCommand('./handlers/dataServiceHandler.js', 'updatecommandsapi', 1);
            $.registerChatCommand('./handlers/dataServiceHandler.js', 'updatequotesapi', 1);
            $.registerChatCommand('./handlers/dataServiceHandler.js', 'updatepointsapi', 1);
            $.registerChatCommand('./handlers/dataServiceHandler.js', 'updatetimesapi', 1);
            $.registerChatCommand('./handlers/dataServiceHandler.js', 'terminatedataserviceapi', 1);
        }
    });

})();
