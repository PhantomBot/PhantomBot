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

**Legend:** `?` = optional key or optional object. Indentation shows nesting.

```text
manifest.json
│
├── nav[]                              optional — sidebar links
│   └── each entry                     { label, folder, page, hash?, section? }
│                                      section: extra | alerts | giveaways | audio
│
└── cards[]                            optional — Games page
    └── each entry                     { id, title, description?, section?, scriptPath? }
        │
        ├── detailsModal?              optional — read-only info
        │   └──                        { title?, content }   (HTML, sanitized when shown)
        │
        └── settingsModal?             optional — enables settings cog when valid
            ├── title                  required when this block is present
            ├── fields[]               flat rows — use this OR sections[], not both
            │   └── row                { id, type, label, table, key, … }
            └── sections[]             accordion panels — use this OR fields[], not both
                └── panel              { id, title, defaultExpanded?, fields[] }
                    └── fields[]       same row shape as top-level fields[] above
```

### Example `manifest.json`

Illustrates **`nav`** plus one **Games** **`cards`** entry with **`detailsModal`**, **`scriptPath`**, and a flat **`settingsModal.fields`** list (the same field row shape appears under **`sections[].fields`** when you use accordions instead). Replace `demomod`, page names, `scriptPath`, and INIDB **`table`** / **`key`** names with your own module.

```json
{
  "nav": [
    {
      "label": "Demo mod",
      "folder": "custom/demomod",
      "page": "panel.html",
      "section": "extra"
    }
  ],
  "cards": [
    {
      "section": "games",
      "id": "demomod-game",
      "title": "Demo minigame",
      "description": "Games card with info dialog, module toggle, and declarative settings.",
      "scriptPath": "./games/demomodGame.js",
      "detailsModal": {
        "title": "About this game",
        "content": "<p>Allowed HTML only; content is sanitized in the panel.</p>"
      },
      "settingsModal": {
        "title": "Demo mod settings",
        "fields": [
          {
            "id": "min-bet",
            "type": "number",
            "label": "Minimum bet",
            "table": "demomod_settings",
            "key": "min_bet",
            "min": 1
          },
          {
            "id": "bonus-enabled",
            "type": "boolean",
            "label": "Enable bonus round",
            "table": "demomod_settings",
            "key": "bonus_enabled"
          }
        ]
      }
    }
  ]
}
```

## Full manifest specification

The bot reads every **`web/panel/custom/<moduleId>/manifest.json`**, merges valid entries, and serves **`GET /panel/custom-manifests.json`** (authenticated). Responses are cacheable like other panel static assets (strong **ETag**, **304** when unchanged). Invalid entries are skipped with a **`warn`** log line that names the manifest path—check the bot console if UI is missing.

### Panel user permissions (section-based)

Custom modules use the same **Settings → Panel Users** sections as stock panel areas—**not** per-module ACL. Grant **Extra** for a typical `nav.section: "extra"` page, or **Games** for `cards.section: "games"`.

| Panel Users access on the section | Custom `nav` / `cards` in that section |
| --- | --- |
| **Full Access** | Visible; settings, toggles, saves, and custom page writes allowed. Websocket checks use the manifest **`section`** (e.g. `extra` or `games`) on each panel message. |
| **Read Only** | Visible; viewing and read-only details allowed. Writes are blocked on the server. In the UI, **Games** card toggles/settings are disabled; clicks show the stock **Permissions error** toast. **Custom nav pages** must implement the same pattern in their own page JS (see below)—the manifest does not wire your buttons. |
| **No access** (section not granted) | Omitted from **`custom-manifests.json`** for that user; sidebar block is hidden like stock pages. |

Set **`nav.section`** to `extra`, `alerts`, `giveaways`, or `audio`. Set **`cards.section`** to `games` (only supported card section today).

The bot rebuilds an internal index whenever manifests change: every **`settingsModal`** field **`table`** (and **`cards.scriptPath`**) is mapped to that entry’s **`section`** for Panel User websocket checks—no module-specific names are compiled into PhantomBot.

**Websocket `section`:** `socket.getDBValues`, `socket.updateDBValues`, `socket.sendCommand`, and related panel APIs attach **`message.section`** from the active page. For manifest nav, that value comes from **`nav.section`** (`data-panel-section` on the sidebar link). Users should open your page through that link so section checks match **Settings → Panel Users**.

#### Declarative Games cards (built-in UI)

