// (c) 2022 Ted Kulp - @tedkulp

import 'bootstrap/dist/css/bootstrap.min.css';
import $ from 'jquery';
import type { Settings } from '@/utils/settings';

$(() => {
  const shlinkUrl = $<HTMLInputElement>('#shlinkUrl');
  const apiKey = $<HTMLInputElement>('#apiKey');
  const defaultTags = $<HTMLInputElement>('#defaultTags');
  const saveStatus = $('#saveStatus');
  let hideTimer: ReturnType<typeof setTimeout> | undefined;

  const showStatus = (ok: boolean, message: string) => {
    clearTimeout(hideTimer);
    saveStatus
      .removeClass('d-none alert-success alert-danger')
      .addClass(ok ? 'alert-success' : 'alert-danger')
      .text(message);
    if (ok) hideTimer = setTimeout(() => saveStatus.addClass('d-none'), 3000);
  };

  const handleButtonClick = (evt?: JQuery.Event) => {
    if (evt) evt.preventDefault();

    browser.storage.local
      .set({
        shlinkUrl: shlinkUrl.val(),
        apiKey: apiKey.val(),
        defaultTags: defaultTags.val(),
      })
      .then(() => showStatus(true, 'Settings saved.'))
      .catch((err: unknown) =>
        showStatus(
          false,
          `Could not save settings: ${(err as Error | undefined)?.message || err}`,
        ),
      );
  };

  browser.storage.local.get().then((data: Settings) => {
    console.debug(data);
    shlinkUrl.val(data.shlinkUrl || '');
    apiKey.val(data.apiKey || '');
    defaultTags.val(data.defaultTags || '');
  });

  $('#submitBtn').on('click', handleButtonClick);
});
