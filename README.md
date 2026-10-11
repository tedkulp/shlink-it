# Shlink It!

A browser extension that shortens the current tab's URL on your own [Shlink](https://shlink.io) server, then copies the short link to your clipboard.

![The Shlink It! popup](screenshot.png)

Click the toolbar icon, adjust the title or tags if you want, and hit the button. You get a notification with the short URL, which is already on your clipboard. If the URL was shortened before, Shlink returns the existing short link instead of making a new one.

You need a Shlink server you control and an API key for it. This extension does not provide a shortening service.

## Install

**Chrome:** [Shlink It! on the Chrome Web Store](https://chromewebstore.google.com/detail/shlink-it/honjlmannamjohjjmlfkohhcppoelpfc).

**From source** (Chrome, or any Chromium browser):

1. Build it: `pnpm install && pnpm build` (see [Development](#development)).
2. Open `chrome://extensions` and turn on **Developer mode**.
3. Click **Load unpacked** and pick `.output/chrome-mv3/`.

A Firefox build (`pnpm build:firefox`, output in `.output/firefox-mv3/`) exists, but the extension isn't published on Firefox Add-ons.

## Set up

1. Create an API key on your Shlink server, for example with `shlink api-key:generate`.
2. Open the extension's options page (right-click the toolbar icon → **Options**).
3. Fill in:
   - **Shlink URL**: your server's base URL, e.g. `https://s.example.com`.
   - **API Key**: the key from step 1.
   - **Default Tags** (optional): space-separated tags that pre-fill every new link.
4. Click **Save**. A green alert confirms the settings were stored.

Settings are kept in the browser's local extension storage and are only sent to the Shlink URL you configure.

## Use

Click the toolbar icon on any page. The popup fills in the page's URL and title. Optional fields:

| Field | What it does |
|---|---|
| Title | Title stored with the short URL. Defaults to the page title. |
| Tags | Space-separated tags. Starts with your default tags. |
| Custom Slug | The path after your domain. Leave empty to let Shlink generate one. |
| Max Visits | A positive whole number. Leave empty for unlimited. |

Press **Enter** or click the button. On success, the short URL is copied to the clipboard and a notification shows it. On failure, the notification says what went wrong.

## Troubleshooting

- **"Got error code 4xx. Please check if you've configured…"**: check the Shlink URL and API key in the options page. A taken custom slug also returns a 4xx error.
- **"Got error code 5xx. Please check if the Shlink server…"**: the problem is on the server side; check Shlink's logs.
- **Network error with a correct URL and key**: the extension doesn't ask for host permissions and relies on Shlink's CORS headers ([ADR 0001](docs/adr/0001-rely-on-shlink-cors-not-host-permissions.md)). A reverse proxy in front of Shlink that strips those headers will block the request.

## Development

Requires Node 22 or newer and pnpm (the version is pinned in `package.json`). Built with [WXT](https://wxt.dev) and TypeScript.

```sh
pnpm install          # install deps and generate WXT types
pnpm dev              # dev build with hot reload, opens a browser
pnpm lint             # Biome
pnpm typecheck        # tsc --noEmit
pnpm test             # Vitest unit tests
pnpm build            # production build → .output/chrome-mv3/
```

If you have [just](https://just.systems), the `justfile` wraps these. Run `just` to list recipes, and `just ci` to run everything CI runs.

CI runs lint, typecheck, test and both builds on every pull request. Pushing a `v*` tag builds the zips, creates a GitHub Release and submits to the Chrome Web Store; see the "Releasing" section of [CLAUDE.md](CLAUDE.md) for the one-time setup.

Bugs and ideas go in [GitHub Issues](https://github.com/tedkulp/shlink-it/issues).

## License

[MIT](LICENSE)
