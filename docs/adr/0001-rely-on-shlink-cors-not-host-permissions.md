# Rely on Shlink's CORS headers instead of host_permissions

The popup calls the user's Shlink server with `fetch` but the manifest declares no `host_permissions` for it. This works because Shlink's REST API answers with permissive CORS headers, so the browser allows the cross-origin request from the extension page. We chose this over requesting an optional host permission for the configured server (or `<all_urls>`) to keep the install-time and runtime permission surface minimal and avoid extra Chrome Web Store review friction.

## Consequences

- A Shlink instance behind a reverse proxy that strips or overrides CORS headers will fail with a network error. If that gets reported, the fix is to request an optional host permission for the configured Shlink URL when settings are saved, not to add `<all_urls>`.
- Don't "fix" the missing `host_permissions` entry without revisiting this decision.
