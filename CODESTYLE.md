#Code Style
#General
When implementing new code or making changes to the current create a branch with the following name: `YOURUSERNAME_WHAT_YOU_ARE_DOING`.
That way there'll be no pollution on the master branch and everyone can see what is being done already and by who.  
Whenever you wish to have your code pushed to the master branch just merge it (do notify others, courtesy and such)
or create a pull request for others to merge, if you don't feel comfortable with resolving conflicts. Also make sure to leave a comment on what your code
is going to be doing or changing to PhantomBot.

##Naming Conventions
The below is written about functions, but basically also aplies to classes.

1. Self-explanatory names: a function `getName()` will tell the developer what it returns as well as `setAddress()`, `isMale()`, etc.

2. Short: A function name must be as short as possible so that it's simple to type as well as easy to remember. A function `getNumberOfPagesInTheBook()` is not good, something like `getBookPageCount()` is better.

3. Use of prefixes: Always use prefixes in the functions such as `getName()`, `setName()`, `hasHair()`, `isBlond()`, etc.

4. Names should be verbs if the function changes the state of the program, and nouns if they're used to return a certain value

#JavaScript

##Files and folders
###./javascript-source
This is the source in wich to develop any of the javascript modules.
The scriptset is split up into the following top-level directories.

- **Core**: Core modules that are ALWAYS enabled and should not have any dependencies outside the core folder. Other modules may depend on any of the modules in this folder, regardless.
- **lang**: The Language files. Each language gets its own directory named by language. inside this language directory should be at least a main.js. Other files are loaded recursively.
- **Commands**: Modules that generally do not act as API for other modules, like games or the random command.
- **Games**: Modules that generally provide chat games (like Tamagotchis or !kill).
- **handlers**: Modules that handle automation like follow alerts or point payouts on hosts
- **systems**: Modules that may act like API for other modules, but are not necessary for the bot to work proper.

##Module File Setup
In ./development-resources there's a template (module-template.js) wich you can copy to instantly get started with the new code style!  
This file should give you enough insight on the general layout of the modules code.

##Code specific rules
- 4 space indents. Make sure you code lines up with the current one or it will be rejected.
- Encapsulate all code in `(function(){ /* Your code */ })();` and export globally needed code to $ by function assignment.
- Do not assign variables and functions to the `$` global. Do not use the $ api if you variable is local.
- If a function or variable needs to be global, assign it at the end of your module like `$.functionName = functionName;`.
- Camel case for variable and function names. (thisIsCamelCase)
- Word capitalisation on class names. (ThisIsWordCapitalisation)
- Use [JSDoc](http://usejsdoc.org/) comments for classes and functions.
- Use `@commandpath` tags to define each possible command variation. (check below on how exactly)  
- Use comments for code that is not apparent to understand, same with functions use `@param {string}, {number} or {boolean} something` so we know what that function needs.
- Try and use some space while writing code, no need to be parsimonious, the script is going to be minified anyway!
- Use descriptive function/variable/class names.
- Create functions for repeating code.
- Always keep performance in mind, use as much native javascript as possible and keep your variable use at a minimum.
- Use `'` and not `"` as most as you can, please. 

##If statements 
- Please don't leave spaces inside at the start and end of your if statements.
- Examples: 
        Proper if statement: `if (something) {`
        Bad if statements: `if(something){`, `if ( something ) {` and `if( something ){` etc.

##@commandpath tags
The `@commandpath` tag is used for describing all possible paths per command.  
These are used to have `command-list-generator.php` in ./dev be able to parse the source and extract information on all commands.

If you, when registering your command, pass a permission group id to the function, `command-list-generator.php` will pick up on this and add the corresponding group id to each found command.  

Example:
```javascript
/**
 * @commandpath jumptosong [position in playlist] - Jump to a song in the current playlist by position in playlist.
 */
if (command.equalsIgnoreCase('jumptosong')) {
  // Code
}
```
or
```javascript
   /** @commandpath jumptosong [position in playlist] - Jump to a song in the current playlist by position in playlist. */
   if (command.equalsIgnoreCase('jumptosong')) {
     // Code
   }
```

Generates:

- command: jumptosong
- arguments: [position in playlist]
- description: Jump to a song in the current playlist by position in playlist.
- permGroup: 1
- script: ytPlayer.js
- lineNumber: 484

*Note: `command-list-generator.php` is depending on the conventions noted above to be followed correctly.*  
*Note: New-lines in command descriptions are not supported in `command-list-generator.php`. Only the text on the same line as `@commandpath` is parsed.*