When `cards` are rendered, the panel applies read-only styling automatically: module toggle and settings cog are non-interactive for write, with tooltip text from **`window.__pbCustomPanel__.READ_ONLY_PANEL_TITLE`**. Clicks call **`requirePanelSectionWrite('games')`** and show the permission toast. Declarative **`settingsModal`** saves are blocked the same way.

#### Custom nav pages (your page JS)

Manifest **`nav`** only adds the sidebar link and sets **`section`** on websocket traffic. Buttons, tables, and modals in **`web/panel/pages/custom/<moduleId>/`** are **your** responsibility.

Use the shared namespace **`window.__pbCustomPanel__`** (from `customPanelManifestLoader.js`, loaded in `index.html` before your page script):

| Helper | Purpose |
| --- | --- |
| `panelSectionCanWrite(section)` | `true` when the user has **Full Access** on that section. |
| `requirePanelSectionWrite(section)` | Returns `false` and shows the **Permissions error** toast when read-only; use at the start of click/save handlers. |
| `READ_ONLY_PANEL_TITLE` | Tooltip for disabled write controls. |

Recommended pattern for read-only users:

- Keep write controls **visible** but styled disabled (`cursor: not-allowed`, reduced opacity, `aria-disabled="true"`).
- Do **not** use Bootstrap’s `disabled` class on buttons you still want to accept clicks— it sets `pointer-events: none` and blocks the toast.
- Call **`requirePanelSectionWrite`** (or check **`panelSectionCanWrite`**) before opening modals, confirming deletes, or sending commands.
- Re-apply read-only styling after AJAX table refreshes if you rebuild row buttons.

Use the same **`section`** string as in your manifest (`extra`, etc.). You can read the active value with **`$.currentPage().panelSection`** after the user navigates via the manifest link.

Optional: declare a minimal **`settingsModal`** on a **Games** card (or any card) listing your INIDB **`table`** names so the server indexes them to a section even when the primary UI is a **nav** page.

### `nav` entries (sidebar links)

| Field | Required | Rules |
| --- | --- | --- |
| `label` | Yes | Shown in the sidebar. |
| `folder` | Yes | Must start with **`custom/`** (e.g. `custom/mycoolmod`) and match the directory under `web/panel/pages/`. Only letters, digits, `_`, `-`, `.`, and `/` between segments; no reserved URI characters (`?`, `#`, `%`, etc.). |
| `page` | Yes | **Single** filename only: `something.html`. Same safe character set; no `/`, `..`, `\`, or reserved URI delimiters. |
| `hash` | No | Optional; merged output always uses `#` + `page`. If you set `hash`, the fragment (with or without `#`) must equal `page` or the nav row is skipped. |
| `section` | No | **`extra`** (default), **`alerts`**, **`giveaways`**, or **`audio`**. Any other value is logged and treated as **`extra`**. |

**Section hints:** **`extra`** is the general catch-all; **`alerts`**, **`giveaways`**, and **`audio`** match those submenu themes. Other built-in areas (Commands, Moderation, Loyalty, single-page panels like Dashboard, etc.) are **not** valid `nav` targets—there is no submenu to attach to. **`Games`** is for **`cards`**, not **`nav`**.

Duplicate **`folder` + `page`** pairs across manifests are deduplicated (**first wins**).

### `cards` entries (Games page)

| Field | Required | Rules |
| --- | --- | --- |
| `id` | Yes | Unique id: letters, digits, `_`, `-`, max **64** chars; used in DOM ids. |
| `title` | Yes | Card heading. |
| `description` | No | Body text; escaped when rendered. |
| `section` | No | Only **`games`** is supported today (default). |
| `scriptPath` | No | If set, shows the module toggle wired to `module enable/disable <path>`. **Shape:** starts with `./`, at least one path segment before the file, ends with `.js`, length **8–256**, no `..` or backslashes. Example: **`./games/myGame.js`**. Malformed values skip the **whole card** with a warn-log. When the module is disabled, the settings cog is disabled (stock behavior). |
| `settingsModal` | No | Bootstrap-style modal: requires **`title`** and **either** **`fields`** **or** **`sections`** (not both). Max **50** fields **total** (flat + all accordion inner fields), max **10** accordion sections. Every field row is full-width. If the block is missing or invalid, the cog is shown **disabled** with the stock “no settings” tooltip. |
| `detailsModal` | No | Read-only info: **`content`** is required when the block is used (max **16384** chars), sanitized HTML with an allowlist (`p`, `br`, `strong`, `em`, `b`, `i`, `u`, `s`, `h4`–`h6`, `ul`, `ol`, `li`, `a` with safe `href`, `code`, `pre`, `blockquote`, `div`, `span`, `hr`). **`title`** optional (max **200** chars). |

