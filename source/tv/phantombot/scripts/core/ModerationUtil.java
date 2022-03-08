/*
 * Copyright (C) 2016-2022 phantombot.github.io/PhantomBot
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

import java.util.HashMap;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

/**
 * This system has a lot of repeating code, mostly because when matching spam, 
 * once we hit the limit, we no longer need to keep matching, so we return true.
 * This doesn't allow us to make functions to get "totals" of things and reuse them.
 * 
 * @author ScaniaTV
 */
public class ModerationUtil {
    private static final ModerationUtil INSTANCE = new ModerationUtil();
    private final Pattern URL_PATTERN = Pattern.compile("((?:(http|https|rtsp):\\/\\/(?:(?:[a-z0-9\\$\\-\\_\\.\\+\\!\\*\\\\\\'\\(\\)\\,\\;\\?\\&\\=]|(?:\\%[a-fA-F0-9]{2})){1,64}(?:\\:(?:[a-z0-9\\$\\-\\_\\.\\+\\!\\*\\\\\\'\\(\\)\\,\\;\\?\\&\\=]|(?:\\%[a-fA-F0-9]{2})){1,25})?\\@)?)?((?:(?:[a-z0-9][a-z0-9\\-]{0,64}\\.)+(?:(?:aero|a[cdefgilmnoqrstuwxz])|(?:biz|b[abdefghijmnorstvwyz])|(?:com|c[acdfghiklmnoruvxyz])|d[ejkmoz]|(?:edu|e[cegrstu])|(?:fyi|f[ijkmor])|(?:gov|g[abdefghilmnpqrstuwy])|(?:how|h[kmnrtu])|(?:info|i[delmnoqrst])|(?:jobs|j[emop])|k[eghimnrwyz]|l[abcikrstuvy]|(?:mil|mobi|moe|m[acdeghklmnopqrstuvwxyz])|(?:name|net|n[acefgilopruz])|(?:org|om)|(?:pro|p[aefghklmnrstwy])|qa|(?:r[eouw])|(?:s[abcdeghijklmnortuvyz])|(?:t[cdfghjklmnoprtvwz])|u[agkmsyz]|(?:vote|v[ceginu])|(?:xxx)|(?:watch|w[fs])|y[etu]|z[amw]))|(?:(?:25[0-5]|2[0-4][0-9]|[0-1][0-9]{2}|[1-9][0-9]|[1-9])\\.(?:25[0-5]|2[0-4][0-9]|[0-1][0-9]{2}|[1-9][0-9]|[1-9]|0)\\.(?:25[0-5]|2[0-4][0-9]|[0-1][0-9]{2}|[1-9][0-9]|[1-9]|0)\\.(?:25[0-5]|2[0-4][0-9]|[0-1][0-9]{2}|[1-9][0-9]|[0-9])))(?:\\:\\d{1,5})?)(\\/(?:(?:[a-z0-9\\;\\/\\?\\:\\@\\&\\=\\#\\~\\-\\.\\+\\!\\*\\\\\\'\\(\\)\\,\\_])|(?:\\%[a-fA-F0-9]{2}))*)?(?:\\b|$)|(\\.[a-z]+\\/|magnet:\\/\\/|mailto:\\/\\/|ed2k:\\/\\/|irc:\\/\\/|ircs:\\/\\/|skype:\\/\\/|ymsgr:\\/\\/|xfire:\\/\\/|steam:\\/\\/|aim:\\/\\/|spotify:\\/\\/)");
    private final Pattern YOUTUBE_PATTERN = Pattern.compile("!\\w{1,9}\\s((http(s)?:\\/\\/)?(youtu(\\.be|be\\.com)))");
    private final Pattern URL_DECIPHER = Pattern.compile("(\\s?\\(?(dot|\\.){1,2}\\)?\\s?)");
    private final Pattern ZALGO_PATTERN = Pattern.compile("(?:[\\p{M}])([\\p{M}])+?");
    private final Pattern GRAPHEMES_PATTERN = Pattern.compile("\\p{M}|\\p{So}|\\p{InPhonetic_Extensions}|\\p{InLetterlikeSymbols}|\\p{InDingbats}|\\p{InBoxDrawing}|\\p{InBlockElements}|\\p{InGeometricShapes}|\\p{InHalfwidth_and_Fullwidth_Forms}");
    
    /**
     * Class constructor.
     */
    public ModerationUtil() {
        
    }
    
    /**
     * Types of filters we have,
     */
    public static enum FilterType {
        Links,
        Caps,
        Symbols,
        Spam,
        Zalgo,
        OneManSpam,
        Digits,
        FakePurges,
        Actions,
        Paragraphs,
        Emotes,
        Graphemes,
        R9k
    }
    
    /**
     * Types if punishments we have.
     */
    public static enum PunishmentType {
        WARNING,
        PURGE,
        TIMEOUT,
        BAN
    }
    
