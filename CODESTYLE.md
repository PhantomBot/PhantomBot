#Code Style
#General
When implementing new code or making changes to the current create a branch with the following name: `YOURUSERNAME_WHAT_YOU_ARE_DOING`.
That way there'll be no pollution on the master branch and everyone can see what is being done already and by who.  

Whenever you wish to have your code pushed to the master branch please create a pull request for the development team to review and merge.
Also make sure to leave a comment on what your code is going to be doing or changing to PhantomBot.

##Naming Conventions
The below is written about functions, but basically also aplies to classes.

1. Self-explanatory names: a function `getName()` will tell the developer what it returns as well as `setAddress()`, `isMale()`, etc.

2. Short: A function name must be as short as possible so that it's simple to type as well as easy to remember. A function `getNumberOfPagesInTheBook()` is not good, something like `getBookPageCount()` is better.

3. Use of prefixes: Always use prefixes in the functions such as `getName()`, `setName()`, `hasHair()`, `isBlond()`, etc.

4. Names should be verbs if the function changes the state of the program, and nouns if they're used to return a certain value

##Chat Limits
Keep in mind that Twitch does enforce a rule regarding how many lines may be sent to chat within a period of time and that includes whispers.
In fact, that many bots have been banned from whispering.  Twitch doesn't only look for how many whispers occur, but has algorithms to look
for other factors and bots have been banned because of it.  Keep this in mind when deciding how much output you are adding to a chat
and/or whispers.  While PhantomBot does perform a self-enforced rate limit on what can be sent to Twitch chat, that can be overridden.
It is also possible to fill up the outbound queue with too many deliverable messages which can cause PhantomBot to slow down or to respond
to other commands much more slowly.

##API Development
When developing an interface to a third party API, please ensure that you are thinking about any rate limits that the service may have.
Also be sure to review any and all documentation that they may have in reference to terms of service to ensure that your usage of an API
falls within their accepted guidelines and practices.

#JavaScript

##Files and folders
###./javascript-source
This is the source in wich to develop any of the javascript modules.
The scriptset is split up into the following top-level directories.

- **core**: Core modules that are ALWAYS enabled and should not have any dependencies outside the core folder. Other modules may depend on any of the modules in this folder, regardless.
- **lang**: The Language files. Each language gets its own directory named by language. inside this language directory should be at least a main.js. Other files are loaded recursively.
- **commands**: Modules that generally do not act as API for other modules, like games or the random command.
- **games**: Modules that generally provide chat games (like Tamagotchis or !kill).
- **handlers**: Modules that handle automation like follow alerts or point payouts on hosts
- **systems**: Modules that may act like API for other modules, but are not necessary for the bot to work proper.

##Module File Setup
In ./development-resources there's a template (module-template.js) wich you can copy to instantly get started with the new code style!  
This file should give you enough insight on the general layout of the modules code.

##Code specific rules
- 4 space indents. Make sure you code lines up with the current one or it will be rejected. Do not use tabs.
- Encapsulate all code in `(function(){ /* Your code */ })();` and export globally needed code to $ by function assignment.
- Do not assign variables and functions to the `$` global. Do not use the $ api if you variable is local.
- If a function or variable needs to be global, assign it at the end of your module like `$.functionName = functionName;`.
- Camel case for variable, function, and method names. (thisIsCamelCase)
- Word capitalisation on class names. (ThisIsWordCapitalisation)
- Use [JSDoc](http://usejsdoc.org/) comments for classes and functions.
- Use `@commandpath` tags to define each possible command variation. (check below on how exactly)  
- Use comments for code that is not easily understandable. The same with functions; use `@param {string}, {number} or {boolean} something` so we know what that function needs.
- Try and use some space while writing code, no need to be parsimonious of course.
- Use descriptive function/variable/class names.
- Create functions for repeating code.
- Always keep performance in mind, use as much native JavaScript as possible and keep your variable use at a minimum.
- Use `'` and not `"` as most as you can, please. 
- If it is easier, you may process your JavaScript through [JS-Beautify](https://www.npmjs.com/package/js-beautify). The default options meet our standard.

##If statements 
- Please don't leave spaces inside at the start and end of your if statements.
- Examples: 
        Proper if statement: `if (something) {`
        Bad if statements: `if(something){`, `if ( something ) {` and `if( something ){` etc.

##@commandpath tags
The `@commandpath` tag is used for describing all possible paths per command.  
These are used to allow `parse_commandpath.pl` to be able to parse the source and extract information on all commands.

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
*Note: `parse_commandpath.pl` is depending on the conventions noted above to be followed correctly.*  
*Note: New-lines in command descriptions are not supported in `parse_commandpath.pl`. Only the text on the same line as `@commandpath` is parsed.*
