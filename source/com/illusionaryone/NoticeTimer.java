/* astyle --style=java --indent=spaces=4 */

/*
 * Copyright (C) 2016-2022 phantombot.github.io/PhantomBot
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

import com.gmt2001.datastore.DataStore;
import java.util.ArrayList;
import java.util.Calendar;
import java.util.List;
import java.util.ListIterator;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import net.engio.mbassy.listener.Handler;
import org.json.JSONException;
import org.json.JSONObject;
import tv.phantombot.PhantomBot;
import tv.phantombot.cache.TwitchCache;
import tv.phantombot.event.Listener;
import tv.phantombot.event.command.CommandEvent;
import tv.phantombot.event.irc.message.IrcChannelMessageEvent;
import tv.phantombot.script.ScriptEventManager;
import tv.phantombot.twitch.irc.TwitchSession;

/*
 * Provides a timer system for managing notices.  Reads data directly from the
 * DB to determine when to run timers.
 *
 * @author illusionaryone
 */
public class NoticeTimer implements Runnable, Listener {

    private static final Map<String, NoticeTimer> instances = new ConcurrentHashMap<>();
    private Thread noticeThread;
    private String channel;
    private TwitchSession session;
    private ScriptEventManager scriptEventManager = ScriptEventManager.instance();
    private String botname;

    private boolean killed = false;
    private boolean reIndex = false;
    private long lastNoticeTime = -1L;
    private int lastMinuteRan = -1;
    private int lastNoticeID = -1;
    private int totalChatLines = 0;

