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
  domain?: string;
}

// What Shlink returns for a created (or found) short URL.
export interface ShortUrlResult {
  shortUrl: string;
}

// Builds the create-short-URL request body from the popup form. The title
// falls back to the tab title; the slug is trimmed, and an empty slug or
// max visits means none. Throws if there is no long URL (e.g. the tab
// data hasn't loaded or the page has no URL) or max visits is not a
// positive whole number. The saved domain is sent only when set, so
// Shlink otherwise uses its default domain.
export const buildShortUrlBody = (
  longUrl: string,
  tabTitle: string | undefined,
  form: ShortUrlForm,
  domain?: string,
): ShortUrlBody => {
  if (longUrl.trim() === '') {
    throw new Error('There is no URL to shorten for this tab.');
  }
  const body: ShortUrlBody = {
    longUrl,
    findIfExists: true,
    title: form.title || tabTitle,
    tags: parseTags(form.tags),
    customSlug: form.customSlug.trim() || null,
    maxVisits: parseMaxVisits(form.maxVisits),
  };
  const trimmedDomain = domain?.trim();
  if (trimmedDomain) body.domain = trimmedDomain;
  return body;
};

// URL of the create-short-URL endpoint (POST /rest/v2/short-urls) on the
// given Shlink server.
export const shortUrlsEndpoint = (shlinkUrl: string): string =>
  `${normalizeShlinkUrl(shlinkUrl)}/rest/v2/short-urls`;

// URL of the list-domains endpoint (GET /rest/v2/domains) on the given
// Shlink server.
export const domainsEndpoint = (shlinkUrl: string): string =>
  `${normalizeShlinkUrl(shlinkUrl)}/rest/v2/domains`;

// A domain configured on the Shlink server.
export interface DomainOption {
  domain: string;
  isDefault: boolean;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

// Turns the list-domains JSON ({ domains: { data: [...] } }) into domain
// options. Skips entries without a domain name; throws if the response
// doesn't have that shape at all.
export const parseDomains = (json: unknown): DomainOption[] => {
  const data =
    isRecord(json) && isRecord(json.domains) ? json.domains.data : undefined;
  if (!Array.isArray(data)) {
    throw new Error(
      'Unexpected response from the Shlink server when listing domains.',
    );
  }
  return data.flatMap((entry: unknown) =>
    isRecord(entry) && typeof entry.domain === 'string' && entry.domain !== ''
      ? [{ domain: entry.domain, isDefault: entry.isDefault === true }]
      : [],
  );
};

// An <option> for the options page's Domain dropdown.
export interface SelectOption {
  value: string;
  label: string;
}

// Options for the Domain dropdown: "Server default" (empty value) first,
// then the server's non-default domains. A selected domain the server
// didn't list (e.g. the list failed to load) is kept, so it isn't lost.
export const domainSelectOptions = (
  domains: DomainOption[],
  selected: string,
): SelectOption[] => {
  const defaultDomain = domains.find((d) => d.isDefault)?.domain;
  const options: SelectOption[] = [
    {
      value: '',
      label: defaultDomain
        ? `Server default (${defaultDomain})`
        : 'Server default',
    },
    ...domains
      .filter((d) => !d.isDefault)
      .map((d) => ({ value: d.domain, label: d.domain })),
  ];
  if (selected !== '' && !options.some((o) => o.value === selected)) {
    options.push({ value: selected, label: selected });
  }
  return options;
};

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
