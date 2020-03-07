package tv.phantombot.network;

import java.util.concurrent.ThreadFactory;
import java.util.concurrent.atomic.AtomicInteger;

public class NettyUtil {

	private static final ThreadGroup NETTY_THREAD_GROUP = new ThreadGroup("netty");
	private static final AtomicInteger NETTY_THREAD_ID = new AtomicInteger();

	static {
		NETTY_THREAD_GROUP.setDaemon(true);
	}

	public static ThreadFactory getThreadFactory(final String name) {
		return runnable -> {
			Thread thread = new Thread(NETTY_THREAD_GROUP, runnable, String.format(name, NETTY_THREAD_ID.getAndIncrement()));
			thread.setDaemon(true);
			thread.setUncaughtExceptionHandler(com.gmt2001.UncaughtExceptionHandler.instance());
			return thread;
		};
	}
}