// (c) 2022 Ted Kulp - @tedkulp

import 'bootstrap/dist/css/bootstrap.min.css';
import { byId } from '@/utils/dom';
import { loadSettings, normalizeShlinkUrl } from '@/utils/settings';

// Module scripts run after the document is parsed, so the DOM is ready here.
const shlinkUrl = byId<HTMLInputElement>('shlinkUrl');
const apiKey = byId<HTMLInputElement>('apiKey');
const defaultTags = byId<HTMLInputElement>('defaultTags');
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

const handleButtonClick = (evt?: Event) => {
  if (evt) evt.preventDefault();

  // Show what gets saved, so a trailing slash or space visibly goes away.
  shlinkUrl.value = normalizeShlinkUrl(shlinkUrl.value);

  browser.storage.local
    .set({
      shlinkUrl: shlinkUrl.value,
      apiKey: apiKey.value,
      defaultTags: defaultTags.value,
    })
    .then(() => showStatus(true, 'Settings saved.'))
    .catch((err: unknown) =>
      showStatus(
        false,
        `Could not save settings: ${(err as Error | undefined)?.message || err}`,
      ),
    );
};

loadSettings()
  .then((data) => {
    console.debug(data);
    shlinkUrl.value = data.shlinkUrl || '';
    apiKey.value = data.apiKey || '';
    defaultTags.value = data.defaultTags || '';
  })
  .catch((err: unknown) =>
    showStatus(
      false,
      `Could not load settings: ${(err as Error | undefined)?.message || err}`,
    ),
  );

byId('submitBtn').addEventListener('click', handleButtonClick);
