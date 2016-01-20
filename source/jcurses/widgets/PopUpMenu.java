package jcurses.widgets;

import jcurses.event.ItemEvent;
import jcurses.event.ItemListener;

/**
 * This class implements a popup menu window. Such windows can be used for
 * example to implemene menu bars ( currently not cantained in the library ). A
 * popup menu window gives a user the possibility to select and ivoke an item
 * from a list and is than closed. Separator items can be used as by
 * <code>MenuList</code> described.
 */
public class PopUpMenu implements WidgetsConstants, ItemListener
{

    private final MenuList _menuList = new MenuList();
    Dialog _peer = null;

    private int _x = 0;
    private int _y = 0;
    String _title = null;

    private int _selectedIndex = -1;
    private String _selectedItem = null;

    /**
     * The constructor
     *
     * @param x the x coordinate of the dialog window's top left corner
     * @param y the y coordinate of the dialog window's top left corner
     * @param title window's title
     */
    public PopUpMenu(int x, int y, String title)
    {
        _title = title;
        _x = x;
        _y = y;

    }

    /**
     * Makes the window visible. Blocks, until the window is closed.
     *
     */
    public void show()
    {
        int width = _menuList.getPreferredSize().getWidth();
        int height = _menuList.getPreferredSize().getHeight();

        _peer = new Dialog(_x, _y, width,
                height,
                false, null);
        GridLayoutManager manager1 = new GridLayoutManager(1, 1);
        _peer.getRootPanel().setLayoutManager(manager1);
        manager1.addWidget(_menuList, 0, 0, 1, 1, ALIGNMENT_CENTER, ALIGNMENT_CENTER);
        _menuList.addListener(this);
        _peer.show();
    }

    /**
     * Adds a separator item at the specified position
     *
     * @param index position
     */
    public void addSeparator(int index)
    {
        _menuList.addSeparator(index);
    }

    /**
     * Adds a separator at the end of the list.
     */
    public void addSeparator()
    {
        _menuList.addSeparator();
    }

    /**
     * Adds an item at the specified position
     *
     * @param item item to add
     * @param pos position
     */
    public void add(int pos, String item)
    {
        _menuList.add(pos, item);
    }

    /**
     * Adds an item at the end of the list.
     *
     * @param item
     */
    public void add(String item)
    {
        _menuList.add(item);
    }

    /**
     * @return the number of items
     */
    public int getItemsCount()
    {
        return _menuList.getItemsCount();
    }

    /**
     * @param index
     * @return the item at the specified position
     */
    public String getItem(int index)
    {
        return (String) _menuList.getItem(index);
    }

    /**
     * Removes the item at the specified position
     *
     * @param pos position
     */
    public void remove(int pos)
    {
        _menuList.remove(pos);
    }

    /**
     * Removes the first ocuurence of the specified item
     *
     * @param item item to be removed
     *
     */
    public void remove(String item)
    {
        _menuList.remove(item);
    }

    @Override
    public void stateChanged(ItemEvent e)
    {
        _selectedIndex = e.getId();
        _selectedItem = (String) e.getItem();
        _menuList.removeListener(this);
        _peer.close();

    }

    /**
     * Returns the last selected index. Should be invoked after the return of
     * the <code>show</code> to get the result
     *
     * @return last selected index
     */
    public int getSelectedIndex()
    {
        return _selectedIndex;
    }

    /**
     * Returns the last selected item. Should be invoked after the return of the
     * <code>show</code> to get the result
     *
     * @return last selected index
     */
    public String getSelectedItem()
    {
        return _selectedItem;
    }

}
