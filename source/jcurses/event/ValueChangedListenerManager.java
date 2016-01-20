package jcurses.event;

/**
 * This class implements a listener manager to manage
 * <code>jcurses.event.ValueChangedEvent</code> instances and listener on these.
 * Only possible type of handled events is
 * <code>jcurses.event.ValueChangedEvent</code>, of managed listeners id
 * <code>jcurses.event.ValueChangedListener</code>
 */
public class ValueChangedListenerManager extends ListenerManager
{

    @Override
    protected void doHandleEvent(Event event, Object listener)
    {
        ((ValueChangedListener) listener).valueChanged((ValueChangedEvent) event);
    }

    @Override
    protected void verifyListener(Object listener)
    {
        if (!(listener instanceof ValueChangedListener))
        {
            throw new RuntimeException("illegal listener type");
        }
    }

    @Override
    protected void verifyEvent(Event event)
    {
        if (!(event instanceof ValueChangedEvent))
        {
            throw new RuntimeException("illegal event type");
        }
    }

}
