// (c) 2022 Ted Kulp - @tedkulp

import 'bootstrap/dist/css/bootstrap.min.css';
import { byId } from '@/utils/dom';
import { loadSettings, normalizeShlinkUrl } from '@/utils/settings';
import {
  type DomainOption,
  domainSelectOptions,
  domainsEndpoint,
  parseDomains,
  responseErrorMessage,
} from '@/utils/shlink';

// Module scripts run after the document is parsed, so the DOM is ready here.
const shlinkUrl = byId<HTMLInputElement>('shlinkUrl');
const apiKey = byId<HTMLInputElement>('apiKey');
const defaultTags = byId<HTMLInputElement>('defaultTags');
const domain = byId<HTMLSelectElement>('domain');
const domainStatus = byId('domainStatus');
const saveStatus = byId('saveStatus');
let hideTimer: ReturnType<typeof setTimeout> | undefined;

const showStatus = (ok: boolean, message: string) => {
  clearTimeout(hideTimer);
  saveStatus.classList.remove('d-none', 'alert-success', 'alert-danger');
  saveStatus.classList.add(ok ? 'alert-success' : 'alert-danger');
  saveStatus.textContent = message;
  if (ok) {
    hideTimer = setTimeout(() => saveStatus.classList.add('d-none'), 3000);
  }
};

const errorMessage = (err: unknown) =>
  (err as Error | undefined)?.message || String(err);

// Rebuilds the Domain dropdown, keeping `selected` chosen.
const renderDomains = (domains: DomainOption[], selected: string) => {
  domain.replaceChildren(
    ...domainSelectOptions(domains, selected).map(
      ({ value, label }) => new Option(label, value),
    ),
  );
  domain.value = selected;
};

const showDomainError = (message: string) => {
  domainStatus.textContent = message;
  domainStatus.classList.toggle('d-none', message === '');
};

// Bumped on every load, so a slow response can't overwrite a newer one.
let domainsRequest = 0;

// Fetches the server's domains into the dropdown. On failure the dropdown
// keeps "Server default" and the current selection, and shows an error.
const loadDomains = async () => {
  const request = ++domainsRequest;
  const url = normalizeShlinkUrl(shlinkUrl.value);
  const key = apiKey.value.trim();
  let domains: DomainOption[] = [];
  let error = '';
  if (!url || !key) {
    error = 'Enter the Shlink URL and API key to load the domain list.';
  } else {
    try {
      const response = await fetch(domainsEndpoint(url), {
        headers: { accept: 'application/json', 'X-Api-Key': key },
      });
      if (!response.ok) throw new Error(responseErrorMessage(response.status));
      domains = parseDomains(await response.json());
    } catch (err) {
      error = `Could not load domains: ${errorMessage(err)}`;
    }
  }
  if (request !== domainsRequest) return;
  renderDomains(domains, domain.value);
  showDomainError(error);
};

const handleButtonClick = (evt?: Event) => {
  if (evt) evt.preventDefault();

  // Show what gets saved, so a trailing slash or space visibly goes away.
  shlinkUrl.value = normalizeShlinkUrl(shlinkUrl.value);

  browser.storage.local
    .set({
      shlinkUrl: shlinkUrl.value,
      apiKey: apiKey.value,
      defaultTags: defaultTags.value,
      domain: domain.value,
    })
    .then(() => showStatus(true, 'Settings saved.'))
    .catch((err: unknown) =>
      showStatus(false, `Could not save settings: ${errorMessage(err)}`),
    );
};

loadSettings()
  .then((data) => {
    console.debug(data);
    shlinkUrl.value = data.shlinkUrl || '';
    apiKey.value = data.apiKey || '';
    defaultTags.value = data.defaultTags || '';
    renderDomains([], data.domain || '');
    if (data.shlinkUrl && data.apiKey) loadDomains();
  })
  .catch((err: unknown) =>
    showStatus(false, `Could not load settings: ${errorMessage(err)}`),
  );

shlinkUrl.addEventListener('change', loadDomains);
apiKey.addEventListener('change', loadDomains);
byId('submitBtn').addEventListener('click', handleButtonClick);
