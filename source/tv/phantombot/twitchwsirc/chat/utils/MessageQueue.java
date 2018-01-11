/*
 * Copyright (C) 2016-2017 phantombot.tv
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
package tv.phantombot.twitchwsirc.chat.utils;

import java.util.concurrent.BlockingDeque;
import java.util.concurrent.LinkedBlockingDeque;

import tv.phantombot.twitchwsirc.chat.Session;
import tv.phantombot.PhantomBot;

public class MessageQueue implements Runnable {
	private final BlockingDeque<Message> queue = new LinkedBlockingDeque<Message>();
	private final String channelName;
	private final Thread thread;
	private Session session;
	private boolean isAllowedToSend = false;
	private boolean isKilled = false;
	private int writes = 0;

	/*
	 * Class constructor.
	 *
	 * @param {String} channelName
	 */
	public MessageQueue(String channelName) {
		this.channelName = channelName;

		// Set the default thread uncaught exception handler.
		Thread.setDefaultUncaughtExceptionHandler(com.gmt2001.UncaughtExceptionHandler.instance());

        // Start a new thread for our final queue.
        this.thread = new Thread(this, "tv.phantombot.twitchwsirc.chat.utils.MessageQueue::run");
        this.thread.setUncaughtExceptionHandler(com.gmt2001.UncaughtExceptionHandler.instance());
        this.thread.start();
	}

	/*
	 * Method that sets the sesson
	 *
	 * @param {Session} session
	 */
	public void setSession(Session session) {
		this.session = session;
	}

	/*
     * Method that sets if we are allowed to send messages.
     *
     * @param {boolean} isAllowedToSend
     */
	public void setAllowSendMessages(boolean isAllowedToSend) {
		this.isAllowedToSend = isAllowedToSend;
	}

	/*
     * Method that says if we are allowed to send messages.
     *
     * @return {boolean} isAllowedToSend
     */
    public boolean getAllowSendMessages() {
        return this.isAllowedToSend;
    }

    /*
     * Method that returns the amount of messages we've sent in 30 seconds.
     *
     * @return {int} writes
     */
    public int getWrites() {
    	return this.writes;
    }

	/*
	 * Method that adds a message to the end of the queue.
	 *
	 * @param {String} message
	 */
	public void say(String message) {
		queue.add(new Message(message));
	}

	/*
	 * Method that adds a message to the top of the queue.
	 *
	 * @param {String} message
	 */
	public void sayNow(String message) {
		queue.addFirst(new Message(message, true));
	}

	/*
	 * Method that handles sending messages to Twitch from our queue.
	 */
	@Override
	public void run() {
		long lastWrite = System.currentTimeMillis();
		long nextWrite = System.currentTimeMillis();
		double limit = PhantomBot.getMessageLimit();

		while (!isKilled) {
			try {
				// Get the next message in the queue.
				Message message = queue.take();

				// Set the time we got the message.
				long time = System.currentTimeMillis();

				// Make sure we're allowed to send messages and that this one can be sent.
				if (isAllowedToSend && (nextWrite < time || (message.hasPriority() && writes < 99))) {
					if (lastWrite > time) {
						if (writes > limit && !message.hasPriority()) {
							nextWrite = (time + (lastWrite - time));
							com.gmt2001.Console.warn.println("Message limit of (" + limit + ") has been reached. Messages will be sent again in " + (nextWrite - time) + "ms");
							continue;
						}
						writes++;
					} else {
						writes = 1;
                        lastWrite = (time + 30200);
					}

					// Send the message.
					session.getSocket().send("PRIVMSG #" + this.channelName + " :" + message.getMessage());
					com.gmt2001.Console.out.println("[CHAT] " + message.getMessage());
				}
			} catch (Exception ex) {
				com.gmt2001.Console.err.printStackTrace(ex);
			}
		}
	}

	/*
	 * Method that kills this instance.
	 */
	public void kill() {
		this.isKilled = true;
	}
}
