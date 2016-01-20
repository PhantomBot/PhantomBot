package jcurses.event;

/**
 * This class implements a listener manager to manage
 * <code>jcurses.event.ActionEvent</code> instances and listener on these. Only
 * possible type of handled events is <code>jcurses.event.ActionEvent</code>, of
 * managed listeners id <code>jcurses.event.ActionListener</code>
 */
public class ActionListenerManager extends ListenerManager
{

    @Override
    protected void doHandleEvent(Event event, Object listener)
    {
        ((ActionListener) listener).actionPerformed((ActionEvent) event);
    }

    @Override
    protected void verifyListener(Object listener)
    {
        if (!(listener instanceof ActionListener))
        {
            throw new RuntimeException("illegal listener type");
        }
    }

    @Override
    protected void verifyEvent(Event event)
    {
        if (!(event instanceof ActionEvent))
        {
            throw new RuntimeException("illegal event type");
        }
    }

}
