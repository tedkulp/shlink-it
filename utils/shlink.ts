import { type MaxVisitsField, parseMaxVisits } from './max-visits';
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
// falls back to the tab title; an empty slug or max visits means none.
// Throws if max visits is not a positive whole number.
export const buildShortUrlBody = (
  longUrl: string,
  tabTitle: string | undefined,
  form: ShortUrlForm,
): ShortUrlBody => ({
  longUrl,
  findIfExists: true,
  title: form.title || tabTitle,
  tags: parseTags(form.tags),
  customSlug: form.customSlug || null,
  maxVisits: parseMaxVisits(form.maxVisits),
});

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
