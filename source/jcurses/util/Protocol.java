/**
 * ****************************************************
 *
 * Fürs Logging
 */
package jcurses.util;

import java.io.FileOutputStream;
import java.io.PrintStream;
import java.util.Calendar;
import java.util.HashSet;

/**
 * This class implements the debugging for jcurses applications. Developing a
 * jcurses application you can't use <code>System.out.println</code> calls,
 * because the console is used for painting. Instead of this ypu have to use
 * <code>system</code> or <code>debug</code> methods of this class. These made
 * nothing, if the system property "jcurses.protocol.filename" isn't defined, if
 * these is defined, log messages are written to the file, whose name is defined
 * in this property. There are two standard debug channels <code>SYSTEM</code>
 * and DEBUG for <code>system</code> and <code>debug</code> methods respective.
 * You can define your own channels. To activate a channel the method
 * activateChannnel must be used with cnannels'name as argument. Thereafter this
 * name are to use as second argument in <code>log</code> calls, to write
 * messages to the channel.
 */
public class Protocol
{

    public static final String SYSTEM_PROPERTY_NAME = "jcurses.protocol.filename";

    /**
     * The name of the standard <code>DEBUG</code> channel
     */
    public static final String DEBUG = "debug";
    /**
     * The name of the standard <code>SYSTEM</code> channel
     */
    public static final String SYSTEM = "system";

    @SuppressWarnings("MismatchedQueryAndUpdateOfCollection")
    private static final HashSet __activatedChannels = new HashSet();
    private static PrintStream __logStream = null;

    static
    {
        initLogStreamIfPossible();
        initLogging();
    }

    private static void initLogStreamIfPossible()
    {
        try
        {
            String fileName = System.getProperty(SYSTEM_PROPERTY_NAME);
            if (fileName != null)
            {
                __logStream = new PrintStream(new FileOutputStream(fileName, true));
                System.setErr(__logStream);
            } else
            {
            }
        } catch (Exception e)
        {
            //Etwas nicht geklappt. Also kein Logging
        }
    }

    private static void initLogging()
    {
        activateChannel(SYSTEM);
    }

    /**
     * The method activates a channel with given name
     *
     * @param channel the name of the channel to activate
     */
    public static void activateChannel(String channel)
    {
        __activatedChannels.add(channel);
    }

    /**
     * The method writes a log message
     *
     * @param message the messsage's text
     * @param channel name of the channel to write on.
     */
    public static void log(String message, String channel)
    {
        if (isLoggingActivated() && isChannelActivated(channel))
        {
            String outputMessage = getPrefix(channel) + " " + message;
            __logStream.println(outputMessage);
            __logStream.flush();

        }

    }

    private static String getPrefix(String channel)
    {
        Calendar cal = Calendar.getInstance();
        String prefix = "[" + cal.get(Calendar.DATE) + "." + (cal.get(Calendar.MONTH) + 1) + "."
                + cal.get(Calendar.YEAR) + "  " + cal.get(Calendar.HOUR) + ":" + cal.get(Calendar.MINUTE)
                + ":" + cal.get(Calendar.SECOND) + "  channel=" + channel + "]";
        return prefix;
    }

    private static boolean isLoggingActivated()
    {
        if (__logStream == null)
        {
            initLogStreamIfPossible();
        }
        return __logStream != null;
    }

    private static boolean isChannelActivated(String channel)
    {
        return true;
    }

    /**
     * Writes a message to <code>SYSTEM</code> channel
     *
     * @param message
     */
    public static void system(String message)
    {
        log(message, SYSTEM);
    }

    /**
     * Writes a message to <code>DEBUG</code> channel
     *
     * @param message
     */
    public static void debug(String message)
    {
        log(message, DEBUG);
    }

}
