# Creating custom modules

If you only want to **install** a module someone else built, see **[Adding custom modules](guide=content/moduleguides/addingcustommodules "##guide_link")** under **Module Guides**.

PhantomBot supports **community custom modules**: Rhino (JavaScript) scripts under `scripts/custom/`, optional language files, and—when you want panel UI without editing `index.html`—a **`manifest.json`** that declares sidebar links, dashboard cards, and declarative settings modals.

If your module only needs chat commands or background logic, you can ship **scripts only** (no web files). If you want links or cards in the panel, add the manifest and panel assets described below.

## What goes where

Paths are relative to the **PhantomBot install root** (the folder that contains `scripts/`, `web/`, and `config/`).

| Piece | Path | When you need it |
| --- | --- | --- |
| Bot logic | `scripts/custom/**/*.js` | Always (any folder nesting under `custom/` is fine) |
| Strings | `scripts/lang/custom/*` (`.json` or `.js` lang files, same rules as stock) | Optional |
| Manifest | `web/panel/custom/<moduleId>/manifest.json` | Only if you contribute **nav** links and/or **cards** |
| Panel page HTML | `web/panel/pages/custom/<moduleId>/<name>.html` | If you declare a `nav` entry with that `folder` + `page` |
| Panel page JS | `web/panel/js/pages/custom/<moduleId>/<name>.js` | Optional; load from the HTML with `<script src="js/pages/custom/<moduleId>/<name>.js">` (same pattern as stock **Extra** pages) |
| Persistent files | `addons/<something>/...` | Optional; e.g. counters or caches your script reads/writes |

Pick a stable **`moduleId`** (short, filesystem-safe) and use the **same** name in `web/panel/custom/<moduleId>/`, `web/panel/pages/custom/<moduleId>/`, and in manifest `nav.folder` as `custom/<moduleId>`.

## Headless module (chat only)

1. Add `scripts/custom/yourModule.js` (and lang under `scripts/lang/custom/` if needed).
2. Register commands inside `$.bind('initReady', function () { ... })` and call `$.registerChatCommand('./custom/.../yourModule.js', 'cmdname', perm);` (see the [registerChatCommand](guide=content/developerdocs/registerchatcommand "##guide_link") guide).
3. Reload scripts without restarting: run **`!reloadcustom`** in chat (caster), or refresh the web panel (the panel issues a silent reload after loading manifests).

## Module with panel UI (manifest)

### Structure of `manifest.json`

At least one of **`nav`** or **`cards`** must be present (non-empty) when the file exists. Both keys are optional at the JSON level, but an empty manifest is invalid.

```text
manifest.json
├── nav[]                              optional — sidebar links (Extra, Alerts, Giveaways, or Audio)
│   └── { label, folder, page, hash?, section? }
│
└── cards[]                            optional — cards on the Games page
    └── { id, title, description?, section?, scriptPath? }
        ├── detailsModal?              optional — read-only info dialog
        │   └── { title?, content }   content = sanitized HTML
        │
        ├── settingsModal?             optional — declarative settings (wins over legacy if both set)
        │   ├── title
        │   ├── fields[]               flat list of fields  ─┐
        │   │   └── { id, type, label, table, key, … }      │ use exactly one of
        │   └── sections[]             accordion groups       ─┘ fields[] OR sections[], not both
        │       └── { id, title, defaultExpanded?, fields[] }
        │
        └── settingsFolder + settingsPage   optional legacy — full-page settings via $.loadPage
                                            (cog uses settingsModal when both are present)
```

**`settingsModal` field `type`** (each field in `fields` or inside each section’s `fields`): `number`, `text`, `textarea`, `boolean`, `toggle`, `checkboxgroup`, `dropdown`, `permission` — see the full spec for per-type keys and limits.

1. Place **`web/panel/custom/<moduleId>/manifest.json`** on disk using the structure above. Each **`nav`** entry must match a **`pages/custom/<moduleId>/<page>.html`** file (and optional JS) on disk.
2. For each **`nav`** link, add **`web/panel/pages/custom/<moduleId>/<page>.html`** and optional matching JS under **`web/panel/js/pages/custom/<moduleId>/`**. Manifest fields `folder` and `page` must match: `folder` is always `custom/<moduleId>`, `page` is a single filename like `mypage.html`.
3. For **Games** **`cards`**, set **`scriptPath`** to a path PhantomBot’s `module` command understands, e.g. **`./games/myGame.js`** (must start with `./`, include a subdirectory, end with `.js`).
4. After a declarative **settings** save, the panel sends **`panel-settings-saved`** to that script over the panel websocket—handle it in **`webPanelSocketUpdate`** to refresh in-memory settings.

Legacy **full-page** settings via **`settingsFolder`** + **`settingsPage`** still work if you prefer `$.loadPage`; if both that and **`settingsModal`** exist, the modal wins for the cog.

## Docker and data volumes

If you run from a container with a bind-mounted data directory (e.g. mounted at `/opt/PhantomBot_data`), put the same relative tree under that mount: **`web/panel/custom/...`**, **`web/panel/pages/custom/...`**, **`web/panel/js/pages/custom/...`**, **`scripts/custom/...`**, etc. The Docker image symlinks those panel paths into the data volume so one mount is enough.

## Full specification and troubleshooting

For the complete **`manifest.json`** schema, field types, validation rules, security notes, Docker symlink table, and a troubleshooting checklist, see **`docs/AGENT_CUSTOM_MODULE_LAYOUT.md`** in the repository.
