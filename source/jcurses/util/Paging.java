package jcurses.util;

/**
 * A utility class to handle paging in components. The class get the 'page size'
 * and the size as constructor argument and calculates page numbers, start and
 * end indexes etc...
 * 
*
 */
public class Paging
{

    private int _pageSize = 0;
    private int _size = 0;

    /**
     * The constructor
     *
     * @param pageSize the page size
     * @param size the size
     *
     */
    public Paging(int pageSize, int size)
    {
        _pageSize = pageSize;
        _size = size;
    }

    /**
     * The method returns the page number for the given index
     *
     * @param index index, to calculate the page number
     * @return the page number for the index
     *
     */
    public int getPageNumber(int index)
    {
        @SuppressWarnings("UnusedAssignment")
        int result = 0;

        if (index <= 0)
        {
            result = 0;
        } else if (_pageSize == 1)
        {
            result = index;
        } else
        {
            if ((_size - index - 1) < _pageSize)
            {
                index = _size - 1;
            }
            result = (index + 1) / _pageSize + (((index + 1) % _pageSize > 0) ? 1 : 0) - 1;

        }

        return result;
    }

    /**
     * The method returns the number of pages
     *
     * @return the number of pages
     *
     */
    public int getPageSize()
    {
        return getPageNumber(_size) + 1;
    }

    /**
     * The method returns the start index for the given page
     *
     * @param pageNumber the number of the page to calculate start index
     * @return start index
     *
     */
    public int getPageStartIndex(int pageNumber)
    {
        int result = Math.max(0, getPageEndIndex(pageNumber) - _pageSize + 1);
        return result;
    }

    /**
     * The method returns the end index for the given page
     *
     * @param pageNumber the number of the page to calculate end index
     * @return start index
     *
     */
    public int getPageEndIndex(int pageNumber)
    {
        int result = Math.min(_size - 1, (pageNumber + 1) * _pageSize - 1);
        return result;
    }

    /**
     * The method returns the page offset for the given index
     *
     * @param index the index to calculate the page offset
     * @return start index
     *
     */
    public int getPageOffset(int index)
    {
        return index - getPageStartIndex(getPageNumber(index));
    }

    /**
     * The method returns an index for the given page offset of the given page
     * The extra handling for the last by one page
     *
     * @param pageNumber pageNumber
     * @param pageOffset page offset
     * @return index
     *
     */
    public int getIndexByPageOffset(int pageNumber, int pageOffset)
    {
        int startIndex = getPageStartIndex(pageNumber);
        int index = Math.min(_size, startIndex + pageOffset);
        if (getPageNumber(index) != pageNumber)
        {
            index = startIndex;
        }

        return index;
    }

}
