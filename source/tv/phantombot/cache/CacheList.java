package tv.phantombot.cache;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.ScheduledFuture;
import java.util.concurrent.TimeUnit;

public class CacheList <T extends Cache> {

	private final ScheduledExecutorService executor;
	private final CacheConstructor<T> createCache;

	private final Map<String, T> cache = new HashMap<>();

	public CacheList(ScheduledExecutorService executor, CacheConstructor<T> createCache) {
		this.executor = executor;
		this.createCache = createCache;
	}

	protected T get(String channel) {
		T element = this.cache.get(channel);

		if (element == null) {
			element = this.createCache.accept(channel);
			this.cache.put(channel, element);

			if (element.getPeriodDelay() > 0) {
				ScheduledFuture<?> scheduledFuture = this.executor.scheduleAtFixedRate(element,
						element.getStartDelay(), element.getPeriodDelay(), TimeUnit.MILLISECONDS);
				element.setScheduledFuture(scheduledFuture);
			}
		}

		return element;
	}

	public void stop() {
		List<T> oldCache = (List<T>) cache.values();
		cache.clear();
		oldCache.forEach(Cache::stop);
	}
}