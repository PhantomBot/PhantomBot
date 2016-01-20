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
package me.mast3rplan.phantombot.jerklib.events;

import java.util.List;
import me.mast3rplan.phantombot.jerklib.Channel;
import me.mast3rplan.phantombot.jerklib.ModeAdjustment;
import me.mast3rplan.phantombot.jerklib.Session;

/**
 * @author mohadib
 * @see me.mast3rplan.phantombot.jerklib.events.ModeEvent
 */
public class ModeEvent extends IRCEvent
{

    private final ModeType modeType;
    private final String setBy;
    private final Channel channel;
    private final List<ModeAdjustment> modeAdjustments;

    public ModeEvent(
            ModeType type,
            String rawEventData,
            Session session,
            List<ModeAdjustment> modeAdjustments,
            String setBy,
            Channel channel)
    {
        super(rawEventData, session, Type.MODE_EVENT);
        modeType = type;
        this.modeAdjustments = modeAdjustments;
        this.setBy = setBy;
        this.channel = channel;
    }

    public enum ModeType
    {

        USER,
        CHANNEL
    }

    /**
     * If mode event adjusted a Channel mode then the Channel effected will be
     * returned
     *
     * @return Channel
     * @see Channel
     */
    public Channel getChannel()
    {
        return channel;
    }

    /**
     * Gets the list of mode adjustments generated
     *
     * @return List of mode adjustments
     */
    public List<ModeAdjustment> getModeAdjustments()
    {
        return modeAdjustments;
    }

    /**
     * Gets who set the mode
     *
     * @return who set the mode
     */
    public String setBy()
    {
        return setBy;
    }

    /**
     * Indicates if this is a user mode or channel mode event
     *
     * @return the ModeType
     */
    public ModeType getModeType()
    {
        return modeType;
    }
}
