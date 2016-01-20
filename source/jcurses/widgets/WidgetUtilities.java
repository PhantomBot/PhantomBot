/* -*- tab-width: 8; indent-tabs-mode: t; c-basic-offset: 8 -*- */
package jcurses.widgets;

/**
 * <code>WidgetUtilities</code> contains utility methods for the jcurses
 * library.
 *
 * @author <a href="mailto:lenbok@myrealbox.com">Len Trigg</a>
 * @version $Revision: 1.1 $
 */
public class WidgetUtilities
{

    /**
     * Method to be used by external threads wishing to perform safe calls to
     * jcurses widgets. A typical jcurses application only requires the built-in
     * jcurses input thread and need not use this method.
     *
     * @param r a <code>Runnable</code> containing the code to be executed in a
     * thread-safe manner.
     */
    public static void invokeAndWait(Runnable r)
    {
        WindowManager.invokeAndWait(r);
    }
}
