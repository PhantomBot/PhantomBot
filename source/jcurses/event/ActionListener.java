package jcurses.event;

/**
 * The interface has to be implemented to listen on instances of
 * <code>ActionEvent</code>
 */
public interface ActionListener
{

    /**
     * The method will be called by an widget, generating
     * <code>ActionEvent</code> instances, if the listener has been registered
     * by it.
     *
     * @param event the event occured
     */
    public abstract void actionPerformed(ActionEvent event);

}
