import { type MaxVisitsField, parseMaxVisits } from './max-visits';
import { normalizeShlinkUrl } from './settings';
import { parseTags } from './tags';

// Raw values of the popup's form fields.
export interface ShortUrlForm {
  title: string;
  tags: string;
  customSlug: string;
  maxVisits: MaxVisitsField;
}

// Body of POST /rest/v2/short-urls.
export interface ShortUrlBody {
  longUrl: string;
  findIfExists: true;
  title: string | undefined;
  tags: string[];
  customSlug: string | null;
  maxVisits: number | null;
}

// What Shlink returns for a created (or found) short URL.
export interface ShortUrlResult {
  shortUrl: string;
}

// Builds the create-short-URL request body from the popup form. The title
// falls back to the tab title; the slug is trimmed, and an empty slug or
// max visits means none. Throws if there is no long URL (e.g. the tab
// data hasn't loaded or the page has no URL) or max visits is not a
// positive whole number.
export const buildShortUrlBody = (
  longUrl: string,
  tabTitle: string | undefined,
  form: ShortUrlForm,
): ShortUrlBody => {
  if (longUrl.trim() === '') {
    throw new Error('There is no URL to shorten for this tab.');
  }
  return {
    longUrl,
    findIfExists: true,
    title: form.title || tabTitle,
    tags: parseTags(form.tags),
    customSlug: form.customSlug.trim() || null,
    maxVisits: parseMaxVisits(form.maxVisits),
  };
};

// URL of the create-short-URL endpoint (POST /rest/v2/short-urls) on the
// given Shlink server.
export const shortUrlsEndpoint = (shlinkUrl: string): string =>
  `${normalizeShlinkUrl(shlinkUrl)}/rest/v2/short-urls`;

// User-facing message for a non-OK HTTP status from Shlink.
export const responseErrorMessage = (status: number): string => {
  if (status >= 400 && status < 500) {
    return (
      `Got error code ${status}. ` +
      "Please check if you've configured the Shlink extension correctly."
    );
  }
  if (status >= 500 && status < 600) {
    return (
      `Got error code ${status}. ` +
      'Please check if the Shlink server is properly configured.'
    );
  }
  return `Got unknown error code ${status}. Please try again later.`;
};
