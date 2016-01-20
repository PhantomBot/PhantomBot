package jcurses.widgets;

import jcurses.event.ActionListener;
import jcurses.event.ActionEvent;
import jcurses.event.ItemListener;
import jcurses.event.ItemEvent;

import jcurses.system.InputChar;
import jcurses.system.Toolkit;
import jcurses.util.Message;

import java.io.File;
import java.io.FileFilter;

/**
 * This class implements a file select dialog
 */
public class FileDialog extends Dialog implements WidgetsConstants, ItemListener, ActionListener
{

    private String _directory = null;
    private String _file = null;
    private String _filterString = null;

    private boolean _inRoots = false;

    private String _result = null;

    String _ioErrorText = "Input/Output Error is occured!";
    String _ioErrorTitle = "I/O Error";

    JCursesFileFilterFactory _filterFactory = new DefaultFileFilterFactory();

    List _directories = null;
    List _files = null;
    Label _fileLabel = null;
    Label _filterLabel = null;
    TextField _fileField = null;
    TextField _filterField = null;
    Button _okButton = null;
    Button _cancelButton = null;

    /**
     * The constructor
     *
     * @param x the x coordinate of the dialog window's top left corner
     * @param y the y coordinate of the dialog window's top left corner
     * @param width
     * @param height
     * @param title dialog's title
     */
    @SuppressWarnings("LeakingThisInConstructor")
    public FileDialog(int x, int y, int width, int height, String title)
    {
        super(x, y, width, height, true, title);

        _directories = new List();
        _directories.setSelectable(false);
        _directories.setTitle("Directories");
        _directories.addListener(this);
        _files = new List();
        _files.setSelectable(false);
        _files.setTitle("Files");
        _files.addListener(this);
        _fileLabel = new Label("File: ");
        _filterLabel = new Label("Filter: ");
        _fileField = new TextField();
        _fileField.setText(getCurrentFileContent());
        _filterField = new FilterTextField(this);
        _okButton = new Button("OK");
        _okButton.addListener(this);
        _cancelButton = new Button("Cancel");
        _cancelButton.addListener(this);

        Panel topPanel = new Panel();
        GridLayoutManager topManager = new GridLayoutManager(2, 1);
        topPanel.setLayoutManager(topManager);
        topManager.addWidget(_directories, 0, 0, 1, 1, ALIGNMENT_CENTER, ALIGNMENT_CENTER);
        topManager.addWidget(_files, 1, 0, 1, 1, ALIGNMENT_CENTER, ALIGNMENT_CENTER);

        Panel bottomPanel = new Panel();
        GridLayoutManager bottomManager = new GridLayoutManager(4, 4);
        bottomPanel.setLayoutManager(bottomManager);
        bottomManager.addWidget(_fileLabel, 0, 0, 1, 1, ALIGNMENT_CENTER, ALIGNMENT_RIGHT);
        bottomManager.addWidget(_filterLabel, 0, 2, 1, 1, ALIGNMENT_CENTER, ALIGNMENT_RIGHT);
        bottomManager.addWidget(_fileField, 1, 0, 2, 1, ALIGNMENT_CENTER, ALIGNMENT_CENTER);
        bottomManager.addWidget(_filterField, 1, 2, 2, 1, ALIGNMENT_CENTER, ALIGNMENT_CENTER);
        bottomManager.addWidget(_okButton, 3, 0, 1, 1, ALIGNMENT_CENTER, ALIGNMENT_CENTER);
        bottomManager.addWidget(_cancelButton, 3, 2, 1, 1, ALIGNMENT_CENTER, ALIGNMENT_CENTER);

        DefaultLayoutManager manager = (DefaultLayoutManager) getRootPanel().getLayoutManager();

        manager.addWidget(topPanel, 0, 0, width - 2, height - 6, ALIGNMENT_CENTER, ALIGNMENT_CENTER);
        manager.addWidget(bottomPanel, 0, height - 6, width - 2, 4, ALIGNMENT_CENTER, ALIGNMENT_CENTER);

        fillListWidgets(getCurrentDirectory());

    }

