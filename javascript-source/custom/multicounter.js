(function() {
    baseFileOutputPath ='./addons/'
    function getCount(counterName) {
        return $.getSetIniDbString('multicounter', counterName, '0');
    }

    function resetCount(counterName) {
        $.inidb.set('multicounter', counterName, 0);
        writeFile(counterName, '0')
        return '0';
    }

    function addCount(counterName) {
        $.inidb.incr('multicounter', counterName, 1);
        return getAndWriteCount(counterName)
    }

    function removeCount(counterName) {
        $.inidb.decr('multicounter', counterName, 1);
        return getAndWriteCount(counterName);
    }

    function setCount(counterName, amount) {
        $.inidb.set('multicounter', counterName, parseInt(amount));
        return getAndWriteCount(counterName);
    }

    function getAndWriteCount(counterName) {
        count = getCount(counterName);
        writeFile(counterName, count);
        return count
    }

    function writeFile(counterName, amount) {
        var writer = new java.io.OutputStreamWriter(new java.io.FileOutputStream(baseFileOutputPath + counterName + '.txt'), 'UTF-8');
        try {
            writer.write(amount);
        } catch (ex) {
            $.log.error('Failed to write counter file: ' + ex.toString());
        } finally {
            writer.close();
        }
    }


    function multicounter(args, event) {

        var sender = event.getSender().toLowerCase(),
            eventArgs = event.getArgs(),
            action = eventArgs[0],
            actionArg1 = eventArgs[1],
            counterName = args.trim();

        if(!$.isMod(sender) || !action) {
            return {
                result: getCount(counterName),
                cache: false
            }
        }

        if(action == "+") {
            return {
                result: addCount(counterName),
                cache: false
            }
        }

        if(action == "-") {
            return {
                result: removeCount(counterName),
                cache: false
            }
        }

        if(action == "reset") {
            return {
                result: resetCount(counterName),
                cache: false
            }
        }

        if(action == "set") {
            return {
                result: setCount(counterName, actionArg1),
                cache: false
            }
        }

    }

    $.bind('initReady', function(){
        $.addTagTransformer('multicounter', multicounter);
    });
})();