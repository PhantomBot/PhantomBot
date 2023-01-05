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

import com.gmt2001.ExecutorService;
import com.illusionaryone.Logger;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;
import org.json.JSONArray;
import org.json.JSONObject;
import tv.phantombot.PhantomBot;
import tv.phantombot.event.EventBus;
import tv.phantombot.event.pubsub.moderation.PubSubModerationBanEvent;
import tv.phantombot.event.pubsub.moderation.PubSubModerationDeleteEvent;
import tv.phantombot.event.pubsub.moderation.PubSubModerationTimeoutEvent;
import tv.phantombot.event.pubsub.moderation.PubSubModerationUnBanEvent;
import tv.phantombot.event.pubsub.moderation.PubSubModerationUnTimeoutEvent;
import tv.phantombot.twitch.api.TwitchValidate;

/**
 * A processor for moderation events from PubSub
 *
 * @author gmt2001
 */
public class PubSubModerationProcessor extends AbstractPubSubProcessor {

    private final int channelId;
    private final Map<String, Instant> timeoutCache = new ConcurrentHashMap<>();
    private Future future;

    public PubSubModerationProcessor() {
        this(TwitchValidate.instance().getAPIUserID().equalsIgnoreCase(""
                + PhantomBot.instance().getPubSub().channelId()) ? PhantomBot.instance().getPubSub().channelId()
                : PhantomBot.instance().getPubSub().botId(), PhantomBot.instance().getPubSub().channelId());
    }

    private PubSubModerationProcessor(int fromId, int channelId) {
        super("chat_moderator_actions." + fromId + "." + channelId);
        this.channelId = channelId;
    }

    @Override
    protected void onOpen() {
        if (TwitchValidate.instance().hasAPIScope("channel:moderate")) {
            super.onOpen();
            com.gmt2001.Console.out.println("Requesting Twitch Moderation Data Feed for " + this.channelId);
        }
    }

    @Override
    protected void onSubscribeSuccess() {
        com.gmt2001.Console.out.println("Connected to Twitch Moderation Data Feed for " + this.channelId);
        this.future = ExecutorService.scheduleAtFixedRate(() -> {
            Thread.currentThread().setName("tv.phantombot.twitch.pubsub.processors.PubSubModerationProcessor::cleanupTimeoutCache");
            Instant now = Instant.now();
            this.timeoutCache.forEach((k, v) -> {
                if (now.isAfter(v)) {
                    this.timeoutCache.remove(k);
                }
            });
        }, 1500, 1500, TimeUnit.MILLISECONDS);
    }

    @Override
    protected void onSubscribeFailure(String error) {
        com.gmt2001.Console.out.println("PubSub Rejected Twitch Moderation Data Feed for " + this.channelId + " with Error: " + error);
    }

    @Override
    protected void onClose() {
        this.future.cancel(true);
        this.timeoutCache.clear();
    }

    @Override
    protected void onEvent(JSONObject body) {
        JSONObject data = body.getJSONObject("data");
        if (data.has("moderation_action") && !data.isNull("moderation_action") && data.has("created_by")) {
            JSONArray args = data.optJSONArray("args");
            String action = data.getString("moderation_action");
            String creator = data.getString("created_by");
            String args1 = args != null ? args.optString(0, data.getString("target_user_id")) : data.getString("target_user_id");
            String args2 = args != null ? args.optString(1) : "";
            String args3 = args != null ? args.optString(2) : "";

            if (this.timeoutCache.containsKey(data.getString("target_user_id"))
                    && this.timeoutCache.get(data.getString("target_user_id")).isAfter(Instant.now())) {
                return;
            }

            this.timeoutCache.put(data.getString("target_user_id"), Instant.now().plusMillis(1500));
            switch (action) {
                case "delete":
                    this.logModeration(args1 + "'s message was deleted by " + creator);
                    EventBus.instance().postAsync(new PubSubModerationDeleteEvent(args1, creator, args2));
                    break;
                case "timeout":
                    this.logModeration(args1 + " has been timed out by " + creator + " for " + args2 + " seconds. "
                            + (args3.length() == 0 ? "" : "Reason: " + args3));
                    EventBus.instance().postAsync(new PubSubModerationTimeoutEvent(args1, creator,
                            (PhantomBot.instance().getPubSub().messageCache().containsKey(args1.toLowerCase())
                            ? PhantomBot.instance().getPubSub().messageCache().get(args1.toLowerCase()) : ""), args3, args2));
                    break;
                case "untimeout":
                    this.logModeration(args1 + " has been un-timed out by " + creator + ".");
                    EventBus.instance().postAsync(new PubSubModerationUnTimeoutEvent(args1, creator));
                    break;
                case "ban":
                    this.logModeration(args1 + " has been banned by " + creator + ". " + (args2.length() == 0 ? "" : "Reason: " + args2));
                    EventBus.instance().postAsync(new PubSubModerationBanEvent(args1, creator,
                            (PhantomBot.instance().getPubSub().messageCache().containsKey(args1.toLowerCase())
                            ? PhantomBot.instance().getPubSub().messageCache().get(args1.toLowerCase()) : ""), args2));
                    break;
                case "unban":
                    this.logModeration(args1 + " has been un-banned by " + creator + ".");
                    EventBus.instance().postAsync(new PubSubModerationUnBanEvent(args1, creator));
                    break;
                case "mod":
                    this.logModeration(args1 + " has been modded by " + creator + ".");
                    break;
                case "unmod":
                    this.logModeration(args1 + " has been un-modded by " + creator + ".");
                    break;
                case "twitchbot_rejected":
                    this.logModeration("Message (" + args2 + ") from " + args1 + " has been rejected by AutoMod.");
                    break;
                case "denied_twitchbot_message":
                    this.logModeration(creator + " denied a message from " + args1 + ". Message id: " + data.getString("msg_id") + ".");
                    break;
                case "approved_twitchbot_message":
                    this.logModeration(creator + " allowed a message from " + args1 + ". Message id: " + data.getString("msg_id") + ".");
                    break;
            }
        }
    }

    /**
     * Logs the messages we get from PubSub.
     *
     * @param message Message that we will log.
     */
    private void logModeration(String message) {
        if (PhantomBot.instance().getDataStore().GetString("chatModerator", "", "moderationLogs").equals("true")) {
            Logger.instance().log(Logger.LogType.Moderation, "[" + Logger.instance().logTimestamp() + "] " + message);
        }
    }
}
