** Using the stories that come with PhantomBot:
 - All stories that are bundled with the bot are in the namespace adventuresystem.stories.*
 - If you do not want to use these stories, set the following in your custom language file:
     "adventuresystem.stories.default": "false",
 
** Rules on writing your own adventure story:
 - Stories are automatically loaded from the language file by their sequence number (adventuresystem.stories.custom.[This number]).
 - It is recommended to use a custom language file for your own stories.
 - Keep the format of your story as shown above, adding the '.custom' portion of the identifier.
 - There can be an unlimited number of stories, IF you keep their subsequence numbers 1, 2, 3, 4, 5...
 - A story must have a title.
 - A story can have an unlimited number of chapters, IF you keep their subsequence numbers 1, 2, 3, 4, 5...
 - Stories are picked at random.
 - Please make sure that your story number also follows along. This means the numbering starts from 1 and keeps increasing. Same with the chapters.
 
** Game specific story how-to. You also need to make sure that you at least have ONE story that doesn't require a specific game.
 - Add "adventuresystem.stories.NUMBER.game": "GAME NAME IN LOWER CASE",
 
** Winning odds
 - Add "adventuresystem.stories.custom.1.odds": 85,
 
** A basic template for your first custom story
 
    "adventuresystem.stories.custom.1.title": "",
    "adventuresystem.stories.custom.1.odds": 50,
    "adventuresystem.stories.custom.1.chapter.1": "",
    "adventuresystem.stories.custom.1.chapter.2": "",
    "adventuresystem.stories.custom.1.chapter.3": "",

** Full example
    "adventuresystem.stories.custom.1.title": "Talk Shows",
    "adventuresystem.stories.custom.1.game": "programming",
    "adventuresystem.stories.custom.1.odds": 85,
    "adventuresystem.stories.custom.1.chapter.1": "Random story - Part 1...",
    "adventuresystem.stories.custom.1.chapter.2": "Random story - Part 2...",
    "adventuresystem.stories.custom.1.chapter.2": "Random story - Part 3...",
