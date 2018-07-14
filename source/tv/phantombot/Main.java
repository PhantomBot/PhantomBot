/*
 * Copyright (C) 2016-2018 phantombot.tv
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

package tv.phantombot;

public final class Main {
    /**
     * Main method that starts everything.
     * 
     * @param args 
     */
    public static void main(String[] args) {
        final float javaVersion = Float.valueOf(System.getProperty("java.specification.version"));
        
        // Check the Java version.
        if (javaVersion < (float) 1.8 || javaVersion >= (float) 1.9) {
            System.out.println();
            System.out.println("Detected Java " + System.getProperty("java.version") + ". " + "PhantomBot requires Java 8. Java 9 and above will NOT work.");
            System.out.println();
            System.exit(1);
        } else {
            
        } 
    }
}
