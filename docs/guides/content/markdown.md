# Markdown for Guides

The following Markdown is supported for PhantomBot Guides

&nbsp;

<!-- toc -->

<!-- tocstop -->

&nbsp;

#### Italic
**Syntax:**
```markdown
*Italic*
```
or
```markdown
_Italic_
```

**Output:** _Italic_

&nbsp;

#### Bold
**Syntax:** 
```markdown
**Bold**
```
or
```markdown
__Bold__
```

**Output:** **Bold**

&nbsp;

#### Bold Italic
**Syntax:**
```markdown
***Bold Italic***
```
or
```markdown
___Bold Italic___
```

**Output:** ***Bold Italic***

&nbsp;

#### Strikethrough
**Syntax:**
```markdown
~~Strikethrough~~
```

**Output:** ~~Strikethrough~~

&nbsp;

#### Link
**Syntax:** `http://google.com`

**Output:** http://google.com

&nbsp;

#### Link with Link Text
**Syntax:**
```markdown
[Google](http://google.com)
```

**Output:** [Google](http://google.com)

&nbsp;

#### Image
**Syntax:**
```markdown
![PB Logo](https://phantombot.github.io/PhantomBot/common/images/logo.png)
```

**Output:** ![PB Logo](https://phantombot.github.io/PhantomBot/common/images/logo.png)

&nbsp;

#### Unordered List
**Syntax:**
```markdown
* List
* List
* List
```
or
```markdown
- List
- List
- List
```

**Output:** 
* List
* List
* List

&nbsp;

#### Ordered List
**Syntax:**
```markdown
1. List
2. List
3. List
```
or
```markdown
1) List
2) List
3) List
```

**Output:**
1. List
2. List
3. List

&nbsp;

#### Blockquote
**Syntax:**
```markdown
> Blockquote
```

**Output:**
> Blockquote

&nbsp;

#### Horizontal Rule
**Syntax:**
```markdown
---
```
or
```markdown
***
```

**Output:**

---

&nbsp;

#### Inline Code
**Syntax:**
```markdown
This is `inline code`.
```

**Output:** This is `inline code`.

&nbsp;

#### Code Block with Automatic Syntax Highlighting
**Syntax:**
```markdown
    ```
    This
    is
    code
    ```
```
or
```markdown
    This
    is
    code
```
_(4 spaces at beginning of each line)_

**Output:**
```
This
is
code
```

&nbsp;

#### Code Block with Defined Syntax Highlighting
**Syntax:**
```markdown
    ```javascript
    function(param) {
        param = param + 1;
        return param;
    }
    ```
```

**Output:**
```javascript
function(param) {
    param = param + 1;
    return param;
}
```

**Allowed Syntax Languages:**
- `apache` - Apache HTTPd Configuration
- `bash` - Bash Script
- `css` - Cascading Style Sheet
- `ini` - INI Configuration File
- `java` - Java
- `javascript` - JavaScript
- `json` - JSON Object
- `markdown` - Markdown
- `nginx` - nginx Configuration
- `text` - Plaintext (No Highlighting)
- `shell` - Shell Session
- `sql` - Structured Query Language
- `yaml` - YAML

&nbsp;

#### Footnote
**Syntax:**
```markdown
This sentence has a footnote[^1]

[^1]: This is the footnote text
```
or
```markdown
This sentence has a footnote[^footnote-tag]

[^footnote-tag]: This is the footnote text
```

**Output:**
This sentence has a footnote[^1]

[^1]: This is the footnote text

_Also look at the bottom of this page for the footnote_

&nbsp;

#### Table
**Syntax:**
```markdown
Header 1 | Header 2 | Header3
---------|----------|--------
Cell 1,1 | Cell 1,2 | Cell 1,3
Cell 2,1 | Cell 2,2 | Cell 2,3
Cell 3,1 | Cell 3,2 | Cell 3,3
```

**Output:**
Header 1 | Header 2 | Header3
---------|----------|--------
Cell 1,1 | Cell 1,2 | Cell 1,3
Cell 2,1 | Cell 2,2 | Cell 2,3
Cell 3,1 | Cell 3,2 | Cell 3,3

**NOTE:** Multi-line is not allowed within cells

&nbsp;

#### Blank Line
**Syntax:**
```markdown
&nbsp;
```

#### Table of Contents
**Syntax:**
```markdown
<!-- toc -->
```

**Output:**
_See the top of this guide for an example output_

**NOTE:** There must be a blank line under the tag

**NOTE:** Any headers above the tag will **not** be included

&nbsp;

#### YouTube Embed
**Syntax:**
```markdown
https://www.youtube.com/watch?v=dQw4w9WgXcQ
```

**Output:**

https://www.youtube.com/watch?v=dQw4w9WgXcQ

&nbsp;

#### Heading
**Syntax:**
```markdown
# Heading 1
## Heading 2
### Heading 3
#### Heading 4
##### Heading 5
###### Heading 6
```

**Output:**
<!-- notoc # --> Heading 1
<!-- notoc ## --> Heading 2
<!-- notoc ### --> Heading 3
<!-- notoc #### --> Heading 4
<!-- notoc ##### --> Heading 5
<!-- notoc ###### --> Heading 6