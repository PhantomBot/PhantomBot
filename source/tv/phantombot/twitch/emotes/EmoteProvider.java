package tv.phantombot.twitch.emotes;

import java.util.List;

public interface EmoteProvider {

    /**
     * Returns the name of the provider (for code usage, not for human reading)
     * @return the codename of the provider
     */
    String getProviderName();

    /**
     * Retrieves all emotes which are local to the channel by the emote provider
     * @return list of all emotes local to the channel of the provider or null if not supported
     * @throws EmoteApiRequestFailedException when the api request or parsing of the response fails
     */
    default List<EmoteEntry> getLocalEmotes() throws EmoteApiRequestFailedException {
        return null;
    }

    /**
     * Retrieves all emotes which are selected from a shared pool of the emote provider and thus
     * not exclusive to the channel but allowed to use under the terms of the provider
     * @return list of all the selected shared emotes of the provider or null if not supported
     * @throws EmoteApiRequestFailedException when the api request or parsing of the response fails
     */
    default List<EmoteEntry> getSharedEmotes() throws EmoteApiRequestFailedException {
        return null;
    }

    /**
     * Retrieves all emotes which are globally available to all users of the emote provider
     * @return list of all globally available emotes of the provider or null if not supported
     * @throws EmoteApiRequestFailedException when the api request or parsing of the response fails
     */
    default List<EmoteEntry> getGlobalEmotes() throws EmoteApiRequestFailedException {
        return null;
    }
}
