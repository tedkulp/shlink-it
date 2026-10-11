// (c) 2022 Ted Kulp - @tedkulp
//
// I'm not going to lie...  This code was heavily inspired by
// https://github.com/edward-shen/shlink and some things were copied.
//
// I originally wanted to just do a PR, but I realized it would be
// good experience to write a Chrome Extension in full. It was also
// different enough that I felt that it might not be accepted as a
// PR.

import 'bootstrap/dist/css/bootstrap.min.css';
import './style.css';
import { byId } from '@/utils/dom';
import { loadSettings, type Settings } from '@/utils/settings';
import {
  buildShortUrlBody,
  responseErrorMessage,
  type ShortUrlResult,
  shortUrlsEndpoint,
} from '@/utils/shlink';
import { initialTagsValue } from '@/utils/tags';

// The active tab's URL and title. Either may be empty, e.g. on special
// pages or if the query finds no tab.
interface TabInfo {
  url: string;
  title: string;
}

// Module scripts run after the document is parsed, so the DOM is ready here.
// Take over form submission straight away: until the handler below is
// attached, pressing Enter would natively submit (reload) the popup.
const form = byId<HTMLFormElement>('saveForm');

const settingsReady = loadSettings();

const tabReady: Promise<TabInfo> = browser.tabs
  .query({ active: true, currentWindow: true })
  .then((tabData) => {
    console.debug('Tab Data', tabData);
    const tab = tabData[0];
    return { url: tab?.url ?? '', title: tab?.title ?? '' };
  });

// Async, so anything that throws in here (a missing element, invalid
// max visits, unset settings) rejects and reaches failureNotification.
const createLink = async (settings: Settings, tab: TabInfo) => {
  console.debug(tab.url);

  if (!settings.apiKey) {
    throw new Error(
      'API Key is not set. Please use the Settings screen to configure the extension.',
    );
  }

  if (!settings.shlinkUrl) {
    throw new Error(
      'Shlink URL is not set. Please use the Settings screen to configure the extension.',
    );
  }

  const maxVisitsInput = byId<HTMLInputElement>('saveMaxVisits');
  const body = buildShortUrlBody(tab.url, tab.title || undefined, {
    title: byId<HTMLInputElement>('saveTitle').value,
    tags: byId<HTMLInputElement>('saveTags').value,
    customSlug: byId<HTMLInputElement>('saveSlug').value,
    maxVisits: {
      value: maxVisitsInput.value,
      badInput: maxVisitsInput.validity.badInput,
    },
  });

  const headers = new Headers();
  headers.append('accept', 'application/json');
  headers.append('Content-Type', 'application/json');
  headers.append('X-Api-Key', settings.apiKey);

  console.debug('body', body);

  return fetch(
    new Request(shortUrlsEndpoint(settings.shlinkUrl), {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    }),
  );
};

const successNotification = (result: ShortUrlResult) => {
  return browser.notifications.create({
    type: 'basic',
    title: 'Shlink created!',
    iconUrl: 'images/shlink-64.png',
    message: `${result.shortUrl} was copied to your clipboard.`,
  });
};

const failureNotification = (error: unknown) => {
  return browser.notifications
    .create({
      type: 'basic',
      title: 'Failed to create Shlink!',
      iconUrl: 'images/shlink-64.png',
      message: error instanceof Error ? error.message : String(error),
    })
    .catch((e: unknown) => console.error(error, e));
};

function copyLinkToClipboard(result: ShortUrlResult) {
  return navigator.clipboard.writeText(result.shortUrl).then(
    () => Promise.resolve(result),
    (e: Error) => {
      console.error(e);
      return Promise.reject(
        new Error(`Failed to copy to clipboard. ${e.message}`),
      );
    },
  );
}

function validateResponse(fetchResponse: Response): Promise<ShortUrlResult> {
  if (fetchResponse.ok) {
    return fetchResponse.json();
  }
  return Promise.reject(new Error(responseErrorMessage(fetchResponse.status)));
}

const closeWindow = () => {
  const tm = setTimeout(() => {
    clearTimeout(tm);
    window.close();
  }, 500);
};

// Enter in a field and the submit button both land here. Waits for the
// settings and tab data, so an early submit never sends an empty URL.
const handleSubmit = (evt: Event) => {
  evt.preventDefault();

  Promise.all([settingsReady, tabReady])
    .then(([settings, tab]) => createLink(settings, tab))
    .then(validateResponse)
    .then(copyLinkToClipboard)
    .then(successNotification)
    .then(closeWindow)
    .catch(failureNotification);
};

form.addEventListener('submit', handleSubmit);

settingsReady
  .then((settings) => {
    byId('shlinkUrl').textContent = settings.shlinkUrl ?? '';
    byId<HTMLInputElement>('saveTags').value = initialTagsValue(
      settings.defaultTags,
    );
  })
  .catch((e: unknown) => console.error('Could not load settings', e));

tabReady
  .then((tab) => {
    byId<HTMLInputElement>('saveUrl').value = tab.url;
    byId<HTMLInputElement>('saveTitle').value = tab.title;
  })
  .catch((e: unknown) => console.error('Could not read the active tab', e));
