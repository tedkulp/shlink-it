# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

"Shlink It!" is a Manifest V3 browser extension that creates a short URL for the current tab on a self-hosted [Shlink](https://shlink.io) server, then copies it to the clipboard and shows a notification.

## Development

There is no build step, package manager, linter, or test suite. The repo root is the unpacked extension.

- Load for testing: Chrome → `chrome://extensions` → Developer mode → "Load unpacked" → select the repo root. Reload the extension after edits.
- Package for release: zip the repo root (`*.zip` is gitignored). Bump `version` in `manifest.json`.

## Architecture

Two independent pages, no background/service worker:

- `options.html` / `options.js`: settings page. Saves `shlinkUrl`, `apiKey`, `defaultTags` to `browser.storage.local`.
- `popup.html` / `popup.js`: toolbar popup. Reads those settings, pre-fills URL/title from the active tab, and on submit POSTs to `${shlinkUrl}/rest/v2/short-urls` with the `X-Api-Key` header (`findIfExists: true`, plus title, space-separated tags, optional custom slug and max visits). The result flows through a promise chain: `createLink → validateResponse → copyLinkToClipboard → successNotification → closeWindow`, with `failureNotification` as the catch-all.

Conventions:

- Code uses the `browser.*` API (promise-based) via the vendored `webextension-polyfill`, not `chrome.*`.
- DOM work uses vendored jQuery 3.6; styling is vendored Bootstrap 5. Everything under `vendor/` is third-party minified code; don't edit it.
- Permissions are declared in `manifest.json` (`storage`, `activeTab`, `notifications`, `clipboardWrite`). Adding a browser API usually needs a matching permission there.

## Agent skills

### Issue tracker

Issues live in GitHub Issues on `tedkulp/shlink-it` (via `gh`). See `docs/agents/issue-tracker.md`.

### Triage labels

Default vocabulary: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: root `GLOSSARY.md` + `docs/adr/`. See `docs/agents/domain.md`.
