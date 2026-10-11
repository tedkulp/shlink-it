import { beforeEach, describe, expect, it } from 'vitest';
import { fakeBrowser } from 'wxt/testing/fake-browser';
import { loadSettings, normalizeShlinkUrl, toSettings } from '@/utils/settings';

describe('normalizeShlinkUrl', () => {
  it.each([
    ['https://s.example.com', 'https://s.example.com'],
    ['https://s.example.com/', 'https://s.example.com'],
    ['https://s.example.com///', 'https://s.example.com'],
    ['  https://s.example.com/ \n', 'https://s.example.com'],
    ['https://example.com/shlink/', 'https://example.com/shlink'],
    ['', ''],
    ['  / ', ''],
  ])('normalizes %j to %j', (raw, expected) => {
    expect(normalizeShlinkUrl(raw)).toBe(expected);
  });
});

describe('toSettings', () => {
  it('keeps the stored string settings', () => {
    expect(
      toSettings({
        shlinkUrl: 'https://s.example.com',
        apiKey: 'key',
        defaultTags: 'a b',
        domain: 's2.example.com',
      }),
    ).toEqual({
      shlinkUrl: 'https://s.example.com',
      apiKey: 'key',
      defaultTags: 'a b',
      domain: 's2.example.com',
    });
  });

  it('normalizes the Shlink URL', () => {
    expect(
      toSettings({ shlinkUrl: ' https://s.example.com/ ' }).shlinkUrl,
    ).toBe('https://s.example.com');
  });

  it('drops missing and non-string values', () => {
    expect(
      toSettings({
        shlinkUrl: 42,
        apiKey: null,
        defaultTags: ['a'],
        domain: {},
      }),
    ).toEqual({});
    expect(toSettings({})).toEqual({});
  });

  it('ignores unrelated keys', () => {
    expect(toSettings({ apiKey: 'key', other: 'x' })).toEqual({
      apiKey: 'key',
    });
  });
});

describe('loadSettings', () => {
  beforeEach(() => {
    fakeBrowser.reset();
  });

  it('reads the settings saved by the options page', async () => {
    await fakeBrowser.storage.local.set({
      shlinkUrl: 'https://s.example.com/',
      apiKey: 'key',
      defaultTags: 'work',
      domain: 's2.example.com',
    });
    await expect(loadSettings()).resolves.toEqual({
      shlinkUrl: 'https://s.example.com',
      apiKey: 'key',
      defaultTags: 'work',
      domain: 's2.example.com',
    });
  });

  it('returns no settings before anything was saved', async () => {
    await expect(loadSettings()).resolves.toEqual({});
  });
});
