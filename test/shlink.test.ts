import { describe, expect, it } from 'vitest';
import { buildShortUrlBody, responseErrorMessage } from '@/utils/shlink';

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
