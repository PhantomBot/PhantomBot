/**
 * Die Klasse ist die Root-Klasse aller Container-Klassen. Ihre Aufgabe besteht
 * darin eine Reihe von Widgets zu verwalten, die Eingabe an Sie weitezuleiten
 * etc
 */
package jcurses.widgets;

import jcurses.system.Toolkit;
import jcurses.util.Rectangle;

import java.util.Hashtable;
import java.util.Vector;

/**
 * This class is a superclass for widget containers, that is, for widgets, that
 * can contain other widgets
 */
public abstract class WidgetContainer extends Widget
{

    @SuppressWarnings("UseOfObsoleteCollectionType")
    private final Vector _widgets = new Vector();
    @SuppressWarnings("UseOfObsoleteCollectionType")
    private final Hashtable _constraints = new Hashtable();

    /**
     * The method paits the container self, that is all except childrens. Is
     * called by <code>doPaint</code>. Must be overrided by derived classes.
     */
    protected abstract void paintSelf();

    private Rectangle getChildsClippingRectangle()
    {
        Rectangle rect = (getChildsRectangle() == null) ? getSize() : getChildsRectangle();
        int x = getAbsoluteX() + rect.getX();
        int y = getAbsoluteY() + rect.getY();
        rect.setLocation(x, y);
        return rect;
    }

    @Override
    protected void doPaint()
    {
        paintSelf();

        Toolkit.setClipRectangle(getChildsClippingRectangle());
        for (int i = 0; i < _widgets.size(); i++)
        {
            Widget widget = (Widget) _widgets.elementAt(i);
            widget.paint();
        }
        Toolkit.unsetClipRectangle();
    }

    /**
     * The method repaints the container self, that is all, except childrens. Is
     * called by <code>doRepaint</code>. Must be overrided by derived classes.
     */
    protected abstract void repaintSelf();

    @Override
    protected void doRepaint()
    {
        repaintSelf();
        Toolkit.setClipRectangle(getChildsClippingRectangle());
        for (int i = 0; i < _widgets.size(); i++)
        {
            Widget widget = (Widget) _widgets.elementAt(i);
            widget.repaint();
        }
        Toolkit.unsetClipRectangle();

    }

    private Rectangle getClippingRect(Rectangle rect, Widget widget)
    {

        Rectangle widgetRectangle = new Rectangle(widget.getAbsoluteX(), widget.getAbsoluteY(),
                widget.getSize().getWidth(),
                widget.getSize().getHeight());
        Rectangle clip = rect.intersection(widgetRectangle);
        return clip;

    }

    private void packChild(Widget widget, Object constraint)
    {
        getLayoutManager().layout(widget, constraint);
    }

    /**
     * The method layouts all childrens bei the widget, using containers layout
     * manager. The method is called bei framework, before it paints a window-
     */
    protected void pack()
    {
        for (int i = 0; i < _widgets.size(); i++)
        {
            Widget widget = (Widget) _widgets.elementAt(i);
            packChild(widget, _constraints.get(widget));
            if (widget instanceof WidgetContainer)
            {
                ((WidgetContainer) widget).pack();
            }
        }
    }

    /**
     * The method adds a widget to the container, declaring widget's lyouting
     * constraints. This method is called by layout manager and cann't be called
     * by developer. To add a widget to the container, a developer must use
     * methods of container's layout manager.
     *
     * @param widget widget to add
     * @param constraint layouting constraints
     */
    protected void addWidget(Widget widget, Object constraint)
    {
        _widgets.add(widget);
        _constraints.put(widget, constraint);
        widget.setParent(this);
    }

    /**
     * The method removes a widget from the container. This method is called by
     * layout manager and cann't be called by developer. To remove a widget from
     * the container, a developer must use methods of container's layout
     * manager.
     *
     * @param widget widget to remove
     *
     */
    protected void removeWidget(Widget widget)
    {
        _widgets.remove(widget);
        _constraints.remove(widget);
        widget.setParent(null);
    }

    /**
     * The method returns a list of input widgets within the container.
     *
     * @return input widgets within container
     */
    @SuppressWarnings("UseOfObsoleteCollectionType")
    protected Vector getListOfFocusables()
    {
        Vector result = new Vector();
        for (int i = 0; i < _widgets.size(); i++)
        {
            Widget widget = (Widget) _widgets.elementAt(i);
            if (widget.isFocusable() && widget.getVisible())
            {
                result.add(widget);
            } else if (widget instanceof WidgetContainer)
            {
                result.addAll(((WidgetContainer) widget).getListOfFocusables());
            }
        }

        return result;

    }

    /**
     * The method returns a list of widgets, that can handle shortcuts, within
     * the container.
     *
     * @return widgets within container, that can handle shortcuts
     */
    @SuppressWarnings("UseOfObsoleteCollectionType")
    protected Vector getListOfWidgetsWithShortCuts()
    {
        Vector result = new Vector();
        for (int i = 0; i < _widgets.size(); i++)
        {
            Widget widget = (Widget) _widgets.elementAt(i);
            if (widget.getShortCutsList() != null)
            {
                result.add(widget);
            } else if (widget instanceof WidgetContainer)
            {
                result.addAll(((WidgetContainer) widget).getListOfWidgetsWithShortCuts());
            }
        }

        return result;

    }

    /**
     * This method returns the rectangle, that is used as painting surface for
     * container's children If null is returned, the entire container's surface
     * is used.
     */
    /**
     * This method returns the rectangle, that is used as painting surface for
     * container's children If null is returned, the entire container's surface
     * is used.
     *
     * @return
     */
    protected Rectangle getChildsRectangle()
    {
        return null;
    }

    /**
     * LayoutManager
     */
    private LayoutManager _layoutManager = null;

    /**
     * The method sets container's layout manager
     *
     * @param layoutManager new layout manager
     */
    public void setLayoutManager(LayoutManager layoutManager)
    {
        if (_layoutManager != null)
        {
            _layoutManager.unbindFromContainer();
        }
        _layoutManager = layoutManager;
        _layoutManager.bindToContainer(this);
    }

    /**
     * @return container's layout manager
     */
    public LayoutManager getLayoutManager()
    {
        if (_layoutManager == null)
        {
            setLayoutManager(new DefaultLayoutManager());
        }
        return _layoutManager;
    }

}
