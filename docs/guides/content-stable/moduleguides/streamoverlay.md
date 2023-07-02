# Stream Overlay

The stream overlay allows you to integrate PhantomBot into your stream using a browser source. It can play audio or video files, show images or decorate your stream with emotes.

### User Setup

The stream overlay is ready to use and is configured through the URL.

1. Head to the setup panel and open the 'Overlay' page from the menu
2. Configure the features you want to have enabled and their parameters
3. Copy the generated URL on the bottom of the page and paste it into your _Browser source_

## Developer

The stream overlay can be used through the global variable `$.alertspollssocket`. It offers the following methods:

| Method                  | Usage                                                                                                        | Description                                                                                                                                                                                                                                                                                                                                                    |
|-------------------------|--------------------------------------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `triggerAudioPanel`     | `$.alertspollssocket.triggerAudioPanel(audioHook, [ignoreIsPlaying=false])`                                  | Plays an audio file with the given name in `audioHook`. The parameter mustn't have a file extension. If `ignoreIsPlaying` is set to `true` it will play the sound immediately. Otherwise it'll be queued.                                                                                                                                                      |
| `triggerAudioPanel`     | `$.alertspollssocket.triggerAudioPanel(audioHook, volume, [ignoreIsPlaying=false])`                          | It works the same as above but has an addition parameter `volume` that takes a float value between 0.0 and 1.0 setting the volume of the soundfile the soundfile should be played at                                                                                                                                                                           |
| `stopMedia`             | `$.alertspollssocket.stopMedia([type="all"])`                                                                | Aborts playing any type of media immediately. Supported values for `type` are: `all, video, audio`. If none is passed, it defaults to `all`.                                                                                                                                                                                                                   |
| `alertImage`            | `$.alertspollssocket.alertImage(imageInfo, [ignoreIsPlaying=false])`                                         | Displays an image, gif or video for 3 seconds. `imageInfo` must be a filename with file extension. If `gif-alerts` directory also contains an audio file with the same filename, it'll be played in addition                                                                                                                                                   |
| `playVideo`             | `$.alertspollssocket.playVideo(filename, [durationMs=-1], [fullscreen=false])`                               | Plays a video file from the `clips` directory. `filename` must be a filename with file extension. If `durationMs` is greater than 0 the video will be cut off after the given amount. `fullscreen` stretches the video to fill the complete screen.                                                                                                            |
| `triggerEmotes`         | `$.alertspollssocket.triggerEmotes(emoteString)`                                                             | Takes string in format of Twitch's emote format e.g. `425618:0-2,4-6,8-10/145315:12-24` and displays each emote with the default animation                                                                                                                                                                                                                     |
| `triggerEmotes`         | `$.alertspollssocket.triggerEmotes(emotes[], provider)`                                                      | `emotes` is an array of strings. Each entry will be displayed using the given `provider`.                                                                                                                                                                                                                                                                      |
| `triggerEmote`          | `$.alertspollssocket.triggerEmote(emoteId, [amount=1], [provider="twitch"]`                                  | Displays the emote with the given `emoteId` from the given `provider` in the in `amount` specified count using the default animation.                                                                                                                                                                                                                          |
| `triggerEmoteAnimation` | `$.alertspollssocket.triggerEmoteAnimation(emoteId, amount, provider, animationName, duration, ignoreSleep)` | Displays emotes with the given `emoteId` in the in `amount` specified count using `animationName` (either `flyUp` or any name from [animate.style](https://animate.style/). `Duration` defines how long the animation takes place in ms. `ignoreSleep` disables the delay and let all emotes appear immediately instead making small breaks between each emote |
| `sendMacro`             | `$.alertspollssocket.sendMacro(macroJson)`                                                                   | Sends a macro to run on the overlay. See chapter _Macros_ for more details about the format.                                                                                                                                                                                                                                                                   |

### Emote Providers

The following emote providers are supported:

| Pretty Name  | Provider Key | Notes                                                                                                                                                                                                                                                                                              |
|--------------|--------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Local        | `local`      | Uses the local emotes of PhantomBot stored in `config/emotes` directory                                                                                                                                                                                                                            |
| Twitch       | `twitch`     | Twitch uses numeric ids such as `425618` to identify emote images. These ids can be found in a message's tags with the key `emotes` in a format. See Twitch's Developer Documentation of [PRIVMSG TAGS](https://dev.twitch.tv/docs/irc/tags#privmsg-tags) for the entry _emotes_ for more details. |
| MaxCDN Emoji | `maxcdn`     | Provides Twemoji-Emojis and needs them in their codepoint format without a file extension (e.g. `2764` for a red heart and `2764-fe0f-200d-1f525` for red heart in flames                                                                                                                          |
| FrankerFaceZ | `ffz`        | Uses emotes provided by FrankerFacez. Needs FrankerFaceZ' ids to work such as `210748`. PhantomBot provides an emote cache to resolve names to ids. Check `emotesFfzHandler.js` how to use it.                                                                                                     |                                                                                                                                | 
| BetterTTV    | `bttv`       | Uses emotes provided by BetterTTV. Needs BetterTTV' ids to work such as `56e9f494fff3cc5c35e5287e`. PhantomBot provides an emote cache to resolve names to ids. Check `emotesBttvHandler.js` how to use it.                                                                                        | 

### Element Specification

Each element has a set of parameters to configure how the element will be presented.

#### Video Clip

| Key          | Data Type | Default Value                       | Description                                                                                                |
|--------------|-----------|-------------------------------------|------------------------------------------------------------------------------------------------------------|
| `filename`   | string    | _None_                              | Filename with extension of the clip found in `config/clips`                                                |
| `duration`   | int       | -1                                  | Duration how long the video is displayed in ms. Doesn't have effect if the video is shorter than the value |
| `fullscreen` | bool      | false                               | Displays the video in fullscreen mode. The video is stretched to fill the window.                          |
| `volume`     | float     | 0.8 or value from `videoClipVolume` | Sets the volume of the video clip where 0.0 is silent and 1.0 is 100%                                      |

#### Sound

| Key        | Data Type | Default Value                         | Description                                                                                                     |
|------------|-----------|---------------------------------------|-----------------------------------------------------------------------------------------------------------------|
| `filename` | string    | _None_                                | Filename without extension of the audio file found in `config/audio-hooks`                                      |
| `duration` | int       | -1                                    | Duration how long the video is displayed in ms. Doesn't have effect if the audio file is shorter than the value |
| `volume`   | float     | 0.8 or value from `audio-hook-volume` | Sets the volume of the video clip where 0.0 is silent and 1.0 is 100%                                           |

#### Emote

| Key             | Data Type | Default Value | Description                                                                                                                                   |
|-----------------|-----------|---------------|-----------------------------------------------------------------------------------------------------------------------------------------------|
| `emoteId`       | string    | _None_        | emoteId to display. Format depends on the _provider_                                                                                          |
| `emotetext`     | string    | _None_        | Alias of `emoteId`. Will be ignored if `emoteId` is set                                                                                       |
| `provider`      | string    | None          | The provider of the emote. See chapter _Emote Providers_ for valid values                                                                     |
| `amount`        | int       | 1             | The number of emotes to display for this instance                                                                                             | 
| `duration`      | int       | -1            | Duration how long the video is displayed in ms. Doesn't have effect if the audio file is shorter than the value                               |
| `animationName` | string    | flyUp         | Defines the animation to use. Either `flyUp` or an animation name from [animate.style](https://animate.style/)                                |
| `ignoreSleep`   | bool      | false         | Disables the random delay (1-200 ms) between spawing multiple emotes if `amount` is greater than 1 to improve visual quality in certain cases | 

#### Pause

Used in macros to pause the script for the given time.

| Key             | Data Type | Default Value | Description                                                       |
|-----------------|-----------|---------------|-------------------------------------------------------------------|
| `duration`      | int       | None          | Duration in milliseconds how long the execution should be paused. |


### Macros

Macros are defined in the following format. Each entry of the `script` contains the parameters as described in the chapter _Element Specification_.
An extra attribute `element` defines what kind of action is used.

Macros are processed sequentially, but without waiting for the previous media to complete. Use Pause elements to create delays.  

The following values are valid for `element` (case-sensitive) :

* `clip` (Video file)
* `sound` (Audio file)
* `emote` (Display emotes)
* `pause` (Delay the next command)

```json
{
  "macroName": "SomeName",
  "script": [
    {
      "element": "clip",
      "filename": "quak.webm",
      "duration": -1,
      "fullscreen": false,
      "volume": 0.8
    },
    {
      "element": "pause",
      "duration": 100
    },
    {
      "element": "sound",
      "filename": "badumtiss",
      "volume": 0.9
    },
    {
      "element": "emote",
      "emoteId": "bulb.png",
      "provider": "local",
      "animationName": "flyUp",
      "amount": 10,
      "duration": 10000,
      "ignoreSleep": false
    }
  ]
}
```