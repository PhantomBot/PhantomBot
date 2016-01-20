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
 * <em>even if it fails (= throws an <code>Exception</code>)</em>.
 *
 * @author pbleser
 * @see OnceUntilSucceedsTaskImpl
 * @see Session#onEvent(me.mast3rplan.phantombot.jerklib.tasks.Task)
 * @see Session#onEvent(Task,
 * me.mast3rplan.phantombot.jerklib.events.IRCEvent.Type...)
 * @see me.mast3rplan.phantombot.jerklib.tasks.TaskImpl
 * @see Type
 */
public abstract class OnceTaskImpl extends TaskImpl
{

    public OnceTaskImpl(String name)
    {
        super(name);
    }

    /**
     * Process the {@link IRCEvent}, once.
     *
     * @param e the {@link IRCEvent} to process
     */
    public abstract void receiveEventOnce(IRCEvent e);

    /**
     * {@inheritDoc}
     *
     * @param e
     */
    @Override
    public final void receiveEvent(IRCEvent e)
    {
        try
        {
            receiveEventOnce(e);
        } finally
        {
            this.cancel();
        }
    }
}
