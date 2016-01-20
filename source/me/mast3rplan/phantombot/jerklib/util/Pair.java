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
package me.mast3rplan.phantombot.jerklib.util;

public class Pair<A, B>
{

    public final A first;
    public final B second;

    public Pair(A first, B second)
    {
        this.first = first;
        this.second = second;
    }

    @SuppressWarnings("unchecked")
    @Override
    public boolean equals(Object obj)
    {
        if (obj == this)
        {
            return true;
        }
        if (obj instanceof Pair && obj.hashCode() == hashCode())
        {
            Pair<A, B> other = (Pair<A, B>) obj;
            return (first != null ? first.equals(other.first) : other.first == null) && (second != null ? second.equals(other.second) : other.second == null);
        }
        return false;
    }

    @Override
    public int hashCode()
    {
        int hash = (first != null ? first.hashCode() ^ 42 : 0);
        hash += (second != null ? second.hashCode() : 0);
        return hash;
    }
}
