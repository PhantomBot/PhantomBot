/* astyle --style=java --indent=spaces=4 */

/*
 * Copyright (C) 2016 phantombot.tv
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
package com.illusionaryone;

import com.gmt2001.DataStore;
import com.gmt2001.UncaughtExceptionHandler;

import me.mast3rplan.phantombot.PhantomBot;
import me.mast3rplan.phantombot.cache.TwitchCache;
import me.mast3rplan.phantombot.event.command.CommandEvent;
import me.mast3rplan.phantombot.script.ScriptEventManager;
import me.mast3rplan.phantombot.twitchwsirc.Session;

import com.google.common.collect.Maps;

import java.util.Calendar;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.Map.Entry;

/*
 * Provides a timer system for managing notices.  Reads data directly from the 
 * DB to determine when to run timers.
 *
 * @author illusionaryone
 */
public class NoticeTimer implements Runnable {

    private static final Map<String, NoticeTimer> instances = Maps.newHashMap();
    private Thread noticeThread;
    private String channel;
    private Session session;
    private ScriptEventManager scriptEventManager = ScriptEventManager.instance();
    private String botname;

    private boolean killed = false;
    private boolean reIndex = false;
    private long lastNoticeTime = -1L;
    private int lastMinuteRan = -1;
    private int lastNoticeID = -1;

    /*
     * The instance creation for a NoticeTimer object.
     *
     * @param    String        Channel - The name of the channel that this object belongs to.
     * @param    Session       Session - The WSIRC Session object to send data to.
     * @return   NoticeTimer   The newly created, or existing, instanced object.
     */
    public static NoticeTimer instance(String channel, Session session) {
        if (channel.startsWith("#")) {
            channel = channel.substring(1);
        }

        NoticeTimer instance = instances.get(channel);
        if (instance == null) {
            instance = new NoticeTimer(channel, session);
            instances.put(channel, instance);
            return instance;
        }
        return instance;
    }

    /*
     * The constructor for the NoticeTimer object.
     *
     * @param    String        Channel - The name of the channel that this object belongs to.
     * @param    Session       Session - The WSIRC Session object to send data to.
     */
    @SuppressWarnings("CallToThreadStartDuringObjectConstruction")
    private NoticeTimer(String channel, Session session) {
        this.channel = channel;
        this.session = session;
        this.botname = PhantomBot.instance().getBotName();

        this.noticeThread = new Thread(this);

        Thread.setDefaultUncaughtExceptionHandler(com.gmt2001.UncaughtExceptionHandler.instance());
        this.noticeThread.setUncaughtExceptionHandler(com.gmt2001.UncaughtExceptionHandler.instance());

        noticeThread.start();
    }

    /*
     * Main thread processing.  Reads data from the database to determine which notices to fire and when
     * to do so.
     */
    @Override
    @SuppressWarnings("SleepWhileInLoop")
    public void run() {
        /*
         * Wait 30 seconds before starting to process notices.  Sometimes the bot may not fully be logged into
         * chat and the session.say() command doesn't send anything.
         */
        try {
            Thread.sleep(30000);
        } catch (InterruptedException ex) {
            com.gmt2001.Console.debug.println("InterruptedException: " + ex.getMessage());
        }

        /*
         * Now, sync to the top of the minute.  Allow for a little bit of drift in case the bot is busy or we 
         * are already near the top of the minute.
         */
        boolean sync = false;
        while (!sync) {
            int currentSecond = Calendar.getInstance().get(Calendar.SECOND);
            if (currentSecond < 6) {
                sync = true;
            }

            try {
                Thread.sleep(2000);
            } catch (InterruptedException ex) {
                com.gmt2001.Console.debug.println("InterruptedException: " + ex.getMessage());
            }
        }

        /* Main loop for processing the notices. */
        while (!killed) {
            int currentMinute = Calendar.getInstance().get(Calendar.MINUTE);

            if (this.lastMinuteRan != currentMinute) {
                this.lastMinuteRan = currentMinute;
                processTimers(currentMinute);
            }

            /* Wait 30 seconds between checking for the next minute to arrive. */
            try {
                Thread.sleep(30000);
            } catch (InterruptedException ex) {
                com.gmt2001.Console.debug.println("InterruptedException: " + ex.getMessage());
            }
        }

    }

    /*
     * Determines which timer process to utilize.
     *
     * @param    int    currentMinute - Passed to processScheduledTimers()
     */
    private void processTimers(int currentMinute) {
        TwitchCache twitchCache = TwitchCache.instance(this.channel);
        DataStore dataStore = PhantomBot.instance().getDataStore();

        /* If offline and the offline toggle is true, do not process the timers. */
        String offlineToggle = dataStore.GetString("noticeSettings", "", "noticeOfflineToggle");
        if (offlineToggle != null) {
            if (offlineToggle.equals("true") && !twitchCache.isStreamOnline()) {
                return;
            }
        }

        /* Determine which type of notice timer is being used and call the proper function to handle. */
        String timerScheduled = dataStore.GetString("noticeSettings", "", "useScheduledTimer");
        if (timerScheduled == null) {
            processOrderedTimers();
            return;
        } 
        if (timerScheduled.length() == 0 || timerScheduled.toLowerCase().equals("false")) {
            processOrderedTimers();
            return;
        }

        /* Reset lastNoticeTime to -1 in case the user switches between the different modes. Note that 
         * lastNoticeTime is only used by processOrderedTimers().
         */
        lastNoticeTime = -1L;
        processScheduledTimers(currentMinute);
    }
  

