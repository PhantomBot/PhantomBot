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
package tv.phantombot.event.irc.message;

import java.util.Map;
import reactor.core.publisher.Mono;
import reactor.core.publisher.Sinks;
import tv.phantombot.event.command.CommandEvent;
import tv.phantombot.twitch.irc.TwitchSession;

public class IrcModerationEvent extends IrcMessageEvent {

    private final Sinks.One<Boolean> moderated = Sinks.one();
    private final Sinks.One<Void> completed = Sinks.one();
    private final ModerationAction action = new ModerationAction();

    /**
     * Class constructor.
     *
     * @param session
     * @param sender
     * @param message
     */
    public IrcModerationEvent(TwitchSession session, String sender, String message) {
        super(session, sender, message);
    }

    /**
     * Class constructor.
     *
     * @param session
     * @param sender
     * @param message
     * @param tags
     */
    public IrcModerationEvent(TwitchSession session, String sender, String message, Map<String, String> tags) {
        super(session, sender, message, tags);
    }

    /**
     * Returns a {@link Mono} which emits {@code true} if a moderation was performed and further processing of this message should be stopped
     *
     * @return
     */
    public Mono<Boolean> mono() {
        return this.moderated.asMono();
    }

    /**
     * Returns a {@link Mono} which emits the {@code onComplete} signal once all moderation hooks have run, reguardless of outcome
     *
     * @return
     */
    public Mono<Void> completedMono() {
        return this.completed.asMono();
    }

    /**
     * Emits {@code true} from the mono, signaling that moderation has occurred and further processing of this message should be stopped
     */
    public void moderated() {
        this.moderated.tryEmitValue(Boolean.TRUE);
    }

    /**
     * Emits {@code false} from the mono, signaling that moderation has not occurred in any handlers and the message is safe to consume
     */
    public void complete() {
        this.moderated.tryEmitValue(Boolean.FALSE);
        this.completed.tryEmitEmpty();
    }

    /**
     * Provides a {@link ModerationAction} that can be used to coordinate executing only the harshest recommended action returned by the various moderation functions
     */
    public ModerationAction action() {
        return this.action;
    }

    /**
     * Indicates if this message appears to be a command, defined as exclamation point {@code !} followed by any character except for a space
     *
     * @return {@code true} if the message appears to be a command
     */
    public boolean isCommand() {
        return CommandEvent.isCommand(this.message);
    }

    /**
     * Converts this message into a {@link CommandEvent}
     *
     * @return {@code null} if {@link #isCommand(java.lang.String)} returns {@code false}; otherwise a {@link CommandEvent}
     */
    public CommandEvent asCommand() {
        return CommandEvent.asCommand(this.sender, this.message, this.tags);
    }

    public static class ModerationActions {
        /**
         * Possible actions
         */
        public enum Actions {
            /**
             * No action
             */
            None(0),
            /**
             * Unban
             */
            UnBan(1),
            /**
             * Delete message
             */
            Delete(2),
            /**
             * Clear Chat
             */
            ClearChat(3),
            /**
             * Timeout
             */
            Timeout(4),
            /**
             * Ban
             */
            Ban(5);

            private final int value;

            private Actions(int value) {
                this.value = value;
            }

            /**
             * @return A numeric value which sorts actions from least harsh (0) to most harsh
             */
            public int value() {
                return this.value;
            }
        }
    }

    /**
     * Determines the harshest action requested by a moderation script
     */
    public class ModerationAction {
        private ModerationActions.Actions action = ModerationActions.Actions.None;
        private int time = -1;
        private String reason = null;
        private String warning = null;

        /**
         * @return The current harshest action
         */
        public ModerationActions.Actions action() {
            return this.action;
        }

        /**
         * @return If executing {@link Actions.Timeout}, the amount of time, in seconds
         */
        public int time() {
            return this.time;
        }

        /**
         * @return The reason string for {@link Actions.Timeout} and {@link Actions.Ban}
         */
        public String reason() {
            return this.reason;
        }

        /**
         * @return The warning message to send to chat
         */
        public String warning() {
            return this.warning;
        }

        /**
         * Attempts to set the current action to {@link Actions.UnBan}
         */
        public synchronized void UnBan() {
            if (this.action.value() < ModerationActions.Actions.UnBan.value()) {
                this.action = ModerationActions.Actions.UnBan;
            }
        }

        /**
         * Attempts to set the current action to {@link Actions.UnTimeout}
         */
        public void UnTimeout() {
            this.UnBan();
        }

        /**
         * Attempts to set the current action to {@link Actions.Delete}
         */
        public void Delete() {
            this.Delete(null);
        }

        /**
         * Attempts to set the current action to {@link Actions.Delete}
         * @param warning A warning message to send to chat; {@code null} for no message
         */
        public synchronized void Delete(String warning) {
            if (this.action.value() < ModerationActions.Actions.Delete.value()) {
                this.action = ModerationActions.Actions.Delete;
                this.warning = warning;
            }
        }

        /**
         * Attempts to set the current action to {@link Actions.ClearChat}
         */
        public synchronized void ClearChat() {
            if (this.action.value() < ModerationActions.Actions.ClearChat.value()) {
                this.action = ModerationActions.Actions.ClearChat;
            }
        }

        /**
         * Attempts to set the current action to {@link Actions.Timeout} with a time of 1
         */
        public void Purge() {
            this.Purge(null, null);
        }

        /**
         * Attempts to set the current action to {@link Actions.Timeout} with a time of 1
         * @param reason A reason message to attach to the Twitch logs; {@code null} for no message
         * @param warning A warning message to send to chat; {@code null} for no message
         */
        public void Purge(String reason, String warning) {
            this.Timeout(1, reason, warning);
        }

        /**
         * Attempts to set the current action to {@link Actions.Timeout} with a time of 600 (10 minutes)
         */
        public void Timeout() {
            this.Timeout(600, null, null);
        }

        /**
         * Attempts to set the current action to {@link Actions.Timeout}
         * @param seconds The number of seconds to timeout the user for
         */
        public void Timeout(int seconds) {
            this.Timeout(seconds, null, null);
        }

        /**
         * Attempts to set the current action to {@link Actions.Timeout}
         * @param seconds The number of seconds to timeout the user for
         * @param reason A reason message to attach to the Twitch logs; {@code null} for no message
         * @param warning A warning message to send to chat; {@code null} for no message
         */
        public synchronized void Timeout(int seconds, String reason, String warning) {
            if (this.action.value() < ModerationActions.Actions.Timeout.value()) {
                this.action = ModerationActions.Actions.Timeout;
            }

            if (this.action.value() == ModerationActions.Actions.Timeout.value() && this.time < seconds) {
                this.time = seconds;
                this.reason = reason;
                this.warning = warning;
            }
        }

        /**
         * Attempts to set the current action to {@link Actions.Ban}
         */
        public void Ban() {
            this.Ban(null, null);
        }

        /**
         * Attempts to set the current action to {@link Actions.Ban}
         * @param reason A reason message to attach to the Twitch logs; {@code null} for no message
         * @param warning A warning message to send to chat; {@code null} for no message
         */
        public synchronized void Ban(String reason, String warning) {
            if (this.action.value() < ModerationActions.Actions.Ban.value()) {
                this.action = ModerationActions.Actions.Ban;
            }
        }
    }
}
