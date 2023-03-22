# Code Style
## General
When implementing new code, or making changes to existing code, create a branch with the following name: `YOURUSERNAME_WHAT_YOU_ARE_DOING`.  This helps to prevent pollution on the master branch and everyone can see what has been performed by whom via the branch names.

Whenever you wish to have your code pushed to the master branch please create a pull request for the development team to review and merge.  Also make sure to leave a comment on what your code is going to be doing or changing to PhantomBot.  Your commit/pull-request should attempt to follow this format:

```
Brief description of the intended change

**filename.java**
- Change one.
- Change two.

**otherfilename.js**
- Change one.
- Change two.
```

This helps with performing code reviews and also helps folks that may be looking at changes and wanting to have a high level description of the code changes.

## Naming Conventions
The below is written about functions, but basically also applies to classes.

1. Self-explanatory names: a function `getName()` will tell the developer what it returns as well as `setAddress()`, `isMale()`, etc.

2. Short: A function name must be as short as possible so that it's simple to type as well as easy to remember. A function `getNumberOfPagesInTheBook()` is not good, something like `getBookPageCount()` is better.

3. Use of prefixes: Always use prefixes in the functions such as `getName()`, `setName()`, `hasHair()`, `isBlond()`, etc.

4. Names should be verbs if the function changes the state of the program, and nouns if they're used to return a certain value

5. Variable names should follow similar rules.  Ensure that the variable name means something, is descriptive, but not too long.

## Chat Limits
Keep in mind that Twitch does enforce a rule regarding how many lines may be sent to chat within a period of time and that includes whispers.  In fact, many bots have been banned from whispering.  Twitch doesn't only look for how many whispers occur, but has algorithms to look for other factors and bots have been banned because of it.  Keep this in mind when deciding how much output you are adding to a chat and/or whispers.  While PhantomBot does perform a self-enforced rate limit on what can be sent to Twitch chat, that can be overridden. It is also possible to fill up the outbound queue with too many deliverable messages which can cause PhantomBot to slow down or to respond to other commands much more slowly.

## API Development
When developing an interface to a third party API, please ensure that you are thinking about any rate limits that the service may have. Also be sure to review any and all documentation that they may have in reference to terms of service to ensure that your usage of an API falls within their accepted guidelines and practices.  The goal is to not have an API account banned or suspended due to not understanding the terms of service of an API.  Informing a service that you were not aware of their rules will typically not go very far.

# Java
## Files and Folders
### ./source
All Java source code is under this directory.  The following is a brief description of each area:

- **com**: Contributed items from gmt2001, IllusionaryOne and ScaniaTV.  Items in here include: DataStore, Logger, various APIs.
- **de**: Contributed items from SimeonF
- **tv/phantombot**: Contains PhantomBot.java, the class with main()
- **tv/phantombot/cache**: Data that is cached from API calls
- **tv/phantombot/console**: Listener for console events
- **tv/phantombot/event**: Event handling that uses the Guava Bus
- **tv/phantombot/httpserver**: Web server code is contained here
- **tv/phantombot/panel**: Control Panel WebSocket server
- **tv/phantombot/script**: Handles the Rhino to Java interface
- **tv/phantombot/twitchwsirc**: Twitch WebSocket handling
- **tv/phantombot/ytplayer**: YouTube Player WebSocket server
- **org/json**: JSON parser.

## Code specific rules
- 4 space indents.  Make sure your code lines up with the current code or it will be rejected.  Do not use tabs.
- If creating new classes, ensure that they are sensible.
- Camel case for variable and method names. (thisIsCamelCase)
- Camel case, but capitalized, class names. (ThisIsCamelCase)
- Use [JavaDoc](http://www.oracle.com/technetwork/articles/java/index-137868.html) comments for classes and methods.  Review how these are currently used in PhantomBot.
- Use descriptive function/variable/class names.
- Create methods for repeating code.
- Always keep performance in mind.
- If it is easier, you may process Java files through [astyle](http://astyle.sourceforge.net/) with the following options: ```--style=java --indent-spaces=4```

## Block statements
See the instructions for block statements in the JavaScript section.

# JavaScript

## Files and folders
### ./javascript-source
This is the source in which to develop any of the javascript modules.
The scriptset is split up into the following top-level directories.

- **core**: Core modules that are _always_ enabled and should not have any dependencies outside the core folder. Other modules may depend on any of the modules in this folder, regardless.
- **lang**: The Language files. Each language gets its own directory named by language. inside this language directory should be at least a main.js. Other files are loaded recursively.
- **commands**: Modules that generally do not act as API for other modules, like games or the random command.
- **games**: Modules that generally provide chat games (like Tamagotchis or !kill).
- **handlers**: Modules that handle automation like follow alerts or point payouts on hosts
- **systems**: Modules that may act like API for other modules, but are not necessary for the bot to work proper.

## Module File Setup
In ./development-resources there's a template (module-template.js) which you can copy to instantly get started with the code style!  This file should give you enough insight on the general layout of the modules code.

## Code specific rules
- 4 space indents. Make sure your code lines up with the current code or it will be rejected. Do not use tabs.
- Encapsulate all code in `(function(){ /* Your code */ })();` and export globally needed code to $ by function assignment.
- Do not assign variables and functions to the `$` global. Do not use the $ api if your variable is local.
- If a function or variable needs to be global, assign it at the end of your module like `$.functionName = functionName;`.
- Camel case for variable, function, and method names. (thisIsCamelCase)
- Word capitalization on class names. (ThisIsWordCapitalization)
- Use [JSDoc](http://usejsdoc.org/) comments for classes and functions.
- Use `@commandpath` tags to define each possible command variation. (check below on how exactly)  
- Use comments for code that is not easily understandable. The same with functions; use `@param {string}, {number} or {boolean} something` so we know what that function needs.
- Try and use some space while writing code, no need to be parsimonious of course.
- Use descriptive function/variable/class names.
- Create functions for repeating code.
- Always keep performance in mind, use as much native JavaScript as possible and keep your variable use at a minimum.
- Use `'` and not `"` for string containers.
- If it is easier, you may process your JavaScript through [JS-Beautify](https://www.npmjs.com/package/js-beautify). The default options meet our standard.

## Block statements
- Please don't leave spaces inside at the start and end of your if/while/for statements.
- Hugging braces.

Examples:     

Proper if statement:

```
if (something) {
```    

Improper if statements:

```
if(something) {
if ( something ) {
if (something)
{
```

Proper for loop:    

```
for (i = 0; i < 10; i++) {
```

Improper for loops:    

```
for ( i = 0; i < 10; i++ ) {
for(i=0;i<10;i++) {
for (i = 0; i < 10; i++)
{
```

## @commandpath tags
The `@commandpath` tag is used for describing all possible paths per command.  
These are used to allow `parse_commandpath.pl` to be able to parse the source and extract information on all commands.

Example:

```
/**
 * @commandpath jumptosong [position in playlist] - Jump to a song in the current playlist by position in playlist.
 */
if (command.equalsIgnoreCase('jumptosong')) {
  // Code
}
```

or

```
/** @commandpath jumptosong [position in playlist] - Jump to a song in the current playlist by position in playlist. */
if (command.equalsIgnoreCase('jumptosong')) {
  // Code
}
```
*Note: `parse_commandpath.pl` is depending on the conventions noted above to be followed correctly.*  
*Note: New-lines in command descriptions are not supported in `parse_commandpath.pl`. Only the text on the same line as `@commandpath` is parsed.*
