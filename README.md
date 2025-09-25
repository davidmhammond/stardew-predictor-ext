# stardew-predictor-ext

## About Extended Stardew Predictor

This app is a modified version of the awesome [Stardew Predictor](https://mouseypounds.github.io/stardew-predictor/) app by MouseyPounds. This extended version adds some new predictors, customizability, and a map viewing/planning tool.

## Dependencies

* A functioning webserver. The webserver just needs to be able to serve files; support for server-side scripting is not necessary. Unfortunately, due to browser security restrictions (mainly related to the Extended Stardew Predictor's use of JavaScript modules), this app won't work via the file:// protocol.
* [Stardew Predictor](https://github.com/MouseyPounds/stardew-predictor) and its dependencies. These dependencies are already bundled in this repository, in the "src/stardew-predictor" directory.
* An unpacked copy of Stardew Valley's Content directory.

## Installing using git

* Set up a private webserver. It only needs to be able to serve files via http: or https:.
* In the directory you want to put the project, run `git clone --recurse-submodules https://github.com/davidmhammond/stardew-predictor-ext.git`. This creates a stardew-predictor-ext directory within your current directory.
* Follow the "Unpacking the Content directory" instructions below to create and populate the stardew-predictor-ext/src/content directory.
* You should now be able to access the app via the http: or https: URL that corresponds to the stardew-predictor-ext/src directory.

## Unpacking the Content directory

This app makes use of Stardew Valley's data files and assets found in the Content directory. However, the files must be unpacked from their original XNB format. The following instructions were copied from the relevant [Stardew Valley Wiki page](https://stardewvalleywiki.com/Modding:Editing_XNB_files#StardewXnbHack):

> [StardewXnbHack](https://github.com/Pathoschild/StardewXnbHack#readme) is an open-source and crossplatform tool for unpacking XNB files. It can't pack files back into .xnb, but you [rarely need to](https://stardewvalleywiki.com/Modding:Content_Patcher).
>
> To unpack files:
>
> 1. [Install SMAPI](https://stardewvalleywiki.com/Modding:Player_Guide/Getting_Started).
> 2. [Download StardewXnbHack](https://github.com/Pathoschild/StardewXnbHack/releases). (Make sure you download the file for your OS, such as StardewXnbHack-*-for-windows.zip, not the source code!)
> 3. Unzip the download into [your game folder](https://stardewvalleywiki.com/Modding:Player_Guide/Getting_Started#Find_your_game_folder), so StardewXnbHack.exe is in the same folder as Stardew Valley executable icon.png StardewValley.exe.
> 4. Double-click StardewXnbHack.exe (on Windows), StardewXnbHack.sh (on Linux), or StardewXnbHack.command (on MacOS) to unpack your game's entire Content folder.
>
> That's it! It'll unpack the files into a Content (unpacked) folder. The unpacked files will already be compatible with [Content Patcher](https://stardewvalleywiki.com/Modding:Content_Patcher).

The unpacked directories and files should be placed into the "content" directory in the Extended Stardew Predictor app root. For example, if the stardew-predictor-ext.js file is at /var/www/predictor/stardew-predictor-ext.js, then the following content files should exist (among others):

* /var/www/predictor/content/Data/Objects.json
* /var/www/predictor/content/Maps/Town.tmx
* /var/www/predictor/content/TileSheets/crops.png

## Using the Extended Stardew Predictor

To use this app, simply open index.html in a web browser via the https:// or http:// protocol. This should be the index.html from the same directory as stardew-predictor-ext.js, NOT the one in the "stardew-predictor" subdirectory.

## Caveats

### Future Updates

I can't make any promises about future updates. I originally made this project for my own personal use, and I won't commit to anything beyond that. You're always free to fork this project and take it in whatever direction you see fit.

### Lack of Multiplayer Support

I only play Stardew Valley in single player mode, so I haven't done any testing with multiplayer. It's likely that some things won't work properly in multiplayer games.

### Save Versions

This was originally developed for Stardew Valley 1.6.15, and no effort was made to support save files from earlier versions.

### URL Parameters

The original Stardew Predictor included a feature to override the values from the save file, using URL parameters. The Extended Stardew Predictor didn't remove that feature for the values that the original predictors use, but the feature hasn't been expanded any further than that. The new predictor tabs mostly use values that cannot be overridden by URL parameters. However, most of the values used in the Maps tab can be overridden using the Game State fields in the UI.

## FAQ

### Why doesn't this project just bundle the unpacked Stardew Valley data files and assets?

I've done it this way out of caution to avoid any potential copyright issues. The original Stardew Predictor only includes a few images and data excerpts here and there, but the Extended Stardew Predictor relies on the complete content files from the game in their original (but unpacked) structure. That said, if ConcernedApe were to give permission, I'd happily bundle them. I just haven't asked.

### Is there a website I can use this from, or do I have to host it myself?

I haven't set up any public website to use this app from. Doing so would require distributing the game's asset files, which I'm avoiding due to the copyright concerns I mentioned above. So, you'll have to host it for yourself.

## Developer Information

In order to hook into the base Stardew Predictor's logic, this app relies on a slightly modified copy of the base stardew-predictor.js file, which has been placed in the Extended Stardew Predictor's app root (the src directory). This modified copy includes a few added sections of code, marked by "// BEGIN EXT ADDED" and "// END EXT ADDED" comments. All other behavioral changes are kept in separate files, in order to minimize conflicts when the base Stardew Predictor is updated.
