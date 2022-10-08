package tv.phantombot.event.emotes;

import org.mozilla.javascript.NativeObject;

/**
 * This Event is emitted from the emotesHandler after it updated the emotes cache.
 * It transports the new cache contents to subscribed clients.
 * It uses NativeObjects to avoid transforming the data into Java native types just to
 * transform it back to JavaScript objects on the receiver site.
 */
public class EmotesCacheUpdatedEvent extends EmotesEvent {
    /**
     * Contents of the bttvEmote Cache
     * Format: {
     * global: {
     * id: String,
     * code: String,
     * imageType: String
     * },
     * local: {
     * ...
     * },
     * shared: {
     * ...
     * }
     * }
     */
    private final NativeObject bttvEmotes;

    /**
     * Contents of the ffzEmote Cache
     * Format: {
     * global: {
     * id: String,
     * code: String,
     * },
     * local: {
     * ...
     * },
     * shared: {
     * ...
     * }
     * }
     */
    private final NativeObject ffzEmotes;

    public EmotesCacheUpdatedEvent(NativeObject bttvEmotes, NativeObject ffzEmotes) {
        super();
        this.bttvEmotes = bttvEmotes;
        this.ffzEmotes = ffzEmotes;
    }

    public NativeObject getBttvEmotes() {
        return this.bttvEmotes;
    }

    public NativeObject getFfzEmotes() {
        return this.ffzEmotes;
    }
}
