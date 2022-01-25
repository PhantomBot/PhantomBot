(function() {
    var cost = $.getSetIniDbNumber('defuse', 'cost', 500),
        cooldown = $.getSetIniDbNumber('defuse', 'cooldown', 10),
        wires = ['red', 'blue', 'yellow'];

    $.bind('command', function(event) {
        var sender = event.getSender().toLowerCase(),
            command = event.getCommand(),
            args = event.getArgs(),
            action = args[0],
            actionArg1 = args[1],
            actionArg2 = args[2];

        if (command.equalsIgnoreCase('defuse')) {
            if (!action || (action != 'red' && action != 'blue' && action != 'yellow')) {
                $.say($.whisperPrefix(sender) + ' you need to choose one of these wires to cut: ' + wires.join(", "))
                return;
            }

            var msg = $.lang.get('defuse.begin', sender, action)

            var option = $.randRange(0,2);
            success = wires[option];
            if(action.toLowerCase() == success) {
                var multiplier = 3;
                var rMin = cost * multiplier - cost / multiplier;
                var rMax = cost * multiplier + cost / multiplier;
                var value = $.randRange(rMin, rMax);

                $.inidb.incr('points', sender, value)
                msg = msg + $.lang.get('defuse.success', value, $.pointNameMultiple)
                $.alertspollssocket.alertImage('defuse.gif,8');
            } else {
                msg = msg + $.lang.get('defuse.fail', cost, $.pointNameMultiple)
                $.alertspollssocket.alertImage('detonated.gif,10');
            }
            $.say(msg);

        }

    });

    $.bind('initReady', function() {
        $.registerChatCommand('./custom/defuse.js', 'defuse', 7)
    });
})()