    /**
     * Method that checks if the message has a URL.
     * 
     * @param message
     * @param doDecipher
     * @param isSongrequestsEnabled
     * @return 
     */
    public boolean hasURL(String message, boolean doDecipher, boolean isSongrequestsEnabled) {
        // If fake links like "google dot com", "google(.)com" should be changed to "google.com".
        if (doDecipher) {
            message = getDecipheredURLFromMessage(message);
        }
        
        boolean hasMatch = URL_PATTERN.matcher(message).find();
        
        if (isSongrequestsEnabled && YOUTUBE_PATTERN.matcher(message).find()) {
            hasMatch = false;
        }
        
        return hasMatch;
    }
    
    /**
     * Method that deciphers a URL from a message, if a link has "(dot)" and not a "." it gets replaced with a ".".
     * 
     * @param message
     * @return 
     */
    private String getDecipheredURLFromMessage(String message) {
        Matcher matches = URL_DECIPHER.matcher(message);
        StringBuffer sb = null;
        
        // Create a new string buffer if needed.
        // The while doesn't need to be in here, but what the heck.
        if (matches.find()) {
            // Build our string buffer
            sb = new StringBuffer(message.length());
            // Replace the first match.
            matches.appendReplacement(sb, ".");
            
            // Get all the other macthes and replace them.
            while (matches.find()) {
                matches.appendReplacement(sb, ".");
            }
            matches.appendTail(sb);
        }
        
        return (sb == null ? message : sb.toString());
    }
    
    /**
     * Method that checks if a message or username has a blacklist.
     * 
     * @param username
     * @param message
     * @param blacklist
     * @return 
     */
    public boolean hasBlacklist(String username, String message, JSONObject blacklist) {
        boolean hasBlacklist = false;
        
        try {
            if (blacklist.has("_total") && blacklist.getInt("_total") > 0) {
                JSONArray list = blacklist.getJSONArray("list");
                
                
            }
        } catch (JSONException ex) {
            com.gmt2001.Console.err.logStackTrace(ex);
        }
        
        return hasBlacklist;
    }
    
    /**
     * Method that says if a string has too many non alpha chars.
     * 
     * @param message
     * @param maxNonAlpha
     * @param maxPercent
     * @return 
     */
    public boolean hasMaximumNonAlphanumeric(String message, int maxNonAlpha, float maxPercent) {
        boolean hasMaximumNonAlpha = false;
        float messageLength = message.length();
        int totalNonAlphanumericCount = 1;
        
        for (int i = 0; i < message.length(); i++) {
            char c = message.charAt(i);
            
            if (!(Character.isLetterOrDigit(c) || Character.isWhitespace(c))) {
                totalNonAlphanumericCount++;
                if (totalNonAlphanumericCount >= maxNonAlpha || ((totalNonAlphanumericCount / messageLength) >= maxPercent)) {
                    hasMaximumNonAlpha = true;
                    break;
                }
            }
        }
        
        return hasMaximumNonAlpha;
    }
    
    /**
     * Method that checks if multiple non-alphanumeric characters (random ones) are repeating multiple times in a row.
     * 
     * @param message
     * @param maxLength
     * @return 
     */
    public boolean hasLongNonAlphanumericSequence(String message, int maxLength) {
        boolean hasLongRepeatingSequence = false;
        int totalRepeatingSequence = 1;
        
        for (int i = 0; i < message.length(); i++) {
            char c = message.charAt(i);
            
            if (!(Character.isLetterOrDigit(c) || Character.isWhitespace(c))) {
                totalRepeatingSequence++;
                if (totalRepeatingSequence >= maxLength) {
                    hasLongRepeatingSequence = true;
                    break;
                }
            } else {
                totalRepeatingSequence = 1;
            }
        }
        
        return hasLongRepeatingSequence;
    }
    
    /**
     * Method that checks if a character is repeated multiple times in a row.
     * 
     * @param message
     * @param maxLength
     * @return 
     */
    public boolean hasLongCharacterSequence(String message, int maxLength) {
        boolean hasLongRepeatingSequence = false;
        int totalRepeatingSequence = 1;
        char lastCharacter = message.charAt(0);
        
        for (int i = 1; i < message.length(); i++) {
            char c = message.charAt(i);
            
            if (c == lastCharacter) {
                totalRepeatingSequence++;
                if (totalRepeatingSequence >= maxLength) {
                    hasLongRepeatingSequence = true;
                    break;
                }
            } else {
                totalRepeatingSequence = 1;
            }
            lastCharacter = c;
        }
        
        return hasLongRepeatingSequence;
    }
    
