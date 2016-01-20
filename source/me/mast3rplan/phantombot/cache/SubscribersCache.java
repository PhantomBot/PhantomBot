/* 
 * Copyright (C) 2015 www.phantombot.net
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
package me.mast3rplan.phantombot.cache;

import com.gmt2001.TwitchAPIv3;
import com.google.common.collect.Lists;
import com.google.common.collect.Maps;
import java.util.Calendar;
import java.util.Date;
import java.util.List;
import java.util.Map;
import java.util.Map.Entry;
import me.mast3rplan.phantombot.PhantomBot;
import me.mast3rplan.phantombot.event.EventBus;
import me.mast3rplan.phantombot.event.twitch.subscriber.TwitchSubscribeEvent;
import me.mast3rplan.phantombot.event.twitch.subscriber.TwitchSubscribesInitializedEvent;
import me.mast3rplan.phantombot.event.twitch.subscriber.TwitchUnsubscribeEvent;
import org.json.JSONArray;
import org.json.JSONObject;

public class SubscribersCache implements Runnable
{

    private static final Map<String, SubscribersCache> instances = Maps.newHashMap();
    private boolean run = false;

    public static SubscribersCache instance(String channel)
    {
        SubscribersCache instance = instances.get(channel);
        if (instance == null)
        {
            instance = new SubscribersCache(channel);

            instances.put(channel, instance);
            return instance;
        }

        return instance;
    }

    private Map<String, JSONObject> cache;
    private final String channel;
    private int count;
    private final Thread updateThread;
    private boolean firstUpdate = true;
    private Date timeoutExpire = new Date();
    private Date lastFail = new Date();
    private int numfail = 0;
    private boolean killed = false;

    @SuppressWarnings("CallToThreadStartDuringObjectConstruction")
    private SubscribersCache(String channel)
    {
        if (channel.startsWith("#"))
        {
            channel = channel.substring(1);
        }

        this.channel = channel;
        this.updateThread = new Thread(this);
        this.cache = Maps.newHashMap();

        Thread.setDefaultUncaughtExceptionHandler(com.gmt2001.UncaughtExceptionHandler.instance());
        this.updateThread.setUncaughtExceptionHandler(com.gmt2001.UncaughtExceptionHandler.instance());

        updateThread.start();
    }

    public int getCount(String channel) throws Exception
    {
        JSONObject j = TwitchAPIv3.instance().GetChannelSubscriptions(channel, 1, 0, false);

        if (j.getBoolean("_success"))
        {
            if (j.getInt("_http") == 200)
            {
                int i = j.getInt("_total");

                return i;
            } else
            {
                throw new Exception("[HTTPErrorException] HTTP " + j.getInt("status") + " " + j.getString("error") + ". req="
                        + j.getString("_type") + " " + j.getString("_url") + " " + j.getString("_post") + "   "
                        + (j.has("message") && !j.isNull("message") ? "message=" + j.getString("message") : "content=" + j.getString("_content")));
            }
        } else
        {
            throw new Exception("[" + j.getString("_exception") + "] " + j.getString("_exceptionMessage"));
        }
    }

    public boolean is(String username)
    {
        return cache.containsKey(username);
    }

    public JSONObject get(String username)
    {
        return cache.get(username);
    }

    public void doRun(boolean run)
    {
        this.run = run;
    }

    @Override
    @SuppressWarnings("SleepWhileInLoop")
    public void run()
    {
        try
        {
            Thread.sleep(30 * 1000);
        } catch (InterruptedException e)
        {
            com.gmt2001.Console.out.println("SubscribersCache.run>>Failed to initial sleep: [InterruptedException] " + e.getMessage());
            com.gmt2001.Console.err.logStackTrace(e);
        }

        while (!killed)
        {
            try
            {
                try
                {
                    if (new Date().after(timeoutExpire) && run && TwitchAPIv3.instance().HasOAuth())
                    {
                        int newCount = getCount(channel);

                        if (new Date().after(timeoutExpire) && newCount != count)
                        {
                            this.updateCache(newCount);
                        }
                    }
                } catch (Exception e)
                {
                    if (e.getMessage().startsWith("[SocketTimeoutException]") || e.getMessage().startsWith("[IOException]"))
                    {
                        Calendar c = Calendar.getInstance();

                        if (lastFail.after(new Date()))
                        {
                            numfail++;
                        } else
                        {
                            numfail = 1;
                        }

                        c.add(Calendar.MINUTE, 1);

                        lastFail = c.getTime();

                        if (numfail >= 5)
                        {
                            timeoutExpire = c.getTime();
                        }
                    }

                    com.gmt2001.Console.out.println("SubscribersCache.run>>Failed to update subscribers: " + e.getMessage());
                    com.gmt2001.Console.err.logStackTrace(e);
                }
            } catch (Exception e)
            {
                com.gmt2001.Console.err.printStackTrace(e);
            }

            try
            {
                Thread.sleep(30 * 1000);
            } catch (InterruptedException e)
            {
                com.gmt2001.Console.out.println("SubscribersCache.run>>Failed to sleep: [InterruptedException] " + e.getMessage());
                com.gmt2001.Console.err.logStackTrace(e);
            }
        }
    }

    private void updateCache(int newCount) throws Exception
    {
        Map<String, JSONObject> newCache = Maps.newHashMap();

        final List<JSONObject> responses = Lists.newArrayList();
        List<Thread> threads = Lists.newArrayList();

        for (int i = 0; i < Math.ceil(newCount / 100.0); i++)
        {
            final int offset = i * 100;
            Thread thread = new Thread()
            {
                @Override
                public void run()
                {
                    JSONObject j = TwitchAPIv3.instance().GetChannelSubscriptions(channel, 100, offset, true);

                    if (j.getBoolean("_success"))
                    {
                        if (j.getInt("_http") == 200)
                        {
                            responses.add(j);

                        } else
                        {
                            try
                            {
                                throw new Exception("[HTTPErrorException] HTTP " + j.getInt("status") + " " + j.getString("error") + ". req="
                                        + j.getString("_type") + " " + j.getString("_url") + " " + j.getString("_post") + "   "
                                        + (j.has("message") && !j.isNull("message") ? "message=" + j.getString("message") : "content=" + j.getString("_content")));
                            } catch (Exception e)
                            {
                                com.gmt2001.Console.out.println("SubscribersCache.updateCache>>Failed to update subscribers: " + e.getMessage());
                                com.gmt2001.Console.err.logStackTrace(e);
                            }
                        }
                    } else
                    {
                        try
                        {
                            throw new Exception("[" + j.getString("_exception") + "] " + j.getString("_exceptionMessage"));
                        } catch (Exception e)
                        {
                            if (e.getMessage().startsWith("[SocketTimeoutException]") || e.getMessage().startsWith("[IOException]"))
                            {
                                Calendar c = Calendar.getInstance();

                                if (lastFail.after(new Date()))
                                {
                                    numfail++;
                                } else
                                {
                                    numfail = 1;
                                }

                                c.add(Calendar.MINUTE, 1);

                                lastFail = c.getTime();

                                if (numfail >= 5)
                                {
                                    timeoutExpire = c.getTime();
                                }
                            }

                            com.gmt2001.Console.out.println("SubscribersCache.updateCache>>Failed to update subscribers: " + e.getMessage());
                            com.gmt2001.Console.err.logStackTrace(e);
                        }
                    }
                }
            };
            threads.add(thread);

            thread.start();
        }

        for (Thread thread : threads)
        {
            thread.join();
        }

        for (JSONObject response : responses)
        {
            JSONArray subscribers = response.getJSONArray("subscriptions");

            if (subscribers.length() == 0)
            {
                break;
            }

            for (int j = 0; j < subscribers.length(); j++)
            {
                JSONObject subscriber = subscribers.getJSONObject(j);
                newCache.put(subscriber.getJSONObject("user").getString("name"), subscriber);
            }
        }

        List<String> subscribers = Lists.newArrayList();
        List<String> unsubscribers = Lists.newArrayList();

        for (String key : newCache.keySet())
        {
            if (cache == null || !cache.containsKey(key))
            {
                subscribers.add(key);
            }
        }

        if (cache != null)
        {
            for (String key : cache.keySet())
            {
                if (!newCache.containsKey(key))
                {
                    unsubscribers.add(key);
                }
            }
        }

        this.cache = newCache;
        this.count = newCache.size();

        for (String subscriber : subscribers)
        {
            EventBus.instance().post(new TwitchSubscribeEvent(subscriber, PhantomBot.instance().getChannel("#" + this.channel)));
        }

        for (String subscriber : unsubscribers)
        {
            EventBus.instance().post(new TwitchUnsubscribeEvent(subscriber, PhantomBot.instance().getChannel("#" + this.channel)));
        }

        if (firstUpdate)
        {
            firstUpdate = false;
            EventBus.instance().post(new TwitchSubscribesInitializedEvent(PhantomBot.instance().getChannel("#" + this.channel)));
        }
    }

    public void addSubscriber(String username)
    {
        cache.put(username, null);
    }

    public void setCache(Map<String, JSONObject> cache)
    {
        this.cache = cache;
    }

    public Map<String, JSONObject> getCache()
    {
        return cache;
    }

    public void kill()
    {
        killed = true;
    }

    public static void killall()
    {
        for (Entry<String, SubscribersCache> instance : instances.entrySet())
        {
            instance.getValue().kill();
        }
    }
}
