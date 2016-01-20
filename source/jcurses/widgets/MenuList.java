package jcurses.widgets;

/**
 * This class is used for menus, that is a list, that prohibites items selection
 * (only invocation with 'enter' is possible). Also there is a possbility to add
 * so called separator items, that are items with customited text (per default
 * empty) that cann't be invoked und are used only for optical purposes.
 */
import jcurses.system.InputChar;
import jcurses.util.Rectangle;

public class MenuList extends List
{

    private static final String SEPARATOR = "\u0000\u0000\u0000\u0000";
    private static final String SEPARATOR_STRING = "";

    /**
     * Adds a separator at the specified position
     *
     * @param index position to add a separator
     *
     */
    public void addSeparator(int index)
    {
        add(index, SEPARATOR);
    }

    /**
     * Adds a separator at the end of the list
     *
     *
     */
    public void addSeparator()
    {
        addSeparator(getItemsCount());
    }

    @Override
    protected boolean handleInput(InputChar ch)
    {

        if (!ch.equals(getChangeStatusChar()))
        {
            return super.handleInput(ch);
        }
        return false;
    }

    @Override
    @SuppressWarnings("StringEquality")
    protected boolean isSelectable(int index)
    {
        return (!(getItem(index) == SEPARATOR));
    }

    @Override
    @SuppressWarnings("StringEquality")
    protected String getItemRepresentation(String item)
    {
        if (item == SEPARATOR)
        {
            return getSeparatorString();
        } else
        {
            return item;
        }
    }

    private String _separatorString = SEPARATOR_STRING;

    /**
     * Returns the text used by painting separators
     *
     * @return separator string
     *
     */
    public String getSeparatorString()
    {
        return _separatorString;
    }

    /**
     * Sets the text to use by painting separators
     *
     * @param value separator string
     *
     */
    public void setSeparatorString(String value)
    {
        _separatorString = value;
    }

    @Override
    protected Rectangle getPreferredSize()
    {
        return new Rectangle(getMaxItemLength() + 2, getItemsCount() + 2);
    }

    private int getMaxItemLength()
    {
        int result = 0;
        for (int i = 0; i < getItemsCount(); i++)
        {
            int length = getItemRepresentation((getItem(i))).length();
            result = (length > result) ? length : result;
        }

        return result;
    }

}
