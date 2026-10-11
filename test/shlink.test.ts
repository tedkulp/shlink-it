import { describe, expect, it } from 'vitest';
import {
  buildShortUrlBody,
  domainSelectOptions,
  domainsEndpoint,
  parseDomains,
  responseErrorMessage,
  shortUrlsEndpoint,
} from '@/utils/shlink';

const form = {
  title: '',
  tags: '',
  customSlug: '',
  maxVisits: { value: '', badInput: false },
};

describe('buildShortUrlBody', () => {
  it('always asks Shlink to reuse an existing short URL', () => {
    const body = buildShortUrlBody('https://example.com/', 'Tab', form);
    expect(body).toEqual({
      longUrl: 'https://example.com/',
      findIfExists: true,
      title: 'Tab',
      tags: [],
      customSlug: null,
      maxVisits: null,
    });
  });

  it('uses the typed title over the tab title', () => {
    const body = buildShortUrlBody('https://example.com/', 'Tab', {
      ...form,
      title: 'Typed',
    });
    expect(body.title).toBe('Typed');
  });

  it('falls back to the tab title when the title field is empty', () => {
    expect(buildShortUrlBody('u', 'Tab', form).title).toBe('Tab');
  });

  it('leaves the title undefined when both are missing', () => {
    // JSON.stringify then omits it, so Shlink picks its own title.
    expect(buildShortUrlBody('u', undefined, form).title).toBeUndefined();
  });

  it('parses space-separated tags', () => {
    const body = buildShortUrlBody('u', 'Tab', { ...form, tags: 'a  b ' });
    expect(body.tags).toEqual(['a', 'b']);
  });

  it('sends the custom slug as typed, or null when empty', () => {
    expect(
      buildShortUrlBody('u', 'Tab', { ...form, customSlug: 'my-slug' })
        .customSlug,
    ).toBe('my-slug');
    expect(buildShortUrlBody('u', 'Tab', form).customSlug).toBeNull();
  });

  it('trims the custom slug', () => {
    expect(
      buildShortUrlBody('u', 'Tab', { ...form, customSlug: '  my-slug \t' })
        .customSlug,
    ).toBe('my-slug');
  });

  it('treats a whitespace-only custom slug as none', () => {
    expect(
      buildShortUrlBody('u', 'Tab', { ...form, customSlug: '   ' }).customSlug,
    ).toBeNull();
  });

  it.each(['', '   '])('rejects an empty long URL (%j)', (longUrl) => {
    expect(() => buildShortUrlBody(longUrl, 'Tab', form)).toThrow(
      'There is no URL to shorten for this tab.',
    );
  });

  it('sends max visits as a number', () => {
    const body = buildShortUrlBody('u', 'Tab', {
      ...form,
      maxVisits: { value: '7', badInput: false },
    });
    expect(body.maxVisits).toBe(7);
  });

  it('throws on invalid max visits', () => {
    expect(() =>
      buildShortUrlBody('u', 'Tab', {
        ...form,
        maxVisits: { value: 'abc', badInput: false },
      }),
    ).toThrow(/positive whole number/);
  });

  it('sends the saved domain, trimmed', () => {
    expect(buildShortUrlBody('u', 'Tab', form, ' s2.example.com ').domain).toBe(
      's2.example.com',
    );
  });

  it.each([undefined, '', '   '])(
    'leaves domain out when the saved domain is %j',
    (domain) => {
      const body = buildShortUrlBody('u', 'Tab', form, domain);
      expect(body).not.toHaveProperty('domain');
    },
  );

  it('throws when the max visits input reports bad input', () => {
    expect(() =>
      buildShortUrlBody('u', 'Tab', {
        ...form,
        maxVisits: { value: '', badInput: true },
      }),
    ).toThrow(/positive whole number/);
  });
});