    /**
     * Method that checks if a word is repeated multiple times in a row or in a phrase
     * 
     * @param message
     * @param maxLength How many times a word can be repeated after another in a row.
     * @param maxTimes How many times total in a message a word can be repeated.
     * @param rawEmoteIndexes
     * @return 
     */
    public boolean hasRepeatingWordsOrSequence(String message, int maxLength, int maxTimes, String rawEmoteIndexes) {
        boolean hasLongRepeatingSequence = false;     
        int totalRepeatingSequence = 1;
        HashMap<String, Integer> repeats = new HashMap<>();
        String[] messageParts = getMessageWithoutEmotes(message, rawEmoteIndexes).split(" ");
        String lastWord = messageParts[0];

        for (int i = 1; i < messageParts.length; i++) {
            String word = messageParts[i];
            
            if (word.equalsIgnoreCase(lastWord)) {
                totalRepeatingSequence++;
                if (totalRepeatingSequence >= maxLength) {
                    hasLongRepeatingSequence = true;
                    break;
                }
            } else {
                totalRepeatingSequence = 1;
            }
            
            if (!repeats.containsKey(word)) {
                repeats.put(word, 1);
            } else {
                int times = (repeats.get(word) + 1);
                // If we said it the max times, break and return.
                if (times >= maxTimes) {
                   hasLongRepeatingSequence = true;
                   break;
                }
                repeats.put(word, times);
            }
            lastWord = word;
        }
        
        return hasLongRepeatingSequence;
    }
    
    /**
     * Method that gets a map of the emote indexes.
     * 
     * @param rawEmoteIndexes
     * @return 
     */
    private HashMap<Integer, Integer> getEmotesIndexMap(String rawEmoteIndexes) {
        HashMap<Integer, Integer> emoteIndexMap = new HashMap<>();
        String[] indexArray;
        
        if (rawEmoteIndexes.length() > 0) {
            indexArray = rawEmoteIndexes.split("/");
        
            for (int i = 0; i < indexArray.length; i++) {
                String[] indexes = indexArray[i].substring(indexArray[i].indexOf(":") + 1).split(",");
                for (int j = 0; j < indexes.length; j++) {
                    String[] index = indexes[j].split("-");
                
                    emoteIndexMap.put(Integer.parseInt(index[0]), Integer.parseInt(index[1]));
                }
            }
        }
        
        return emoteIndexMap;
    }
    
    /**
     * Method that removes all emotes from a message.
     * 
     * @param message
     * @param rawEmoteIndexes
     * @return 
     */
    private String getMessageWithoutEmotes(String message, String rawEmoteIndexes) {
        HashMap<Integer, Integer> emoteIndexMap = getEmotesIndexMap(rawEmoteIndexes);
        
        for (int i = message.length() - 1; i >= 0; i--) {
            if (emoteIndexMap.containsKey(i)) {
                message = message.substring(0, i) + message.substring(emoteIndexMap.get(i) + 1);
            }
        }

        return message.trim();
    }
    
    /**
     * Method that says if a message has too many caps.
     * 
     * @param message
     * @param maxCaps
     * @param maxPercent
     * @param rawEmoteIndexes
     * @return 
     */
    public boolean hasMaximumCaps(String message, int maxCaps, float maxPercent, String rawEmoteIndexes) {
        // Remove Twitch emotes from the message.
        message = getMessageWithoutEmotes(message, rawEmoteIndexes);
        
        boolean hasMaxCaps = false;
        float messageLength = message.length();
        int totalCapsCount = 1;

        for (int i = 0; i < message.length(); i++) {
            char c = message.charAt(i);
            
            if (Character.isUpperCase(c)) {
                totalCapsCount++;
                if (totalCapsCount >= maxCaps || ((totalCapsCount / messageLength) >= maxPercent)) {
                    hasMaxCaps = true;
                    break;
                }
            }
        }
        
        return hasMaxCaps;
    }
    
    /**
     * Method that checks if a message is in color.
     * 
     * @param message
     * @return 
     */
    public boolean hasColorMessage(String message) {
        return (message.toLowerCase().startsWith("/me ")); // The space is required for the color.
    }
    
    /**
     * Method that checks if a message is a fake purge.
     * 
     * @param message
     * @return 
     */
    public boolean hasFakePurge(String message) {
        boolean hasFakePurge = false;
        
        // Removed the colored settings, if any.
        if (hasColorMessage(message)) {
            message = message.substring(4); // Remove 3 + 1 for the space.
        }
        
        // Check these.
        if (message.startsWith("<message") && message.endsWith(">")) {
            hasFakePurge = true;
        } else if (message.startsWith("<") && message.endsWith("deleted>")) {
            hasFakePurge = true;
        }
        
        return hasFakePurge;
    }
    
