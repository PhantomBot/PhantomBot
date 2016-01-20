/* -*- tab-width: 8; indent-tabs-mode: t; c-basic-offset: 8 -*- */
package jcurses.widgets;

import jcurses.system.Toolkit;

import jcurses.system.CharColor;
import jcurses.system.InputChar;
import jcurses.util.Rectangle;

import java.util.Vector;

/**
 * This class is a jcurses-internal class, whose task is to manage jcurses text
 * based windows. It schouldn't be used writing applications.
 */
class WindowManager
{

    @SuppressWarnings("UseOfObsoleteCollectionType")
    private static final Vector __windowsStack = new Vector();

    private static final CharColor __defaultScreenColors = new CharColor(CharColor.BLUE, CharColor.BLUE);
    private static CharColor __colors = getDefaultScreenColors();

    /**
     * Method to be used by external threads wishing to perform safe calls to
     * jcurses widgets. Access to this method is provided from
     * WidgetUtilities.invokeAndWait().
     *
     * @param r a <code>Runnable</code> containing the code to be executed in a
     * thread-safe manner.
     */
    static synchronized void invokeAndWait(Runnable r)
    {
        r.run();
    }

    public static CharColor getScreenColors()
    {
        return __colors;
    }

    public static void setScreenColors(CharColor colors)
    {
        __colors = colors;
    }

    protected static CharColor getDefaultScreenColors()
    {
        return __defaultScreenColors;
    }

    @SuppressWarnings("SizeReplaceableByIsEmpty")
    protected static void createWindow(Window w)
    {
        if (__windowsStack.size() == 0)
        {
            init();
        }
        __windowsStack.add(w);
    }

    protected static void removeWindow(Window w)
    {
        if (__windowsStack.indexOf(w) != -1)
        {
            removeWindowFromScreen(w);
            __windowsStack.remove(w);
            w.closed();
            if (getTopWindow() == null)
            {
                shutdown();
            } else
            {
                getTopWindow().activate();
            }
        }
    }

    protected static void makeWindowVisible(Window w, Window oldTop)
    {
        Toolkit.startPainting();
        if (__windowsStack.indexOf(w) != -1)
        {
            int index = __windowsStack.indexOf(w);
            for (int i = index; i < __windowsStack.size(); i++)
            {
                Window aw = (Window) __windowsStack.elementAt(i);
                if (aw.isVisible())
                {
                    aw.paint();
                }
            }

        }

        if (getTopWindow() != oldTop)
        {
            if (oldTop != null)
            {
                oldTop.deactivate();
            }
            getTopWindow().activate();
        }
        Toolkit.endPainting();
    }

    protected static void makeWindowInvisible(Window w, Window oldTop)
    {
        if (__windowsStack.indexOf(w) != -1)
        {
            if (getTopWindow() == null)
            {
                shutdown();
            } else
            {
                removeWindowFromScreen(w);
                if (w == oldTop)
                {
                    w.deactivate();
                    if (getTopWindow() == null)
                    {
                        getTopWindow().activate();
                    }
                }
            }
        }
    }

    private static void removeWindowFromScreen(Window w)
    {
        Toolkit.startPainting();
        int index = __windowsStack.indexOf(w);
        if (!wasPartVisible(index))
        {
            Toolkit.endPainting();
            return;
        }
        Rectangle rect = w.getRectangle();
        if (w.hasShadow())
        {
            rect = ((Rectangle) rect.clone());
            rect.resize(rect.getWidth() + 1, rect.getHeight() + 1);
        }
        Toolkit.drawRectangle(rect, getScreenColors());
        for (int i = 0; i < index; i++)
        {
            Window aw = (Window) __windowsStack.elementAt(i);
            if (aw.isVisible())
            {
                Rectangle rect2 = aw.getRectangle();
                if (aw.hasShadow())
                {
                    rect2 = ((Rectangle) rect2.clone());
                    rect2.resize(rect2.getWidth() + 1, rect2.getHeight() + 1);
                }
                Rectangle clipRect = rect.intersection(rect2);
                if ((!clipRect.isEmpty()) && (isToBeRepainted(clipRect, i, index)))
                {
                    Toolkit.setClipRectangle(clipRect);
                    aw.repaint();
                    Toolkit.unsetClipRectangle();
                }
            }
        }
        Toolkit.endPainting();
    }

