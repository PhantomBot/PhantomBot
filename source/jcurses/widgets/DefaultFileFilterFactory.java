package jcurses.widgets;

import java.io.File;
import java.io.FileFilter;

public class DefaultFileFilterFactory implements JCursesFileFilterFactory
{

    @Override
    public FileFilter generateFileFilter(String filterString)
    {
        return new DefaultFileFilter(filterString);
    }

}

class DefaultFileFilter implements FileFilter
{

    String _filterString = null;

    DefaultFileFilter(String filterString)
    {
        if (filterString != null)
        {
            _filterString = filterString.trim();
        }
    }

    @Override
    public boolean accept(File fileF)
    {

        if ((_filterString == null) || (fileF == null))
        {
            return true;
        } else
        {
            String file = fileF.getAbsolutePath().trim();
            if (file.lastIndexOf(File.separator) != -1)
            {
                file = file.substring(file.lastIndexOf(File.separator) + 1, file.length());
            }
            int index = _filterString.indexOf("*");
            if (index == -1)
            {
                return (_filterString.equals(file));
            } else if (index == 0)
            {
                if (_filterString.length() == 1)
                {
                    return true;
                } else
                {
                    return file.endsWith(_filterString.substring(1, _filterString.length()));
                }
            } else if (index == (_filterString.length() - 1))
            {
                return file.startsWith(_filterString.substring(0, _filterString.length() - 1));
            } else
            {
                return (file.startsWith(_filterString.substring(0, index))) && (file.endsWith(_filterString.substring(index + 1, _filterString.length())));
            }
        }

    }
}
