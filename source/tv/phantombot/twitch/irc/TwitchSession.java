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
package tv.phantombot.twitch.irc;

import com.gmt2001.ExecutorService;
import com.gmt2001.ratelimiters.ExponentialBackoff;
import java.nio.channels.NotYetConnectedException;
import java.time.Duration;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.locks.ReentrantLock;
import tv.phantombot.PhantomBot;
import tv.phantombot.twitch.api.TwitchValidate;
import tv.phantombot.twitch.irc.chat.utils.Message;
import tv.phantombot.twitch.irc.chat.utils.MessageQueue;

public class TwitchSession extends MessageQueue {

    private final String botName;
    private final ReentrantLock reconnectLock = new ReentrantLock();
    private final ExponentialBackoff backoff = new ExponentialBackoff(1000L, 900000L);
    private boolean isJoined = false;

    /**
     * Class constructor.
     *
     * @param channelName
     * @param botName
     */
    public TwitchSession(String channelName, String botName) {
        super(channelName);
        this.botName = botName;

        ExecutorService.schedule(() -> {
            if (!this.isJoined) {
                com.gmt2001.Console.warn.println("Failed to connect to TMI and join #" + this.getChannelName() + ", reconnecting...");
                this.reconnect();
            }
        }, 20, TimeUnit.SECONDS);
        com.gmt2001.Console.debug.println("Started the initial connection failure timer");
    }

    public void doSubscribe() {
        this.subscribe(this);
    }

    /**
     * Method that returns the channel name
     *
     * @return channelName
     */
    public String getChannelName() {
        return this.channelName;
    }

    public void joinSuccess() {
        this.isJoined = true;
    }

    /**
     * Method that returns the bot name.
     *
     * @return botName
     */
    public String getBotName() {
        return this.botName;
    }

    public int getWrites() {
        return PhantomBot.instance().getTMI().rateLimiter().limit() - PhantomBot.instance().getTMI().rateLimiter().currentTokens();
    }

    private void send(String message, boolean isretry) {
        try {
            if (PhantomBot.instance().getTMI().connected() && this.isJoined) {
                PhantomBot.instance().getTMI().sendPrivMessage(this.getChannelName(), message);
                this.backoff.ResetIn(Duration.ofSeconds(30));
            } else {
                if (!isretry) {
                    try {
                        com.gmt2001.Console.warn.println("Tried to send message before connecting to Twitch, trying again in 5 seconds...");
                        Thread.sleep(5000);
                        this.send(message, true);
                    } catch (InterruptedException ex2) {
                    }
                }
            }
        } catch (NotYetConnectedException ex) {
            if (!isretry) {
                try {
                    com.gmt2001.Console.warn.println("Tried to send message before connecting to Twitch, trying again in 5 seconds...");
                    Thread.sleep(5000);
                    this.send(message, true);
                    return;
                } catch (InterruptedException ex2) {
                }
            }
            com.gmt2001.Console.err.println("Failed to send message to Twitch [NotYetConnectedException]: " + ex.getMessage());
            com.gmt2001.Console.err.printStackTrace(ex);
        } catch (Exception ex) {
            com.gmt2001.Console.err.println("Failed to send message to Twitch [" + ex.getClass().getSimpleName() + "]: " + ex.getMessage());
            com.gmt2001.Console.err.printStackTrace(ex);
        }
    }

    /**
     * Method that sends channel message.
     *
     * @param message
     */
    public void send(String message) {
        this.send(message, false);
    }

    /**
     * Method that will do the moderation check of the bot.
     */
    public void getModerationStatus() {
        this.setAllowSendMessages(false);
        PhantomBot.instance().getTMI().sendRaw("PART #" + this.getChannelName());
        try {
            Thread.sleep(500);
        } catch (InterruptedException ex) {
        }
        PhantomBot.instance().getTMI().sendRaw("JOIN #" + this.getChannelName());
    }

    /**
     * Method that handles reconnecting with Twitch.
     */
    public void reconnect() {
        // Do not try to send messages anymore.
        this.setAllowSendMessages(false);
        if (PhantomBot.instance().isExiting()) {
            return;
        }

        this.isJoined = false;

        if (this.reconnectLock.tryLock()) {
            try {
                if (!this.backoff.GetIsBackingOff()) {
                    this.backoff.CancelReset();
                    this.quitIRC();
                    com.gmt2001.Console.out.println("Delaying next connection attempt to prevent spam, " + (this.backoff.GetNextInterval() / 1000) + " seconds...");
                    com.gmt2001.Console.warn.println("Delaying next reconnect " + (this.backoff.GetNextInterval() / 1000) + " seconds...", true);
                    this.backoff.BackoffAsync(() -> {
                        PhantomBot.instance().getTMI().reconnect();
                        ExecutorService.schedule(() -> {
                            if (!this.isJoined) {
                                com.gmt2001.Console.warn.println("Failed to connect to TMI and join #" + this.getChannelName() + ", reconnecting...");
                                this.reconnect();
                            }
                        }, 15, TimeUnit.SECONDS);
                    });
                }
            } finally {
                this.reconnectLock.unlock();
            }
        }
    }

    @Override
    public void onNext(Message message) {
        if (this.isAllowedToSend) {
            if (!PhantomBot.instance().getTMI().rateLimiter().isTokenAvailable()) {
                long time = Instant.now().until(PhantomBot.instance().getTMI().rateLimiter().nextReset(), ChronoUnit.MILLIS);
                com.gmt2001.Console.warn.println("Message limit of (" + PhantomBot.instance().getTMI().rateLimiter().limit() + ") has been reached. Messages will be sent again in " + time + "ms");
            }

            PhantomBot.instance().getTMI().rateLimiter().waitAndRun(() -> {
                this.send(message.getMessage());
                com.gmt2001.Console.out.println("[CHAT] " + message.getMessage());
            });
        }

        if (Instant.now().isAfter(this.nextReminder)) {
            if ((!this.isAllowedToSend || TwitchValidate.instance().hasOAuthInconsistencies(PhantomBot.instance().getChannelName()))) {

                TwitchValidate.instance().checkOAuthInconsistencies(PhantomBot.instance().getChannelName());

                if (!this.isAllowedToSend) {
                    com.gmt2001.Console.warn.println("WARNING: May not be a moderator");
                }
            }

            this.nextReminder = Instant.now().plusMillis(REMINDER_INTERVAL);
        }

        PhantomBot.instance().getTMI().rateLimiter().waitAndRun(() -> {
            this.subscription.request(1);
        });
    }

    @Override
    public void onComplete() {
        this.close();
    }

    public void quitIRC() {
        PhantomBot.instance().getTMI().shutdown();
    }

    /**
     * Method that stops everything for TwitchWSIRC, there's no going back after this.
     */
    @Override
    @SuppressWarnings("ConvertToTryWithResources")
    public void close() {
        // Kill the message queue.
        this.kill();

        this.quitIRC();

        super.close();
    }
}