    /**
     * The constructor
     *
     * @param title dialog's title
     */
    public FileDialog(String title)
    {
        this(Toolkit.getScreenWidth() / 4,
                Toolkit.getScreenHeight() / 4,
                Toolkit.getScreenWidth() / 2,
                Toolkit.getScreenHeight() / 2,
                title);
    }

    /**
     * The constructor
     *
     */
    public FileDialog()
    {
        this(null);
    }

    /**
     * Sets the current directory
     *
     * @param directory current directory
     */
    public void setDirectory(String directory)
    {
        _directory = directory;
    }

    /**
     * @return current directory
     *
     */
    public String getDirectory()
    {
        return _directory;
    }

    /**
     * Sets the text of the message, that is shown, if an i/o error is occured
     * while the dialog tries to open a directory
     *
     * @param message i/o error message's text
     */
    public void setIOErrorMessageText(String message)
    {
        _ioErrorText = message;
    }

    /**
     * Sets the title of the message, that is shown, if an i/o error is occured
     * while the dialog tries to open a directory
     *
     * @param message i/o error message's text
     */
    public void setIOErrorMessageTitle(String message)
    {
        _ioErrorTitle = message;
    }

    /**
     * Shows the i/o error message, if an i/o occcurs reading a directory. In
     * the default implementation uses texts set with
     * <code>setIOErrorMessageTitle</code> and
     * <code>setIOErrorMessageText</code>. can be modified in derived classes.
     */
    protected void directoryReadErrorMessage()
    {
        new Message(_ioErrorTitle, _ioErrorText, "OK").show();
    }

    /**
     * Sets the default selected file
     *
     * @param file default selected file, if null, no file is selected per
     * default.
     */
    public void setDefaultFile(String file)
    {
        _file = file;
    }

    /**
     * @return default selected file
     */
    public String getDefaultFile()
    {
        return _file;
    }

    /**
     * Returns the last selected file. Should be called after a return from the
     * <code>show</code> method to read the result. If <code>null</code> is
     * returned, no file was selected.
     *
     * @return selected file
     */
    public File getChoosedFile()
    {
        if (_result == null)
        {
            return null;
        }
        return new File(_result);
    }

    /**
     * Sets a filter string
     *
     * Sets a string used to filter the files, that are shown in selected
     * directories. The filter string can be also modified by user. The filter
     * string has to be in the form <<!---->prefix>*<<!---->postfix>, and
     * matches all files, whose names start with <<!---->prefix> and end with
     * <<!---->postfix>. Both <<!---->prefix> and <<!---->postfix> can be empty.
     *
     * @param filterString filter string
     */
    public void setFilterString(String filterString)
    {
        _filterString = filterString;
    }

    /**
     * @return filter string
     *
     */
    public String getFilterString()
    {
        return _filterString;
    }

    public void setFilterFactory(JCursesFileFilterFactory filterFactory)
    {
        _filterFactory = filterFactory;
    }

    private String getCurrentDirectory()
    {
        if (_directory == null)
        {
            _directory = System.getProperty("user.dir");
        }
        File directoryFile = new File(_directory);
        String directoryPath = directoryFile.getAbsolutePath().trim();
        if (!directoryPath.endsWith(File.separator))
        {
            directoryPath = directoryPath + File.separator;
        }

        return directoryPath;
    }

    private String getRelativePath(File file, String directoryPath)
    {
        String path = file.getAbsolutePath().trim();
        if (path.startsWith(directoryPath))
        {
            path = path.substring(directoryPath.length(), path.length());
        }

        if (path.endsWith(File.separator))
        {
            path = path.substring(0, (path.length() - 1));
        }

        return path;
    }

    private void saveResult()
    {
        _result = _fileField.getText();
    }

    private String getCurrentFileContent()
    {
        String content = (_file != null) ? _file : getCurrentDirectory();

        return content;
    }

    private void updateFileField()
    {
        _fileField.setText(getCurrentFileContent());
        _fileField.paint();
    }

