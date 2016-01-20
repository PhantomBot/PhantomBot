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
package me.mast3rplan.phantombot.jerklib.parsers;

import me.mast3rplan.phantombot.jerklib.Channel;
import me.mast3rplan.phantombot.jerklib.Session;
import me.mast3rplan.phantombot.jerklib.events.CtcpEvent;
import me.mast3rplan.phantombot.jerklib.events.IRCEvent;
import me.mast3rplan.phantombot.jerklib.events.IRCEvent.Type;
import me.mast3rplan.phantombot.jerklib.events.MessageEvent;

public class PrivMsgParser implements CommandParser
{
    /*
     * :gh00p!~ghoti@nix-58E3BFC5.cpe.net.cable.rogers.com PRIVMSG #tvtorrents
     * :gotcha :NeWtoz!jimmy@nix-2F996C9F.dhcp.aldl.mi.charter.com PRIVMSG
     * #tvtorrents :No problem :cute_bettong!n=elphias@about/apple/IIe/B0FH
     * PRIVMSG #ubuntu :Elphias (elphias)
     */

    @Override
    public MessageEvent createEvent(IRCEvent event)
    {
        Session session = event.getSession();
        Type type = session.isChannelToken(event.arg(0)) ? Type.CHANNEL_MESSAGE : Type.PRIVATE_MESSAGE;
        Channel chan = type == Type.CHANNEL_MESSAGE ? session.getChannel(event.arg(0)) : null;

        MessageEvent me = new MessageEvent(
                chan,
                event.arg(1),
                event.getRawEventData(),
                session,
                type);

        String msg = me.getMessage();
        if (msg.startsWith("\u0001"))
        {
            return new CtcpEvent(
                    msg.substring(1, msg.length() - 1),
                    me.getMessage(),
                    me.getRawEventData(),
                    me.getChannel(),
                    me.getSession());
        }

        return me;
    }
}
