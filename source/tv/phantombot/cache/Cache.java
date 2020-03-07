package tv.phantombot.cache;

import java.util.Collection;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.ScheduledFuture;
import java.util.concurrent.atomic.AtomicBoolean;

import tv.phantombot.cache.types.DonationsCache;
import tv.phantombot.cache.types.EmotesCache;
import tv.phantombot.cache.types.FollowersCache;
import tv.phantombot.cache.types.StreamCache;
import tv.phantombot.cache.types.StreamElementsCache;
import tv.phantombot.cache.types.TipeeeStreamCache;
import tv.phantombot.cache.types.TwitchCache;
import tv.phantombot.cache.types.TwitchTeamsCache;
import tv.phantombot.cache.types.TwitterCache;
import tv.phantombot.cache.types.UsernameCache;
import tv.phantombot.cache.types.ViewerListCache;
import tv.phantombot.network.NettyUtil;

public abstract class Cache implements Runnable {

	private static final ScheduledExecutorService EXECUTOR = Executors.newScheduledThreadPool(4, NettyUtil.getThreadFactory("netty-bot-cache-%d"));
	private static final Map<Class<? extends Cache>, CacheList<?>> CACHE = new ConcurrentHashMap<>();

	public static DonationsCache getDonations() {
		return Cache.getChannel(DonationsCache.class, (channelName) -> new DonationsCache(), null);
	}

	public static EmotesCache getEmotes(String channel) {
		return Cache.getChannel(EmotesCache.class, (channelName) -> new EmotesCache(channelName), channel);
	}

	public static FollowersCache getFollowers(String channel) {
		return Cache.getChannel(FollowersCache.class, (channelName) -> new FollowersCache(channelName), channel);
	}

	public static StreamCache getStream() {
		return Cache.getChannel(StreamCache.class, (channelName) -> new StreamCache(), null);
	}

	public static StreamElementsCache getStreamElements(String channel) {
		return Cache.getChannel(StreamElementsCache.class, (channelName) -> new StreamElementsCache(), channel);
	}

	public static TipeeeStreamCache getTipeeeStream() {
		return Cache.getChannel(TipeeeStreamCache.class, (channelName) -> new TipeeeStreamCache(), null);
	}

	public static TwitchCache getTwitch(String channel) {
		return Cache.getChannel(TwitchCache.class, (channelName) -> new TwitchCache(channelName), channel);
	}

	public static TwitchTeamsCache getTwitchTeams(String channel) {
		return Cache.getChannel(TwitchTeamsCache.class, (channelName) -> new TwitchTeamsCache(channelName), channel);
	}

	public static TwitterCache getTwitter() {
		return Cache.getChannel(TwitterCache.class, (channelName) -> new TwitterCache(), null);
	}

	public static UsernameCache getUsername() {
		return Cache.getChannel(UsernameCache.class, (channelName) -> new UsernameCache(), null);
	}

	public static ViewerListCache getViewerList(String channel) {
		return Cache.getChannel(ViewerListCache.class, (channelName) -> new ViewerListCache(channelName), channel);
	}

	public static <T extends Cache> T getChannel(Class<T> clazz, CacheConstructor<T> creator, String channel) {
		CacheList<?> cacheList = Cache.CACHE.getOrDefault(clazz, null);

		if (cacheList == null) {
			cacheList = new CacheList<T>(Cache.EXECUTOR, creator);
			Cache.CACHE.put(clazz, cacheList);
		}

		return clazz.cast(cacheList.get(channel));
	}

	public static <T extends Cache> CacheList<?> destoryWhenExist(Class<T> clazz) {
		CacheList<?> cache = Cache.CACHE.remove(clazz);

		if (cache != null) {
			cache.stop();
		}

		return cache;
	}

	public static void stopAll() {
		Collection<CacheList<?>> oldCache = Cache.CACHE.values();
		Cache.CACHE.clear();
		oldCache.forEach(CacheList::stop);
	}

	private final AtomicBoolean running = new AtomicBoolean(true);
	private ScheduledFuture<?> scheduledFuture;

	public abstract long getStartDelay();

	public abstract long getPeriodDelay();

	protected void stop() {
		this.running.compareAndSet(this.running.get(), false);
		this.scheduledFuture.cancel(false);
	}

	public boolean isRunning() {
		return this.running.get();
	}

	protected ScheduledFuture<?> getScheduledFuture() {
		return scheduledFuture;
	}

	protected void setScheduledFuture(ScheduledFuture<?> scheduledFuture) {
		this.scheduledFuture = scheduledFuture;
	}
}
