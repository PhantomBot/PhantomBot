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
package tv.phantombot.twitch.irc.chat.utils;

import java.time.Instant;
import java.util.concurrent.Flow;
import java.util.concurrent.Flow.Processor;
import java.util.concurrent.Flow.Subscription;
import java.util.concurrent.SubmissionPublisher;
import java.util.concurrent.TimeUnit;

public abstract class MessageQueue extends SubmissionPublisher<Message> implements Processor<Message, Message> {

    protected final String channelName;
    protected boolean isAllowedToSend = false;
    protected Instant nextReminder = Instant.now();
    protected static final long REMINDER_INTERVAL = 300000L;
    protected Subscription subscription;

    /**
     * Class constructor.
     *
     * @param channelName
     */
    protected MessageQueue(String channelName) {
        super();
        this.channelName = channelName;

        // Set the default thread uncaught exception handler.
        Thread.setDefaultUncaughtExceptionHandler(com.gmt2001.UncaughtExceptionHandler.instance());
    }

    /**
     * Method that sets if we are allowed to send messages.
     *
     * @param isAllowedToSend
     */
    public synchronized void setAllowSendMessages(boolean isAllowedToSend) {
        this.isAllowedToSend = isAllowedToSend;
    }

    /**
     * Method that says if we are allowed to send messages.
     *
     * @return isAllowedToSend
     */
    public boolean isAllowedToSendMessages() {
        return this.isAllowedToSend;
    }

    /**
     * Attempts to enqueue a message, timing out after 5 seconds.
     *
     * @param message
     */
    public void say(String message) {
        message = message.replace('\r', ' ');
        String[] spl = message.split("\n");
        for (String str : spl) {
            this.offer(new Message(str), 5, TimeUnit.SECONDS, (s, m) -> {
                com.gmt2001.Console.warn.println("Failed to submit message: " + m.getMessage());
                return false;
            });
        }
    }

    /**
     * Attempts to enqueue a message until success.
     *
     * @param message
     */
    public void sayNow(String message) {
        message = message.replace('\r', ' ');
        String[] spl = message.split("\n");
        for (String str : spl) {
            this.submit(new Message(str));
        }
    }

    /**
     * Method that kills this instance.
     */
    public void kill() {
        if (this.subscription != null) {
            this.subscription.cancel();
        }
    }

    @Override
    public void onSubscribe(Flow.Subscription subscription) {
        this.subscription = subscription;
        this.subscription.request(1);
    }

    @Override
    public void onError(Throwable thrwbl) {
        com.gmt2001.Console.err.printStackTrace(thrwbl);
        com.gmt2001.Console.err.println("MessageQueue threw an exception and is being disconnected...");
    }
}
