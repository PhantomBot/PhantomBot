package tv.phantombot.scripts.handler;

import com.vdurmont.emoji.EmojiParser;

import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.StringJoiner;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * This is a helper class to parse emojis.
 * Rhino does not support the y-flag for RegExp which is needed to run Twitter's twemoji-parser. It runs, but it causes
 * an infinitive loop because the lastIndex variable is not behaving as expected and therefore the abort condition
 * will never happen.
 *
 * This implementation relies on <a href="https://github.com/vdurmont/emoji-java">emoji-java</a>. It just uses the
 * emoji parser and the emoji database (as of version 5.1.1 it's Emoji Version 13.1).
 * The output are codepoints that are compatible with the common emoji libraries such es Twemoji.
 *
 * @see <a href="http://mozilla.github.io/rhino/compat/engines.html#ES2015-syntax-RegExp--y--and--u--flags--y--flag--lastIndex">Rhino Compatibilty Table</a>
 */
public class EmojiProcessor {

    /**
     * Extracts all known emojis from the given string
     *
     * @param input the input string to parse emojis from
     * @return a list of single emoji characters (they are still multibyte characters)
     */
    public static List<String> extractEmoji(final String input) {
        return EmojiParser.extractEmojis(input);
    }

    /**
     * Converts a unicode (multi-byte) emoji to its codepoint representation (e.g. 1f590-1f3fb)
     *
     * @param emoji a single emoji to convert
     * @return the code point representation that works with emoji libraries
     */
    public static String covertEmoteToCodepoint(final String emoji) {
        StringJoiner sj = new StringJoiner("-");
        for (int i = 0; i < emoji.length(); i += 2) {
            sj.add(Integer.toHexString(emoji.codePointAt(i)));
        }
        return sj.toString();
    }

    /**
     * Combines {@link #extractEmoji(String)} and {@link #covertEmoteToCodepoint(String)} in a single method
     * to retrieve an array of codepoints
     *
     * @param input the input string to parse emojis from
     * @return an array of strings in a code point representation format that works with emoji libraries (e.g. 1f590-1f3fb)
     */
    public static String[] extractAllEmojiToCodepoint(final String input) {
        List<String> emojis = EmojiProcessor.extractEmoji(input);
        String[] result = new String[emojis.size()];
        for (int i = 0; i < result.length; i++) {
            result[i] = EmojiProcessor.covertEmoteToCodepoint(emojis.get(i));
        }
        return result;
    }

    public static Map<String, Long> groupByCount(final String[] emojis) {
        return Arrays.stream(emojis).collect(Collectors.groupingBy(Function.identity(), Collectors.counting()));
    }
}
