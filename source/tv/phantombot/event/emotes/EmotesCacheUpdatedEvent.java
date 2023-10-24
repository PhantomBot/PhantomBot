package tv.phantombot.event.emotes;

import org.apache.commons.lang3.Validate;
import org.mozilla.javascript.NativeObject;

/**
 * This Event is emitted from the emotesHandler after it updated the emotes cache.
 * It transports the new cache contents to subscribed clients.
 * It uses NativeObjects to avoid transforming the data into Java native types just to
 * transform it back to JavaScript objects on the receiver site.
 */
public class EmotesCacheUpdatedEvent extends EmotesEvent {
    /**
     * Object with provider as key and an object with keys local, shared and global as value.
     * <pre>
     *     {
     *         "providerName": {
     *             "local": [
     *             {
     *                 "id": "someId",
     *                 "code": "someCode"
     *             },
     *             {
     *                 "id": "otherId",
     *                 "code": "otherCode"
     *             }
     *             ],
     *             "shared": [],
     *             "global": null
     *         },
     *         "otherProvider": {
     *             "local": [],
     *             "shared": null,
     *             "global": []
     *         }
     *     }
     * </pre>
     */
    private final NativeObject emoteSets;

    public EmotesCacheUpdatedEvent(NativeObject emoteSets) {
        super();
        Validate.notNull(emoteSets);
        this.emoteSets = emoteSets;
    }

    public NativeObject getEmoteSets(){
        return this.emoteSets;
    }
}
