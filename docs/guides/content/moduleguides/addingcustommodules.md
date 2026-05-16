# Adding custom modules

Community **custom modules** extend PhantomBot with extra chat commands, games, or panel pages. Each module’s author usually ships a **README** with exact steps—follow that first. This guide explains the **usual** folders and how to confirm everything is working.

## Before you install

- Install modules only from **people and sites you trust**. A module runs with the same privileges as the rest of the bot and can read or change bot data, send chat messages, and use your Twitch and panel access depending on what it does.
- Take a **backup** of your bot (especially `config/` and any database files) before copying new files over an existing install.

## Upgrades and older modules

- A module that worked on an **older PhantomBot** can still **fail after you upgrade**: newer builds may change chat APIs, the panel, Rhino helpers, databases, or Twitch/EventSub behavior. **Retest** your custom modules after every upgrade and skim **release notes** for breaking changes.
- Modules that rely on **`web/panel/pages/extra/...`** plus a **patched `index.html`** are not “frozen in time” either—those patterns can break the same way. If you maintain such a module, consider **moving it to the manifest-based layout** when you next touch it (see **[Creating custom modules](guide=content/developerdocs/custommodules "##guide_link")**): no `index.html` merge, and the same packaging model newer community modules use.

## What you might be copying

Many modules ship a small tree of files. Common pieces:

| What it is | Where it usually goes (install root = folder that contains `scripts/` and `web/`) |
| --- | --- |
| Bot script(s) | `scripts/custom/` (often a subfolder such as `scripts/custom/games/`) |
| Language / text strings | `scripts/lang/custom/` |
| Panel sidebar or dashboard pieces | `web/panel/custom/<moduleId>/` and sometimes `web/panel/pages/custom/<moduleId>/` and `web/panel/js/pages/custom/<moduleId>/` |
| Extra data the module stores | Sometimes `addons/<something>/` |

The **moduleId** is a short folder name the author chose (for example `my-game`). Keep the folder names exactly as provided so paths line up.

### If you use Docker

When the bot runs in a container with a **data volume** (often mounted at `/opt/PhantomBot_data` on the container), copy files into the **same paths on the host** under that volume—for example `<your host data>/scripts/custom/...` and `<your host data>/web/panel/custom/...`. The official Docker image exposes those paths under the data volume automatically; you do **not** need to edit files inside the container image.

## After you copy the files

1. **Restart the bot** if the module’s README says to, or if you replaced an existing script and want a clean load. Many setups only need the next steps.
2. Open the **web panel** in your browser and do a **hard refresh** (for example **Ctrl+Shift+R** on Windows) so the browser does not use an old cached page.
3. If the module is **chat-only** and new commands do not appear, the broadcaster (or someone with permission) can run **`!reloadcustom`** in the channel so the bot picks up new scripts without a full restart.

## How to check that it worked

- **Panel:** Look for a new item under **Extra**, **Alerts**, **Giveaways**, or **Audio**, or a new card on **Games**, depending on what the module adds.
- **Chat:** Try the commands listed in the module README.

If a sidebar link appears but the page is **blank or “Not found”**, the HTML/JS files are probably in the wrong folder or missing—compare your tree to the author’s README.

## Removing a module

1. Stop the bot.
2. Delete the files you added (scripts, `web/panel/...` pieces, and optional `addons/` data).
3. Start the bot again.

If you had enabled a game-style module with the panel **module** toggle, turn it off first if the panel still loads.

## Writing your own module

If you are **developing** a module rather than installing one, see **[Creating custom modules](guide=content/developerdocs/custommodules "##guide_link")** in **Developer Documentation** for paths, manifests, and panel behavior.