    /*
     * Performs the main procesing of ordered timers.
     */
    private void processOrderedTimers() {
        DataStore dataStore = PhantomBot.instance().getDataStore();

        /*
         * If the lastNoticeTime is -1, then this timer type has not been used yet.  Set to current
         * time_t and exit function.  The way the first notice will go out after the configured
         * amount of wait time.
         */
        if (lastNoticeTime == -1) {
            lastNoticeTime = System.currentTimeMillis() / 1000L;
            return;
        }

        /* Get the current time and compare to the lastNoticeTime, convert to minutes. */
        long currentNoticeTime = System.currentTimeMillis() / 1000L;
        long noticeTimeDiff = (currentNoticeTime - lastNoticeTime) / 60L;
        long noticeTimeInterval = dataStore.GetLong("noticeSettings", "", "interval");
        if (noticeTimeInterval == 0) {
            noticeTimeInterval = 10;
        }
        if (noticeTimeDiff < noticeTimeInterval) {
            return;
        }
        
        /* Get the required messages and compare to how many lines have been posted into chat. */
        int noticeReqMessages = dataStore.GetInteger("noticeSettings", "", "reqmessages");
        if (noticeReqMessages > this.session.chatLinesGet() && noticeReqMessages != 0) {
            return;
        }

        /* As the appropriate amount of time has passed, reset the chat line counter. */
        this.session.chatLinesReset();

        /* Find the next notice to process. */
        lastNoticeID++;

        /* Check to see if any notices even exist. */
        String message0 = dataStore.GetString("notices", "notice_0", "message");
        if (message0 == null && lastNoticeID == 0) {
            return;
        }
        if (message0.length() == 0 && lastNoticeID == 0) {
            return;
        }
      
        /*
         * Get the notice.  If it is null or empty, assume we are at the end of the list and reset to 0.
         */
        String message = dataStore.GetString("notices", "notice_" + lastNoticeID, "message");
        if (message == null) {
            lastNoticeID = 0;
            message = message0;
        }
        if (message.length() == 0 && lastNoticeID == 0) {
            lastNoticeID = 0;
            message = message0;
        }
        
        /* See if the message is really a command and handle accordingly. */
        if (message.startsWith("command:")) {
            String arguments = "";
            String command = message.substring(8);

            if (command.contains(" ")) {
                String commandString = command;
                command = commandString.substring(0, commandString.indexOf(" "));
                arguments = commandString.substring(commandString.indexOf(" ") + 1);
            }
            this.scriptEventManager.runDirect(new CommandEvent(botname, command, arguments));
        } else {
            this.session.say(message);
        }

        /* Store the current time_t into lastNoticeTime for comparing again later. */
        lastNoticeTime = currentNoticeTime;
    }

    /*
     * Performs the main processing of scheduled timers.
     *
     * @param    int    currentMinute - The current minute past the hour to compare to the timers.
     */
    private void processScheduledTimers(int currentMinute) {
        TwitchCache twitchCache = TwitchCache.instance(this.channel);
        DataStore dataStore = PhantomBot.instance().getDataStore();
        String currentGameTitle = twitchCache.getGameTitle();

        /* Reset chat lines every 5 minutes. */
        if (currentMinute % 5 == 0) {
            this.session.chatLinesReset();
        }

        String[] sections = dataStore.GetCategoryList("notices");
        if (sections == null) {
            return;
        }

        for (String section : sections) {
            if (section == null) {
                continue;
            }

            String minutesListStr = dataStore.GetString("notices", section, "minutes");
            if (minutesListStr == null) {
                continue;
            }
            boolean foundMinuteMatch = false;
            try {
                String[] minutesList = minutesListStr.split(",");
                for (String minute : minutesList) {
                    if (currentMinute == Integer.parseInt(minute)) {
                        foundMinuteMatch = true;
                        break;
                    }
                }
            } catch (NumberFormatException ex) {
                continue;
            }
            if (!foundMinuteMatch) {
                continue;
            }
            
            /* Pull chatlines.  0 means ignore lines in chat. */
            String chatlines = dataStore.GetString("notices", section, "chatlines");
            if (chatlines == null) {
                continue;
            }
            try {
                if (Integer.parseInt(chatlines) > this.session.chatLinesGet() && Integer.parseInt(chatlines) != 0) {
                    continue;
                }
            } catch (NumberFormatException ex) {
                continue;
            }

            /* Pull gametitle. If it is empty, always use it, otherwise, compare to current game. */
            String gametitle = dataStore.GetString("notices", section, "gametitle");
            if (gametitle != null) {
                if (gametitle.length() > 0) {
                    if (!gametitle.toLowerCase().equals(currentGameTitle.toLowerCase())) {
                        continue;
                    }
                }
            }
    
            /* Pull the message (or command). */
            String message = dataStore.GetString("notices", section, "message");
            if (message == null) {
                continue;
            }
            if (message.length() == 0) {
                continue;
            }

            /* See if the message is really a command and handle accordingly. */
            if (message.startsWith("command:")) {
                String arguments = "";
                String command = message.substring(8);

                if (command.contains(" ")) {
                    String commandString = command;
                    command = commandString.substring(0, commandString.indexOf(" "));
                    arguments = commandString.substring(commandString.indexOf(" ") + 1);
                }
                this.scriptEventManager.runDirect(new CommandEvent(botname, command, arguments));
            } else {
                this.session.say(message);
            }

            /*
             * Process the first message matched. The user documentation warns against
             * putting notices at the same time. An exception to this is using different
             * gametitle settings at the same time, in which case, that will allow
             * for different timers to be configured at the same time.
             */
            break;
        }
    }

    /*
     * Requests the main thread to stop processing and exit.
     */
    public void kill() {
        killed = true;
    }
}
