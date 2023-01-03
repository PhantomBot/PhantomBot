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
package tv.phantombot.twitch.pubsub.processors;

import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.concurrent.Flow;
import org.json.JSONObject;
import tv.phantombot.PhantomBot;
import tv.phantombot.twitch.pubsub.PubSubMessage;

/**
 * An abstract processor of PubSub messages
 *
 * @author gmt2001
 */
public abstract class AbstractPubSubProcessor implements Flow.Subscriber<PubSubMessage> {

    /**
     * The flow subscription
     */
    protected Flow.Subscription subscription = null;
    /**
     * The generated nonce for this subscription
     */
    protected final String nonce;
    /**
     * The topics subscribed to
     */
    protected final List<String> topics;

    /**
     * Constructor. Subscribes to the Flow.Publisher and generates a nonce
     *
     * @param topic The topic to subscribe to
     */
    protected AbstractPubSubProcessor(String topic) {
        this(new String[]{topic});
    }

    /**
     * Constructor. Subscribes to the Flow.Publisher and generates a nonce
     *
     * @param topics The topics to subscribe to
     */
    protected AbstractPubSubProcessor(String[] topics) {
        this(Arrays.asList(topics));
    }

    /**
     * Constructor. Subscribes to the Flow.Publisher and generates a nonce
     *
     * @param topics The topics to subscribe to
     */
    protected AbstractPubSubProcessor(List<String> topics) {
        this.subscribe();
        this.nonce = PhantomBot.generateRandomString(12);
        this.topics = Collections.unmodifiableList(topics);
    }

    /**
     * Subscribes to the Flow.Publisher of TwitchPubSub
     */
    protected final void subscribe() {
        PhantomBot.instance().getPubSub().subscribe(this);
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
    public final void onNext(PubSubMessage item) {
        if (null != item.messageType()) {
            switch (item.messageType()) {
                case OPEN:
                    this.onOpen();
                    break;
                case SUBSCRIBERESULT:
                    if (item.body().optString("nonce").equals(this.nonce)) {
                        this.onSubscribeResult(item.body());
                    }
                    break;
                case MESSAGE:
                    if (topics.contains(item.topic())) {
                        this.onMessage(item.body());
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
     * Default handler for PubSubMessageType.OPEN, calls subscribeToTopics
     */
    protected void onOpen() {
        this.subscribeToTopics();
    }

    /**
     * Default handler for PubSubMessageType.SUBSCRIBERESULT, calls onSubscribeFailure or onSubscribeSuccess
     *
     * @param body The full body of the message
     */
    protected void onSubscribeResult(JSONObject body) {
        if (body.has("error") && body.getString("error").length() > 0) {
            this.onSubscribeFailure(body.getString("error"));
        } else {
            this.onSubscribeSuccess();
        }
    }

    /**
     * Default handler for PubSubMessageType.MESSAGE, calls onEvent
     *
     * @param body The full body of the message
     */
    protected void onMessage(JSONObject body) {
        this.onEvent(body);
    }

    /**
     * Default handler for PubSubMessageType.CLOSE, no-op
     */
    protected void onClose() {
    }

    /**
     * Subscribes to the PubSub topics
     */
    protected void subscribeToTopics() {
        PhantomBot.instance().getPubSub().subscribeToTopics(this.topics.toArray(String[]::new), this.nonce);
    }

    /**
     * Unsubscribes from the PubSub topics
     */
    protected void unsubscribeFromTopics() {
        PhantomBot.instance().getPubSub().unsubscribeFromTopics(this.topics.toArray(String[]::new), this.nonce);
    }

    /**
     * Override this method to handle Flow.Subscriber.OnNext, called after the default handlers for PubSubMessageType
     *
     * @param item The PubSubMessage that was submitted
     */
    protected void onFlowNext(PubSubMessage item) {
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
     * Called if the subscription request sent by this.subscribeToTopics or this.unsubscribeFromTopics was successful
     */
    protected abstract void onSubscribeSuccess();

    /**
     * Called if the subscription request sent by this.subscribeToTopics or this.unsubscribeFromTopics failed
     *
     * @param error The error message from Twitch describing why the subscription failed
     */
    protected abstract void onSubscribeFailure(String error);

    /**
     * Called when a new event for this subscription has been received
     *
     * @param body The body of the event
     */
    protected abstract void onEvent(JSONObject body);
}