describe('responseErrorMessage', () => {
  it.each([400, 401, 403, 404, 499])(
    'blames the extension config for %i',
    (status) => {
      expect(responseErrorMessage(status)).toBe(
        `Got error code ${status}. ` +
          "Please check if you've configured the Shlink extension correctly.",
      );
    },
  );

  it.each([500, 502, 599])('blames the Shlink server for %i', (status) => {
    expect(responseErrorMessage(status)).toBe(
      `Got error code ${status}. ` +
        'Please check if the Shlink server is properly configured.',
    );
  });

  it.each([0, 101, 302, 399, 600])(
    'reports %i as an unknown error',
    (status) => {
      expect(responseErrorMessage(status)).toBe(
        `Got unknown error code ${status}. Please try again later.`,
      );
    },
  );
});

describe('shortUrlsEndpoint', () => {
  it.each([
    'https://s.example.com',
    'https://s.example.com/',
    ' https://s.example.com// ',
  ])('builds the create-short-URL endpoint from %j', (shlinkUrl) => {
    expect(shortUrlsEndpoint(shlinkUrl)).toBe(
      'https://s.example.com/rest/v2/short-urls',
    );
  });

  it('keeps a path prefix', () => {
    expect(shortUrlsEndpoint('https://example.com/shlink/')).toBe(
      'https://example.com/shlink/rest/v2/short-urls',
    );
  });
});

describe('domainsEndpoint', () => {
  it.each([
    'https://s.example.com',
    'https://s.example.com/',
    ' https://s.example.com// ',
  ])('builds the list-domains endpoint from %j', (shlinkUrl) => {
    expect(domainsEndpoint(shlinkUrl)).toBe(
      'https://s.example.com/rest/v2/domains',
    );
  });

  it('keeps a path prefix', () => {
    expect(domainsEndpoint('https://example.com/shlink/')).toBe(
      'https://example.com/shlink/rest/v2/domains',
    );
  });
});

describe('parseDomains', () => {
  it('returns the domains from a list-domains response', () => {
    expect(
      parseDomains({
        domains: {
          data: [
            { domain: 's.example.com', isDefault: true, redirects: {} },
            { domain: 's2.example.com', isDefault: false, redirects: {} },
          ],
          defaultRedirects: {},
        },
      }),
    ).toEqual([
      { domain: 's.example.com', isDefault: true },
      { domain: 's2.example.com', isDefault: false },
    ]);
  });

  it('returns an empty list when the server has no domains', () => {
    expect(parseDomains({ domains: { data: [] } })).toEqual([]);
  });

  it('skips malformed entries', () => {
    expect(
      parseDomains({
        domains: {
          data: [
            null,
            'x',
            { domain: 42 },
            { domain: '' },
            { isDefault: true },
            { domain: 's2.example.com' },
          ],
        },
      }),
    ).toEqual([{ domain: 's2.example.com', isDefault: false }]);
  });

  it.each([
    null,
    'nope',
    [],
    {},
    { domains: null },
    { domains: {} },
    { domains: { data: 'x' } },
  ])('rejects a malformed response (%j)', (json) => {
    expect(() => parseDomains(json)).toThrow(
      'Unexpected response from the Shlink server when listing domains.',
    );
  });
});

describe('domainSelectOptions', () => {
  const domains = [
    { domain: 's.example.com', isDefault: true },
    { domain: 's2.example.com', isDefault: false },
    { domain: 's3.example.com', isDefault: false },
  ];

  it('offers the server default first, then the non-default domains', () => {
    expect(domainSelectOptions(domains, '')).toEqual([
      { value: '', label: 'Server default (s.example.com)' },
      { value: 's2.example.com', label: 's2.example.com' },
      { value: 's3.example.com', label: 's3.example.com' },
    ]);
  });

  it('labels the server default plainly when the default is unknown', () => {
    expect(domainSelectOptions([], '')).toEqual([
      { value: '', label: 'Server default' },
    ]);
  });

  it('keeps a selected domain the server did not list', () => {
    expect(domainSelectOptions([], 'old.example.com')).toEqual([
      { value: '', label: 'Server default' },
      { value: 'old.example.com', label: 'old.example.com' },
    ]);
  });

  it('does not repeat a selected domain that is listed', () => {
    expect(domainSelectOptions(domains, 's2.example.com')).toHaveLength(3);
  });
});
