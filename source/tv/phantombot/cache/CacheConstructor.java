package tv.phantombot.cache;

public interface CacheConstructor<T extends Cache> {

	T accept(String channel);
}