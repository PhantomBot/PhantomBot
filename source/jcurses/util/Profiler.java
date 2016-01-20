package jcurses.util;

/**
 * This a library-intern class for performance meausrement. The class isn't
 * needed to develop jcurses applications
 */
public class Profiler
{

    private static final long[] marks =
    {
        -1, -1, -1, -1, -1, -1, -1, -1, -1, -1
    };

    public static void setMark(int index)
    {
        if ((index < 0) || (index > 9))
        {
            throw new RuntimeException("illegal index");
        }
        marks[index] = System.currentTimeMillis();
    }

    public static void time(String message, int index)
    {
        long time = System.currentTimeMillis() - marks[index];
        Protocol.debug(message + ": " + time);

    }

    public static long getMarkTime(int index)
    {
        return marks[index];
    }

}