    /**
     * Method that checks if the user is spamming our chat.
     * 
     * @param username - The name of the sender we are testing with.
     * @param message - The last message the user sent.
     * @param timeFrame - How many messages a user is allowed to send in a time frame. (Milliseconds)
     * @param maxMessages - How many messages the user can send in our time frame.
     * @param maxSames - How many of the same messages the user can send in the time frame (one after another).
     * @return 
     */
    public boolean isOneManSpam(String username, String message, int timeFrame, int maxMessages, int maxSames) {
        boolean isOneManSpam = false;
        long currentTime = System.currentTimeMillis();
        String lastMessage = "";
        int totalMessages = 1;
        int totalSameMessages = 1;
        
        // Not the fasted thing, might need to optimize later.
        for (ChatMessage chatLine : Moderation.instance().chatCache) {
            if (chatLine.getSender().equals(username)) {
                if ((currentTime - chatLine.getTime()) < timeFrame) {
                    totalMessages++;
                    // Check if the last message from the user was the same.
                    if (lastMessage.equalsIgnoreCase(chatLine.getMessage())) {
                        totalSameMessages++;
                    } else {
                        totalSameMessages = 1;
                    }
                    // Break and return true if a match was found.
                    if (totalMessages >= maxMessages || totalSameMessages >= maxSames) {
                        isOneManSpam = true;
                        break;
                    }
                }
                lastMessage = chatLine.getMessage();
            }
        }
        
        return isOneManSpam;
    }
    
    /**
     * Method that checks if a message has too many emotes.
     * 
     * @param message
     * @param maxEmotes
     * @param rawEmoteIndexes
     * @return 
     */
    public boolean hasMaximumEmotes(String message, int maxEmotes, String rawEmoteIndexes) {
        return (getEmotesIndexMap(rawEmoteIndexes).size() >= maxEmotes);
    }
    
    /**
     * Method that tells us if we have enough zalgo/box characters.
     * 
     * @param message
     * @param maxPercent
     * @return 
     */
    public boolean hasZalgoCharacters(String message, float maxPercent) {
        boolean hasMaxZalgoCharacters = false;
        int totalZalgoCharacters = 0;
        float messageLength = message.length();
        Matcher matches = ZALGO_PATTERN.matcher(message);
        
        while (matches.find()) {
            totalZalgoCharacters++;
            if ((totalZalgoCharacters / messageLength) >= maxPercent) {
                hasMaxZalgoCharacters = true;
                break;
            }
        }
        
        return hasMaxZalgoCharacters;
    }
    
    /**
     * Method that checks if a message has a special letter format (font) and other ASCII art.
     * 
     * @param message
     * @param maxPercent
     * @return 
     */
    public boolean hasSpecialLetters(String message, float maxPercent) {
        boolean hasMaxSpecialLetters = false;
        int totaSpecialLetters = 0;
        float messageLength = message.length();
        Matcher matches = GRAPHEMES_PATTERN.matcher(message);
        
        while (matches.find()) {
            totaSpecialLetters++;
            if ((totaSpecialLetters / messageLength) >= maxPercent) {
                hasMaxSpecialLetters = true;
                break;
            }
        }
        
        return hasMaxSpecialLetters;
    }
    
    /**
     * Method that detects if a message spams numbers.
     * 
     * @param message
     * @param maxNumbers
     * @param maxPercent
     * @return 
     */
    public boolean hasNumberSpam(String message, int maxNumbers, float maxPercent) {
        boolean hasNumberSpam = false;
        int totalNumbers = 0;
        float messageLength = message.length();
        
        for (int i = 0; i < message.length(); i++) {
            char c = message.charAt(i);
            
            if (Character.isDigit(c)) {
                totalNumbers++;
                if (totalNumbers >= maxNumbers || (totalNumbers / messageLength) >= maxPercent) {
                    hasNumberSpam = true;
                    break;
                }
            }
        }
        
        return hasNumberSpam;
    }
    
    /**
     * Method that checks if a message is too long.
     * 
     * @param message
     * @param maxLength
     * @return 
     */
    public boolean hasLongParagraph(String message, int maxLength) {
        return (message.length() >= maxLength);
    }
    
    /**
     * Method that matches the similarity between the last few messages. (This is to stop bots).
     * 
     * @param message
     * @param maxSimilarity
     * @return 
     */
    public boolean hasR9k(String message, float maxSimilarity) {
        boolean hasR9k = false;
        
        for (int i = (Moderation.instance().chatCache.size() - 1); i >= 0; i--) {
            
        }
        
        return hasR9k;
    }
    
    /**
     * Class that has chat messages in it.
     */
    public static class ChatMessage {
        private final String message;
        private final String sender;
        private final long time;
        
        public ChatMessage(String sender, String message) {
            this.sender = sender;
            this.message = message;
            this.time = System.currentTimeMillis();
        }
        
        public String getSender() {
            return sender;
        }
        
        public String getMessage() {
            return message;
        }
        
        public long getTime() {
            return time;
        }
    }
}
