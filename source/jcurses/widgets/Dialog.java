package jcurses.widgets;

import jcurses.event.WindowEvent;
import jcurses.event.WindowListener;

/**
 * This class implements a modal dialog. The diffirence to a normal window is,
 * that a call oft the 'show' - method blocks, until the dialog window is
 * closed.
 */
public class Dialog extends Window implements WindowListener, WindowManagerBlockingCondition
{

    /**
     * The constructor
     *
     * @param x the x coordinate of the dialog window's top left corner
     * @param y the y coordinate of the dialog window's top left corner
     * @param width the width of the dialog window
     * @param height the height of the dialog window
     * @param title dialog's title
     * @param border true, if the dialog window has a border, false otherwise
     */
    @SuppressWarnings("LeakingThisInConstructor")
    public Dialog(int x, int y, int width, int height, boolean border, String title)
    {
        super(x, y, width, height, border, title);
        addListener(this);
    }

    /**
     * The constructor. The dialog window is centered ot the screen.
     *
     * @param width the width of the dialog window
     * @param height the height of the dialog window
     * @param title dialog's title
     * @param border true, if the dialog window has a border, false otherwise
     */
    @SuppressWarnings("LeakingThisInConstructor")
    public Dialog(int width, int height, boolean border, String title)
    {
        super(width, height, border, title);
        addListener(this);
    }

    @Override
    public boolean evaluate()
    {
        return !isClosed();
    }

    @Override
    public void setVisible(boolean value)
    {
        if (value)
        {
            super.setVisible(true);
            if (WindowManager.isInputThread())
            {
                WindowManager.blockInputThread(this);
            } else
            {
                try
                {
                    waitToClose();
                } catch (InterruptedException e)
                {
                    //ignore
                }
            }
        }
    }

    @Override
    public void windowChanged(WindowEvent event)
    {
        if (event.getType() == WindowEvent.CLOSING)
        {
            close();
        } else if (event.getType() == WindowEvent.CLOSED)
        {
            notifyOfClosing();
        }
    }

    private synchronized void waitToClose() throws InterruptedException
    {
        wait();
    }

    private synchronized void notifyOfClosing()
    {
        notify();
    }

}