Duplicate **`section` + `id`** across manifests are deduplicated (**first wins**).

### `settingsModal` field rows (all types)

Every row needs **`id`**, **`type`**, **`label`**, **`table`**, and **`key`** (INIDB). Optional **`help`** on any type (length capped server-side).

### `settingsModal` field `type` values

Allowed **`type`** strings (each row in `fields[]`, including rows nested under `sections[].fields[]`):

| `type` | Purpose | Extra keys |
| --- | --- | --- |
| **`number`** | Numeric input. | Optional **`min`**, **`max`** (validated on save). Default display value falls back to **`min`** or `0` when the DB value is empty. |
| **`text`** | Single-line string. | — |
| **`textarea`** | Multi-line string. | Set **`unlimited`**: `true` to skip the default max length; otherwise a default cap applies in the panel. |
| **`boolean`** | Two-choice dropdown stored as boolean in INIDB. | Optional **`options`**: exactly **two** unique non-empty strings `[trueLabel, falseLabel]` (e.g. `["Enabled","Disabled"]`). If omitted, defaults to **Yes / No**. |
| **`toggle`** | Single inline checkbox; wire-compatible with boolean storage. | Prefer **`boolean`** when a labeled dropdown reads better; use **`toggle`** for a compact switch. |
| **`checkboxgroup`** | 2–12 related booleans in one fieldset; one shared **`table`** on the parent field, each inner checkbox has its own **`key`**. | **`checkboxes`**: array of `{ id, label, key, help? }`. Inner **`id`** values must be unique **within the whole modal** (not just within the group). |
| **`dropdown`** | String choice from a fixed list. | **`options`**: non-empty array of strings (each option length capped server-side). |
| **`permission`** | PhantomBot permission group selector. | Stored as group id; panel uses the default group when the value is missing or invalid. |

**After save:** if the card has **`scriptPath`**, the panel sends a websocket event to that script with **`args[0] === "panel-settings-saved"`** after a successful save—handle it in **`webPanelSocketUpdate`**. The panel also dispatches a DOM **`pbCustomCardSettingsSaved`** `CustomEvent` on `document` with detail `{ cardId, section, scriptPath, title }` for page-side scripts (use `e.detail` or `e.originalEvent.detail` with jQuery).

### Stock vs community separators

When manifest content actually renders, the panel inserts a small separator: a **CUSTOM** divider above the first custom link in a given sidebar section, and a **Community modules** header above the first custom **Games** card. No manifest keys are required for this.

### Troubleshooting

- **Link but 404:** Confirm `web/panel/pages/custom/<moduleId>/<page>.html` exists on the machine (or Docker volume) the bot serves.
- **No link:** Valid JSON at `web/panel/custom/<moduleId>/manifest.json`; `folder`/`page` pass validation; check console for **`Custom panel manifest skipped nav`** lines.
- **No card:** `section` must be `games`; `id` safe and unique; console may show **`skipped card`** with a reason (`invalid id`, `invalid scriptPath`, modal validation, etc.).
- **Toggle no-op:** `scriptPath` must match what the `module` command expects (e.g. `./games/foo.js`). Bare `./foo.js` is rejected.
- **Commands missing after drop:** Run **`!reloadcustom`** (caster); register commands inside **`$.bind('initReady', ...)`** so the reload fan-out can re-run them.
- **Read-only user can still “succeed” in UI:** Use **`requirePanelSectionWrite`** before showing success dialogs; avoid **`helpers.getConfirmDeleteModal`** success text on async websocket actions (it runs before the server responds). Prefer **`toastr`** on command callback for deletes.
- **Wrong section / denied writes:** Open the page from the manifest sidebar link so **`$.currentPage().panelSection`** matches **`nav.section`**. Index INIDB tables in **`settingsModal`** if you rely on table-based checks.
- **Docker:** Put files under the **host** path you bind to **`/opt/PhantomBot_data`**; symlinks from the image point `./web/panel/.../custom` (and related paths) at that volume.

### Compatibility with older custom modules

Custom modules fall into a few integration styles. **Upgrades can affect any of them**—retest after every PhantomBot upgrade and read release notes when they mention breaking changes.