    private static boolean isToBeRepainted(Rectangle clipRect, int index, int endIndex)
    {
        boolean result = true;
        for (int i = index + 1; i < endIndex; i++)
        {
            Window aw = (Window) __windowsStack.elementAt(i);
            if ((aw.isVisible()) && (aw.getRectangle().contains(clipRect)))
            {
                result = false;
                break;
            }
        }

        return result;
    }

    private static boolean wasPartVisible(int index)
    {
        boolean result = true;
        for (int i = index + 1; i < __windowsStack.size(); i++)
        {
            Window aw = (Window) __windowsStack.elementAt(index);
            Rectangle rect2 = aw.getRectangle();
            if (aw.hasShadow())
            {
                rect2 = ((Rectangle) rect2.clone());
                rect2.resize(rect2.getWidth() + 1, rect2.getHeight() + 1);
            }
            Window aw1 = (Window) __windowsStack.elementAt(i);
            if (aw1.isVisible() && (aw1.getRectangle().contains(rect2)))
            {
                result = false;
                break;
            }
        }

        return result;
    }

    protected static void moveToTop(Window w)
    {
        Window oldTop = getTopWindow();
        if (__windowsStack.indexOf(w) != -1)
        {
            __windowsStack.remove(w);
            __windowsStack.add(w);
            Toolkit.startPainting();
            w.paint();
            Toolkit.endPainting();
            if (oldTop != null)
            {
                oldTop.deactivate();
            }
            w.activate();
        }

    }

    protected static Window getTopWindow()
    {
        Window result = null;

        for (int i = 0; i < __windowsStack.size(); i++)
        {
            Window window = (Window) __windowsStack.elementAt(__windowsStack.size() - i - 1);
            if (window.isVisible())
            {
                result = window;
                break;
            }
        }

        return result;
    }

    public synchronized static void init()
    {
        Toolkit.clearScreen(getScreenColors());
        startInputThread();

    }

    private synchronized static void shutdown()
    {
        deactivateInputThread();
        Toolkit.shutdown();
        stopInputThread();
    }

    private static final WindowManagerInputThread _inthread = new WindowManagerInputThread();

    private synchronized static void startInputThread()
    {
        _inthread.start();
    }

    private synchronized static void stopInputThread()
    {
        _inthread.end();
    }

    private synchronized static void deactivateInputThread()
    {
        _inthread.deactivate();
    }

    public static void blockInputThread(WindowManagerBlockingCondition cond)
    {
        _inthread.block(cond);
    }

    public static boolean isInputThread()
    {
        return (Thread.currentThread() == _inthread);
    }

    @SuppressWarnings("CallToPrintStackTrace")
    protected synchronized static void handleInput(InputChar input)
    {
        Window tw = getTopWindow();
        Toolkit.startPainting();
        if (tw != null)
        {
            try
            {
                tw.handleInput(input);
            } catch (Throwable e)
            {
                Toolkit.shutdown();
                e.printStackTrace();
                System.exit(1);
            }
        }
        if (_inthread.isRunning())
        {
            Toolkit.endPainting();
        }
    }

}

interface WindowManagerBlockingCondition
{

    boolean evaluate();
}

class WindowManagerInputThread extends Thread
{

    private boolean _run = true;
    private boolean _read = true;

    @Override
    public void run()
    {
        while (isRunning())
        {
            if (isReading())
            {
                InputChar inputChar = Toolkit.readCharacter();
                WindowManager.handleInput(inputChar);
            }
        }
    }

    protected void block(WindowManagerBlockingCondition cond)
    {
        Toolkit.endPainting();
        while (cond.evaluate() && isRunning())
        {
            if (isReading())
            {
                InputChar inputChar = Toolkit.readCharacter();
                WindowManager.handleInput(inputChar);
            }
        }
    }

    protected synchronized void end()
    {
        _run = false;
    }

    protected synchronized void deactivate()
    {
        _read = false;
    }

    protected synchronized boolean isRunning()
    {
        return _run;
    }

    protected synchronized boolean isReading()
    {
        return _read;
    }

}
