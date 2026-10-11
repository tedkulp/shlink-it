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
import $ from 'jquery';
import { parseMaxVisits } from '@/utils/max-visits';

interface Settings {
  shlinkUrl?: string;
  apiKey?: string;
  defaultTags?: string;
}

interface ShortUrlResult {
  shortUrl: string;
}

$(() => {
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

      const title = $<HTMLInputElement>('#saveTitle').val() || defaultTitle;
      const tags = ($<HTMLInputElement>('#saveTags').val() || '')
        .split(' ')
        .filter((s) => s && s !== '');
      const customSlug = $<HTMLInputElement>('#saveSlug').val() || null;
      // A number input reports unparseable text (e.g. "abc") as "", so
      // check badInput to reject it instead of treating it as unlimited.
      const maxVisitsInput = $<HTMLInputElement>('#saveMaxVisits')[0]!;
      let maxVisits: number | null;
      try {
        maxVisits = parseMaxVisits(
          maxVisitsInput.validity.badInput ? 'invalid' : maxVisitsInput.value,
        );
      } catch (e) {
        return Promise.reject(e);
      }

      console.debug('tags', tags);

      const headers = new Headers();
      headers.append('accept', 'application/json');
      headers.append('Content-Type', 'application/json');
      headers.append('X-Api-Key', data.apiKey);

      const options = {
        longUrl: url,
        findIfExists: true,
        title,
        tags,
        customSlug,
        maxVisits,
      };

      console.debug('options', options);

      return fetch(
        new Request(`${data.shlinkUrl}/rest/v2/short-urls`, {
          method: 'POST',
          headers,
          body: JSON.stringify(options),
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

    function validateResponse(
      fetchResponse: Response,
    ): Promise<ShortUrlResult> {
      if (fetchResponse.ok) {
        return fetchResponse.json();
      } else if (fetchResponse.status >= 400 && fetchResponse.status < 500) {
        return Promise.reject(
          new Error(
            `Got error code ${fetchResponse.status}. ` +
              "Please check if you've configured the Shlink extension correctly.",
          ),
        );
      } else if (fetchResponse.status >= 500 && fetchResponse.status < 600) {
        return Promise.reject(
          new Error(
            `Got error code ${fetchResponse.status}. ` +
              'Please check if the Shlink server is properly configured.',
          ),
        );
      } else {
        return Promise.reject(
          new Error(
            `Got unknown error code ${fetchResponse.status}. Please try again later.`,
          ),
        );
      }
    }

    const closeWindow = () => {
      const tm = setTimeout(() => {
        clearTimeout(tm);
        window.close();
      }, 500);
    };

    const handleButtonClick = (evt?: JQuery.Event) => {
      if (evt) evt.preventDefault();

      createLink(saveUrl, saveTitle)
        .then(validateResponse)
        .then(copyLinkToClipboard)
        .then(successNotification)
        .then(closeWindow)
        .catch(failureNotification);
    };

    browser.tabs
      .query({ active: true, currentWindow: true })
      .then((tabData) => {
        console.debug('Tab Data', tabData);

        // Same as the original JS: these may be undefined on special pages.
        const tab = tabData[0]!;
        saveUrl = tab.url as string;
        saveTitle = tab.title as string;

        $('#saveUrl').val(saveUrl);
        $('#saveTitle').val(saveTitle);
      });

    $('#shlinkUrl').text(data.shlinkUrl as string);
    $('#saveTags').val(data.defaultTags ? data.defaultTags + ' ' : '');
    $('#submitBtn').on('click', handleButtonClick);
  });
});
