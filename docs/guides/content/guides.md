# PhantomBot Guides

These guides are written by the community to assist in setting up and using PhantomBot

Sometimes they may be out of date. You can contribute new and updated guides by cloning our GitHub repo, adding or modifying the appropriate files, and then submitting a pull request

The guide files can be found in our repo, [PhantomBot - GitHub](https://github.com/phantombot/PhantomBot), under _docs/guides/content_

If you are adding a new file, remember to add it to the _toc.json_ file in the same folder

Guide files must be written in Markdown and have the extension _.md_

If you are adding a new folder, remember to create a _toc.json_, and add the new subfolder to the _toc.json_ of the parent folder

The format for _toc.json_ is
```js
{
    "subfolders": {
        "folderName": "Folder Title"
    },
    "pages": {
        "fileName": "Page Title"
    }
}
```
**NOTE:** The _pages_ list in the top-level _toc.json_ must be in reverse order, but all other _toc.json_ should have them in regular order