    /*
     * The instance creation for a NoticeTimer object.
     *
     * @param    String        Channel - The name of the channel that this object belongs to.
     * @param    TwitchSession       TwitchSession - The WSIRC TwitchSession object to send data to.
     * @return   NoticeTimer   The newly created, or existing, instanced object.
     */
    public static NoticeTimer instance(String channel, TwitchSession session) {
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
     * @param    TwitchSession       TwitchSession - The WSIRC TwitchSession object to send data to.
     */
    @SuppressWarnings("CallToThreadStartDuringObjectConstruction")
    private NoticeTimer(String channel, TwitchSession session) {
        this.channel = channel;
        this.session = session;
        this.botname = PhantomBot.instance().getBotName();

        this.noticeThread = new Thread(this, "com.illusionaryone.NoticeTimer");

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
                try {
                    processTimers(currentMinute);
                } catch (JSONException ex) {
                    com.gmt2001.Console.err.logStackTrace(ex);
                }
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
     * Method that adds chat lines.
     */
    @Handler
    private void ircChannelMessageEvent(IrcChannelMessageEvent event) {
        totalChatLines++;
    }

    /*
     * Determines which timer process to utilize.
     *
     * @param    int    currentMinute - Passed to processScheduledTimers()
     */
    private void processTimers(int currentMinute) throws JSONException {
        TwitchCache twitchCache = TwitchCache.instance(this.channel);
        DataStore dataStore = PhantomBot.instance().getDataStore();

        /* Notices are disabled. */
        String noticeToggle = dataStore.GetString("noticeSettings", "", "noticetoggle");
        if (noticeToggle != null) {
            if (noticeToggle.equals("false")) {
                return;
            }
        } else {
            return;
        }

        /* If offline and the offline toggle is true, do not process the timers. */
        String offlineToggle = dataStore.GetString("noticeSettings", "", "noticeOfflineToggle");
        if (offlineToggle != null) {
            if (offlineToggle.equals("true") && !twitchCache.isStreamOnline()) {
                return;
            }
        } else {
            return;
        }

        /* Notices are reloading. This is not perfect. Race conditions could still occur. */
        String isReloading = dataStore.GetString("noticeSettings", "", "isReloading");
        if (isReloading != null) {
            if (isReloading.equals("true")) {
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
        TwitchCache twitchCache = TwitchCache.instance(this.channel);
        String currentGameTitle = twitchCache.getGameTitle();
        DataStore dataStore = PhantomBot.instance().getDataStore();
        JSONObject noticeData = null;
        String message = "";

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
        if (noticeReqMessages > totalChatLines && noticeReqMessages != 0) {
            return;
        }

        /* As the appropriate amount of time has passed, reset the chat line counter. */
        totalChatLines = 0;

        /* Check to see if any notices even exist. */
        String[] noticeKeys = dataStore.GetKeyList("notices", "");
        if (noticeKeys == null) {
            return;
        }

        /*
         * If at the end of the list, start over.
         */
        if (lastNoticeID >= noticeKeys.length) {
            lastNoticeID = 0;
        }

        /* Make sure that this notice is enabled and if not, find one that is enabled. */
        Boolean foundEnabled = Boolean.FALSE;
        int origLastNoticeID = lastNoticeID;
        do {
            String noticeKey = noticeKeys[lastNoticeID];
            try {
                noticeData = new JSONObject(dataStore.GetString("notices", "", noticeKey));
                String gametitle = noticeData.getString("gametitle");

                /* Use notices without game titles or game titles that match. */
                if (gametitle == null || gametitle.length() == 0 && noticeData.getBoolean("enabled")) {
                    message = noticeData.getString("message");
                    foundEnabled = Boolean.TRUE;
                } else if (gametitle.toLowerCase().equals(currentGameTitle.toLowerCase()) && noticeData.getBoolean("enabled")) {
                    message = noticeData.getString("message");
                    foundEnabled = Boolean.TRUE;
                }
            } catch (NullPointerException ex) {
                com.gmt2001.Console.err.println("Found NULL data, table more than likely reloading. Will not handle notice.");
                return;
            } catch (JSONException ex) {
                com.gmt2001.Console.err.println("Notice JSON Data Corrupt: Key [" + noticeKey + "]");
            }

            lastNoticeID++;
            if (lastNoticeID >= noticeKeys.length) {
                lastNoticeID = 0;
            }
            if (lastNoticeID == origLastNoticeID) {
                break;
            }
        } while (!foundEnabled);

        /* All notices are disabled. */
        if (foundEnabled == Boolean.FALSE) {
            return;
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
            this.scriptEventManager.onEvent(new CommandEvent(botname, command, arguments));
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
    private void processScheduledTimers(int currentMinute) throws JSONException {
        List<JSONObject> eligibleGameNotices = new ArrayList<JSONObject>();
        List<JSONObject> eligibleNotices = new ArrayList<JSONObject>();
        TwitchCache twitchCache = TwitchCache.instance(this.channel);
        JSONObject noticeData = null;
        DataStore dataStore = PhantomBot.instance().getDataStore();
        String currentGameTitle = twitchCache.getGameTitle();
        int currentWeight = 0;

        /* Reset chat lines every 5 minutes. */
        if (currentMinute % 5 == 0) {
            totalChatLines = 0;
        }

        /* Data Format
            {
              "gametitle": "Game Title",
              "message": "This is a message",
              "enabled": true,
              "interval": 5,
              "weight": 1,
              "chatlines": 5
            }
         */

        String[] noticeKeys = dataStore.GetKeyList("notices", "");
        if (noticeKeys == null) {
            return;
        }

        if (currentMinute == 0) {
            currentMinute = 60;
        }

        for (String noticeKey : noticeKeys) {
            try {
                noticeData = new JSONObject(dataStore.GetString("notices", "", noticeKey));
            } catch (NullPointerException ex) {
                com.gmt2001.Console.err.println("Found NULL data, table more than likely reloading. Will not handle notice.");
                return;
            } catch (JSONException ex) {
                com.gmt2001.Console.err.println("Notice JSON Data Corrupt: Key [" + noticeKey + "]");
                continue;
            }

            if (!noticeData.has("id") || !noticeData.has("gametitle") || !noticeData.has("message") ||
                !noticeData.has("enabled") || !noticeData.has("interval") || !noticeData.has("weight") ||
                !noticeData.has("chatlines")) {
                com.gmt2001.Console.err.println("Notice JSON Missing Data Member: Key [" + noticeKey + "]");
                continue;
            }

            if (!noticeData.getBoolean("enabled")) {
                continue;
            }

            int interval = noticeData.getInt("interval");
            if (interval == 0 || currentMinute % interval != 0) {
                continue;
            }

            int weight = noticeData.getInt("weight");
            if (weight == 0) {
                continue;
            }

            /* Pull chatlines. 0 means ignore lines in chat. */
            int chatlines = noticeData.getInt("chatlines");
            if (chatlines > totalChatLines && chatlines != 0) {
                continue;
            }

            /* Pull the message (or command). */
            String message = noticeData.getString("message");
            if (message == null) {
                continue;
            }
            if (message.length() == 0) {
                continue;
            }

            /* Pull gametitle. If it is empty, always use it, otherwise, compare to current game. */
            String gametitle = noticeData.getString("gametitle");
            if (gametitle != null) {
                if (gametitle.length() > 0) {
                    if (gametitle.toLowerCase().equals(currentGameTitle.toLowerCase())) {
                        eligibleGameNotices.add(noticeData);
                    }
                    continue;
                }
            }

            /* Put this in the running. */
            eligibleNotices.add(noticeData);
        }

        /* Nothing found. */
        if (eligibleGameNotices.size() == 0 && eligibleNotices.size() == 0) {
            return;
        }

        /* If there was a single game notice match, use that. */
        if (eligibleGameNotices.size() == 1) {
            sendMessage(eligibleGameNotices.get(0).getString("message"));
            return;
        } 

        /* If there were no game notices and a single notice, use that. */
        if (eligibleGameNotices.size() == 0 && eligibleNotices.size() == 1) {
            sendMessage(eligibleNotices.get(0).getString("message"));
            return;
        } 

        /* There were game notices. */
        if (eligibleGameNotices.size() > 1) {
            sendMessage(findEligibleNotice(eligibleGameNotices));
        }

        /* There were notices. */
        if (eligibleNotices.size() > 1) {
            sendMessage(findEligibleNotice(eligibleNotices));
        }
    }

    /*
     * Finds the message in a List that represents the eligible notice.  We do not attempt to do
     * tie breakers or choose a random entry if there are duplicate weights.  The first one will win.
     *
     * @param    List      List of notices, which are JSONObjects.
     * @return   String    The message to send from the JSONObject found.
     */
    private String findEligibleNotice(List<JSONObject> noticeList) throws JSONException {
        String message = "";
        int weight = 0;

        ListIterator<JSONObject> iterator = noticeList.listIterator();
        while (iterator.hasNext()) {
            JSONObject noticeData = iterator.next();
            if (noticeData.getInt("weight") > weight) {
                message = noticeData.getString("message");
            }
        }
        return(message);
    }

    /*
     * Sends the message.
     *
     * @param    String    The message/command to send.
     */
    private void sendMessage(String message) {
        if (message.startsWith("command:")) {
            String arguments = "";
            String command = message.substring(8);

            if (command.contains(" ")) {
                String commandString = command;
                command = commandString.substring(0, commandString.indexOf(" "));
                arguments = commandString.substring(commandString.indexOf(" ") + 1);
            }
            this.scriptEventManager.onEvent(new CommandEvent(botname, command, arguments));
        } else {
            this.session.say(message);
        }
    }

    /*
     * Requests the main thread to stop processing and exit.
     */
    public void kill() {
        killed = true;
    }
}
