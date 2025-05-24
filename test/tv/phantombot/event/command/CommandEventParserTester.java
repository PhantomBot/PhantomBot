package tv.phantombot.event.command;

import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

public class CommandEventParserTester {

    private static int testsPassed = 0;
    private static int testsFailed = 0;
    private static int groupCounter = 0;

    public static void main(String[] args) {
        testDelimiterOnlyInputs();
        testTrailingEscape();
        testEscapedDelimiters();
        testGeneralEscapesAndQuoting();
        testLimitNoEscape();
        // Add more test group methods as needed

        System.out.println("\n---------------------------------");
        System.out.println("Test Summary:");
        System.out.println("Passed: " + testsPassed);
        System.out.println("Failed: " + testsFailed);
        System.out.println("---------------------------------");

        if (testsFailed > 0) {
            System.exit(1); // Indicate failure
        }
    }

    private static void testAssert(int groupNum, int testNumInGroup, String testName, List<String> expected, List<String> actual) {
        if (expected.equals(actual)) {
            System.out.println("[PASS G" + groupNum + "-" + testNumInGroup + "] " + testName);
            testsPassed++;
        } else {
            System.err.println("[FAIL G" + groupNum + "-" + testNumInGroup + "] " + testName + 
                               "\n       Expected: " + wrapWithQuotesAndJoin(expected) +
                               "\n       Actual:   " + wrapWithQuotesAndJoin(actual));
            testsFailed++;
        }
    }

    private static String wrapWithQuotesAndJoin(List<String> strings) {
        if (strings == null) return "null";
        return strings.stream()
            .map(s -> { 
                if (s == null) return "null";
                // Escape backslashes and double quotes within the string for clear Java-like literal representation
                String escaped = s.replace("\\", "\\\\").replace("\"", "\\\"");
                return "\"" + escaped + "\"";
            })
            .collect(Collectors.joining(", ", "[", "]"));
    }

    // --- Test Group Methods --- 

    private static void testDelimiterOnlyInputs() {
        groupCounter++; int testNum = 0;
        System.out.println("\n--- Testing Group " + groupCounter + ": Delimiter-Only Inputs and Limits ---");
        testAssert(groupCounter, ++testNum, "parseArgs(\" \", ' ', -1, false)", Arrays.asList("", ""), CommandEvent.parseArgs(" ", ' ', -1, false));
        testAssert(groupCounter, ++testNum, "parseArgs(\" \", ' ', 2, false)", Arrays.asList("", ""), CommandEvent.parseArgs(" ", ' ', 2, false));
        testAssert(groupCounter, ++testNum, "parseArgs(\" \", ' ', 1, false)", Arrays.asList(" "), CommandEvent.parseArgs(" ", ' ', 1, false));
        testAssert(groupCounter, ++testNum, "parseArgs(\" \", ' ', 0, false)", Arrays.asList(), CommandEvent.parseArgs(" ", ' ', 0, false));
        testAssert(groupCounter, ++testNum, "parseArgs(\"\", ' ', -1, false)", Arrays.asList(), CommandEvent.parseArgs("", ' ', -1, false));
        testAssert(groupCounter, ++testNum, "parseArgs(\"\"\"\", ' ', -1, false)", Arrays.asList(""), CommandEvent.parseArgs("\"\"", ' ', -1, false)); // Empty quoted string
        testAssert(groupCounter, ++testNum, "parseArgs(\"  \", ' ', -1, false)", Arrays.asList("", "", ""), CommandEvent.parseArgs("  ", ' ', -1, false));
        testAssert(groupCounter, ++testNum, "parseArgs(\"  \", ' ', 1, false)", Arrays.asList("  "), CommandEvent.parseArgs("  ", ' ', 1, false));
        testAssert(groupCounter, ++testNum, "parseArgs(\"  \", ' ', 2, false)", Arrays.asList("", ""), CommandEvent.parseArgs("  ", ' ', 2, false));
    }

    private static void testTrailingEscape() {
        groupCounter++; int testNum = 0;
        System.out.println("\n--- Testing Group " + groupCounter + ": Trailing Escape --- ");
        testAssert(groupCounter, ++testNum, "parseArgs(\"arg\\\", ' ', -1, false)", Arrays.asList("arg"), CommandEvent.parseArgs("arg\\", ' ', -1, false));
        testAssert(groupCounter, ++testNum, "parseArgs(\"arg\\\", ' ', 1, true)", Arrays.asList("arg\\"), CommandEvent.parseArgs("arg\\", ' ', 1, true));
        testAssert(groupCounter, ++testNum, "parseArgs(\"arg\\\", ' ', 2, true)", Arrays.asList("arg"), CommandEvent.parseArgs("arg\\", ' ', 2, true));
        testAssert(groupCounter, ++testNum, "parseArgs(\"arg1 arg2\\\", ' ', 2, true)", Arrays.asList("arg1", "arg2\\"), CommandEvent.parseArgs("arg1 arg2\\", ' ', 2, true));
    }

