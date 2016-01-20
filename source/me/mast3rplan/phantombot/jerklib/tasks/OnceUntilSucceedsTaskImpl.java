/* 
 * Copyright (C) 2015 www.phantombot.net
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
package me.mast3rplan.phantombot.jerklib.tasks;

import me.mast3rplan.phantombot.jerklib.Session;
import me.mast3rplan.phantombot.jerklib.events.IRCEvent;
import me.mast3rplan.phantombot.jerklib.events.IRCEvent.Type;

/**
 * An augmented {@link me.mast3rplan.phantombot.jerklib.tasks.TaskImpl} that
 * only executes once as it cancels itself out of the task queue once completed,
 * <em>until it succeeds</em> (if it bails out with a
 * <code>RuntimeException</code> or null {@linkplain #receiveEventOnce(IRCEvent) returns
 * <code>false</code>}, it will remain in the task queue.
 *
 * @author pbleser
 * @see me.mast3rplan.phantombot.jerklib.tasks.OnceTaskImpl
 * @see Session#onEvent(me.mast3rplan.phantombot.jerklib.tasks.Task)
 * @see Session#onEvent(Task,
 * me.mast3rplan.phantombot.jerklib.events.IRCEvent.Type...)
 * @see me.mast3rplan.phantombot.jerklib.tasks.TaskImpl
 * @see Type
 */
public abstract class OnceUntilSucceedsTaskImpl extends TaskImpl
{

    public OnceUntilSucceedsTaskImpl(String name)
    {
        super(name);
    }

    /**
     * Process the {@link IRCEvent}.
     *
     * @param e the {@link IRCEvent} to process
     * @return whether the task was successful or not; when returning
     * <code>false</code>, the task will remain in the task queue; when
     * returning <code>true</code>, it will be removed (and not executed any
     * more)
     */
    public abstract boolean receiveEventOnce(IRCEvent e);

    /**
     * {@inheritDoc}
     *
     * @param e
     */
    @Override
    public final void receiveEvent(IRCEvent e)
    {
        if (receiveEventOnce(e))
        {
            this.cancel();
        }
    }
}
