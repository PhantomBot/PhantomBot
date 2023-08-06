package tv.phantombot.twitch.emotes;

public class EmoteApiRequestFailedException extends Exception {
    public EmoteApiRequestFailedException(final String message) {
        this(message, null);
    }

    public EmoteApiRequestFailedException(final Throwable cause) {
        this(cause != null ? cause.getMessage() : null, cause);
    }

    public EmoteApiRequestFailedException(final String message, final Throwable cause) {
        super(message);
        if (cause != null) super.initCause(cause);
    }
}
