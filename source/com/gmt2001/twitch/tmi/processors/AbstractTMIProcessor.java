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
package com.gmt2001.twitch.tmi.processors;

import com.gmt2001.twitch.tmi.TMIMessage;
import com.gmt2001.twitch.tmi.TwitchMessageInterface;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.concurrent.Flow;
import tv.phantombot.CaselessProperties;
import tv.phantombot.PhantomBot;
import tv.phantombot.twitch.irc.TwitchSession;

/**
 * An abstract processor of TMI messages
 *
 * @author gmt2001
 */
public abstract class AbstractTMIProcessor implements Flow.Subscriber<TMIMessage> {

    /**
     * The flow subscription
     */
    protected Flow.Subscription subscription = null;
    /**
     * The IRC commands this processor listens to
     */
    protected final List<String> commands;

    /**
     * Constructor. Subscribes to the Flow.Publisher and all IRC commands
     */
    protected AbstractTMIProcessor() {
        this(new String[]{});
    }

    /**
     * Constructor. Subscribes to the Flow.Publisher and a specified IRC command
     *
     * @param command The command to subscribe to
     */
    protected AbstractTMIProcessor(String command) {
        this(new String[]{command});
    }

    /**
     * Constructor. Subscribes to the Flow.Publisher and the specified IRC commands
     *
     * @param commands The commands to subscribe to
     */
    protected AbstractTMIProcessor(String[] commands) {
        this(Arrays.asList(commands));
    }

    /**
     * Constructor. Subscribes to the Flow.Publisher and the specified IRC commands
     *
     * @param commands The commands to subscribe to
     */
    protected AbstractTMIProcessor(List<String> commands) {
        this.subscribe();
        this.commands = Collections.unmodifiableList(commands);
    }

    /**
     * Subscribes to the Flow.Publisher of TwitchMessageInterface
     */
    protected final void subscribe() {
        PhantomBot.instance().getTMI().subscribe(this);
    }

    /**
     * Saves the subscription to this.subscription, then calls onFlowSubscribe
     *
     * @param subscription
     */
    @Override
    public final void onSubscribe(Flow.Subscription subscription) {
        this.subscription = subscription;
        this.onFlowSubscribe();
        this.subscription.request(1);
    }

    /**
     * Calls the default handlers by message type, then calls onFlowNext
     *
     * @param item
     */
    @Override
    public final void onNext(TMIMessage item) {
        if (null != item.messageType()) {
            switch (item.messageType()) {
                case OPEN:
                    this.onOpen();
                    break;
                case MESSAGE:
                    if (commands.contains(item.command())) {
                        this.onMessage(item);
                    }
                    break;
                case CLOSE:
                    this.onClose();
                    break;
                default:
                    break;
            }
        }

        this.onFlowNext(item);
        this.subscription.request(1);
    }

    /**
     * Sends the stack trace to the logger, then calls onFlowError
     *
     * @param throwable
     */
    @Override
    public final void onError(Throwable throwable) {
        com.gmt2001.Console.err.printStackTrace(throwable);
        this.onFlowError(throwable);
    }

    /**
     * Sets this.subscription to null, then calls onFlowComplete
     */
    @Override
    public final void onComplete() {
        this.subscription = null;
        this.onFlowComplete();
    }

    /**
     * Default handler for TMIMessageType.OPEN, no-op
     */
    protected void onOpen() {
    }

    /**
     * Default handler for TMIMessageType.CLOSE, no-op
     */
    protected void onClose() {
    }

    /**
     * Override this method to handle Flow.Subscriber.OnNext, called after the default handlers for TMIMessageType
     *
     * @param item The TMIMessage that was submitted
     */
    protected void onFlowNext(TMIMessage item) {
    }

    /**
     * Override this method to handle Flow.Subscriber.OnSubscribe, called after this.subscription is set
     */
    protected void onFlowSubscribe() {
    }

    /**
     * Override this method to handle Flow.Subscriber.OnError, called after the stack trace is sent to the logger
     *
     * @param throwable The throwable that is causing the subscription to be canceled
     */
    protected void onFlowError(Throwable throwable) {
    }

    /**
     * Override this method to handle Flow.Subscriber.OnComplete, called after this.subscription is set to null
     */
    protected void onFlowComplete() {
    }

    /**
     * Called when a TMIMessage of type TMIMessageType.MESSAGE is received
     *
     * @param item The {@link TMIMessage} that was received
     */
    protected abstract void onMessage(TMIMessage item);

    /**
     * Shortcut to get the instance of {@link CaselessProperties}
     *
     * @return
     */
    protected CaselessProperties properties() {
        return CaselessProperties.instance();
    }

    /**
     * Shortcut to {@link CaselessProperties#getProperty(java.lang.String)}
     *
     * @param key
     * @return
     */
    protected String property(String key) {
        return CaselessProperties.instance().getProperty(key);
    }

    /**
     * Shortcut to get the instance of {@link TwitchMessageInterface}
     *
     * @return
     */
    protected TwitchMessageInterface tmi() {
        return PhantomBot.instance().getTMI();
    }

    /**
     * Shortcut to get the instance of {@link TwitchSession}
     *
     * @return
     */
    protected TwitchSession session() {
        return PhantomBot.instance().getSession();
    }

    /**
     * Shortcut to get the bot username
     *
     * @return
     */
    protected String user() {
        return PhantomBot.instance().getBotName();
    }

    /**
     * Shortcut to get the channel name
     *
     * @return
     */
    protected String channel() {
        return this.session().getChannelName();
    }
}