**Legacy panel integration (pre-manifest)** — The module adds panel HTML (often under **`web/panel/pages/extra/...`**) and instructions (or a patch) to **edit stock `index.html`** so a sidebar link points at that page. PhantomBot does **not** remove this path; it still works on current builds when the merge is kept in sync. This style is **not** the same as manifest-based modules: it depends on your forked panel shell and can break when **`index.html`**, stock sidebar markup, or panel JS changes.

**Manifest-based modules (this guide’s model)** — The module ships **`web/panel/custom/<moduleId>/manifest.json`** and pages under **`web/panel/pages/custom/<moduleId>/`** (no `index.html` edit). That layout is **additive** to legacy installs. A module that **already** uses manifests can still **break on a newer build** if APIs, validation rules, panel helpers, Rhino behavior, databases, or Twitch/EventSub contracts change—being on manifests does not freeze compatibility.

**Headless modules** — Only **`scripts/custom/...`** (and optional lang). No panel files; unaffected by `index.html` or manifest changes unless the bot’s script APIs change.

If you still maintain a **legacy** panel module, **consider migrating to manifests** when you next revise it: drop the `index.html` merge, use **`custom/<moduleId>`** paths, and gain declarative **`nav`**, **`cards`**, and **`settingsModal`** where they fit (see [Full manifest specification](#full-manifest-specification)).

## Checklist (manifest + assets)

1. Place **`web/panel/custom/<moduleId>/manifest.json`** on disk using the structure and rules in [Full manifest specification](#full-manifest-specification). Each **`nav`** entry must match a **`pages/custom/<moduleId>/<page>.html`** file (and optional JS) on disk.
2. For each **`nav`** link, add **`web/panel/pages/custom/<moduleId>/<page>.html`** and optional matching JS under **`web/panel/js/pages/custom/<moduleId>/`**. Manifest fields `folder` and `page` must match: `folder` is always `custom/<moduleId>`, `page` is a single filename like `mypage.html`.
3. For **Games** **`cards`**, set **`scriptPath`** to a path PhantomBot’s `module` command understands, e.g. **`./games/myGame.js`**. For a working settings cog, add a valid **`settingsModal`** (`title` plus `fields` or `sections`).
4. After a declarative **settings** save, the panel sends **`panel-settings-saved`** to that script over the panel websocket—handle it in **`webPanelSocketUpdate`** to refresh in-memory settings (see [Full manifest specification](#full-manifest-specification)).
5. For **nav-only** pages with Panel Users: implement read-only UI in your page JS using **`window.__pbCustomPanel__`** (see [Panel user permissions](#panel-user-permissions-section-based)).

## Docker and data volumes

If you run from a container with a bind-mounted data directory (e.g. mounted at `/opt/PhantomBot_data`), put the same relative tree under that mount: **`web/panel/custom/...`**, **`web/panel/pages/custom/...`**, **`web/panel/js/pages/custom/...`**, **`scripts/custom/...`**, etc.

The official Docker image symlinks writable paths—including custom panel directories—into **`PhantomBot_data`** so a single host bind-mount is enough:

| Container path | Points at (typical) |
| --- | --- |
| `/opt/PhantomBot/web/panel/custom` | `/opt/PhantomBot_data/web/panel/custom` |
| `/opt/PhantomBot/web/panel/pages/custom` | `/opt/PhantomBot_data/web/panel/pages/custom` |
| `/opt/PhantomBot/web/panel/js/pages/custom` | `/opt/PhantomBot_data/web/panel/js/pages/custom` |
| `/opt/PhantomBot/scripts/custom` | `/opt/PhantomBot_data/scripts/custom` |
| `/opt/PhantomBot/scripts/lang/custom` | `/opt/PhantomBot_data/scripts/lang/custom` |
| `/opt/PhantomBot/scripts/discord/custom` | `/opt/PhantomBot_data/scripts/discord/custom` |
| `/opt/PhantomBot/addons` | `/opt/PhantomBot_data/addons` |
| `/opt/PhantomBot/config` | `/opt/PhantomBot_data/config` |

The entrypoint **`mkdir`s** the data subdirectories on first boot so an empty bind-mount starts cleanly. Edit manifests and scripts on the **host** volume; no image rebuild is required.

The Java manifest collector may also scan a sibling **`PhantomBot_data`** style path on disk; with Docker symlinks both roots often resolve to the **same** files, so duplicate scans dedupe by id.