    private void updateFilterField()
    {
        _filterField.setText(_filterString);
        _filterField.paint();
    }

    private void updateListWidgets()
    {
        updateListWidgets(false);
    }

    private void updateListWidgets(boolean roots)
    {
        _directories.clear();
        _files.clear();
        if (!roots)
        {
            fillListWidgets(getCurrentDirectory());
        } else
        {
            fillDirectoriesWidgetWithRoots();
        }
        _directories.paint();
        _files.paint();
    }

    private void fillDirectoriesWidgetWithRoots()
    {
        File[] roots = File.listRoots();
        for (File root : roots)
        {
            _directories.add(root.getAbsolutePath());
        }
    }

    @SuppressWarnings("ResultOfObjectAllocationIgnored")
    private void fillListWidgets(String directory)
    {

        File directoryFile = new File(directory);

        if (directoryFile.isDirectory())
        {
            File[] files = directoryFile.listFiles(new FileDialogFileFilter(_filterFactory.generateFileFilter(_filterString)));
            if ((directoryFile.getParentFile() != null) || (isWindows()))
            {
                _directories.add("..");
            }
            for (File file : files)
            {
                if (file.isDirectory())
                {
                    _directories.add(getRelativePath(file, directory));
                } else
                {
                    _files.add(getRelativePath(file, directory));
                }
            }
        } else
        {
            //Kann eigentlich nicht sein
            new Message("Error", "An error is occured trying to read the directory\n " + directory, "OK");
        }
    }

    private boolean isWindows()
    {
        return (File.separatorChar == '\\');
    }

    @Override
    public void stateChanged(ItemEvent event)
    {
        if (event.getSource() == _directories)
        {
            _file = null;
            String item = ((String) event.getItem()).trim();
            String backupDirectory = _directory;
            if (item.equals(".."))
            {
                File directoryFile = new File(_directory);
                if (directoryFile.getParentFile() == null)
                {
                    //This can occur only by Win32
                    _inRoots = true;
                    updateListWidgets(true);
                    return;
                } else
                {
                    _directory = new File(_directory).getParentFile().getAbsolutePath();
                }
            } else
            {
                if (!_inRoots)
                {
                    _directory = getCurrentDirectory() + event.getItem();
                } else
                {
                    _directory = (String) event.getItem();
                }
            }
            if (!checkDirectory(_directory))
            {
                directoryReadErrorMessage();
                _directory = backupDirectory;
                return;
            } else
            {
                _inRoots = false;
            }
            updateListWidgets();
            updateFileField();
        } else if (event.getSource() == _files)
        {
            String item = ((String) event.getItem()).trim();
            _file = getCurrentDirectory() + event.getItem();
            updateFileField();
        }

    }

    private boolean checkDirectory(String directory)
    {
        File file = new File(directory);
        return (file.exists() && file.isDirectory() && file.canRead());
    }

    @Override
    public void actionPerformed(ActionEvent e)
    {
        if (e.getSource() == _okButton)
        {
            saveResult();
            close();
        } else
        {
            close();
        }
    }

    private static InputChar __returnChar = new InputChar('\n');

    @Override
    protected void onChar(InputChar inp)
    {
        if (inp.equals(__returnChar))
        {
            if (_filterField.hasFocus())
            {
                setFilterString(_filterField.getText());
                updateListWidgets();
            } else
            {
                saveResult();
                close();
            }
        }
    }

}

class FileDialogFileFilter implements FileFilter
{

    FileFilter _filter = null;

    public FileDialogFileFilter(FileFilter filter)
    {
        _filter = filter;
    }

    @Override
    public boolean accept(File file)
    {
        return (file.isDirectory()) || (_filter.accept(file));
    }

}

class FilterTextField extends TextField
{

    @SuppressWarnings("FieldNameHidesFieldInSuperclass")
    FileDialog _parent = null;

    public FilterTextField(FileDialog parent)
    {
        _parent = parent;
    }

    @Override
    public void unfocus()
    {
        setText(_parent.getFilterString());
        super.unfocus();
    }
}