    private static void testEscapedDelimiters() {
        groupCounter++; int testNum = 0;
        System.out.println("\n--- Testing Group " + groupCounter + ": Escaped Delimiters (User Feedback Logic) ---");
        // Behavior: \ + delimiter = delimiter still delimits, \ is consumed
        testAssert(groupCounter, ++testNum, "parseArgs(\"arg1\\ arg2\", ' ', -1, false)", Arrays.asList("arg1", "arg2"), CommandEvent.parseArgs("arg1\\ arg2", ' ', -1, false));
        testAssert(groupCounter, ++testNum, "parseArgs(\"arg1\\ arg2\\ arg3\", ' ', -1, false)", Arrays.asList("arg1", "arg2", "arg3"), CommandEvent.parseArgs("arg1\\ arg2\\ arg3", ' ', -1, false));
        testAssert(groupCounter, ++testNum, "parseArgs(\"\\ arg1\", ' ', -1, false)", Arrays.asList("", "arg1"), CommandEvent.parseArgs("\\ arg1", ' ', -1, false)); // Note: first part is empty string
        testAssert(groupCounter, ++testNum, "parseArgs(\"arg1\\ \", ' ', -1, false)", Arrays.asList("arg1", ""), CommandEvent.parseArgs("arg1\\ ", ' ', -1, false)); // Note: last part is empty string
        testAssert(groupCounter, ++testNum, "parseArgs(\"\\ \\ \", ' ', -1, false)", Arrays.asList("", "", ""), CommandEvent.parseArgs("\\ \\ ", ' ', -1, false)); // Only escaped delimiters
    }

    private static void testGeneralEscapesAndQuoting() {
        groupCounter++; int testNum = 0;
        System.out.println("\n--- Testing Group " + groupCounter + ": General Escapes and Quoting ---");
        testAssert(groupCounter, ++testNum, "parseArgs(\"arg1\\\\arg2\", ' ', -1, false)", Arrays.asList("arg1\\arg2"), CommandEvent.parseArgs("arg1\\\\arg2", ' ', -1, false)); // Literal backslash
        testAssert(groupCounter, ++testNum, "parseArgs(\"arg1\\\"arg2\", ' ', -1, false)", Arrays.asList("arg1\"arg2"), CommandEvent.parseArgs("arg1\\\"arg2", ' ', -1, false)); // Literal quote
        testAssert(groupCounter, ++testNum, "parseArgs(\"\"arg1 arg2\"\", ' ', -1, false)", Arrays.asList("arg1 arg2"), CommandEvent.parseArgs("\"arg1 arg2\"", ' ', -1, false));
        testAssert(groupCounter, ++testNum, "parseArgs(\"\"arg1 \\\"arg2\\\"\"\", ' ', -1, false)", Arrays.asList("arg1 \"arg2\""), CommandEvent.parseArgs("\"arg1 \\\"arg2\\\"\"", ' ', -1, false));
        testAssert(groupCounter, ++testNum, "parseArgs(\"arg1 \"literal quote\" arg2\", ' ', -1, false)", Arrays.asList("arg1", "literal quote", "arg2"), CommandEvent.parseArgs("arg1 \"literal quote\" arg2", ' ', -1, false));
        testAssert(groupCounter, ++testNum, "parseArgs(\"arg1 \\\"still literal\\\" arg2\", ' ', -1, false)", Arrays.asList("arg1", "\"still literal\"", "arg2"), CommandEvent.parseArgs("arg1 \\\"still literal\\\" arg2", ' ', -1, false));
    }

    private static void testLimitNoEscape() {
        groupCounter++; int testNum = 0;
        System.out.println("\n--- Testing Group " + groupCounter + ": limitNoEscape --- ");
        testAssert(groupCounter, ++testNum, "parseArgs(\"arg1 arg2 arg3\", ' ', 2, true)", Arrays.asList("arg1", "arg2 arg3"), CommandEvent.parseArgs("arg1 arg2 arg3", ' ', 2, true));
        testAssert(groupCounter, ++testNum, "parseArgs(\"arg1 \"arg2 still arg2\" arg3\", ' ', 2, true)", Arrays.asList("arg1", "\"arg2 still arg2\" arg3"), CommandEvent.parseArgs("arg1 \"arg2 still arg2\" arg3", ' ', 2, true));
        testAssert(groupCounter, ++testNum, "parseArgs(\"arg1 arg2\", ' ', 1, true)", Arrays.asList("arg1 arg2"), CommandEvent.parseArgs("arg1 arg2", ' ', 1, true));
        testAssert(groupCounter, ++testNum, "parseArgs(\"arg1 arg2 arg3\", ' ', 1, true)", Arrays.asList("arg1 arg2 arg3"), CommandEvent.parseArgs("arg1 arg2 arg3", ' ', 1, true));
   }
}
