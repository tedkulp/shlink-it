// Shape of what the options page saves to browser.storage.local.
// Keep these keys stable: existing installs depend on them.
export interface Settings {
  shlinkUrl?: string;
  apiKey?: string;
  defaultTags?: string;
}

const SETTINGS_KEYS = ['shlinkUrl', 'apiKey', 'defaultTags'] as const;

// Trims whitespace and trailing slashes off the Shlink server URL, so
// "https://s.example.com/ " and "https://s.example.com" build the same
// API URLs.
export const normalizeShlinkUrl = (raw: string): string =>
  raw.trim().replace(/\/+$/, '');

// Turns whatever is in storage into Settings: keeps only the known keys
// with string values, and normalizes the Shlink URL.
export const toSettings = (stored: Record<string, unknown>): Settings => {
  const settings: Settings = {};
  for (const key of SETTINGS_KEYS) {
    const value = stored[key];
    if (typeof value === 'string') settings[key] = value;
  }
  if (settings.shlinkUrl !== undefined) {
    settings.shlinkUrl = normalizeShlinkUrl(settings.shlinkUrl);
  }
  return settings;
};

// Reads the saved settings from browser.storage.local.
export const loadSettings = (): Promise<Settings> =>
  browser.storage.local.get([...SETTINGS_KEYS]).then(toSettings);
