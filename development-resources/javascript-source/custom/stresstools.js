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

/* global Packages */

// Stress test tools
(function () {
    let numMessages = 0;
    let numMessagesExt = 0;
    let count = 0;
    let start = Packages.java.time.Instant.now();

    function doStatus() {
        let memHeap = Packages.com.gmt2001.Reflect.getHeapMemoryUsage();
        let memNonHeap = Packages.com.gmt2001.Reflect.getNonHeapMemoryUsage();
        let line1 = 'uptime=' + Packages.java.time.Duration.between(start, Packages.java.time.Instant.now()).toString();
        let line2 = 'numMessages=' + numMessages + ' <> numMessagesExt=' + numMessagesExt;
        let line3 = 'present=' + $.users.length + ' <> seen=' + count;
        let line4 = 'Heap used=' + Packages.org.apache.commons.io.FileUtils.byteCountToDisplaySize(memHeap.getUsed())
            + ' <> committed=' + Packages.org.apache.commons.io.FileUtils.byteCountToDisplaySize(memHeap.getCommitted());
        let line5 = 'Non-Heap used=' + Packages.org.apache.commons.io.FileUtils.byteCountToDisplaySize(memNonHeap.getUsed())
            + ' <> committed=' + Packages.org.apache.commons.io.FileUtils.byteCountToDisplaySize(memNonHeap.getCommitted());
        $.consoleLn('');
        $.consoleLn(line1);
        $.consoleLn(line2);
        $.consoleLn(line3);
        $.consoleLn(line4);
        $.consoleLn(line5);
        $.consoleLn('');
        $.log.file('stress', '');
        $.log.file('stress', line1);
        $.log.file('stress', line2);
        $.log.file('stress', line3);
        $.log.file('stress', line4);
        $.log.file('stress', line5);
    }

    $.consoleLn('Starting stress tools');
    $.log.file('stress', 'Starting stress tools');

    $.inidb.RemoveFile('stress_seen');

    doStatus();

    let pinger = setInterval(function() {
        $.consoleLn('PING');
        Packages.tv.phantombot.PhantomBot.instance().getTMI().sendPing();
    }, 300000);

    let status = setInterval(function() {
        doStatus();
    }, 600000);

    $.bind('ircModeration', function (event) {
        numMessages++;

        if (numMessages >= 1000000) {
            numMessagesExt ++;
            numMessages = 0;
        }

        if (!$.inidb.exists('stress_seen', event.getSender())) {
            $.inidb.set('stress_seen', event.getSender(), 'true');
            count++;
        }
    });

    $.bind('shutdown', function () {
        clearInterval(pinger);
        clearInterval(status);
        doStatus();
        $.consoleLn('');
        $.consoleLn('End of session');
        $.consoleLn('');
        $.log.file('stress', '');
        $.log.file('stress', 'End of session');
        $.log.file('stress', '');
    });
})();
