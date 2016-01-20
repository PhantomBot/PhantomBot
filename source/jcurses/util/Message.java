package jcurses.util;

import jcurses.event.ActionEvent;
import jcurses.event.ActionListener;
import jcurses.widgets.Button;
import jcurses.widgets.Label;
import jcurses.widgets.DefaultLayoutManager;
import jcurses.widgets.Dialog;
import jcurses.widgets.WidgetsConstants;

import java.util.StringTokenizer;

/**
 * This is a class to create and show user defined messages. Such message is a
 * dialog with an user defined title, containing an user defined text and a
 * button to close the window with an user defined label.
 */
public class Message extends Dialog implements ActionListener
{

    String _title = null;
    String _text = null;

    Button _button = null;
    Label _label = null;

    /**
     * The constructor
     *
     * @param title the message's title
     * @param text the message's text
     * @param buttonLabel the label on the message's button
     *
     */
    @SuppressWarnings("LeakingThisInConstructor")
    public Message(String title, String text, String buttonLabel)
    {
        super(getWidth(text, title) + 4, getHeight(text) + 7, true, title);

        DefaultLayoutManager manager = (DefaultLayoutManager) getRootPanel().getLayoutManager();

        _label = new Label(text);
        _button = new Button(buttonLabel);
        _title = title;

        _button.addListener(this);

        manager.addWidget(_label, 0, 0, getWidth(text, _title) + 2, getHeight(text) + 2, WidgetsConstants.ALIGNMENT_CENTER,
                WidgetsConstants.ALIGNMENT_CENTER);

        manager.addWidget(_button, 0, getHeight(text) + 2, getWidth(text, _title) + 2, 5, WidgetsConstants.ALIGNMENT_CENTER,
                WidgetsConstants.ALIGNMENT_CENTER);

    }

    private static int getWidth(String label, String title)
    {

        StringTokenizer tokenizer = new StringTokenizer(label, "\n");
        int result = 0;
        while (tokenizer.hasMoreElements())
        {
            String token = tokenizer.nextToken();
            if (result < token.length())
            {
                result = token.length();
            }
        }
        if (title.length() > result)
        {
            result = title.length();
        }
        //message nust fit on the schreen

        if (result > jcurses.system.Toolkit.getScreenWidth() - 3)
        {
            result = jcurses.system.Toolkit.getScreenWidth() - 3;
        }

        return result;
    }

    private static int getHeight(String label)
    {

        StringTokenizer tokenizer = new StringTokenizer(label, "\n");
        int result = 0;
        while (tokenizer.hasMoreElements())
        {
            tokenizer.nextElement();
            result++;
        }
        return result;
    }

    /**
     * Required for implementing <code>jcurses.event.ActionListener</code>
     */
    @Override
    public void actionPerformed(ActionEvent event)
    {
        close();
    }

}
