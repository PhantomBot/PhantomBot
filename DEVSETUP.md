#Development Setup Guide
This guide is for the people that would like to contribute to PhantomBot and do it well. <3

Please have a read on [CODESTYLE.md](https://github.com/PhantomBot/PhantomBot/blob/master/CODESTYLE.md), any code that does not apply to these rules will not get merged.

##General (All other IDE's)
This section is for all IDE's not mentioned in this guide.  
It's very global, so you might need to take some extra steps to get it to work for you.

1. Fork the [PhantomBot repository](https://github.com/PhantomBot/PhantomBot).
2. Check out your for and open it in your favorite IDE.
2. Set the project Java SDK to [1.8](http://www.oracle.com/technetwork/java/javase/overview/index.html).
3. Import `build.xml` into your [ANT](http://ant.apache.org/) task manager.
4. Setup your favorite JavaScript minifier to mangle & minify all sources from `./javascript-sources/` and have it put the output in `./resources/scripts/`.  
  *The most commonly used minifier is [UglifyJS](https://www.npmjs.com/package/uglify-js) with [NodeJS](https://nodejs.org).*

DONE! Happy coding <3

##JetBrains IntelliJ
This section also applies to JetBrains PHPStorm, wich is great for JavaScript, but lacks Java support.  
You can get JetBrains IntelliJ [here](https://www.jetbrains.com/idea/).

1. Fork the [PhantomBot repository](https://github.com/PhantomBot/PhantomBot).
2. Open up IntelliJ, so you have the start screen.  
  From there you can check out (Check out from Version Control) your fork and open it up.
3. Open up a file from `./source/` where IntelliJ will ask you for a project SDK. Use SDK [1.8](http://www.oracle.com/technetwork/java/javase/overview/index.html).
4. Next up mark the directories `./source` and `./javascript-source` as "Sources Root".  
  *"Mark Directory As" in the context menu.*
5. Install the "File Watchers" plugin if you haven't already.
6. Import `./development-resources/watchers.xml` into your File Watchers.  
  *The File Watchers are located in "Settings" under "Tools"*
7. Import `build.xml` into the ANT task manager.  
  *IntelliJ might have already asked this of you and you were right in accepting it*

DONE! Happy coding <3

##Netbeans
You can get Netbeans [here](https://netbeans.org/downloads/).

1. Open up NetBeans. 
2. Clone the repository using Team -> Git -> Clone.
3. Enter the repository url and your GitHub password or select your ssh key.
4. Choose a destination folder. Next page!
5. Select the branches you want. Click Next!
6. Check if everything is okay. Then click Finish!
7. When the clone process is finished click Create Project. Select 
  Java -> Java Free-Form Project and click Next. 
8. Click on the first *"Browse"* button. Select the directory you cloned to and 
  click *"Open"*. Then enter a project name. Click 2 times next. 
9. Press the first *"Add Folder"* button and select the *"javascript-source"* folder.
  Set the *"Source Level"* to *"JDK 1.8"* and the *"Encoding"* to *"UTF-8"*. Next page! 
10. Click on *"Add JAR/Folder"*, go the `./libraries` folder and select every jar file (Ctrl + A). 
  Press the "Finish" button and we're finished!

DONE! Happy coding <3

##Eclipse
You can get Eclipse [here](https://www.eclipse.org/downloads/).

Yet to be written.