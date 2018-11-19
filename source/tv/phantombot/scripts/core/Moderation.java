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
package tv.phantombot.scripts.core;

import java.util.Arrays;

/**
 *
 * @author ScaniaTV
 */
public final class Moderation {
    private static final Moderation INSTANCE = new Moderation();
    
    /**
     * Method that returns this instance.
     * 
     * @return 
     */
    public static Moderation instance() {
        return INSTANCE;
    }
    
    /**
     * Method that returns the amount of non-alphanumeric chars in a string.
     * 
     * @param message
     * @return 
     */
    public int getNonAlphanumericCount(String message) {
        int totalNonAlphanumericCount = 0;
        
        for (int i = 0; i < message.length(); i++) {
            char c = message.charAt(i);
            
            if (!(Character.isLetterOrDigit(c) || Character.isWhitespace(c))) {
                totalNonAlphanumericCount++;
            }
        }
        
        return totalNonAlphanumericCount;
    }
    
    /**
     * Method that gets the most repeating letter or digit chars in a string.
     * 
     * @param message
     * @param maxLength
     * @return 
     */
    public int getLongestLetterSequence(String message, int maxLength) {
        int totalRepeatingSequence = 0;
        char lastCharacter = message.charAt(0);
        
        for (int i = 1; i < message.length(); i++) {
            char c = message.charAt(i);
            
            if (Character.isLetterOrDigit(c)) {
                if (c == lastCharacter) {
                    totalRepeatingSequence++;
                    if (totalRepeatingSequence >= maxLength) {
                        break;
                    }
                } else {
                    totalRepeatingSequence = 0;
                }
            }
            lastCharacter = c;
        }
        
        return totalRepeatingSequence + 1;
    }
    
    /**
     * Method that gets the total caps count from a string.
     * 
     * @param message
     * @return 
     */
    public int getTotalCapsCount(String message) {
        int totalCapsCount = 0;
        
        for (int i = 0; i < message.length(); i++) {
            char c = message.charAt(i);
            
            if (Character.isUpperCase(c)) {
                totalCapsCount++;
            }
        }
        
        return totalCapsCount;
    }
}
