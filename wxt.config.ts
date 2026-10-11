import { defineConfig } from 'wxt';

const icons = {
  16: '/images/shlink-16.png',
  48: '/images/shlink-48.png',
  64: '/images/shlink-64.png',
  96: '/images/shlink-96.png',
  128: '/images/shlink-128.png',
  256: '/images/shlink-256.png',
};

// See https://wxt.dev/api/config.html
export default defineConfig({
  // WXT defaults Firefox to MV2; ship MV3 everywhere.
  manifestVersion: 3,
  // Vite's <link rel="modulepreload" crossorigin> tags trigger Chrome's
  // "cross-world extension resource mismatch" warning on extension pages.
  // The chunks are local files, so preloading buys nothing.
  vite: () => ({
    build: { modulePreload: false },
  }),
  manifest: ({ browser }) => ({
    name: 'Shlink It!',
    description:
      'Use your self-hosted Shlink server to create a shortcut to the current URL.',
    // No host_permissions on purpose: see
    // docs/adr/0001-rely-on-shlink-cors-not-host-permissions.md
    permissions: ['storage', 'activeTab', 'notifications', 'clipboardWrite'],
    icons,
    action: {
      default_icon: icons,
    },
    ...(browser === 'firefox' && {
      browser_specific_settings: {
        gecko: {
          id: 'shlink-it@tedkulp.com',
        },
      },
    }),
  }),
});
