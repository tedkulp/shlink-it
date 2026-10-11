// Shape of what the options page saves to browser.storage.local.
// Keep these keys stable: existing installs depend on them.
export interface Settings {
  shlinkUrl?: string;
  apiKey?: string;
  defaultTags?: string;
}
