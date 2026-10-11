# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

"Shlink It!" is a Manifest V3 browser extension that creates a short URL for the current tab on a self-hosted [Shlink](https://shlink.io) server, then copies it to the clipboard and shows a notification.

## Development

Built with [WXT](https://wxt.dev) + TypeScript, managed with pnpm. Requires Node and pnpm.

- `pnpm install`: install deps (also runs `wxt prepare`, which generates `.wxt/` types).
- `pnpm dev`: dev build to `.output/chrome-mv3-dev/` with hot reload; launches a browser with the extension loaded. `pnpm dev:firefox` for Firefox.
- `pnpm build` / `pnpm build -b firefox`: production build to `.output/chrome-mv3/` or `.output/firefox-mv3/`. Load the Chrome one via `chrome://extensions` → Developer mode → "Load unpacked".
- `pnpm zip` / `pnpm zip:firefox`: release zip in `.output/`. The `version` in `package.json` drives the manifest version; see "Releasing" below.
- `pnpm typecheck` (alias `pnpm compile`): `tsc --noEmit`.
- `pnpm lint`: Biome check (lint + formatting + import order; config in `biome.json`). `pnpm format` applies Biome's safe fixes and formatting. Style is 2-space indent, single quotes.
- `pnpm test`: Vitest unit tests in `test/*.test.ts` (`vitest.config.ts` uses WXT's `WxtVitest` plugin, so tests import via `@/`). `pnpm test:watch` for watch mode.

CI (`.github/workflows/ci.yml`, GitHub Actions, Node 24) runs on every pull request and on pushes to `master`. It does a frozen-lockfile install, then the lint, typecheck, test and both browser builds listed above; run the same locally before committing. The pnpm version CI uses comes from `packageManager` in `package.json`; keep it in step with the lockfile, and commit `pnpm-lock.yaml` with any dependency change or the frozen install fails.

## Releasing

Release from an up-to-date, clean `master`:

```sh
pnpm version minor        # or patch/major: bumps package.json, commits, tags vX.Y.Z
git push --follow-tags
```

The first release built by this workflow is `0.2.0` (from `0.1.0` via `pnpm version minor`).

The tag push runs `.github/workflows/release.yml`: it checks the store secrets, fails if the tagged commit isn't on `master` or the tag isn't `v` + the `package.json` version, runs lint/typecheck/test, zips Chrome and Firefox (`pnpm zip`, `pnpm zip -b firefox`), creates a GitHub Release for the tag with `shlink-it-X.Y.Z-chrome.zip` and `shlink-it-X.Y.Z-firefox.zip` attached, then runs `wxt submit` to upload the Chrome zip to the existing Chrome Web Store listing and submit it for review. Firefox is not submitted to AMO; its zip is only attached to the release. Re-running a failed job re-uploads the zips to the existing release. Running the workflow manually (Actions → Release → Run workflow) is a dry run: it builds the zips and runs `wxt submit` with `DRY_RUN=true`, which checks the credentials against the store without creating a release or uploading.

`wxt submit` uses Chrome Web Store API v2 with a service account (`CHROME_API_VERSION: v2` in the workflow). Don't switch it to the OAuth client ID / client secret / refresh token flow: that's API v1.1, which Google shuts down on 2026-10-15.

One-time setup (maintainer only), as repo secrets under Settings → Secrets and variables → Actions:

- `CHROME_EXTENSION_ID`: the existing listing's item ID (from its Chrome Web Store URL or the Developer Dashboard).
- `CHROME_PUBLISHER_ID`: from the Developer Dashboard URL, `https://chrome.google.com/webstore/devconsole/<publisher-id>`.
- `CHROME_SERVICE_ACCOUNT_CLIENT_EMAIL` and `CHROME_SERVICE_ACCOUNT_PRIVATE_KEY`: follow https://developer.chrome.com/docs/webstore/service-accounts. In a Google Cloud project, enable the Chrome Web Store API, create a service account and download a JSON key ("Use a JSON Web Token"). Then add the service account's email in the Developer Dashboard account settings so it can publish. Use the JSON's `client_email` and `private_key` values; paste the key as a multi-line PEM (`-----BEGIN PRIVATE KEY-----` …), with real newlines in place of the `\n` escapes.

`pnpm wxt submit init` walks through the same values interactively. After adding the secrets, do a manual dry run to confirm them before tagging a release.

## Architecture

Two independent WXT entrypoints, no background/service worker:

- `entrypoints/options/` (`index.html` + `main.ts`): settings page (opens in a tab). Saves `shlinkUrl`, `apiKey`, `defaultTags` to `browser.storage.local`. Don't rename these keys; existing installs depend on them.
- `entrypoints/popup/` (`index.html` + `main.ts` + `style.css`): toolbar popup. Reads those settings, pre-fills URL/title from the active tab, and on submit POSTs to `${shlinkUrl}/rest/v2/short-urls` with the `X-Api-Key` header (`findIfExists: true`, plus title, space-separated tags, optional custom slug and max visits). The result flows through a promise chain: `createLink → validateResponse → copyLinkToClipboard → successNotification → closeWindow`, with `failureNotification` as the catch-all.
- `utils/`: helpers shared by entrypoints. Pure ones are unit-tested in `test/`: `shlink.ts` (`buildShortUrlBody` builds the create-short-URL request body from the raw form values; `responseErrorMessage` maps a non-OK HTTP status to the user-facing 4xx / 5xx / other message), `tags.ts` (`parseTags` splits the Tags field on spaces; `initialTagsValue` is the field's pre-fill), `max-visits.ts` (`parseMaxVisits` turns the Max Visits field into a positive integer or `null`, throwing on bad input). Keep DOM and `browser` calls in the entrypoints and logic in these helpers. `dom.ts` (`byId`, which throws if an element id is missing) touches `document` and is covered by the manual check instead.
- `public/` is copied verbatim to the build root (icons live in `public/images/`).

The manifest is generated by WXT from `wxt.config.ts` plus the entrypoints; there is no `manifest.json` in the repo. Both Chrome and Firefox build as MV3 (`manifestVersion: 3`); the Firefox build adds the gecko id `shlink-it@tedkulp.com`.

Conventions:

- Code uses WXT's `browser` global (promise-based), not `chrome.*` and not `webextension-polyfill`.
- DOM work uses plain DOM APIs (`byId` from `utils/dom.ts`, `.value`, `.textContent`, `addEventListener`); no jQuery. Styling is Bootstrap 5.0 CSS from npm (pinned to the version that used to be vendored), imported in each entrypoint's `main.ts`.
- Permissions are declared in `wxt.config.ts` (`storage`, `activeTab`, `notifications`, `clipboardWrite`). Adding a browser API usually needs a matching permission there. There are deliberately no `host_permissions`; see `docs/adr/0001-rely-on-shlink-cors-not-host-permissions.md`.

## Agent skills

### Issue tracker

Issues live in GitHub Issues on `tedkulp/shlink-it` (via `gh`). See `docs/agents/issue-tracker.md`.

### Triage labels

Default vocabulary: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: root `GLOSSARY.md` + `docs/adr/`. See `docs/agents/domain.md`.
