#Code Style#
##Files and folders##
###./source###
This is the source in wich to develop.
The scriptset is split up into the following top-level directories.

- **Core**: Core modules that are ALWAYS enabled and should not have any dependencies outside the core folder. Other modules may depend on any of the modules in this folder, regardless.
- **lang**: The Language files. Each language gets its own directory named by language. inside this language directory should be at least a main.js. Other files are loaded recursively.
- **Commands**: Modules that generally do not act as API for other modules, like games or the random command.
- **Games**: Modules that generally provide chat games (like Tamagotchis or !kill).
- **handlers**: Modules that handle automation like follow alerts or point payouts on hosts
- **systems**: Modules that may act like API for other modules, but are not necessary for the bot to work proper.

###./scripts###
This directory is a mirror of ./source, but contains the minified production scripts.
To have the source automatically compiled in JetBrains IntelliJ or PhpStorm, import `watchers.xml` from ./dev into your `file watchers`.
Use these in your bot so the bot doesn't have to cope with prettyprint code and comments.

###./Dev###
This folder is kind of like a dump for files that might come in handy for the scriptset, or for anything else for that matter.

##Module File Setup##
In ./dev there's a template (module-template.js) wich you can copy to instantly get started with the new code style!  
This file should give you enough insight on the general layout of the modules code.

##Code specific rules##

- 2 space indents.
- 4 space indents on line continuation (spliting a single line of code into two).
- Encapsulate all code in `(function(){ /* Your code */ })();` and export globally needed code to $ by function assignment.
- Camel case for variable and function names. (thisIsCamelCase)
- Word capitalisation on class names. (ThisIsWordCapitalisation)
- Use [JSDoc](http://usejsdoc.org/) comments for classes and functions.
- Use `@commandpath` tags to define each possible command variation. (check below on how exactly)  
- Use comments for code that is not apparent to understand
- Try and use some space while writing code, no need to be parsimonious, the script is going to be minified anyway!
- Use descriptive function/variable/class names.
- Create functions for repeating code.
- Always keep performance in mind, use as much native javascript as possible and keep your variable use at a minimum.

##@commandpath tags##
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