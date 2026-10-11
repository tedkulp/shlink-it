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
import type { Settings } from '@/utils/settings';
import {
  buildShortUrlBody,
  responseErrorMessage,
  type ShortUrlBody,
  type ShortUrlResult,
} from '@/utils/shlink';
import { initialTagsValue } from '@/utils/tags';

// Module scripts run after the document is parsed, so the DOM is ready here.
browser.storage.local.get().then((data: Settings) => {
  const createLink = (url: string, defaultTitle: string) => {
    console.debug(url);

    if (!data.apiKey) {
      return Promise.reject(
        new Error(
          'API Key is not set. Please use the Settings screen to configure the extension.',
        ),
      );
    }

    if (!data.shlinkUrl) {
      return Promise.reject(
        new Error(
          'Shlink URL is not set. Please use the Settings screen to configure the extension.',
        ),
      );
    }

    // A number input reports unparseable text (e.g. "abc") as "", so
    // check badInput to reject it instead of treating it as unlimited.
    const maxVisitsInput = byId<HTMLInputElement>('saveMaxVisits');
    let body: ShortUrlBody;
    try {
      body = buildShortUrlBody(url, defaultTitle, {
        title: byId<HTMLInputElement>('saveTitle').value,
        tags: byId<HTMLInputElement>('saveTags').value,
        customSlug: byId<HTMLInputElement>('saveSlug').value,
        maxVisits: maxVisitsInput.validity.badInput
          ? 'invalid'
          : maxVisitsInput.value,
      });
    } catch (e) {
      return Promise.reject(e);
    }

    const headers = new Headers();
    headers.append('accept', 'application/json');
    headers.append('Content-Type', 'application/json');
    headers.append('X-Api-Key', data.apiKey);

    console.debug('body', body);

    return fetch(
      new Request(`${data.shlinkUrl}/rest/v2/short-urls`, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      }),
    );
  };

  let saveUrl = '';
  let saveTitle = '';

  const successNotification = (result: ShortUrlResult) => {
    return browser.notifications.create({
      type: 'basic',
      title: 'Shlink created!',
      iconUrl: 'images/shlink-64.png',
      message: `${result.shortUrl} was copied to your clipboard.`,
    });
  };

  const failureNotification = (error: Error) => {
    return browser.notifications.create({
      type: 'basic',
      title: 'Failed to create Shlink!',
      iconUrl: 'images/shlink-64.png',
      message: error.message,
    });
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
    return Promise.reject(
      new Error(responseErrorMessage(fetchResponse.status)),
    );
  }

  const closeWindow = () => {
    const tm = setTimeout(() => {
      clearTimeout(tm);
      window.close();
    }, 500);
  };

  const handleButtonClick = (evt?: Event) => {
    if (evt) evt.preventDefault();

    createLink(saveUrl, saveTitle)
      .then(validateResponse)
      .then(copyLinkToClipboard)
      .then(successNotification)
      .then(closeWindow)
      .catch(failureNotification);
  };

  browser.tabs.query({ active: true, currentWindow: true }).then((tabData) => {
    console.debug('Tab Data', tabData);

    // Same as the original JS: these may be undefined on special pages.
    // biome-ignore lint/style/noNonNullAssertion: the active-tab query always returns the popup's tab.
    const tab = tabData[0]!;
    saveUrl = tab.url as string;
    saveTitle = tab.title as string;

    // jQuery's .val(undefined) cleared the field; keep that, not "undefined".
    byId<HTMLInputElement>('saveUrl').value = saveUrl ?? '';
    byId<HTMLInputElement>('saveTitle').value = saveTitle ?? '';
  });

  byId('shlinkUrl').textContent = data.shlinkUrl ?? '';
  byId<HTMLInputElement>('saveTags').value = initialTagsValue(data.defaultTags);
  byId('submitBtn').addEventListener('click', handleButtonClick);
});
