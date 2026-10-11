// (c) 2022 Ted Kulp - @tedkulp

import 'bootstrap/dist/css/bootstrap.min.css';
import $ from 'jquery';

$(() => {
  const shlinkUrl = $<HTMLInputElement>('#shlinkUrl');
  const apiKey = $<HTMLInputElement>('#apiKey');
  const defaultTags = $<HTMLInputElement>('#defaultTags');

  const handleButtonClick = (evt?: JQuery.Event) => {
    if (evt) evt.preventDefault();

    browser.storage.local.set({
      shlinkUrl: shlinkUrl.val(),
      apiKey: apiKey.val(),
      defaultTags: defaultTags.val(),
    });
  };

  browser.storage.local.get().then((data) => {
    console.debug(data);
    shlinkUrl.val((data.shlinkUrl as string | undefined) || '');
    apiKey.val((data.apiKey as string | undefined) || '');
    defaultTags.val((data.defaultTags as string | undefined) || '');
  });

  $('#submitBtn').on('click', handleButtonClick);
});
