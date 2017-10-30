# Creating and Using Custom Panels
## File Structure
The custom folder should never contain anything more than this readme and directories. Inside each directory, should be a javascript file with the same name, plus any additional files you may need.
```
Custom
    aCustomPanel
        aCustomPanel.js
        aCustomPanel.html
        aCustomPanel.png
        aNotherPanelImage.png
    audioExtensionPanel
    	audioExtensionPanel.js
```
## The Javascript Code
The Javascript code must follow the same structure and functionality as the core Javascript files found within the web panel. An anonymous function with core functions that allow the bot to interact with the panel, the notible ones being `onMessage` and `doQuery`.

If you intend on changing or altering any previously loaded web panels, it is recommended that you create an `init` function and call it on the first `onMessage` call as this will fire once everything else has been loaded.

## Resource hooks
In order to create new functionality and panels within the web panel without editing the core panel code, there are 3 functions which are now used.
```
addPanelTab( uniqueId, tabName, htmlFileLocation, position );
addDoQuery( uniqueId, doQuery, freqencyInSeconds );
addOnMessage( uniqueId, onMessage );
```

### addPanelTab
... creates a new panel and tab within the DOM of the panel.
`uniqueId` is used to link the tab and functionality to the specific panel.
`tabName` is what will be displayed on the tab.
`htmlFileLocation` is the location of the html file to be loaded into the panel (i.e /panel/custom/aCustomPanel/aCustomPanel.html).
`position` is the position relative to the other tabs within the panel (see below for default PhantomBot panel positions).

### addDoQuery
... adds the doQuery function to an array of other functions used to make calls to PhantomBot.
`uniqueId` used to link the doQuery call to the appropriate panel.
`doQuery` the name of the doQuery function, usually called `doQuery`.
`frequencyInSeconds` the frequency in which the function is called. Usually set to 30 seconds. Setting this to 0 or ommiting this parameter will set the function to only be called once when the panel is viewed.

### addOnMessage
... adds the onMessage function to an array of other functions used to receive calls from PhantomBot.
`uniqueId` used to link the receipt of calls to the appropriate panel.
`onMessage` the name of the onMessage function, usually called `onMessage`.

## Extending Core Panels
Extending and altering the functionality of core panels is made to be really easy. Using the addOnMessage and addDoQuery you can use the uniqueIds used by the core panels to add in additional `doQuery` and `onMessage` calls. To manipulate the DOM and add additional sections to the panel, it is advised that an init function is made and called in the onMessage function as demonstrated below.
```
(function() {

    var loaded = false;

	function init() {

		var accordianHeader = $( '<h3>' ).text( 'Hidden Commands' );
		var accordianBody = $( '<div>' ).append( $('<div>').attr( 'id', 'hiddenCommands' ).css( {'max-height' : '400px'} ) );

		$( '#customCommandsAccordion' ).append( accordianHeader ).append( accordianBody ).accordion('destroy').accordion( { clearStyle: true, heightStyle: "panel", icons: null } );

	}

	function onMessage(message) {

        if ( !loaded ) {
            init();
            loaded = true;
        }
		...
    }
    ...

});
 ```

## Core uniqueIds and positions


|Panel Name|Unique ID|Position|
|----------|---------|--------|
|Commands|commands|50|
|Moderation|moderation|100|
|Time|time|150|
|Points|points|200|
|Permissions|viewers|250|
|Ranks|ranks|300|
|Alerts|greetings|350|
|Donations|donations|400|
|Notices|notices|450|
|Quotes|quotes|500|
|Keywords|keywords|550|
|Hosts & Raids|hostraid|600|
|Giveaways|gambling|650|
|Games|games|700|
|Queue|queue|750|
|Twitter|twitter|800|
|Discord|discord|850|
