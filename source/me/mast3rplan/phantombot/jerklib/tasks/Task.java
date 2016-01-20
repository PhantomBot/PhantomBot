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
import me.mast3rplan.phantombot.jerklib.events.IRCEvent.Type;
import me.mast3rplan.phantombot.jerklib.listeners.IRCEventListener;

/**
 * Task is a job that can be ran by the Session when certain types of events are
 * received. This class is very much like IRCEventListener , but it can be
 * associated with Types of events. See Session's onEvent methods for details.
 * <p/>
 * <a href="http://me.mast3rplan.phantombot.jerklib.wikia.com/wiki/Tasks">Task
 * Tutorial</a>
 *
 * @author mohadib
 * @see Session#onEvent(me.mast3rplan.phantombot.jerklib.tasks.Task)
 * @see Session#onEvent(Task,
 * me.mast3rplan.phantombot.jerklib.events.IRCEvent.Type...)
 * @see Type
 */
public interface Task extends IRCEventListener
{

    /**
     * Gets the name of a task
     *
     * @return name of task
     */
    public String getName();

    /**
     * Cancel a task. This task will not run again. If the task is currently
     * running it will finish then not run again.
     */
    public void cancel();

    /**
     * @return true if task is canceled , else false
     */
    public boolean isCanceled();
}
