/*
 * Copyright (C) 2016-2017 phantombot.tv
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
package tv.phantombot.script;

import com.google.common.collect.Lists;
import com.google.common.eventbus.Subscribe;
import java.util.Iterator;
import java.util.List;
import java.util.concurrent.ConcurrentHashMap;
import tv.phantombot.PhantomBot;
import tv.phantombot.event.Event;
import tv.phantombot.event.Listener;
import org.apache.commons.lang3.text.WordUtils;

public class ScriptEventManager implements Listener {

    private static final ScriptEventManager instance = new ScriptEventManager();

    public static ScriptEventManager instance() {
        return instance;
    }
    
    private static final String[] eventPackages = new String[] {
        "tv.phantombot.event.command",
        "tv.phantombot.event.irc.message",
        "tv.phantombot.event.irc",
        "tv.phantombot.event.subscribers",
        "tv.phantombot.event.bits",
        "tv.phantombot.event.musicplayer",
        "tv.phantombot.event.ytplayer",
        "tv.phantombot.event.console",
        "tv.phantombot.event.devcommand",
        "tv.phantombot.event.twitch.follower",
        "tv.phantombot.event.twitch.host",
        "tv.phantombot.event.twitch.subscriber",
        "tv.phantombot.event.twitch.online",
        "tv.phantombot.event.twitch.offline",
        "tv.phantombot.event.twitch.gamechange",
        "tv.phantombot.event.irc.channel",
        "tv.phantombot.event.irc.complete",
        "tv.phantombot.event.irc.clearchat",
        "tv.phantombot.event.twitchalerts.donate",
        "tv.phantombot.event.streamtip.donate",
        "tv.phantombot.event.tipeeestream.donate",
        "tv.phantombot.event.emotes",
        "tv.phantombot.event.gamewisp",
        "tv.phantombot.event.twitter",
        "tv.phantombot.event.discord",
        "tv.phantombot.event.moderation",
        "tv.phantombot.event.webpanel"
    };

    private ScriptEventManager() {
        Thread.setDefaultUncaughtExceptionHandler(com.gmt2001.UncaughtExceptionHandler.instance());
    }

    private static class EventHandlerEntry {

        Class<? extends Event> eventClass;
        ScriptEventHandler handler;

        private EventHandlerEntry(Class<? extends Event> eventClass, ScriptEventHandler handler) {
            this.eventClass = eventClass;
            this.handler = handler;
        }
    }
    private final List<EventHandlerEntry> entries = Lists.newCopyOnWriteArrayList();
    private final ConcurrentHashMap<String,EventHandlerEntry> hashEntries = new ConcurrentHashMap<String,EventHandlerEntry>();

    public void runDirect(Event event) {
        if (PhantomBot.instance().isExiting()) {
            return;
        }

        try {
            EventHandlerEntry entry = hashEntries.get(event.getClass().getName());
            if (entry != null) {
                entry.handler.handle(event);
                com.gmt2001.Console.debug.println("Dispatched runDirect event " + entry.eventClass.getName());
            }
        } catch (Exception e) {
            com.gmt2001.Console.err.println("Failed to dispatch runDirect event " + event.getClass().getName());
            com.gmt2001.Console.err.printStackTrace(e);
        }
    }

    @Subscribe
    public void onEvent(Event event) {
        if (PhantomBot.instance().isExiting()) {
            return;
        }

        try {
            for (EventHandlerEntry entry : entries) {
                if (event.getClass().isAssignableFrom(entry.eventClass)) {
                    entry.handler.handle(event);
                    com.gmt2001.Console.debug.println("Dispatched event " + entry.eventClass.getName());
                }
            }
        } catch (Exception e) {
            com.gmt2001.Console.err.println("Failed to dispatch event " + event.getClass().getName());
            com.gmt2001.Console.err.printStackTrace(e);
        }
    }

    public void register(String eventName, ScriptEventHandler handler) {
        Class<? extends Event> eventClass = null;
        for (String eventPackage : eventPackages) {
            try {
                eventClass = Class.forName(eventPackage + "." + WordUtils.capitalize(eventName) + "Event").asSubclass(Event.class);
                break;
            } catch (ClassNotFoundException e) {
            }
        }

        if (eventClass == null) {
            throw new RuntimeException("Event class not found: " + eventName);
        }

        entries.add(new EventHandlerEntry(eventClass, handler));
        hashEntries.put(eventClass.getName(), new EventHandlerEntry(eventClass, handler));
    }

    public void unregister(ScriptEventHandler handler) {
        EventHandlerEntry entry;

        Iterator<EventHandlerEntry> iterator = entries.iterator();
        while (iterator.hasNext()) {
            entry = iterator.next();
            if (entry.handler == handler) {
                entries.remove(entry);
            }
        }
 
        for (ConcurrentHashMap.Entry<String, EventHandlerEntry> hashEntry : hashEntries.entrySet()) {
            entry = hashEntry.getValue();
            if (entry.handler == handler) {
                hashEntries.remove(hashEntry.getKey());
            }
        }
    }
}
